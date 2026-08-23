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
  | 'processRefund'
  | 'processReport'

const INVALIDATION_TABLE: Record<AdminMutationAction, readonly AdminQueryDomain[]> = {
  confirmPayment: ['proposal', 'summary'],
  cancelProposal: ['proposal', 'refund', 'summary'],
  resolveDispute: ['dispute', 'proposal', 'mission', 'payout', 'refund', 'summary'],
  completePayout: ['payout', 'mission', 'summary'],
  processRefund: ['refund', 'proposal', 'mission', 'summary'],
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
