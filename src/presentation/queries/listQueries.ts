import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import {
  listAdminDisputes,
  listAdminMissions,
  listAdminOffers,
  listAdminProposals,
  listAdminRefunds,
  listProposalReports,
} from '../../data/api/adminApi'
import {
  toDisputeStatusFilter,
  toMissionStatusFilter,
  toOfferStatusFilter,
  toPayoutStatusFilter,
  toProposalStatusFilter,
  toReportStatusFilter,
} from '../../domain/status/statusFilter'
import {
  toDisputeRowFromApi,
  toMissionRowFromApi,
  toOfferRowFromApi,
  toRefundRowFromApi,
  toReportRowFromApi,
  toRequestRowFromApi,
} from '../models/adminRows'
import type {
  DisputeRow,
  MissionRow,
  OfferRow,
  RefundRow,
  ReportRow,
  RequestRow,
  RowPage,
} from '../models/rows'
import type { PageResponse } from '../../data/api/apiEnvelope'
import { isMockEnabled } from '../mock/mockMode'
import { adminListKey } from './adminQueryKeys'

/**
 * 목록 페이지 쿼리. 목/실 분기는 이 `queryFn` 한 곳에서만 일어나고, 목 데이터는
 * **동적 import로만** 닿는다. 프로덕션 빌드에서 `import.meta.env.DEV`가 리터럴
 * false가 되어 분기 블록과 목 청크가 통째로 제거된다.
 *
 * 검색·필터는 전부 서버 쿼리 파라미터로 넘긴다. 현재 페이지만 클라이언트에서
 * 거르면 "검색했는데 없다"가 거짓이 되기 때문이다.
 */
async function loadMock() {
  return (await import('../mock/mockAdminLists')).mockLists
}

/** 서버 `size` 상한은 100이지만, 한 화면에 20건씩 두고 나머지는 페이지로 넘긴다. */
export const LIST_PAGE_SIZE = 20

function toRowPage<D, R>(
  page: PageResponse<D>,
  toRow: (dto: D) => R,
): RowPage<R> {
  return {
    rows: page.content.map(toRow),
    totalElements: page.totalElements,
    totalPages: page.totalPages,
    pageNumber: page.pageNumber,
    pageSize: page.pageSize,
  }
}

interface ListParams {
  /** 화면의 한글 필터 옵션. 실 모드는 enum 배열로, 목 모드는 라벨 그대로 쓴다. */
  statusLabel: string
  page: number
}

interface KeywordListParams extends ListParams {
  keyword: string
}

export function useRequestListQuery(
  params: KeywordListParams,
): UseQueryResult<RowPage<RequestRow>> {
  const { statusLabel, keyword, page } = params
  return useQuery({
    queryKey: adminListKey('proposal', {
      status: statusLabel,
      keyword,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).requests({
          statusLabel,
          keyword,
          page,
          size: LIST_PAGE_SIZE,
        })
      }
      const result = await listAdminProposals({
        status: toProposalStatusFilter(statusLabel),
        keyword: keyword.trim() === '' ? undefined : keyword.trim(),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toRequestRowFromApi)
    },
  })
}

export function useOfferListQuery(
  params: KeywordListParams & {
    accepted: boolean | undefined
    hasDispute: boolean | undefined
  },
): UseQueryResult<RowPage<OfferRow>> {
  const { statusLabel, keyword, accepted, hasDispute, page } = params
  return useQuery({
    queryKey: adminListKey('offer', {
      status: statusLabel,
      accepted,
      hasDispute,
      keyword,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).offers({
          statusLabel,
          keyword,
          accepted,
          hasDispute,
          page,
          size: LIST_PAGE_SIZE,
        })
      }
      const result = await listAdminOffers({
        status: toOfferStatusFilter(statusLabel),
        accepted,
        hasDispute,
        keyword: keyword.trim() === '' ? undefined : keyword.trim(),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toOfferRowFromApi)
    },
  })
}

/** `GET /v1/admin/missions`에는 `keyword` 파라미터가 없어 상태로만 조회한다. */
export function useMissionListQuery(
  params: ListParams,
): UseQueryResult<RowPage<MissionRow>> {
  const { statusLabel, page } = params
  return useQuery({
    queryKey: adminListKey('mission', {
      status: statusLabel,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).missions({ statusLabel, page, size: LIST_PAGE_SIZE })
      }
      const result = await listAdminMissions({
        status: toMissionStatusFilter(statusLabel),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toMissionRowFromApi)
    },
  })
}

export function useDisputeListQuery(
  params: KeywordListParams,
): UseQueryResult<RowPage<DisputeRow>> {
  const { statusLabel, keyword, page } = params
  return useQuery({
    queryKey: adminListKey('dispute', {
      status: statusLabel,
      keyword,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).disputes({
          statusLabel,
          keyword,
          page,
          size: LIST_PAGE_SIZE,
        })
      }
      const result = await listAdminDisputes({
        status: toDisputeStatusFilter(statusLabel),
        keyword: keyword.trim() === '' ? undefined : keyword.trim(),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toDisputeRowFromApi)
    },
  })
}

export function useRefundListQuery(
  params: KeywordListParams & { requestedFrom: string },
): UseQueryResult<RowPage<RefundRow>> {
  const { statusLabel, keyword, requestedFrom, page } = params
  return useQuery({
    queryKey: adminListKey('refund', {
      status: statusLabel,
      keyword,
      requestedFrom,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).refunds({
          statusLabel,
          keyword,
          requestedFrom,
          page,
          size: LIST_PAGE_SIZE,
        })
      }
      const result = await listAdminRefunds({
        status: toPayoutStatusFilter(statusLabel),
        requestedFrom: requestedFrom === '' ? undefined : requestedFrom,
        keyword: keyword.trim() === '' ? undefined : keyword.trim(),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toRefundRowFromApi)
    },
  })
}

export function useReportListQuery(
  params: KeywordListParams,
): UseQueryResult<RowPage<ReportRow>> {
  const { statusLabel, keyword, page } = params
  return useQuery({
    queryKey: adminListKey('report', {
      status: statusLabel,
      keyword,
      page,
      size: LIST_PAGE_SIZE,
    }),
    placeholderData: keepPreviousData,
    queryFn: async () => {
      if (import.meta.env.DEV && isMockEnabled()) {
        return (await loadMock()).reports({
          statusLabel,
          keyword,
          page,
          size: LIST_PAGE_SIZE,
        })
      }
      const result = await listProposalReports({
        status: toReportStatusFilter(statusLabel),
        keyword: keyword.trim() === '' ? undefined : keyword.trim(),
        page,
        size: LIST_PAGE_SIZE,
      })
      return toRowPage(result, toReportRowFromApi)
    },
  })
}
