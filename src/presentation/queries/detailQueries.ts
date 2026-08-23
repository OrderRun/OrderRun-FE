import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  getAdminDispute,
  getAdminMission,
  getAdminPayout,
  getAdminProposal,
  getAdminRefund,
  listAdminDisputes,
  listAdminOffers,
  listProposalReports,
} from '../../data/api/adminApi'
import { ApiError } from '../../data/api/apiError'
import type { PageResponse } from '../../data/api/apiEnvelope'
import { toOfferRowFromApi, toReportRowFromApi } from '../models/adminRows'
import {
  toDisputeDetailView,
  toMissionDetailView,
  toPayoutDetailView,
  toRefundDetailView,
  toRequestDetailView,
} from '../models/adminDetail'
import type {
  DisputeDetailView,
  MissionDetailView,
  PayoutDetailView,
  RefundDetailView,
  RequestDetailView,
} from '../models/detailViews'
import type { OfferRow, ReportRow, RowPage } from '../models/rows'
import { isMockEnabled } from '../mock/mockMode'
import { adminDetailKey, adminListKey } from './adminQueryKeys'

/**
 * 요청 상세 화면의 조회 쿼리. 목/실 분기는 각 `queryFn` 한 곳에서만 일어나고,
 * 목 데이터는 **동적 import로만** 닿는다. 프로덕션 빌드에서는
 * `import.meta.env.DEV`가 리터럴 false가 되어 목 경로가 통째로 제거된다.
 *
 * 환불·지급은 미션에서 파생된 리소스라 대상이 아니면 서버가 404를 준다.
 * 404는 오류가 아니라 **빈 상태**이므로 `null`로 바꿔 탭이 안내 문구를 그리게 한다.
 */

/**
 * 화면 로직(액션 차단 등)이 보는 목 모드 여부. `queryFn`의 분기에는 쓰지 않는다.
 * 번들러가 목 청크를 죽은 코드로 지우려면 조건이 **호출문이 아니라 리터럴**
 * `import.meta.env.DEV`여야 하므로, 각 `queryFn`은 인라인 조건을 그대로 쓴다.
 */
export function isMockDetailMode(): boolean {
  return import.meta.env.DEV && isMockEnabled()
}

async function loadMock() {
  return (await import('../mock/mockAdminDetail')).mockDetail
}

/** 상세 탭의 목록(지원·신고)은 목록 페이지와 같은 20건 규약을 쓴다. */
export const DETAIL_PAGE_SIZE = 20

/** 서버 경로 파라미터는 정수다. 잘못된 URL은 조회하지 않고 빈 상태로 둔다. */
export function toNumericId(value: string): number | null {
  return /^\d+$/.test(value) ? Number(value) : null
}

async function nullOn404<T>(load: () => Promise<T>): Promise<T | null> {
  try {
    return await load()
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return null
    }
    throw error
  }
}

function toRowPage<D, R>(page: PageResponse<D>, toRow: (dto: D) => R): RowPage<R> {
  return {
    rows: page.content.map(toRow),
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    pageNumber: page.pageNumber,
    pageSize: page.pageSize,
  }
}

function emptyRowPage<T>(page: number): RowPage<T> {
  return {
    rows: [],
    totalElements: 0,
    totalPages: 0,
    pageNumber: page,
    pageSize: DETAIL_PAGE_SIZE,
  }
}

export function useProposalDetailQuery(
  proposalId: string,
): UseQueryResult<RequestDetailView | null> {
  return useQuery({
    queryKey: adminDetailKey('proposal', proposalId),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).request(proposalId)
      }
      const numericId = toNumericId(proposalId)
      if (numericId === null) {
        return null
      }
      const detail = await nullOn404(() => getAdminProposal(numericId))
      return detail === null ? null : toRequestDetailView(detail)
    },
  })
}

