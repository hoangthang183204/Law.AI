<script setup lang="ts">
import { nextTick, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const route = useRoute()
const panel = ref<HTMLElement | null>(null)
let previousFocus: HTMLElement | null = null

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') ui.closeMobileNav()
}

watch(() => ui.mobileNavOpen, async (open) => {
  if (open) {
    previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null
    ui.lockScroll()
    document.addEventListener('keydown', onKeydown)
    await nextTick()
    panel.value?.querySelector<HTMLElement>('button')?.focus()
    return
  }
  document.removeEventListener('keydown', onKeydown)
  ui.unlockScroll()
  previousFocus?.focus()
  previousFocus = null
})

watch(() => route.fullPath, () => ui.closeMobileNav())

onUnmounted(() => {
  if (!ui.mobileNavOpen) return
  document.removeEventListener('keydown', onKeydown)
  ui.unlockScroll()
})
</script>

<template>
  <div v-if="ui.mobileNavOpen" class="fixed inset-0 z-40 md:hidden">
    <button type="button" class="absolute inset-0 bg-black/45" aria-label="Đóng danh sách hội thoại" @click="ui.closeMobileNav()" />
    <div ref="panel" class="relative h-full w-[min(100%,20.5rem)]">
      <AppSidebar mobile @close="ui.closeMobileNav()" />
    </div>
  </div>
</template>
