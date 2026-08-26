import { requestEnvelope } from './httpClient'
import type { PageResponse } from './apiEnvelope'
import type { AdminLoginRequest, AuthTokenResponse } from './contracts/adminAuth'
import type { AdminNoteRequest } from './contracts/adminNote'
import type {
  AdminDisputeDetailResponse,
  AdminDisputeResolveRequest,
  AdminDisputeSummaryResponse,
} from './contracts/dispute'
import type {
  MissionPayoutRequest,
  MissionResolveRequest,
  MissionResponse,
} from './contracts/mission'
import type { AdminOfferSummaryResponse } from './contracts/offer'
import type {
  AdminConfirmPaymentRequest,
  AdminProposalResponse,
  AdminProposalDetailResponse,
  AdminProposalSummaryResponse,
} from './contracts/proposal'
import type { AdminProposalReportResponse } from './contracts/proposalReport'
import type { AdminPayoutDetailResponse } from './contracts/payout'
import type {
  AdminRefundDetailResponse,
  AdminRefundSummaryResponse,
  AdminRefundVoidRequest,
} from './contracts/refund'
import type { AdminSummaryResponse } from './contracts/summary'
import type { AdminUserSummaryResponse } from './contracts/user'
import type { DisputeProcessStatus } from '../../domain/status/disputeStatus'
import type { MissionStatus } from '../../domain/status/missionStatus'
import type { OfferStatus } from '../../domain/status/offerStatus'
import type { PayoutStatus } from '../../domain/status/payoutStatus'
import type { ProposalReportStatus } from '../../domain/status/proposalReportStatus'
import type { ProposalStatus } from '../../domain/status/proposalStatus'
import type { RefundStatus } from '../../domain/status/refundStatus'

// The server operations tagged `관리자` in docs/api-spec/openapi.json.
// Every other endpoint belongs to the mobile app and is out of scope.
// 목록 endpoint의 `status`는 스펙상 반복 파라미터라 배열로 넘긴다.

interface PageParams {
  page?: number
  size?: number
}

/**
 * `POST /v1/admin/auth/login` — the only admin operation the spec declares
 * without `security`, so it is called without an `Authorization` header.
 * Failures surface as `ApiError`: 401 `ADMIN_CREDENTIALS_INVALID`,
 * 400 `VALIDATION_ERROR`, 500 `INTERNAL_SERVER_ERROR`.
 */
export function adminLogin(body: AdminLoginRequest): Promise<AuthTokenResponse> {
  return requestEnvelope<AuthTokenResponse>({
    method: 'POST',
    path: '/v1/admin/auth/login',
    body,
  })
}

// --- summary ---------------------------------------------------------------

export function getAdminSummary(): Promise<AdminSummaryResponse> {
  return requestEnvelope<AdminSummaryResponse>({
    method: 'GET',
    path: '/v1/admin/summary',
  })
}

// --- proposal --------------------------------------------------------------

export interface ListAdminProposalsParams extends PageParams {
  status?: readonly ProposalStatus[]
  keyword?: string
}

export function listAdminProposals(
  params: ListAdminProposalsParams = {},
): Promise<PageResponse<AdminProposalSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminProposalSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/proposal',
    query: {
      status: params.status,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

export function getAdminProposal(proposalId: number): Promise<AdminProposalDetailResponse> {
  return requestEnvelope<AdminProposalDetailResponse>({
    method: 'GET',
    path: `/v1/admin/proposal/${proposalId}`,
  })
}

export function cancelAdminProposal(
  proposalId: number,
  body: AdminNoteRequest = {},
): Promise<AdminProposalDetailResponse> {
  return requestEnvelope<AdminProposalDetailResponse>({
    method: 'POST',
    path: `/v1/admin/proposal/${proposalId}/cancel`,
    body,
  })
}

/** body(`openChatUrl`)는 스펙상 필수다. */
export function confirmProposalPayment(
  proposalId: number,
  body: AdminConfirmPaymentRequest,
): Promise<AdminProposalResponse> {
  return requestEnvelope<AdminProposalResponse>({
    method: 'POST',
    path: `/v1/admin/proposal/${proposalId}/confirm-payment`,
    body,
  })
}

/**
 * @deprecated 스펙에서 deprecated로 표시된 endpoint다.
 * `listAdminProposals({ status: ['HOLDING'] })`를 쓴다.
 */
export function listPendingPaymentProposals(
  params: PageParams = {},
): Promise<PageResponse<AdminProposalSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminProposalSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/proposal/pending-payment',
    query: {
      page: params.page,
      size: params.size,
    },
  })
}

