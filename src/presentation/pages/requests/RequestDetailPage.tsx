import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { ActorName } from '../../components/ActorName'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { InfoCard } from '../../components/InfoCard'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { StatusBadge } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { formatAmount } from '../../components/formatters'
import { toQueryErrorMessage } from '../../components/queryFeedback'
import type { ActionState } from '../../models/detailViews'
import {
  DETAIL_PAGE_SIZE,
  isMockDetailMode,
  toNumericId,
  useMissionDetailQuery,
  usePayoutDetailQuery,
  useProposalDetailQuery,
  useProposalDisputeQuery,
  useProposalOffersQuery,
  useProposalReportsQuery,
  useRefundDetailQuery,
} from '../../queries/detailQueries'
import {
  useCancelProposal,
  useConfirmPayment,
  usePayoutComplete,
  usePayoutReject,
  useRefundComplete,
  useRefundReject,
  useRejectDispute,
  useResolveDispute,
  useReviewReport,
} from '../../queries/detailMutations'
import type { ReportDecision } from '../../queries/detailMutations'
import {
  DEFAULT_ORIGIN_PATH,
  originLabelOf,
  readOriginPath,
} from '../../routes/listOrigin'
import { CancelRequestConfirmModal } from './modals/CancelRequestConfirmModal'
import { StatusChangeModal } from './modals/StatusChangeModal'
import { DisputeInfoTab } from './tabs/DisputeInfoTab'
import { MissionInfoTab } from './tabs/MissionInfoTab'
import { OfferListTab } from './tabs/OfferListTab'
import { RefundInfoTab } from './tabs/RefundInfoTab'
import { ReportInfoTab } from './tabs/ReportInfoTab'
import { REQUEST_TABS, parseRequestTab } from './requestTabs'

/**
 * 요청 상세. **처리 결과를 로컬 상태로 흉내내지 않는다.** 요청·지원·미션 중
 * 무엇이 함께 바뀌는지는 서버만 알고(요청 취소는 지원까지, 신고 승인은 요청만),
 * 화면은 mutation 성공 → 무효화 → 재조회 결과만 그린다.
 *
 * 남는 로컬 상태는 모달 열림 플래그, 탭 쿼리스트링, 두 목록의 페이지뿐이다.
 */

const MOCK_ACTION_NOTICE = '목 모드에서는 처리할 수 없습니다.'

interface MutationLike {
  isPending: boolean
  error: unknown
  reset: () => void
}

function firstErrorMessage(mutations: MutationLike[]): string | null {
  const failed = mutations.find((mutation) => mutation.error !== null)
  return failed === undefined ? null : toQueryErrorMessage(failed.error)
}

/** 목 모드에서는 서버 전이를 흉내 낼 수 없어 처리 자체를 막는다. */
function toActionState(mutations: MutationLike[], mockMode: boolean): ActionState {
  return {
    pending: mutations.some((mutation) => mutation.isPending),
    error: firstErrorMessage(mutations),
    disabled: mockMode,
    disabledReason: mockMode ? MOCK_ACTION_NOTICE : null,
    reset: () => mutations.forEach((mutation) => mutation.reset()),
  }
}

