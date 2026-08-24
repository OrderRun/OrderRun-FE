import type { MissionResolution, MissionStatus } from '../../../domain/status/missionStatus'
import type { PayoutStatus } from '../../../domain/status/payoutStatus'

// Verbatim from `components.schemas.MissionResponse`.
export interface MissionResponse {
  id: number
  proposalId: number
  offerId: number
  ordererId: string
  ordererName: string
  runnerId: string
  runnerName: string
  openChatUrl?: string | null
  status: MissionStatus
  errandFee: number
  settlementPaid: boolean
  settlementStatus: PayoutStatus
  refunded: boolean
  resolution?: MissionResolution | null
  startedAt: string
  runnerConfirmedAt?: string | null
  ordererConfirmedAt?: string | null
  disputedAt?: string | null
  completedAt?: string | null
  failedAt?: string | null
  resolvedAt?: string | null
  resolvedByAdminId?: string | null
  settlementPaidAt?: string | null
  settlementPaidByAdminId?: string | null
  refundedAt?: string | null
  refundedByAdminId?: string | null
  payoutMemo?: string | null
  createdAt: string
}

// Verbatim from `components.schemas.MissionResolveRequest`.
export interface MissionResolveRequest {
  resolution: MissionResolution
}

// Verbatim from `components.schemas.MissionPayoutRequest`.
// settlement·refund 두 endpoint가 공유하며 body 자체가 optional이다.
export interface MissionPayoutRequest {
  adminId?: string | null
  memo?: string | null
}
