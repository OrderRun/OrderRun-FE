import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount, formatCount } from '../../components/formatters'
import { DEMO_REQUEST_SUMMARIES } from '../../demo/demoSelectors'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = [
  '전체',
  '미입금',
  '대기중',
  '진행중',
  '완료',
  '취소',
  '분쟁중',
]
const REFUND_OPTIONS = [
  '전체',
  '환불 없음',
  '환불 필요',
  '환불 완료',
  '환불 실패',
]

const QUERY_DEFAULTS = { q: '', status: '전체', refund: '전체' }

export function RequestListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)
  const refund = get('refund', REFUND_OPTIONS)

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_REQUEST_SUMMARIES.filter((summary) => {
      const matchesKeyword =
        trimmed === '' ||
        summary.request.proposalId.toLowerCase().includes(lowered) ||
        summary.request.hyungnimName.includes(trimmed)
      const matchesStatus = status === '전체' || summary.request.status === status
      const matchesRefund =
        refund === '전체' ||
        (refund === '환불 없음'
          ? summary.refundStatus === null
          : summary.refundStatus === refund)

      return matchesKeyword && matchesStatus && matchesRefund
    })
  }, [keyword, status, refund])

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
          <FilterSelect
            label="환불 상태"
            value={refund}
            options={REFUND_OPTIONS}
            onChange={(value) => set('refund', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <DataTable
          rows={rows}
          rowKey={(summary) => summary.request.proposalId}
          emptyMessage="조건에 맞는 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(summary) =>
            navigate(requestDetailPath(summary.request.proposalId), {
              state: { from: location.pathname + location.search },
            })
          }
          columns={[
            {
              key: 'proposalId',
              header: '요청 ID',
              width: '100px',
              render: (summary) => (
                <span className="or-cell-id">{summary.request.proposalId}</span>
              ),
            },
            {
              key: 'hyungnim',
              header: '행님',
              width: '100px',
              render: (summary) => summary.request.hyungnimName,
            },
            {
              key: 'amount',
              header: '금액',
              width: '110px',
              align: 'right',
              render: (summary) => (
                <span className="or-cell-amount">
                  {formatAmount(summary.request.amount)}
                </span>
              ),
            },
            {
              key: 'status',
              header: '상태',
              width: '90px',
              render: (summary) => <StatusBadge label={summary.request.status} />,
            },
            {
              key: 'offerCount',
              header: '지원 수',
              width: '80px',
              align: 'right',
              render: (summary) => (
                <span className="or-cell-amount">
                  {formatCount(summary.offerCount)}
                </span>
              ),
            },
            {
              key: 'refund',
              header: '환불 상태',
              width: '110px',
              render: (summary) =>
                summary.refundStatus ? (
                  <StatusBadge label={summary.refundStatus} />
                ) : (
                  <span className="or-flag-off">해당 없음</span>
                ),
            },
            {
              key: 'createdAt',
              header: '생성일',
              width: '140px',
              render: (summary) => (
                <span className="or-cell-muted">{summary.request.createdAt}</span>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}
