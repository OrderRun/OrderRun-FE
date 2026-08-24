import type { ApiResponse, PageResponse } from '../apiEnvelope'
import type { ProposalReportStatus } from '../../../domain/status/proposalReportStatus'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim field list from `components.schemas.AdminProposalReportResponse`.
// `detailReason`/`reviewedAt`/`proposalStatus` are absent from the schema's
// `required` list. `proposalStatus`는 관리자 목록 조회에서만 채워진다.
export interface AdminProposalReportResponse {
  id: number
  proposalId: number
  reporterId: string
  reporterName: string
  reasonQuestionId: number
  reasonQuestionText: string
  detailReason?: string | null
  status: ProposalReportStatus
  createdAt: string
  reviewedAt?: string | null
  proposalStatus?: ProposalStatus | null
}

export type ApiResponse_AdminProposalReportResponse_ = ApiResponse<AdminProposalReportResponse>

export type ApiResponse_PageResponse_AdminProposalReportResponse__ = ApiResponse<PageResponse<AdminProposalReportResponse>>
