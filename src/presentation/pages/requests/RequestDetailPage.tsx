import { useState } from 'react'
import { Link, useLocation, useParams, useSearchParams } from 'react-router-dom'
import { Button } from '../../components/Button'
import { EmptyState } from '../../components/EmptyState'
import { InfoCard } from '../../components/InfoCard'
import { PageHeader } from '../../components/PageHeader'
import { StatusBadge } from '../../components/StatusBadge'
import { Tabs } from '../../components/Tabs'
import { formatAmount, formatCount } from '../../components/formatters'
import {
  findDemoDispute,
  findDemoMission,
  findDemoOffersOf,
  findDemoRefund,
  findDemoRequest,
} from '../../demo/demoSelectors'
import type {
  DemoDisputeStatus,
  DemoMissionStatus,
  DemoOfferStatus,
  DemoRequestStatus,
} from '../../demo/demoTypes'
import {
  DEFAULT_ORIGIN_PATH,
  originLabelOf,
  readOriginPath,
} from '../../routes/listOrigin'
import type { DisputeOutcome } from '../disputes/modals/DisputeResolveModal'
import { CancelRequestConfirmModal } from './modals/CancelRequestConfirmModal'
import { StatusChangeModal } from './modals/StatusChangeModal'
import { DisputeInfoTab } from './tabs/DisputeInfoTab'
import { MissionInfoTab } from './tabs/MissionInfoTab'
import { OfferListTab } from './tabs/OfferListTab'
import { RefundInfoTab } from './tabs/RefundInfoTab'
import { REQUEST_TABS, parseRequestTab } from './requestTabs'

const NEXT_STATUS: Partial<Record<DemoRequestStatus, DemoRequestStatus>> = {
  미입금: '대기중',
  대기중: '진행중',
  진행중: '완료',
}

const CANCELLABLE: DemoRequestStatus[] = ['미입금', '대기중', '진행중']

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
  const [disputeStatus, setDisputeStatus] = useState<DemoDisputeStatus>(
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

  const nextStatus = NEXT_STATUS[status]
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

  const handleStatusChange = () => {
    if (!nextStatus) {
      return
    }
    setStatus(nextStatus)
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
          title={
            <span className="or-title-row">
              요청 #{request.proposalId}
              <StatusBadge label={status} size="lg" />
            </span>
          }
          actions={
            <>
              <Button
                variant="primary"
                disabled={nextStatus === undefined}
                onClick={() => setStatusModalOpen(true)}
              >
                상태 변경
              </Button>
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
          {
            label: '분쟁 여부',
            value: dispute ? (
              <span className="or-flag-on">있음</span>
            ) : (
              <span className="or-flag-off">없음</span>
            ),
          },
          {
            label: '환불 여부',
            value: refund ? (
              <StatusBadge label={refund.status} />
            ) : (
              <span className="or-flag-off">없음</span>
            ),
          },
          { label: '지원 수', value: formatCount(offers.length) },
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
            />
          ) : null}
          {activeTab === 'refund' ? <RefundInfoTab refund={refund} /> : null}
        </div>
      </section>

      {nextStatus ? (
        <StatusChangeModal
          open={statusModalOpen}
          proposalId={request.proposalId}
          currentStatus={status}
          nextStatus={nextStatus}
          requiresOpenChatUrl={status === '미입금'}
          guide={
            status === '미입금' ? '입금 확인 후 상태를 변경해주세요.' : undefined
          }
          onClose={() => setStatusModalOpen(false)}
          onConfirm={handleStatusChange}
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
