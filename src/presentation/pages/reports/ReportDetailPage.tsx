import { useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ConfirmModal } from '../../components/ConfirmModal'
import { EmptyState } from '../../components/EmptyState'
import { InfoCard } from '../../components/InfoCard'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { findDemoProposalReport } from '../../demo/demoSelectors'
import type {
  DemoDisputeStatus,
  DemoRequestStatus,
} from '../../demo/demoTypes'
import { originLabelOf, readOriginPath } from '../../routes/listOrigin'
import { PATHS } from '../../routes/paths'

function ReportDetailView({ reportId }: { reportId: string }) {
  const location = useLocation()
  const originPath = readOriginPath(location.state) ?? PATHS.reports
  const originLabel = originLabelOf(originPath)
  const report = findDemoProposalReport(reportId)

  const [reportStatus, setReportStatus] = useState<DemoDisputeStatus>(
    report?.reportStatus ?? '미처리',
  )
  const [proposalStatus, setProposalStatus] = useState<DemoRequestStatus>(
    report?.proposalStatus ?? '대기중',
  )
  const [reportModalOpen, setReportModalOpen] = useState(false)
  const [proposalModalOpen, setProposalModalOpen] = useState(false)

  if (!report) {
    return (
      <>
        <Link className="or-backlink" to={originPath}>
          ← {originLabel}
        </Link>
        <section className="or-card">
          <EmptyState
            message="신고를 찾을 수 없습니다."
            hint="신고 관리 목록에서 다시 선택해 주세요."
          />
        </section>
      </>
    )
  }

  const completeReport = () => {
    if (reportStatus !== '미처리') {
      return
    }
    setReportStatus('처리 완료')
    setReportModalOpen(false)
  }

  const cancelProposal = () => {
    if (proposalStatus === '취소') {
      return
    }
    setProposalStatus('취소')
    setProposalModalOpen(false)
  }

  return (
    <>
      <div>
        <Link className="or-backlink" to={originPath}>
          ← {originLabel}
        </Link>
        <PageHeader
          title={
            <span className="or-title-row">
              신고 #{report.reportId}
              <StatusBadge label={reportStatus} size="lg" />
            </span>
          }
          description="Proposal에 접수된 신고 내용과 상태를 확인합니다."
          actions={
            <>
              {reportStatus === '미처리' ? (
                <Button
                  variant="primary"
                  onClick={() => setReportModalOpen(true)}
                >
                  처리 완료
                </Button>
              ) : null}
              {proposalStatus !== '취소' ? (
                <Button
                  variant="destructive"
                  onClick={() => setProposalModalOpen(true)}
                >
                  Proposal 취소
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      <InfoCard
        title="신고 정보"
        items={[
          { label: '신고 ID', value: report.reportId },
          {
            label: '신고 대상',
            value: `${report.targetType} #${report.proposalId}`,
          },
          {
            label: 'Proposal 상태',
            value: <StatusBadge label={proposalStatus} />,
          },
          { label: '신고자 ID', value: report.reporterId },
          { label: '신고일', value: report.reportedAt },
          {
            label: '신고 여부',
            value: <StatusBadge label={reportStatus} />,
          },
        ]}
      />

      <InfoCard
        title="신고 내용"
        items={[
          { label: '신고 사유', value: report.reasonQuestionText },
          {
            label: '상세 내용',
            value: report.detailReason ?? '추가 상세 내용 없음',
          },
        ]}
      />

      <ConfirmModal
        open={reportModalOpen}
        title="신고 처리 완료"
        description={`신고 #${report.reportId}을 처리 완료로 변경할까요? Proposal 상태는 변경되지 않으며 이 화면의 임시 데이터에만 반영됩니다.`}
        confirmLabel="처리 완료"
        closeLabel="닫기"
        onClose={() => setReportModalOpen(false)}
        onConfirm={completeReport}
      >
        <span className="or-transition">
          <StatusBadge label="미처리" />
          <span className="or-transition-arrow">→</span>
          <StatusBadge label="처리 완료" />
        </span>
      </ConfirmModal>

      <ConfirmModal
        open={proposalModalOpen}
        title="Proposal 취소"
        description={`신고된 Proposal #${report.proposalId}을 취소할까요? 신고 여부는 변경되지 않으며 이 화면의 임시 데이터에만 반영됩니다.`}
        confirmLabel="Proposal 취소"
        confirmVariant="destructive"
        closeLabel="닫기"
        onClose={() => setProposalModalOpen(false)}
        onConfirm={cancelProposal}
      />
    </>
  )
}

export function ReportDetailPage() {
  const { reportId = '' } = useParams()
  return <ReportDetailView key={reportId} reportId={reportId} />
}
