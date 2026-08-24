import type { RefundReason, RefundStatus } from '../../../domain/status/refundStatus'
import type { ProposalStatus } from '../../../domain/status/proposalStatus'

// Verbatim from `components.schemas.AdminRefundSummaryResponse`.
// 환불 상태는 `RefundStatus`이며 반려가 없다(대기·완료 두 값).
export interface AdminRefundSummaryResponse {
  id: number
  proposalId: number
  proposalStatus: ProposalStatus
  ordererId: string
  ordererName: string
  amount: number
  status: RefundStatus
  reason: RefundReason
  requestedAt: string
  processedAt?: string | null
}

// Verbatim from `components.schemas.AdminRefundDetailResponse`.
export interface AdminRefundDetailResponse extends AdminRefundSummaryResponse {
  reasonDetail?: string | null
  refundBankName?: string | null
  refundAccountNumber?: string | null
  refundAccountHolder?: string | null
  adminNote?: string | null
}
