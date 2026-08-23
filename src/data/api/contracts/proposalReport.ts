import type { ApiResponse, PageResponse } from '../apiEnvelope'
import type { ProposalReportStatus } from '../../../domain/status/proposalReportStatus'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim field list from `components.schemas.ProposalReportResponse`.
// `detailReason`/`reviewedAt`/`proposalStatus` are absent from the schema's
// `required` list. `proposalStatus`는 스키마 설명대로 관리자 목록 조회에서만 채워진다.
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
  proposalStatus?: ProposalStatus | null
}

export type ApiResponse_ProposalReportResponse_ = ApiResponse<ProposalReportResponse>

export type ApiResponse_PageResponse_ProposalReportResponse__ = ApiResponse<PageResponse<ProposalReportResponse>>
