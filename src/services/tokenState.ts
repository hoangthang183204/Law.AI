const TOKEN_KEY = 'legalai.auth.token'

let memoryToken: string | null = null
let sessionActive = false
let unauthorizedHadSession = false

export function setMemoryToken(token: string | null) {
  memoryToken = token
}

export function getMemoryToken() {
  return memoryToken
}

export function markSession(active: boolean) {
  sessionActive = active
}

export function noteUnauthorized() {
  unauthorizedHadSession = sessionActive
}

export function takeUnauthorizedHadSession() {
  const value = unauthorizedHadSession
  unauthorizedHadSession = false
  return value
}

export function readStoredToken() {
  try {
    return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY)
  } catch {
    return null
  }
}

export function hasStoredBearerToken() {
  return Boolean(readStoredToken())
}

export function writeStoredToken(token: string, remember: boolean) {
  clearStoredToken()
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(TOKEN_KEY, token)
  memoryToken = token
}

export function clearStoredToken() {
  memoryToken = null
  try {
    sessionStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(TOKEN_KEY)
  } catch {
    // Bỏ qua khi trình duyệt chặn bộ nhớ.
  }
}
