import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AdminSessionProvider } from '../auth/AdminSessionProvider'
import { RequireAuth } from '../auth/RequireAuth'
import { AdminQueryProvider } from '../queries/AdminQueryProvider'
import { AdminLayout } from '../layout/AdminLayout'
import { LoginPage } from '../pages/auth/LoginPage'
import { DashboardPage } from '../pages/dashboard/DashboardPage'
import { DisputeListPage } from '../pages/disputes/DisputeListPage'
import { MissionListPage } from '../pages/missions/MissionListPage'
import { OfferListPage } from '../pages/offers/OfferListPage'
import { RefundListPage } from '../pages/refunds/RefundListPage'
import { ReportListPage } from '../pages/reports/ReportListPage'
import { RequestDetailPage } from '../pages/requests/RequestDetailPage'
import { RequestListPage } from '../pages/requests/RequestListPage'
import { UserListPage } from '../pages/users/UserListPage'
import { PATHS } from './paths'
import '../styles/admin.css'

export function AppRouter() {
  return (
    <BrowserRouter>
      <AdminSessionProvider>
        {/* 세션 안쪽에 두어 401일 때 signOut을 호출할 수 있게 한다. */}
        <AdminQueryProvider>
          <Routes>
            <Route path={PATHS.login} element={<LoginPage />} />
            {/* 가드가 AdminLayout 바깥에 있어야 미인증일 때 사이드바·헤더가 마운트되지 않는다. */}
            <Route element={<RequireAuth />}>
              <Route element={<AdminLayout />}>
                <Route path={PATHS.dashboard} element={<DashboardPage />} />
                <Route path={PATHS.requests} element={<RequestListPage />} />
                <Route path={PATHS.requestDetail} element={<RequestDetailPage />} />
                <Route path={PATHS.offers} element={<OfferListPage />} />
                <Route path={PATHS.missions} element={<MissionListPage />} />
                <Route path={PATHS.disputes} element={<DisputeListPage />} />
                <Route path={PATHS.refunds} element={<RefundListPage />} />
                <Route path={PATHS.reports} element={<ReportListPage />} />
                <Route path={PATHS.users} element={<UserListPage />} />
              </Route>
            </Route>
            <Route path="*" element={<Navigate to={PATHS.dashboard} replace />} />
          </Routes>
        </AdminQueryProvider>
      </AdminSessionProvider>
    </BrowserRouter>
  )
}
