import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount, formatCount } from '../../components/formatters'
import { DEMO_OFFERS } from '../../demo/demoOffers'
import { hasDemoDisputeOnOffer } from '../../demo/demoSelectors'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = [
  '전체',
  '대기중',
  '선택됨',
  '진행중',
  '완료',
  '취소',
  '분쟁중',
]
const SELECTED_OPTIONS = ['전체', '선택됨', '미선택']
const DISPUTE_OPTIONS = ['전체', '분쟁 있음', '분쟁 없음']

const QUERY_DEFAULTS = {
  q: '',
  status: '전체',
  selected: '전체',
  dispute: '전체',
}

export function OfferListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)
  const selected = get('selected', SELECTED_OPTIONS)
  const dispute = get('dispute', DISPUTE_OPTIONS)

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_OFFERS.filter((offer) => {
      const matchesKeyword =
        trimmed === '' ||
        offer.offerId.toLowerCase().includes(lowered) ||
        offer.proposalId.toLowerCase().includes(lowered) ||
        offer.kkobungName.includes(trimmed)
      const matchesStatus = status === '전체' || offer.status === status
      const matchesSelected =
        selected === '전체' ||
        (selected === '선택됨' ? offer.selected : !offer.selected)
      const hasDispute = hasDemoDisputeOnOffer(offer.offerId)
      const matchesDispute =
        dispute === '전체' ||
        (dispute === '분쟁 있음' ? hasDispute : !hasDispute)

      return matchesKeyword && matchesStatus && matchesSelected && matchesDispute
    })
  }, [keyword, status, selected, dispute])

  return (
    <>
      <PageHeader
        title="지원 관리"
        description="모든 지원 내역을 조회하고 연결된 요청으로 이동할 수 있습니다."
      />

      <section className="or-card">
        <div className="or-toolbar">
          <SearchInput
            label="검색"
            value={keyword}
            placeholder="지원 ID, 요청 ID 또는 꼬붕 이름으로 검색"
            onChange={(value) => set('q', value)}
          />
          <FilterSelect
            label="지원 상태"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <FilterSelect
            label="선택 여부"
            value={selected}
            options={SELECTED_OPTIONS}
            onChange={(value) => set('selected', value)}
          />
          <FilterSelect
            label="분쟁 여부"
            value={dispute}
            options={DISPUTE_OPTIONS}
            onChange={(value) => set('dispute', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <DataTable
          rows={rows}
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
              render: (offer) => (
                <span className="or-cell-id">요청 #{offer.proposalId}</span>
              ),
            },
            {
              key: 'kkobung',
              header: '꼬붕',
              width: '110px',
              render: (offer) => offer.kkobungName,
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
              render: (offer) => <StatusBadge label={offer.status} />,
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
      </section>
    </>
  )
}
