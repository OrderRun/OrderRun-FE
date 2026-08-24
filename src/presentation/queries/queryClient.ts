import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ApiError } from '../../data/api/apiError'

/** 인증이 끊어진 응답. 재시도 대상이 아니며 세션을 정리해야 한다. */
export function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 401 || error.code === 'INVALID_TOKEN')
}

/**
 * 4xx는 재시도해도 결과가 같으므로 즉시 포기한다(401 포함). 네트워크 실패
 * (`status === null`)와 5xx만 최대 2회 더 시도한다.
 */
function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) {
    return false
  }
  if (error instanceof ApiError && error.status !== null) {
    return error.status < 400 || error.status >= 500
  }
  return true
}

/**
 * 401을 만났을 때 세션을 정리할 콜백. 값이 아니라 "부를 콜백"만 등록받는 방식은
 * `httpClient.setAuthTokenProvider`와 같은 규약이며, 덕분에 QueryClient를 다시
 * 만들지 않고도 항상 최신 `signOut`을 부른다.
 */
let unauthorizedHandler: (() => void) | null = null

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  unauthorizedHandler = handler
}

export function createAdminQueryClient(): QueryClient {
  const handleError = (error: unknown) => {
    if (isUnauthorized(error)) {
      unauthorizedHandler?.()
      // 이전 계정/만료 세션의 응답이 화면에 남지 않도록 캐시를 비운다.
      client.clear()
    }
  }

  const client = new QueryClient({
    queryCache: new QueryCache({ onError: handleError }),
    mutationCache: new MutationCache({ onError: handleError }),
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return client
}
