import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md'
  children: ReactNode
}

export function Button({
  variant = 'secondary',
  size = 'md',
  type = 'button',
  className,
  children,
  ...rest
}: ButtonProps) {
  const classes = [
    'or-btn',
    `or-btn-${variant}`,
    size === 'sm' ? 'or-btn-sm' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type={type} className={classes} {...rest}>
      {children}
    </button>
  )
}
