/**
 * 대시보드 요약 카드 정의. 목/실 두 모드가 같은 카드를 그리므로 목 디렉토리가
 * 아니라 화면 모델로 둔다(`demo/demoDashboard.ts`는 그대로 남긴다).
 */
export type SummaryCardKey =
  | 'unpaid'
  | 'dispute'
  | 'refundReview'
  | 'refund'
  | 'report'
  | 'settlement'

export interface SummaryCard {
  key: SummaryCardKey
  label: string
  /** 아직 수치를 모르면 null이다. 0은 "처리할 게 없다"는 다른 뜻이라 쓰지 않는다. */
  value: number | null
  hint: string
}

const SUMMARY_CARD_DEFINITIONS: Omit<SummaryCard, 'value'>[] = [
  { key: 'unpaid', label: '입금 확인', hint: '입금 확인이 필요한 요청' },
  { key: 'dispute', label: '분쟁 처리', hint: '분쟁 처리가 필요한 요청' },
  { key: 'refundReview', label: '환불 검토', hint: '입금 대조가 필요한 환불' },
  { key: 'refund', label: '환불 처리', hint: '환불 처리 대기 중인 요청' },
  { key: 'settlement', label: '수행비 입금', hint: '꼬붕 수행비 입금 필요' },
  { key: 'report', label: '신고 처리', hint: '신고된 Proposal 확인 필요' },
]

const SUMMARY_CARD_KEYS: SummaryCardKey[] = [
  'unpaid',
  'dispute',
  'refundReview',
  'refund',
  'settlement',
  'report',
]

export function parseSummaryCardKey(value: string | null): SummaryCardKey | null {
  return SUMMARY_CARD_KEYS.find((key) => key === value) ?? null
}

export function createSummaryCards(
  counts: Record<SummaryCardKey, number | null>,
): SummaryCard[] {
  return SUMMARY_CARD_DEFINITIONS.map((card) => ({ ...card, value: counts[card.key] }))
}
