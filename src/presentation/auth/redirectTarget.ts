/**
 * RequireAuth가 넘긴 `location.state.from`을 안전하게 좁혀 읽는다.
 * 목록 경로만 허용하는 listOrigin과 달리 `/requests/:id` 같은 상세 경로도 복귀
 * 대상이므로 화이트리스트 대신 형태 검사를 쓴다. `//`·`/\`로 시작하는 값은
 * 브라우저가 외부 주소로 해석하므로 걸러 오픈 리다이렉트를 막는다.
 */
export function readRedirectTarget(state: unknown): string | null {
  if (typeof state !== 'object' || state === null || !('from' in state)) {
    return null
  }

  const from: unknown = state.from
  if (typeof from !== 'string' || !from.startsWith('/')) {
    return null
  }
  if (from.startsWith('//') || from.startsWith('/\\')) {
    return null
  }
  return from
}
