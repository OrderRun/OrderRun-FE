import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { REPORT_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useReportListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'
import { ReportTable } from './ReportTable'

const QUERY_DEFAULTS = { q: '', status: '전체', page: '1' }

export function ReportListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', REPORT_STATUS_FILTER_OPTIONS)
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useReportListQuery({
    statusLabel: status,
    keyword: debouncedKeyword,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="신고 관리"
        description="Proposal에 접수된 신고 사유와 상세 내용을 확인하고 해당 Proposal을 취소할 수 있습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <SearchInput
              label="검색"
              value={keyword}
              placeholder="신고 ID, Proposal ID, 신고자 또는 내용으로 검색"
              onChange={(value) => setMany([['q', value], ['page', '1']])}
            />
            <FilterSelect
              label="처리 상태"
              value={status}
              options={REPORT_STATUS_FILTER_OPTIONS}
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
        <ReportTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 Proposal 신고가 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'report'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </QuerySection>
    </>
  )
}
