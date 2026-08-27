import type { ReactNode } from 'react'
import { useMemo, useSyncExternalStore } from 'react'
import type { AdminSessionValue } from './adminSessionContext'
import { AdminSessionContext } from './adminSessionContext'
import {
  acknowledgeSessionExpiry,
  getSnapshot,
  signIn,
  signOut,
  subscribe,
} from './adminSessionStore'

/**
 * 세션 store를 React 트리에 잇는 얇은 바인딩이다. 토큰과 만료 판단은 store가
 * 소유하고 이 컴포넌트는 스냅샷을 읽어 계약 형태로만 넘긴다 — 등록을 effect에
 * 두지 않으므로 자식의 첫 요청이 Authorization 없이 나가는 창이 없다.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(subscribe, getSnapshot)

  const value = useMemo<AdminSessionValue>(
    () => ({
      isAuthenticated: session.adminName !== null,
      adminName: session.adminName,
      sessionExpiredAt: session.expiredAt,
      signIn,
      signOut,
      acknowledgeSessionExpiry,
    }),
    [session],
  )

  return (
    <AdminSessionContext.Provider value={value}>
      {children}
    </AdminSessionContext.Provider>
  )
}
