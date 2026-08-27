import { useEffect } from 'react'
import { Toast } from '../components/Toast'
import { useAdminSession } from './adminSessionContext'

const EXPIRED_MESSAGE = '세션이 만료되었습니다. 다시 로그인해 주세요.'
const AUTO_DISMISS_MS = 6_000

/**
 * 토큰 만료로 세션이 끊겼을 때만 뜬다. 사용자가 직접 누른 로그아웃은
 * `sessionExpiredAt`이 `null`이라 여기 걸리지 않는다 — 의도한 행동을 알림으로
 * 되돌려주지 않기 위해서다. 로그인으로 튕긴 뒤에도 보이도록 가드 바깥에 둔다.
 */
export function SessionExpiredToast() {
  const { sessionExpiredAt, acknowledgeSessionExpiry } = useAdminSession()

  useEffect(() => {
    if (sessionExpiredAt === null) {
      return
    }
    const timer = window.setTimeout(acknowledgeSessionExpiry, AUTO_DISMISS_MS)
    return () => {
      window.clearTimeout(timer)
    }
  }, [sessionExpiredAt, acknowledgeSessionExpiry])

  if (sessionExpiredAt === null) {
    return null
  }

  return (
    <Toast
      message={EXPIRED_MESSAGE}
      tone="alert"
      onDismiss={acknowledgeSessionExpiry}
    />
  )
}
