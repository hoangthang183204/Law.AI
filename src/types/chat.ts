export type MessageRole = 'user' | 'assistant'

export type MessageStatus = 'processing' | 'complete' | 'empty' | 'error' | 'timeout' | 'cancelled'

export type FeedbackRating = 'helpful' | 'unhelpful'

export interface SourceReference {
  title?: string
  documentName?: string
  documentNumber?: string
  article?: string
  clause?: string
  point?: string
  issuedDate?: string
  effectiveDate?: string
  url?: string
  excerpt?: string
  inForce?: boolean
}

export interface LegalStructure {
  summary?: string
  analysis?: string
  legalBases?: SourceReference[]
  exceptions?: string
  conditions?: string
  notes?: string
}

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: string
  status: MessageStatus
  sources?: SourceReference[]
  structured?: LegalStructure
  errorMessage?: string
  demo?: boolean
  feedback?: FeedbackRating
  feedbackSynced?: boolean
}

export interface Conversation {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  titleEdited: boolean
  messagesLoaded: boolean
  remoteCreated: boolean
  messages: ChatMessage[]
}

export interface ChatRequest {
  conversation_id: string
  message: string
}

export interface AdaptedAssistantMessage {
  id: string
  content: string
  sources?: SourceReference[]
  structured?: LegalStructure
  demo?: boolean
  conversationId?: string
}

export interface FeedbackRequest {
  conversation_id: string
  message_id: string
  rating: FeedbackRating
}
