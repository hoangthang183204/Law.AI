import { ApiError } from '@/services/apiError'
import type { User } from '@/types/auth'
import { isRecord } from '@/utils/guard'

interface GoogleTokenResponse {
  access_token?: string
  error?: string
}

interface GoogleTokenClient {
  requestAccessToken: (override?: { prompt?: string }) => void
}

interface GoogleAccounts {
  oauth2: {
    initTokenClient: (config: {
      client_id: string
      scope: string
      callback: (response: GoogleTokenResponse) => void
      error_callback?: (error: { type?: string }) => void
    }) => GoogleTokenClient
  }
}

declare global {
  interface Window {
    google?: { accounts: GoogleAccounts }
  }
}

let scriptTask: Promise<void> | null = null

function loadGoogleScript() {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (scriptTask) return scriptTask
  scriptTask = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.dataset.googleGsi = 'true'
    script.onload = () => resolve()
    script.onerror = () => {
      scriptTask = null
      reject(new ApiError('network', 'Không tải được đăng nhập Google. Hãy kiểm tra kết nối mạng.'))
    }
    document.head.appendChild(script)
  })
  return scriptTask
}

function popupMessage(type?: string) {
  if (type === 'popup_closed') return 'Bạn đã đóng cửa sổ Google.'
  if (type === 'popup_failed_to_open') return 'Trình duyệt đã chặn cửa sổ đăng nhập Google.'
  return 'Không mở được cửa sổ đăng nhập Google.'
}

export async function requestGoogleAccessToken(clientId: string) {
  await loadGoogleScript()
  const google = window.google
  if (!google?.accounts?.oauth2) {
    throw new ApiError('network', 'Trình duyệt chưa sẵn sàng để đăng nhập Google.')
  }
  return new Promise<string>((resolve, reject) => {
    const client = google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'openid email profile',
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token)
          return
        }
        const cancelled = response.error === 'access_denied' || response.error === 'popup_closed'
        reject(new ApiError('unauthorized', cancelled ? 'Bạn đã đóng cửa sổ Google.' : 'Google không cấp quyền đăng nhập.', 401))
      },
      error_callback: (error) => {
        reject(new ApiError('unauthorized', popupMessage(error.type), 401))
      },
    })
    client.requestAccessToken({ prompt: 'select_account' })
  })
}

export async function fetchGoogleProfile(accessToken: string): Promise<User> {
  let response: Response
  try {
    response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(15000),
    })
  } catch {
    throw new ApiError('network', 'Không lấy được hồ sơ từ Google.')
  }
  if (!response.ok) throw new ApiError('unauthorized', 'Google không xác nhận được tài khoản.', response.status)
  const data: unknown = await response.json()
  if (!isRecord(data) || typeof data.sub !== 'string' || typeof data.email !== 'string' || !data.email) {
    throw new ApiError('invalid_response', 'Google không trả về email của tài khoản.')
  }
  if (data.email_verified === false) {
    throw new ApiError('unauthorized', 'Email Google chưa được xác minh.', 401)
  }
  const name = typeof data.name === 'string' && data.name.trim() ? data.name.trim() : data.email
  return {
    id: `google_${data.sub}`,
    email: data.email,
    name,
  }
}
