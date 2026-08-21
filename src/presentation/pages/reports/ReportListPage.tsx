import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DataTable } from '../../components/DataTable'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { StatusBadge } from '../../components/StatusBadge'
import { formatCount } from '../../components/formatters'
import { DEMO_PROPOSAL_REPORTS } from '../../demo/demoProposalReports'
import { useQueryState } from '../../hooks/useQueryState'
import { reportDetailPath } from '../../routes/paths'

const STATUS_OPTIONS = ['전체', '미처리', '처리 완료']

const QUERY_DEFAULTS = { q: '', status: '전체' }

export function ReportListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', STATUS_OPTIONS)

  const rows = useMemo(() => {
    const trimmed = keyword.trim()
    const lowered = trimmed.toLowerCase()

    return DEMO_PROPOSAL_REPORTS.filter((report) => {
      const matchesKeyword =
        trimmed === '' ||
        report.reportId.toLowerCase().includes(lowered) ||
        report.proposalId.toLowerCase().includes(lowered) ||
        report.reporterId.toLowerCase().includes(lowered) ||
        report.reasonQuestionText.toLowerCase().includes(lowered) ||
        report.detailReason?.toLowerCase().includes(lowered) === true
      const matchesStatus =
        status === '전체' || report.reportStatus === status

      return matchesKeyword && matchesStatus
    })
  }, [keyword, status])

  return (
    <>
      <PageHeader
        title="신고 관리"
        description="Proposal에 접수된 신고 사유와 상세 내용을 확인하고 해당 Proposal을 취소할 수 있습니다."
      />

      <section className="or-card">
        <div className="or-toolbar">
          <SearchInput
            label="검색"
            value={keyword}
            placeholder="신고 ID, Proposal ID, 신고자 또는 내용으로 검색"
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
          rowKey={(report) => report.reportId}
          emptyMessage="조건에 맞는 Proposal 신고가 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(report) =>
            navigate(reportDetailPath(report.reportId), {
              state: { from: location.pathname + location.search },
            })
          }
          columns={[
            {
              key: 'reportId',
              header: '신고 ID',
              width: '90px',
              render: (report) => (
                <span className="or-cell-id">{report.reportId}</span>
              ),
            },
            {
              key: 'target',
              header: '신고 대상',
              width: '125px',
              render: (report) => (
                <span>
                  {report.targetType}{' '}
                  <span className="or-cell-id">#{report.proposalId}</span>
                </span>
              ),
            },
            {
              key: 'reporterId',
              header: '신고자 ID',
              width: '105px',
              render: (report) => report.reporterId,
            },
            {
              key: 'reason',
              header: '신고 사유 / 상세',
              render: (report) => (
                <span className="or-report-content">
                  <span>{report.reasonQuestionText}</span>
                  <span className="or-report-detail">
                    {report.detailReason ?? '추가 상세 내용 없음'}
                  </span>
                </span>
              ),
            },
            {
              key: 'reportStatus',
              header: '신고 여부',
              width: '105px',
              render: (report) => (
                <StatusBadge label={report.reportStatus} />
              ),
            },
            {
              key: 'reportedAt',
              header: '신고일',
              width: '140px',
              render: (report) => (
                <span className="or-cell-muted">{report.reportedAt}</span>
              ),
            },
          ]}
        />
      </section>
    </>
  )
}
