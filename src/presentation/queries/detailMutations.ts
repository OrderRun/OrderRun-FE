import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import {
  acceptProposalReport,
  cancelAdminProposal,
  completeAdminPayout,
  completeAdminRefund,
  confirmProposalPayment,
  rejectAdminDispute,
  rejectAdminPayout,
  rejectProposalReport,
  resolveAdminDispute,
} from '../../data/api/adminApi'
import { ApiError } from '../../data/api/apiError'
import type { AdminNoteRequest } from '../../data/api/contracts/adminNote'
import type { MissionResolution } from '../../domain/status/missionStatus'
import type { AdminMutationAction } from './invalidation'
import { invalidateAdmin } from './invalidation'

/**
 * 요청 상세의 처리(mutation) 훅. 각 훅은 `adminApi` 함수 하나만 부르고,
 * 성공하면 `invalidation.ts` 표대로 관련 도메인을 무효화한다.
 *
 * 낙관적 갱신을 하지 않는다. 서버가 무엇을 함께 바꾸는지는 서버만 알고
 * (요청 취소는 지원까지, 신고 승인은 요청만), 화면은 재조회 결과만 그린다.
 *
 * 409는 "이미 처리된 건"이다. 오류를 그대로 보여주되 같은 무효화를 실행해
 * 화면을 서버 진실로 되돌린다.
 */

/**
 * `AdminNoteRequest`는 전 필드 optional이다. 공백뿐인 메모는 필드를 아예 싣지
 * 않는다. `adminId`는 관리자 세션에 출처가 없어(세션은 이름만 들고 있다)
 * 보내지 않는다 — 값을 지어내지 않는다.
 */
function toAdminNoteBody(adminNote: string): AdminNoteRequest {
  const trimmed = adminNote.trim()
  return trimmed === '' ? {} : { adminNote: trimmed }
}

function useAdminMutation<V, R>(
  action: AdminMutationAction,
  run: (variables: V) => Promise<R>,
): UseMutationResult<R, unknown, V> {
  const queryClient = useQueryClient()
  return useMutation<R, unknown, V>({
    mutationFn: run,
    onSuccess: () => invalidateAdmin(queryClient, action),
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        void invalidateAdmin(queryClient, action)
      }
    },
  })
}

export function useConfirmPayment() {
  return useAdminMutation(
    'confirmPayment',
    ({ proposalId, openChatUrl }: { proposalId: number; openChatUrl: string }) =>
      confirmProposalPayment(proposalId, { openChatUrl }),
  )
}

export function useCancelProposal() {
  return useAdminMutation(
    'cancelProposal',
    ({ proposalId, adminNote }: { proposalId: number; adminNote: string }) =>
      cancelAdminProposal(proposalId, toAdminNoteBody(adminNote)),
  )
}

export function useResolveDispute() {
  return useAdminMutation(
    'resolveDispute',
    ({
      disputeId,
      outcome,
      adminNote,
    }: {
      disputeId: number
      outcome: MissionResolution
      adminNote: string
    }) => resolveAdminDispute(disputeId, { outcome, ...toAdminNoteBody(adminNote) }),
  )
}

export function useRejectDispute() {
  return useAdminMutation(
    'rejectDispute',
    ({ disputeId, adminNote }: { disputeId: number; adminNote: string }) =>
      rejectAdminDispute(disputeId, toAdminNoteBody(adminNote)),
  )
}

export function useRefundComplete() {
  return useAdminMutation(
    'processRefund',
    ({ refundId, adminNote }: { refundId: number; adminNote: string }) =>
      completeAdminRefund(refundId, toAdminNoteBody(adminNote)),
  )
}

export function usePayoutComplete() {
  return useAdminMutation(
    'completePayout',
    ({ payoutId, adminNote }: { payoutId: number; adminNote: string }) =>
      completeAdminPayout(payoutId, toAdminNoteBody(adminNote)),
  )
}

export function usePayoutReject() {
  return useAdminMutation(
    'rejectPayout',
    ({ payoutId, adminNote }: { payoutId: number; adminNote: string }) =>
      rejectAdminPayout(payoutId, toAdminNoteBody(adminNote)),
  )
}

export type ReportDecision = 'accept' | 'reject'

/**
 * 신고 승인은 Proposal을 `REPORTED`로 바꾼다(라벨상 '취소'). 연결된 지원·미션은
 * 바뀌지 않으므로 화면도 요청 배지만 바뀐다.
 */
export function useReviewReport() {
  return useAdminMutation(
    'processReport',
    ({ reportId, decision }: { reportId: number; decision: ReportDecision }) =>
      decision === 'accept'
        ? acceptProposalReport(reportId)
        : rejectProposalReport(reportId),
  )
}