function RequestDetailView({ proposalId }: { proposalId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const activeTab = parseRequestTab(searchParams.get('tab'))
  const originPath = readOriginPath(location.state) ?? DEFAULT_ORIGIN_PATH
  const originLabel = originLabelOf(originPath)
  const mockMode = isMockDetailMode()
  const numericProposalId = toNumericId(proposalId)

  const [offerPage, setOfferPage] = useState(0)
  const [reportPage, setReportPage] = useState(0)
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  const requestQuery = useProposalDetailQuery(proposalId)
  const request = requestQuery.data ?? null
  const missionId = request?.missionId ?? null

  const offersQuery = useProposalOffersQuery(proposalId, offerPage)
  const missionQuery = useMissionDetailQuery(proposalId, missionId)
  const mission = missionQuery.data ?? null
  const disputeQuery = useProposalDisputeQuery(proposalId)
  const dispute = disputeQuery.data ?? null
  const refundQuery = useRefundDetailQuery(
    proposalId,
    missionId,
    mission?.refundTarget ?? false,
  )
  const payoutQuery = usePayoutDetailQuery(
    proposalId,
    missionId,
    mission?.payoutTarget ?? false,
  )
  const reportsQuery = useProposalReportsQuery(proposalId, reportPage)

  const confirmPayment = useConfirmPayment()
  const cancelProposal = useCancelProposal()
  const resolveDispute = useResolveDispute()
  const rejectDispute = useRejectDispute()
  const refundComplete = useRefundComplete()
  const refundReject = useRefundReject()
  const payoutComplete = usePayoutComplete()
  const payoutReject = usePayoutReject()
  const reviewReport = useReviewReport()

  const disputeAction = toActionState([resolveDispute, rejectDispute], mockMode)
  const refundAction = toActionState([refundComplete, refundReject], mockMode)
  const payoutAction = toActionState([payoutComplete, payoutReject], mockMode)
  const reportAction = toActionState([reviewReport], mockMode)

  if (requestQuery.isLoading || requestQuery.isError) {
    return (
      <>
        <Link className="or-backlink" to={originPath}>
          ← {originLabel}
        </Link>
        <QuerySection
          title={`요청 #${proposalId}`}
          isPending={requestQuery.isLoading}
          isError={requestQuery.isError}
          error={requestQuery.error}
          onRetry={() => void requestQuery.refetch()}
        >
          {null}
        </QuerySection>
      </>
    )
  }

  if (request === null) {
    return (
      <>
        <Link className="or-backlink" to={originPath}>
          ← {originLabel}
        </Link>
        <section className="or-card">
          <EmptyState
            message="요청을 찾을 수 없습니다."
            hint="요청 관리 목록에서 다시 선택해 주세요."
          />
        </section>
      </>
    )
  }

  const offerCount = offersQuery.data?.totalElements ?? 0

  /** 처리 성공 시에만 resolve한다. 모달은 이 promise를 보고 닫는다. */
  const runDisputeResolve = (outcome: 'COMPLETED' | 'FAILED', adminNote: string) => {
    if (dispute === null) {
      return Promise.reject(new Error('처리할 분쟁이 없습니다.'))
    }
    return resolveDispute
      .mutateAsync({ disputeId: Number(dispute.disputeId), outcome, adminNote })
      .then(() => undefined)
  }

  const runDisputeReject = (adminNote: string) => {
    if (dispute === null) {
      return Promise.reject(new Error('처리할 분쟁이 없습니다.'))
    }
    return rejectDispute
      .mutateAsync({ disputeId: Number(dispute.disputeId), adminNote })
      .then(() => undefined)
  }

  const runRefund = (adminNote: string, reject: boolean) => {
    if (missionId === null) {
      return Promise.reject(new Error('환불 대상 미션이 없습니다.'))
    }
    const mutation = reject ? refundReject : refundComplete
    return mutation.mutateAsync({ refundId: missionId, adminNote }).then(() => undefined)
  }

  const runPayout = (adminNote: string, reject: boolean) => {
    if (missionId === null) {
      return Promise.reject(new Error('지급 대상 미션이 없습니다.'))
    }
    const mutation = reject ? payoutReject : payoutComplete
    return mutation.mutateAsync({ payoutId: missionId, adminNote }).then(() => undefined)
  }

  const runReportReview = (reportId: string, decision: ReportDecision) =>
    reviewReport
      .mutateAsync({ reportId: Number(reportId), decision })
      .then(() => undefined)

  const handleConfirmPayment = (openChatUrl: string) => {
    if (numericProposalId === null) {
      return
    }
    confirmPayment.mutate(
      { proposalId: numericProposalId, openChatUrl },
      { onSuccess: () => setStatusModalOpen(false) },
    )
  }

  const handleCancelRequest = (adminNote: string) => {
    if (numericProposalId === null) {
      return
    }
    cancelProposal.mutate(
      { proposalId: numericProposalId, adminNote },
      { onSuccess: () => setCancelModalOpen(false) },
    )
  }

  return (
    <>
      <div>
        <Link className="or-backlink" to={originPath}>
          ← {originLabel}
        </Link>
        <PageHeader
          title={`요청 #${request.proposalId}`}
          actions={
            <>
              {request.canConfirmPayment ? (
                <Button
                  variant="primary"
                  disabled={mockMode}
                  onClick={() => {
                    confirmPayment.reset()
                    setStatusModalOpen(true)
                  }}
                >
                  입금 확인
                </Button>
              ) : null}
              {request.canCancel ? (
                <Button
                  variant="destructive"
                  disabled={mockMode}
                  onClick={() => {
                    cancelProposal.reset()
                    setCancelModalOpen(true)
                  }}
                >
                  요청 취소
                </Button>
              ) : null}
              {mockMode && (request.canConfirmPayment || request.canCancel) ? (
                <span className="or-help-text">{MOCK_ACTION_NOTICE}</span>
              ) : null}
            </>
          }
        />
      </div>

      <InfoCard
        title="기본 정보"
        items={[
          {
            label: '행님',
            value: (
              <ActorName
                name={request.hyungnimName}
                id={request.hyungnimId}
                variant="plain"
              />
            ),
          },
          { label: '요청 생성일', value: request.createdAt },
          {
            label: '요청 상태',
            value: <StatusBadge label={request.statusLabel} />,
          },
          { label: '요청 금액', value: formatAmount(request.amount) },
        ]}
      />

      <InfoCard
        title="추가 정보"
        items={[
          {
            label: '요청 제목',
            value: request.title ?? <span className="or-flag-off">해당 없음</span>,
          },
          {
            label: '마감 기한',
            value: request.deadline ?? <span className="or-flag-off">해당 없음</span>,
          },
          {
            label: '요청 내용',
            value: request.content ?? <span className="or-flag-off">해당 없음</span>,
            newRow: true,
          },
        ]}
      />

      <section className="or-card">
        <Tabs
          items={REQUEST_TABS}
          activeKey={activeTab}
          onChange={(key) =>
            setSearchParams(
              { tab: key },
              { replace: true, state: location.state },
            )
          }
        />
        <div className="or-card-body">
          {activeTab === 'offers' ? (
            <QuerySection
              header={null}
              isPending={offersQuery.isLoading}
              isError={offersQuery.isError}
              error={offersQuery.error}
              onRetry={() => void offersQuery.refetch()}
              footer={
                <Pagination
                  page={offerPage}
                  totalPages={offersQuery.data?.totalPages ?? 0}
                  totalElements={offerCount}
                  pageSize={offersQuery.data?.pageSize ?? DETAIL_PAGE_SIZE}
                  onChange={setOfferPage}
                />
              }
            >
              <OfferListTab
                offers={offersQuery.data?.rows ?? []}
                selectedOfferId={request.acceptedOfferId}
              />
            </QuerySection>
          ) : null}

          {activeTab === 'mission' ? (
            <QuerySection
              header={null}
              isPending={missionQuery.isLoading || payoutQuery.isLoading}
              isError={missionQuery.isError || payoutQuery.isError}
              error={missionQuery.error ?? payoutQuery.error}
              onRetry={() => {
                void missionQuery.refetch()
                void payoutQuery.refetch()
              }}
            >
              <MissionInfoTab
                mission={mission}
                payout={payoutQuery.data ?? null}
                openChatUrl={mission?.openChatUrl ?? null}
                requestStatusLabel={request.statusLabel}
                action={payoutAction}
                onPayout={(note) => runPayout(note, false)}
                onPayoutReject={(note) => runPayout(note, true)}
              />
            </QuerySection>
          ) : null}

          {activeTab === 'dispute' ? (
            <QuerySection
              header={null}
              isPending={disputeQuery.isLoading}
              isError={disputeQuery.isError}
              error={disputeQuery.error}
              onRetry={() => void disputeQuery.refetch()}
            >
              <DisputeInfoTab
                dispute={dispute}
                missionStatusLabel={mission?.statusLabel ?? null}
                action={disputeAction}
                onResolve={runDisputeResolve}
                onReject={runDisputeReject}
              />
            </QuerySection>
          ) : null}

          {activeTab === 'refund' ? (
            <QuerySection
              header={null}
              isPending={refundQuery.isLoading}
              isError={refundQuery.isError}
              error={refundQuery.error}
              onRetry={() => void refundQuery.refetch()}
            >
              <RefundInfoTab
                refund={refundQuery.data ?? null}
                action={refundAction}
                onProcess={(note) => runRefund(note, false)}
                onReject={(note) => runRefund(note, true)}
              />
            </QuerySection>
          ) : null}

          {activeTab === 'report' ? (
            <QuerySection
              header={null}
              isPending={reportsQuery.isLoading}
              isError={reportsQuery.isError}
              error={reportsQuery.error}
              onRetry={() => void reportsQuery.refetch()}
              footer={
                <Pagination
                  page={reportPage}
                  totalPages={reportsQuery.data?.totalPages ?? 0}
                  totalElements={reportsQuery.data?.totalElements ?? 0}
                  pageSize={reportsQuery.data?.pageSize ?? DETAIL_PAGE_SIZE}
                  onChange={setReportPage}
                />
              }
            >
              <ReportInfoTab
                reports={reportsQuery.data?.rows ?? []}
                requestStatusLabel={request.statusLabel}
                action={reportAction}
                onReview={runReportReview}
              />
            </QuerySection>
          ) : null}
        </div>
      </section>

      {request.canConfirmPayment ? (
        <StatusChangeModal
          open={statusModalOpen}
          title="입금 확인"
          confirmLabel="입금 확인"
          proposalId={request.proposalId}
          currentStatus={request.statusLabel}
          nextStatus="대기중"
          requiresOpenChatUrl
          depositAccount={request.depositAccount}
          depositAccountHolder={request.depositAccountHolder}
          depositorName={request.depositorName}
          guide="입금을 확인한 뒤 진행해주세요."
          pending={confirmPayment.isPending}
          error={
            confirmPayment.error === null
              ? null
              : toQueryErrorMessage(confirmPayment.error)
          }
          onClose={() => {
            confirmPayment.reset()
            setStatusModalOpen(false)
          }}
          onConfirm={handleConfirmPayment}
        />
      ) : null}

      <CancelRequestConfirmModal
        open={cancelModalOpen}
        proposalId={request.proposalId}
        currentStatus={request.statusLabel}
        offerCount={offerCount}
        hasMission={missionId !== null}
        refundRequired={request.refundRequired}
        pending={cancelProposal.isPending}
        error={
          cancelProposal.error === null
            ? null
            : toQueryErrorMessage(cancelProposal.error)
        }
        onClose={() => {
          cancelProposal.reset()
          setCancelModalOpen(false)
        }}
        onConfirm={handleCancelRequest}
      />
    </>
  )
}

export function RequestDetailPage() {
  const { proposalId = '' } = useParams()
  return <RequestDetailView key={proposalId} proposalId={proposalId} />
}
