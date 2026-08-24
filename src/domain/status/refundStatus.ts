// Refund processing state and reason.
// Verbatim from `components.schemas.RefundStatus` / `components.schemas.RefundReason`
// in docs/api-spec/openapi.json.
//
// 환불은 더 이상 `PayoutStatus`를 공유하지 않는다. 서버가 환불 반려
// endpoint(`/v1/admin/refund/{id}/reject`)를 없앴고 `RefundStatus`에는 `REJECTED`가
// 없다. 환불은 대기 아니면 완료 두 상태뿐이다.
export const REFUND_STATUSES = ['PENDING', 'COMPLETED'] as const

export type RefundStatus = (typeof REFUND_STATUSES)[number]

export const REFUND_REASONS = [
  'USER_CANCELLED',
  'ADMIN_CANCELLED',
  'DISPUTE_FAILED',
] as const

export type RefundReason = (typeof REFUND_REASONS)[number]
