import type { ApiResponse } from '../apiEnvelope'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim field list from `components.schemas.ProposalResponse` ("Public
// Proposal response"). All fields are in the schema's `required` list.
export interface ProposalResponse {
  id: number
  title: string
  content: string
  deadline: string
  errandFee: number
  status: ProposalStatus
}

export type ApiResponse_ProposalResponse_ = ApiResponse<ProposalResponse>
