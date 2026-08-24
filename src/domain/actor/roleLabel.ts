/**
 * 분쟁 참여자의 역할 값 → 운영 화면 라벨.
 *
 * `AdminDisputeSummaryResponse.requesterRole`과 `AdminDisputeDetailResponse.targetRole`은
 * 스펙상 enum이 아니라 자유 string이다. 따라서 전수 매핑(`Record<Enum, string>`)을
 * 만들지 않고 알려진 값만 바꾼 뒤 나머지는 원본을 그대로 통과시킨다. 이미 한글로
 * 들어오는 값(목 데이터)도 이 통과 규칙 덕분에 그대로 그려진다.
 *
 * 상태값 라벨(`status/statusLabel.ts`)은 서버 enum 전수 매핑이라 규칙이 다르므로
 * 합치지 않는다.
 */
const ACTOR_ROLE_LABELS = new Map<string, string>([
  ['ORDERER', '행님'],
  ['RUNNER', '꼬붕'],
])

export function toActorRoleLabel(role: string): string {
  return ACTOR_ROLE_LABELS.get(role) ?? role
}
