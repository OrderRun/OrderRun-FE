// Shared response envelope shapes.
// Verbatim field lists from `components.schemas.ApiResponse[...]` and
// `components.schemas.PageResponse[...]` in docs/api-spec/openapi.json.

export interface ApiResponse<T> {
  success: boolean
  data?: T | null
  message?: string | null
}

export interface PageResponse<T> {
  content: T[]
  totalElements: number
  totalPages: number
  pageNumber: number
  pageSize: number
  first: boolean
  last: boolean
}
