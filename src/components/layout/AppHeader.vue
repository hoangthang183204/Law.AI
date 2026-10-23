<script setup lang="ts">
import { Menu, Settings } from 'lucide-vue-next'
import { watch } from 'vue'
import { useRoute } from 'vue-router'
import UserMenu from '@/components/account/UserMenu.vue'
import ListenToggle from '@/components/chat/ListenToggle.vue'
import ThemeToggle from '@/components/common/ThemeToggle.vue'
import { useConversationStore } from '@/stores/conversationStore'
import { useUiStore } from '@/stores/uiStore'

const ui = useUiStore()
const conversation = useConversationStore()
const route = useRoute()

watch(() => ui.pageTitle, (title) => {
  document.title = !title || title === 'Cuộc trò chuyện mới'
    ? 'LAW.AI — Trợ lý luật lao động'
    : `${title} · LAW.AI`
}, { immediate: true })
</script>

<template>
  <header class="flex h-14 shrink-0 items-center gap-1 border-b border-line bg-surface px-2 sm:px-3">
    <button
      type="button"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink hover:bg-muted md:hidden"
      aria-label="Mở danh sách hội thoại"
      @click="ui.openMobileNav()"
    >
      <Menu :size="18" aria-hidden="true" />
    </button>
    <h1 class="min-w-0 flex-1 truncate px-1 text-sm font-semibold">{{ ui.pageTitle }}</h1>
    <span v-if="conversation.pending && route.name === 'chat'" class="hidden text-xs text-ink-muted sm:inline">Đang xử lý</span>
    <ListenToggle v-if="route.name === 'chat'" />
    <ThemeToggle />
    <RouterLink
      :to="{ name: 'settings' }"
      class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-muted hover:text-ink"
      aria-label="Cài đặt"
    >
      <Settings :size="18" aria-hidden="true" />
    </RouterLink>
    <UserMenu />
  </header>
</template>
