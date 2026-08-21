import type { ApiResponse, PageResponse } from '../apiEnvelope'
import type { ProposalReportStatus } from '../../../domain/status/proposalReportStatus'

// Verbatim field list from `components.schemas.ProposalReportResponse`.
// `detailReason`/`reviewedAt` are absent from the schema's `required` list.
export interface ProposalReportResponse {
  id: number
  proposalId: number
  reporterId: string
  reasonQuestionId: number
  reasonQuestionText: string
  detailReason?: string | null
  status: ProposalReportStatus
  createdAt: string
  reviewedAt?: string | null
}

export type ApiResponse_ProposalReportResponse_ = ApiResponse<ProposalReportResponse>

export type ApiResponse_PageResponse_ProposalReportResponse__ = ApiResponse<PageResponse<ProposalReportResponse>>
