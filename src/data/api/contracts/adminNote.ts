// Verbatim from `components.schemas.AdminNoteRequest` in docs/api-spec/openapi.json.
// 요청 취소·분쟁 반려·환불 완료/반려·지급 완료/반려가 같은 body를 공유한다.
export interface AdminNoteRequest {
  adminNote?: string | null
  adminId?: string | null
}
