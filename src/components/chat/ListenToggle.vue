<script setup lang="ts">
import { Pause, Play, Square, Volume2, VolumeX } from 'lucide-vue-next'
import { watch } from 'vue'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useToastStore } from '@/stores/toastStore'
import { assistantSpeechText } from '@/utils/messageText'

const settings = useSettingsStore()
const conversation = useConversationStore()
const toast = useToastStore()
const { supported, status, notice, speak, pause, resume, stop } = useSpeechSynthesis()

function latestAnswer() {
  const messages = conversation.activeConversation?.messages ?? []
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const message = messages[index]
    if (message?.role === 'assistant' && message.status === 'complete' && message.content.trim()) return message
  }
  return null
}

function readLatest() {
  const message = latestAnswer()
  if (!message) return
  const result = speak(message.id, assistantSpeechText(message))
  if (!result.ok && result.reason === 'unsupported') toast.error('Trình duyệt không hỗ trợ đọc văn bản.')
  if (!result.ok && result.reason === 'empty') toast.info('Không có nội dung phù hợp để nghe.')
}

function toggle() {
  if (!supported) {
    toast.error('Trình duyệt không hỗ trợ đọc văn bản.')
    return
  }
  const next = !settings.autoReadAnswers
  settings.setAutoReadAnswers(next)
  if (!next) {
    stop()
    return
  }
  readLatest()
}

watch(
  () => {
    const last = conversation.activeConversation?.messages.at(-1)
    if (!last || last.role !== 'assistant') return ''
    return `${last.id}:${last.status}`
  },
  (current, previous) => {
    if (!settings.autoReadAnswers || !current.endsWith(':complete')) return
    const id = current.slice(0, current.lastIndexOf(':'))
    if (previous !== `${id}:processing`) return
    readLatest()
  },
)
</script>

<template>
  <div class="flex items-center">
    <button
      type="button"
      class="inline-flex h-10 items-center gap-1.5 rounded-xl px-2.5 text-xs font-medium"
      :class="settings.autoReadAnswers ? 'bg-brand-soft text-brand-text' : 'text-ink-muted hover:bg-muted hover:text-ink'"
      :aria-pressed="settings.autoReadAnswers"
      :aria-label="settings.autoReadAnswers ? 'Tắt nghe câu trả lời' : 'Bật nghe câu trả lời'"
      @click="toggle"
    >
      <VolumeX v-if="!settings.autoReadAnswers" :size="16" aria-hidden="true" />
      <Volume2 v-else :size="16" aria-hidden="true" />
      <span class="hidden sm:inline">{{ settings.autoReadAnswers ? 'Đang nghe' : 'Nghe câu trả lời' }}</span>
    </button>
    <button
      v-if="settings.autoReadAnswers && status === 'speaking'"
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-muted hover:text-ink"
      aria-label="Tạm dừng"
      @click="pause"
    >
      <Pause :size="16" aria-hidden="true" />
    </button>
    <button
      v-else-if="settings.autoReadAnswers && status === 'paused'"
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-muted hover:text-ink"
      aria-label="Tiếp tục nghe"
      @click="resume"
    >
      <Play :size="16" aria-hidden="true" />
    </button>
    <button
      v-if="settings.autoReadAnswers && status !== 'idle'"
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-muted hover:text-ink"
      aria-label="Dừng nghe"
      @click="stop"
    >
      <Square :size="15" aria-hidden="true" />
    </button>
    <span v-if="notice && status !== 'idle'" class="sr-only" role="status">{{ notice }}</span>
  </div>
</template>
