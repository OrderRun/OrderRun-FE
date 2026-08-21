import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatCount } from '../../components/formatters'
import { DEMO_DISPUTES } from '../../demo/demoDisputes'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = ['전체', '미처리', '처리 완료']

const QUERY_DEFAULTS = { q: '', status: '전체' }

export function DisputeListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_DISPUTES.filter((dispute) => {
      const matchesKeyword =
        trimmed === '' ||
        dispute.disputeId.toLowerCase().includes(lowered) ||
        dispute.proposalId.toLowerCase().includes(lowered) ||
        dispute.offerId.toLowerCase().includes(lowered) ||
        dispute.requesterName.includes(trimmed)
      const matchesStatus = status === '전체' || dispute.status === status

      return matchesKeyword && matchesStatus
    })
  }, [keyword, status])

  return (
    <>
      <PageHeader
        title="분쟁 관리"
        description="접수된 분쟁을 확인하고 요청 상세에서 처리할 수 있습니다."
      />

      <section className="or-card">
        <div className="or-toolbar">
          <SearchInput
            label="검색"
            value={keyword}
            placeholder="분쟁 ID, 요청 ID 또는 신청자로 검색"
            onChange={(value) => set('q', value)}
          />
          <FilterSelect
            label="처리 상태"
            value={status}
            options={STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <DataTable
          rows={rows}
          rowKey={(dispute) => dispute.disputeId}
          emptyMessage="조건에 맞는 분쟁이 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(dispute) =>
            navigate(requestDetailPath(dispute.proposalId, 'dispute'), {
              state: { from: location.pathname + location.search },
            })
          }
          columns={[
            {
              key: 'disputeId',
              header: '분쟁 ID',
              width: '100px',
              render: (dispute) => (
                <span className="or-cell-id">{dispute.disputeId}</span>
              ),
            },
            {
              key: 'proposalId',
              header: '요청 ID',
              width: '100px',
              render: (dispute) => (
                <span className="or-cell-id">{dispute.proposalId}</span>
              ),
            },
            {
              key: 'offerId',
              header: '지원 ID',
              width: '100px',
              render: (dispute) => (
                <span className="or-cell-id">{dispute.offerId}</span>
              ),
            },
            {
              key: 'requester',
              header: '신청자',
              width: '120px',
              render: (dispute) => dispute.requesterName,
            },
            {
              key: 'requesterRole',
              header: '역할',
              width: '80px',
              render: (dispute) => <StatusBadge label={dispute.requesterRole} />,
            },
            {
              key: 'status',
              header: '상태',
              width: '100px',
              render: (dispute) => <StatusBadge label={dispute.status} />,
            },
            {
              key: 'requestedAt',
              header: '신청일',
              width: '140px',
              render: (dispute) => (
                <span className="or-cell-muted">{dispute.requestedAt}</span>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}
