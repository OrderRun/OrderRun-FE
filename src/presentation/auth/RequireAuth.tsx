import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PATHS } from '../routes/paths'
import { useAdminSession } from './adminSessionContext'

/**
 * 미인증이면 관리자 화면을 한 프레임도 마운트하지 않고 로그인으로 보낸다.
 * 단일 계정이라 권한 등급이 없어 403 화면 대신 로그인 리다이렉트가 유일한 거부 경로다.
 */
export function RequireAuth() {
  const { isAuthenticated } = useAdminSession()
  const location = useLocation()

  if (!isAuthenticated) {
    return (
      <Navigate
        to={PATHS.login}
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
