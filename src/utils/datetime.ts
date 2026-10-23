import type { Conversation } from '@/types/chat'

const TIME_ZONE = 'Asia/Ho_Chi_Minh'

export function ymdInVietnam(date: Date) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

export function formatTime(iso: string) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function formatLegalDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('vi-VN', {
    timeZone: TIME_ZONE,
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export interface ConversationGroup {
  id: string
  label: string
  items: Conversation[]
}

export function groupConversations(items: Conversation[]): ConversationGroup[] {
  const groups: ConversationGroup[] = [
    { id: 'today', label: 'Hôm nay', items: [] },
    { id: 'yesterday', label: 'Hôm qua', items: [] },
    { id: 'week', label: '7 ngày gần đây', items: [] },
    { id: 'older', label: 'Cũ hơn', items: [] },
  ]
  const now = new Date()
  const today = ymdInVietnam(now)
  const yesterday = ymdInVietnam(new Date(now.getTime() - 24 * 60 * 60 * 1000))
  const weekStart = ymdInVietnam(new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000))

  for (const item of items) {
    const date = new Date(item.updatedAt)
    if (Number.isNaN(date.getTime())) {
      groups[3].items.push(item)
      continue
    }
    const day = ymdInVietnam(date)
    if (day === today) groups[0].items.push(item)
    else if (day === yesterday) groups[1].items.push(item)
    else if (day >= weekStart) groups[2].items.push(item)
    else groups[3].items.push(item)
  }

  return groups.filter((group) => group.items.length > 0)
}
