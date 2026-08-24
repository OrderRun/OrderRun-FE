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
import type { DisputeRow, MissionRow, RefundRow, ReportRow, RequestRow } from '../models/rows'
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

export function usePendingRefundsQuery(): UseQueryResult<RefundRow[]> {
  return useQuery({
    queryKey: adminListKey('refund', PENDING_REFUND_PARAMS),
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).pendingRefunds()
      }
      const page = await listAdminRefunds(PENDING_REFUND_PARAMS)
      return page.content.map(toRefundRowFromApi)
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
