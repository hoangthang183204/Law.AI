export function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `id-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

export function ownerStorageId(userId: string | null) {
  if (!userId) return 'guest'
  const safe = userId.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 80)
  return `user_${safe || 'unknown'}`
}
