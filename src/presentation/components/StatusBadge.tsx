import { statusTone } from './statusTone'

interface StatusBadgeProps {
  label: string
  size?: 'sm' | 'lg'
  /**
   * 배지 모양 규칙: 요청(Proposal)·지원의 진행 상태만 각진 사각형(square)이고,
   * 그 밖의 축(역할, 선택 여부, 미션 상태, 신고·분쟁·환불·정산의 처리 상태)은
   * 알약(pill)이다.
   */
  shape?: 'square' | 'pill'
}

export function StatusBadge({
  label,
  size = 'sm',
  shape = 'square',
}: StatusBadgeProps) {
  const tone = statusTone(label)
  const sizeClass = size === 'lg' ? ' or-badge-lg' : ''
  const shapeClass = shape === 'pill' ? ' or-badge-pill' : ''

  return (
    <span className={`or-badge or-badge-${tone}${sizeClass}${shapeClass}`}>
      {label}
    </span>
  )
}
