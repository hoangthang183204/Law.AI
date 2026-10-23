import { apiConfig } from '@/config/api'
import { adaptConversationList, adaptConversationPayload } from '@/services/adapters'
import { request } from '@/services/apiClient'

function conversationPath(id?: string) {
  if (!id) return apiConfig.paths.conversations
  return `${apiConfig.paths.conversations}/${encodeURIComponent(id)}`
}

export async function listConversations() {
  const data = await request(conversationPath())
  return adaptConversationList(data)
}

export async function getConversation(id: string) {
  const data = await request(conversationPath(id))
  return adaptConversationPayload(data)
}

export async function createConversation(title: string) {
  const data = await request(conversationPath(), {
    method: 'POST',
    data: { title },
  })
  return adaptConversationPayload(data)
}

export async function renameConversation(id: string, title: string) {
  await request(conversationPath(id), {
    method: 'PATCH',
    data: { title },
  })
}

export async function deleteConversation(id: string) {
  await request(conversationPath(id), { method: 'DELETE' })
}
