import type { ReactNode } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { adminLogin } from '../../data/api/adminApi'
import { ApiError } from '../../data/api/apiError'
import { setAuthTokenProvider } from '../../data/api/httpClient'
import type { AdminSessionValue, SignInResult } from './adminSessionContext'
import { AdminSessionContext } from './adminSessionContext'
import type { StoredAdminSession } from './adminSessionStorage'
import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './adminSessionStorage'

/**
 * 관리자 세션과 발급 토큰을 소유하는 단 하나의 지점이다. 토큰은 state가 아니라
 * ref에만 두어 렌더에 실려 나가지 않게 하고, data 계층에는 값이 아니라 "읽는
 * 콜백"만 넘긴다(Presentation → Data, 허용 방향). 토큰을 로그·에러 메시지에
 * 담지 않는다.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const tokenRef = useRef<string | null>(null)
  const [adminName, setAdminName] = useState<string | null>(
    () => readStoredSession()?.adminName ?? null,
  )

  // 등록은 마운트 1회. 복원된 토큰도 같은 시점에 ref로 싣는다(같은 레코드에서
  // 읽으므로 표시 이름과 토큰이 어긋나지 않는다). 콜백이 ref를 읽으므로
  // 로그인/로그아웃 때 재등록이 없고 stale closure도 생기지 않는다.
  useEffect(() => {
    tokenRef.current = readStoredSession()?.accessToken ?? null
    setAuthTokenProvider(() => tokenRef.current)
    return () => {
      setAuthTokenProvider(null)
    }
  }, [])

  const signIn = useCallback(
    async (username: string, password: string): Promise<SignInResult> => {
      try {
        const token = await adminLogin({ username, password })
        const session: StoredAdminSession = {
          // 스펙의 AuthTokenResponse에는 표시용 이름 필드가 없다. 서버값을
          // 추측하지 않고 입력한 아이디를 그대로 표시 이름으로 쓴다.
          adminName: username,
          userId: token.userId,
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          accessTokenExpiresAt: Date.now() + token.expiresIn,
        }
        tokenRef.current = session.accessToken
        writeStoredSession(session)
        setAdminName(session.adminName)
        return { ok: true }
      } catch (error) {
        if (error instanceof ApiError) {
          if (error.code === 'ADMIN_CREDENTIALS_INVALID' || error.status === 401) {
            return { ok: false, reason: 'credentials' }
          }
          if (error.status === null) {
            return { ok: false, reason: 'network' }
          }
        }
        return { ok: false, reason: 'server' }
      }
    },
    [],
  )

  const signOut = useCallback((): void => {
    // provider 등록은 유지하고 토큰만 비운다. 토큰 없음 = 헤더 없음.
    tokenRef.current = null
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
