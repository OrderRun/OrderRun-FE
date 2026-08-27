import { ApiError, isErrorCode } from './apiError'

export type HttpMethod = 'GET' | 'POST'

export interface RequestConfig {
  method: HttpMethod
  path: string
  /**
   * 배열 값은 `status=A&status=B`처럼 같은 key를 반복해 직렬화한다. 목록
   * endpoint의 `status` 필터가 스펙상 반복 파라미터이기 때문이다(예:
   * `GET /v1/admin/dispute`의 `status` 설명). 빈 배열은 파라미터를 생략한다.
   */
  query?: Record<string, string | number | boolean | readonly (string | number)[] | undefined>
  body?: unknown
  /**
   * 401 재발급 흐름에서 제외한다. 재발급 endpoint 자신과 공개 endpoint(로그인)에
   * 붙여 재발급이 자기 자신을 다시 부르는 루프를 막는다.
   */
  skipAuthRetry?: boolean
  /**
   * 이 요청 한 건의 Authorization을 명시한다. `undefined`면 등록된 provider가 주는
   * 토큰을 쓰고(기본), `null`이면 헤더를 아예 붙이지 않으며, 문자열이면 그 값을 쓴다.
   * provider가 더 이상 토큰을 줄 수 없는 시점에 보내야 하는 요청(세션을 비운 뒤의
   * 폐기 요청)과 헤더를 의도적으로 빼는 공개 요청을 위한 통로다. 넘긴 값은
   * 이 요청의 헤더로만 쓰이고 모듈에 남지 않는다.
   */
  authToken?: string | null
}

// Every admin operation in docs/api-spec/openapi.json declares
// `security: [{ HTTPBearer: [] }]` except `POST /v1/admin/auth/login`, which is
// public. The provider is registered by the presentation layer that owns the
// admin session; it returns `null` while signed out, so no header is attached
// and the public login call is unaffected. This module never stores a token.
type AuthTokenProvider = () => string | null | undefined

// 만료된 액세스 토큰을 재발급하는 콜백. provider와 같은 역전 규약이다 — 이
// 모듈은 presentation을 import하지 않고 등록된 콜백만 부르므로 Data → Presentation
// 의존이 생기지 않는다. 재발급에 성공하면 새 토큰을, 재발급할 수 없으면 `null`을
// 돌려준다. 토큰 값은 이 모듈의 어떤 로그·에러 메시지에도 실리지 않는다.
type AuthTokenRefresher = () => Promise<string | null>

let authTokenProvider: AuthTokenProvider | null = null
let authTokenRefresher: AuthTokenRefresher | null = null

export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider
}

export function setAuthTokenRefresher(refresher: AuthTokenRefresher | null): void {
  authTokenRefresher = refresher
}

function hasUsableToken(): boolean {
  const token = authTokenProvider?.()
  return typeof token === 'string' && token.length > 0
}

function resolveBaseUrl(): string {
  const baseUrl = import.meta.env.VITE_API_BASE_URL
  if (!baseUrl) {
    throw new Error('VITE_API_BASE_URL is not set. Define it before calling the admin API.')
  }
  return baseUrl
}

function buildUrl(path: string, query?: RequestConfig['query']): string {
  const url = new URL(path, resolveBaseUrl())
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value === undefined) continue
      if (Array.isArray(value)) {
        for (const item of value) {
          url.searchParams.append(key, String(item))
        }
        continue
      }
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

async function parseJsonSafely(response: Response): Promise<unknown> {
  try {
    return await response.json()
  } catch {
    return null
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  const raw = await parseJsonSafely(response)
  const fallbackMessage = `요청이 실패했습니다. (status ${response.status})`
  if (isRecord(raw) && isRecord(raw.error)) {
    const errorRecord = raw.error
    const code = isErrorCode(errorRecord.code) ? errorRecord.code : null
    const message = typeof errorRecord.message === 'string' ? errorRecord.message : fallbackMessage
    const details = typeof errorRecord.details === 'string' ? errorRecord.details : null
    return new ApiError(message, code, details, response.status)
  }
  return new ApiError(fallbackMessage, null, null, response.status)
}

async function sendRequest(config: RequestConfig): Promise<Response> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
  }
  // 요청별 override가 provider보다 우선한다. `null`은 "헤더 없음"을 뜻하므로
  // provider로 되돌아가지 않는다.
  const token = config.authToken === undefined ? authTokenProvider?.() : config.authToken
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  let body: string | undefined
  if (config.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(config.body)
  }
  try {
    return await fetch(buildUrl(config.path, config.query), {
      method: config.method,
      headers,
      body,
    })
  } catch (cause) {
    const message = cause instanceof Error ? cause.message : '네트워크 요청에 실패했습니다.'
    throw new ApiError(message, null, null, null)
  }
}

/**
 * Parses the response as `ApiResponse<T>` and returns the unwrapped `data`.
 *
 * `data as T` below is a hand-write-mode boundary cast: the project has no
 * runtime schema validator (see plan's codegen decision), so this trusts
 * that the server's `data` payload matches the hand-written contract type,
 * the same way the contract's fields were checked field-by-field against
 * the live openapi.json response examples/schemas at authoring time.
 */
async function unwrapEnvelope<T>(response: Response): Promise<T> {
  const raw = await parseJsonSafely(response)
  if (!isRecord(raw) || raw.data === undefined || raw.data === null) {
    throw new ApiError('응답에 데이터가 없습니다.', null, null, response.status)
  }
  return raw.data as T
}

/**
 * 인증이 필요한 요청의 단일 전송 경로다.
 *
 * 1. provider가 쓸 수 있는 토큰을 주지 못하면(만료 또는 세션 없음) 먼저 재발급을
 *    시도한다. 만료된 토큰으로 보내면 401이 확정이라 왕복 한 번을 낭비한다.
 * 2. 전송한다.
 * 3. 401이면 재발급을 한 번 더 시도하고, 새 토큰을 받았을 때만 **정확히 1회**
 *    재전송한다. 재발급이 `null`이면 원래의 401 응답을 그대로 돌려주므로
 *    재시도가 꼬리를 무는 경우가 없다.
 *
 * 동시 요청이 각자 재발급을 부르더라도 실제 네트워크 호출을 1건으로 합치는 책임은
 * 등록된 refresher에 있다.
 */
async function sendWithAuthRetry(config: RequestConfig): Promise<Response> {
  const refresher = authTokenRefresher
  if (config.skipAuthRetry === true || refresher === null) {
    return sendRequest(config)
  }

  if (!hasUsableToken()) {
    await refresher()
  }

  const response = await sendRequest(config)
  if (response.status !== 401) {
    return response
  }

  const refreshed = await refresher()
  if (refreshed === null) {
    return response
  }
  return sendRequest(config)
}

export async function requestEnvelope<T>(config: RequestConfig): Promise<T> {
  const response = await sendWithAuthRetry(config)
  if (!response.ok) {
    throw await toApiError(response)
  }
  return unwrapEnvelope<T>(response)
}

/**
 * 성공 본문에 `data`가 없는 endpoint용(예: `POST /v1/auth/logout`의
 * `{ success: true, data: null }`). 실패는 다른 호출과 같은 `ApiError`로 던진다.
 */
export async function requestNoContent(config: RequestConfig): Promise<void> {
  const response = await sendWithAuthRetry(config)
  if (!response.ok) {
    throw await toApiError(response)
  }
}
