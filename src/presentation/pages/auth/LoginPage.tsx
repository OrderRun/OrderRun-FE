import type { FormEvent } from 'react'
import { useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAdminSession } from '../../auth/adminSessionContext'
import { readRedirectTarget } from '../../auth/redirectTarget'
import { Button } from '../../components/Button'
import { PATHS } from '../../routes/paths'

const INVALID_MESSAGE = '아이디 또는 비밀번호가 올바르지 않습니다.'

export function LoginPage() {
  const { isAuthenticated, signIn } = useAdminSession()
  const location = useLocation()
  const navigate = useNavigate()
  const passwordRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const target = readRedirectTarget(location.state) ?? PATHS.dashboard

  if (isAuthenticated) {
    return <Navigate to={target} replace />
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    // 빈 입력도 자격 증명 불일치와 같은 자리·같은 문구로 알린다.
    if (signIn(username, password)) {
      setErrorMessage(null)
      void navigate(target, { replace: true })
      return
    }

    setErrorMessage(INVALID_MESSAGE)
    setPassword('')
    passwordRef.current?.focus()
  }

  const hasError = errorMessage !== null
  const inputClass = hasError ? 'or-input or-input-error' : 'or-input'

  return (
    <div className="or-auth">
      <form className="or-auth-card" onSubmit={handleSubmit}>
        <div className="or-auth-head">
          <span className="or-auth-brand">꼬붕단 운영 관리</span>
          <h1 className="or-auth-title">관리자 로그인</h1>
        </div>

        <label className="or-field">
          <span className="or-field-label">아이디</span>
          <input
            className={inputClass}
            type="text"
            name="username"
            value={username}
            autoComplete="username"
            autoFocus
            placeholder="관리자 아이디"
            onChange={(event) => setUsername(event.target.value)}
          />
        </label>

        <label className="or-field">
          <span className="or-field-label">비밀번호</span>
          <input
            ref={passwordRef}
            className={inputClass}
            type="password"
            name="password"
            value={password}
            autoComplete="current-password"
            placeholder="비밀번호"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {hasError ? (
          <p className="or-error-text" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" variant="primary" className="or-auth-submit">
          로그인
        </Button>
      </form>
    </div>
  )
}
