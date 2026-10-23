import { apiConfig } from '@/config/api'
import { adaptChatResponse } from '@/services/adapters'
import { request } from '@/services/apiClient'
import { mockSendChat } from '@/services/mock/mockBackend'
import type { ChatRequest } from '@/types/chat'

export async function sendChat(payload: ChatRequest, signal?: AbortSignal) {
  if (apiConfig.useMock) return mockSendChat(payload, signal)
  const data = await request(apiConfig.paths.chat, {
    method: 'POST',
    data: {
      conversation_id: payload.conversation_id,
      message: payload.message,
    },
    signal,
  })
  return adaptChatResponse(data)
}
