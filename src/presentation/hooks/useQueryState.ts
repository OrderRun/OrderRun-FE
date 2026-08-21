import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'

export interface QueryState<K extends string> {
  /**
   * 쿼리 값을 읽는다. 값이 없거나 `allowed`에 없는 값이면 기본값을 돌려준다.
   * 잘못된 URL로 FilterSelect가 빈 값이 되는 것을 막는다.
   */
  get: (key: K, allowed?: readonly string[]) => string
  /** 기본값과 같으면 파라미터를 지운다. 목록 상태 변경이 history를 쌓지 않도록 항상 replace. */
  set: (key: K, value: string) => void
}

export function useQueryState<K extends string>(
  defaults: Readonly<Record<K, string>>,
): QueryState<K> {
  const [searchParams, setSearchParams] = useSearchParams()

  const get = useCallback(
    (key: K, allowed?: readonly string[]): string => {
      const fallback = defaults[key]
      const raw = searchParams.get(key)

      if (raw === null) {
        return fallback
      }
      if (allowed !== undefined && !allowed.includes(raw)) {
        return fallback
      }
      return raw
    },
    [defaults, searchParams],
  )

  const set = useCallback(
    (key: K, value: string): void => {
      const next = new URLSearchParams(searchParams)

      if (value === defaults[key]) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
      setSearchParams(next, { replace: true })
    },
    [defaults, searchParams, setSearchParams],
  )

  return { get, set }
}
