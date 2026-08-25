import { useCallback } from 'react'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useUserListQuery } from '../../queries/listQueries'
import { UserTable } from './UserTable'

const QUERY_DEFAULTS = { q: '', page: '1' }

export function UserListPage() {
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useUserListQuery({
    keyword: debouncedKeyword,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="유저 관리"
        description="가입한 사용자를 검색하고 미션 수행 건수를 확인할 수 있습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <SearchInput
              label="검색"
              value={keyword}
              placeholder="유저 ID 또는 이름으로 검색"
              onChange={(value) => setMany([['q', value], ['page', '1']])}
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
        <UserTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 사용자가 없습니다."
          emptyHint="검색어를 변경해 보세요."
        />
      </QuerySection>
    </>
  )
}
