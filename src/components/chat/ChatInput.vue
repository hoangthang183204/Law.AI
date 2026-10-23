<script setup lang="ts">
import { Send, Square } from 'lucide-vue-next'
import { nextTick, onMounted, ref, watch } from 'vue'
import VoiceInput from '@/components/chat/VoiceInput.vue'
import { useCoarsePointer } from '@/composables/useSpeechRecognition'
import { useSettingsStore } from '@/stores/settingsStore'

const props = defineProps<{
  modelValue: string
  pending: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  submit: []
  stop: []
}>()

const settings = useSettingsStore()
const coarse = useCoarsePointer()
const area = ref<HTMLTextAreaElement | null>(null)
const listening = ref(false)
const voiceError = ref('')
const latest = ref(props.modelValue)

watch(() => props.modelValue, async (value) => {
  latest.value = value
  await nextTick()
  resize()
})

function resize() {
  const element = area.value
  if (!element) return
  element.style.height = 'auto'
  element.style.height = `${Math.min(element.scrollHeight, 200)}px`
}

function onText(value: string) {
  latest.value = value
  emit('update:modelValue', value)
}

function submit() {
  if (props.pending || !props.modelValue.trim()) return
  emit('submit')
}

function onKeydown(event: KeyboardEvent) {
  if (event.key !== 'Enter' || event.shiftKey || event.isComposing || event.keyCode === 229) return
  if (window.matchMedia('(pointer: coarse)').matches) return
  event.preventDefault()
  submit()
}

function onVoiceEnd(result: { failed: boolean, manual: boolean }) {
  if (result.failed || result.manual || !settings.autoSendVoice) return
  if (!latest.value.trim() || props.pending) return
  emit('submit')
}

function focus() {
  area.value?.focus()
}

onMounted(resize)
defineExpose({ focus })
</script>

<template>
  <form class="rounded-2xl border border-line bg-surface p-2 composer-shadow transition focus-within:border-brand" :class="listening ? 'border-brand' : ''" @submit.prevent="submit">
    <label class="sr-only" for="legal-question">Câu hỏi pháp luật</label>
    <textarea
      id="legal-question"
      ref="area"
      :value="modelValue"
      class="max-h-52 min-h-12 w-full resize-none bg-transparent px-2 py-2 text-sm leading-6 outline-none placeholder:text-ink-muted"
      rows="1"
      lang="vi"
      placeholder="Nhập câu hỏi pháp luật hoặc nhấn micro để nói..."
      :readonly="listening"
      @input="onText(($event.target as HTMLTextAreaElement).value)"
      @keydown="onKeydown"
    />
    <div class="flex items-center justify-between gap-2 px-1 pb-1">
      <p class="text-xs text-ink-muted">
        <span v-if="listening">Đang nghe tiếng Việt…</span>
        <span v-else-if="coarse">Dùng nút gửi. Enter để xuống dòng.</span>
        <span v-else>Enter để gửi · Shift + Enter để xuống dòng</span>
      </p>
      <div class="flex items-center gap-2">
        <VoiceInput
          :disabled="pending"
          :text="modelValue"
          @update:text="onText"
          @complete="onVoiceEnd"
          @error="voiceError = $event"
          @listening="listening = $event"
        />
        <button
          v-if="pending"
          type="button"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-on-brand"
          aria-label="Dừng tạo câu trả lời"
          @click="emit('stop')"
        >
          <Square :size="16" aria-hidden="true" />
        </button>
        <button
          v-else
          type="submit"
          class="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-on-brand disabled:cursor-not-allowed disabled:opacity-45"
          :disabled="!modelValue.trim()"
          aria-label="Gửi câu hỏi"
        >
          <Send :size="16" aria-hidden="true" />
        </button>
      </div>
    </div>
    <p v-if="voiceError" class="px-2 pb-1 text-sm text-danger-text" role="alert">{{ voiceError }}</p>
    <p v-if="pending" class="px-2 pb-1 text-xs text-ink-muted">Đang chờ phản hồi. Bạn có thể dừng yêu cầu.</p>
  </form>
</template>
