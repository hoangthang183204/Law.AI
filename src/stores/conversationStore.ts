import { computed, ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { ChatMessage, Conversation, FeedbackRating } from '@/types/chat'
import { apiConfig } from '@/config/api'
import { ApiError, isApiError } from '@/services/apiError'
import { sendChat } from '@/services/chatService'
import {
  createConversation,
  deleteConversation,
  getConversation,
  listConversations,
  renameConversation,
} from '@/services/conversationService'
import { sendFeedback } from '@/services/feedbackService'
import { readHistory, writeHistory } from '@/services/localHistory'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { groupConversations } from '@/utils/datetime'
import { createId, ownerStorageId } from '@/utils/id'
import { fold, titleFromMessage } from '@/utils/text'

const NEW_DRAFT = '__new__'

function draftKey(id: string | null) {
  return id ?? NEW_DRAFT
}

function blankConversation(): Conversation {
  const now = new Date().toISOString()
  return {
    id: createId(),
    title: 'Cuộc trò chuyện mới',
    createdAt: now,
    updatedAt: now,
    titleEdited: false,
    messagesLoaded: true,
    remoteCreated: false,
    messages: [],
  }
}

export const useConversationStore = defineStore('conversation', () => {
  const auth = useAuthStore()
  const ownerId = computed(() => ownerStorageId(auth.user?.id ?? null))
  const conversations = ref<Conversation[]>([])
  const activeId = ref<string | null>(null)
  const drafts = ref<Record<string, string>>({})
  const search = ref('')
  const pending = ref(false)
  const loading = ref(false)
  const ready = ref(false)
  const loadError = ref('')
  const loadedOwner = ref('')
  const liveStatus = ref('')
  const historyVersion = ref(0)
  const hydratingIds = ref<Record<string, boolean>>({})
  const hydrateErrors = ref<Record<string, string>>({})
  let abortController: AbortController | null = null
  let inflight: { owner: string, task: Promise<void> } | null = null
  let quotaNotified = false

  const activeConversation = computed(() => conversations.value.find((item) => item.id === activeId.value) ?? null)
  const draft = computed(() => drafts.value[draftKey(activeId.value)] ?? '')
  const filteredConversations = computed(() => {
    const query = fold(search.value.trim())
    const sorted = [...conversations.value].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || ''))
    if (!query) return sorted
    return sorted.filter((conversation) => {
      if (fold(conversation.title).includes(query)) return true
      return conversation.messages.some((message) => fold(message.content).includes(query))
    })
  })
  const groupedConversations = computed(() => groupConversations(filteredConversations.value))
  const guestImportCount = computed(() => {
    historyVersion.value
    if (apiConfig.historyMode !== 'local' || ownerId.value === 'guest') return 0
    return readHistory('guest').length
  })

  function persist(owner: string) {
    if (apiConfig.historyMode !== 'local') return
    if (ownerId.value !== owner || !ready.value) return
    try {
      writeHistory(owner, conversations.value)
    } catch {
      if (!quotaNotified) {
        quotaNotified = true
        useToastStore().error('Không thể lưu thêm lịch sử vì bộ nhớ trình duyệt đã đầy.')
      }
    }
  }

  function findMessage(messageId: string) {
    for (const conversation of conversations.value) {
      const message = conversation.messages.find((item) => item.id === messageId)
      if (message) return { conversation, message }
    }
    return null
  }

  function byId(id: string) {
    return conversations.value.find((item) => item.id === id) ?? null
  }

  function setDraft(value: string) {
    drafts.value[draftKey(activeId.value)] = value
  }

  function setSearch(value: string) {
    search.value = value
  }

  function adoptId(conversation: Conversation, nextId?: string) {
    if (!nextId || nextId === conversation.id) return
    const previousId = conversation.id
    conversation.id = nextId
    if (activeId.value === previousId) activeId.value = nextId
    const existing = drafts.value[previousId]
    if (existing) {
      drafts.value[nextId] = existing
      delete drafts.value[previousId]
    }
  }

  async function ensureRemote(conversation: Conversation) {
    if (apiConfig.historyMode !== 'api' || conversation.remoteCreated) return
    const created = await createConversation(conversation.title)
    conversation.remoteCreated = true
    adoptId(conversation, created.id)
  }

  async function resolveAssistant(conversation: Conversation, assistant: ChatMessage, content: string, ownerAtStart: string) {
    pending.value = true
    liveStatus.value = 'Đã gửi câu hỏi. Đang chờ máy chủ xử lý.'
    const controller = new AbortController()
    abortController = controller
    let ok = false
    try {
      await ensureRemote(conversation)
      const result = await sendChat({ conversation_id: conversation.id, message: content }, controller.signal)
      if (ownerId.value !== ownerAtStart) return false
      adoptId(conversation, result.conversationId)
      if (result.id && !conversation.messages.some((item) => item !== assistant && item.id === result.id)) {
        assistant.id = result.id
      }
      assistant.content = result.content
      assistant.sources = result.sources
      assistant.structured = result.structured
      assistant.demo = result.demo === true ? true : undefined
      assistant.createdAt = new Date().toISOString()
      if (result.content.trim()) {
        assistant.status = 'complete'
        assistant.errorMessage = undefined
        liveStatus.value = 'Đã có phản hồi.'
        ok = true
      } else {
        assistant.status = 'empty'
        assistant.errorMessage = 'Máy chủ trả về nội dung trống.'
        liveStatus.value = 'Máy chủ trả về nội dung trống.'
      }
      conversation.updatedAt = assistant.createdAt
      return ok
    } catch (error) {
      if (ownerId.value !== ownerAtStart) return false
      const apiError = isApiError(error) ? error : new ApiError('network', 'Đã xảy ra lỗi không xác định.')
      assistant.createdAt = new Date().toISOString()
      if (apiError.code === 'cancelled') {
        assistant.status = 'cancelled'
        assistant.errorMessage = 'Bạn đã dừng yêu cầu.'
      } else if (apiError.code === 'timeout') {
        assistant.status = 'timeout'
        assistant.errorMessage = apiError.message
      } else {
        assistant.status = 'error'
        assistant.errorMessage = apiError.message
      }
      liveStatus.value = assistant.errorMessage ?? 'Không nhận được phản hồi.'
      conversation.updatedAt = assistant.createdAt
      return false
    } finally {
      pending.value = false
      if (abortController === controller) abortController = null
      persist(ownerAtStart)
    }
  }

  async function sendMessage() {
    const content = draft.value.trim()
    if (!content || pending.value || loading.value) return { ok: false, conversationId: activeId.value }
    const ownerAtStart = ownerId.value
    drafts.value[draftKey(activeId.value)] = ''
    let conversation = activeConversation.value
    if (!conversation) {
      const created = blankConversation()
      conversations.value.unshift(created)
      activeId.value = created.id
      conversation = conversations.value.find((item) => item.id === created.id) ?? created
    }
    if (!conversation.titleEdited) conversation.title = titleFromMessage(content)
    const now = new Date().toISOString()
    conversation.messages.push({
      id: createId(),
      role: 'user',
      content,
      createdAt: now,
      status: 'complete',
    })
    conversation.messages.push({
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: now,
      status: 'processing',
    })
    const assistant = conversation.messages.at(-1)
    if (!assistant) return { ok: false, conversationId: conversation.id }
    conversation.messagesLoaded = true
    conversation.updatedAt = now
    persist(ownerAtStart)
    const ok = await resolveAssistant(conversation, assistant, content, ownerAtStart)
    if (!ok && ownerId.value === ownerAtStart && !(drafts.value[conversation.id] ?? '').trim()) {
      drafts.value[conversation.id] = content
    }
    return { ok, conversationId: conversation.id }
  }

  async function retry(messageId: string) {
    if (pending.value) return
    const located = findMessage(messageId)
    if (!located || located.message.role !== 'assistant') return
    const index = located.conversation.messages.findIndex((item) => item.id === messageId)
    let content = ''
    for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
      const candidate = located.conversation.messages[cursor]
      if (candidate?.role === 'user') {
        content = candidate.content
        break
      }
    }
    if (!content.trim()) return
    const assistant = located.message
    assistant.status = 'processing'
    assistant.content = ''
    assistant.errorMessage = undefined
    assistant.sources = undefined
    assistant.structured = undefined
    assistant.demo = undefined
    assistant.feedback = undefined
    assistant.feedbackSynced = undefined
    await resolveAssistant(located.conversation, assistant, content, ownerId.value)
  }

  function stop() {
    abortController?.abort()
  }

  async function rate(messageId: string, rating: FeedbackRating) {
    const located = findMessage(messageId)
    if (!located || located.message.role !== 'assistant' || located.message.status !== 'complete') return
    located.message.feedback = rating
    located.message.feedbackSynced = false
    persist(ownerId.value)
    if (apiConfig.useMock) return
    try {
      await sendFeedback({
        conversation_id: located.conversation.id,
        message_id: located.message.id,
        rating,
      })
      located.message.feedbackSynced = true
      persist(ownerId.value)
    } catch {
      located.message.feedbackSynced = false
    }
  }

  function select(id: string | null) {
    activeId.value = id
    if (id) void hydrate(id)
  }

  async function hydrate(id: string) {
    if (apiConfig.historyMode !== 'api') return
    const current = byId(id)
    if (!current || current.messagesLoaded || hydratingIds.value[id]) return
    hydratingIds.value[id] = true
    delete hydrateErrors.value[id]
    try {
      const full = await getConversation(id)
      const index = conversations.value.findIndex((item) => item.id === id)
      if (index === -1) return
      const existing = conversations.value[index]
      if (!existing) return
      conversations.value[index] = {
        ...full,
        title: existing.titleEdited ? existing.title : full.title || existing.title,
        titleEdited: existing.titleEdited,
        remoteCreated: true,
        messagesLoaded: true,
      }
    } catch (error) {
      hydrateErrors.value[id] = isApiError(error) ? error.message : 'Không tải được hội thoại.'
    } finally {
      delete hydratingIds.value[id]
    }
  }

  async function doReload(owner: string) {
    if (pending.value && ready.value && loadedOwner.value === owner) return
    loading.value = true
    loadError.value = ''
    try {
      const rows = apiConfig.historyMode === 'api' ? await listConversations() : readHistory(owner)
      if (ownerId.value !== owner) return
      conversations.value = rows
      loadedOwner.value = owner
      ready.value = true
    } catch (error) {
      if (ownerId.value !== owner) return
      conversations.value = []
      loadedOwner.value = owner
      ready.value = true
      loadError.value = isApiError(error) ? error.message : 'Không tải được lịch sử hội thoại.'
    } finally {
      if (ownerId.value === owner) loading.value = false
    }
  }

  function reload() {
    const owner = ownerId.value
    if (inflight?.owner === owner) return inflight.task
    const task = doReload(owner).finally(() => {
      if (inflight?.task === task) inflight = null
    })
    inflight = { owner, task }
    return task
  }

  async function ensureLoaded() {
    if (ready.value && loadedOwner.value === ownerId.value) return
    await reload()
    if (loadedOwner.value !== ownerId.value) await reload()
  }

  async function rename(id: string, title: string) {
    const conversation = byId(id)
    const next = title.trim().slice(0, 80)
    if (!conversation || !next) throw new ApiError('bad_request', 'Tên hội thoại không được để trống.', 400)
    const previous = conversation.title
    conversation.title = next
    conversation.titleEdited = true
    conversation.updatedAt = new Date().toISOString()
    persist(ownerId.value)
    if (apiConfig.historyMode !== 'api') return
    try {
      await renameConversation(id, next)
    } catch (error) {
      conversation.title = previous
      persist(ownerId.value)
      throw error
    }
  }

  async function remove(id: string) {
    if (apiConfig.historyMode === 'api') {
      try {
        await deleteConversation(id)
      } catch (error) {
        if (!(isApiError(error) && error.status === 404)) throw error
      }
    }
    conversations.value = conversations.value.filter((item) => item.id !== id)
    if (activeId.value === id) activeId.value = null
    delete drafts.value[id]
    persist(ownerId.value)
  }

  async function clearAll() {
    if (apiConfig.historyMode === 'api') {
      const ids = conversations.value.map((item) => item.id)
      for (const id of ids) {
        try {
          await deleteConversation(id)
        } catch (error) {
          if (!(isApiError(error) && error.status === 404)) throw error
        }
        conversations.value = conversations.value.filter((item) => item.id !== id)
        if (activeId.value === id) activeId.value = null
      }
      return
    }
    conversations.value = []
    activeId.value = null
    drafts.value = {}
    persist(ownerId.value)
    historyVersion.value += 1
  }

  function importGuestHistory() {
    if (apiConfig.historyMode !== 'local' || ownerId.value === 'guest') return 0
    const guestItems = readHistory('guest')
    if (!guestItems.length) return 0
    const seen = new Set(conversations.value.map((item) => item.id))
    for (const item of guestItems) {
      const id = seen.has(item.id) ? createId() : item.id
      seen.add(id)
      conversations.value.push({
        ...item,
        id,
        messages: item.messages.map((message) => ({ ...message })),
      })
    }
    writeHistory('guest', [])
    persist(ownerId.value)
    historyVersion.value += 1
    return guestItems.length
  }

  function isHydrating(id: string) {
    return Boolean(hydratingIds.value[id])
  }

  function hydrateError(id: string) {
    return hydrateErrors.value[id] ?? ''
  }

  watch(ownerId, (next, previous) => {
    if (previous === undefined || next === previous) return
    ready.value = false
    abortController?.abort()
    activeId.value = null
    conversations.value = []
    loadError.value = ''
    void reload()
  })

  return {
    conversations,
    activeId,
    activeConversation,
    draft,
    search,
    pending,
    loading,
    ready,
    loadError,
    loadedOwner,
    liveStatus,
    groupedConversations,
    guestImportCount,
    setDraft,
    setSearch,
    sendMessage,
    retry,
    stop,
    rate,
    select,
    hydrate,
    ensureLoaded,
    reload,
    rename,
    remove,
    clearAll,
    importGuestHistory,
    isHydrating,
    hydrateError,
    byId,
  }
})
