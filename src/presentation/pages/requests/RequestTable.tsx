import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount, formatCount } from '../../components/formatters'
import type { RequestRow } from '../../models/rows'

interface RequestTableProps {
  rows: RequestRow[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (row: RequestRow) => void
}

/** 요청 목록 표현은 요청 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function RequestTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: RequestTableProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.proposalId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (row) => <span className="or-cell-id">{row.proposalId}</span>,
        },
        {
          key: 'hyungnim',
          header: '행님',
          width: '100px',
          render: (row) => row.hyungnimName,
        },
        {
          key: 'amount',
          header: '금액',
          width: '110px',
          render: (row) => (
            <span className="or-cell-amount">{formatAmount(row.amount)}</span>
          ),
        },
        {
          key: 'status',
          header: '요청 상태',
          width: '90px',
          render: (row) => <StatusBadge label={row.statusLabel} />,
        },
        {
          key: 'offerCount',
          header: '지원 수',
          width: '80px',
          render: (row) => (
            <span className="or-cell-amount">{formatCount(row.offerCount)}</span>
          ),
        },
        {
          key: 'createdAt',
          header: '생성일',
          width: '140px',
          render: (row) => <span className="or-cell-muted">{row.createdAt}</span>,
        },
      ]}
    />
  )
}
