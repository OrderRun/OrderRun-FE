import type { QueryClient } from '@tanstack/react-query'
import type { AdminQueryDomain } from './adminQueryKeys'
import { adminDomainKey } from './adminQueryKeys'

/**
 * 처리(mutation) 성공 후 무효화할 최소 도메인 집합. 한 처리로 서버에서 함께
 * 바뀌는 도메인을 표로 고정해 호출부가 매번 다시 판단하지 않게 한다.
 * `summary`는 카드 수치가 모든 처리에 영향을 받으므로 항상 포함한다.
 */
export type AdminMutationAction =
  | 'confirmPayment'
  | 'cancelProposal'
  | 'resolveDispute'
  | 'completePayout'
  | 'rejectPayout'
  | 'processRefund'
  | 'confirmRefundDeposit'
  | 'voidRefund'
  | 'processReport'

const INVALIDATION_TABLE: Record<AdminMutationAction, readonly AdminQueryDomain[]> = {
  confirmPayment: ['proposal', 'summary'],
  // 요청 취소는 연결된 지원을 함께 취소하고, 진행 중 미션은 환불 대상으로 종결한다.
  cancelProposal: ['proposal', 'offer', 'mission', 'refund', 'summary'],
  resolveDispute: [
    'dispute',
    'proposal',
    'offer',
    'mission',
    'payout',
    'refund',
    'summary',
  ],
  // 지급 기록은 미션 상태만 바꾼다. 요청·지원은 그대로다.
  completePayout: ['payout', 'mission', 'summary'],
  rejectPayout: ['payout', 'mission', 'summary'],
  // 환불 완료는 연결된 요청을 취소로 종결한다.
  processRefund: ['refund', 'proposal', 'mission', 'summary'],
  // 입금 확인은 환불을 PENDING으로, 요청을 REFUND_PENDING으로 되돌린다.
  // 미입금은 환불만 VOIDED로 바꾸고 요청은 CANCELLED로 남는다.
  // 둘 다 미션을 바꾸지 않으므로 `processRefund`와 달리 'mission'을 넣지 않는다.
  confirmRefundDeposit: ['refund', 'proposal', 'summary'],
  voidRefund: ['refund', 'proposal', 'summary'],
  // 신고 승인은 Proposal만 바꾼다(REPORTED). 지원·미션은 바뀌지 않는다.
  processReport: ['report', 'proposal', 'summary'],
}

export function invalidateAdmin(
  queryClient: QueryClient,
  action: AdminMutationAction,
): Promise<void> {
  return Promise.all(
    INVALIDATION_TABLE[action].map((domain) =>
      queryClient.invalidateQueries({ queryKey: adminDomainKey(domain) }),
    ),
  ).then(() => undefined)
}
