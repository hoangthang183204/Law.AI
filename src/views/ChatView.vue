<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ChatInput from '@/components/chat/ChatInput.vue'
import ChatTranscript from '@/components/chat/ChatTranscript.vue'
import ChatWelcome from '@/components/chat/ChatWelcome.vue'
import AppButton from '@/components/common/AppButton.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import LoadingState from '@/components/common/LoadingState.vue'
import { DISCLAIMER } from '@/constants/content'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useConversationStore } from '@/stores/conversationStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const conversation = useConversationStore()
const ui = useUiStore()
const { stop } = useSpeechSynthesis()
const composer = ref<{ focus: () => void } | null>(null)
const suggestionNote = ref('')

const routeId = computed(() => {
  const value = route.params.conversationId
  return typeof value === 'string' && value ? value : null
})

const missing = computed(() => Boolean(routeId.value && conversation.ready && !conversation.loading && !conversation.byId(routeId.value)))
const hydrating = computed(() => routeId.value ? conversation.isHydrating(routeId.value) : false)
const hydrateError = computed(() => routeId.value ? conversation.hydrateError(routeId.value) : '')
const showWelcome = computed(() => !conversation.activeConversation || conversation.activeConversation.messages.length === 0)

watch(routeId, (id) => {
  if (route.name !== 'chat') return
  if (conversation.activeId !== id) conversation.select(id)
}, { immediate: true })

watch(() => conversation.loadedOwner, () => {
  if (route.name !== 'chat' || !conversation.ready) return
  if (conversation.activeId !== routeId.value) conversation.select(routeId.value)
})

watch(() => conversation.activeId, (id) => {
  if (route.name !== 'chat') return
  stop()
  if (routeId.value === id) return
  void router.replace(id ? `/chat/${encodeURIComponent(id)}` : '/chat')
})

watch([() => conversation.activeConversation?.title, missing], () => {
  if (route.name !== 'chat') return
  ui.setPageTitle(missing.value ? 'Không tìm thấy hội thoại' : conversation.activeConversation?.title || 'Cuộc trò chuyện mới')
}, { immediate: true })

function applySuggestion(prompt: string) {
  conversation.setDraft(prompt)
  suggestionNote.value = 'Đã đưa câu hỏi gợi ý vào ô nhập. Bạn có thể sửa trước khi gửi.'
  void nextTick(() => composer.value?.focus())
}

function submit() {
  suggestionNote.value = ''
  void conversation.sendMessage()
}
</script>

<template>
  <div class="flex h-full min-h-0 flex-col">
    <div class="sr-only" aria-live="polite">{{ conversation.liveStatus }}</div>
    <div v-if="missing" class="grid flex-1 place-items-center px-4 text-center">
      <div>
        <h2 class="text-lg font-semibold">Không tìm thấy hội thoại</h2>
        <p class="mt-2 text-sm text-ink-muted">Hội thoại này không thuộc dữ liệu đang mở trên thiết bị này.</p>
        <AppButton class="mt-4" @click="router.push('/chat')">Tạo cuộc trò chuyện mới</AppButton>
      </div>
    </div>
    <LoadingState v-else-if="!conversation.ready || hydrating" class="flex-1" label="Đang tải hội thoại..." />
    <div v-else-if="hydrateError" class="grid flex-1 place-items-center px-4">
      <div class="w-full max-w-md">
        <ErrorMessage :message="hydrateError" retryable @retry="routeId && conversation.hydrate(routeId)" />
      </div>
    </div>
    <template v-else>
      <ChatWelcome v-if="showWelcome" @select="applySuggestion" />
      <ChatTranscript v-else :messages="conversation.activeConversation?.messages ?? []" />
      <div class="mx-auto w-full max-w-3xl shrink-0 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <p v-if="suggestionNote" class="mb-2 text-sm text-ink-muted" aria-live="polite">{{ suggestionNote }}</p>
        <ChatInput
          ref="composer"
          :model-value="conversation.draft"
          :pending="conversation.pending"
          @update:model-value="conversation.setDraft"
          @submit="submit"
          @stop="conversation.stop()"
        />
        <p class="px-2 py-2 text-center text-xs leading-5 text-ink-muted">{{ DISCLAIMER }}</p>
      </div>
    </template>
  </div>
</template>
