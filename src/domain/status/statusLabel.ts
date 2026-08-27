import type { DisputeProcessStatus } from './disputeStatus'
import type { MissionStatus } from './missionStatus'
import type { OfferStatus } from './offerStatus'
import type { PayoutStatus } from './payoutStatus'
import type { ProposalStatus } from './proposalStatus'
import type { ProposalReportStatus } from './proposalReportStatus'
import type { RefundReason, RefundStatus } from './refundStatus'

/**
 * 서버 상태값 → 운영 화면 라벨. 라벨 문자열은 각 목록 화면의 필터 옵션과
 * 같은 집합이어야 하므로 여기 한 곳에서만 정한다.
 *
 * 진행 상태 축(요청·지원·미션)과 처리 상태 축(신고·분쟁·환불·지급)은 값이
 * 겹치므로(PENDING/REJECTED 등) 하나의 함수로 합치지 않는다.
 */

const REQUEST_STATUS_LABELS: Record<ProposalStatus, string> = {
  HOLDING: '미입금',
  POSTED: '대기중',
  OFFERED: '대기중',
  MATCHED: '진행중',
  ORDER_COMPLETED: '진행중',
  ALL_COMPLETED: '완료',
  DISPUTED: '분쟁중',
  CANCELLED: '취소',
  // TODO: 추후 완료·취소로 분화
  REFUND_PENDING: '취소',
  REFUNDED: '취소',
  REPORTED: '취소',
}

export function toRequestStatusLabel(status: ProposalStatus): string {
  return REQUEST_STATUS_LABELS[status]
}

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  WAITING: '대기중',
  ACCEPTED: '선택됨',
  RUNNER_COMPLETED: '진행중',
  ALL_COMPLETED: '완료',
  DISPUTED: '분쟁중',
  // 지원 화면의 상태 옵션에 '반려'가 없어 종료 계열 2값을 '취소'로 접는다.
  REJECTED: '취소',
  CANCELLED: '취소',
}

export function toOfferStatusLabel(status: OfferStatus): string {
  return OFFER_STATUS_LABELS[status]
}

/**
 * 수행비 입금 여부는 '처리 여부' 축이 따로 그리므로 진행 상태 축에서는 구분하지
 * 않는다. `COMPLETED`와 `PAID`는 운영 화면에서 똑같이 '완료'다.
 */
const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  STARTED: '진행중',
  DISPUTED: '분쟁중',
  COMPLETED: '완료',
  PAID: '완료',
  FAILED: '취소',
}

export function toMissionStatusLabel(status: MissionStatus): string {
  return MISSION_STATUS_LABELS[status]
}

const REPORT_STATUS_LABELS: Record<ProposalReportStatus, string> = {
  PENDING: '미처리',
  ACCEPTED: '처리 완료',
  REJECTED: '반려',
}

export function toReportStatusLabel(status: ProposalReportStatus): string {
  return REPORT_STATUS_LABELS[status]
}

const DISPUTE_STATUS_LABELS: Record<DisputeProcessStatus, string> = {
  PENDING: '미처리',
  RESOLVED: '처리 완료',
}

export function toDisputeStatusLabel(status: DisputeProcessStatus): string {
  return DISPUTE_STATUS_LABELS[status]
}

const PAYOUT_STATUS_LABELS: Record<PayoutStatus, string> = {
  PENDING: '미처리',
  COMPLETED: '처리 완료',
  REJECTED: '반려',
}

/** 환불과 수행비 지급이 같은 `PayoutStatus`를 공유하므로 라벨 함수도 하나다. */
export function toPayoutStatusLabel(status: PayoutStatus): string {
  return PAYOUT_STATUS_LABELS[status]
}

/**
 * 미션 목록·상세의 '처리 여부'. 수행비 지급은 **미션이 완료된 건에만** 존재하는
 * 축이므로, 미션이 완료(`COMPLETED`/`PAID`)일 때만 서버의 `settlementStatus`를
 * 그린다. 진행중·분쟁중·취소는 아직/영영 지급 대상이 아니라 null이며 화면은
 * '해당 없음'을 그린다. `settlementPaid` boolean은 이 판단에 쓰지 않는다.
 */
export function toMissionPayoutStatusLabel(
  status: MissionStatus,
  settlementStatus: PayoutStatus,
): string | null {
  if (status !== 'COMPLETED' && status !== 'PAID') {
    return null
  }
  return toPayoutStatusLabel(settlementStatus)
}

const REFUND_STATUS_LABELS: Record<RefundStatus, string> = {
  REVIEW: '확인 필요',
  PENDING: '미처리',
  COMPLETED: '처리 완료',
  VOIDED: '해당 사항 없음',
}

/**
 * 환불에는 반려가 없다(서버가 반려 endpoint를 없앴다). `REVIEW`는 아직 환불
 * 의무가 확정되지 않은 입금 대조 단계이고, `VOIDED`는 받은 돈이 없어 환불 없이
 * 종결한 건이다.
 */
export function toRefundStatusLabel(status: RefundStatus): string {
  return REFUND_STATUS_LABELS[status]
}

const REFUND_REASON_LABELS: Record<RefundReason, string> = {
  USER_CANCELLED: '행님 취소',
  ADMIN_CANCELLED: '관리자 취소',
  DISPUTE_FAILED: '분쟁 환불',
  PAYMENT_EXPIRED: '입금 기한 만료',
}

export function toRefundReasonLabel(reason: RefundReason): string {
  return REFUND_REASON_LABELS[reason]
}

/**
 * 환불 목록·상세의 '처리 여부'.
 *
 * **`RefundStatus`를 먼저 본다.** `REVIEW`(입금 대조 전)와 `VOIDED`(입금이 없어
 * 종결)는 요청 상태가 무엇이든 환불 의무가 있는 건이 아니다. 이 둘을 요청 상태
 * 보정보다 앞에 두지 않으면 `REVIEW` 건이 '미처리'로 보여 없는 환불 의무를
 * 이행하게 된다. `VOIDED`는 라벨이 아니라 null이고 화면은 '해당 사항 없음'을
 * 그린다(배지가 아니다).
 *
 * 나머지(`PENDING`/`COMPLETED`)에서만 요청 상태로 보정한다: 환불이 필요하다고
 * 확정된 요청(`REFUND_PENDING`)이 미처리이고, 이체를 마치면 요청이 `REFUNDED`가
 * 되면서 처리 완료다. 서버 두 값은 1:1로 맞물리지만(PENDING↔REFUND_PENDING,
 * COMPLETED↔REFUNDED) 한쪽이 앞서 갱신될 때 빈 칸을 만들지 않기 위해서다.
 */
export function toRefundProcessLabel(
  proposalStatus: ProposalStatus,
  status: RefundStatus,
): string | null {
  if (status === 'VOIDED') {
    return null
  }
  if (status === 'REVIEW') {
    return toRefundStatusLabel(status)
  }
  if (proposalStatus === 'REFUND_PENDING') {
    return '미처리'
  }
  if (proposalStatus === 'REFUNDED') {
    return '처리 완료'
  }
  return toRefundStatusLabel(status)
}
