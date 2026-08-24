import type { PayoutStatus } from '../../../domain/status/payoutStatus'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim from `components.schemas.AdminRefundSummaryResponse`.
// 환불 상태는 지급과 같은 `PayoutStatus`다.
export interface AdminRefundSummaryResponse {
  id: number
  proposalId: number
  proposalStatus: ProposalStatus
  ordererId: string
  ordererName: string
  amount: number
  status: PayoutStatus
  requestedAt: string
  processedAt?: string | null
}

// Verbatim from `components.schemas.AdminRefundDetailResponse`.
export interface AdminRefundDetailResponse extends AdminRefundSummaryResponse {
  reason?: string | null
  refundBankName?: string | null
  refundAccountNumber?: string | null
  refundAccountHolder?: string | null
  adminNote?: string | null
}
