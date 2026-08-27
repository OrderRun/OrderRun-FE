import { adminLogin } from '../../data/api/adminApi'
import { ApiError } from '../../data/api/apiError'
import { logout, refreshAccessToken } from '../../data/api/authApi'
import { setAuthTokenProvider, setAuthTokenRefresher } from '../../data/api/httpClient'
import type { SignInResult } from './adminSessionContext'
import type { StoredAdminSession } from './adminSessionStorage'
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './adminSessionStorage'

/**
 * 관리자 세션과 발급 토큰을 소유하는 단 하나의 지점이다.
 *
 * 컴포넌트가 아니라 모듈 스코프에 두는 이유는 등록 타이밍이다. effect로 등록하면
 * 자식 컴포넌트의 effect가 먼저 돌아 첫 요청이 Authorization 없이 나간다. import
 * 시점 등록은 어떤 렌더보다 앞서고 렌더 단계 부작용도 아니다.
 *
 * 토큰은 값이 아니라 "읽는 콜백"으로만 data 계층에 넘긴다(Presentation → Data,
 * 허용 방향). 토큰 값은 이 모듈 밖으로 export되지 않으며 state·렌더·로그·에러
 * 메시지에도 실리지 않는다.
 */

/** 만료 직전 토큰으로 요청을 보내 401을 맞지 않도록 두는 여유. */
const EXPIRY_SKEW_MS = 10_000

/** 화면이 보는 값. 토큰은 포함하지 않는다. */
export interface AdminSessionSnapshot {
  adminName: string | null
  /** 세션이 만료로 끊긴 시각(epoch ms). 사용자 로그아웃이면 `null`이다. */
  expiredAt: number | null
}

let session: StoredAdminSession | null = readStoredSession()
let expiredAt: number | null = null
let snapshot: AdminSessionSnapshot = {
  adminName: session?.adminName ?? null,
  expiredAt: null,
}

const listeners = new Set<() => void>()

/**
 * 스냅샷은 바뀔 때만 새로 만든다. `useSyncExternalStore`는 매 렌더마다
 * `getSnapshot()`을 부르고 참조가 달라지면 무한 렌더로 간주하기 때문이다.
 */
function emit(): void {
  snapshot = { adminName: session?.adminName ?? null, expiredAt }
  for (const listener of listeners) {
    listener()
  }
}

export function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getSnapshot(): AdminSessionSnapshot {
  return snapshot
}

function clearSessionRecord(): void {
  session = null
  clearStoredSession()
}

/**
 * 만료 판정. 모든 요청 경로가 같은 기준을 읽도록 이 함수 하나만 쓴다.
 */
function isAccessTokenUsable(record: StoredAdminSession): boolean {
  return Date.now() < record.accessTokenExpiresAt - EXPIRY_SKEW_MS
}

/**
 * 요청에 붙일 액세스 토큰. 만료됐으면 "토큰 없음"과 같게 취급해 헤더를 붙이지 않는다.
 */
function currentAccessToken(): string | null {
  if (session === null || !isAccessTokenUsable(session)) {
    return null
  }
  return session.accessToken
}

/**
 * 진행 중인 재발급. 동시에 401을 맞은 요청들이 각자 부르더라도 실제
 * `/v1/auth/refresh` 호출은 1건으로 합쳐진다.
 */
let inFlightRefresh: Promise<string | null> | null = null

function refreshAccessTokenOnce(): Promise<string | null> {
  if (inFlightRefresh !== null) {
    return inFlightRefresh
  }

  const refreshToken = session?.refreshToken ?? null
  if (refreshToken === null) {
    return Promise.resolve(null)
  }

  const pending = refreshAccessToken({ refreshToken })
    .then((issued) => {
      // 대기 중에 로그아웃했으면 되살리지 않는다.
      if (session === null) {
        return null
      }
      // 재발급 응답에는 refreshToken이 없다. accessToken과 만료 시각만 갱신하고
      // refreshToken·adminName·userId는 그대로 둔다.
      session = {
        ...session,
        accessToken: issued.accessToken,
        accessTokenExpiresAt: Date.now() + issued.expiresIn,
      }
      writeStoredSession(session)
      return session.accessToken
    })
    .catch(() => {
      // 401·404·네트워크 실패를 가리지 않고 만료로 처리한다. 토큰이 아직
      // 유효한지 추측하지 않는다.
      expireSession()
      return null
    })
    .finally(() => {
      inFlightRefresh = null
    })

  inFlightRefresh = pending
  return pending
}

