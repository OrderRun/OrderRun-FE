import type { ApiResponse } from '../apiEnvelope'

// `인증` 태그의 공용 토큰 endpoint 계약. `관리자` 태그 전용인 contracts/adminAuth.ts와
// 나눠 둔다(발급은 관리자 로그인, 갱신·만료는 공용 endpoint가 담당한다).

// Verbatim field list from `components.schemas.AuthRefreshRequest`.
// `refreshToken`(minLength 1)이 유일한 required 필드이고 스키마가
// `additionalProperties: false`라 다른 값을 함께 보낼 수 없다.
export interface AuthRefreshRequest {
  refreshToken: string
}

// Verbatim field list from `components.schemas.AuthAccessTokenResponse`.
// 두 필드 모두 required이며 `expiresIn`은 액세스 토큰 수명(**밀리초**)이다.
// 재발급 응답에 refreshToken이 없으므로 기존 refreshToken을 그대로 유지한다.
export interface AuthAccessTokenResponse {
  accessToken: string
  expiresIn: number
}

// Verbatim field list from `components.schemas.AuthLogoutRequest`.
// `refreshToken`(minLength 1)이 유일한 required 필드이고 스키마가
// `additionalProperties: false`다.
export interface AuthLogoutRequest {
  refreshToken: string
}

export type ApiResponse_AuthAccessTokenResponse_ = ApiResponse<AuthAccessTokenResponse>
