// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

import type {
  DemoProposalReport,
  DemoStatusLabel,
  DemoSummaryCard,
  DemoSummaryCardKey,
  DemoTaskItem,
} from './demoTypes'

const SUMMARY_CARD_DEFINITIONS: Omit<DemoSummaryCard, 'value'>[] = [
  {
    key: 'unpaid',
    label: '미입금',
    hint: '입금 확인이 필요한 요청',
  },
  {
    key: 'dispute',
    label: '분쟁중',
    hint: '분쟁 처리가 필요한 요청',
  },
  {
    key: 'refund',
    label: '환불 확인 필요',
    hint: '환불 처리 대기 중인 요청',
  },
  {
    key: 'report',
    label: '신고',
    hint: '신고된 Proposal 확인 필요',
  },
]

const SUMMARY_CARD_KEYS: DemoSummaryCardKey[] = [
  'unpaid',
  'dispute',
  'refund',
  'report',
]

type DemoTaskSummaryCardKey = Exclude<DemoSummaryCardKey, 'report'>

/** 요약 카드가 걸러내는 처리 항목 상태. */
export const DEMO_CARD_TASK_STATUS: Record<
  DemoTaskSummaryCardKey,
  DemoStatusLabel
> = {
  unpaid: '미입금',
  dispute: '분쟁중',
  refund: '환불 필요',
}

export function parseSummaryCardKey(
  value: string | null,
): DemoSummaryCardKey | null {
  return SUMMARY_CARD_KEYS.find((key) => key === value) ?? null
}

export const DEMO_TASK_ITEMS: DemoTaskItem[] = [
  {
    taskId: 'T-01',
    type: '요청',
    proposalId: 'P-1034',
    status: '미입금',
    content: '입금 확인 필요',
    occurredAt: '2026-08-21 09:12',
    tab: null,
  },
  {
    taskId: 'T-02',
    type: '요청',
    proposalId: 'P-1035',
    status: '미입금',
    content: '입금 확인 필요',
    occurredAt: '2026-08-21 10:24',
    tab: null,
  },
  {
    taskId: 'T-06',
    type: '분쟁',
    proposalId: 'P-1029',
    status: '분쟁중',
    content: '분쟁 처리 필요',
    occurredAt: '2026-08-20 09:14',
    tab: 'dispute',
  },
  {
    taskId: 'T-07',
    type: '분쟁',
    proposalId: 'P-1020',
    status: '분쟁중',
    content: '분쟁 처리 필요',
    occurredAt: '2026-08-17 09:32',
    tab: 'dispute',
  },
  {
    taskId: 'T-08',
    type: '분쟁',
    proposalId: 'P-1028',
    status: '분쟁중',
    content: '분쟁 처리 필요',
    occurredAt: '2026-08-19 21:05',
    tab: 'dispute',
  },
  {
    taskId: 'T-09',
    type: '환불',
    proposalId: 'P-1012',
    status: '환불 필요',
    content: '환불 확인 필요',
    occurredAt: '2026-08-14 11:20',
    tab: 'refund',
  },
  {
    taskId: 'T-10',
    type: '환불',
    proposalId: 'P-1020',
    status: '환불 필요',
    content: '환불 확인 필요',
    occurredAt: '2026-08-20 10:02',
    tab: 'refund',
  },
  {
    taskId: 'T-11',
    type: '환불',
    proposalId: 'P-1002',
    status: '환불 필요',
    content: '환불 확인 필요',
    occurredAt: '2026-08-09 09:40',
    tab: 'refund',
  },
  {
    taskId: 'T-12',
    type: '환불',
    proposalId: 'P-1026',
    status: '환불 필요',
    content: '환불 확인 필요',
    occurredAt: '2026-08-18 15:11',
    tab: 'refund',
  },
]

export function createDemoSummaryCards(
  items: DemoTaskItem[],
  reports: DemoProposalReport[],
): DemoSummaryCard[] {
  return SUMMARY_CARD_DEFINITIONS.map((card) => {
    if (card.key === 'report') {
      return { ...card, value: reports.length }
    }
    const taskStatus = DEMO_CARD_TASK_STATUS[card.key]
    return {
      ...card,
      value: items.filter((item) => item.status === taskStatus).length,
    }
  })
}
