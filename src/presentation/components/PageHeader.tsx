import type { ReactNode } from 'react'

interface PageHeaderProps {
  title: ReactNode
  description?: string
  actions?: ReactNode
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="or-page-header">
      <div>
        <h1 className="or-page-title">{title}</h1>
        {description ? <p className="or-page-desc">{description}</p> : null}
      </div>
      {actions ? <div className="or-page-actions">{actions}</div> : null}
    </header>
  )
}
