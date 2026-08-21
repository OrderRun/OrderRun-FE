import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { InfoCard } from '../../components/InfoCard'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { formatAmount } from '../../components/formatters'
import {
  findDemoDispute,
  findDemoMission,
  findDemoOffersOf,
  findDemoRefund,
  findDemoReportsOf,
  findDemoRequest,
} from '../../demo/demoSelectors'
import type {
  DemoProcessStatus,
  DemoMissionStatus,
  DemoOfferStatus,
  DemoRequestStatus,
} from '../../demo/demoTypes'
import {
  DEFAULT_ORIGIN_PATH,
  originLabelOf,
  readOriginPath,
} from '../../routes/listOrigin'
import { DEMO_DEPOSIT_ACCOUNT } from '../../demo/demoRequests'
import type { DisputeOutcome } from '../disputes/modals/DisputeResolveModal'
import { CancelRequestConfirmModal } from './modals/CancelRequestConfirmModal'
import { StatusChangeModal } from './modals/StatusChangeModal'
import { DisputeInfoTab } from './tabs/DisputeInfoTab'
import { MissionInfoTab } from './tabs/MissionInfoTab'
import { OfferListTab } from './tabs/OfferListTab'
import { RefundInfoTab } from './tabs/RefundInfoTab'
import { ReportInfoTab } from './tabs/ReportInfoTab'
import { REQUEST_TABS, parseRequestTab } from './requestTabs'

const CANCELLABLE: DemoRequestStatus[] = ['미입금', '대기중']

function nowStamp(): string {
  return new Date().toISOString().slice(0, 16).replace('T', ' ')
}

