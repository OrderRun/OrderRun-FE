import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount } from '../../components/formatters'
import { findDemoRequestStatus } from '../../demo/demoSelectors'
import type { DemoRefund } from '../../demo/demoTypes'

interface RefundTableProps {
  rows: DemoRefund[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (refund: DemoRefund) => void
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
      rowKey={(refund) => refund.proposalId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (refund) => (
            <span className="or-cell-id">{refund.proposalId}</span>
          ),
        },
        {
          key: 'hyungnim',
          header: '행님',
          width: '100px',
          render: (refund) => refund.hyungnimName,
        },
        {
          key: 'amount',
          header: '환불 금액',
          width: '110px',
          render: (refund) => (
            <span className="or-cell-amount">{formatAmount(refund.amount)}</span>
          ),
        },
        {
          key: 'requestStatus',
          header: '요청 상태',
          width: '90px',
          render: (refund) => {
            const requestStatus = findDemoRequestStatus(refund.proposalId)
            return requestStatus ? (
              <StatusBadge label={requestStatus} />
            ) : (
              <span className="or-flag-off">해당 없음</span>
            )
          },
        },
        {
          key: 'refundStatus',
          header: '처리 여부',
          width: '110px',
          render: (refund) => <StatusBadge label={refund.status} shape="pill" />,
        },
        {
          key: 'requestedAt',
          header: '요청일',
          width: '140px',
          render: (refund) => (
            <span className="or-cell-muted">{refund.requestedAt}</span>
          ),
        },
        {
          key: 'processedAt',
          header: '처리일',
          width: '140px',
          render: (refund) =>
            refund.processedAt ? (
              <span className="or-cell-muted">{refund.processedAt}</span>
            ) : (
              <span className="or-flag-off">미처리</span>
            ),
        },
      ]}
    />
  )
}
