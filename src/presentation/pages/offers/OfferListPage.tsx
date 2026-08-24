import { useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ActorName } from '../../components/ActorName'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { Pagination } from '../../components/Pagination'
import { QuerySection } from '../../components/QuerySection'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount } from '../../components/formatters'
import { OFFER_STATUS_FILTER_OPTIONS } from '../../../domain/status/statusFilter'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { parseListPage, useResetOutOfRangePage } from '../../hooks/useListPage'
import { useQueryState } from '../../hooks/useQueryState'
import { useOfferListQuery } from '../../queries/listQueries'
import { requestDetailPath } from '../../routes/paths'

const SELECTED_OPTIONS = ['전체', '선택됨', '미선택']
const DISPUTE_OPTIONS = ['전체', '분쟁 있음', '분쟁 없음']

const QUERY_DEFAULTS = {
  q: '',
  status: '전체',
  selected: '전체',
  dispute: '전체',
  page: '1',
}

export function OfferListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, setMany } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', OFFER_STATUS_FILTER_OPTIONS)
  const selected = get('selected', SELECTED_OPTIONS)
  const dispute = get('dispute', DISPUTE_OPTIONS)
  const debouncedKeyword = useDebouncedValue(keyword, 300)

  // 서버의 `accepted`/`hasDispute`는 boolean이라 '전체'는 파라미터를 싣지 않는다.
  const accepted = selected === '전체' ? undefined : selected === '선택됨'
  const hasDispute = dispute === '전체' ? undefined : dispute === '분쟁 있음'

  const resetToFirstPage = useCallback(() => setMany([['page', '1']]), [setMany])

  const page = parseListPage(get('page'))
  const query = useOfferListQuery({
    statusLabel: status,
    keyword: debouncedKeyword,
    accepted,
    hasDispute,
    page,
  })
  useResetOutOfRangePage(page, query.data?.totalPages, resetToFirstPage)

  return (
    <>
      <PageHeader
        title="지원 관리"
        description="모든 지원 내역을 조회하고 연결된 요청으로 이동할 수 있습니다."
      />

      <QuerySection
        header={
          <div className="or-toolbar">
            <SearchInput
              label="검색"
              value={keyword}
              placeholder="지원 ID, 요청 ID 또는 꼬붕 이름으로 검색"
              onChange={(value) => setMany([['q', value], ['page', '1']])}
            />
            <FilterSelect
              label="지원 상태"
              value={status}
              options={OFFER_STATUS_FILTER_OPTIONS}
              onChange={(value) => setMany([['status', value], ['page', '1']])}
            />
            <FilterSelect
              label="선택 여부"
              value={selected}
              options={SELECTED_OPTIONS}
              onChange={(value) => setMany([['selected', value], ['page', '1']])}
            />
            <FilterSelect
              label="분쟁 여부"
              value={dispute}
              options={DISPUTE_OPTIONS}
              onChange={(value) => setMany([['dispute', value], ['page', '1']])}
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
        <DataTable
          rows={query.data?.rows ?? []}
          rowKey={(offer) => offer.offerId}
          emptyMessage="조건에 맞는 지원이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(offer) =>
            navigate(requestDetailPath(offer.proposalId), {
              state: { from: location.pathname + location.search },
            })
          }
          isRowHighlighted={(offer) => offer.selected}
          columns={[
            {
              key: 'offerId',
              header: '지원 ID',
              width: '100px',
              render: (offer) => <span className="or-cell-id">{offer.offerId}</span>,
            },
            {
              key: 'proposalId',
              header: '요청 ID',
              width: '120px',
              render: (offer) => <span className="or-cell-id">{offer.proposalId}</span>,
            },
            {
              key: 'kkobung',
              header: '꼬붕',
              width: '110px',
              render: (offer) => (
                <ActorName
                  name={offer.kkobungName}
                  id={offer.kkobungId}
                  variant="cell"
                />
              ),
            },
            {
              key: 'amount',
              header: '지원 금액',
              width: '110px',
              render: (offer) => (
                <span className="or-cell-amount">{formatAmount(offer.amount)}</span>
              ),
            },
            {
              key: 'status',
              header: '지원 상태',
              width: '90px',
              render: (offer) => <StatusBadge label={offer.statusLabel} />,
            },
            {
              key: 'selected',
              header: '선택 여부',
              width: '100px',
              render: (offer) =>
                offer.selected ? (
                  <StatusBadge label="선택됨" shape="pill" />
                ) : (
                  <span className="or-flag-off">미선택</span>
                ),
            },
            {
              key: 'appliedAt',
              header: '신청일',
              width: '140px',
              render: (offer) => (
                <span className="or-cell-muted">{offer.appliedAt}</span>
              ),
            },
          ]}
        />
      </QuerySection>
    </>
  )
}
