import { ApiError } from '../../data/api/apiError'

/**
 * 쿼리 실패 문구. 원인을 구분하지 못하면 서버 메시지를 그대로 보여준다.
 * 토큰이나 요청 상세를 화면에 싣지 않는다.
 */
export function toQueryErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === null) {
      return '서버에 연결할 수 없습니다.'
    }
    if (error.status >= 500) {
      return '일시적인 오류가 발생했습니다.'
    }
    return error.message
  }
  return '알 수 없는 오류가 발생했습니다.'
}
