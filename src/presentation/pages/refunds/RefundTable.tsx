import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount } from '../../components/formatters'
import type { RefundRow } from '../../models/rows'

interface RefundTableProps {
  rows: RefundRow[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (row: RefundRow) => void
}

/** 환불 목록 표현은 환불 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function RefundTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: RefundTableProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.refundId}
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
          header: '환불 금액',
          width: '110px',
          render: (row) => (
            <span className="or-cell-amount">{formatAmount(row.amount)}</span>
          ),
        },
        {
          key: 'requestStatus',
          header: '요청 상태',
          width: '90px',
          render: (row) =>
            row.requestStatusLabel === null ? (
              <span className="or-flag-off">해당 없음</span>
            ) : (
              <StatusBadge label={row.requestStatusLabel} />
            ),
        },
        {
          key: 'refundStatus',
          header: '처리 여부',
          width: '110px',
          // VOIDED는 처리 결과 배지가 아니라 "환불 대상이 아니다"라는 표시다.
          render: (row) =>
            row.statusLabel === null ? (
              <span className="or-flag-off">해당 사항 없음</span>
            ) : (
              <StatusBadge label={row.statusLabel} shape="pill" />
            ),
        },
        {
          key: 'requestedAt',
          header: '요청일',
          width: '140px',
          render: (row) => <span className="or-cell-muted">{row.requestedAt}</span>,
        },
        {
          key: 'processedAt',
          header: '처리일',
          width: '140px',
          render: (row) =>
            row.processedAt === null ? (
              <span className="or-flag-off">미처리</span>
            ) : (
              <span className="or-cell-muted">{row.processedAt}</span>
            ),
        },
      ]}
    />
  )
}
