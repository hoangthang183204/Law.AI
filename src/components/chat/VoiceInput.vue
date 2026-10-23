<script setup lang="ts">
import { Mic } from 'lucide-vue-next'
import { watch } from 'vue'
import { useSpeechRecognition } from '@/composables/useSpeechRecognition'

const props = defineProps<{ disabled: boolean, text: string }>()
const emit = defineEmits<{
  'update:text': [value: string]
  complete: [result: { failed: boolean, manual: boolean }]
  error: [value: string]
  listening: [value: boolean]
}>()

const { isListening, error, start, stop } = useSpeechRecognition()

watch(error, (value) => emit('error', value))
watch(isListening, (value) => emit('listening', value))
watch(() => props.disabled, (disabled) => {
  if (disabled && isListening.value) stop()
})

async function toggle() {
  if (props.disabled) return
  if (isListening.value) {
    stop()
    return
  }
  await start({
    getBase: () => props.text,
    onText: (value) => emit('update:text', value),
    onEnd: (result) => emit('complete', result),
  })
}
</script>

<template>
  <button
    type="button"
    class="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line text-ink hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
    :class="isListening ? 'border-brand bg-brand-soft text-brand-text' : ''"
    :aria-pressed="isListening"
    :aria-label="isListening ? 'Dừng ghi nhận giọng nói' : 'Nhập câu hỏi bằng giọng nói'"
    :disabled="disabled"
    @click="toggle"
  >
    <span v-if="isListening" class="voice-wave" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
    <Mic v-else :size="18" aria-hidden="true" />
  </button>
</template>
