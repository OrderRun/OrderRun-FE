import type { NavItem } from '../layout/navItems'
import { NAV_ITEMS } from '../layout/navItems'
import { PATHS } from './paths'

export const DEFAULT_ORIGIN_PATH: string = PATHS.requests

const DEFAULT_ORIGIN_LABEL = '요청 관리'

function pathnameOf(path: string): string {
  return path.split('?')[0]
}

/** 출발지로 허용하는 목록 경로는 사이드바 항목이 유일한 원본이다. */
function findOriginNavItem(path: string): NavItem | undefined {
  const pathname = pathnameOf(path)
  return NAV_ITEMS.find((item) => item.to === pathname)
}

/**
 * 목록에서 넘겨준 `location.state.from`을 안전하게 좁혀 읽는다.
 * pathname이 알려진 목록 경로와 정확히 일치할 때만 채택하므로 `/\evil.com`처럼
 * 브라우저가 외부 주소로 해석하는 값은 걸러진다. 쿼리스트링은 필터 복원에
 * 쓰이므로 잘라내지 않고 그대로 돌려준다.
 */
export function readOriginPath(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return null
  }

  const from: unknown = state.from
  if (typeof from !== 'string') {
    return null
  }
  return findOriginNavItem(from) ? from : null
}

/** 출발지 경로의 pathname을 사이드바 라벨과 대조한다. */
export function originLabelOf(path: string): string {
  return findOriginNavItem(path)?.label ?? DEFAULT_ORIGIN_LABEL
}
