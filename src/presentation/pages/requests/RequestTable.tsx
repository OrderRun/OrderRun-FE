import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount, formatCount } from '../../components/formatters'
import type { DemoRequestSummary } from '../../demo/demoTypes'

interface RequestTableProps {
  rows: DemoRequestSummary[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (summary: DemoRequestSummary) => void
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
      rowKey={(summary) => summary.request.proposalId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (summary) => (
            <span className="or-cell-id">{summary.request.proposalId}</span>
          ),
        },
        {
          key: 'hyungnim',
          header: '행님',
          width: '100px',
          render: (summary) => summary.request.hyungnimName,
        },
        {
          key: 'amount',
          header: '금액',
          width: '110px',
          render: (summary) => (
            <span className="or-cell-amount">
              {formatAmount(summary.request.amount)}
            </span>
          ),
        },
        {
          key: 'status',
          header: '요청 상태',
          width: '90px',
          render: (summary) => <StatusBadge label={summary.request.status} />,
        },
        {
          key: 'offerCount',
          header: '지원 수',
          width: '80px',
          render: (summary) => (
            <span className="or-cell-amount">
              {formatCount(summary.offerCount)}
            </span>
          ),
        },
        {
          key: 'createdAt',
          header: '생성일',
          width: '140px',
          render: (summary) => (
            <span className="or-cell-muted">{summary.request.createdAt}</span>
          ),
        },
      ]}
    />
  )
}
