import { Outlet } from 'react-router-dom'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function AdminLayout() {
  return (
    <div className="or-shell">
      <Sidebar />
      <div className="or-main">
        <Header />
        <main className="or-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
