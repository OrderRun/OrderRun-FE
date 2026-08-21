import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatAmount, formatCount } from '../../components/formatters'
import { DEMO_REFUNDS } from '../../demo/demoRefunds'
import { findDemoRequestStatus } from '../../demo/demoSelectors'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = [
  '전체',
  '환불 필요',
  '환불 완료',
  '환불 실패',
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
    })
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
            label="환불 상태"
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

        <DataTable
          rows={rows}
          rowKey={(refund) => refund.proposalId}
          emptyMessage="조건에 맞는 환불 요청이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(refund) =>
            navigate(requestDetailPath(refund.proposalId, 'refund'), {
              state: { from: location.pathname + location.search },
            })
          }
          columns={[
            {
              key: 'proposalId',
              header: '요청 ID',
              width: '100px',
              render: (refund) => (
                <span className="or-cell-id">{refund.proposalId}</span>
              ),
            },
            {
              key: 'hyungnim',
              header: '행님',
              width: '100px',
              render: (refund) => refund.hyungnimName,
            },
            {
              key: 'amount',
              header: '환불 금액',
              width: '110px',
              align: 'right',
              render: (refund) => (
                <span className="or-cell-amount">{formatAmount(refund.amount)}</span>
              ),
            },
            {
              key: 'requestStatus',
              header: '요청 상태',
              width: '90px',
              render: (refund) => {
                const requestStatus = findDemoRequestStatus(refund.proposalId)
                return requestStatus ? (
                  <StatusBadge label={requestStatus} />
                ) : (
                  <span className="or-flag-off">해당 없음</span>
                )
              },
            },
            {
              key: 'refundStatus',
              header: '환불 상태',
              width: '110px',
              render: (refund) => <StatusBadge label={refund.status} />,
            },
            {
              key: 'requestedAt',
              header: '요청일',
              width: '140px',
              render: (refund) => (
                <span className="or-cell-muted">{refund.requestedAt}</span>
              ),
            },
            {
              key: 'processedAt',
              header: '처리일',
              width: '140px',
              render: (refund) =>
                refund.processedAt ? (
                  <span className="or-cell-muted">{refund.processedAt}</span>
                ) : (
                  <span className="or-flag-off">미처리</span>
                ),
            },
          ]}
        />
      </section>
    </>
  )
}
