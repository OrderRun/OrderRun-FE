/**
 * 서버가 준 문자열을 화면 모델의 optional 값으로 정규화한다. null·undefined는
 * 물론 공백만 있는 문자열도 값이 없는 것으로 보아 null로 통일한다. 화면은 빈 칸
 * 대신 '해당 없음' 같은 없음 표시를 그릴 수 있게 된다.
 *
 * 표 모델(`adminRows.ts`)과 상세 모델(`adminDetail.ts`) 두 변환 경계가 함께
 * 쓰므로 mapper끼리 직접 import하지 않도록 별도 파일에 둔다.
 */
export function optionalText(value: string | null | undefined): string | null {
  return value === null || value === undefined || value.trim() === '' ? null : value
}
