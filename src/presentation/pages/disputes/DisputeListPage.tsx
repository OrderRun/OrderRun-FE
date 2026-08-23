import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { DISPUTE_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useDisputeListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'
import { DisputeTable } from './DisputeTable'

const QUERY_DEFAULTS = { q: '', status: '전체', page: '1' }

export function DisputeListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', DISPUTE_STATUS_FILTER_OPTIONS)
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useDisputeListQuery({
    statusLabel: status,
    keyword: debouncedKeyword,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="분쟁 관리"
        description="접수된 분쟁을 확인하고 요청 상세에서 처리할 수 있습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <SearchInput
              label="검색"
              value={keyword}
              placeholder="분쟁 ID, 요청 ID 또는 신청자로 검색"
              onChange={(value) => setMany([['q', value], ['page', '1']])}
            />
            <FilterSelect
              label="처리 상태"
              value={status}
              options={DISPUTE_STATUS_FILTER_OPTIONS}
              onChange={(value) => setMany([['status', value], ['page', '1']])}
            />
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
        <DisputeTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 분쟁이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'dispute'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </QuerySection>
    </>
  )
}