export function useProposalOffersQuery(
  proposalId: string,
  page: number,
): UseQueryResult<RowPage<OfferRow>> {
  return useQuery({
    queryKey: adminListKey('offer', { proposalId, page, size: DETAIL_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).offers(proposalId, page, DETAIL_PAGE_SIZE)
      }
      const numericId = toNumericId(proposalId)
      if (numericId === null) {
        return emptyRowPage<OfferRow>(page)
      }
      const result = await listAdminOffers({
        proposalId: numericId,
        page,
        size: DETAIL_PAGE_SIZE,
      })
      return toRowPage(result, toOfferRowFromApi)
    },
  })
}

export function useMissionDetailQuery(
  proposalId: string,
  missionId: number | null,
): UseQueryResult<MissionDetailView | null> {
  return useQuery({
    queryKey: adminDetailKey('mission', missionId ?? `proposal-${proposalId}`),
    enabled: isMockDetailMode() || missionId !== null,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).mission(proposalId)
      }
      if (missionId === null) {
        return null
      }
      const detail = await nullOn404(() => getAdminMission(missionId))
      return detail === null ? null : toMissionDetailView(detail)
    },
  })
}

/**
 * 분쟁은 요청에 직접 걸린 리소스가 아니라 목록으로만 찾을 수 있어 목록→상세
 * 2단 조회를 한 `queryFn` 안에서 순차로 한다(키는 하나다).
 *
 * 한 요청에 분쟁이 2건 이상일 때의 정렬 규약이 스펙에 없다. 값을 지어내지 않고
 * 첫 행을 쓰되 전체 건수를 함께 실어 화면이 안내 문구를 덧붙이게 한다.
 */
export function useProposalDisputeQuery(
  proposalId: string,
): UseQueryResult<DisputeDetailView | null> {
  return useQuery({
    queryKey: adminDetailKey('dispute', `proposal-${proposalId}`),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).dispute(proposalId)
      }
      const numericId = toNumericId(proposalId)
      if (numericId === null) {
        return null
      }
      const list = await listAdminDisputes({
        proposalId: numericId,
        page: 0,
        size: DETAIL_PAGE_SIZE,
      })
      const first = list.content[0]
      if (first === undefined) {
        return null
      }
      const detail = await nullOn404(() => getAdminDispute(first.id))
      return detail === null ? null : toDisputeDetailView(detail, list.totalElements)
    },
  })
}

/** 서버 규약상 `refundId`는 미션 ID다(`AdminRefundSummaryResponse` 설명). */
export function useRefundDetailQuery(
  proposalId: string,
  missionId: number | null,
  enabled: boolean,
): UseQueryResult<RefundDetailView | null> {
  return useQuery({
    queryKey: adminDetailKey('refund', missionId ?? `proposal-${proposalId}`),
    enabled: enabled && (isMockDetailMode() || missionId !== null),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).refund(proposalId)
      }
      if (missionId === null) {
        return null
      }
      const detail = await nullOn404(() => getAdminRefund(missionId))
      return detail === null ? null : toRefundDetailView(detail)
    },
  })
}

/** 서버 규약상 `payoutId`는 미션 ID다(`AdminPayoutSummaryResponse` 설명). */
export function usePayoutDetailQuery(
  proposalId: string,
  missionId: number | null,
  enabled: boolean,
): UseQueryResult<PayoutDetailView | null> {
  return useQuery({
    queryKey: adminDetailKey('payout', missionId ?? `proposal-${proposalId}`),
    enabled: enabled && (isMockDetailMode() || missionId !== null),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).payout(proposalId)
      }
      if (missionId === null) {
        return null
      }
      const detail = await nullOn404(() => getAdminPayout(missionId))
      return detail === null ? null : toPayoutDetailView(detail)
    },
  })
}

export function useProposalReportsQuery(
  proposalId: string,
  page: number,
): UseQueryResult<RowPage<ReportRow>> {
  return useQuery({
    queryKey: adminListKey('report', { proposalId, page, size: DETAIL_PAGE_SIZE }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).reports(proposalId, page, DETAIL_PAGE_SIZE)
      }
      const numericId = toNumericId(proposalId)
      if (numericId === null) {
        return emptyRowPage<ReportRow>(page)
      }
      const result = await listProposalReports({
        proposalId: numericId,
        page,
        size: DETAIL_PAGE_SIZE,
      })
      return toRowPage(result, toReportRowFromApi)
    },
  })
}
