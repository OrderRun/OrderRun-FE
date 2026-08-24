// Offer status enumeration.
// Verbatim from `components.schemas.OfferStatus` in docs/api-spec/openapi.json.
export const OFFER_STATUSES = [
  'WAITING',
  'ACCEPTED',
  'RUNNER_COMPLETED',
  'ALL_COMPLETED',
  'DISPUTED',
  'REJECTED',
  'CANCELLED',
] as const

export type OfferStatus = (typeof OFFER_STATUSES)[number]
