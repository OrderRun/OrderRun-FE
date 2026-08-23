/**
 * 요청 상세 화면(상세 카드 + 탭 5개)이 그리는 view-model이다. 목 데이터와 서버
 * 응답 두 원천이 같은 화면을 채우므로, 화면 컴포넌트는 어느 원천도 직접 알지
 * 않고 이 모델만 본다. 상태 라벨은 Domain `statusLabel.ts`가 정한 문자열이다.
 *
 * 서버가 내려주지 않는 값(미션 응답의 행님·꼬붕 이름 등)은 만들어내지 않고
 * ID 또는 null로 둔다. 화면은 null을 '해당 없음'으로 그린다.
 */

export interface RequestDetailView {
  proposalId: string
  hyungnimName: string
  amount: number
  statusLabel: string
  createdAt: string
  /** 미션의 오픈채팅방 URL. 서버 상세는 요청에 이 값을 싣는다. */
  openChatUrl: string | null
  acceptedOfferId: string | null
  acceptedRunnerName: string | null
  /** 환불·지급 탭의 리소스 ID이기도 하다(서버 규약: refundId = payoutId = 미션 ID). */
  missionId: number | null
  adminNote: string | null
  depositorName: string | null
  /** `은행 계좌번호`로 합친 문자열. 둘 중 하나라도 없으면 null이다. */
  depositAccount: string | null
  depositAccountHolder: string | null
  /** 입금 확인 가능 여부. 최종 판단은 서버가 하며 실패는 409/400으로 드러난다. */
  canConfirmPayment: boolean
  /** 요청 취소 가능 여부. 최종 판단은 서버가 한다. */
  canCancel: boolean
  /** 취소 시 환불 처리가 필요한 건인지(입금 이후인지). */
  refundRequired: boolean
}

export interface MissionDetailView {
  missionId: string
  proposalId: string
  offerId: string
  /** `MissionResponse`에는 이름이 없다. 없으면 null이고 화면이 ID로 대신 그린다. */
  hyungnimName: string | null
  hyungnimId: string | null
  kkobungName: string | null
  kkobungId: string | null
  statusLabel: string
  /** 수행비 처리 여부 라벨. 지급 대상이 아니면 null. */
  payoutStatusLabel: string | null
  /** 수행비 입금(지급 완료 기록)이 필요한 상태인지. */
  payoutRequired: boolean
  /** 지급 탭 대상인지(지급이 필요하거나 이미 지급된 건). */
  payoutTarget: boolean
  /** 환불 탭 대상인지. */
  refundTarget: boolean
  errandFee: number
  createdAt: string
  startedAt: string
  hyungnimCompletedAt: string | null
  kkobungCompletedAt: string | null
  settlementPaidAt: string | null
  payoutMemo: string | null
}

export interface DisputeDetailView {
  disputeId: string
  proposalId: string
  offerId: string
  missionId: string | null
  requesterName: string
  requesterRole: string
  targetName: string
  targetRole: string
  reason: string
  statusLabel: string
  /** 미처리 상태여야 처리·반려 버튼을 노출한다. */
  pending: boolean
  requestedAt: string
  resolvedAt: string | null
  adminNote: string | null
  requestStatusLabel: string
  offerStatusLabel: string
  /** 이 요청에 접수된 분쟁 총 건수. 2건 이상이면 화면이 안내 문구를 덧붙인다. */
  totalCount: number
}

export interface RefundDetailView {
  /** 서버 규약상 미션 ID와 같다. */
  refundId: string
  proposalId: string
  amount: number
  statusLabel: string
  pending: boolean
  reason: string | null
  requestedAt: string
  processedAt: string | null
  refundAccount: string | null
  refundAccountHolder: string | null
  adminNote: string | null
  requestStatusLabel: string
}

export interface PayoutDetailView {
  /** 서버 규약상 미션 ID와 같다. */
  payoutId: string
  proposalId: string
  offerId: string
  kkobungName: string
  amount: number
  statusLabel: string
  pending: boolean
  settledAt: string | null
  payoutAccount: string | null
  payoutAccountHolder: string | null
  adminNote: string | null
}

/**
 * 처리(mutation) 버튼의 화면 상태. 목 모드에서는 서버 전이를 흉내 낼 수 없으므로
 * `disabled`와 안내 문구를 채워 버튼을 막는다.
 */
export interface ActionState {
  pending: boolean
  /** 실패 문구. 성공 전까지 모달을 연 채로 보여준다. */
  error: string | null
  disabled: boolean
  /** 막힌 이유. 버튼 옆 안내 문구로 그린다. 없으면 null. */
  disabledReason: string | null
  /** 지난 실패 문구를 지운다. 모달을 열고 닫을 때 부른다. */
  reset: () => void
}
