import type { ReactNode } from 'react'

interface InfoItem {
  label: string
  value: ReactNode
  /** true면 이 항목부터 새 줄에서 시작한다. */
  newRow?: boolean
}

interface InfoCardProps {
  title?: string
  actions?: ReactNode
  items: InfoItem[]
}

/** newRow 표시를 기준으로 항목을 줄 단위 그룹으로 나눈다. */
function toRows(items: InfoItem[]): InfoItem[][] {
  return items.reduce<InfoItem[][]>((rows, item) => {
    if (rows.length === 0 || item.newRow === true) {
      rows.push([item])
    } else {
      rows[rows.length - 1].push(item)
    }
    return rows
  }, [])
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
        <dl className="or-info-rows">
          {toRows(items).map((row) => (
            <div className="or-info-grid" key={row[0].label}>
              {row.map((item) => (
                <div className="or-info-item" key={item.label}>
                  <dt className="or-info-label">{item.label}</dt>
                  <dd className="or-info-value">{item.value}</dd>
                </div>
              ))}
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
