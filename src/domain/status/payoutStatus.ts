// Payment processing state. `PayoutStatus` is shared by 수행비 지급(payout)과
// 환불(refund) — 서버가 두 도메인에 같은 enum을 쓰므로 별도 RefundStatus를 만들지 않는다.
// Verbatim from `components.schemas.PayoutStatus` in docs/api-spec/openapi.json.
export const PAYOUT_STATUSES = ['PENDING', 'COMPLETED', 'REJECTED'] as const

export type PayoutStatus = (typeof PAYOUT_STATUSES)[number]
