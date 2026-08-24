import type { ReactNode } from 'react'
import { Button } from './Button'
import { formatCount } from './formatters'
import { toQueryErrorMessage } from './queryFeedback'

interface QuerySectionProps {
  /** `header`를 넘기지 않았을 때 그리는 기본 카드 머리말. */
  title?: string
  /** 성공했을 때만 건수를 그린다. 로딩·오류 중에는 null을 넘긴다. */
  count?: number | null
  /**
   * 카드 머리말을 통째로 대신할 슬롯. 목록 페이지는 여기에 검색·필터 툴바를
   * 넣어 **로딩·오류 중에도 툴바가 남게** 한다. 조건을 다시 조작할 수단이
   * 사라지면 오류에서 빠져나올 방법이 없다.
   */
  header?: ReactNode
  /** 성공했을 때 본문 아래에 붙는 슬롯(페이지네이션). */
  footer?: ReactNode
  isPending: boolean
  isError: boolean
  error: unknown
  onRetry: () => void
  children: ReactNode
}

/**
 * 대시보드 섹션의 로딩/오류/성공 경계 상태를 한 곳에서 처리한다. 섹션마다
 * 독립적으로 판단하므로 한 쿼리가 실패해도 나머지 섹션은 그대로 보인다.
 * 401은 세션이 정리되며 라우팅으로 빠지므로 여기서 오류를 그리지 않는다.
 */
export function QuerySection({
  title,
  count,
  header,
  footer,
  isPending,
  isError,
  error,
  onRetry,
  children,
}: QuerySectionProps) {
  return (
    <section className="or-card">
      {header === undefined ? (
        <div className="or-card-head">
          <h2 className="or-card-title">{title}</h2>
          {count === undefined || count === null ? null : (
            <span className="or-result-count">{formatCount(count)}</span>
          )}
        </div>
      ) : (
        header
      )}
      {isPending ? (
        <div className="or-section-state" role="status">
          <span className="or-skeleton-line" aria-hidden="true" />
          <span className="or-skeleton-line" aria-hidden="true" />
          <p className="or-section-state-message">불러오는 중입니다.</p>
        </div>
      ) : isError ? (
        <div className="or-section-state" role="alert">
          <p className="or-section-state-message">{toQueryErrorMessage(error)}</p>
          <Button size="sm" onClick={onRetry}>
            다시 시도
          </Button>
        </div>
      ) : (
        <>
          {children}
          {footer}
        </>
      )}
    </section>
  )
}
