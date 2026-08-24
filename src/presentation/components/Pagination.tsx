import { Button } from './Button'

interface PaginationProps {
  /** 0-base. 서버·목 모드가 같은 규약을 쓴다. */
  page: number
  totalPages: number
  totalElements: number
  pageSize: number
  onChange: (page: number) => void
}

/**
 * 목록이 한 페이지만 보여준다는 사실을 화면에 항상 드러내는 장치다.
 * 관리자 도구에서 데이터가 조용히 잘리면 "이게 전부"라고 오해하게 되므로,
 * 전체 건수와 현재 구간(`총 N건 중 x–y번째`)을 언제나 함께 그리고, 나머지
 * 구간에 실제로 도달할 수 있는 이동 수단을 붙인다.
 */
export function Pagination({
  page,
  totalPages,
  totalElements,
  pageSize,
  onChange,
}: PaginationProps) {
  const first = page * pageSize + 1
  const last = Math.min(totalElements, (page + 1) * pageSize)
  const rangeText =
    totalElements === 0
      ? '총 0건'
      : `총 ${totalElements.toLocaleString('ko-KR')}건 중 ${first.toLocaleString('ko-KR')}–${last.toLocaleString('ko-KR')}번째`

  // 결과가 없어도 `1 / 1 페이지`로 그려 표시가 비어 보이지 않게 한다.
  const pageCount = Math.max(totalPages, 1)

  return (
    <nav className="or-pagination" aria-label="페이지 이동">
      <span className="or-pagination-range">{rangeText}</span>
      <span className="or-pagination-controls">
        <Button
          size="sm"
          variant="ghost"
          disabled={page <= 0}
          onClick={() => onChange(page - 1)}
        >
          이전
        </Button>
        <span className="or-pagination-position" aria-live="polite">
          {page + 1} / {pageCount} 페이지
        </span>
        <Button
          size="sm"
          variant="ghost"
          disabled={page + 1 >= pageCount}
          onClick={() => onChange(page + 1)}
        >
          다음
        </Button>
      </span>
    </nav>
  )
}
