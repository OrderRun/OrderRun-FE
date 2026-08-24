import type { MissionResolution, MissionStatus } from '../../../domain/status/missionStatus'

// Verbatim from `components.schemas.MissionResponse`.
// `ordererName`/`runnerName`은 `required` 목록에 없고 탈퇴한 사용자는 null이다.
export interface MissionResponse {
  id: number
  proposalId: number
  offerId: number
  ordererId: string
  ordererName?: string | null
  runnerId: string
  runnerName?: string | null
  openChatUrl?: string | null
  status: MissionStatus
  errandFee: number
  settlementPaid: boolean
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
