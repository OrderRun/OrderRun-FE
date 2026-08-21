import type { RequestTabKey } from '../pages/requests/requestTabs'

export const PATHS = {
  dashboard: '/',
  requests: '/requests',
  requestDetail: '/requests/:proposalId',
  offers: '/offers',
  missions: '/missions',
  disputes: '/disputes',
  refunds: '/refunds',
  reports: '/reports',
  reportDetail: '/reports/:reportId',
} as const

export function reportDetailPath(reportId: string): string {
  return `${PATHS.reports}/${encodeURIComponent(reportId)}`
}

export function requestDetailPath(
  proposalId: string,
  tab?: RequestTabKey,
): string {
  const base = `${PATHS.requests}/${proposalId}`
  return tab ? `${base}?tab=${tab}` : base
}
