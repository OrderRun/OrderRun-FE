export type RequestTabKey =
  | 'offers'
  | 'mission'
  | 'dispute'
  | 'refund'
  | 'report'

export const REQUEST_TABS: { key: RequestTabKey; label: string }[] = [
  { key: 'offers', label: '지원 목록' },
  { key: 'mission', label: '미션 정보' },
  { key: 'dispute', label: '분쟁 정보' },
  { key: 'refund', label: '환불 정보' },
  { key: 'report', label: '신고 정보' },
]

const DEFAULT_REQUEST_TAB: RequestTabKey = 'offers'

export function parseRequestTab(value: string | null): RequestTabKey {
  const matched = REQUEST_TABS.find((tab) => tab.key === value)
  return matched ? matched.key : DEFAULT_REQUEST_TAB
}
