<script setup lang="ts">
import { X } from 'lucide-vue-next'
import { nextTick, onUnmounted, ref, useId, watch } from 'vue'
import { useUiStore } from '@/stores/uiStore'

const titleId = useId()

const props = defineProps<{
  open: boolean
  title: string
  description?: string
}>()

const emit = defineEmits<{ close: [] }>()
const ui = useUiStore()
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

function focusable() {
  if (!panel.value) return []
  return [...panel.value.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')]
    .filter((node) => !node.hasAttribute('disabled'))
}

function onKeydown(event: KeyboardEvent) {
  if (!props.open) return
  if (event.key === 'Escape') {
    event.preventDefault()
    emit('close')
    return
  }
  if (event.key !== 'Tab') return
  const nodes = focusable()
  if (!nodes.length) return
  const first = nodes[0]
  const last = nodes[nodes.length - 1]
  if (!first || !last) return
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(() => props.open, async (open) => {
  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ui.lockScroll()
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    focusable()[0]?.focus()
    return
  }
  document.removeEventListener('keydown', onKeydown)
  ui.unlockScroll()
  previousFocus?.focus()
  previousFocus = null
})

onUnmounted(() => {
  if (!props.open) return
  document.removeEventListener('keydown', onKeydown)
  ui.unlockScroll()
})
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center">
      <button type="button" class="absolute inset-0 bg-black/45" aria-label="Đóng hộp thoại" @click="emit('close')" />
      <div
        ref="panel"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        class="relative z-10 w-full max-w-md rounded-2xl border border-line bg-surface p-5 soft-shadow"
      >
        <div class="flex items-start justify-between gap-3">
          <div>
            <h2 :id="titleId" class="text-base font-semibold">{{ title }}</h2>
            <p v-if="description" class="mt-1 text-sm text-ink-muted">{{ description }}</p>
          </div>
          <button type="button" class="rounded-lg p-1.5 text-ink-muted hover:bg-muted" aria-label="Đóng" @click="emit('close')">
            <X :size="18" aria-hidden="true" />
          </button>
        </div>
        <div class="mt-4">
          <slot />
        </div>
        <div class="mt-5 flex flex-wrap justify-end gap-2">
          <slot name="footer" />
        </div>
      </div>
    </div>
  </Teleport>
</template>
