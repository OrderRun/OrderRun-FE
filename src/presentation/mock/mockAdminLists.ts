import { DEMO_DISPUTES } from '../demo/demoDisputes'
import { DEMO_MISSIONS } from '../demo/demoMissions'
import { DEMO_OFFERS } from '../demo/demoOffers'
import { DEMO_PROPOSAL_REPORTS } from '../demo/demoProposalReports'
import { DEMO_REFUNDS } from '../demo/demoRefunds'
import { DEMO_REQUEST_SUMMARIES, hasDemoDisputeOnOffer } from '../demo/demoSelectors'
import { ALL_STATUS_OPTION } from '../../domain/status/statusFilter'
import type {
  DisputeRow,
  MissionRow,
  OfferRow,
  RefundRow,
  ReportRow,
  RequestRow,
  RowPage,
} from '../models/rows'
import {
  toDisputeRow,
  toMissionRow,
  toOfferRow,
  toRefundRow,
  toReportRow,
  toRequestRow,
} from './demoAdapters'

/**
 * 목 모드의 목록 데이터 원천. **동적 import로만** 접근한다. 정적 import를
 * 쓰면 프로덕션 번들에서 tree-shaking되지 않는다.
 *
 * 실 모드는 라벨을 서버 enum 배열로 바꿔 보내고, 목 모드는 같은 라벨을 목
 * 데이터의 상태 문자열과 직접 비교한다(목 데이터의 상태는 이미 화면 라벨이다).
 * 두 경로가 한 옵션 문자열에서 갈라지므로 화면 결과가 어긋나지 않는다.
 *
 * 페이지네이션도 서버와 같은 규약으로 잘라 `RowPage`를 채운다. 두 모드의
 * 건수 표시와 페이지 이동 동작이 같아야 목 모드로 확인한 화면을 믿을 수 있다.
 */

function matchesStatus(label: string, rowStatus: string): boolean {
  return label === ALL_STATUS_OPTION || label === rowStatus
}

function matchesKeyword(keyword: string, fields: readonly (string | null)[]): boolean {
  const trimmed = keyword.trim()
  if (trimmed === '') {
    return true
  }
  const lowered = trimmed.toLowerCase()
  return fields.some(
    (field) => field !== null && field.toLowerCase().includes(lowered),
  )
}

function toRowPage<T>(rows: T[], page: number, size: number): RowPage<T> {
  const totalElements = rows.length
  return {
    rows: rows.slice(page * size, (page + 1) * size),
    totalElements,
    totalPages: Math.ceil(totalElements / size),
    pageNumber: page,
    pageSize: size,
  }
}

interface BaseParams {
  statusLabel: string
  page: number
  size: number
}

interface KeywordParams extends BaseParams {
  keyword: string
}

export const mockLists = {
  requests(params: KeywordParams): RowPage<RequestRow> {
    const rows = DEMO_REQUEST_SUMMARIES.filter(
      (summary) =>
        matchesStatus(params.statusLabel, summary.request.status) &&
        matchesKeyword(params.keyword, [
          summary.request.proposalId,
          summary.request.hyungnimName,
        ]),
    ).map(toRequestRow)
    return toRowPage(rows, params.page, params.size)
  },

  offers(
    params: KeywordParams & {
      accepted: boolean | undefined
      hasDispute: boolean | undefined
    },
  ): RowPage<OfferRow> {
    const rows = DEMO_OFFERS.filter((offer) => {
      const disputed = hasDemoDisputeOnOffer(offer.offerId)
      return (
        matchesStatus(params.statusLabel, offer.status) &&
        matchesKeyword(params.keyword, [
          offer.offerId,
          offer.proposalId,
          offer.kkobungName,
        ]) &&
        (params.accepted === undefined || params.accepted === offer.selected) &&
        (params.hasDispute === undefined || params.hasDispute === disputed)
      )
    }).map(toOfferRow)
    return toRowPage(rows, params.page, params.size)
  },

  /** 미션 목록은 서버에 `keyword`가 없어 목 모드도 상태로만 거른다. */
  missions(params: BaseParams): RowPage<MissionRow> {
    const rows = DEMO_MISSIONS.filter((mission) =>
      matchesStatus(params.statusLabel, mission.status),
    ).map(toMissionRow)
    return toRowPage(rows, params.page, params.size)
  },

  disputes(params: KeywordParams): RowPage<DisputeRow> {
    const rows = DEMO_DISPUTES.filter(
      (dispute) =>
        matchesStatus(params.statusLabel, dispute.status) &&
        matchesKeyword(params.keyword, [
          dispute.disputeId,
          dispute.proposalId,
          dispute.offerId,
          dispute.requesterName,
        ]),
    ).map(toDisputeRow)
    return toRowPage(rows, params.page, params.size)
  },

  refunds(params: KeywordParams & { requestedFrom: string }): RowPage<RefundRow> {
    const rows = DEMO_REFUNDS.filter(
      (refund) =>
        matchesStatus(params.statusLabel, refund.status) &&
        matchesKeyword(params.keyword, [refund.proposalId, refund.hyungnimName]) &&
        (params.requestedFrom === '' ||
          refund.requestedAt.slice(0, 10) >= params.requestedFrom),
    ).map(toRefundRow)
    return toRowPage(rows, params.page, params.size)
  },

  reports(params: KeywordParams): RowPage<ReportRow> {
    const rows = DEMO_PROPOSAL_REPORTS.filter(
      (report) =>
        matchesStatus(params.statusLabel, report.reportStatus) &&
        matchesKeyword(params.keyword, [
          report.reportId,
          report.proposalId,
          report.reporterId,
          report.reporterName,
          report.reasonQuestionText,
          report.detailReason ?? null,
        ]),
    ).map(toReportRow)
    return toRowPage(rows, params.page, params.size)
  },
}
