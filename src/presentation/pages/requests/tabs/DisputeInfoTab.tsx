import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import type {
  DemoDispute,
  DemoProcessStatus,
  DemoMissionStatus,
  DemoOfferStatus,
  DemoRequestStatus,
} from '../../../demo/demoTypes'
import { DisputeResolveModal } from '../../disputes/modals/DisputeResolveModal'
import type { DisputeOutcome } from '../../disputes/modals/DisputeResolveModal'

interface DisputeInfoTabProps {
  dispute: DemoDispute | undefined
  disputeStatus: DemoProcessStatus
  requestStatus: DemoRequestStatus
  offerStatus: DemoOfferStatus
  missionStatus: DemoMissionStatus
  onResolve: (outcome: DisputeOutcome) => void
  onReject: (reason: string) => void
}

export function DisputeInfoTab({
  dispute,
  disputeStatus,
  requestStatus,
  offerStatus,
  missionStatus,
  onResolve,
  onReject,
}: DisputeInfoTabProps) {
  const [resolveOpen, setResolveOpen] = useState(false)

  if (!dispute) {
    return (
      <EmptyState
        message="접수된 분쟁이 없습니다."
        hint="행님 또는 꼬붕이 분쟁을 신청하면 이곳에 표시됩니다."
      />
    )
  }

  const alreadyResolved = disputeStatus !== '미처리'

  return (
    <div className="or-section-stack">
      <InfoCard
        title="분쟁 정보"
        actions={
          alreadyResolved ? undefined : (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setResolveOpen(true)}
            >
              분쟁 처리
            </Button>
          )
        }
        items={[
          { label: '분쟁 ID', value: dispute.disputeId },
          {
            label: '처리 여부',
            value: <StatusBadge label={disputeStatus} shape="pill" />,
          },
          { label: '분쟁 사유', value: dispute.reason },
          {
            label: '분쟁 신청자',
            newRow: true,
            value: (
              <>
                {dispute.requesterName}
                <span className="or-role-tag">
                  <StatusBadge label={dispute.requesterRole} shape="pill" />
                </span>
              </>
            ),
          },
          {
            label: '신청 대상',
            value: (
              <>
                {dispute.targetName}
                <span className="or-role-tag">
                  <StatusBadge label={dispute.targetRole} shape="pill" />
                </span>
              </>
            ),
          },
          { label: '신청일', value: dispute.requestedAt },
        ]}
      />

      <section className="or-card">
        <div className="or-card-head">
          <h2 className="or-card-title">관련 객체</h2>
        </div>
        <div className="or-card-body">
          <div className="or-related-list">
            <div className="or-related-row">
              <span>
                <span className="or-related-label">요청</span>
                <br />
                <span className="or-related-id">요청 #{dispute.proposalId}</span>
              </span>
              <StatusBadge label={requestStatus} />
            </div>
            <div className="or-related-row">
              <span>
                <span className="or-related-label">지원</span>
                <br />
                <span className="or-related-id">지원 #{dispute.offerId}</span>
              </span>
              <StatusBadge label={offerStatus} />
            </div>
            <div className="or-related-row">
              <span>
                <span className="or-related-label">미션</span>
                <br />
                <span className="or-related-id">미션 #{dispute.missionId}</span>
              </span>
              <StatusBadge label={missionStatus} shape="pill" />
            </div>
          </div>
        </div>
      </section>

      <DisputeResolveModal
        open={resolveOpen}
        disputeId={dispute.disputeId}
        targets={[
          { label: '미션', id: dispute.missionId, currentStatus: missionStatus },
          { label: '지원', id: dispute.offerId, currentStatus: offerStatus },
          { label: '요청', id: dispute.proposalId, currentStatus: requestStatus },
        ]}
        onClose={() => setResolveOpen(false)}
        onConfirm={(outcome) => {
          onResolve(outcome)
          setResolveOpen(false)
        }}
        onReject={(reason) => {
          onReject(reason)
          setResolveOpen(false)
        }}
      />
    </div>
  )
}