// --- offer -----------------------------------------------------------------

export interface ListAdminOffersParams extends PageParams {
  proposalId?: number
  status?: readonly OfferStatus[]
  accepted?: boolean
  hasDispute?: boolean
  keyword?: string
}

export function listAdminOffers(
  params: ListAdminOffersParams = {},
): Promise<PageResponse<AdminOfferSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminOfferSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/offer',
    query: {
      proposalId: params.proposalId,
      status: params.status,
      accepted: params.accepted,
      hasDispute: params.hasDispute,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

// --- mission ---------------------------------------------------------------

export interface ListAdminMissionsParams extends PageParams {
  status?: readonly MissionStatus[]
}

export function listAdminMissions(
  params: ListAdminMissionsParams = {},
): Promise<PageResponse<MissionResponse>> {
  return requestEnvelope<PageResponse<MissionResponse>>({
    method: 'GET',
    path: '/v1/admin/missions',
    query: {
      status: params.status,
      page: params.page,
      size: params.size,
    },
  })
}

export function getAdminMission(missionId: number): Promise<MissionResponse> {
  return requestEnvelope<MissionResponse>({
    method: 'GET',
    path: `/v1/admin/missions/${missionId}`,
  })
}

export function resolveAdminMission(
  missionId: number,
  body: MissionResolveRequest,
): Promise<MissionResponse> {
  return requestEnvelope<MissionResponse>({
    method: 'POST',
    path: `/v1/admin/missions/${missionId}/resolve`,
    body,
  })
}

export function settleAdminMission(
  missionId: number,
  body: MissionPayoutRequest = {},
): Promise<MissionResponse> {
  return requestEnvelope<MissionResponse>({
    method: 'POST',
    path: `/v1/admin/missions/${missionId}/settlement`,
    body,
  })
}

// --- dispute ---------------------------------------------------------------

export interface ListAdminDisputesParams extends PageParams {
  status?: readonly DisputeProcessStatus[]
  proposalId?: number
  keyword?: string
}

export function listAdminDisputes(
  params: ListAdminDisputesParams = {},
): Promise<PageResponse<AdminDisputeSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminDisputeSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/dispute',
    query: {
      status: params.status,
      proposalId: params.proposalId,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

export function getAdminDispute(disputeId: number): Promise<AdminDisputeDetailResponse> {
  return requestEnvelope<AdminDisputeDetailResponse>({
    method: 'GET',
    path: `/v1/admin/dispute/${disputeId}`,
  })
}

export function resolveAdminDispute(
  disputeId: number,
  body: AdminDisputeResolveRequest,
): Promise<AdminDisputeDetailResponse> {
  return requestEnvelope<AdminDisputeDetailResponse>({
    method: 'POST',
    path: `/v1/admin/dispute/${disputeId}/resolve`,
    body,
  })
}

// --- refund ----------------------------------------------------------------

export interface ListAdminRefundsParams extends PageParams {
  status?: readonly RefundStatus[]
  /** `YYYY-MM-DD`. 이 날짜 이후 요청분. */
  requestedFrom?: string
  proposalId?: number
  keyword?: string
}

export function listAdminRefunds(
  params: ListAdminRefundsParams = {},
): Promise<PageResponse<AdminRefundSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminRefundSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/refund',
    query: {
      status: params.status,
      requestedFrom: params.requestedFrom,
      proposalId: params.proposalId,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

export function getAdminRefund(refundId: number): Promise<AdminRefundDetailResponse> {
  return requestEnvelope<AdminRefundDetailResponse>({
    method: 'GET',
    path: `/v1/admin/refund/${refundId}`,
  })
}

export function completeAdminRefund(
  refundId: number,
  body: AdminNoteRequest = {},
): Promise<AdminRefundDetailResponse> {
  return requestEnvelope<AdminRefundDetailResponse>({
    method: 'POST',
    path: `/v1/admin/refund/${refundId}/complete`,
    body,
  })
}

/**
 * 입금 대조 결과 입금이 확인됐을 때. 환불을 `REVIEW`에서 `PENDING`으로 확정한다.
 * 스펙에 `requestBody`가 없으므로 `body` 키를 넘기지 않는다(httpClient가
 * Content-Type과 본문을 함께 생략한다). 이후 이체는 `completeAdminRefund`다.
 */
export function confirmDepositAdminRefund(
  refundId: number,
): Promise<AdminRefundDetailResponse> {
  return requestEnvelope<AdminRefundDetailResponse>({
    method: 'POST',
    path: `/v1/admin/refund/${refundId}/confirm-deposit`,
  })
}

/** 입금이 없어 환불 없이 종결한다. 근거를 남기도록 `adminNote`가 필수다. */
export function voidAdminRefund(
  refundId: number,
  body: AdminRefundVoidRequest,
): Promise<AdminRefundDetailResponse> {
  return requestEnvelope<AdminRefundDetailResponse>({
    method: 'POST',
    path: `/v1/admin/refund/${refundId}/void`,
    body,
  })
}

// --- payout ----------------------------------------------------------------

export interface ListAdminPayoutsParams extends PageParams {
  status?: readonly PayoutStatus[]
  proposalId?: number
  keyword?: string
}

export function listAdminPayouts(
  params: ListAdminPayoutsParams = {},
): Promise<PageResponse<MissionResponse>> {
  return requestEnvelope<PageResponse<MissionResponse>>({
    method: 'GET',
    path: '/v1/admin/payout',
    query: {
      status: params.status,
      proposalId: params.proposalId,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

export function getAdminPayout(payoutId: number): Promise<AdminPayoutDetailResponse> {
  return requestEnvelope<AdminPayoutDetailResponse>({
    method: 'GET',
    path: `/v1/admin/payout/${payoutId}`,
  })
}

export function completeAdminPayout(
  payoutId: number,
  body: AdminNoteRequest = {},
): Promise<AdminPayoutDetailResponse> {
  return requestEnvelope<AdminPayoutDetailResponse>({
    method: 'POST',
    path: `/v1/admin/payout/${payoutId}/complete`,
    body,
  })
}

export function rejectAdminPayout(
  payoutId: number,
  body: AdminNoteRequest = {},
): Promise<AdminPayoutDetailResponse> {
  return requestEnvelope<AdminPayoutDetailResponse>({
    method: 'POST',
    path: `/v1/admin/payout/${payoutId}/reject`,
    body,
  })
}

// --- proposal report -------------------------------------------------------

export interface ListProposalReportsParams extends PageParams {
  /** `proposal-reports`만 단일값 status다(반복 파라미터가 아니다). */
  status?: ProposalReportStatus
  proposalId?: number
  keyword?: string
}

export function listProposalReports(
  params: ListProposalReportsParams = {},
): Promise<PageResponse<AdminProposalReportResponse>> {
  return requestEnvelope<PageResponse<AdminProposalReportResponse>>({
    method: 'GET',
    path: '/v1/admin/proposal-reports',
    query: {
      status: params.status,
      proposalId: params.proposalId,
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}

export function acceptProposalReport(reportId: number): Promise<AdminProposalReportResponse> {
  return requestEnvelope<AdminProposalReportResponse>({
    method: 'POST',
    path: `/v1/admin/proposal-reports/${reportId}/accept`,
  })
}

export function rejectProposalReport(reportId: number): Promise<AdminProposalReportResponse> {
  return requestEnvelope<AdminProposalReportResponse>({
    method: 'POST',
    path: `/v1/admin/proposal-reports/${reportId}/reject`,
  })
}

// --- user --------------------------------------------------------------

export interface ListAdminUsersParams extends PageParams {
  keyword?: string
}

export function listAdminUsers(
  params: ListAdminUsersParams = {},
): Promise<PageResponse<AdminUserSummaryResponse>> {
  return requestEnvelope<PageResponse<AdminUserSummaryResponse>>({
    method: 'GET',
    path: '/v1/admin/user',
    query: {
      keyword: params.keyword,
      page: params.page,
      size: params.size,
    },
  })
}
