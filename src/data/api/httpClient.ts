import { ApiError, isErrorCode } from './apiError'

export type HttpMethod = 'GET' | 'POST'

export interface RequestConfig {
  method: HttpMethod
  path: string
  query?: Record<string, string | number | boolean | undefined>
  body?: unknown
}

// AUTH_CONTRACT_UNCONFIRMED: no admin operation in docs/api-spec/openapi.json
// declares `security`. `HTTPBearer` is the only scheme the spec defines
// anywhere, so this is a generic optional injector, wired to nothing.
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

/**
 * For operations whose success schema is unspecified in the spec (e.g.
 * pending-payment's `{}` 200 schema). No envelope unwrap, no invented shape.
 */
export async function requestRaw(config: RequestConfig): Promise<unknown> {
  const response = await sendRequest(config)
  if (!response.ok) {
    throw await toApiError(response)
  }
  return parseJsonSafely(response)
}
