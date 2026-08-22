import { useState } from 'react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { canCopyToClipboard, copyToClipboard } from '../../components/formatters'
import type { DemoMission } from '../../demo/demoTypes'

interface MissionTableProps {
  rows: DemoMission[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (mission: DemoMission) => void
}

/** 미션 목록 표현은 미션 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function MissionTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: MissionTableProps) {
  const [copiedMissionId, setCopiedMissionId] = useState<string | null>(null)
  const copySupported = canCopyToClipboard()

  return (
    <DataTable
      rows={rows}
      rowKey={(mission) => mission.missionId}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'missionId',
          header: '미션 ID',
          width: '100px',
          render: (mission) => (
            <span className="or-cell-id">{mission.missionId}</span>
          ),
        },
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (mission) => (
            <span className="or-cell-id">{mission.proposalId}</span>
          ),
        },
        {
          key: 'hyungnim',
          header: '행님',
          width: '100px',
          render: (mission) => mission.hyungnimName,
        },
        {
          key: 'kkobung',
          header: '꼬붕',
          width: '100px',
          render: (mission) => mission.kkobungName,
        },
        {
          key: 'status',
          header: '미션 상태',
          width: '90px',
          render: (mission) => (
            <StatusBadge label={mission.status} />
          ),
        },
        {
          key: 'settlement',
          header: '처리 여부',
          width: '105px',
          render: (mission) =>
            mission.status === '완료' ? (
              <StatusBadge label={mission.settlementStatus} shape="pill" />
            ) : (
              <span className="or-flag-off">해당 없음</span>
            ),
        },
        {
          key: 'openChat',
          header: '오픈채팅방',
          width: '150px',
          render: (mission) => (
            <span className="or-copy-row">
              <Button
                size="sm"
                disabled={!copySupported}
                onClick={(event) => {
                  event.stopPropagation()
                  copyToClipboard(mission.openChatUrl).then(
                    (copied) =>
                      setCopiedMissionId(copied ? mission.missionId : null),
                    () => setCopiedMissionId(null),
                  )
                }}
              >
                복사
              </Button>
              {copiedMissionId === mission.missionId ? (
                <span className="or-copy-feedback">복사했습니다.</span>
              ) : null}
            </span>
          ),
        },
        {
          key: 'createdAt',
          header: '생성일',
          width: '140px',
          render: (mission) => (
            <span className="or-cell-muted">{mission.createdAt}</span>
          ),
        },
      ]}
    />
  )
}
