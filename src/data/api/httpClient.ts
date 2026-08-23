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
}

// Every admin operation in docs/api-spec/openapi.json declares
// `security: [{ HTTPBearer: [] }]` except `POST /v1/admin/auth/login`, which is
// public. The provider is registered by the presentation layer that owns the
// admin session; it returns `null` while signed out, so no header is attached
// and the public login call is unaffected. This module never stores a token.
type AuthTokenProvider = () => string | null | undefined

let authTokenProvider: AuthTokenProvider | null = null

export function setAuthTokenProvider(provider: AuthTokenProvider | null): void {
  authTokenProvider = provider
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
  const token = authTokenProvider?.()
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

export async function requestEnvelope<T>(config: RequestConfig): Promise<T> {
  const response = await sendRequest(config)
  if (!response.ok) {
    throw await toApiError(response)
  }
  return unwrapEnvelope<T>(response)
}
