import type { ReactNode } from 'react'

interface InfoCardProps {
  title?: string
  actions?: ReactNode
  items: { label: string; value: ReactNode }[]
}

export function InfoCard({ title, actions, items }: InfoCardProps) {
  return (
    <section className="or-card">
      {title ? (
        <div className="or-card-head">
          <h2 className="or-card-title">{title}</h2>
          {actions}
        </div>
      ) : null}
      <div className="or-card-body">
        <dl className="or-info-grid">
          {items.map((item) => (
            <div className="or-info-item" key={item.label}>
              <dt className="or-info-label">{item.label}</dt>
              <dd className="or-info-value">{item.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
