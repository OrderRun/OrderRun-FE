import type { AdminDisputeSummaryResponse } from '../../data/api/contracts/dispute'
import type { MissionResponse } from '../../data/api/contracts/mission'
import type { AdminOfferSummaryResponse } from '../../data/api/contracts/offer'
import type { AdminProposalSummaryResponse } from '../../data/api/contracts/proposal'
import type { AdminProposalReportResponse } from '../../data/api/contracts/proposalReport'
import type { AdminRefundSummaryResponse } from '../../data/api/contracts/refund'
import type { AdminUserSummaryResponse } from '../../data/api/contracts/user'
import {
  toDisputeStatusLabel,
  toMissionPayoutStatusLabel,
  toMissionStatusLabel,
  toOfferStatusLabel,
  toRefundProcessLabel,
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
  UserRow,
} from './rows'

/**
 * 서버 DTO → 표 view-model 변환 경계. 이름 있는 이 한 곳에서만 변환한다.
 * 관리자 계약의 필수 이름은 서버 표시값(`탈퇴한 사용자` 포함)을 그대로 실어 보낸다.
 */

export function toRequestRowFromApi(dto: AdminProposalSummaryResponse): RequestRow {
  return {
    proposalId: String(dto.id),
    hyungnimName: dto.ordererName,
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
    kkobungName: dto.runnerName,
    amount: dto.amount,
    statusLabel: toOfferStatusLabel(dto.status),
    selected: dto.accepted,
    appliedAt: formatDateTime(dto.createdAt),
  }
}

/** `openChatUrl`만 optional/nullable이며 필수 이름은 서버 값을 그대로 쓴다. */
export function toMissionRowFromApi(dto: MissionResponse): MissionRow {
  return {
    key: `mission-${dto.id}`,
    missionId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    hyungnimName: dto.ordererName,
    kkobungName: dto.runnerName,
    statusLabel: toMissionStatusLabel(dto.status),
    payoutStatusLabel: toMissionPayoutStatusLabel(dto.status, dto.settlementStatus),
    openChatUrl: optionalText(dto.openChatUrl),
    createdAt: formatDateTime(dto.createdAt),
  }
}

export function toDisputeRowFromApi(dto: AdminDisputeSummaryResponse): DisputeRow {
  return {
    disputeId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    requesterName: dto.requesterName,
    requesterRole: dto.requesterRole,
    statusLabel: toDisputeStatusLabel(dto.status),
    requestedAt: formatDateTime(dto.createdAt),
  }
}

export function toRefundRowFromApi(dto: AdminRefundSummaryResponse): RefundRow {
  return {
    refundId: String(dto.id),
    proposalId: String(dto.proposalId),
    hyungnimName: dto.ordererName,
    amount: dto.amount,
    requestStatusLabel: toRequestStatusLabel(dto.proposalStatus),
    statusLabel: toRefundProcessLabel(dto.proposalStatus, dto.status),
    requestedAt: formatDateTime(dto.requestedAt),
    processedAt: dto.processedAt === undefined || dto.processedAt === null
      ? null
      : formatDateTime(dto.processedAt),
  }
}

/** 수행비 지급 목록의 `MissionResponse`를 미션 행으로 채운다. */
export function toMissionRowFromPayout(dto: MissionResponse): MissionRow {
  return {
    key: `payout-${dto.id}`,
    missionId: String(dto.id),
    proposalId: String(dto.proposalId),
    offerId: String(dto.offerId),
    hyungnimName: dto.ordererName,
    kkobungName: dto.runnerName,
    statusLabel: toMissionStatusLabel(dto.status),
    payoutStatusLabel: toMissionPayoutStatusLabel(dto.status, dto.settlementStatus),
    openChatUrl: optionalText(dto.openChatUrl),
    createdAt: formatDateTime(dto.createdAt),
  }
}

/** 탈퇴한 사용자의 표시용 이름도 서버가 채워 보내므로 UI에서 따로 분기하지 않는다. */
export function toUserRowFromApi(dto: AdminUserSummaryResponse): UserRow {
  return {
    id: dto.id,
    name: dto.name,
    createdAt: formatDateTime(dto.createdAt),
    missionCount: dto.missionCount,
  }
}

export function toReportRowFromApi(dto: AdminProposalReportResponse): ReportRow {
  return {
    reportId: String(dto.id),
    proposalId: String(dto.proposalId),
    reporterId: dto.reporterId,
    reporterName: dto.reporterName,
    reasonQuestionText: dto.reasonQuestionText,
    detailReason: dto.detailReason ?? null,
    statusLabel: toReportStatusLabel(dto.status),
    reportedAt: formatDateTime(dto.createdAt),
  }
}
