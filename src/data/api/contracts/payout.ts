import type { PayoutStatus } from '../../../domain/status/payoutStatus'

// Verbatim from `components.schemas.AdminPayoutDetailResponse`.
export interface AdminPayoutDetailResponse {
  id: number
  proposalId: number
  offerId: number
  runnerId: string
  runnerName: string
  amount: number
  status: PayoutStatus
  settledAt?: string | null
  payoutBankName?: string | null
  payoutAccountNumber?: string | null
  payoutAccountHolder?: string | null
  adminNote?: string | null
}
