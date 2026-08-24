import { isMockEnabled, setMockModeAndReload } from './mockMode'

/**
 * 개발 빌드 전용 아바타 토글. 호출부가 `import.meta.env.DEV`로 감싸므로
 * 프로덕션 번들에는 이 컴포넌트와 목 전환 경로가 포함되지 않는다.
 */
export function MockModeAvatar() {
  const mockOn = isMockEnabled()
  const label = mockOn ? '데모' : '운영'

  return (
    <button
      type="button"
      className="or-avatar or-avatar-toggle"
      onClick={() => setMockModeAndReload(!mockOn)}
      aria-label={`현재 ${mockOn ? '목' : '실'}데이터 모드. 클릭하면 ${mockOn ? '실' : '목'}데이터 모드로 전환한다`}
    >
      {label}
    </button>
  )
}
