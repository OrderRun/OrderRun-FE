/**
 * 서버가 준 문자열을 화면 모델의 optional 값으로 정규화한다. null·undefined는
 * 물론 공백만 있는 문자열도 값이 없는 것으로 보아, 화면이 빈 칸을 그리지 않고
 * 폴백(축약 ID·'해당 없음')을 그릴 수 있게 한다.
 *
 * 표 모델(`adminRows.ts`)과 상세 모델(`adminDetail.ts`) 두 변환 경계가 함께
 * 쓰므로 mapper끼리 직접 import하지 않도록 별도 파일에 둔다.
 */
export function optionalText(value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === '' ? null : value
}
