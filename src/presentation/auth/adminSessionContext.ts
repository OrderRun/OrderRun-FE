import { createContext, useContext } from 'react'

/**
 * 관리자 세션의 유일한 교체 지점 계약이다. 실제 API가 붙으면 Provider 내부 구현만
 * data 계층 호출로 바꾸고 이 타입을 쓰는 화면들은 그대로 둔다.
 */
export interface AdminSessionValue {
  isAuthenticated: boolean
  adminName: string | null
  /** 자격 증명이 맞으면 true. 데모 단계라 동기다. */
  signIn: (username: string, password: string) => boolean
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
