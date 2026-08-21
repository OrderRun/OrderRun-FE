// Verbatim from `components.schemas.ErrorCode` in docs/api-spec/openapi.json
// (38 values — the only codes the server can put on the wire).
export const ERROR_CODES = [
  'DISPUTE_EVIDENCE_NOT_FOUND',
  'DUPLICATE_OFFER',
  'DUPLICATE_PROPOSAL_REPORT',
  'FORBIDDEN',
  'INTERNAL_SERVER_ERROR',
  'INVALID_DATE_TIME_FORMAT',
  'INVALID_STATUS',
  'INVALID_TOKEN',
  'METHOD_NOT_ALLOWED',
  'NOTIFICATION_NOT_FOUND',
  'NOT_FOUND',
  'OFFER_NOT_ACCEPTABLE',
  'OFFER_NOT_CANCELLABLE',
  'OFFER_NOT_FOUND',
  'OFFER_NOT_UPDATABLE',
  'PHONE_ALREADY_EXISTS',
  'PHONE_VERIFICATION_CODE_MISMATCH',
  'PHONE_VERIFICATION_EXPIRED',
  'PHONE_VERIFICATION_NOT_FOUND',
  'PHONE_VERIFICATION_SEND_RATE_LIMITED',
  'PROPOSAL_DEADLINE_INVALID',
  'PROPOSAL_ERRAND_FEE_INVALID',
  'PROPOSAL_NOT_CANCELLABLE',
  'PROPOSAL_NOT_EDITABLE',
  'PROPOSAL_NOT_FOUND',
  'PROPOSAL_NOT_MATCHABLE',
  'PROPOSAL_NOT_OPEN',
  'PROPOSAL_NOT_REPORTABLE',
  'PROPOSAL_NOT_UPDATABLE',
  'PROPOSAL_REPORT_NOT_FOUND',
  'PROPOSAL_REPORT_NOT_REVIEWABLE',
  'PROPOSAL_SELF_REPORT_NOT_ALLOWED',
  'SELF_OFFER_NOT_ALLOWED',
  'SMS_SENDER_NOT_CONFIGURED',
  'USER_NOT_FOUND',
  'USER_WITHDRAWAL_BLOCKED',
  'VALIDATION_ERROR',
  'HTTP_ERROR',
] as const

export type ErrorCode = (typeof ERROR_CODES)[number]

export function isErrorCode(value: unknown): value is ErrorCode {
  return typeof value === 'string' && ERROR_CODES.some((code) => code === value)
}

export interface ErrorDetail {
  code: ErrorCode
  message: string
  details?: string | null
}

export interface ErrorResponse {
  success?: boolean
  error: ErrorDetail
  timestamp?: string
}

/**
 * Thrown for every failed admin API call.
 *
 * `code` is `null` for the non-`ErrorCode` fallback variant — used when the
 * request never reached a valid `ErrorResponse` body (network failure, body
 * parse failure, or a `code` value outside the known `ErrorCode` union). A
 * fabricated code is never substituted.
 */
export class ApiError extends Error {
  readonly code: ErrorCode | null
  readonly details: string | null
  readonly status: number | null

  constructor(message: string, code: ErrorCode | null, details: string | null, status: number | null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.details = details
    this.status = status
  }
}
