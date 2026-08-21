import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import type { DemoProposalReport } from '../../demo/demoTypes'

interface ReportTableProps {
  rows: DemoProposalReport[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (report: DemoProposalReport) => void
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
      rowKey={(report) => report.reportId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'reportId',
          header: '신고 ID',
          width: '90px',
          render: (report) => (
            <span className="or-cell-id">{report.reportId}</span>
          ),
        },
        {
          key: 'target',
          header: '신고 대상',
          width: '125px',
          render: (report) => (
            <span className="or-cell-id">요청 #{report.proposalId}</span>
          ),
        },
        {
          key: 'reporterId',
          header: '신고자 ID',
          width: '105px',
          render: (report) => report.reporterId,
        },
        {
          key: 'reason',
          header: '신고 사유 / 상세',
          render: (report) => (
            <span className="or-report-content">
              <span>{report.reasonQuestionText}</span>
              <span className="or-report-detail">
                {report.detailReason ?? '추가 상세 내용 없음'}
              </span>
            </span>
          ),
        },
        {
          key: 'reportStatus',
          header: '처리 여부',
          width: '105px',
          render: (report) => (
            <StatusBadge label={report.reportStatus} shape="pill" />
          ),
        },
        {
          key: 'reportedAt',
          header: '신고일',
          width: '140px',
          render: (report) => (
            <span className="or-cell-muted">{report.reportedAt}</span>
          ),
        },
      ]}
    />
  )
}
