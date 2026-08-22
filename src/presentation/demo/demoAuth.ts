// UI 개발용 임시 데이터. 서버 계약/Domain 모델이 아니며 연동 시 이 디렉토리를 통째로 삭제한다.

/**
 * 데모 관리자 자격 증명. 실제 비밀번호가 아니라 UI 흐름을 확인하기 위한 고정 문자열이며
 * 번들에 그대로 노출된다. 실제 인증이 붙으면 이 파일을 삭제한다.
 */
export const DEMO_ADMIN_CREDENTIALS = {
  username: 'admin',
  password: 'orderrun1234',
  displayName: '운영 관리자',
} as const

/** 데모 자격 증명과 일치하는지만 본다. 보안 경계가 아닌 화면 게이트용 비교다. */
export function matchesDemoAdmin(username: string, password: string): boolean {
  return (
    username === DEMO_ADMIN_CREDENTIALS.username &&
    password === DEMO_ADMIN_CREDENTIALS.password
  )
}
