import { DEMO_DEPOSIT_ACCOUNT } from '../demo/demoRequests'
import {
  findDemoDispute,
  findDemoMission,
  findDemoOffersOf,
  findDemoRefund,
  findDemoReportsOf,
  findDemoRequest,
} from '../demo/demoSelectors'
import { toOfferRow, toReportRow } from './demoAdapters'
import type {
  DisputeDetailView,
  MissionDetailView,
  PayoutDetailView,
  RefundDetailView,
  RequestDetailView,
} from '../models/detailViews'
import type { OfferRow, ReportRow, RowPage } from '../models/rows'

/**
 * 목 모드의 요청 상세 데이터 원천. **동적 import로만** 접근한다. 정적 import를
 * 쓰면 프로덕션 번들에서 tree-shaking되지 않는다.
 *
 * 목 데이터의 상태 문자열은 이미 화면 라벨이라 그대로 view-model에 담는다.
 * 처리(mutation)는 목 모드에서 실행하지 않으므로 여기에는 조회만 있다.
 */

function toRowPage<T>(rows: T[], page: number, size: number): RowPage<T> {
  return {
    rows: rows.slice(page * size, (page + 1) * size),
    totalElements: rows.length,
    totalPages: Math.ceil(rows.length / size),
    pageNumber: page,
    pageSize: size,
  }
}

export const mockDetail = {
  request(proposalId: string): RequestDetailView | null {
    const request = findDemoRequest(proposalId)
    if (request === undefined) {
      return null
    }
    const offers = findDemoOffersOf(proposalId)
    const selected = offers.find((offer) => offer.selected)
    const mission = findDemoMission(proposalId)
    return {
      proposalId: request.proposalId,
      hyungnimName: request.hyungnimName,
      amount: request.amount,
      statusLabel: request.status,
      createdAt: request.createdAt,
      // 목 요청에는 서버 상세의 본문 정보가 없다. 임의 값을 만들지 않는다.
      title: null,
      content: null,
      deadline: null,
      openChatUrl: mission?.openChatUrl ?? null,
      acceptedOfferId: selected?.offerId ?? null,
      missionId: null,
      adminNote: null,
      depositorName: request.depositorName,
      depositAccount: DEMO_DEPOSIT_ACCOUNT,
      depositAccountHolder: null,
      canConfirmPayment: request.status === '미입금',
      canCancel: request.status === '미입금' || request.status === '대기중',
      refundRequired:
        request.status !== '미입금' || findDemoRefund(proposalId) !== undefined,
    }
  },

  offers(proposalId: string, page: number, size: number): RowPage<OfferRow> {
    return toRowPage(findDemoOffersOf(proposalId).map(toOfferRow), page, size)
  },

  mission(proposalId: string): MissionDetailView | null {
    const mission = findDemoMission(proposalId)
    if (mission === undefined) {
      return null
    }
    return {
      missionId: mission.missionId,
      proposalId: mission.proposalId,
      offerId: mission.offerId,
      hyungnimName: mission.hyungnimName,
      kkobungName: mission.kkobungName,
      openChatUrl: mission.openChatUrl,
      statusLabel: mission.status,
      payoutStatusLabel:
        mission.status === '완료' ? mission.settlementStatus : null,
      payoutRequired:
        mission.status === '완료' && mission.settlementStatus === '미처리',
      payoutTarget: mission.status === '완료',
      refundTarget: mission.status === '취소',
      errandFee: mission.payoutAmount,
      createdAt: mission.createdAt,
      startedAt: mission.createdAt,
      hyungnimCompletedAt: mission.hyungnimCompletedAt,
      kkobungCompletedAt: mission.kkobungCompletedAt,
      settlementPaidAt: mission.settledAt,
      payoutMemo: null,
    }
  },

  dispute(proposalId: string): DisputeDetailView | null {
    const dispute = findDemoDispute(proposalId)
    if (dispute === undefined) {
      return null
    }
    const request = findDemoRequest(proposalId)
    const offers = findDemoOffersOf(proposalId)
    const selected = offers.find((offer) => offer.offerId === dispute.offerId)
    return {
      disputeId: dispute.disputeId,
      proposalId: dispute.proposalId,
      offerId: dispute.offerId,
      missionId: dispute.missionId,
      requesterName: dispute.requesterName,
      requesterRole: dispute.requesterRole,
      targetName: dispute.targetName,
      targetRole: dispute.targetRole,
      reason: dispute.reason,
      statusLabel: dispute.status,
      pending: dispute.status === '미처리',
      requestedAt: dispute.requestedAt,
      resolvedAt: null,
      adminNote: null,
      requestStatusLabel: request?.status ?? '대기중',
      offerStatusLabel: selected?.status ?? '대기중',
      totalCount: 1,
    }
  },

  refund(proposalId: string): RefundDetailView | null {
    const refund = findDemoRefund(proposalId)
    if (refund === undefined) {
      return null
    }
    return {
      refundId: refund.proposalId,
      proposalId: refund.proposalId,
      amount: refund.amount,
      statusLabel: refund.status,
      pending: refund.status === '미처리',
      reason: refund.reason,
      requestedAt: refund.requestedAt,
      processedAt: refund.processedAt,
      refundAccount: refund.refundAccount,
      refundAccountHolder: refund.accountHolderName,
      adminNote: refund.adminNote === '' ? null : refund.adminNote,
      requestStatusLabel: findDemoRequest(proposalId)?.status ?? '취소',
    }
  },

  payout(proposalId: string): PayoutDetailView | null {
    const mission = findDemoMission(proposalId)
    if (mission === undefined) {
      return null
    }
    return {
      payoutId: mission.missionId,
      proposalId: mission.proposalId,
      offerId: mission.offerId,
      kkobungName: mission.kkobungName,
      amount: mission.payoutAmount,
      statusLabel: mission.settlementStatus,
      pending: mission.settlementStatus === '미처리',
      settledAt: mission.settledAt,
      payoutAccount: mission.payoutAccount,
      payoutAccountHolder: mission.payoutAccountHolder,
      adminNote: null,
    }
  },

  reports(proposalId: string, page: number, size: number): RowPage<ReportRow> {
    return toRowPage(findDemoReportsOf(proposalId).map(toReportRow), page, size)
  },
}
