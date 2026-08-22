import type { ApiResponse } from '../apiEnvelope'

// Verbatim field list from `components.schemas.AdminLoginRequest`.
// Both fields are required (`username` 1..50, `password` 1..200) and the
// schema is `additionalProperties: false` — nothing else may be sent.
export interface AdminLoginRequest {
  username: string
  password: string
}

// Verbatim field list from `components.schemas.AuthTokenResponse`.
// `tokenType` is the only field absent from the schema's `required` list.
// `expiresIn` is the access token lifetime in **milliseconds**.
export interface AuthTokenResponse {
  accessToken: string
  refreshToken: string
  tokenType?: string
  expiresIn: number
  userId: string
}

export type ApiResponse_AuthTokenResponse_ = ApiResponse<AuthTokenResponse>
