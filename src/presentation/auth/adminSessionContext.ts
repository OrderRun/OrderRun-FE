import { createContext, useContext } from 'react'

/** 로그인 실패 원인. 문구 결정은 Presentation 화면이 한다. */
export type SignInFailureReason = 'credentials' | 'network' | 'server'

export type SignInResult = { ok: true } | { ok: false; reason: SignInFailureReason }

/**
 * 관리자 세션 계약이다. 토큰은 Provider만 소유하며 이 계약으로 노출하지 않는다.
 * 화면은 인증 여부와 표시 이름, 그리고 로그인/로그아웃 동작만 본다.
 */
export interface AdminSessionValue {
  isAuthenticated: boolean
  adminName: string | null
  /** 실제 로그인 API를 호출한다. 예외를 던지지 않고 결과형으로 돌려준다. */
  signIn: (username: string, password: string) => Promise<SignInResult>
  signOut: () => void
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
