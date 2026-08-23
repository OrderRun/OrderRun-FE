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

// Verbatim from `components.schemas.AdminProposalSummaryResponse`.
export interface AdminProposalSummaryResponse {
  id: number
  ordererId: string
  ordererName?: string | null
  errandFee: number
  status: ProposalStatus
  offerCount: number
  createdAt: string
}

// Verbatim from `components.schemas.AdminProposalDetailResponse`.
// `ordererLevel`은 required가 아니고 스키마 default가 0이다.
export interface AdminProposalDetailResponse {
  id: number
  title: string
  content: string
  deadline: string
  errandFee: number
  ordererId: string
  ordererName?: string | null
  ordererLevel?: number
  status: ProposalStatus
  createdAt: string
  openChatUrl?: string | null
  acceptedOfferId?: number | null
  acceptedRunnerName?: string | null
  missionId?: number | null
  adminNote?: string | null
  depositorName?: string | null
  depositBankName?: string | null
  depositAccountNumber?: string | null
  depositAccountHolder?: string | null
  matchedAt?: string | null
  runnerConfirmedAt?: string | null
  ordererConfirmedAt?: string | null
  disputedAt?: string | null
  resolvedAt?: string | null
}

// Verbatim from `components.schemas.AdminConfirmPaymentRequest`.
// body와 `openChatUrl` 모두 required다.
export interface AdminConfirmPaymentRequest {
  openChatUrl: string
}
