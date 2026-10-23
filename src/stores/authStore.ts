import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import type { LoginPayload, RegisterPayload, User } from '@/types/auth'
import { apiConfig } from '@/config/api'
import * as authService from '@/services/authService'
import { requestGoogleAccessToken } from '@/services/googleAuth'
import { ApiError, isApiError } from '@/services/apiError'
import {
  clearStoredToken,
  hasStoredBearerToken,
  markSession,
  readStoredToken,
  setMemoryToken,
  writeStoredToken,
} from '@/services/tokenState'
import { isRecord } from '@/utils/guard'

const DEMO_KEY = 'legalai.demo.session'
const GOOGLE_KEY = 'legalai.google.profile'

function clearDemoSession() {
  try {
    sessionStorage.removeItem(DEMO_KEY)
    localStorage.removeItem(DEMO_KEY)
  } catch {
    // Phiên demo chỉ tồn tại trong bộ nhớ nếu trình duyệt chặn storage.
  }
}

function clearGoogleProfile() {
  try {
    sessionStorage.removeItem(GOOGLE_KEY)
    localStorage.removeItem(GOOGLE_KEY)
  } catch {
    // Hồ sơ Google cục bộ không bắt buộc để phiên cookie còn hiệu lực.
  }
}

function readStoredUser(key: string): User | null {
  try {
    const raw = sessionStorage.getItem(key) || localStorage.getItem(key)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    if (!isRecord(parsed) || typeof parsed.id !== 'string' || typeof parsed.email !== 'string') {
      sessionStorage.removeItem(key)
      localStorage.removeItem(key)
      return null
    }
    return {
      id: parsed.id,
      email: parsed.email,
      name: typeof parsed.name === 'string' && parsed.name ? parsed.name : parsed.email,
    }
  } catch {
    return null
  }
}

function readDemoUser() {
  return readStoredUser(DEMO_KEY)
}

function readGoogleProfile() {
  return readStoredUser(GOOGLE_KEY)
}

function writeStoredUser(key: string, user: User, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage
  const other = remember ? sessionStorage : localStorage
  other.removeItem(key)
  storage.setItem(key, JSON.stringify({ id: user.id, name: user.name, email: user.email }))
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const initialized = ref(false)
  const loading = ref(false)
  const error = ref('')
  let restoreTask: Promise<void> | null = null

  const isAuthenticated = computed(() => user.value !== null)

  function clearSession() {
    user.value = null
    markSession(false)
    clearStoredToken()
    clearDemoSession()
    clearGoogleProfile()
  }

  function applySession(nextUser: User, accessToken: string | undefined, remember: boolean) {
    user.value = nextUser
    markSession(true)
    error.value = ''
    clearGoogleProfile()
    if (apiConfig.useMock) {
      writeStoredUser(DEMO_KEY, nextUser, remember)
      return
    }
    if (apiConfig.authMode === 'bearer' && accessToken) {
      writeStoredToken(accessToken, remember)
    }
  }

  async function restoreSession() {
    try {
      if (apiConfig.useMock) {
        user.value = readGoogleProfile() ?? readDemoUser()
        markSession(Boolean(user.value))
        return
      }
      clearDemoSession()
      if (apiConfig.authMode === 'bearer') {
        const token = readStoredToken()
        if (!token) {
          const localGoogle = readGoogleProfile()
          user.value = localGoogle
          markSession(Boolean(localGoogle))
          return
        }
        setMemoryToken(token)
        markSession(true)
      }
      try {
        user.value = await authService.me()
        markSession(true)
        clearGoogleProfile()
      } catch (caught) {
        const localGoogle = readGoogleProfile()
        if (localGoogle && isApiError(caught) && (caught.code === 'network' || caught.status === 404)) {
          user.value = localGoogle
          markSession(true)
          return
        }
        clearSession()
        if (isApiError(caught) && caught.status !== 401 && caught.status !== 403 && caught.status !== 404 && apiConfig.requireAuth) {
          error.value = caught.message
        }
      }
    } finally {
      initialized.value = true
    }
  }

  function restore() {
    if (!restoreTask) restoreTask = restoreSession()
    return restoreTask
  }

  async function login(payload: LoginPayload) {
    loading.value = true
    error.value = ''
    try {
      const session = await authService.login(payload)
      if (!apiConfig.useMock && apiConfig.authMode === 'bearer' && !session.accessToken) {
        throw new ApiError('invalid_response', 'Máy chủ không trả về access token cho chế độ Bearer.')
      }
      applySession(session.user, session.accessToken, payload.remember === true)
      return true
    } catch (caught) {
      error.value = isApiError(caught) ? caught.message : 'Không đăng nhập được.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function loginWithGoogle(remember: boolean) {
    loading.value = true
    error.value = ''
    try {
      if (!apiConfig.googleClientId) {
        error.value = 'Chưa có mã khách Google. Thêm VITE_GOOGLE_CLIENT_ID vào file .env, khai báo origin của trang này trong Google Cloud, rồi khởi động lại ứng dụng.'
        return false
      }
      const accessToken = await requestGoogleAccessToken(apiConfig.googleClientId)
      const session = await authService.loginWithGoogle(accessToken)
      if (session.localOnly || apiConfig.useMock) {
        clearDemoSession()
        clearStoredToken()
        user.value = session.user
        markSession(true)
        error.value = ''
        writeStoredUser(GOOGLE_KEY, session.user, remember || apiConfig.useMock)
        return 'local' as const
      }
      if (apiConfig.authMode === 'bearer' && !session.accessToken) {
        throw new ApiError('invalid_response', 'Máy chủ không trả về access token sau khi đăng nhập Google.')
      }
      applySession(session.user, session.accessToken, remember)
      return 'server' as const
    } catch (caught) {
      error.value = isApiError(caught) ? caught.message : 'Không đăng nhập được bằng Google.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function register(payload: RegisterPayload) {
    loading.value = true
    error.value = ''
    try {
      const session = await authService.register(payload)
      if (!apiConfig.useMock && apiConfig.authMode === 'bearer' && !session.accessToken) {
        throw new ApiError('invalid_response', 'Máy chủ không trả về access token sau khi đăng ký.')
      }
      applySession(session.user, session.accessToken, true)
      return true
    } catch (caught) {
      error.value = isApiError(caught) ? caught.message : 'Không tạo được tài khoản.'
      return false
    } finally {
      loading.value = false
    }
  }

  async function logout() {
    let confirmed = true
    try {
      if (!apiConfig.useMock) await authService.logout()
    } catch {
      confirmed = false
    } finally {
      clearSession()
    }
    return confirmed
  }

  return {
    user,
    initialized,
    loading,
    error,
    isAuthenticated,
    restore,
    login,
    loginWithGoogle,
    register,
    logout,
    clearSession,
    hasStoredBearerToken,
  }
})
