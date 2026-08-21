import { requestEnvelope, requestRaw } from './httpClient'
import type { PageResponse } from './apiEnvelope'
import type { ProposalReportResponse } from './contracts/proposalReport'
import type { ProposalResponse } from './contracts/proposal'
import type { OfferResponse } from './contracts/offer'
import type { ProposalReportStatus } from '../../domain/status/proposalReportStatus'

// The 6 server operations tagged `관리자` in docs/api-spec/openapi.json.
// Every other endpoint belongs to the mobile app and is out of scope.

export interface ListProposalReportsParams {
  status?: ProposalReportStatus
  page?: number
  size?: number
}

export function listProposalReports(
  params: ListProposalReportsParams = {},
): Promise<PageResponse<ProposalReportResponse>> {
  return requestEnvelope<PageResponse<ProposalReportResponse>>({
    method: 'GET',
    path: '/v1/admin/proposal-reports',
    query: {
      status: params.status,
      page: params.page,
      size: params.size,
    },
  })
}

export function acceptProposalReport(reportId: number): Promise<ProposalReportResponse> {
  return requestEnvelope<ProposalReportResponse>({
    method: 'POST',
    path: `/v1/admin/proposal-reports/${reportId}/accept`,
  })
}

export function rejectProposalReport(reportId: number): Promise<ProposalReportResponse> {
  return requestEnvelope<ProposalReportResponse>({
    method: 'POST',
    path: `/v1/admin/proposal-reports/${reportId}/reject`,
  })
}

export function confirmProposalPayment(proposalId: number): Promise<ProposalResponse> {
  return requestEnvelope<ProposalResponse>({
    method: 'POST',
    path: `/v1/admin/proposal/${proposalId}/confirm-payment`,
  })
}

export interface ListPendingPaymentProposalsParams {
  skip?: number
  limit?: number
}

// 200 response schema is `{}` (empty) in the spec — no shape is invented.
export function listPendingPaymentProposals(params: ListPendingPaymentProposalsParams = {}): Promise<unknown> {
  return requestRaw({
    method: 'GET',
    path: '/v1/admin/proposal/pending-payment',
    query: {
      skip: params.skip,
      limit: params.limit,
    },
  })
}

export function resolveOffer(offerId: number): Promise<OfferResponse> {
  return requestEnvelope<OfferResponse>({
    method: 'POST',
    path: `/v1/admin/offer/${offerId}/resolve`,
  })
}
