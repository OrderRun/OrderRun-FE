import { useNavigate } from 'react-router-dom'
import { useAdminSession } from '../auth/adminSessionContext'
import { Button } from '../components/Button'
import { PATHS } from '../routes/paths'

export function Header() {
  const { adminName, signOut } = useAdminSession()
  const navigate = useNavigate()

  function handleSignOut() {
    signOut()
    // replace로 보내 뒤로가기가 관리자 화면 기록으로 돌아가지 않게 한다.
    void navigate(PATHS.login, { replace: true })
  }

  return (
    <header className="or-header">
      <span className="or-header-title">꼬붕단 운영 관리</span>
      <div className="or-header-user">
        <span className="or-avatar" aria-hidden="true">
          운영
        </span>
        {adminName ?? '운영 관리자'}
        <Button variant="ghost" size="sm" onClick={handleSignOut}>
          로그아웃
        </Button>
      </div>
    </header>
  )
}
