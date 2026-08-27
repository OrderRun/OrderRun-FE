import { createContext, useContext } from 'react'

/** 로그인 실패 원인. 문구 결정은 Presentation 화면이 한다. */
export type SignInFailureReason = 'credentials' | 'network' | 'server' | 'locked'

export type SignInResult = { ok: true } | { ok: false; reason: SignInFailureReason }

/**
 * 관리자 세션 계약이다. 토큰은 세션 store만 소유하며 이 계약으로 노출하지 않는다.
 * 화면은 인증 여부와 표시 이름, 로그인/로그아웃 동작, 그리고 만료 알림만 본다.
 */
export interface AdminSessionValue {
  isAuthenticated: boolean
  adminName: string | null
  /**
   * 토큰 만료로 세션이 끊긴 시각(epoch ms). 사용자가 직접 로그아웃한 경우에는
   * `null`이라 화면이 "끊겼다"와 "나갔다"를 구분할 수 있다.
   */
  sessionExpiredAt: number | null
  /** 실제 로그인 API를 호출한다. 예외를 던지지 않고 결과형으로 돌려준다. */
  signIn: (username: string, password: string) => Promise<SignInResult>
  /** 서버 로그아웃을 함께 보내지만 그 응답을 기다리지 않고 즉시 세션을 비운다. */
  signOut: () => void
  /** 만료 알림을 화면이 소비했음을 알린다(닫기 또는 자동 사라짐). */
  acknowledgeSessionExpiry: () => void
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null)

export { AdminSessionContext }

export function useAdminSession(): AdminSessionValue {
  const value = useContext(AdminSessionContext)
  if (value === null) {
    throw new Error('useAdminSession은 AdminSessionProvider 안에서만 쓸 수 있다.')
  }
  return value
}
