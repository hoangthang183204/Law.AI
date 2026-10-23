<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import ConversationItem from '@/components/chat/ConversationItem.vue'
import type { ConversationGroup } from '@/utils/datetime'

export interface ConversationMenuTarget {
  id: string
  title: string
}

defineProps<{
  groups: ConversationGroup[]
  activeId: string | null
  loading: boolean
  error: string
  query: string
}>()

const emit = defineEmits<{
  open: [id: string]
  rename: [conversation: ConversationMenuTarget]
  remove: [conversation: ConversationMenuTarget]
  retry: []
}>()

const menu = ref<{ id: string, title: string, top: number, left: number } | null>(null)
const menuRoot = ref<HTMLElement | null>(null)

function toggleMenu(conversation: ConversationMenuTarget, event: MouseEvent) {
  if (menu.value?.id === conversation.id) {
    menu.value = null
    return
  }
  const rect = (event.currentTarget as HTMLElement).getBoundingClientRect()
  const width = 176
  const height = 92
  const left = Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8))
  const top = rect.bottom + height > window.innerHeight ? rect.top - height - 4 : rect.bottom + 4
  menu.value = { id: conversation.id, title: conversation.title, top, left }
}

function closeMenu() {
  menu.value = null
}

function onPointerDown(event: PointerEvent) {
  if (!menu.value || menuRoot.value?.contains(event.target as Node)) return
  closeMenu()
}

function onKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') closeMenu()
}

onMounted(() => {
  document.addEventListener('pointerdown', onPointerDown)
  document.addEventListener('keydown', onKeydown)
})

onUnmounted(() => {
  document.removeEventListener('pointerdown', onPointerDown)
  document.removeEventListener('keydown', onKeydown)
})

function choose(kind: 'rename' | 'remove') {
  if (!menu.value) return
  const conversation = { id: menu.value.id, title: menu.value.title }
  closeMenu()
  if (kind === 'rename') emit('rename', conversation)
  else emit('remove', conversation)
}
</script>

<template>
  <div class="min-h-0 flex-1 overflow-y-auto px-2 pb-3" @scroll="closeMenu">
    <div v-if="loading" class="space-y-2 px-1 py-2">
      <div v-for="index in 5" :key="index" class="h-10 rounded-xl bg-muted" />
    </div>
    <div v-else-if="error" class="px-2 py-3 text-sm">
      <p class="text-danger-text">{{ error }}</p>
      <button type="button" class="mt-2 font-medium text-brand-text" @click="emit('retry')">Thử lại</button>
    </div>
    <p v-else-if="!groups.length" class="mx-2 mt-3 rounded-xl border border-dashed border-line px-3 py-4 text-sm leading-6 text-ink-muted">
      {{ query ? 'Không tìm thấy hội thoại phù hợp.' : 'Chưa có cuộc trò chuyện nào.' }}
    </p>
    <template v-else>
      <section v-for="group in groups" :key="group.id" class="mb-2">
        <h2 class="nav-meta px-3 pb-1 pt-3 font-medium uppercase tracking-wide text-ink-muted">{{ group.label }}</h2>
        <ConversationItem
          v-for="conversation in group.items"
          :key="conversation.id"
          :conversation="conversation"
          :active="conversation.id === activeId"
          @open="emit('open', conversation.id)"
          @menu="toggleMenu(conversation, $event)"
        />
      </section>
    </template>
    <Teleport to="body">
      <div
        v-if="menu"
        ref="menuRoot"
        role="menu"
        class="fixed z-50 w-44 rounded-xl border border-line bg-surface p-1 soft-shadow"
        :style="{ top: `${menu.top}px`, left: `${menu.left}px` }"
      >
        <button type="button" role="menuitem" class="menu-action" @click="choose('rename')">Đổi tên</button>
        <button type="button" role="menuitem" class="menu-action text-danger-text" @click="choose('remove')">Xóa hội thoại</button>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.menu-action {
  display: block;
  width: 100%;
  border-radius: 0.65rem;
  padding: 0.5rem 0.7rem;
  text-align: left;
  font-size: 0.875rem;
}
.menu-action:hover {
  background: var(--muted);
}
</style>
