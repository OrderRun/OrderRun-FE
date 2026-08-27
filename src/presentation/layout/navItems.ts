import { PATHS } from '../routes/paths'

export interface NavItem {
  to: string
  label: string
  end: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { to: PATHS.dashboard, label: '대시보드', end: true },
  { to: PATHS.requests, label: '요청 관리', end: false },
  { to: PATHS.offers, label: '지원 관리', end: false },
  { to: PATHS.missions, label: '미션 관리', end: false },
  { to: PATHS.disputes, label: '분쟁 관리', end: false },
  { to: PATHS.refunds, label: '환불 관리', end: false },
  { to: PATHS.reports, label: '신고 관리', end: false },
  { to: PATHS.users, label: '유저 관리', end: false },
]
