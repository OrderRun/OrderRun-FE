interface ToastProps {
  message: string
  /** `alert`는 즉시 읽히고, `notice`는 사용자 흐름을 끊지 않고 전달된다. */
  tone: 'notice' | 'alert'
  onDismiss: () => void
}

/**
 * 화면 흐름을 막지 않는 알림. 모달과 달리 포커스를 뺏지 않으므로 입력 중에 떠도
 * 타이핑이 끊기지 않는다. 문구와 표시 시간은 부르는 쪽이 정한다.
 */
export function Toast({ message, tone, onDismiss }: ToastProps) {
  const isAlert = tone === 'alert'

  return (
    <div
      className={isAlert ? 'or-toast or-toast-alert' : 'or-toast'}
      role={isAlert ? 'alert' : 'status'}
      aria-live={isAlert ? 'assertive' : 'polite'}
      aria-atomic="true"
    >
      <span className="or-toast-message">{message}</span>
      <button
        type="button"
        className="or-toast-close"
        aria-label="닫기"
        onClick={onDismiss}
      >
        ✕
      </button>
    </div>
  )
}
