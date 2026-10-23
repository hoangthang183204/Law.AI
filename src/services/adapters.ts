import type { AuthSession, User } from '@/types/auth'
import type {
  AdaptedAssistantMessage,
  ChatMessage,
  Conversation,
  LegalStructure,
  MessageStatus,
  SourceReference,
} from '@/types/chat'
import { ApiError } from '@/services/apiError'
import { createId } from '@/utils/id'
import { isRecord, optionalString } from '@/utils/guard'

const INVALID_AUTH = 'Phản hồi xác thực không đúng định dạng đã cấu hình.'
const INVALID_CHAT = 'Phản hồi từ máy chủ không đúng định dạng đã cấu hình. Hãy chỉnh adapter trong src/services/adapters.ts cho đúng schema backend.'
const INVALID_HISTORY = 'Dữ liệu hội thoại không đúng định dạng đã cấu hình.'

function adaptDate(value: unknown) {
  if (typeof value !== 'string' && typeof value !== 'number') return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString()
}

function adaptInForce(record: Record<string, unknown>) {
  if (typeof record.in_force === 'boolean') return record.in_force
  if (typeof record.inForce === 'boolean') return record.inForce
  return undefined
}

export function adaptSource(value: unknown): SourceReference | null {
  if (!isRecord(value)) return null
  const source: SourceReference = {
    title: optionalString(value.title),
    documentName: optionalString(value.document_name) ?? optionalString(value.documentName),
    documentNumber: optionalString(value.document_number) ?? optionalString(value.documentNumber),
    article: optionalString(value.article),
    clause: optionalString(value.clause),
    point: optionalString(value.point),
    issuedDate: optionalString(value.issued_date) ?? optionalString(value.issuedDate),
    effectiveDate: optionalString(value.effective_date) ?? optionalString(value.effectiveDate),
    url: optionalString(value.url),
    excerpt: optionalString(value.excerpt),
    inForce: adaptInForce(value),
  }
  const hasText = Boolean(
    source.title || source.documentName || source.documentNumber || source.excerpt || source.article || source.clause || source.point,
  )
  if (!hasText && !source.url) return null
  return source
}

export function adaptSourceList(value: unknown) {
  if (!Array.isArray(value)) return undefined
  const sources = value.map(adaptSource).filter((item): item is SourceReference => item !== null)
  return sources.length ? sources : undefined
}

export function adaptStructured(value: unknown): LegalStructure | undefined {
  if (!isRecord(value)) return undefined
  const structured: LegalStructure = {
    summary: optionalString(value.summary),
    analysis: optionalString(value.analysis),
    legalBases: adaptSourceList(value.legal_bases ?? value.legalBases),
    exceptions: optionalString(value.exceptions),
    conditions: optionalString(value.conditions),
    notes: optionalString(value.notes),
  }
  const hasContent = Boolean(
    structured.summary || structured.analysis || structured.exceptions || structured.conditions || structured.notes || structured.legalBases?.length,
  )
  return hasContent ? structured : undefined
}

function isStatus(value: string): value is MessageStatus {
  return value === 'processing' || value === 'complete' || value === 'empty' || value === 'error' || value === 'timeout' || value === 'cancelled'
}

export function adaptHistoryMessage(value: unknown): ChatMessage | null {
  if (!isRecord(value)) return null
  if (value.role !== 'user' && value.role !== 'assistant') return null
  if (typeof value.content !== 'string') return null
  const createdAt = adaptDate(value.created_at ?? value.createdAt) || new Date().toISOString()
  let status: MessageStatus = value.role === 'user' ? 'complete' : 'complete'
  if (typeof value.status === 'string' && isStatus(value.status)) status = value.status
  if (value.role === 'assistant' && !value.content.trim() && status === 'complete') status = 'empty'
  const message: ChatMessage = {
    id: optionalString(value.id) ?? (typeof value.id === 'number' ? String(value.id) : createId()),
    role: value.role,
    content: value.content,
    createdAt,
    status,
  }
  const sources = adaptSourceList(value.sources)
  const structured = adaptStructured(value.structured)
  if (sources) message.sources = sources
  if (structured) message.structured = structured
  if (value.demo === true) message.demo = true
  if (typeof value.error_message === 'string') message.errorMessage = value.error_message.slice(0, 300)
  else if (typeof value.errorMessage === 'string') message.errorMessage = value.errorMessage.slice(0, 300)
  if (value.feedback === 'helpful' || value.feedback === 'unhelpful') message.feedback = value.feedback
  if (typeof value.feedback_synced === 'boolean') message.feedbackSynced = value.feedback_synced
  else if (typeof value.feedbackSynced === 'boolean') message.feedbackSynced = value.feedbackSynced
  return message
}

