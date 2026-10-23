import type { ChatMessage, Conversation, MessageStatus } from '@/types/chat'
import { adaptSourceList, adaptStructured } from '@/services/adapters'
import { createId } from '@/utils/id'
import { isRecord } from '@/utils/guard'

const HISTORY_PREFIX = 'legalai.history.'

function storageKey(owner: string) {
  return `${HISTORY_PREFIX}${owner}`
}

function isStatus(value: string): value is MessageStatus {
  return value === 'processing' || value === 'complete' || value === 'empty' || value === 'error' || value === 'timeout' || value === 'cancelled'
}

function sanitizeMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null
  if (value.role !== 'user' && value.role !== 'assistant') return null
  if (typeof value.content !== 'string') return null
  let status: MessageStatus = 'complete'
  if (typeof value.status === 'string' && isStatus(value.status)) status = value.status
  const interrupted = value.role === 'assistant' && status === 'processing'
  if (interrupted) status = 'error'
  const message: ChatMessage = {
    id: typeof value.id === 'string' && value.id ? value.id : createId(),
    role: value.role,
    content: value.content,
    createdAt: typeof value.createdAt === 'string' ? value.createdAt : new Date().toISOString(),
    status,
  }
  if (interrupted) {
    message.errorMessage = 'Phiên xử lý bị gián đoạn trước khi có phản hồi. Bạn có thể thử lại.'
  } else if (typeof value.errorMessage === 'string') {
    message.errorMessage = value.errorMessage.slice(0, 300)
  }
  const sources = adaptSourceList(value.sources)
  const structured = adaptStructured(value.structured)
  if (sources) message.sources = sources
  if (structured) message.structured = structured
  if (value.demo === true) message.demo = true
  if (value.feedback === 'helpful' || value.feedback === 'unhelpful') message.feedback = value.feedback
  if (typeof value.feedbackSynced === 'boolean') message.feedbackSynced = value.feedbackSynced
  return message
}

function sanitizeConversation(value: unknown): Conversation | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !value.id || value.id.length > 100) return null
  const messages = Array.isArray(value.messages)
    ? value.messages.map(sanitizeMessage).filter((item): item is ChatMessage => item !== null)
    : []
  const createdAt = typeof value.createdAt === 'string' ? value.createdAt : ''
  return {
    id: value.id,
    title: typeof value.title === 'string' && value.title.trim() ? value.title.trim().slice(0, 120) : 'Cuộc trò chuyện',
    createdAt,
    updatedAt: typeof value.updatedAt === 'string' ? value.updatedAt : createdAt,
    titleEdited: value.titleEdited === true,
    messagesLoaded: true,
    remoteCreated: false,
    messages,
  }
}

export function readHistory(owner: string) {
  try {
    const raw = localStorage.getItem(storageKey(owner))
    if (!raw) return []
    const parsed: unknown = JSON.parse(raw)
    const rows = isRecord(parsed) && Array.isArray(parsed.conversations) ? parsed.conversations : []
    return rows.map(sanitizeConversation).filter((item): item is Conversation => item !== null)
  } catch {
    return []
  }
}

export function writeHistory(owner: string, conversations: Conversation[]) {
  localStorage.setItem(storageKey(owner), JSON.stringify({ version: 1, conversations }))
}
