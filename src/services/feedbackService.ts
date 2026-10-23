import type { FeedbackRequest } from '@/types/chat'
import { apiConfig } from '@/config/api'
import { request } from '@/services/apiClient'

export async function sendFeedback(payload: FeedbackRequest) {
  await request(apiConfig.paths.feedback, {
    method: 'POST',
    data: payload,
  })
}
