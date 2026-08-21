import { useState } from 'react'
import { Button } from '../../../components/Button'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { DataTable } from '../../../components/DataTable'
import { InfoCard } from '../../../components/InfoCard'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import type {
  DemoProcessStatus,
  DemoProposalReport,
} from '../../../demo/demoTypes'

interface ReportInfoTabProps {
  reports: DemoProposalReport[]
  requestStatus: string
  /** 신고가 처리 완료되면 요청도 취소로 바뀐다. */
  onRequestCancel: () => void
}

export function ReportInfoTab({
  reports,
  requestStatus,
  onRequestCancel,
}: ReportInfoTabProps) {
  const [statusById, setStatusById] = useState<
    Record<string, DemoProcessStatus>
  >({})
  const [detailReport, setDetailReport] = useState<DemoProposalReport | null>(
    null,
  )
  const [processTarget, setProcessTarget] =
    useState<DemoProposalReport | null>(null)

  const statusOf = (report: DemoProposalReport): DemoProcessStatus =>
    statusById[report.reportId] ?? report.reportStatus

  const completeReport = () => {
    if (!processTarget) {
      return
    }
    setStatusById((current) => ({
      ...current,
      [processTarget.reportId]: '처리 완료',
    }))
    onRequestCancel()
    setProcessTarget(null)
  }

  const rejectReport = () => {
    if (!processTarget) {
      return
    }
    setStatusById((current) => ({
      ...current,
      [processTarget.reportId]: '반려',
    }))
    setProcessTarget(null)
  }

  return (
    <>
      <DataTable
        rows={reports}
        rowKey={(report) => report.reportId}
        emptyMessage="접수된 신고가 없습니다."
        emptyHint="이 요청에 신고가 접수되면 이곳에 표시됩니다."
        onRowClick={(report) => setDetailReport(report)}
        columns={[
          {
            key: 'reportId',
            header: '신고 ID',
            width: '100px',
            render: (report) => (
              <span className="or-cell-id">{report.reportId}</span>
            ),
          },
          {
            key: 'reporterId',
            header: '신고자',
            width: '100px',
            render: (report) => report.reporterId,
          },
          {
            key: 'reason',
            header: '신고 사유',
            render: (report) => report.reasonQuestionText,
          },
          {
            key: 'status',
            header: '처리 상태',
            width: '100px',
            render: (report) => (
              <StatusBadge label={statusOf(report)} shape="pill" />
            ),
          },
          {
            key: 'action',
            header: '처리',
            width: '110px',
              render: (report) =>
              statusOf(report) === '미처리' ? (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(event) => {
                    event.stopPropagation()
                    setProcessTarget(report)
                  }}
                >
                  신고 처리
                </Button>
              ) : null,
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

      <Modal
        open={detailReport !== null}
        title="신고 상세"
        onClose={() => setDetailReport(null)}
        footer={
          <Button variant="secondary" onClick={() => setDetailReport(null)}>
            닫기
          </Button>
        }
      >
        {detailReport ? (
          <>
            <InfoCard
              items={[
                { label: '신고 ID', value: detailReport.reportId },
                {
                  label: '처리 상태',
                  value: (
                    <StatusBadge label={statusOf(detailReport)} shape="pill" />
                  ),
                },
                { label: '신고자 ID', value: detailReport.reporterId },
                { label: '신고일', value: detailReport.reportedAt },
              ]}
            />
            <div className="or-field">
              <span className="or-field-label">신고 사유</span>
              <p className="or-help-text">{detailReport.reasonQuestionText}</p>
            </div>
            <div className="or-field">
              <span className="or-field-label">상세 내용</span>
              <p className="or-help-text">
                {detailReport.detailReason ?? '추가 상세 내용 없음'}
              </p>
            </div>
          </>
        ) : null}
      </Modal>

      <ConfirmModal
        open={processTarget !== null}
        title="신고 처리"
        description={`신고 #${processTarget?.reportId ?? ''}을 처리 완료하면 요청도 취소로 변경됩니다. 반려하면 요청 상태는 그대로입니다.`}
        confirmLabel="처리 완료"
        closeLabel="닫기"
        rejectLabel="반려"
        onReject={rejectReport}
        onClose={() => setProcessTarget(null)}
        onConfirm={completeReport}
      >
        <div className="or-panel">
          <div className="or-kv-row">
            <span className="or-kv-label">요청 상태</span>
            <span className="or-transition">
              <StatusBadge label={requestStatus} />
              <span className="or-transition-arrow">→</span>
              <StatusBadge label="취소" />
            </span>
          </div>
        </div>
      </ConfirmModal>
    </>
  )
}
