import type { ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { DEMO_ADMIN_CREDENTIALS, matchesDemoAdmin } from '../demo/demoAuth'
import type { AdminSessionValue } from './adminSessionContext'
import { AdminSessionContext } from './adminSessionContext'
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './adminSessionStorage'

/**
 * 관리자 세션 상태를 소유하는 단 하나의 지점이다. 지금 검증은 demo 상수 비교이며
 * 보안 경계가 아니라 화면 게이트다. 실제 API가 붙으면 signIn/signOut 내부만 바꾼다.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const [adminName, setAdminName] = useState<string | null>(
    () => readStoredSession()?.adminName ?? null,
  )

  const signIn = useCallback((username: string, password: string): boolean => {
    if (!matchesDemoAdmin(username, password)) {
      return false
    }
    const name = DEMO_ADMIN_CREDENTIALS.displayName
    writeStoredSession({ adminName: name })
    setAdminName(name)
    return true
  }, [])

  const signOut = useCallback((): void => {
    clearStoredSession()
    setAdminName(null)
  }, [])

  const value = useMemo<AdminSessionValue>(
    () => ({
      isAuthenticated: adminName !== null,
      adminName,
      signIn,
      signOut,
    }),
    [adminName, signIn, signOut],
  )

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  )
}
