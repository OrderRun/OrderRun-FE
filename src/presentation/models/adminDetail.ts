import type { AdminDisputeDetailResponse } from '../../data/api/contracts/dispute'
import type { MissionResponse } from '../../data/api/contracts/mission'
import type { AdminPayoutDetailResponse } from '../../data/api/contracts/payout'
import type { AdminProposalDetailResponse } from '../../data/api/contracts/proposal'
import type { AdminRefundDetailResponse } from '../../data/api/contracts/refund'
import type { ProposalStatus } from '../../domain/status/proposalStatus'
import {
  toDisputeStatusLabel,
  toMissionStatusLabel,
  toOfferStatusLabel,
  toPayoutStatusLabel,
  toRequestStatusLabel,
} from '../../domain/status/statusLabel'
import { formatDateTime } from '../components/formatters'
import type {
  DisputeDetailView,
  MissionDetailView,
  PayoutDetailView,
  RefundDetailView,
  RequestDetailView,
} from './detailViews'
import { optionalText } from './optionalText'

/**
 * 서버 DTO → 요청 상세 view-model 변환 경계. 이름 있는 이 한 곳에서만 변환한다.
 * 액션 노출 조건도 여기서 정해 화면 컴포넌트가 상태값을 직접 판단하지 않게 한다.
 * 실제 가능 여부는 서버가 판단하며(409), 여기 조건은 화면의 노출 규칙일 뿐이다.
 */

/** 기존 화면의 취소 가능 조건('미입금'·'대기중')에 대응하는 서버 상태값. */
const CANCELLABLE_STATUSES: readonly ProposalStatus[] = ['HOLDING', 'POSTED', 'OFFERED']

function optionalDateTime(value: string | null | undefined): string | null {
  return value === null || value === undefined ? null : formatDateTime(value)
}

/** `은행 계좌번호`. 둘 중 하나라도 없으면 반쪽짜리 계좌를 만들지 않고 null이다. */
function toAccountText(
  bankName: string | null | undefined,
  accountNumber: string | null | undefined,
): string | null {
  if (bankName === null || bankName === undefined) return null
  if (accountNumber === null || accountNumber === undefined) return null
  return `${bankName} ${accountNumber}`
}

export function toRequestDetailView(dto: AdminProposalDetailResponse): RequestDetailView {
  return {
    proposalId: String(dto.id),
    hyungnimName: dto.ordererName,
    amount: dto.errandFee,
    statusLabel: toRequestStatusLabel(dto.status),
    createdAt: formatDateTime(dto.createdAt),
    title: dto.title,
    content: dto.content,
    deadline: formatDateTime(dto.deadline),
    openChatUrl: optionalText(dto.openChatUrl),
    acceptedOfferId:
      dto.acceptedOfferId === null || dto.acceptedOfferId === undefined
        ? null
        : String(dto.acceptedOfferId),
    missionId: dto.missionId ?? null,
    adminNote: optionalText(dto.adminNote),
    depositorName: optionalText(dto.depositorName),
    depositAccount: toAccountText(dto.depositBankName, dto.depositAccountNumber),
    depositAccountHolder: optionalText(dto.depositAccountHolder),
    canConfirmPayment: dto.status === 'HOLDING',
    canCancel: CANCELLABLE_STATUSES.includes(dto.status),
    // 입금 전(HOLDING) 요청은 돌려줄 돈이 없다.
    refundRequired: dto.status !== 'HOLDING',
  }
}

export function toMissionDetailView(dto: MissionResponse): MissionDetailView {
  return {
    missionId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    hyungnimName: dto.ordererName,
    kkobungName: dto.runnerName,
    openChatUrl: optionalText(dto.openChatUrl),
    statusLabel: toMissionStatusLabel(dto.status),
    payoutStatusLabel: toPayoutStatusLabel(dto.settlementStatus),
    payoutRequired: dto.status === 'COMPLETED',
    payoutTarget: dto.status === 'COMPLETED' || dto.status === 'PAID',
    refundTarget: dto.status === 'FAILED' || dto.status === 'REFUNDED',
    errandFee: dto.errandFee,
    createdAt: formatDateTime(dto.createdAt),
    startedAt: formatDateTime(dto.startedAt),
    hyungnimCompletedAt: optionalDateTime(dto.ordererConfirmedAt),
    kkobungCompletedAt: optionalDateTime(dto.runnerConfirmedAt),
    settlementPaidAt: optionalDateTime(dto.settlementPaidAt),
    payoutMemo: optionalText(dto.payoutMemo),
  }
}

export function toDisputeDetailView(
  dto: AdminDisputeDetailResponse,
  totalCount: number,
): DisputeDetailView {
  return {
    disputeId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    missionId: String(dto.missionId),
    requesterName: dto.requesterName,
    requesterRole: dto.requesterRole,
    targetName: dto.targetName,
    targetRole: dto.targetRole,
    reason: dto.reason,
    statusLabel: toDisputeStatusLabel(dto.status),
    pending: dto.status === 'PENDING',
    requestedAt: formatDateTime(dto.createdAt),
    resolvedAt: optionalDateTime(dto.resolvedAt),
    adminNote: optionalText(dto.adminNote),
    requestStatusLabel: toRequestStatusLabel(dto.proposalStatus),
    offerStatusLabel: toOfferStatusLabel(dto.offerStatus),
    totalCount,
  }
}

export function toRefundDetailView(dto: AdminRefundDetailResponse): RefundDetailView {
  return {
    refundId: String(dto.id),
    proposalId: String(dto.proposalId),
    amount: dto.amount,
    statusLabel: toPayoutStatusLabel(dto.status),
    pending: dto.status === 'PENDING',
    reason: optionalText(dto.reason),
    requestedAt: formatDateTime(dto.requestedAt),
    processedAt: optionalDateTime(dto.processedAt),
    refundAccount: toAccountText(dto.refundBankName, dto.refundAccountNumber),
    refundAccountHolder: optionalText(dto.refundAccountHolder),
    adminNote: optionalText(dto.adminNote),
    requestStatusLabel: toRequestStatusLabel(dto.proposalStatus),
  }
}

export function toPayoutDetailView(dto: AdminPayoutDetailResponse): PayoutDetailView {
  return {
    payoutId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    kkobungName: dto.runnerName,
    amount: dto.amount,
    statusLabel: toPayoutStatusLabel(dto.status),
    pending: dto.status === 'PENDING',
    settledAt: optionalDateTime(dto.settledAt),
    payoutAccount: toAccountText(dto.payoutBankName, dto.payoutAccountNumber),
    payoutAccountHolder: optionalText(dto.payoutAccountHolder),
    adminNote: optionalText(dto.adminNote),
  }
}
