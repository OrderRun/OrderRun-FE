import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { useAdminSession } from '../auth/adminSessionContext'
import { createAdminQueryClient, setUnauthorizedHandler } from './queryClient'

/**
 * 세션 안쪽에 두어 401일 때 `signOut()`을 호출할 수 있게 한다. 세션이 비면
 * 기존 `RequireAuth`가 로그인으로 보내므로 별도 라우팅 코드는 없다.
 * QueryClient는 마운트 1회만 만든다(다시 만들면 캐시가 통째로 버려진다).
 */
export function AdminQueryProvider({ children }: { children: ReactNode }) {
  const { signOut } = useAdminSession()
  const [queryClient] = useState(createAdminQueryClient)

  useEffect(() => {
    setUnauthorizedHandler(signOut)
    return () => {
      setUnauthorizedHandler(null)
    }
  }, [signOut])

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
