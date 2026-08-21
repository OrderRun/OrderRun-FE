import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { formatCount } from '../../components/formatters'
import { DEMO_REQUEST_SUMMARIES } from '../../demo/demoSelectors'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'
import { RequestTable } from './RequestTable'

const STATUS_OPTIONS = [
  '전체',
  '미입금',
  '대기중',
  '진행중',
  '완료',
  '취소',
  '분쟁중',
]
const QUERY_DEFAULTS = { q: '', status: '전체' }

export function RequestListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_REQUEST_SUMMARIES.filter((summary) => {
      const matchesKeyword =
        trimmed === '' ||
        summary.request.proposalId.toLowerCase().includes(lowered) ||
        summary.request.hyungnimName.includes(trimmed)
      const matchesStatus = status === '전체' || summary.request.status === status

      return matchesKeyword && matchesStatus
    })
  }, [keyword, status])

  return (
    <>
      <PageHeader
        title="요청 관리"
        description="모든 요청을 조회하고 상태를 관리할 수 있습니다."
      />

      <section className="or-card">
        <div className="or-toolbar">
          <SearchInput
            label="검색"
            value={keyword}
            placeholder="요청 ID 또는 행님 이름으로 검색"
            onChange={(value) => set('q', value)}
          />
          <FilterSelect
            label="요청 상태"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <RequestTable
          rows={rows}
          emptyMessage="조건에 맞는 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(summary) =>
            navigate(requestDetailPath(summary.request.proposalId), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </section>
    </>
  )
}
