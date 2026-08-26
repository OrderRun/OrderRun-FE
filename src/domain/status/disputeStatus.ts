// Admin processing state of a dispute.
// Verbatim from `components.schemas.DisputeProcessStatus` in docs/api-spec/openapi.json.
// 서버가 분쟁 반려 endpoint와 `REJECTED`를 함께 없앴다. 미처리·처리 완료뿐이다.
export const DISPUTE_PROCESS_STATUSES = ['PENDING', 'RESOLVED'] as const

export type DisputeProcessStatus = (typeof DISPUTE_PROCESS_STATUSES)[number]