export function adaptChatResponse(data: unknown): AdaptedAssistantMessage {
  if (!isRecord(data) || !isRecord(data.message)) {
    throw new ApiError('invalid_response', INVALID_CHAT)
  }
  const content = data.message.content
  if (typeof content !== 'string') throw new ApiError('invalid_response', INVALID_CHAT)
  const role = data.message.role
  if (role !== undefined && role !== 'assistant') throw new ApiError('invalid_response', INVALID_CHAT)
  return {
    id: optionalString(data.message.id) ?? (typeof data.message.id === 'number' ? String(data.message.id) : createId()),
    content,
    sources: adaptSourceList(data.message.sources),
    structured: adaptStructured(data.message.structured),
    demo: data.message.demo === true,
    conversationId: optionalString(data.conversation_id) ?? optionalString(data.conversationId),
  }
}

function conversationRecord(data: unknown) {
  if (!isRecord(data)) return null
  if (isRecord(data.conversation)) return data.conversation
  return data
}

export function adaptConversation(data: unknown): Conversation | null {
  const value = conversationRecord(data)
  if (!value) return null
  const id = optionalString(value.id) ?? (typeof value.id === 'number' ? String(value.id) : '')
  if (!id) return null
  const rawMessages = value.messages
  const messagesLoaded = Array.isArray(rawMessages)
  const messages = messagesLoaded
    ? rawMessages.map((item: unknown) => adaptHistoryMessage(item)).filter((item): item is ChatMessage => item !== null)
    : []
  const createdAt = adaptDate(value.created_at ?? value.createdAt)
  const updatedAt = adaptDate(value.updated_at ?? value.updatedAt) || createdAt
  return {
    id,
    title: optionalString(value.title) ?? 'Cuộc trò chuyện',
    createdAt,
    updatedAt,
    titleEdited: value.title_edited === true || value.titleEdited === true,
    messagesLoaded,
    remoteCreated: true,
    messages,
  }
}

export function adaptConversationPayload(data: unknown) {
  const conversation = adaptConversation(data)
  if (!conversation) throw new ApiError('invalid_response', INVALID_HISTORY)
  return conversation
}

export function adaptConversationList(data: unknown) {
  const rows = Array.isArray(data)
    ? data
    : isRecord(data) && Array.isArray(data.conversations)
      ? data.conversations
      : null
  if (!rows) throw new ApiError('invalid_response', INVALID_HISTORY)
  return rows.map(adaptConversation).filter((item): item is Conversation => item !== null)
}

function requireUser(data: unknown): User {
  if (!isRecord(data)) throw new ApiError('invalid_response', INVALID_AUTH)
  const id = optionalString(data.id) ?? (typeof data.id === 'number' ? String(data.id) : '')
  const email = optionalString(data.email)
  if (!id || !email) throw new ApiError('invalid_response', INVALID_AUTH)
  return {
    id,
    email,
    name: optionalString(data.name) ?? email,
  }
}

export function adaptUserPayload(data: unknown) {
  if (isRecord(data) && isRecord(data.user)) return requireUser(data.user)
  return requireUser(data)
}

export function adaptLoginPayload(data: unknown): AuthSession {
  if (!isRecord(data)) throw new ApiError('invalid_response', INVALID_AUTH)
  const user = adaptUserPayload(isRecord(data.user) ? data.user : data)
  const accessToken = optionalString(data.access_token) ?? optionalString(data.accessToken)
  return { user, accessToken }
}
