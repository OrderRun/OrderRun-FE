import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { PAYOUT_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useRefundListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'
import { RefundTable } from './RefundTable'

const QUERY_DEFAULTS = { q: '', status: '전체', from: '', page: '1' }
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

export function RefundListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', PAYOUT_STATUS_FILTER_OPTIONS)
  const rawFrom = get('from')
  // 서버 `requestedFrom`은 YYYY-MM-DD만 받는다. 형식이 어긋나면 싣지 않는다.
  const fromDate = DATE_PATTERN.test(rawFrom) ? rawFrom : ''
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useRefundListQuery({
    statusLabel: status,
    keyword: debouncedKeyword,
    requestedFrom: fromDate,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="환불 관리"
        description="환불 확인이 필요한 요청을 빠르게 찾아 처리할 수 있습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <SearchInput
              label="검색"
              value={keyword}
              placeholder="요청 ID 또는 행님 이름으로 검색"
              onChange={(value) => setMany([['q', value], ['page', '1']])}
            />
            <FilterSelect
              label="처리 여부"
              value={status}
              options={PAYOUT_STATUS_FILTER_OPTIONS}
              onChange={(value) => setMany([['status', value], ['page', '1']])}
            />
            <label className="or-field">
              <span className="or-field-label">요청일 시작</span>
              <input
                className="or-input"
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setMany([['from', event.target.value], ['page', '1']])
                }
              />
            </label>
          </div>
        }
        footer={
          query.data === undefined ? null : (
            <Pagination
              page={page}
              totalPages={query.data.totalPages}
              totalElements={query.data.totalElements}
              pageSize={query.data.pageSize}
              onChange={(next) => setMany([['page', String(next + 1)]])}
            />
          )
        }
        isPending={query.isPending}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
      >
        <RefundTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 환불 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'refund'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </QuerySection>
    </>
  )
}
