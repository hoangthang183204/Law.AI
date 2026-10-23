<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue'
import ChatMessage from '@/components/chat/ChatMessage.vue'
import type { ChatMessage as ChatMessageModel } from '@/types/chat'

const props = defineProps<{ messages: ChatMessageModel[] }>()
const scroller = ref<HTMLElement | null>(null)
const stick = ref(true)
const showJump = ref(false)

function distanceFromBottom() {
  const element = scroller.value
  if (!element) return 0
  return element.scrollHeight - element.scrollTop - element.clientHeight
}

function onScroll() {
  const away = distanceFromBottom() > 80
  stick.value = !away
  showJump.value = away
}

function scrollToBottom(behavior: ScrollBehavior) {
  const element = scroller.value
  if (!element) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  element.scrollTo({ top: element.scrollHeight, behavior: reduce ? 'auto' : behavior })
  stick.value = true
  showJump.value = false
}

watch(() => props.messages.length, async () => {
  await nextTick()
  if (stick.value) scrollToBottom('smooth')
  else showJump.value = true
})

watch(() => props.messages.at(-1)?.status, async () => {
  await nextTick()
  if (stick.value) scrollToBottom('auto')
})

onMounted(() => scrollToBottom('auto'))
</script>

<template>
  <div class="relative min-h-0 flex-1">
    <div ref="scroller" class="h-full overflow-y-auto" @scroll="onScroll">
      <ol class="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-6">
        <li v-for="message in messages" :key="message.id">
          <ChatMessage :message="message" />
        </li>
      </ol>
    </div>
    <button
      v-if="showJump"
      type="button"
      class="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full border border-line bg-surface px-3 py-1.5 text-xs font-medium soft-shadow"
      @click="scrollToBottom('smooth')"
    >
      Xuống cuối
    </button>
  </div>
</template>
