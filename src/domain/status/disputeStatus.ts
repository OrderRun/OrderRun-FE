// Admin processing state of a dispute.
// Verbatim from `components.schemas.DisputeProcessStatus` in docs/api-spec/openapi.json.
export const DISPUTE_PROCESS_STATUSES = ['PENDING', 'RESOLVED', 'REJECTED'] as const

export type DisputeProcessStatus = (typeof DISPUTE_PROCESS_STATUSES)[number]
