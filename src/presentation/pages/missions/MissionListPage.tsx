import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Button } from '../../components/Button'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import {
  canCopyToClipboard,
  copyToClipboard,
  formatCount,
} from '../../components/formatters'
import { DEMO_MISSIONS } from '../../demo/demoMissions'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = ['전체', '진행중', '완료', '취소', '분쟁중']
const QUERY_DEFAULTS = { q: '', status: '전체' }

export function MissionListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)
  const [copiedMissionId, setCopiedMissionId] = useState<string | null>(null)
  const copySupported = canCopyToClipboard()

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_MISSIONS.filter((mission) => {
      const matchesKeyword =
        trimmed === '' ||
        mission.missionId.toLowerCase().includes(lowered) ||
        mission.proposalId.toLowerCase().includes(lowered) ||
        mission.hyungnimName.includes(trimmed) ||
        mission.kkobungName.includes(trimmed)
      const matchesStatus = status === '전체' || mission.status === status
      return matchesKeyword && matchesStatus
    })
  }, [keyword, status])

  return (
    <>
      <PageHeader
        title="미션 관리"
        description="생성된 미션의 진행 상태와 오픈채팅방을 확인할 수 있습니다."
      />

      <section className="or-card">
        <div className="or-toolbar">
          <SearchInput
            label="검색"
            value={keyword}
            placeholder="미션 ID, 요청 ID 또는 이름으로 검색"
            onChange={(value) => set('q', value)}
          />
          <FilterSelect
            label="미션 상태"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <DataTable
          rows={rows}
          rowKey={(mission) => mission.missionId}
          emptyMessage="조건에 맞는 미션이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(mission) =>
            navigate(requestDetailPath(mission.proposalId, 'mission'), {
              state: { from: location.pathname + location.search },
            })
          }
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
              header: '상태',
              width: '90px',
              render: (mission) => <StatusBadge label={mission.status} />,
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
      </section>
    </>
  )
}
