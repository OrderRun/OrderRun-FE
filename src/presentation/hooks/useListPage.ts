import { useEffect } from 'react'

/**
 * URL의 `page`(사람이 읽는 1-base)를 서버 규약인 0-base 인덱스로 바꾼다.
 * 숫자가 아니거나 1보다 작으면 1페이지로 본다.
 */
export function parseListPage(rawPage: string): number {
  const parsed = Number(rawPage)
  return Number.isInteger(parsed) && parsed >= 1 ? parsed - 1 : 0
}

/**
 * 결과가 줄어 현재 페이지가 사라졌으면 1페이지로 되돌린다. 범위를 벗어난
 * 페이지는 빈 표를 그리는데, 그 빈 표는 "조건에 맞는 게 없다"로 오해되기 때문이다.
 * 응답이 오기 전(`totalPages === undefined`)에는 아무것도 하지 않는다.
 */
export function useResetOutOfRangePage(
  page: number,
  totalPages: number | undefined,
  resetToFirstPage: () => void,
): void {
  const outOfRange = totalPages !== undefined && page + 1 > Math.max(totalPages, 1)

  useEffect(() => {
    if (outOfRange) {
      resetToFirstPage()
    }
  }, [outOfRange, resetToFirstPage])
}
