/**
 * queryKey 규약: `['admin', <도메인>, <종류>, <파라미터객체>]`.
 * 파라미터는 항상 마지막 한 객체로만 담아 `['admin', 도메인]` 접두사 무효화가
 * 언제나 성립하게 한다.
 */
export type AdminQueryDomain =
  | 'summary'
  | 'proposal'
  | 'offer'
  | 'mission'
  | 'dispute'
  | 'refund'
  | 'payout'
  | 'report'
  | 'user'

export type AdminQueryParams = Record<string, unknown>

export function adminDomainKey(domain: AdminQueryDomain) {
  return ['admin', domain] as const
}

export function adminSummaryKey() {
  return ['admin', 'summary', 'summary', {}] as const
}

export function adminListKey(domain: AdminQueryDomain, params: AdminQueryParams) {
  return ['admin', domain, 'list', params] as const
}

export function adminDetailKey(domain: AdminQueryDomain, id: number | string) {
  return ['admin', domain, 'detail', { id }] as const
}
