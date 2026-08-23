import type { DisputeProcessStatus } from '../../../domain/status/disputeStatus'
import type { MissionResolution } from '../../../domain/status/missionStatus'
import type { OfferStatus } from '../../../domain/status/offerStatus'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim from `components.schemas.AdminDisputeSummaryResponse`.
// `requesterRole`은 스펙상 자유 string이며 enum이 아니다.
export interface AdminDisputeSummaryResponse {
  id: number
  proposalId: number
  offerId: number
  missionId?: number | null
  requesterId: string
  requesterName?: string | null
  requesterRole: string
  status: DisputeProcessStatus
  createdAt: string
}

// Verbatim from `components.schemas.AdminDisputeDetailResponse`.
export interface AdminDisputeDetailResponse extends AdminDisputeSummaryResponse {
  targetId: string
  targetName?: string | null
  targetRole: string
  surveyQuestionId: number
  reason: string
  proposalStatus: ProposalStatus
  offerStatus: OfferStatus
  adminNote?: string | null
  resolvedAt?: string | null
}

// Verbatim from `components.schemas.AdminDisputeResolveRequest`.
export interface AdminDisputeResolveRequest {
  outcome: MissionResolution
  adminNote?: string | null
  adminId?: string | null
}
