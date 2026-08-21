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
  분쟁중: 'crimson',
  미처리: 'rose',
  '처리 완료': 'green',
  '반려': 'crimson',
  환불: 'gray',
  신고: 'gray',
  행님: 'violet',
  꼬붕: 'cobalt',
  '진행 중': 'indigo',
  '분쟁 중': 'crimson',
}

/** 배지 알약 대신 회색 평문으로 표시하는 상태 라벨. */
const PLAIN_STATUS_LABELS: readonly string[] = []

/** 상태값은 유지하되 화면에서는 표시하지 않는 라벨. */
const HIDDEN_STATUS_LABELS: readonly string[] = ['처리 중', '환불 처리 중']

export function statusTone(label: string): StatusTone {
  return TONE_BY_LABEL[label] ?? 'gray'
}

export function isPlainStatusLabel(label: string): boolean {
  return PLAIN_STATUS_LABELS.includes(label)
}

export function isHiddenStatusLabel(label: string): boolean {
  return HIDDEN_STATUS_LABELS.includes(label)
}
