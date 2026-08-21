import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminLayout } from '../layout/AdminLayout'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { DisputeListPage } from '../pages/disputes/DisputeListPage'
import { MissionListPage } from '../pages/missions/MissionListPage'
import { OfferListPage } from '../pages/offers/OfferListPage'
import { RefundListPage } from '../pages/refunds/RefundListPage'
import { ReportDetailPage } from '../pages/reports/ReportDetailPage'
import { ReportListPage } from '../pages/reports/ReportListPage'
import { RequestDetailPage } from '../pages/requests/RequestDetailPage'
import { RequestListPage } from '../pages/requests/RequestListPage'
import { PATHS } from './paths'
import '../styles/admin.css'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AdminLayout />}>
          <Route path={PATHS.dashboard} element={<DashboardPage />} />
          <Route path={PATHS.requests} element={<RequestListPage />} />
          <Route path={PATHS.requestDetail} element={<RequestDetailPage />} />
          <Route path={PATHS.offers} element={<OfferListPage />} />
          <Route path={PATHS.missions} element={<MissionListPage />} />
          <Route path={PATHS.disputes} element={<DisputeListPage />} />
          <Route path={PATHS.refunds} element={<RefundListPage />} />
          <Route path={PATHS.reports} element={<ReportListPage />} />
          <Route path={PATHS.reportDetail} element={<ReportDetailPage />} />
        </Route>
        <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
      </Routes>
    </BrowserRouter>
  )
}
