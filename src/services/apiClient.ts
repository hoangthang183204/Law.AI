import axios, { type AxiosError, type AxiosRequestConfig } from 'axios'
import { apiConfig, getApiBaseUrl } from '@/config/api'
import { ApiError } from '@/services/apiError'
import { getMemoryToken, noteUnauthorized, takeUnauthorizedHadSession } from '@/services/tokenState'
import { isRecord, optionalString } from '@/utils/guard'

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
}

function readCookie(name: string) {
  if (!name || typeof document === 'undefined') return null
  const prefix = `${name}=`
  const found = document.cookie.split('; ').find((row) => row.startsWith(prefix))
  if (!found) return null
  try {
    return decodeURIComponent(found.slice(prefix.length))
  } catch {
    return null
  }
}

function cleanServerMessage(value: unknown) {
  if (!isRecord(value)) return null
  const raw = value.message ?? value.detail
  if (typeof raw !== 'string') return null
  const text = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim()
  if (!text || text.length > 160) return null
  if (/stack|traceback|sql|exception|token|password|secret/i.test(text)) return null
  return text
}

function retryHint(error: AxiosError) {
  const header = error.response?.headers?.['retry-after']
  const seconds = typeof header === 'string' ? Number(header) : NaN
  if (Number.isFinite(seconds) && seconds > 0 && seconds < 3600) {
    return ` Thử lại sau khoảng ${Math.ceil(seconds)} giây.`
  }
  return ''
}

export function toApiError(error: unknown) {
  if (error instanceof ApiError) return error
  if (!axios.isAxiosError(error)) {
    return new ApiError('network', 'Đã xảy ra lỗi không xác định.')
  }
  if (error.code === 'ERR_CANCELED') {
    return new ApiError('cancelled', 'Bạn đã dừng yêu cầu.')
  }
  if (error.code === 'ECONNABORTED') {
    return new ApiError('timeout', 'Máy chủ phản hồi quá lâu. Bạn có thể thử lại.')
  }
  if (!error.response) {
    return new ApiError('network', 'Không thể kết nối tới máy chủ. Hãy kiểm tra địa chỉ API và kết nối mạng.')
  }

  const status = error.response.status
  const serverMessage = cleanServerMessage(error.response.data)
  const url = error.config?.url ?? ''

  if (status === 400) {
    return new ApiError('bad_request', serverMessage ?? 'Dữ liệu gửi lên không hợp lệ.', status)
  }
  if (status === 401) {
    if (url.includes('/auth/login')) {
      return new ApiError('unauthorized', serverMessage ?? 'Email, tên đăng nhập hoặc mật khẩu chưa đúng.', status)
    }
    const expired = takeUnauthorizedHadSession()
    return new ApiError(
      'unauthorized',
      expired
        ? 'Phiên đăng nhập không còn hiệu lực. Vui lòng đăng nhập lại.'
        : 'Máy chủ yêu cầu đăng nhập trước khi thực hiện yêu cầu này.',
      status,
    )
  }
  if (status === 403) {
    return new ApiError('forbidden', 'Bạn không có quyền thực hiện thao tác này.', status)
  }
  if (status === 404) {
    return new ApiError('not_found', 'Không tìm thấy dữ liệu yêu cầu.', status)
  }
  if (status === 429) {
    return new ApiError('rate_limit', `Bạn đã gửi quá nhiều yêu cầu.${retryHint(error)}`, status)
  }
  if (status >= 500) {
    return new ApiError('server', 'Máy chủ đang gặp sự cố. Vui lòng thử lại.', status)
  }
  return new ApiError('server', 'Máy chủ trả về một lỗi chưa được nhận dạng.', status)
}

const client = axios.create({
  timeout: apiConfig.timeout,
  headers: { Accept: 'application/json' },
})

client.interceptors.request.use((config) => {
  config.withCredentials = apiConfig.withCredentials
  if (apiConfig.authMode === 'bearer') {
    const token = getMemoryToken()
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  if (apiConfig.csrfCookie && apiConfig.csrfHeader) {
    const method = (config.method ?? 'get').toLowerCase()
    if (!['get', 'head', 'options'].includes(method)) {
      const csrf = readCookie(apiConfig.csrfCookie)
      if (csrf) config.headers[apiConfig.csrfHeader] = csrf
    }
  }
  return config
})

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const url = error.config?.url ?? ''
    const isAuthProbe = ['/auth/login', '/auth/register', '/auth/me'].some((path) => url.includes(path))
    if (error.response?.status === 401 && !isAuthProbe) {
      noteUnauthorized()
      window.dispatchEvent(new CustomEvent('legalai:unauthorized'))
    }
    return Promise.reject(error)
  },
)

export async function request(path: string, config: AxiosRequestConfig = {}) {
  try {
    const response = await client.request({
      ...config,
      url: joinUrl(getApiBaseUrl(), path),
    })
    return response.data as unknown
  } catch (error) {
    throw toApiError(error)
  }
}

export function optionalServerMessage(data: unknown) {
  return optionalString(isRecord(data) ? data.message : undefined)
}
