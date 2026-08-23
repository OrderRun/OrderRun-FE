import type { PayoutStatus } from '../../../domain/status/payoutStatus'

// Verbatim from `components.schemas.AdminPayoutSummaryResponse`.
export interface AdminPayoutSummaryResponse {
  id: number
  proposalId: number
  offerId: number
  runnerId: string
  runnerName?: string | null
  amount: number
  status: PayoutStatus
  settledAt?: string | null
}

// Verbatim from `components.schemas.AdminPayoutDetailResponse`.
export interface AdminPayoutDetailResponse extends AdminPayoutSummaryResponse {
  payoutBankName?: string | null
  payoutAccountNumber?: string | null
  payoutAccountHolder?: string | null
  adminNote?: string | null
}
