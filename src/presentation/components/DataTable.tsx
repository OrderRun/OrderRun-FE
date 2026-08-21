import type { KeyboardEvent, ReactNode } from 'react'
import { EmptyState } from './EmptyState'

interface DataTableColumn<T> {
  key: string
  header: string
  width?: string
  align?: 'left' | 'right' | 'center'
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  rowKey: (row: T) => string
  emptyMessage: string
  emptyHint?: string
  onRowClick?: (row: T) => void
  isRowHighlighted?: (row: T) => boolean
}

export function DataTable<T>({
  columns,
  rows,
  rowKey,
  emptyMessage,
  emptyHint,
  onRowClick,
  isRowHighlighted,
}: DataTableProps<T>) {
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (!onRowClick) {
      return
    }
    // 행 안의 Button/Link에서 버블링된 keydown이 행 이동을 실행하지 않도록 한다.
    if (event.target !== event.currentTarget) {
      return
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      onRowClick(row)
    }
  }

  const alignClass = (align: DataTableColumn<T>['align']) => {
    if (align === 'right') {
      return ' or-align-right'
    }
    if (align === 'center') {
      return ' or-align-center'
    }
    return ''
  }

  return (
    <div className="or-table-wrap">
      <table className="or-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={column.width ? { width: column.width } : undefined}
                className={alignClass(column.align).trim()}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td className="or-empty-cell" colSpan={columns.length}>
                <EmptyState message={emptyMessage} hint={emptyHint} />
              </td>
            </tr>
          ) : (
            rows.map((row) => {
              const classes = [
                onRowClick ? 'or-row-clickable' : '',
                isRowHighlighted?.(row) ? 'or-row-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <tr
                  key={rowKey(row)}
                  className={classes || undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={
                    onRowClick ? (event) => handleKeyDown(event, row) : undefined
                  }
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={alignClass(column.align).trim() || undefined}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}
