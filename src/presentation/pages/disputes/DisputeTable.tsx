import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import type { DemoDispute } from '../../demo/demoTypes'

interface DisputeTableProps {
  rows: DemoDispute[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (dispute: DemoDispute) => void
}

/** 분쟁 목록 표현은 분쟁 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function DisputeTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: DisputeTableProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(dispute) => dispute.disputeId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'disputeId',
          header: '분쟁 ID',
          width: '100px',
          render: (dispute) => (
            <span className="or-cell-id">{dispute.disputeId}</span>
          ),
        },
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (dispute) => (
            <span className="or-cell-id">{dispute.proposalId}</span>
          ),
        },
        {
          key: 'offerId',
          header: '지원 ID',
          width: '100px',
          render: (dispute) => (
            <span className="or-cell-id">{dispute.offerId}</span>
          ),
        },
        {
          key: 'requester',
          header: '신청자',
          width: '120px',
          render: (dispute) => dispute.requesterName,
        },
        {
          key: 'requesterRole',
          header: '역할',
          width: '80px',
          render: (dispute) => <StatusBadge label={dispute.requesterRole} shape="pill" />,
        },
        {
          key: 'status',
          header: '처리 여부',
          width: '110px',
          render: (dispute) => <StatusBadge label={dispute.status} shape="pill" />,
        },
        {
          key: 'requestedAt',
          header: '신청일',
          width: '140px',
          render: (dispute) => (
            <span className="or-cell-muted">{dispute.requestedAt}</span>
          ),
        },
      ]}
    />
  )
}
