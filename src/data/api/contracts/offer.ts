import type { ApiResponse } from '../apiEnvelope'
import type { OfferStatus } from '../../../domain/status/offerStatus'

// Verbatim field list from `components.schemas.OfferResponse` ("Offer API
// response"). `acceptedAt`/`runnerConfirmedAt`/`ordererConfirmedAt`/
// `disputedAt`/`resolvedAt` are absent from the schema's `required` list.
export interface OfferResponse {
  id: number
  proposalId: number
  ordererId: string
  ordererName: string
  ordererLevel: number
  runnerId: string
  runnerName: string
  runnerLevel: number
  status: OfferStatus
  acceptedAt?: string | null
  runnerConfirmedAt?: string | null
  ordererConfirmedAt?: string | null
  disputedAt?: string | null
  resolvedAt?: string | null
  createdAt: string
}

export type ApiResponse_OfferResponse_ = ApiResponse<OfferResponse>

// Verbatim from `components.schemas.AdminOfferSummaryResponse`.
// `runnerLevel`은 required가 아니고 스키마 default가 0이다.
export interface AdminOfferSummaryResponse {
  id: number
  proposalId: number
  runnerId: string
  runnerName: string
  runnerLevel?: number
  status: OfferStatus
  accepted: boolean
  hasDispute: boolean
  amount: number
  openChatUrl?: string | null
  createdAt: string
}
