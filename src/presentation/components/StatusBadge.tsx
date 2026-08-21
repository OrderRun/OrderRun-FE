import { isHiddenStatusLabel, isPlainStatusLabel, statusTone } from './statusTone'

interface StatusBadgeProps {
  label: string
  size?: 'sm' | 'lg'
  /** 신고·분쟁·환불의 처리 상태는 알약, Proposal·지원 상태는 각진 사각형을 쓴다. */
  shape?: 'square' | 'pill'
}

export function StatusBadge({
  label,
  size = 'sm',
  shape = 'square',
}: StatusBadgeProps) {
  if (isHiddenStatusLabel(label)) {
    return null
  }

  if (isPlainStatusLabel(label)) {
    return <span className="or-flag-off">{label}</span>
  }

  const tone = statusTone(label)
  const sizeClass = size === 'lg' ? ' or-badge-lg' : ''
  const shapeClass = shape === 'pill' ? ' or-badge-pill' : ''

  return (
    <span className={`or-badge or-badge-${tone}${sizeClass}${shapeClass}`}>
      {label}
    </span>
  )
}
