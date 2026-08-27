import { DISPUTE_PROCESS_STATUSES } from './disputeStatus'
import { MISSION_STATUSES } from './missionStatus'
import { OFFER_STATUSES } from './offerStatus'
import { PAYOUT_STATUSES } from './payoutStatus'
import { REFUND_STATUSES } from './refundStatus'
import { PROPOSAL_REPORT_STATUSES } from './proposalReportStatus'
import type { ProposalReportStatus } from './proposalReportStatus'
import { PROPOSAL_STATUSES } from './proposalStatus'
import {
  toDisputeStatusLabel,
  toMissionStatusLabel,
  toOfferStatusLabel,
  toPayoutStatusLabel,
  toRefundStatusLabel,
  toReportStatusLabel,
  toRequestStatusLabel,
} from './statusLabel'

/**
 * 화면 필터 옵션(한글 라벨) → 서버 상태값. 라벨 매핑은 다대일이므로 역방향은
 * **라벨 하나 → 상태값 배열**이다(예: '취소' → CANCELLED·RESOLVED·REPORTED).
 * 목록 endpoint의 `status`가 반복 파라미터라 배열을 그대로 실을 수 있다.
 *
 * 옵션 목록과 역매핑을 모두 `statusLabel.ts` 한 원본에서 파생하므로 둘이
 * 어긋날 수 없다. 각 화면에 옵션을 하드코딩하지 않는다.
 */

export const ALL_STATUS_OPTION = '전체'

interface StatusFilter<T extends string> {
  /** `['전체', ...중복 제거 라벨]`. 라벨 순서는 상태값 선언 순서를 따른다. */
  options: string[]
  /** '전체'이거나 알 수 없는 값이면 `undefined`(= 필터 없음). */
  toFilter: (option: string) => readonly T[] | undefined
}

function buildStatusFilter<T extends string>(
  statuses: readonly T[],
  toLabel: (status: T) => string,
): StatusFilter<T> {
  const byLabel = new Map<string, T[]>()

  for (const status of statuses) {
    const label = toLabel(status)
    const bucket = byLabel.get(label)
    if (bucket === undefined) {
      byLabel.set(label, [status])
    } else {
      bucket.push(status)
    }
  }

  return {
    options: [ALL_STATUS_OPTION, ...byLabel.keys()],
    toFilter: (option) => byLabel.get(option),
  }
}

const proposalFilter = buildStatusFilter(PROPOSAL_STATUSES, toRequestStatusLabel)
export const PROPOSAL_STATUS_FILTER_OPTIONS = proposalFilter.options
export const toProposalStatusFilter = proposalFilter.toFilter

const offerFilter = buildStatusFilter(OFFER_STATUSES, toOfferStatusLabel)
export const OFFER_STATUS_FILTER_OPTIONS = offerFilter.options
export const toOfferStatusFilter = offerFilter.toFilter

const missionFilter = buildStatusFilter(MISSION_STATUSES, toMissionStatusLabel)
export const MISSION_STATUS_FILTER_OPTIONS = missionFilter.options
export const toMissionStatusFilter = missionFilter.toFilter

const disputeFilter = buildStatusFilter(DISPUTE_PROCESS_STATUSES, toDisputeStatusLabel)
export const DISPUTE_STATUS_FILTER_OPTIONS = disputeFilter.options
export const toDisputeStatusFilter = disputeFilter.toFilter

const payoutFilter = buildStatusFilter(PAYOUT_STATUSES, toPayoutStatusLabel)
export const PAYOUT_STATUS_FILTER_OPTIONS = payoutFilter.options
export const toPayoutStatusFilter = payoutFilter.toFilter

/**
 * 환불은 지급과 상태 집합 자체가 다르다(반려가 없고 `REVIEW`·`VOIDED`가 있다).
 * 환불 화면은 반드시 이 필터를 쓴다. 지급 필터를 빌려 쓰면 없는 옵션('반려')이
 * 뜨고 `toRefundStatusFilter`가 undefined를 돌려줘 필터가 조용히 무시된다.
 */
const refundFilter = buildStatusFilter(REFUND_STATUSES, toRefundStatusLabel)
export const REFUND_STATUS_FILTER_OPTIONS = refundFilter.options
export const toRefundStatusFilter = refundFilter.toFilter

const reportFilter = buildStatusFilter(PROPOSAL_REPORT_STATUSES, toReportStatusLabel)
export const REPORT_STATUS_FILTER_OPTIONS = reportFilter.options

/**
 * `GET /v1/admin/proposal-reports`의 `status`만 단일값이다. 라벨과 상태값이
 * 1:1이라 배열의 첫 값을 쓴다.
 */
export function toReportStatusFilter(
  option: string,
): ProposalReportStatus | undefined {
  return reportFilter.toFilter(option)?.[0]
}
