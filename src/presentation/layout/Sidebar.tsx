import { NavLink } from 'react-router-dom'
import { isMockEnabled } from '../mock/mockMode'
import { NAV_ITEMS } from './navItems'

export function Sidebar() {
  return (
    <aside className="or-sidebar">
      <div className="or-brand">
        <span className="or-brand-mark" aria-hidden="true">
          꼬
        </span>
        꼬붕단 Admin
      </div>
      <nav className="or-nav" aria-label="주요 메뉴">
        <span className="or-nav-label">운영</span>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `or-nav-item${isActive ? ' is-active' : ''}`
            }
          >
            {item.label}
          </NavLink>
        ))}
      </nav>
      {/* 목 모드 전용 안내. 프로덕션에서는 `import.meta.env.DEV`가 리터럴
          false로 치환되어 이 블록과 문구가 번들에서 통째로 제거된다. */}
      {import.meta.env.DEV && isMockEnabled() ? (
        <div className="or-sidebar-foot">
          화면 확인용 데모 데이터로 동작합니다.
          <br />
          서버와 연동되어 있지 않습니다.
        </div>
      ) : null}
    </aside>
  )
}
