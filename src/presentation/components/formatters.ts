const DISPLAY_TIME_ZONE = 'Asia/Seoul'

// 서버 ISO 문자열에 offset(`Z` 또는 `±HH:MM`)이 없는 형태만 골라낸다.
const WITHOUT_TIME_ZONE_OFFSET = /^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/

const displayDateTimeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: DISPLAY_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

function parseAsUtcWhenOffsetMissing(value: string): Date {
  if (WITHOUT_TIME_ZONE_OFFSET.test(value)) {
    return new Date(`${value.replace(' ', 'T')}Z`)
  }
  return new Date(value)
}

function toDateTimeParts(
  parsed: Date,
): Partial<Record<Intl.DateTimeFormatPartTypes, string>> {
  const parts: Partial<Record<Intl.DateTimeFormatPartTypes, string>> = {}
  for (const part of displayDateTimeFormat.formatToParts(parsed)) {
    parts[part.type] = part.value
  }
  return parts
}

export function formatDateTime(value: string): string {
  const parsed = parseAsUtcWhenOffsetMissing(value)
  if (Number.isNaN(parsed.getTime())) {
    // 서버가 파싱 불가한 값을 주면 추측해 만들지 않고 원문을 그대로 보여준다.
    return value
  }
  const { year, month, day, hour, minute } = toDateTimeParts(parsed)
  if (
    year === undefined ||
    month === undefined ||
    day === undefined ||
    hour === undefined ||
    minute === undefined
  ) {
    // 포맷 결과가 기대한 조각을 갖추지 못하면 값을 지어내지 않고 원문을 보여준다.
    return value
  }
  // 일부 엔진은 자정을 24시로 내보내므로 24시간 표기(00~23)로 맞춘다.
  const normalizedHour = hour === '24' ? '00' : hour
  return `${year}-${month}-${day} ${normalizedHour}:${minute}`
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatCount(count: number): string {
  return `${count.toLocaleString('ko-KR')}건`
}

export function canCopyToClipboard(): boolean {
  return (
    typeof navigator !== 'undefined' && navigator.clipboard !== undefined
  )
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (!canCopyToClipboard()) {
    return Promise.resolve(false)
  }
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false,
  )
}
