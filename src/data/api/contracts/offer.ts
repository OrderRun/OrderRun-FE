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