export async function signIn(username: string, password: string): Promise<SignInResult> {
  try {
    const token = await adminLogin({ username, password })
    session = {
      // 스펙의 AuthTokenResponse에는 표시용 이름 필드가 없다. 서버값을
      // 추측하지 않고 입력한 아이디를 그대로 표시 이름으로 쓴다.
      adminName: username,
      userId: token.userId,
      accessToken: token.accessToken,
      refreshToken: token.refreshToken,
      accessTokenExpiresAt: Date.now() + token.expiresIn,
    }
    writeStoredSession(session)
    // 다시 로그인했으면 직전 만료 알림은 더 이상 유효하지 않다.
    expiredAt = null
    emit()
    return { ok: true }
  } catch (error) {
    if (error instanceof ApiError) {
      if (error.code === 'ADMIN_LOGIN_LOCKED' || error.status === 429) {
        return { ok: false, reason: 'locked' }
      }
      if (error.code === 'ADMIN_CREDENTIALS_INVALID' || error.status === 401) {
        return { ok: false, reason: 'credentials' }
      }
      if (error.status === null) {
        return { ok: false, reason: 'network' }
      }
    }
    return { ok: false, reason: 'server' }
  }
}

/**
 * 서버 폐기 요청에 실을 액세스 토큰. 이미 만료됐으면 폐기 전용으로 한 번 재발급한다 —
 * `/v1/auth/logout`은 Bearer가 필수라 만료 토큰이나 빈 헤더로 보내면 401로 거절되고
 * 서버의 refreshToken이 살아남는다(탭을 오래 방치한 뒤의 로그아웃이 정확히 이 경우다).
 * 재발급 결과는 저장하지 않는다: 로컬 세션은 이미 비웠고 이 토큰은 폐기 요청 한 건에만 쓴다.
 * store의 `refreshAccessTokenOnce`가 아니라 endpoint를 직접 부르는 이유도 같다 —
 * 이 경로는 비워진 store 상태를 읽지도, 만료 알림을 세우지도 않아야 한다.
 */
async function accessTokenForRevoke(record: StoredAdminSession): Promise<string | null> {
  if (isAccessTokenUsable(record)) {
    return record.accessToken
  }
  try {
    const issued = await refreshAccessToken({ refreshToken: record.refreshToken })
    return issued.accessToken
  } catch {
    return null
  }
}

async function revokeSessionOnServer(record: StoredAdminSession): Promise<void> {
  const accessToken = await accessTokenForRevoke(record)
  if (accessToken === null) {
    // 재발급조차 안 되면 서버가 이미 이 세션을 거절하는 상태다. 더 보낼 것이 없다.
    return
  }
  try {
    await logout({ refreshToken: record.refreshToken }, accessToken)
  } catch {
    // 서버 폐기 실패는 이미 끝난 로컬 로그아웃을 되돌리지 않는다.
  }
}

/**
 * 사용자가 직접 하는 로그아웃. 만료가 아니므로 `expiredAt`을 건드리지 않는다.
 * 로컬 정리와 화면 전환을 먼저 끝내고 서버 폐기는 기다리지 않는다 — 서버가 죽어
 * 있어도 로그아웃은 성립해야 한다. 정리 뒤에는 provider가 토큰을 주지 못하므로
 * 폐기 요청은 캡처한 레코드에서 토큰을 명시적으로 넘긴다.
 */
export function signOut(): void {
  const record = session
  clearSessionRecord()
  emit()
  if (record === null) {
    return
  }
  void revokeSessionOnServer(record)
}

/**
 * 토큰 만료로 세션이 끊긴 경우. 서버 로그아웃을 부르지 않는다(이미 인증이 없어
 * 401이 될 뿐이다). 레코드가 이미 비었으면 no-op이라 401이 여러 건 몰려와도
 * 만료 알림은 한 번만 뜬다.
 */
export function expireSession(): void {
  if (session === null) {
    return
  }
  clearSessionRecord()
  expiredAt = Date.now()
  emit()
}

/** 만료 알림을 화면이 소비했음을 알린다. */
export function acknowledgeSessionExpiry(): void {
  if (expiredAt === null) {
    return
  }
  expiredAt = null
  emit()
}

// import 시점 등록. 어떤 컴포넌트가 마운트되기 전이므로 복원된 세션의 첫 요청부터
// 헤더가 붙는다. 두 콜백 모두 최신 모듈 상태를 읽으므로 재등록이 필요 없다.
setAuthTokenProvider(currentAccessToken)
setAuthTokenRefresher(refreshAccessTokenOnce)
