import { useState } from 'react'
import { Button } from '../../../components/Button'
import { EmptyState } from '../../../components/EmptyState'
import { InfoCard } from '../../../components/InfoCard'
import { StatusBadge } from '../../../components/StatusBadge'
import { canCopyToClipboard, copyToClipboard } from '../../../components/formatters'
import type { DemoMission } from '../../../demo/demoTypes'

interface MissionInfoTabProps {
  mission: DemoMission | undefined
}

export function MissionInfoTab({ mission }: MissionInfoTabProps) {
  const [copied, setCopied] = useState(false)
  const copySupported = canCopyToClipboard()

  if (!mission) {
    return (
      <EmptyState
        message="생성된 미션이 없습니다."
        hint="지원이 선택되고 입금이 확인되면 미션이 생성됩니다."
      />
    )
  }

  const handleCopy = () => {
    copyToClipboard(mission.openChatUrl).then(setCopied, () => setCopied(false))
  }

  return (
    <div className="or-section-stack">
      <InfoCard
        items={[
          { label: '미션 ID', value: mission.missionId },
          { label: '행님', value: mission.hyungnimName },
          { label: '꼬붕', value: mission.kkobungName },
          { label: '연결된 요청', value: `요청 #${mission.proposalId}` },
          { label: '선택된 지원', value: `지원 #${mission.offerId}` },
          { label: '상태', value: <StatusBadge label={mission.status} /> },
          { label: '생성일', value: mission.createdAt },
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
    </div>
  )
}
