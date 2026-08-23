import type { AdminDisputeSummaryResponse } from '../../data/api/contracts/dispute'
import type { MissionResponse } from '../../data/api/contracts/mission'
import type { AdminOfferSummaryResponse } from '../../data/api/contracts/offer'
import type { AdminPayoutSummaryResponse } from '../../data/api/contracts/payout'
import type { AdminProposalSummaryResponse } from '../../data/api/contracts/proposal'
import type { ProposalReportResponse } from '../../data/api/contracts/proposalReport'
import type { AdminRefundSummaryResponse } from '../../data/api/contracts/refund'
import {
  toDisputeStatusLabel,
  toMissionPayoutStatusLabel,
  toMissionStatusLabel,
  toOfferStatusLabel,
  toPayoutStatusLabel,
  toReportStatusLabel,
  toRequestStatusLabel,
} from '../../domain/status/statusLabel'
import { formatDateTime } from '../components/formatters'
import type {
  DisputeRow,
  MissionRow,
  OfferRow,
  RefundRow,
  ReportRow,
  RequestRow,
} from './rows'

/**
 * 서버 DTO → 표 view-model 변환 경계. 이름 있는 이 한 곳에서만 변환한다.
 * 이름이 없는 응답(`*Name`은 스펙상 nullable)은 ID로 대체해 빈 칸을 만들지 않는다.
 */

export function toRequestRowFromApi(dto: AdminProposalSummaryResponse): RequestRow {
  return {
    proposalId: String(dto.id),
    hyungnimName: dto.ordererName ?? dto.ordererId,
    amount: dto.errandFee,
    statusLabel: toRequestStatusLabel(dto.status),
    offerCount: dto.offerCount,
    createdAt: formatDateTime(dto.createdAt),
  }
}

export function toOfferRowFromApi(dto: AdminOfferSummaryResponse): OfferRow {
  return {
    offerId: String(dto.id),
    proposalId: String(dto.proposalId),
    kkobungName: dto.runnerName ?? dto.runnerId,
    amount: dto.amount,
    statusLabel: toOfferStatusLabel(dto.status),
    selected: dto.accepted,
    appliedAt: formatDateTime(dto.createdAt),
  }
}

/**
 * `MissionResponse`에는 행님·꼬붕 이름도 오픈채팅방 URL도 없다(스펙 확인).
 * 없는 값을 만들어내지 않고 ID만 넘겨 표가 ID 축약으로 대신 그리게 한다.
 */
export function toMissionRowFromApi(dto: MissionResponse): MissionRow {
  return {
    key: `mission-${dto.id}`,
    missionId: String(dto.id),
    proposalId: String(dto.proposalId),
    hyungnimName: null,
    hyungnimId: dto.ordererId,
    kkobungName: null,
    kkobungId: dto.runnerId,
    statusLabel: toMissionStatusLabel(dto.status),
    payoutStatusLabel: toMissionPayoutStatusLabel(dto.status),
    openChatUrl: null,
    createdAt: formatDateTime(dto.createdAt),
  }
}

export function toDisputeRowFromApi(dto: AdminDisputeSummaryResponse): DisputeRow {
  return {
    disputeId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    requesterName: dto.requesterName ?? dto.requesterId,
    requesterRole: dto.requesterRole,
    statusLabel: toDisputeStatusLabel(dto.status),
    requestedAt: formatDateTime(dto.createdAt),
  }
}

export function toRefundRowFromApi(dto: AdminRefundSummaryResponse): RefundRow {
  return {
    refundId: String(dto.id),
    proposalId: String(dto.proposalId),
    hyungnimName: dto.ordererName ?? dto.ordererId,
    amount: dto.amount,
    requestStatusLabel: toRequestStatusLabel(dto.proposalStatus),
    statusLabel: toPayoutStatusLabel(dto.status),
    requestedAt: formatDateTime(dto.requestedAt),
    processedAt: dto.processedAt === undefined || dto.processedAt === null
      ? null
      : formatDateTime(dto.processedAt),
  }
}

/**
 * 수행비 지급 목록을 미션 행으로 채운다. 지급 응답에는 미션 ID·행님·오픈채팅방·
 * 미션 상태가 없으므로 추측하지 않고 null로 둔다(표는 '해당 없음'을 그린다).
 */
export function toMissionRowFromPayout(dto: AdminPayoutSummaryResponse): MissionRow {
  return {
    key: `payout-${dto.id}`,
    missionId: null,
    proposalId: String(dto.proposalId),
    hyungnimName: null,
    hyungnimId: null,
    kkobungName: dto.runnerName ?? dto.runnerId,
    kkobungId: dto.runnerId,
    statusLabel: null,
    payoutStatusLabel: toPayoutStatusLabel(dto.status),
    openChatUrl: null,
    createdAt: dto.settledAt === undefined || dto.settledAt === null
      ? null
      : formatDateTime(dto.settledAt),
  }
}

export function toReportRowFromApi(dto: ProposalReportResponse): ReportRow {
  return {
    reportId: String(dto.id),
    proposalId: String(dto.proposalId),
    reporterId: dto.reporterId,
    reasonQuestionText: dto.reasonQuestionText,
    detailReason: dto.detailReason ?? null,
    statusLabel: toReportStatusLabel(dto.status),
    reportedAt: formatDateTime(dto.createdAt),
  }
}
