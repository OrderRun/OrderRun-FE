import type {
  DemoDispute,
  DemoMission,
  DemoOffer,
  DemoProposalReport,
  DemoRefund,
  DemoRequestSummary,
  DemoUser,
} from '../demo/demoTypes'
import { findDemoRequestStatus } from '../demo/demoSelectors'
import type {
  DisputeRow,
  MissionRow,
  OfferRow,
  RefundRow,
  ReportRow,
  RequestRow,
  UserRow,
} from '../models/rows'

/**
 * 목 데이터를 표 view-model로 옮기는 어댑터. `src/presentation/demo/`는 수정하지
 * 않고 여기서만 읽는다. 목 데이터의 상태 문자열은 이미 화면 라벨과 같은 값이다.
 */

export function toRequestRow(summary: DemoRequestSummary): RequestRow {
  return {
    proposalId: summary.request.proposalId,
    hyungnimName: summary.request.hyungnimName,
    amount: summary.request.amount,
    statusLabel: summary.request.status,
    offerCount: summary.offerCount,
    createdAt: summary.request.createdAt,
  }
}

export function toDisputeRow(dispute: DemoDispute): DisputeRow {
  return {
    disputeId: dispute.disputeId,
    proposalId: dispute.proposalId,
    offerId: dispute.offerId,
    requesterName: dispute.requesterName,
    requesterRole: dispute.requesterRole,
    statusLabel: dispute.status,
    requestedAt: dispute.requestedAt,
  }
}

export function toRefundRow(refund: DemoRefund): RefundRow {
  return {
    // 목 데이터에는 환불 ID가 없어 요청 ID를 행 키로 쓴다(요청당 환불 1건).
    refundId: refund.proposalId,
    proposalId: refund.proposalId,
    hyungnimName: refund.hyungnimName,
    amount: refund.amount,
    requestStatusLabel: findDemoRequestStatus(refund.proposalId) ?? null,
    statusLabel: refund.status,
    requestedAt: refund.requestedAt,
    processedAt: refund.processedAt,
  }
}

export function toOfferRow(offer: DemoOffer): OfferRow {
  return {
    offerId: offer.offerId,
    proposalId: offer.proposalId,
    kkobungName: offer.kkobungName,
    amount: offer.amount,
    statusLabel: offer.status,
    selected: offer.selected,
    appliedAt: offer.appliedAt,
  }
}

export function toMissionRow(mission: DemoMission): MissionRow {
  return {
    key: mission.missionId,
    missionId: mission.missionId,
    proposalId: mission.proposalId,
    offerId: mission.offerId,
    hyungnimName: mission.hyungnimName,
    kkobungName: mission.kkobungName,
    statusLabel: mission.status,
    payoutStatusLabel: mission.status === '완료' ? mission.settlementStatus : null,
    openChatUrl: mission.openChatUrl,
    createdAt: mission.createdAt,
  }
}

export function toUserRow(user: DemoUser): UserRow {
  return {
    id: user.id,
    name: user.name,
    createdAt: user.createdAt,
    missionCount: user.missionCount,
  }
}

export function toReportRow(report: DemoProposalReport): ReportRow {
  return {
    reportId: report.reportId,
    proposalId: report.proposalId,
    reporterId: report.reporterId,
    reporterName: report.reporterName,
    reasonQuestionText: report.reasonQuestionText,
    detailReason: report.detailReason ?? null,
    statusLabel: report.reportStatus,
    reportedAt: report.reportedAt,
  }
}
