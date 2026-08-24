/**
 * 관리자 세션(표시 이름 + 발급 토큰)을 탭 단위로 유지한다. 새로고침으로 튕기지
 * 않으면서 브라우저를 닫으면 사라지도록 sessionStorage를 쓰고 localStorage로
 * 올리지 않는다. 스토리지가 차단된 환경에서는 메모리 전용으로 degrade하며
 * 크래시하지 않는다. 토큰과 세션은 수명이 같으므로 한 레코드에 둔다 —
 * 분리하면 "로그아웃인데 토큰은 남는" desync가 생긴다.
 * 저장 실패·파싱 실패는 조용히 삼키며 토큰 값을 로그나 에러에 싣지 않는다.
 */
const SESSION_KEY = 'orderrun.admin.session'

export interface StoredAdminSession {
  adminName: string
  userId: string
  accessToken: string
  refreshToken: string
  /** epoch ms. `AuthTokenResponse.expiresIn`(밀리초)을 발급 시각에 더한 값. */
  accessTokenExpiresAt: number
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isStoredSession(value: unknown): value is StoredAdminSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'adminName' in value &&
    isNonEmptyString(value.adminName) &&
    'userId' in value &&
    isNonEmptyString(value.userId) &&
    'accessToken' in value &&
    isNonEmptyString(value.accessToken) &&
    'refreshToken' in value &&
    isNonEmptyString(value.refreshToken) &&
    'accessTokenExpiresAt' in value &&
    typeof value.accessTokenExpiresAt === 'number' &&
    Number.isFinite(value.accessTokenExpiresAt)
  )
}

export function readStoredSession(): StoredAdminSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (raw === null) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    if (!isStoredSession(parsed)) {
      return null
    }
    return {
      adminName: parsed.adminName,
      userId: parsed.userId,
      accessToken: parsed.accessToken,
      refreshToken: parsed.refreshToken,
      accessTokenExpiresAt: parsed.accessTokenExpiresAt,
    }
  } catch {
    return null
  }
}

export function writeStoredSession(session: StoredAdminSession): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session))
  } catch {
    // 스토리지 차단 환경. 이번 탭에서는 메모리 상태로만 로그인을 유지한다.
  }
}

export function clearStoredSession(): void {
  try {
    window.sessionStorage.removeItem(SESSION_KEY)
  } catch {
    // 삭제 실패해도 메모리 상태는 이미 로그아웃이므로 화면 게이트는 닫힌다.
  }
}
