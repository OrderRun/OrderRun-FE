const STORAGE_KEY = 'orderrun.useMock'

/**
 * 목/실 분기 스위치. 프로덕션에서는 항상 false이며, `import.meta.env.DEV`가
 * 리터럴 false로 치환되므로 목 경로(동적 import) 전체가 죽은 코드로 제거된다.
 * 런타임 토글은 개발 빌드에서만 localStorage로 동작한다.
 */
export function isMockEnabled(): boolean {
  if (!import.meta.env.DEV) {
    return false
  }
  const stored = readStoredMockMode()
  if (stored !== null) {
    return stored
  }
  // 개발 빌드 기본값은 목데이터 ON이다. 서버가 죽어 있어도 화면이 뜨게 한다.
  return true
}

export function readStoredMockMode(): boolean | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw === 'true') return true
    if (raw === 'false') return false
    return null
  } catch {
    // Storage 접근이 막힌 환경에서는 코드에 고정된 기본값으로 떨어진다.
    return null
  }
}

/**
 * 기록 후 전체 리로드한다. 진행 중 요청과 Query 캐시가 통째로 사라져야
 * 두 모드의 데이터가 한 화면에 섞이지 않는다.
 */
export function setMockModeAndReload(enabled: boolean): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false')
  } catch {
    // 기록에 실패해도 리로드 자체는 막지 않는다.
  }
  window.location.reload()
}
