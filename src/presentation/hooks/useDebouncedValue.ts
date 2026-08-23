import { useEffect, useState } from 'react'

/**
 * 입력 중 매 글자마다 서버를 때리지 않도록 값을 늦춰 돌려준다. 마지막 입력
 * 이후 `delayMs`가 지나야 반영되며, 그 사이 값이 또 바뀌면 타이머를 다시 건다.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delayMs)
    return () => window.clearTimeout(timer)
  }, [value, delayMs])

  return debounced
}
