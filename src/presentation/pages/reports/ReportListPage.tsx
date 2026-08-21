import { useMemo } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { FilterSelect } from '../../components/FilterSelect'
import { PageHeader } from '../../components/PageHeader'
import { SearchInput } from '../../components/SearchInput'
import { formatCount } from '../../components/formatters'
import { DEMO_PROPOSAL_REPORTS } from '../../demo/demoProposalReports'
import { useQueryState } from '../../hooks/useQueryState'
import { requestDetailPath } from '../../routes/paths'
import { ReportTable } from './ReportTable'
import { REPORT_STATUS_OPTIONS, toReportStatusFilter } from './reportStatus'

const QUERY_DEFAULTS = { q: '', status: '전체' }

export function ReportListPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { get, set } = useQueryState(QUERY_DEFAULTS)
  const keyword = get('q')
  const status = get('status', REPORT_STATUS_OPTIONS)

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
      const statusFilter = toReportStatusFilter(status)
      const matchesStatus =
        statusFilter === null || report.reportStatus === statusFilter

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
            options={REPORT_STATUS_OPTIONS}
            onChange={(value) => set('status', value)}
          />
          <span className="or-result-count">{formatCount(rows.length)}</span>
        </div>

        <ReportTable
          rows={rows}
          emptyMessage="조건에 맞는 Proposal 신고가 없습니다."
          emptyHint="검색어나 필터 조건을 변경해 보세요."
          onRowClick={(report) =>
            navigate(requestDetailPath(report.proposalId, 'report'), {
              state: { from: location.pathname + location.search },
            })
          }
        />
      </section>
    </>
  )
}
