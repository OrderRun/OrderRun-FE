import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { formatCount } from '../../components/formatters'
import { DEMO_MISSIONS } from '../../demo/demoMissions'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'
import { toMissionRow } from '../../mock/demoAdapters'
import { MissionTable } from './MissionTable'

const STATUS_OPTIONS = ['전체', '진행중', '완료', '취소', '분쟁중']
const QUERY_DEFAULTS = { q: '', status: '전체' }

export function MissionListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)

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
    }).map(toMissionRow)
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

        <MissionTable
          rows={rows}
          emptyMessage="조건에 맞는 미션이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'mission'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </section>
    </>
  )
}
