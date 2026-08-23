import type { ReactNode } from 'react'
import { Button } from './Button'
import { formatCount } from './formatters'
import { toQueryErrorMessage } from './queryFeedback'

interface QuerySectionProps {
  title: string
  /** 성공했을 때만 건수를 그린다. 로딩·오류 중에는 null을 넘긴다. */
  count: number | null
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
  isPending,
  isError,
  error,
  onRetry,
  children,
}: QuerySectionProps) {
  return (
    <section className="or-card">
      <div className="or-card-head">
        <h2 className="or-card-title">{title}</h2>
        {count === null ? null : (
          <span className="or-result-count">{formatCount(count)}</span>
        )}
      </div>
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
        children
      )}
    </section>
  )
}
