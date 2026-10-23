import type { LoginPayload, RegisterPayload, AuthSession } from '@/types/auth'
import type { AdaptedAssistantMessage, ChatRequest } from '@/types/chat'
import { ApiError } from '@/services/apiError'
import { delay } from '@/services/mock/delay'
import { createId } from '@/utils/id'

function demoId(value: string) {
  const slug = value.toLocaleLowerCase('vi').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').slice(0, 40)
  return `demo-${slug || 'user'}`
}

function displayName(identifier: string) {
  if (!identifier.includes('@')) return identifier
  return identifier.split('@')[0] || identifier
}

export async function mockLogin(payload: LoginPayload): Promise<AuthSession> {
  await delay(350)
  const identifier = payload.username.trim()
  if (!identifier || payload.password.length < 8) {
    throw new ApiError('unauthorized', 'Email, tên đăng nhập hoặc mật khẩu chưa đúng.', 401)
  }
  return {
    user: {
      id: demoId(identifier),
      name: displayName(identifier),
      email: identifier,
    },
  }
}

export async function mockRegister(payload: RegisterPayload): Promise<AuthSession> {
  await delay(350)
  return {
    user: {
      id: demoId(payload.email),
      name: payload.name.trim(),
      email: payload.email.trim(),
    },
  }
}

function escapeInline(value: string) {
  return value.replace(/[\\`*_{}[\]()#+\-.!|>]/g, '\\$&').slice(0, 500)
}

export async function mockSendChat(payload: ChatRequest, signal?: AbortSignal): Promise<AdaptedAssistantMessage> {
  await delay(800, signal)
  const question = escapeInline(payload.message.trim())
  return {
    id: createId(),
    demo: true,
    content: [
      'Đây là phản hồi demo để kiểm thử giao diện.',
      '',
      'Chế độ demo không kết nối mô hình pháp luật, không tra cứu văn bản và không tạo căn cứ pháp lý.',
      '',
      `Câu hỏi đã ghi nhận: ${question}`,
      '',
      'Để nhận câu trả lời từ hệ thống của bạn, hãy tắt VITE_USE_MOCK và cấu hình VITE_API_BASE_URL.',
    ].join('\n'),
  }
}
