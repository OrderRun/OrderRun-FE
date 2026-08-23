export function formatDateTime(value: string): string {
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    // 서버가 파싱 불가한 값을 주면 추측해 만들지 않고 원문을 그대로 보여준다.
    return value
  }
  const pad = (part: number) => String(part).padStart(2, '0')
  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(parsed.getHours())}:${pad(parsed.getMinutes())}`
}

export function formatAmount(amount: number): string {
  return `${amount.toLocaleString('ko-KR')}원`
}

export function formatCount(count: number): string {
  return `${count.toLocaleString('ko-KR')}건`
}

/**
 * UUID 같은 긴 ID를 표 칸에 넣기 위해 앞부분만 보여준다. 잘린 값을 진짜 ID로
 * 오해하지 않도록 호출부는 `title`에 전체 값을 함께 건다.
 */
export function formatShortId(id: string): string {
  return id.length <= 8 ? id : `${id.slice(0, 8)}…`
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
