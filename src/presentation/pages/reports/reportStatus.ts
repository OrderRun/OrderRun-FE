import type { DemoProcessStatus } from '../../demo/demoTypes'

export const REPORT_STATUS_OPTIONS = ['전체', '미처리', '처리 완료', '반려']

export function toReportStatusFilter(
  option: string,
): DemoProcessStatus | null {
  if (option === '미처리' || option === '처리 완료' || option === '반려') {
    return option
  }
  return null
}
