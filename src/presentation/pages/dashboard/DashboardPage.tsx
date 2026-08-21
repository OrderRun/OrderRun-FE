import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { ConfirmModal } from '../../components/ConfirmModal'
import { DataTable } from '../../components/DataTable'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import {
  createDemoSummaryCards,
  DEMO_CARD_TASK_STATUS,
  DEMO_TASK_ITEMS,
  parseSummaryCardKey,
} from '../../demo/demoDashboard'
import { DEMO_PROPOSAL_REPORTS } from '../../demo/demoProposalReports'
import {
  findDemoDispute,
  findDemoMission,
  findDemoOffersOf,
  findDemoRequest,
} from '../../demo/demoSelectors'
import type { DemoProposalReport, DemoTaskItem } from '../../demo/demoTypes'
import { useQueryState } from '../../hooks/useQueryState'
import { reportDetailPath, requestDetailPath } from '../../routes/paths'
import { DisputeResolveModal } from '../disputes/modals/DisputeResolveModal'
import { StatusChangeModal } from '../requests/modals/StatusChangeModal'

const QUERY_DEFAULTS = { card: '' }

function taskPath(item: DemoTaskItem): string {
  return item.tab
    ? requestDetailPath(item.proposalId, item.tab)
    : requestDetailPath(item.proposalId)
}

