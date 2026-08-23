import { useState } from 'react'
import { Button } from '../../../components/Button'
import { ConfirmModal } from '../../../components/ConfirmModal'
import { DataTable } from '../../../components/DataTable'
import { InfoCard } from '../../../components/InfoCard'
import { Modal } from '../../../components/Modal'
import { StatusBadge } from '../../../components/StatusBadge'
import type { ActionState } from '../../../models/detailViews'
import type { ReportRow } from '../../../models/rows'
import type { ReportDecision } from '../../../queries/detailMutations'

interface ReportInfoTabProps {
  reports: ReportRow[]
  requestStatusLabel: string
  action: ActionState
  /** 성공했을 때만 resolve된다. 모달은 성공했을 때만 닫는다. */
  onReview: (reportId: string, decision: ReportDecision) => Promise<void>
}

export function ReportInfoTab({
  reports,
  requestStatusLabel,
  action,
  onReview,
}: ReportInfoTabProps) {
  const [detailReport, setDetailReport] = useState<ReportRow | null>(null)
  const [processTarget, setProcessTarget] = useState<ReportRow | null>(null)

  const alreadyCancelled = requestStatusLabel === '취소'

  const review = (decision: ReportDecision) => {
    if (processTarget === null) {
      return
    }
    onReview(processTarget.reportId, decision).then(
      () => setProcessTarget(null),
      // 실패는 `action.error`로 이미 모달에 그려진다. 모달은 열린 채로 둔다.
      () => {},
    )
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
              <StatusBadge label={report.statusLabel} shape="pill" />
            ),
          },
          {
            key: 'action',
            header: '처리',
            width: '110px',
            render: (report) =>
              report.statusLabel === '미처리' ? (
                <Button
                  size="sm"
                  variant="primary"
                  disabled={action.disabled || action.pending}
                  onClick={(event) => {
                    event.stopPropagation()
                    action.reset()
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

      {action.disabledReason === null ? null : (
        <p className="or-help-text">{action.disabledReason}</p>
      )}

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
                    <StatusBadge label={detailReport.statusLabel} shape="pill" />
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
        description={
          alreadyCancelled
            ? `신고 #${processTarget?.reportId ?? ''}을 승인해도 요청은 이미 취소 상태입니다. 반려하면 요청 상태는 그대로입니다.`
            : `신고 #${processTarget?.reportId ?? ''}을 승인하면 요청도 취소로 변경됩니다. 반려하면 요청 상태는 그대로입니다.`
        }
        confirmLabel="처리 완료"
        closeLabel="닫기"
        rejectLabel="반려"
        disabled={action.pending}
        error={action.error}
        onReject={() => review('reject')}
        onClose={
          action.pending
            ? () => {}
            : () => {
                action.reset()
                setProcessTarget(null)
              }
        }
        onConfirm={() => review('accept')}
      >
        <div className="or-panel">
          <div className="or-kv-row">
            <span className="or-kv-label">요청 상태</span>
            {alreadyCancelled ? (
              <StatusBadge label={requestStatusLabel} />
            ) : (
              <span className="or-transition">
                <StatusBadge label={requestStatusLabel} />
                <span className="or-transition-arrow">→</span>
                <StatusBadge label="취소" />
              </span>
            )}
          </div>
        </div>
        <ul className="or-notice-list">
          <li>연결된 지원·미션 상태는 바뀌지 않습니다.</li>
        </ul>
      </ConfirmModal>
    </>
  )
}
