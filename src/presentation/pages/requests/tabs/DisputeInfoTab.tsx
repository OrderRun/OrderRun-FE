import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import { toActorRoleLabel } from '../../../../domain/actor/roleLabel'
import type { MissionResolution } from '../../../../domain/status/missionStatus'
import type { ActionState, DisputeDetailView } from '../../../models/detailViews'
import { DisputeResolveModal } from '../../disputes/modals/DisputeResolveModal'

interface DisputeInfoTabProps {
  dispute: DisputeDetailView | null
  /** 미션 상태 라벨. 미션이 없으면 null이다. */
  missionStatusLabel: string | null
  action: ActionState
  /** 성공했을 때만 resolve된다. 모달은 성공했을 때만 닫는다. */
  onResolve: (outcome: MissionResolution, note: string) => Promise<void>
  onReject: (note: string) => Promise<void>
}

export function DisputeInfoTab({
  dispute,
  missionStatusLabel,
  action,
  onResolve,
  onReject,
}: DisputeInfoTabProps) {
  const [resolveOpen, setResolveOpen] = useState(false)

  if (dispute === null) {
    return (
      <EmptyState
        message="접수된 분쟁이 없습니다."
        hint="행님 또는 꼬붕이 분쟁을 신청하면 이곳에 표시됩니다."
      />
    )
  }

  const closeOnSuccess = () => setResolveOpen(false)
  // 실패는 `action.error`로 이미 모달에 그려진다. 모달은 열린 채로 둔다.
  const ignoreFailure = () => {}

  return (
    <div className="or-section-stack">
      {dispute.totalCount > 1 ? (
        <p className="or-help-text">
          이 요청에는 분쟁이 {dispute.totalCount}건 접수돼 있습니다. 가장 먼저
          조회된 1건만 표시합니다.
        </p>
      ) : null}

      <InfoCard
        title="분쟁 정보"
        actions={
          dispute.pending ? (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={action.disabled || action.pending}
                onClick={() => {
                  action.reset()
                  setResolveOpen(true)
                }}
              >
                분쟁 처리
              </Button>
              {action.disabledReason === null ? null : (
                <span className="or-help-text">{action.disabledReason}</span>
              )}
            </>
          ) : undefined
        }
        items={[
          { label: '분쟁 ID', value: dispute.disputeId },
          {
            label: '처리 여부',
            value: <StatusBadge label={dispute.statusLabel} shape="pill" />,
          },
          { label: '분쟁 사유', value: dispute.reasonQuestionText },
          {
            label: '상세 사유',
            value: dispute.detailReason ?? (
              <span className="or-flag-off">등록된 상세 사유가 없습니다.</span>
            ),
          },
          {
            label: '분쟁 신청자',
            newRow: true,
            value: (
              <>
                {dispute.requesterName}
                <span className="or-role-tag">
                  <StatusBadge
                    label={toActorRoleLabel(dispute.requesterRole)}
                    shape="pill"
                  />
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
                  <StatusBadge
                    label={toActorRoleLabel(dispute.targetRole)}
                    shape="pill"
                  />
                </span>
              </>
            ),
          },
          { label: '신청일', value: dispute.requestedAt },
          {
            label: '처리일',
            newRow: true,
            value: dispute.resolvedAt ?? (
              <span className="or-flag-off">아직 처리되지 않았습니다.</span>
            ),
          },
          {
            label: '관리자 메모',
            value: dispute.adminNote ?? (
              <span className="or-flag-off">작성된 메모가 없습니다.</span>
            ),
          },
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
              <StatusBadge label={dispute.requestStatusLabel} />
            </div>
            <div className="or-related-row">
              <span>
                <span className="or-related-label">지원</span>
                <br />
                <span className="or-related-id">지원 #{dispute.offerId}</span>
              </span>
              <StatusBadge label={dispute.offerStatusLabel} />
            </div>
            <div className="or-related-row">
              <span>
                <span className="or-related-label">미션</span>
                <br />
                <span className="or-related-id">
                  {dispute.missionId === null
                    ? '연결된 미션 없음'
                    : `미션 #${dispute.missionId}`}
                </span>
              </span>
              {missionStatusLabel === null ? (
                <span className="or-flag-off">해당 없음</span>
              ) : (
                <StatusBadge label={missionStatusLabel} />
              )}
            </div>
          </div>
        </div>
      </section>

      <DisputeResolveModal
        open={resolveOpen}
        disputeId={dispute.disputeId}
        targets={[
          ...(dispute.missionId === null || missionStatusLabel === null
            ? []
            : [
                {
                  label: '미션',
                  id: dispute.missionId,
                  currentStatusLabel: missionStatusLabel,
                },
              ]),
          {
            label: '지원',
            id: dispute.offerId,
            currentStatusLabel: dispute.offerStatusLabel,
          },
          {
            label: '요청',
            id: dispute.proposalId,
            currentStatusLabel: dispute.requestStatusLabel,
          },
        ]}
        pending={action.pending}
        error={action.error}
        onClose={() => {
          action.reset()
          setResolveOpen(false)
        }}
        onConfirm={(outcome, note) => {
          onResolve(outcome, note).then(closeOnSuccess, ignoreFailure)
        }}
        onReject={(note) => {
          onReject(note).then(closeOnSuccess, ignoreFailure)
        }}
      />
    </div>
  )
}
