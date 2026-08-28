import { requestEnvelope, requestNoContent } from './httpClient'
import type {
  AuthAccessTokenResponse,
  AuthLogoutRequest,
  AuthRefreshRequest,
} from './contracts/auth'

// docs/api-spec/openapi.json의 `인증` 태그 중 관리자 세션 수명주기에 쓰는 둘만
// 옮겨 둔다. 두 호출 모두 `skipAuthRetry: true`다 — 401을 만났을 때 자기 자신을
// 다시 부르면 재발급 루프가 되기 때문이며, 이 파일이 재시도 흐름의 바닥이다.

/**
 * `POST /v1/auth/refresh` — 스펙에 `security` 선언이 없다. 재발급 자격은 body의
 * refreshToken 하나이므로 `authToken: null`로 Authorization을 명시적으로 뺀다.
 * (`skipAuthRetry`는 재시도만 끄고 헤더 부착은 막지 않는다.) 거절된 액세스 토큰을
 * 실어 보내면 Bearer를 전역 검증하는 서버에서 재발급까지 401이 될 수 있다.
 * 실패는 `ApiError`로 나온다: 400 `VALIDATION_ERROR`, 401 `INVALID_TOKEN`,
 * 404 `USER_NOT_FOUND`, 500 `INTERNAL_SERVER_ERROR`.
 */
export function refreshAccessToken(body: AuthRefreshRequest): Promise<AuthAccessTokenResponse> {
  return requestEnvelope<AuthAccessTokenResponse>({
    method: 'POST',
    path: '/v1/auth/refresh',
    body,
    skipAuthRetry: true,
    authToken: null,
  })
}

/**
 * `POST /v1/auth/logout` — refresh와 달리 `security: [{ HTTPBearer: [] }]`를
 * 선언하므로 Authorization 헤더가 필요하다. 그래서 `accessToken`을 **필수 인자로
 * 받는다**: 부르는 쪽이 세션을 비운 뒤에 보내더라도 헤더가 빠지지 않도록 provider에
 * 기대지 않고 값을 명시하게 강제한다(헤더 없이 나가면 401로 거절돼 서버의
 * refreshToken이 폐기되지 않는다). 200 본문이 `data: null`이라 envelope을 벗기면
 * "데이터 없음"으로 실패하므로 `requestNoContent`를 쓴다.
 * 실패는 `ApiError`: 400 `VALIDATION_ERROR`, 401 `INVALID_TOKEN`,
 * 500 `INTERNAL_SERVER_ERROR`.
 */
export function logout(body: AuthLogoutRequest, accessToken: string): Promise<void> {
  return requestNoContent({
    method: 'POST',
    path: '/v1/auth/logout',
    body,
    skipAuthRetry: true,
    authToken: accessToken,
  })
}
