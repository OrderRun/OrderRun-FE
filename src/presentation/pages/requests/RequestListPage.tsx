import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { PROPOSAL_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useRequestListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'
import { RequestTable } from './RequestTable'

const QUERY_DEFAULTS = { q: '', status: '전체', page: '1' }

export function RequestListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', PROPOSAL_STATUS_FILTER_OPTIONS)
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  // 조건이 바뀌면 페이지도 함께 1로 되돌린다. 두 값이 한 번에 반영돼야
  // 서로를 덮지 않으므로 `setMany`를 쓴다.
  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useRequestListQuery({
    statusLabel: status,
    keyword: debouncedKeyword,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="요청 관리"
        description="모든 요청을 조회하고 상태를 관리할 수 있습니다."
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
              label="요청 상태"
              value={status}
              options={PROPOSAL_STATUS_FILTER_OPTIONS}
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
        <RequestTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </QuerySection>
    </>
  )
}
