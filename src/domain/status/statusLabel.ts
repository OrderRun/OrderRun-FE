import type { DisputeProcessStatus } from './disputeStatus'
import type { MissionStatus } from './missionStatus'
import type { OfferStatus } from './offerStatus'
import type { PayoutStatus } from './payoutStatus'
import type { ProposalStatus } from './proposalStatus'
import type { ProposalReportStatus } from './proposalReportStatus'

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
  REJECTED: '반려',
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
