import type { RequestTabKey } from '../pages/requests/requestTabs'

export const PATHS = {
  login: '/login',
  dashboard: '/',
  requests: '/requests',
  requestDetail: '/requests/:proposalId',
  offers: '/offers',
  missions: '/missions',
  disputes: '/disputes',
  refunds: '/refunds',
  reports: '/reports',
  users: '/users',
} as const

export function requestDetailPath(
  proposalId: string,
  tab?: RequestTabKey,
): string {
  const base = `${PATHS.requests}/${proposalId}`
  return tab ? `${base}?tab=${tab}` : base
}
