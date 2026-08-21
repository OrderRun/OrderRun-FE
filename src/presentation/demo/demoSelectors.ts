// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

import { DEMO_DISPUTES } from './demoDisputes'
import { DEMO_MISSIONS } from './demoMissions'
import { DEMO_OFFERS } from './demoOffers'
import { DEMO_PROPOSAL_REPORTS } from './demoProposalReports'
import { DEMO_REFUNDS } from './demoRefunds'
import { DEMO_REQUESTS } from './demoRequests'
import type {
  DemoDispute,
  DemoMission,
  DemoOffer,
  DemoProposalReport,
  DemoRefund,
  DemoRequest,
  DemoRequestStatus,
  DemoRequestSummary,
} from './demoTypes'

export function findDemoProposalReport(
  reportId: string,
): DemoProposalReport | undefined {
  return DEMO_PROPOSAL_REPORTS.find((report) => report.reportId === reportId)
}

export function findDemoRequest(proposalId: string): DemoRequest | undefined {
  return DEMO_REQUESTS.find((request) => request.proposalId === proposalId)
}

export function findDemoMission(proposalId: string): DemoMission | undefined {
  return DEMO_MISSIONS.find((mission) => mission.proposalId === proposalId)
}

export function findDemoDispute(proposalId: string): DemoDispute | undefined {
  return DEMO_DISPUTES.find((dispute) => dispute.proposalId === proposalId)
}

export function findDemoRefund(proposalId: string): DemoRefund | undefined {
  return DEMO_REFUNDS.find((refund) => refund.proposalId === proposalId)
}

export function findDemoOffersOf(proposalId: string): DemoOffer[] {
  return DEMO_OFFERS.filter((offer) => offer.proposalId === proposalId)
}

export function toDemoRequestSummary(request: DemoRequest): DemoRequestSummary {
  return {
    request,
    offerCount: findDemoOffersOf(request.proposalId).length,
    refundStatus: findDemoRefund(request.proposalId)?.status ?? null,
  }
}

export const DEMO_REQUEST_SUMMARIES: DemoRequestSummary[] =
  DEMO_REQUESTS.map(toDemoRequestSummary)

export function hasDemoDisputeOnOffer(offerId: string): boolean {
  return DEMO_DISPUTES.some((dispute) => dispute.offerId === offerId)
}

export function hasDemoDisputeOnMission(missionId: string): boolean {
  return DEMO_DISPUTES.some((dispute) => dispute.missionId === missionId)
}

export function findDemoRequestStatus(
  proposalId: string,
): DemoRequestStatus | undefined {
  return findDemoRequest(proposalId)?.status
}
