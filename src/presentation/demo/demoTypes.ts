// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

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

/** 신고·분쟁·환불이 공유하는 처리 상태. Proposal/지원의 진행 상태와는 다른 축이다. */
export type DemoProcessStatus = '미처리' | '처리 완료' | '반려'

export type DemoStatusLabel =
  | DemoRequestStatus
  | DemoOfferStatus
  | DemoMissionStatus
  | DemoProcessStatus

export type DemoActorRole = '행님' | '꼬붕'

export interface DemoRequest {
  proposalId: string
  hyungnimName: string
  /** 행님이 입금 시 기재한 입금자명. */
  depositorName: string
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
  /** 꼬붕에게 줄 수행비. */
  payoutAmount: number
  payoutAccount: string
  payoutAccountHolder: string
  /** 수행비 입금 처리 여부. 완료된 미션만 대상이다. */
  settlementStatus: DemoProcessStatus
  settledAt: string | null
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
  status: DemoProcessStatus
  requestedAt: string
}

export interface DemoRefund {
  proposalId: string
  hyungnimName: string
  /** 환불금을 받을 행님 계좌. */
  refundAccount: string
  /** 환불 계좌 예금주명. */
  accountHolderName: string
  amount: number
  status: DemoProcessStatus
  reason: string
  requestedAt: string
  processedAt: string | null
  adminNote: string
}

export type DemoSummaryCardKey =
  | 'unpaid'
  | 'dispute'
  | 'refund'
  | 'report'
  | 'settlement'

export interface DemoSummaryCard {
  key: DemoSummaryCardKey
  label: string
  value: number
  hint: string
}

export interface DemoRequestSummary {
  request: DemoRequest
  offerCount: number
  refundStatus: DemoProcessStatus | null
}

export interface DemoProposalReport {
  reportId: string
  targetType: 'Proposal'
  proposalId: string
  reporterId: string
  reasonQuestionText: string
  detailReason?: string
  reportedAt: string
  reportStatus: DemoProcessStatus
  proposalStatus: DemoRequestStatus
}
