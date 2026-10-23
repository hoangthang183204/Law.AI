export type ApiErrorCode =
  | 'bad_request'
  | 'unauthorized'
  | 'forbidden'
  | 'not_found'
  | 'rate_limit'
  | 'server'
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'invalid_response'

export class ApiError extends Error {
  readonly code: ApiErrorCode
  readonly status: number | null

  constructor(code: ApiErrorCode, message: string, status: number | null = null) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
