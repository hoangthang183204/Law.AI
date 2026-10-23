<script setup lang="ts">
import { Check, Copy, Pause, Play, Square, ThumbsDown, ThumbsUp, Volume2 } from 'lucide-vue-next'
import { computed, onUnmounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import LegalStructure from '@/components/chat/LegalStructure.vue'
import SourceReferences from '@/components/chat/SourceReferences.vue'
import TypingIndicator from '@/components/chat/TypingIndicator.vue'
import BrandMark from '@/components/common/BrandMark.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import { DISCLAIMER } from '@/constants/content'
import { apiConfig } from '@/config/api'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToastStore } from '@/stores/toastStore'
import type { FeedbackRating } from '@/types/chat'
import type { ChatMessage } from '@/types/chat'
import { formatTime } from '@/utils/datetime'
import { assistantCopyText, assistantSpeechText } from '@/utils/messageText'
import { copyText } from '@/utils/text'

const props = defineProps<{ message: ChatMessage }>()

const conversation = useConversationStore()
const settings = useSettingsStore()
const toast = useToastStore()
const { speakingId, status, notice, supported, speak, pause, resume, stop } = useSpeechSynthesis()
const copied = ref(false)
let copyTimer = 0

const failed = computed(() => ['error', 'timeout', 'cancelled', 'empty'].includes(props.message.status))
const tone = computed(() => props.message.status === 'cancelled' || props.message.status === 'empty' ? 'neutral' : 'danger')
const speakingThis = computed(() => speakingId.value === props.message.id && status.value !== 'idle')
const feedbackNote = computed(() => {
  if (!props.message.feedback) return ''
  if (props.message.feedbackSynced) return 'Đã gửi đánh giá lên máy chủ.'
  if (apiConfig.useMock) return 'Đã ghi nhận trên thiết bị này. Chế độ demo không gửi đánh giá lên máy chủ.'
  return 'Đã ghi nhận trên thiết bị này, chưa đồng bộ lên máy chủ.'
})

async function copyMessage() {
  const text = props.message.role === 'user' ? props.message.content : assistantCopyText(props.message)
  const ok = await copyText(text)
  if (!ok) {
    toast.error('Không sao chép được nội dung.')
    return
  }
  copied.value = true
  window.clearTimeout(copyTimer)
  copyTimer = window.setTimeout(() => {
    copied.value = false
  }, 1600)
}

function rate(rating: FeedbackRating) {
  void conversation.rate(props.message.id, rating)
}

function readAloud() {
  const result = speak(props.message.id, assistantSpeechText(props.message))
  if (!result.ok && result.reason === 'unsupported') toast.error('Trình duyệt không hỗ trợ đọc văn bản.')
  if (!result.ok && result.reason === 'empty') toast.info('Không có nội dung phù hợp để đọc.')
}

onUnmounted(() => {
  window.clearTimeout(copyTimer)
  if (speakingId.value === props.message.id) stop()
})
</script>

<template>
  <article v-if="message.role === 'user'" class="flex justify-end">
    <div class="max-w-[min(100%,40rem)]">
      <div class="whitespace-pre-wrap rounded-2xl rounded-br-md bg-brand-soft px-4 py-3 text-sm leading-7">{{ message.content }}</div>
      <div class="mt-1 flex items-center justify-end gap-2">
        <time v-if="formatTime(message.createdAt)" class="text-xs text-ink-muted" :datetime="message.createdAt">{{ formatTime(message.createdAt) }}</time>
        <button type="button" class="action" @click="copyMessage">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          {{ copied ? 'Đã sao chép' : 'Sao chép' }}
        </button>
      </div>
    </div>
  </article>

  <article v-else class="flex gap-3">
    <BrandMark size="sm" />
    <div class="min-w-0 flex-1">
      <div class="rounded-2xl border border-line bg-surface px-4 py-3 soft-shadow">
        <TypingIndicator v-if="message.status === 'processing'" />
        <LegalStructure v-else-if="message.content || message.structured" :message="message" />
        <ErrorMessage
          v-if="failed"
          class="mt-3"
          :message="message.errorMessage || 'Không nhận được phản hồi.'"
          :tone="tone"
          retryable
          @retry="conversation.retry(message.id)"
        />
        <SourceReferences v-if="message.sources?.length" class="mt-4" :sources="message.sources" />
        <p v-else-if="message.status === 'complete'" class="mt-3 text-xs text-ink-muted">
          {{ message.demo ? 'Phản hồi demo không kèm nguồn pháp luật.' : 'Phản hồi này không kèm nguồn tham khảo từ máy chủ.' }}
        </p>
      </div>

      <div v-if="message.status === 'complete'" class="mt-2 flex flex-wrap gap-1">
        <button type="button" class="action" :class="message.feedback === 'helpful' ? 'is-active' : ''" :aria-pressed="message.feedback === 'helpful'" @click="rate('helpful')">
          <ThumbsUp :size="14" aria-hidden="true" /> Hữu ích
        </button>
        <button type="button" class="action" :class="message.feedback === 'unhelpful' ? 'is-active' : ''" :aria-pressed="message.feedback === 'unhelpful'" @click="rate('unhelpful')">
          <ThumbsDown :size="14" aria-hidden="true" /> Chưa hữu ích
        </button>
        <button type="button" class="action" @click="copyMessage">
          <Check v-if="copied" :size="14" aria-hidden="true" />
          <Copy v-else :size="14" aria-hidden="true" />
          {{ copied ? 'Đã sao chép' : 'Sao chép' }}
        </button>
        <button v-if="speakingThis && status === 'speaking'" type="button" class="action" @click="pause">
          <Pause :size="14" aria-hidden="true" /> Tạm dừng
        </button>
        <button v-else-if="speakingThis && status === 'paused'" type="button" class="action" @click="resume">
          <Play :size="14" aria-hidden="true" /> Tiếp tục
        </button>
        <button v-if="speakingThis" type="button" class="action" @click="stop">
          <Square :size="14" aria-hidden="true" /> Dừng
        </button>
        <button v-else-if="supported && settings.speechEnabled" type="button" class="action" @click="readAloud">
          <Volume2 :size="14" aria-hidden="true" /> Nghe
        </button>
        <RouterLink v-else-if="supported" class="action" :to="{ name: 'settings', hash: '#voice' }">Bật nghe câu trả lời</RouterLink>
        <p v-else class="px-2 py-2 text-xs text-ink-muted">Trình duyệt không hỗ trợ đọc văn bản.</p>
      </div>
      <p v-if="feedbackNote" class="mt-1 px-2 text-xs text-ink-muted">{{ feedbackNote }}</p>
      <p v-if="speakingThis && notice" class="mt-1 px-2 text-xs text-ink-muted">{{ notice }}</p>
      <p v-if="message.status !== 'processing'" class="mt-2 text-xs leading-5 text-ink-muted">{{ DISCLAIMER }}</p>
      <time v-if="formatTime(message.createdAt)" class="mt-1 block text-xs text-ink-muted" :datetime="message.createdAt">{{ formatTime(message.createdAt) }}</time>
    </div>
  </article>
</template>

<style scoped>
.action {
  display: inline-flex;
  min-height: 2.25rem;
  align-items: center;
  gap: 0.35rem;
  border-radius: 0.7rem;
  padding: 0.25rem 0.55rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--text-muted);
}
.action:hover,
.action.is-active {
  background: var(--muted);
  color: var(--text);
}
.action.is-active {
  background: var(--accent-soft);
  color: var(--accent);
}
</style>
