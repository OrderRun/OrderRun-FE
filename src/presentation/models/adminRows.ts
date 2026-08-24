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
import { optionalText } from './optionalText'
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
 * 이름(`*Name`은 스펙상 nullable)과 ID를 여기서 합치지 않고 따로 실어 보낸다.
 * 이름이 없을 때 무엇을 대신 그릴지는 표현의 문제이므로 `ActorName`이 정한다.
 */

export function toRequestRowFromApi(dto: AdminProposalSummaryResponse): RequestRow {
  return {
    proposalId: String(dto.id),
    hyungnimName: optionalText(dto.ordererName),
    hyungnimId: optionalText(dto.ordererId),
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
    kkobungName: optionalText(dto.runnerName),
    kkobungId: optionalText(dto.runnerId),
    amount: dto.amount,
    statusLabel: toOfferStatusLabel(dto.status),
    selected: dto.accepted,
    appliedAt: formatDateTime(dto.createdAt),
  }
}

/**
 * `MissionResponse`의 이름과 오픈채팅방 URL은 optional/nullable이다. 비어 있으면
 * null로 정규화하고, 이름이 없을 때는 짝 ID를 넘겨 표가 대신 그리게 한다.
 */
export function toMissionRowFromApi(dto: MissionResponse): MissionRow {
  return {
    key: `mission-${dto.id}`,
    missionId: String(dto.id),
    proposalId: String(dto.proposalId),
    hyungnimName: optionalText(dto.ordererName),
    hyungnimId: optionalText(dto.ordererId),
    kkobungName: optionalText(dto.runnerName),
    kkobungId: optionalText(dto.runnerId),
    statusLabel: toMissionStatusLabel(dto.status),
    payoutStatusLabel: toMissionPayoutStatusLabel(dto.status),
    openChatUrl: optionalText(dto.openChatUrl),
    createdAt: formatDateTime(dto.createdAt),
  }
}

export function toDisputeRowFromApi(dto: AdminDisputeSummaryResponse): DisputeRow {
  return {
    disputeId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    requesterName: optionalText(dto.requesterName),
    requesterId: optionalText(dto.requesterId),
    requesterRole: dto.requesterRole,
    statusLabel: toDisputeStatusLabel(dto.status),
    requestedAt: formatDateTime(dto.createdAt),
  }
}

export function toRefundRowFromApi(dto: AdminRefundSummaryResponse): RefundRow {
  return {
    refundId: String(dto.id),
    proposalId: String(dto.proposalId),
    hyungnimName: optionalText(dto.ordererName),
    hyungnimId: optionalText(dto.ordererId),
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
    kkobungName: optionalText(dto.runnerName),
    kkobungId: optionalText(dto.runnerId),
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
    reporterName: optionalText(dto.reporterName),
    reasonQuestionText: dto.reasonQuestionText,
    detailReason: dto.detailReason ?? null,
    statusLabel: toReportStatusLabel(dto.status),
    reportedAt: formatDateTime(dto.createdAt),
  }
}
