import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { formatCount } from '../../components/formatters'
import { DEMO_REFUNDS } from '../../demo/demoRefunds'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'
import { toRefundRow } from '../../mock/demoAdapters'
import { RefundTable } from './RefundTable'

const STATUS_OPTIONS = [
  '전체',
  '미처리',
  '처리 완료',
  '반려',
]

const QUERY_DEFAULTS = { q: '', status: '전체', from: '' }
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function RefundListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)
  const rawFrom = get('from')
  const fromDate = DATE_PATTERN.test(rawFrom) ? rawFrom : ''

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_REFUNDS.filter((refund) => {
      const matchesKeyword =
        trimmed === '' ||
        refund.proposalId.toLowerCase().includes(lowered) ||
        refund.hyungnimName.includes(trimmed)
      const matchesStatus = status === '전체' || refund.status === status
      const matchesDate =
        fromDate === '' || refund.requestedAt.slice(0, 10) >= fromDate

      return matchesKeyword && matchesStatus && matchesDate
    }).map(toRefundRow)
  }, [keyword, status, fromDate])

  return (
    <>
      <PageHeader
        title="환불 관리"
        description="환불 확인이 필요한 요청을 빠르게 찾아 처리할 수 있습니다."
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
            label="처리 여부"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <label className="or-field">
            <span className="or-field-label">요청일 시작</span>
            <input
              className="or-input"
              type="date"
              value={fromDate}
              onChange={(event) => set('from', event.target.value)}
            />
          </label>
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <RefundTable
          rows={rows}
          emptyMessage="조건에 맞는 환불 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'refund'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </section>
    </>
  )
}
