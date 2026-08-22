/**
 * 데모 세션을 탭 단위로 유지한다. 새로고침으로 튕기지 않으면서 브라우저를 닫으면
 * 사라지도록 sessionStorage를 쓴다. 스토리지가 차단된 환경에서는 메모리 전용으로
 * degrade하며 크래시하지 않는다. 실제 인증이 붙으면 토큰 저장소로 교체된다.
 */
const SESSION_KEY = 'orderrun.demo.admin.session'

export interface StoredAdminSession {
  adminName: string
}

function isStoredSession(value: unknown): value is StoredAdminSession {
  return (
    typeof value === 'object' &&
    value !== null &&
    'adminName' in value &&
    typeof value.adminName === 'string' &&
    value.adminName.length > 0
  )
}

export function readStoredSession(): StoredAdminSession | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY)
    if (raw === null) {
      return null
    }
    const parsed: unknown = JSON.parse(raw)
    return isStoredSession(parsed) ? { adminName: parsed.adminName } : null
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
