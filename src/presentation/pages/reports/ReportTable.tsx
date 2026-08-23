import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import type { ReportRow } from '../../models/rows'

interface ReportTableProps {
  rows: ReportRow[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (row: ReportRow) => void
}

/** 신고 목록 표현은 신고 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function ReportTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: ReportTableProps) {
  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.reportId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'reportId',
          header: '신고 ID',
          width: '90px',
          render: (row) => <span className="or-cell-id">{row.reportId}</span>,
        },
        {
          key: 'target',
          header: '신고 대상',
          width: '125px',
          render: (row) => <span className="or-cell-id">요청 #{row.proposalId}</span>,
        },
        {
          key: 'reporterId',
          header: '신고자 ID',
          width: '105px',
          render: (row) => row.reporterId,
        },
        {
          key: 'reason',
          header: '신고 사유 / 상세',
          render: (row) => (
            <span className="or-report-content">
              <span>{row.reasonQuestionText}</span>
              <span className="or-report-detail">
                {row.detailReason ?? '추가 상세 내용 없음'}
              </span>
            </span>
          ),
        },
        {
          key: 'reportStatus',
          header: '처리 여부',
          width: '105px',
          render: (row) => <StatusBadge label={row.statusLabel} shape="pill" />,
        },
        {
          key: 'reportedAt',
          header: '신고일',
          width: '140px',
          render: (row) => <span className="or-cell-muted">{row.reportedAt}</span>,
        },
      ]}
    />
  )
}
