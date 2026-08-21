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
  const [statusModalOpen, setStatusModalOpen] = useState(false)
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelWithMissionOpen, setCancelWithMissionOpen] = useState(false)

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

  const handleCancelRequest = () => {
    setStatus('취소')
    setOfferStatus('취소')
    setCancelModalOpen(false)
  }

  const handleCancelWithMission = () => {
    setStatus('취소')
    setOfferStatus('취소')
    setMissionStatus('취소')
    setCancelWithMissionOpen(false)
  }

  const handleConfirmPayment = () => {
    setStatus('대기중')
    setStatusModalOpen(false)
  }

  const handleResolveDispute = (outcome: DisputeOutcome) => {
    if (outcome === '미션 완료') {
      setStatus('완료')
      setOfferStatus('완료')
      setMissionStatus('완료')
    } else {
      setStatus('취소')
      setOfferStatus('취소')
      setMissionStatus('취소')
    }
    setDisputeStatus('처리 완료')
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
                  onClick={() =>
                    mission
                      ? setCancelWithMissionOpen(true)
                      : setCancelModalOpen(true)
                  }
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
              offers={offers}
              selectedOfferId={selectedOffer?.offerId ?? null}
            />
          ) : null}
          {activeTab === 'mission' ? (
            <MissionInfoTab
              mission={
                mission ? { ...mission, status: missionStatus } : undefined
              }
              requestStatus={status}
            />
          ) : null}
          {activeTab === 'dispute' ? (
            <DisputeInfoTab
              dispute={dispute}
              disputeStatus={disputeStatus}
              requestStatus={status}
              offerStatus={offerStatus}
              missionStatus={missionStatus}
              onResolve={handleResolveDispute}
              onReject={() => setDisputeStatus('반려')}
            />
          ) : null}
          {activeTab === 'refund' ? (
            <RefundInfoTab
              refund={refund}
              requestStatus={status}
              onRequestCancel={() => setStatus('취소')}
            />
          ) : null}
          {activeTab === 'report' ? (
            <ReportInfoTab
              reports={reports}
              requestStatus={status}
              onRequestCancel={() => setStatus('취소')}
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

      <StatusChangeModal
        open={cancelWithMissionOpen}
        proposalId={request.proposalId}
        currentStatus={status}
        nextStatus="취소"
        destructive
        notices={[
          `연결된 미션 #${mission?.missionId ?? ''}도 함께 취소됩니다.`,
          '선택된 지원도 함께 취소됩니다.',
          '환불 처리가 필요한 요청입니다.',
        ]}
        onClose={() => setCancelWithMissionOpen(false)}
        onConfirm={handleCancelWithMission}
      />

      <CancelRequestConfirmModal
        open={cancelModalOpen}
        proposalId={request.proposalId}
        currentStatus={status}
        offerCount={offers.length}
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
