import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { MISSION_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useMissionListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'
import { MissionTable } from './MissionTable'

const QUERY_DEFAULTS = { status: '전체', page: '1' }

/**
 * 미션 목록에는 검색창이 없다. `GET /v1/admin/missions`에 `keyword` 파라미터가
 * 없어 현재 페이지 20건만 클라이언트에서 거르게 되는데, 그러면 다음 페이지에
 * 있는 건을 두고 "검색 결과 없음"이라고 거짓말하게 된다. 대신 상태로 조회하고
 * 특정 건은 요청 관리에서 찾도록 안내한다.
 */
export function MissionListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const status = get('status', MISSION_STATUS_FILTER_OPTIONS)

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useMissionListQuery({ statusLabel: status, page })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="미션 관리"
        description="생성된 미션의 진행 상태와 오픈채팅방을 확인할 수 있습니다. 미션은 상태로 조회하고, 특정 건은 요청 관리에서 요청 ID로 찾습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <FilterSelect
              label="미션 상태"
              value={status}
              options={MISSION_STATUS_FILTER_OPTIONS}
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
        <MissionTable
          rows={query.data?.rows ?? []}
          emptyMessage="조건에 맞는 미션이 없습니다."
          emptyHint="상태 필터를 변경해 보세요."
          onRowClick={(row) =>
            navigate(requestDetailPath(row.proposalId, 'mission'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </QuerySection>
    </>
  )
}
