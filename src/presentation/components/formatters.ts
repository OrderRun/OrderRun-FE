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
