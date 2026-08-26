import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  getAdminSummary,
  listAdminDisputes,
  listAdminPayouts,
  listAdminProposals,
  listAdminRefunds,
  listProposalReports,
} from '../../data/api/adminApi'
import type { AdminSummaryResponse } from '../../data/api/contracts/summary'
import {
  toDisputeRowFromApi,
  toMissionRowFromPayout,
  toRefundRowFromApi,
  toReportRowFromApi,
  toRequestRowFromApi,
} from '../models/adminRows'
import type {
  DisputeRow,
  MissionRow,
  RefundRow,
  ReportRow,
  RequestRow,
  RowPage,
} from '../models/rows'
import { isMockEnabled } from '../mock/mockMode'
import { adminListKey, adminSummaryKey } from './adminQueryKeys'

/**
 * 대시보드 쿼리. 목/실 분기는 이 `queryFn` 한 곳에서만 일어나고, 목 데이터는
 * **동적 import로만** 닿는다. 프로덕션 빌드에서 `import.meta.env.DEV`가 리터럴
 * false가 되어 분기 블록과 목 청크가 통째로 제거된다.
 * Data 계층(`adminApi.ts`)은 목의 존재를 모른다.
 */
async function loadMock() {
  return (await import('../mock/mockAdminData')).mockDashboard
}

const PAGE_SIZE = 20

export function useAdminSummaryQuery(): UseQueryResult<AdminSummaryResponse> {
  return useQuery({
    queryKey: adminSummaryKey(),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).summary()
      }
      return getAdminSummary()
    },
  })
}

const UNPAID_PARAMS = { status: ['HOLDING'], page: 0, size: PAGE_SIZE } as const

export function useUnpaidRequestsQuery(): UseQueryResult<RequestRow[]> {
  return useQuery({
    queryKey: adminListKey('proposal', UNPAID_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).unpaidRequests()
      }
      const page = await listAdminProposals(UNPAID_PARAMS)
      return page.content.map(toRequestRowFromApi)
    },
  })
}

const PENDING_DISPUTE_PARAMS = { status: ['PENDING'], page: 0, size: PAGE_SIZE } as const

export function usePendingDisputesQuery(): UseQueryResult<DisputeRow[]> {
  return useQuery({
    queryKey: adminListKey('dispute', PENDING_DISPUTE_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).pendingDisputes()
      }
      const page = await listAdminDisputes(PENDING_DISPUTE_PARAMS)
      return page.content.map(toDisputeRowFromApi)
    },
  })
}

const PENDING_REFUND_PARAMS = { status: ['PENDING'], page: 0, size: PAGE_SIZE } as const

/**
 * 대시보드 환불 카드·표. 카드 수치는 `AdminSummaryResponse.refundCount`가 아니라
 * 이 질의의 `totalElements`를 쓴다. `refundCount`의 설명("미처리 환불 수")만으로는
 * `REVIEW`를 포함하는지 계약상 확정할 수 없고, 포함하면 아직 환불 의무가 없는
 * 건까지 세어 과다 계상이 된다. 여기서는 범위가 `status: ['PENDING']`으로 명시돼
 * 있어 서버 집계 의미와 무관하게 카드가 표와 같은 집합을 가리킨다.
 */
export function usePendingRefundsQuery(): UseQueryResult<RowPage<RefundRow>> {
  return useQuery({
    queryKey: adminListKey('refund', PENDING_REFUND_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).pendingRefunds()
      }
      const page = await listAdminRefunds(PENDING_REFUND_PARAMS)
      return {
        rows: page.content.map(toRefundRowFromApi),
        totalElements: page.totalElements,
        totalPages: page.totalPages,
        pageNumber: page.pageNumber,
        pageSize: page.pageSize,
      }
    },
  })
}

const REVIEW_REFUND_PARAMS = { status: ['REVIEW'], page: 0, size: PAGE_SIZE } as const

/**
 * 대시보드 환불 검토 카드·표. 위 `usePendingRefundsQuery`와 같은 이유로 summary의
 * `refundCount`를 쓰지 않고 이 질의의 `totalElements`를 그대로 쓴다.
 */
export function useRefundReviewQuery(): UseQueryResult<RowPage<RefundRow>> {
  return useQuery({
    queryKey: adminListKey('refund', REVIEW_REFUND_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).reviewRefunds()
      }
      const page = await listAdminRefunds(REVIEW_REFUND_PARAMS)
      return {
        rows: page.content.map(toRefundRowFromApi),
        totalElements: page.totalElements,
        totalPages: page.totalPages,
        pageNumber: page.pageNumber,
        pageSize: page.pageSize,
      }
    },
  })
}

const PENDING_PAYOUT_PARAMS = { status: ['PENDING'], page: 0, size: PAGE_SIZE } as const

/** 대시보드 '미션 완료' 섹션은 수행비 입금 대기 건이므로 지급 목록을 쓴다. */
export function usePendingSettlementsQuery(): UseQueryResult<MissionRow[]> {
  return useQuery({
    queryKey: adminListKey('payout', PENDING_PAYOUT_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).pendingSettlements()
      }
      const page = await listAdminPayouts(PENDING_PAYOUT_PARAMS)
      return page.content.map(toMissionRowFromPayout)
    },
  })
}

const PENDING_REPORT_PARAMS = { status: 'PENDING', page: 0, size: PAGE_SIZE } as const

export function usePendingReportsQuery(): UseQueryResult<ReportRow[]> {
  return useQuery({
    queryKey: adminListKey('report', PENDING_REPORT_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).pendingReports()
      }
      const page = await listProposalReports(PENDING_REPORT_PARAMS)
      return page.content.map(toReportRowFromApi)
    },
  })
}
