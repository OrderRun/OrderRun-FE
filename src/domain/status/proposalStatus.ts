// Proposal lifecycle status matching the Java API contract.
// Verbatim from `components.schemas.ProposalStatus` in docs/api-spec/openapi.json.
export const PROPOSAL_STATUSES = [
  'HOLDING',
  'POSTED',
  'OFFERED',
  'MATCHED',
  'ORDER_COMPLETED',
  'ALL_COMPLETED',
  'DISPUTED',
  'REFUND_PENDING',
  'REFUNDED',
  'REPORTED',
  'CANCELLED',
] as const

export type ProposalStatus = (typeof PROPOSAL_STATUSES)[number]
