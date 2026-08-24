import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import {
  canCopyToClipboard,
  copyToClipboard,
  formatAmount,
} from '../../../components/formatters'
import type {
  ActionState,
  MissionDetailView,
  PayoutDetailView,
} from '../../../models/detailViews'
import { MissionPayoutModal } from '../modals/MissionPayoutModal'

interface MissionInfoTabProps {
  mission: MissionDetailView | null
  /** 수행비 지급 상세. 대상이 아니거나 기록이 없으면 null이다. */
  payout: PayoutDetailView | null
  /** 미션 상세 응답에서 가져온 오픈채팅방 URL. */
  openChatUrl: string | null
  requestStatusLabel: string
  action: ActionState
  /**
   * 성공했을 때만 resolve되는 처리 콜백. 모달은 이 promise가 성공했을 때만 닫고,
   * 실패하면 열린 채로 `action.error`를 보여준다.
   */
  onPayout: (adminNote: string) => Promise<void>
  onPayoutReject: (adminNote: string) => Promise<void>
}

export function MissionInfoTab({
  mission,
  payout,
  openChatUrl,
  requestStatusLabel,
  action,
  onPayout,
  onPayoutReject,
}: MissionInfoTabProps) {
  const [copied, setCopied] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const copySupported = canCopyToClipboard()

  if (mission === null) {
    return (
      <EmptyState
        message="생성된 미션이 없습니다."
        hint="지원이 선택되고 입금이 확인되면 미션이 생성됩니다."
      />
    )
  }

  const closeOnSuccess = () => setPayoutOpen(false)
  // 실패는 `action.error`로 이미 화면에 그려진다. 모달은 열린 채로 둔다.
  const ignoreFailure = () => {}

  const handleCopy = () => {
    if (openChatUrl === null) {
      return
    }
    copyToClipboard(openChatUrl).then(setCopied, () => setCopied(false))
  }

  return (
    <div className="or-section-stack">
      <InfoCard
        title="미션 정보"
        actions={
          mission.payoutRequired ? (
            <>
              <Button
                variant="primary"
                size="sm"
                disabled={action.disabled || action.pending}
                onClick={() => {
                  action.reset()
                  setPayoutOpen(true)
                }}
              >
                수행비 입금
              </Button>
              {action.disabledReason === null ? null : (
                <span className="or-help-text">{action.disabledReason}</span>
              )}
            </>
          ) : undefined
        }
        items={[
          { label: '미션 ID', value: mission.missionId },
          {
            label: '상태',
            value: <StatusBadge label={mission.statusLabel} />,
          },
          { label: '행님', value: mission.hyungnimName },
          { label: '꼬붕', value: mission.kkobungName },
          {
            label: '연결된 요청',
            value: mission.proposalId,
            newRow: true,
          },
          { label: '선택된 지원', value: `지원 #${mission.offerId}` },
          { label: '생성일', value: mission.createdAt },
          {
            label: '행님 완료 시각',
            value: mission.hyungnimCompletedAt ?? (
              <span className="or-flag-off">아직 완료하지 않았습니다.</span>
            ),
            newRow: true,
          },
          {
            label: '꼬붕 완료 시각',
            value: mission.kkobungCompletedAt ?? (
              <span className="or-flag-off">아직 완료하지 않았습니다.</span>
            ),
          },
          ...(mission.payoutStatusLabel === null
            ? []
            : [
                {
                  label: '수행비',
                  value: formatAmount(payout?.amount ?? mission.errandFee),
                  newRow: true,
                },
                {
                  label: '수행비 입금',
                  value: (
                    <StatusBadge label={mission.payoutStatusLabel} shape="pill" />
                  ),
                },
                {
                  label: '입금일',
                  value: payout?.settledAt ??
                    mission.settlementPaidAt ?? (
                      <span className="or-flag-off">아직 입금되지 않았습니다.</span>
                    ),
                },
                {
                  label: '관리자 메모',
                  value: payout?.adminNote ??
                    mission.payoutMemo ?? (
                      <span className="or-flag-off">작성된 메모가 없습니다.</span>
                    ),
                },
              ]),
        ]}
      />

      <section className="or-card">
        <div className="or-card-head">
          <h2 className="or-card-title">오픈채팅방</h2>
          {copied ? <span className="or-copy-feedback">복사했습니다.</span> : null}
        </div>
        <div className="or-card-body">
          {openChatUrl === null ? (
            <EmptyState
              message="등록된 오픈채팅방이 없습니다."
              hint="오픈채팅방이 등록되면 URL과 복사 버튼이 표시됩니다."
            />
          ) : (
            <div className="or-copy-row">
              <span className="or-copy-url">{openChatUrl}</span>
              <Button
                variant="secondary"
                size="sm"
                disabled={!copySupported}
                onClick={handleCopy}
              >
                복사
              </Button>
              {copySupported ? null : (
                <span className="or-help-text">
                  이 브라우저에서는 복사를 지원하지 않습니다.
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      <MissionPayoutModal
        open={payoutOpen}
        missionId={mission.missionId}
        payoutAmount={payout?.amount ?? mission.errandFee}
        payoutAccount={payout?.payoutAccount ?? null}
        payoutAccountHolder={payout?.payoutAccountHolder ?? null}
        requestStatusLabel={requestStatusLabel}
        pending={action.pending}
        error={action.error}
        onClose={() => {
          action.reset()
          setPayoutOpen(false)
        }}
        onConfirm={(note) => {
          onPayout(note).then(closeOnSuccess, ignoreFailure)
        }}
        onReject={(note) => {
          onPayoutReject(note).then(closeOnSuccess, ignoreFailure)
        }}
      />
    </div>
  )
}
