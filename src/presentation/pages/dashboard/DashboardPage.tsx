import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import {
  createDemoSummaryCards,
  parseSummaryCardKey,
} from '../../demo/demoDashboard'
import { DEMO_DISPUTES } from '../../demo/demoDisputes'
import { DEMO_MISSIONS } from '../../demo/demoMissions'
import { DEMO_PROPOSAL_REPORTS } from '../../demo/demoProposalReports'
import { DEMO_REFUNDS } from '../../demo/demoRefunds'
import { DEMO_REQUEST_SUMMARIES } from '../../demo/demoSelectors'
import type { DemoSummaryCardKey } from '../../demo/demoTypes'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'
import { DisputeTable } from '../disputes/DisputeTable'
import { MissionTable } from '../missions/MissionTable'
import { RefundTable } from '../refunds/RefundTable'
import { ReportTable } from '../reports/ReportTable'
import { RequestTable } from '../requests/RequestTable'

const QUERY_DEFAULTS = { card: '' }

/** 대시보드는 처리가 필요한 항목만 모아 보여준다. */
const UNPAID_REQUESTS = DEMO_REQUEST_SUMMARIES.filter(
  (summary) => summary.request.status === '미입금',
)
const PENDING_DISPUTES = DEMO_DISPUTES.filter(
  (dispute) => dispute.status === '미처리',
)
const PENDING_REFUNDS = DEMO_REFUNDS.filter(
  (refund) => refund.status === '미처리',
)
const PENDING_SETTLEMENTS = DEMO_MISSIONS.filter(
  (mission) => mission.status === '완료' && mission.settlementStatus === '미처리',
)
const PENDING_REPORTS = DEMO_PROPOSAL_REPORTS.filter(
  (report) => report.reportStatus === '미처리',
)

const CARD_COUNTS: Record<DemoSummaryCardKey, number> = {
  unpaid: UNPAID_REQUESTS.length,
  dispute: PENDING_DISPUTES.length,
  refund: PENDING_REFUNDS.length,
  settlement: PENDING_SETTLEMENTS.length,
  report: PENDING_REPORTS.length,
}

export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const selectedCard = parseSummaryCardKey(get('card'))

  const summaryCards = useMemo(() => createDemoSummaryCards(CARD_COUNTS), [])
  const shows = (card: DemoSummaryCardKey) =>
    selectedCard === null || selectedCard === card

  const originState = { from: location.pathname + location.search }
  const filterHint =
    selectedCard === null ? undefined : '카드를 다시 눌러 전체 목록을 볼 수 있습니다.'

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
            <span className="or-summary-label">{card.label}</span>
            <span className="or-summary-value">
              {card.value}
              <span className="or-summary-unit">건</span>
            </span>
            <span className="or-summary-hint">{card.hint}</span>
          </button>
        ))}
      </div>

      {shows('unpaid') ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">미입금 요청</h2>
            <span className="or-result-count">{UNPAID_REQUESTS.length}건</span>
          </div>
          <RequestTable
            rows={UNPAID_REQUESTS}
            emptyMessage="입금 확인이 필요한 요청이 없습니다."
            emptyHint={filterHint}
            onRowClick={(summary) =>
              navigate(requestDetailPath(summary.request.proposalId), {
                state: originState,
              })
            }
          />
        </section>
      ) : null}

      {shows('dispute') ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">분쟁</h2>
            <span className="or-result-count">{PENDING_DISPUTES.length}건</span>
          </div>
          <DisputeTable
            rows={PENDING_DISPUTES}
            emptyMessage="처리할 분쟁이 없습니다."
            emptyHint={filterHint}
            onRowClick={(dispute) =>
              navigate(requestDetailPath(dispute.proposalId, 'dispute'), {
                state: originState,
              })
            }
          />
        </section>
      ) : null}

      {shows('refund') ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">환불</h2>
            <span className="or-result-count">{PENDING_REFUNDS.length}건</span>
          </div>
          <RefundTable
            rows={PENDING_REFUNDS}
            emptyMessage="처리할 환불이 없습니다."
            emptyHint={filterHint}
            onRowClick={(refund) =>
              navigate(requestDetailPath(refund.proposalId, 'refund'), {
                state: originState,
              })
            }
          />
        </section>
      ) : null}

      {shows('settlement') ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">미션 완료</h2>
            <span className="or-result-count">
              {PENDING_SETTLEMENTS.length}건
            </span>
          </div>
          <MissionTable
            rows={PENDING_SETTLEMENTS}
            emptyMessage="수행비 입금이 필요한 미션이 없습니다."
            emptyHint={filterHint}
            onRowClick={(mission) =>
              navigate(requestDetailPath(mission.proposalId, 'mission'), {
                state: originState,
              })
            }
          />
        </section>
      ) : null}

      {shows('report') ? (
        <section className="or-card">
          <div className="or-card-head">
            <h2 className="or-card-title">신고</h2>
            <span className="or-result-count">{PENDING_REPORTS.length}건</span>
          </div>
          <ReportTable
            rows={PENDING_REPORTS}
            emptyMessage="처리할 신고가 없습니다."
            emptyHint={filterHint}
            onRowClick={(report) =>
              navigate(requestDetailPath(report.proposalId, 'report'), {
                state: originState,
              })
            }
          />
        </section>
      ) : null}
    </>
  )
}
