/**
 * 목록 표가 그리는 화면 모델(view-model)이다. 목 데이터와 서버 응답 두 원천이
 * 같은 표를 채워야 하므로, 표 컴포넌트는 어느 쪽 원천도 직접 알지 않고 이 모델만 본다.
 * 상태 라벨은 Domain의 `statusLabel.ts`가 이미 결정한 문자열을 담는다.
 */

/**
 * 서버가 잘라 준 한 페이지. 표는 언제나 전체가 아니라 이 한 페이지를 그리므로
 * 전체 건수(`totalElements`)를 함께 들고 다녀 화면이 "이게 전부"라고 오해하게
 * 만들지 않는다.
 */
export interface RowPage<T> {
  rows: T[]
  totalElements: number
  totalPages: number
  /** 0-base. 서버·목 모드가 같은 규약을 쓴다. */
  pageNumber: number
  pageSize: number
}

export interface RequestRow {
  proposalId: string
  hyungnimName: string
  amount: number
  statusLabel: string
  offerCount: number
  createdAt: string
}

export interface DisputeRow {
  disputeId: string
  proposalId: string
  offerId: string
  requesterName: string
  /** 서버 계약상 자유 string이라 union으로 좁히지 않는다. */
  requesterRole: string
  statusLabel: string
  requestedAt: string
}

export interface RefundRow {
  refundId: string
  proposalId: string
  hyungnimName: string
  amount: number
  /** 대상 요청의 상태 라벨. 알 수 없으면 null이며 표는 '해당 없음'을 그린다. */
  requestStatusLabel: string | null
  statusLabel: string
  requestedAt: string
  processedAt: string | null
}

export interface OfferRow {
  offerId: string
  proposalId: string
  kkobungName: string
  amount: number
  statusLabel: string
  selected: boolean
  appliedAt: string
}

export interface MissionRow {
  /** 원천에 따라 미션 ID가 없을 수 있어(수행비 지급 목록) 행 키를 따로 둔다. */
  key: string
  missionId: string | null
  proposalId: string
  hyungnimName: string | null
  /** 이름이 없는 원천(미션 응답)에서 표가 대신 그릴 ID. 없으면 null. */
  hyungnimId: string | null
  kkobungName: string | null
  kkobungId: string | null
  /** 미션 진행 상태 라벨. 지급 목록에서 온 행은 미션 상태를 알 수 없어 null이다. */
  statusLabel: string | null
  /** 수행비 처리 여부 라벨. 처리 대상이 아니면 null이다. */
  payoutStatusLabel: string | null
  openChatUrl: string | null
  createdAt: string | null
}

export interface ReportRow {
  reportId: string
  proposalId: string
  reporterId: string
  reasonQuestionText: string
  detailReason: string | null
  statusLabel: string
  reportedAt: string
}
