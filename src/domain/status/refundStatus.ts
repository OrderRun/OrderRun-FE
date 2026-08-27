// Refund processing state and reason.
// Verbatim from `components.schemas.RefundStatus` / `components.schemas.RefundReason`
// in docs/api-spec/openapi.json.
//
// 환불에는 반려가 없다(서버가 반려 endpoint를 없앴다). 대신 `REVIEW`가 환불
// 의무보다 앞선다: 입금 확인 전에 취소된 요청이라 관리자가 입금 내역을 대조한
// 뒤에야 환불 대상인지(`PENDING`) 받은 돈이 없어 종결인지(`VOIDED`) 정해진다.
export const REFUND_STATUSES = ['REVIEW', 'PENDING', 'COMPLETED', 'VOIDED'] as const

export type RefundStatus = (typeof REFUND_STATUSES)[number]

export const REFUND_REASONS = [
  'USER_CANCELLED',
  'ADMIN_CANCELLED',
  'DISPUTE_FAILED',
  'PAYMENT_EXPIRED',
] as const

export type RefundReason = (typeof REFUND_REASONS)[number]
