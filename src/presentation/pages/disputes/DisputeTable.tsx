import { ActorName } from '../../components/ActorName'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { toActorRoleLabel } from '../../../domain/actor/roleLabel'
import type { DisputeRow } from '../../models/rows'

interface DisputeTableProps {
  rows: DisputeRow[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (row: DisputeRow) => void
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
      rowKey={(row) => row.disputeId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'disputeId',
          header: '분쟁 ID',
          width: '100px',
          render: (row) => <span className="or-cell-id">{row.disputeId}</span>,
        },
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (row) => <span className="or-cell-id">{row.proposalId}</span>,
        },
        {
          key: 'offerId',
          header: '지원 ID',
          width: '100px',
          render: (row) => <span className="or-cell-id">{row.offerId}</span>,
        },
        {
          key: 'requester',
          header: '신청자',
          width: '120px',
          render: (row) => (
            <ActorName name={row.requesterName} id={row.requesterId} variant="cell" />
          ),
        },
        {
          key: 'requesterRole',
          header: '역할',
          width: '80px',
          render: (row) => (
            <StatusBadge label={toActorRoleLabel(row.requesterRole)} shape="pill" />
          ),
        },
        {
          key: 'status',
          header: '처리 여부',
          width: '110px',
          render: (row) => <StatusBadge label={row.statusLabel} shape="pill" />,
        },
        {
          key: 'requestedAt',
          header: '신청일',
          width: '140px',
          render: (row) => <span className="or-cell-muted">{row.requestedAt}</span>,
        },
      ]}
    />
  )
}
