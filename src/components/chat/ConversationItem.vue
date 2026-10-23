<script setup lang="ts">
import { MoreHorizontal } from 'lucide-vue-next'
import type { Conversation } from '@/types/chat'

defineProps<{
  conversation: Conversation
  active: boolean
}>()

defineEmits<{
  open: []
  menu: [event: MouseEvent]
}>()
</script>

<template>
  <div class="flex items-center gap-1 rounded-xl pr-1" :class="active ? 'bg-surface soft-shadow ring-1 ring-line' : 'hover:bg-muted'">
    <button
      type="button"
      class="nav-title min-w-0 flex-1 truncate px-3 py-2 text-left"
      :aria-current="active ? 'page' : undefined"
      @click="$emit('open')"
    >
      {{ conversation.title }}
    </button>
    <button
      type="button"
      class="rounded-lg p-1.5 text-ink-muted hover:bg-canvas hover:text-ink"
      aria-label="Mở menu hội thoại"
      aria-haspopup="menu"
      @pointerdown.stop
      @click="$emit('menu', $event)"
    >
      <MoreHorizontal :size="16" aria-hidden="true" />
    </button>
  </div>
</template>
