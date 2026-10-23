export type AuthMode = 'cookie' | 'bearer'
export type HistoryMode = 'local' | 'api'

const FALLBACK_BASE_URL = 'http://localhost:8000/api'
const OVERRIDE_KEY = 'legalai.api.baseUrl'

function flag(value: string | undefined, fallback = false) {
  if (value === undefined || value.trim() === '') return fallback
  return value === 'true' || value === '1'
}

export function parseHttpUrl(value: string): string | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null
    if (url.username || url.password) return null
    url.hash = ''
    return url.toString().replace(/\/$/, '')
  } catch {
    return null
  }
}

function normalizeBaseUrl(value: string | undefined) {
  if (!value) return FALLBACK_BASE_URL
  return parseHttpUrl(value) ?? FALLBACK_BASE_URL
}

function timeoutMs(value: string | undefined) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return 90000
  return Math.min(300000, Math.max(5000, parsed))
}

const useMock = flag(import.meta.env.VITE_USE_MOCK)
const configuredHistoryMode: HistoryMode = import.meta.env.VITE_HISTORY_MODE === 'api' ? 'api' : 'local'
const authMode: AuthMode = import.meta.env.VITE_AUTH_MODE === 'bearer' ? 'bearer' : 'cookie'

/**
 * Biến VITE_ được đóng vào bundle trình duyệt. Không đặt khóa bí mật của mô hình tại đây.
 * Khóa API phải nằm ở backend.
 */
export const apiConfig = {
  defaultBaseUrl: normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL),
  useMock,
  timeout: timeoutMs(import.meta.env.VITE_API_TIMEOUT),
  authMode,
  requireAuth: flag(import.meta.env.VITE_REQUIRE_AUTH),
  configuredHistoryMode,
  historyMode: useMock ? 'local' as const : configuredHistoryMode,
  withCredentials: authMode === 'cookie' || flag(import.meta.env.VITE_API_WITH_CREDENTIALS),
  csrfCookie: import.meta.env.VITE_CSRF_COOKIE?.trim() ?? '',
  csrfHeader: import.meta.env.VITE_CSRF_HEADER?.trim() ?? '',
  googleClientId: import.meta.env.VITE_GOOGLE_CLIENT_ID?.trim() ?? '',
  paths: {
    chat: 'chat',
    login: 'auth/login',
    google: 'auth/google',
    register: 'auth/register',
    logout: 'auth/logout',
    me: 'auth/me',
    conversations: 'conversations',
    feedback: 'feedback',
  },
}

export function getApiBaseUrl() {
  try {
    const override = localStorage.getItem(OVERRIDE_KEY)
    if (override) return parseHttpUrl(override) ?? apiConfig.defaultBaseUrl
  } catch {
    // Bộ nhớ trình duyệt có thể bị chặn.
  }
  return apiConfig.defaultBaseUrl
}

export function setApiBaseUrlOverride(value: string | null) {
  if (!value) {
    localStorage.removeItem(OVERRIDE_KEY)
    return apiConfig.defaultBaseUrl
  }
  const parsed = parseHttpUrl(value)
  if (!parsed) return null
  localStorage.setItem(OVERRIDE_KEY, parsed)
  return parsed
}

export function apiBaseUrlOverrideActive() {
  try {
    return Boolean(localStorage.getItem(OVERRIDE_KEY))
  } catch {
    return false
  }
}
