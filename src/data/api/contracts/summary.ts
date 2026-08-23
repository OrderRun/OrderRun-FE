// Verbatim from `components.schemas.AdminSummaryResponse`. 모든 필드가 required다.
export interface AdminSummaryResponse {
  unpaidCount: number
  disputeCount: number
  refundCount: number
  settlementCount: number
  reportCount: number
}
