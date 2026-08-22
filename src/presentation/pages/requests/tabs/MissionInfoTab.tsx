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
  DemoMission,
  DemoProcessStatus,
  DemoRequestStatus,
} from '../../../demo/demoTypes'
import { MissionPayoutModal } from '../modals/MissionPayoutModal'

interface MissionInfoTabProps {
  mission: DemoMission | undefined
  requestStatus: DemoRequestStatus
  settlementStatus: DemoProcessStatus
  settledAt: string | null
  adminNote: string
  onPayout: (adminNote: string) => void
  onPayoutReject: (adminNote: string) => void
}

export function MissionInfoTab({
  mission,
  requestStatus,
  settlementStatus,
  settledAt,
  adminNote,
  onPayout,
  onPayoutReject,
}: MissionInfoTabProps) {
  const [copied, setCopied] = useState(false)
  const [payoutOpen, setPayoutOpen] = useState(false)
  const copySupported = canCopyToClipboard()

  if (!mission) {
    return (
      <EmptyState
        message="생성된 미션이 없습니다."
        hint="지원이 선택되고 입금이 확인되면 미션이 생성됩니다."
      />
    )
  }

  const payoutRequired =
    mission.status === '완료' && settlementStatus === '미처리'

  const handleCopy = () => {
    copyToClipboard(mission.openChatUrl).then(setCopied, () => setCopied(false))
  }

  return (
    <div className="or-section-stack">
      <InfoCard
        title="미션 정보"
        actions={
          payoutRequired ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setPayoutOpen(true)}
            >
              수행비 입금
            </Button>
          ) : undefined
        }
        items={[
          { label: '미션 ID', value: mission.missionId },
          {
            label: '상태',
            value: <StatusBadge label={mission.status} />,
          },
          { label: '행님', value: mission.hyungnimName },
          { label: '꼬붕', value: mission.kkobungName },
          {
            label: '연결된 요청',
            value: `요청 #${mission.proposalId}`,
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
          ...(mission.status === '완료'
            ? [
                {
                  label: '수행비',
                  value: formatAmount(mission.payoutAmount),
                  newRow: true,
                },
                {
                  label: '수행비 입금',
                  value: <StatusBadge label={settlementStatus} shape="pill" />,
                },
                {
                  label: '입금일',
                  value: settledAt ?? (
                    <span className="or-flag-off">아직 입금되지 않았습니다.</span>
                  ),
                },
                {
                  label: '관리자 메모',
                  value:
                    adminNote === '' ? (
                      <span className="or-flag-off">작성된 메모가 없습니다.</span>
                    ) : (
                      adminNote
                    ),
                },
              ]
            : []),
        ]}
      />

      <section className="or-card">
        <div className="or-card-head">
          <h2 className="or-card-title">오픈채팅방</h2>
          {copied ? <span className="or-copy-feedback">복사했습니다.</span> : null}
        </div>
        <div className="or-card-body">
          {mission.openChatUrl === '' ? (
            <EmptyState
              message="등록된 오픈채팅방이 없습니다."
              hint="오픈채팅방이 등록되면 URL과 복사 버튼이 표시됩니다."
            />
          ) : (
            <div className="or-copy-row">
              <span className="or-copy-url">{mission.openChatUrl}</span>
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
        payoutAmount={mission.payoutAmount}
        payoutAccount={mission.payoutAccount}
        payoutAccountHolder={mission.payoutAccountHolder}
        requestStatus={requestStatus}
        onClose={() => setPayoutOpen(false)}
        onConfirm={(note) => {
          onPayout(note)
          setPayoutOpen(false)
        }}
        onReject={(note) => {
          onPayoutReject(note)
          setPayoutOpen(false)
        }}
      />
    </div>
  )
}
