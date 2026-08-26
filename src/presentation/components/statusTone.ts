export type StatusTone =
  | 'indigo'
  | 'green'
  | 'gray'
  | 'rose'
  | 'crimson'
  | 'blue'
  | 'amber'
  | 'cobalt'
  | 'violet'

const TONE_BY_LABEL: Record<string, StatusTone> = {
  미입금: 'rose',
  대기중: 'blue',
  '새로운 지원 도착': 'amber',
  선택됨: 'indigo',
  진행중: 'indigo',
  완료: 'green',
  취소: 'gray',
  '꼬붕 수행비 입금 완료': 'green',
  '행님 입금비 환불 완료': 'green',
  분쟁중: 'crimson',
  미처리: 'rose',
  // 입금 대조가 끝나지 않아 환불 의무가 아직 확정되지 않은 상태.
  '확인 필요': 'amber',
  '처리 완료': 'green',
  '반려': 'crimson',
  행님: 'violet',
  꼬붕: 'cobalt',
}

export function statusTone(label: string): StatusTone {
  return TONE_BY_LABEL[label] ?? 'gray'
}
