import type { AdminSummaryResponse } from '../../data/api/contracts/summary'
import { DEMO_DISPUTES } from '../demo/demoDisputes'
import { DEMO_MISSIONS } from '../demo/demoMissions'
import { DEMO_PROPOSAL_REPORTS } from '../demo/demoProposalReports'
import { DEMO_REFUNDS } from '../demo/demoRefunds'
import { DEMO_REQUEST_SUMMARIES } from '../demo/demoSelectors'
import type {
  DisputeRow,
  MissionRow,
  RefundRow,
  ReportRow,
  RequestRow,
} from '../models/rows'
import {
  toDisputeRow,
  toMissionRow,
  toRefundRow,
  toReportRow,
  toRequestRow,
} from './demoAdapters'

/**
 * 대시보드 목 모드의 데이터 원천. **동적 import로만** 접근한다. 정적 import를
 * 쓰면 프로덕션 번들에서 tree-shaking되지 않는다.
 */

function unpaidRequestRows(): RequestRow[] {
  return DEMO_REQUEST_SUMMARIES.filter(
    (summary) => summary.request.status === '미입금',
  ).map(toRequestRow)
}

function pendingDisputeRows(): DisputeRow[] {
  return DEMO_DISPUTES.filter((dispute) => dispute.status === '미처리').map(toDisputeRow)
}

function pendingRefundRows(): RefundRow[] {
  return DEMO_REFUNDS.filter((refund) => refund.status === '미처리').map(toRefundRow)
}

function pendingSettlementRows(): MissionRow[] {
  return DEMO_MISSIONS.filter(
    (mission) => mission.status === '완료' && mission.settlementStatus === '미처리',
  ).map(toMissionRow)
}

function pendingReportRows(): ReportRow[] {
  return DEMO_PROPOSAL_REPORTS.filter((report) => report.reportStatus === '미처리').map(
    toReportRow,
  )
}

export const mockDashboard = {
  summary(): AdminSummaryResponse {
    return {
      unpaidCount: unpaidRequestRows().length,
      disputeCount: pendingDisputeRows().length,
      refundCount: pendingRefundRows().length,
      settlementCount: pendingSettlementRows().length,
      reportCount: pendingReportRows().length,
    }
  },
  unpaidRequests: unpaidRequestRows,
  pendingDisputes: pendingDisputeRows,
  pendingRefunds: pendingRefundRows,
  pendingSettlements: pendingSettlementRows,
  pendingReports: pendingReportRows,
}