function RequestDetailView({ proposalId }: { proposalId: string }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const activeTab = parseRequestTab(searchParams.get('tab'))
  const originPath = readOriginPath(location.state) ?? DEFAULT_ORIGIN_PATH
  const originLabel = originLabelOf(originPath)

  const request = findDemoRequest(proposalId)
  const offers = findDemoOffersOf(proposalId)
  const mission = findDemoMission(proposalId)
  const dispute = findDemoDispute(proposalId)
  const refund = findDemoRefund(proposalId)
  const reports = findDemoReportsOf(proposalId)
  const selectedOffer = offers.find((offer) => offer.selected)

  const [status, setStatus] = useState<DemoRequestStatus>(
    request?.status ?? '미입금',
  )
  const [offerStatus, setOfferStatus] = useState<DemoOfferStatus>(
    selectedOffer?.status ?? '대기중',
  )
  const [missionStatus, setMissionStatus] = useState<DemoMissionStatus>(
    mission?.status ?? '진행중',
  )
  const [disputeStatus, setDisputeStatus] = useState<DemoProcessStatus>(
    dispute?.status ?? '미처리',
  )
  const [disputeNote, setDisputeNote] = useState('')
  const [refundStatus, setRefundStatus] = useState<DemoProcessStatus>(
    refund?.status ?? '미처리',
  )
  const [refundProcessedAt, setRefundProcessedAt] = useState<string | null>(
    refund?.processedAt ?? null,
  )
  const [refundNote, setRefundNote] = useState(refund?.adminNote ?? '')
  const [settlementStatus, setSettlementStatus] = useState<DemoProcessStatus>(
    mission?.settlementStatus ?? '미처리',
  )
  const [settledAt, setSettledAt] = useState<string | null>(
    mission?.settledAt ?? null,
  )
  const [payoutNote, setPayoutNote] = useState('')
  const [reportStatusById, setReportStatusById] = useState<
    Record<string, DemoProcessStatus>
  >({})
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)

  if (!request) {
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

  const canConfirmPayment = status === '미입금'
  const canCancel = CANCELLABLE.includes(status)
  const refundRequired = refund !== undefined || status !== '미입금'
  const listedOffers = offers.map((offer) =>
    offer.offerId === selectedOffer?.offerId
      ? { ...offer, status: offerStatus }
      : offer,
  )

  /** 요청 취소는 선택된 지원과 연결된 미션까지 함께 취소한다. */
  const applyCancelCascade = () => {
    setStatus('취소')
    if (selectedOffer) {
      setOfferStatus('취소')
    }
    if (mission) {
      setMissionStatus('취소')
    }
  }

  const handleCancelRequest = () => {
    applyCancelCascade()
    setCancelModalOpen(false)
  }

  const handleConfirmPayment = () => {
    setStatus('대기중')
    setStatusModalOpen(false)
  }

  const handleResolveDispute = (outcome: DisputeOutcome, note: string) => {
    if (outcome === '미션 완료') {
      setStatus('완료')
      if (selectedOffer) {
        setOfferStatus('완료')
      }
      if (mission) {
        setMissionStatus('완료')
      }
    } else {
      applyCancelCascade()
    }
    setDisputeStatus('처리 완료')
    setDisputeNote(note)
  }

  const handleRejectDispute = (note: string) => {
    setDisputeStatus('반려')
    setDisputeNote(note)
  }

  const handleRefundComplete = (note: string) => {
    setRefundStatus('처리 완료')
    setRefundProcessedAt(nowStamp())
    if (note !== '') {
      setRefundNote(note)
    }
    applyCancelCascade()
  }

  const handleRefundReject = (note: string) => {
    setRefundStatus('반려')
    setRefundProcessedAt(nowStamp())
    if (note !== '') {
      setRefundNote(note)
    }
  }

  const handlePayout = (note: string) => {
    setSettlementStatus('처리 완료')
    setSettledAt(nowStamp())
    setPayoutNote(note)
  }

  const handlePayoutReject = (note: string) => {
    setSettlementStatus('반려')
    setSettledAt(nowStamp())
    setPayoutNote(note)
  }

  const handleReportComplete = (reportId: string) => {
    setReportStatusById((current) => ({ ...current, [reportId]: '처리 완료' }))
    applyCancelCascade()
  }

  const handleReportReject = (reportId: string) => {
    setReportStatusById((current) => ({ ...current, [reportId]: '반려' }))
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
              {canConfirmPayment ? (
                <Button
                  variant="primary"
                  onClick={() => setStatusModalOpen(true)}
                >
                  입금 확인
                </Button>
              ) : null}
              {canCancel ? (
                <Button
                  variant="destructive"
                  onClick={() => setCancelModalOpen(true)}
                >
                  요청 취소
                </Button>
              ) : null}
            </>
          }
        />
      </div>

      <InfoCard
        title="기본 정보"
        items={[
          { label: '행님', value: request.hyungnimName },
          { label: '요청 생성일', value: request.createdAt },
          { label: '요청 상태', value: <StatusBadge label={status} /> },
          { label: '요청 금액', value: formatAmount(request.amount) },
          {
            label: '선택된 지원',
            value: selectedOffer ? (
              `지원 #${selectedOffer.offerId} · ${selectedOffer.kkobungName}`
            ) : (
              <span className="or-flag-off">아직 선택된 지원이 없습니다.</span>
            ),
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
            <OfferListTab
              offers={listedOffers}
              selectedOfferId={selectedOffer?.offerId ?? null}
            />
          ) : null}
          {activeTab === 'mission' ? (
            <MissionInfoTab
              mission={
                mission ? { ...mission, status: missionStatus } : undefined
              }
              requestStatus={status}
              settlementStatus={settlementStatus}
              settledAt={settledAt}
              adminNote={payoutNote}
              onPayout={handlePayout}
              onPayoutReject={handlePayoutReject}
            />
          ) : null}
          {activeTab === 'dispute' ? (
            <DisputeInfoTab
              dispute={dispute}
              disputeStatus={disputeStatus}
              adminNote={disputeNote}
              requestStatus={status}
              offerStatus={offerStatus}
              missionStatus={missionStatus}
              onResolve={handleResolveDispute}
              onReject={handleRejectDispute}
            />
          ) : null}
          {activeTab === 'refund' ? (
            <RefundInfoTab
              refund={refund}
              requestStatus={status}
              refundStatus={refundStatus}
              processedAt={refundProcessedAt}
              adminNote={refundNote}
              onProcess={handleRefundComplete}
              onReject={handleRefundReject}
            />
          ) : null}
          {activeTab === 'report' ? (
            <ReportInfoTab
              reports={reports}
              requestStatus={status}
              statusById={reportStatusById}
              onComplete={handleReportComplete}
              onReject={handleReportReject}
            />
          ) : null}
        </div>
      </section>

      {canConfirmPayment ? (
        <StatusChangeModal
          open={statusModalOpen}
          title="입금 확인"
          confirmLabel="입금 확인"
          proposalId={request.proposalId}
          currentStatus={status}
          nextStatus="대기중"
          requiresOpenChatUrl
          depositAccount={DEMO_DEPOSIT_ACCOUNT}
          depositorName={request.depositorName}
          guide="입금을 확인한 뒤 진행해주세요."
          onClose={() => setStatusModalOpen(false)}
          onConfirm={handleConfirmPayment}
        />
      ) : null}

      <CancelRequestConfirmModal
        open={cancelModalOpen}
        proposalId={request.proposalId}
        currentStatus={status}
        offerCount={offers.length}
        hasMission={mission !== undefined}
        refundRequired={refundRequired}
        onClose={() => setCancelModalOpen(false)}
        onConfirm={handleCancelRequest}
      />
    </>
  )
}

export function RequestDetailPage() {
  const { proposalId = '' } = useParams()
  return <RequestDetailView key={proposalId} proposalId={proposalId} />
}
