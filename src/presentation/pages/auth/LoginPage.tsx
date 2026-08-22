import type { FormEvent } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { SignInFailureReason } from '../../auth/adminSessionContext'
import { useAdminSession } from '../../auth/adminSessionContext'
import { readRedirectTarget } from '../../auth/redirectTarget'
import { Button } from '../../components/Button'
import { PATHS } from '../../routes/paths'

const INVALID_MESSAGE = '아이디 또는 비밀번호가 올바르지 않습니다.'
const NETWORK_MESSAGE = '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.'
const SERVER_MESSAGE = '로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.'

function messageFor(reason: SignInFailureReason): string {
  if (reason === 'credentials') return INVALID_MESSAGE
  if (reason === 'network') return NETWORK_MESSAGE
  return SERVER_MESSAGE
}

export function LoginPage() {
  const { isAuthenticated, signIn } = useAdminSession()
  const location = useLocation()
  const navigate = useNavigate()
  const passwordRef = useRef<HTMLInputElement>(null)

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 실패 시 비밀번호 입력으로 포커스를 되돌린다. 제출 중에는 입력이 disabled라
  // 핸들러 안에서 focus()를 부르면 무시되므로, 다시 활성화된 뒤 렌더에서 옮긴다.
  const [focusRequest, setFocusRequest] = useState(0)

  useEffect(() => {
    if (focusRequest > 0 && !isSubmitting) {
      passwordRef.current?.focus()
    }
  }, [focusRequest, isSubmitting])

  const target = readRedirectTarget(location.state) ?? PATHS.dashboard

  if (isAuthenticated) {
    return <Navigate to={target} replace />
  }

  function failWith(message: string) {
    setErrorMessage(message)
    setPassword('')
    setFocusRequest((count) => count + 1)
  }

  async function submit() {
    // 빈 입력은 서버를 부르지 않고 자격 증명 불일치와 같은 자리·같은 문구로 알린다.
    if (username === '' || password === '') {
      failWith(INVALID_MESSAGE)
      return
    }

    setIsSubmitting(true)
    setErrorMessage(null)
    try {
      const result = await signIn(username, password)
      if (result.ok) {
        void navigate(target, { replace: true })
        return
      }
      failWith(messageFor(result.reason))
    } finally {
      setIsSubmitting(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    // 연타로 중복 요청이 나가지 않게 진행 중이면 무시한다.
    if (isSubmitting) {
      return
    }
    void submit()
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
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            placeholder="비밀번호"
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        {hasError ? (
          <p className="or-error-text" role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button
          type="submit"
          variant="primary"
          className="or-auth-submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? '로그인 중…' : '로그인'}
        </Button>
      </form>
    </div>
  )
}
