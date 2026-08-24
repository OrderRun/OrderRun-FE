import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/PageHeader'
import { QuerySection } from '../../components/QuerySection'
import type { SummaryCardKey } from '../../models/summaryCards'
import { createSummaryCards, parseSummaryCardKey } from '../../models/summaryCards'
import { useQueryState } from '../../hooks/useQueryState'
import {
  useAdminSummaryQuery,
  usePendingDisputesQuery,
  usePendingRefundsQuery,
  usePendingReportsQuery,
  usePendingSettlementsQuery,
  useUnpaidRequestsQuery,
} from '../../queries/dashboardQueries'
import { toQueryErrorMessage } from '../../components/queryFeedback'
import { requestDetailPath } from '../../routes/paths'
import { DisputeTable } from '../disputes/DisputeTable'
import { MissionTable } from '../missions/MissionTable'
import { RefundTable } from '../refunds/RefundTable'
import { ReportTable } from '../reports/ReportTable'
import { RequestTable } from '../requests/RequestTable'

const QUERY_DEFAULTS = { card: '' }

const ZERO_COUNTS: Record<SummaryCardKey, number> = {
  unpaid: 0,
  dispute: 0,
  refund: 0,
  settlement: 0,
  report: 0,
}

/**
 * 대시보드는 처리가 필요한 항목만 모아 보여준다. 섹션마다 쿼리를 독립적으로
 * 그리므로 한 섹션이 실패해도 나머지는 그대로 보인다. 카드 수치는 목록 길이가
 * 아니라 summary 응답의 카운트를 쓴다.
 */
export function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const selectedCard = parseSummaryCardKey(get('card'))

  const summaryQuery = useAdminSummaryQuery()
  const requestsQuery = useUnpaidRequestsQuery()
  const disputesQuery = usePendingDisputesQuery()
  const refundsQuery = usePendingRefundsQuery()
  const settlementsQuery = usePendingSettlementsQuery()
  const reportsQuery = usePendingReportsQuery()

  const summary = summaryQuery.data
  const summaryCards = useMemo(
    () =>
      createSummaryCards(
        summary === undefined
          ? ZERO_COUNTS
          : {
              unpaid: summary.unpaidCount,
              dispute: summary.disputeCount,
              refund: summary.refundCount,
              settlement: summary.settlementCount,
              report: summary.reportCount,
            },
      ),
    [summary],
  )

  const shows = (card: SummaryCardKey) =>
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

      {summaryQuery.isPending ? (
        <p className="or-section-state-message" role="status">
          요약 정보를 불러오는 중입니다.
        </p>
      ) : summaryQuery.isError ? (
        <p className="or-section-state-message" role="alert">
          {toQueryErrorMessage(summaryQuery.error)}
        </p>
      ) : (
        <div className="or-summary-grid">
          {summaryCards.map((card) => (
            <button
              type="button"
              className="or-card or-summary-card"
              key={card.key}
              aria-pressed={selectedCard === card.key}
              onClick={() => set('card', selectedCard === card.key ? '' : card.key)}
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
      )}

      {shows('unpaid') ? (
        <QuerySection
          title="미입금 요청"
          count={requestsQuery.data?.length ?? null}
          isPending={requestsQuery.isPending}
          isError={requestsQuery.isError}
          error={requestsQuery.error}
          onRetry={() => void requestsQuery.refetch()}
        >
          <RequestTable
            rows={requestsQuery.data ?? []}
            emptyMessage="입금 확인이 필요한 요청이 없습니다."
            emptyHint={filterHint}
            onRowClick={(row) =>
              navigate(requestDetailPath(row.proposalId), { state: originState })
            }
          />
        </QuerySection>
      ) : null}

      {shows('dispute') ? (
        <QuerySection
          title="분쟁"
          count={disputesQuery.data?.length ?? null}
          isPending={disputesQuery.isPending}
          isError={disputesQuery.isError}
          error={disputesQuery.error}
          onRetry={() => void disputesQuery.refetch()}
        >
          <DisputeTable
            rows={disputesQuery.data ?? []}
            emptyMessage="처리할 분쟁이 없습니다."
            emptyHint={filterHint}
            onRowClick={(row) =>
              navigate(requestDetailPath(row.proposalId, 'dispute'), {
                state: originState,
              })
            }
          />
        </QuerySection>
      ) : null}

      {shows('refund') ? (
        <QuerySection
          title="환불"
          count={refundsQuery.data?.length ?? null}
          isPending={refundsQuery.isPending}
          isError={refundsQuery.isError}
          error={refundsQuery.error}
          onRetry={() => void refundsQuery.refetch()}
        >
          <RefundTable
            rows={refundsQuery.data ?? []}
            emptyMessage="처리할 환불이 없습니다."
            emptyHint={filterHint}
            onRowClick={(row) =>
              navigate(requestDetailPath(row.proposalId, 'refund'), {
                state: originState,
              })
            }
          />
        </QuerySection>
      ) : null}

      {shows('settlement') ? (
        <QuerySection
          title="미션 완료"
          count={settlementsQuery.data?.length ?? null}
          isPending={settlementsQuery.isPending}
          isError={settlementsQuery.isError}
          error={settlementsQuery.error}
          onRetry={() => void settlementsQuery.refetch()}
        >
          <MissionTable
            rows={settlementsQuery.data ?? []}
            emptyMessage="수행비 입금이 필요한 미션이 없습니다."
            emptyHint={filterHint}
            onRowClick={(row) =>
              navigate(requestDetailPath(row.proposalId, 'mission'), {
                state: originState,
              })
            }
          />
        </QuerySection>
      ) : null}

      {shows('report') ? (
        <QuerySection
          title="신고"
          count={reportsQuery.data?.length ?? null}
          isPending={reportsQuery.isPending}
          isError={reportsQuery.isError}
          error={reportsQuery.error}
          onRetry={() => void reportsQuery.refetch()}
        >
          <ReportTable
            rows={reportsQuery.data ?? []}
            emptyMessage="처리할 신고가 없습니다."
            emptyHint={filterHint}
            onRowClick={(row) =>
              navigate(requestDetailPath(row.proposalId, 'report'), {
                state: originState,
              })
            }
          />
        </QuerySection>
      ) : null}
    </>
  )
}