function actionLabel(item: DemoTaskItem): string {
  if (item.type === '요청') {
    return '입금 확인'
  }
  if (item.type === '분쟁') {
    return '분쟁 해결'
  }
  return '환불 처리'
}

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const selectedCard = parseSummaryCardKey(get('card'))
  const [taskItems, setTaskItems] = useState(DEMO_TASK_ITEMS)
  const [proposalReports, setProposalReports] = useState(DEMO_PROPOSAL_REPORTS)
  const [activeTask, setActiveTask] = useState<DemoTaskItem | null>(null)
  const [activeReport, setActiveReport] = useState<DemoProposalReport | null>(
    null,
  )

  const summaryCards = useMemo(
    () => createDemoSummaryCards(taskItems, proposalReports),
    [proposalReports, taskItems],
  )
  const rows = useMemo(() => {
    if (selectedCard === null) {
      return taskItems
    }
    if (selectedCard === 'report') {
      return []
    }
    const status = DEMO_CARD_TASK_STATUS[selectedCard]
    return taskItems.filter((item) => item.status === status)
  }, [selectedCard, taskItems])
  const showTaskItems = selectedCard !== 'report'
  const showProposalReports =
    selectedCard === null || selectedCard === 'report'
  const selectedCardLabel = summaryCards.find(
    (card) => card.key === selectedCard,
  )?.label

  const activeDispute =
    activeTask?.type === '분쟁'
      ? findDemoDispute(activeTask.proposalId)
      : undefined
  const activeRequest = activeTask
    ? findDemoRequest(activeTask.proposalId)
    : undefined
  const activeMission = activeTask
    ? findDemoMission(activeTask.proposalId)
    : undefined
  const activeOffer = activeDispute
    ? findDemoOffersOf(activeDispute.proposalId).find(
        (offer) => offer.offerId === activeDispute.offerId,
      )
    : undefined
  const disputeTargets =
    activeDispute && activeRequest && activeMission && activeOffer
      ? [
          {
            label: '요청',
            id: activeRequest.proposalId,
            currentStatus: activeRequest.status,
          },
          {
            label: '지원',
            id: activeOffer.offerId,
            currentStatus: activeOffer.status,
          },
          {
            label: '미션',
            id: activeMission.missionId,
            currentStatus: activeMission.status,
          },
        ]
      : []

  const openTask = (item: DemoTaskItem) => {
    navigate(taskPath(item), {
      state: { from: location.pathname + location.search },
    })
  }

  const openReport = (report: DemoProposalReport) => {
    navigate(reportDetailPath(report.reportId), {
      state: { from: location.pathname + location.search },
    })
  }

  const completeActiveTask = () => {
    if (!activeTask) {
      return
    }
    setTaskItems((items) =>
      items.filter((item) => item.taskId !== activeTask.taskId),
    )
    setActiveTask(null)
  }

  const cancelActiveProposal = () => {
    if (!activeReport) {
      return
    }
    setProposalReports((reports) =>
      reports.filter((report) => report.reportId !== activeReport.reportId),
    )
    setActiveReport(null)
  }

  return (
    <>
      <PageHeader
        title="대시보드"
        description="관리자가 확인하고 처리해야 할 항목을 한눈에 확인할 수 있습니다."
      />

      <div className="or-summary-grid">
        {summaryCards.map((card) => (
          <button
            type="button"
            className="or-card or-summary-card"
            key={card.key}
            aria-pressed={selectedCard === card.key}
            onClick={() =>
              set('card', selectedCard === card.key ? '' : card.key)
            }
          >
            <span className="or-summary-label">
              <StatusBadge label={card.label} />
            </span>
            <span className="or-summary-value">{card.value}</span>
            <span className="or-summary-hint">{card.hint}</span>
          </button>
        ))}
      </div>

      {showTaskItems ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">
              {selectedCardLabel
                ? `${selectedCardLabel} 처리 항목`
                : '처리 필요한 항목'}
            </h2>
            <span className="or-result-count">{rows.length}건</span>
          </div>
          <DataTable
            rows={rows}
            rowKey={(item) => item.taskId}
            emptyMessage={
              selectedCard === null
                ? '처리할 항목이 없습니다.'
                : `처리할 ${selectedCardLabel ?? ''} 항목이 없습니다.`
            }
            emptyHint={
              selectedCard === null
                ? undefined
                : '카드를 다시 눌러 전체 목록을 볼 수 있습니다.'
            }
            onRowClick={openTask}
            columns={[
            {
              key: 'type',
              header: '유형',
              width: '80px',
              render: (item) => item.type,
            },
            {
              key: 'id',
              header: 'Proposal ID',
              width: '120px',
              render: (item) => (
                <span className="or-cell-id">{item.proposalId}</span>
              ),
            },
            {
              key: 'status',
              header: '현재 상태',
              width: '120px',
              render: (item) => <StatusBadge label={item.status} />,
            },
            {
              key: 'content',
              header: '관리자 작업',
              render: (item) => item.content,
            },
            {
              key: 'occurredAt',
              header: '발생 시각',
              width: '150px',
              render: (item) => (
                <span className="or-cell-muted">{item.occurredAt}</span>
              ),
            },
            {
              key: 'action',
              header: '처리',
              width: '110px',
              render: (item) => (
                <Button
                  size="sm"
                  variant="primary"
                  onClick={(event) => {
                    event.stopPropagation()
                    setActiveTask(item)
                  }}
                >
                  {actionLabel(item)}
                </Button>
              ),
            },
            ]}
          />
        </section>
      ) : null}

      {showProposalReports ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">신고된 Proposal</h2>
            <span className="or-result-count">{proposalReports.length}건</span>
          </div>
          <DataTable
            rows={proposalReports}
            rowKey={(report) => report.reportId}
            emptyMessage="처리할 Proposal 신고가 없습니다."
            emptyHint={
              selectedCard === 'report'
                ? '신고 카드를 다시 눌러 전체 목록을 볼 수 있습니다.'
                : undefined
            }
            onRowClick={openReport}
            columns={[
            {
              key: 'reportId',
              header: '신고 ID',
              width: '95px',
              render: (report) => (
                <span className="or-cell-id">{report.reportId}</span>
              ),
            },
            {
              key: 'proposalId',
              header: 'Proposal ID',
              width: '115px',
              render: (report) => (
                <span className="or-cell-id">{report.proposalId}</span>
              ),
            },
            {
              key: 'reason',
              header: '신고 내용',
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
              key: 'reportedAt',
              header: '신고일',
              width: '145px',
              render: (report) => (
                <span className="or-cell-muted">{report.reportedAt}</span>
              ),
            },
            {
              key: 'action',
              header: '처리',
              width: '110px',
              render: (report) => (
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={(event) => {
                    event.stopPropagation()
                    setActiveReport(report)
                  }}
                >
                  Proposal 취소
                </Button>
              ),
            },
            ]}
          />
        </section>
      ) : null}

      <StatusChangeModal
        open={activeTask?.type === '요청'}
        proposalId={activeTask?.proposalId ?? ''}
        currentStatus="미입금"
        nextStatus="대기중"
        guide="입금을 확인한 뒤 상태를 변경해주세요."
        onClose={() => setActiveTask(null)}
        onConfirm={completeActiveTask}
      />

      <DisputeResolveModal
        open={activeTask?.type === '분쟁'}
        disputeId={activeDispute?.disputeId ?? ''}
        targets={disputeTargets}
        onClose={() => setActiveTask(null)}
        onConfirm={completeActiveTask}
      />

      <ConfirmModal
        open={activeTask?.type === '환불'}
        title="환불 처리"
        description={`Proposal #${activeTask?.proposalId ?? ''}의 환불을 완료 처리할까요?`}
        confirmLabel="환불 완료"
        onClose={() => setActiveTask(null)}
        onConfirm={completeActiveTask}
      >
        <span className="or-transition">
          <StatusBadge label="환불 필요" />
          <span className="or-transition-arrow">→</span>
          <StatusBadge label="환불 완료" />
        </span>
      </ConfirmModal>

      <ConfirmModal
        open={activeReport !== null}
        title="Proposal 취소"
        description={`신고된 Proposal #${activeReport?.proposalId ?? ''}을 취소할까요? 이 화면의 임시 데이터에만 반영됩니다.`}
        confirmLabel="Proposal 취소"
        confirmVariant="destructive"
        closeLabel="닫기"
        onClose={() => setActiveReport(null)}
        onConfirm={cancelActiveProposal}
      />
    </>
  )
}
