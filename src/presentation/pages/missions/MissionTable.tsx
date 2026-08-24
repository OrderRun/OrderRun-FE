import { useState } from 'react'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import { StatusBadge } from '../../components/StatusBadge'
import { canCopyToClipboard, copyToClipboard } from '../../components/formatters'
import type { MissionRow } from '../../models/rows'

interface MissionTableProps {
  rows: MissionRow[]
  emptyMessage: string
  emptyHint?: string
  onRowClick: (row: MissionRow) => void
}

const NOT_APPLICABLE = <span className="or-flag-off">해당 없음</span>

/** 미션 목록 표현은 미션 관리와 대시보드가 이 컴포넌트 하나를 공유한다. */
export function MissionTable({
  rows,
  emptyMessage,
  emptyHint,
  onRowClick,
}: MissionTableProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const copySupported = canCopyToClipboard()

  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.key}
      emptyMessage={emptyMessage}
      emptyHint={emptyHint}
      onRowClick={onRowClick}
      columns={[
        {
          key: 'missionId',
          header: '미션 ID',
          width: '100px',
          render: (row) =>
            row.missionId === null ? (
              NOT_APPLICABLE
            ) : (
              <span className="or-cell-id">{row.missionId}</span>
            ),
        },
        {
          key: 'proposalId',
          header: '요청 ID',
          width: '100px',
          render: (row) => <span className="or-cell-id">{row.proposalId}</span>,
        },
        {
          key: 'hyungnim',
          header: '행님',
          width: '100px',
          render: (row) => row.hyungnimName,
        },
        {
          key: 'kkobung',
          header: '꼬붕',
          width: '100px',
          render: (row) => row.kkobungName,
        },
        {
          key: 'status',
          header: '미션 상태',
          width: '90px',
          render: (row) =>
            row.statusLabel === null ? (
              NOT_APPLICABLE
            ) : (
              <StatusBadge label={row.statusLabel} />
            ),
        },
        {
          key: 'settlement',
          header: '처리 여부',
          width: '105px',
          render: (row) =>
            row.payoutStatusLabel === null ? (
              NOT_APPLICABLE
            ) : (
              <StatusBadge label={row.payoutStatusLabel} shape="pill" />
            ),
        },
        {
          key: 'openChat',
          header: '오픈채팅방',
          width: '150px',
          render: (row) => {
            const openChatUrl = row.openChatUrl
            if (openChatUrl === null) {
              return NOT_APPLICABLE
            }
            return (
              <span className="or-copy-row">
                <Button
                  size="sm"
                  disabled={!copySupported}
                  onClick={(event) => {
                    event.stopPropagation()
                    copyToClipboard(openChatUrl).then(
                      (copied) => setCopiedKey(copied ? row.key : null),
                      () => setCopiedKey(null),
                    )
                  }}
                >
                  복사
                </Button>
                {copiedKey === row.key ? (
                  <span className="or-copy-feedback">복사했습니다.</span>
                ) : null}
              </span>
            )
          },
        },
        {
          key: 'createdAt',
          header: '생성일',
          width: '140px',
          render: (row) =>
            row.createdAt === null ? (
              NOT_APPLICABLE
            ) : (
              <span className="or-cell-muted">{row.createdAt}</span>
            ),
        },
      ]}
    />
  )
}
