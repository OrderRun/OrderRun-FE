import { isHiddenStatusLabel, isPlainStatusLabel, statusTone } from './statusTone'

interface StatusBadgeProps {
  label: string
  size?: 'sm' | 'lg'
}

export function StatusBadge({ label, size = 'sm' }: StatusBadgeProps) {
  if (isHiddenStatusLabel(label)) {
    return null
  }

  if (isPlainStatusLabel(label)) {
    return <span className="or-flag-off">{label}</span>
  }

  const tone = statusTone(label)
  const sizeClass = size === 'lg' ? ' or-badge-lg' : ''

  return <span className={`or-badge or-badge-${tone}${sizeClass}`}>{label}</span>
}
