// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

import type { RequestTabKey } from '../pages/requests/requestTabs'

export type DemoRequestStatus =
  | '미입금'
  | '대기중'
  | '진행중'
  | '완료'
  | '취소'
  | '분쟁중'

export type DemoOfferStatus =
  | '대기중'
  | '선택됨'
  | '진행중'
  | '완료'
  | '취소'
  | '분쟁중'

export type DemoMissionStatus = '진행중' | '완료' | '취소' | '분쟁중'

export type DemoDisputeStatus = '미처리' | '처리 완료'

export type DemoRefundStatus = '환불 필요' | '환불 완료' | '환불 실패'

export type DemoStatusLabel =
  | DemoRequestStatus
  | DemoOfferStatus
  | DemoMissionStatus
  | DemoDisputeStatus
  | DemoRefundStatus

export type DemoActorRole = '행님' | '꼬붕'

export interface DemoRequest {
  proposalId: string
  hyungnimName: string
  amount: number
  status: DemoRequestStatus
  createdAt: string
  selectedOfferId: string | null
  missionId: string | null
}

export interface DemoOffer {
  offerId: string
  proposalId: string
  kkobungName: string
  amount: number
  status: DemoOfferStatus
  appliedAt: string
  selected: boolean
  message: string
}

export interface DemoMission {
  missionId: string
  proposalId: string
  offerId: string
  hyungnimName: string
  kkobungName: string
  status: DemoMissionStatus
  openChatUrl: string
  createdAt: string
}

export interface DemoDispute {
  disputeId: string
  proposalId: string
  offerId: string
  missionId: string
  requesterName: string
  requesterRole: DemoActorRole
  targetName: string
  targetRole: DemoActorRole
  reason: string
  status: DemoDisputeStatus
  requestedAt: string
}

export interface DemoRefund {
  proposalId: string
  hyungnimName: string
  amount: number
  status: DemoRefundStatus
  reason: string
  requestedAt: string
  processedAt: string | null
  adminNote: string
}

export type DemoTaskType = '요청' | '분쟁' | '환불'

export interface DemoTaskItem {
  taskId: string
  type: DemoTaskType
  proposalId: string
  status: DemoStatusLabel
  content: string
  occurredAt: string
  tab: RequestTabKey | null
}

export type DemoSummaryCardKey = 'unpaid' | 'dispute' | 'refund' | 'report'

export interface DemoSummaryCard {
  key: DemoSummaryCardKey
  label: string
  value: number
  hint: string
}

export interface DemoRequestSummary {
  request: DemoRequest
  offerCount: number
  refundStatus: DemoRefundStatus | null
}

export interface DemoProposalReport {
  reportId: string
  targetType: 'Proposal'
  proposalId: string
  reporterId: string
  reasonQuestionText: string
  detailReason?: string
  reportedAt: string
  reportStatus: DemoDisputeStatus
  proposalStatus: DemoRequestStatus
}
