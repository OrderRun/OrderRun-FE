// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

import type { DemoSummaryCard, DemoSummaryCardKey } from './demoTypes'

const SUMMARY_CARD_DEFINITIONS: Omit<DemoSummaryCard, 'value'>[] = [
  {
    key: 'unpaid',
    label: '입금 확인',
    hint: '입금 확인이 필요한 요청',
  },
  {
    key: 'dispute',
    label: '분쟁 처리',
    hint: '분쟁 처리가 필요한 요청',
  },
  {
    key: 'refund',
    label: '환불 처리',
    hint: '환불 처리 대기 중인 요청',
  },
  {
    key: 'settlement',
    label: '수행비 입금',
    hint: '꼬붕 수행비 입금 필요',
  },
  {
    key: 'report',
    label: '신고 처리',
    hint: '신고된 Proposal 확인 필요',
  },
]

const SUMMARY_CARD_KEYS: DemoSummaryCardKey[] = [
  'unpaid',
  'dispute',
  'refund',
  'settlement',
  'report',
]

export function parseSummaryCardKey(
  value: string | null,
): DemoSummaryCardKey | null {
  return SUMMARY_CARD_KEYS.find((key) => key === value) ?? null
}

export function createDemoSummaryCards(
  counts: Record<DemoSummaryCardKey, number>,
): DemoSummaryCard[] {
  return SUMMARY_CARD_DEFINITIONS.map((card) => ({
    ...card,
    value: counts[card.key],
  }))
}
