import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { expireSession } from '../auth/adminSessionStore'
import { createAdminQueryClient, setUnauthorizedHandler } from './queryClient'

/**
 * 재발급까지 실패해 끝내 남은 401은 "만료"다. 사용자 로그아웃(`signOut`)이 아니라
 * `expireSession`을 부르는 이유가 여기 있다 — 만료 경로에서는 서버 `/v1/auth/logout`을
 * 부르지 않고, 대신 화면이 만료 알림을 띄울 수 있게 한다. 세션이 비면 기존
 * `RequireAuth`가 로그인으로 보내므로 별도 라우팅 코드는 없다.
 * QueryClient는 마운트 1회만 만든다(다시 만들면 캐시가 통째로 버려진다).
 */
export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(createAdminQueryClient)

  useEffect(() => {
    setUnauthorizedHandler(expireSession)
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
