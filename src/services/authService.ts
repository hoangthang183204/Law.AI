import type { LoginPayload, RegisterPayload, AuthSession } from '@/types/auth'
import { apiConfig } from '@/config/api'
import { adaptLoginPayload, adaptUserPayload } from '@/services/adapters'
import { ApiError } from '@/services/apiError'
import { isApiError } from '@/services/apiError'
import { request } from '@/services/apiClient'
import { mockLogin, mockRegister } from '@/services/mock/mockBackend'
import { fetchGoogleProfile } from '@/services/googleAuth'

export async function login(payload: LoginPayload): Promise<AuthSession> {
  if (apiConfig.useMock) return mockLogin(payload)
  try {
    const data = await request(apiConfig.paths.login, {
      method: 'POST',
      data: {
        username: payload.username,
        password: payload.password,
      },
    })
    return adaptLoginPayload(data)
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      throw new ApiError('not_found', 'Máy chủ không có điểm đăng nhập đã cấu hình.', 404)
    }
    throw error
  }
}

export async function register(payload: RegisterPayload): Promise<AuthSession> {
  if (apiConfig.useMock) return mockRegister(payload)
  try {
    const data = await request(apiConfig.paths.register, {
      method: 'POST',
      data: {
        name: payload.name,
        email: payload.email,
        password: payload.password,
      },
    })
    return adaptLoginPayload(data)
  } catch (error) {
    if (isApiError(error) && error.status === 404) {
      throw new ApiError('not_found', 'Máy chủ không hỗ trợ đăng ký tài khoản.', 404)
    }
    throw error
  }
}

export async function loginWithGoogle(accessToken: string): Promise<AuthSession> {
  if (apiConfig.useMock) {
    return { user: await fetchGoogleProfile(accessToken), localOnly: true }
  }
  try {
    const data = await request(apiConfig.paths.google, {
      method: 'POST',
      data: { access_token: accessToken },
    })
    return adaptLoginPayload(data)
  } catch (error) {
    if (isApiError(error) && (error.status === 404 || error.code === 'network')) {
      return { user: await fetchGoogleProfile(accessToken), localOnly: true }
    }
    throw error
  }
}

export async function logout() {
  await request(apiConfig.paths.logout, { method: 'POST' })
}

export async function me() {
  const data = await request(apiConfig.paths.me, { timeout: 8000 })
  return adaptUserPayload(data)
}
