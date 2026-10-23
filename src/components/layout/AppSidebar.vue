<script setup lang="ts">
import { PanelLeftClose, PanelLeftOpen, Plus, Search, X } from 'lucide-vue-next'
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import UserAvatar from '@/components/account/UserAvatar.vue'
import ConversationList from '@/components/chat/ConversationList.vue'
import type { ConversationMenuTarget } from '@/components/chat/ConversationList.vue'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import BrandMark from '@/components/common/BrandMark.vue'
import { isApiError } from '@/services/apiError'
import { apiConfig } from '@/config/api'
import { useAuthStore } from '@/stores/authStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useToastStore } from '@/stores/toastStore'
import { useUiStore } from '@/stores/uiStore'

const props = withDefaults(defineProps<{ mobile?: boolean }>(), { mobile: false })
const emit = defineEmits<{ close: [] }>()

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const conversation = useConversationStore()
const toast = useToastStore()
const ui = useUiStore()

const collapsed = computed(() => !props.mobile && ui.sidebarCollapsed)
const dialog = ref<null | { mode: 'rename' | 'delete', id: string, title: string }>(null)
const renameValue = ref('')
const dialogError = ref('')
const dialogBusy = ref(false)

function newChat() {
  emit('close')
  ui.closeMobileNav()
  if (route.path === '/chat') conversation.select(null)
  else void router.push('/chat')
}

function openConversation(id: string) {
  emit('close')
  ui.closeMobileNav()
  void router.push(`/chat/${encodeURIComponent(id)}`)
}

function askRename(target: ConversationMenuTarget) {
  dialog.value = { mode: 'rename', id: target.id, title: target.title }
  renameValue.value = target.title
  dialogError.value = ''
}

function askDelete(target: ConversationMenuTarget) {
  dialog.value = { mode: 'delete', id: target.id, title: target.title }
  dialogError.value = ''
}

async function confirmDialog() {
  if (!dialog.value) return
  dialogBusy.value = true
  dialogError.value = ''
  try {
    if (dialog.value.mode === 'rename') {
      if (!renameValue.value.trim()) {
        dialogError.value = 'Tên hội thoại không được để trống.'
        return
      }
      await conversation.rename(dialog.value.id, renameValue.value)
      toast.success('Đã đổi tên hội thoại.')
    } else {
      const id = dialog.value.id
      await conversation.remove(id)
      if (route.params.conversationId === id) await router.push('/chat')
      toast.success('Đã xóa hội thoại.')
    }
    dialog.value = null
  } catch (error) {
    dialogError.value = isApiError(error) ? error.message : 'Không thực hiện được thao tác.'
  } finally {
    dialogBusy.value = false
  }
}
</script>

<template>
  <aside
    class="h-full min-h-0 flex-col border-r border-line bg-sidebar"
    :class="mobile ? 'flex w-full border-r-0' : ['hidden md:flex', collapsed ? 'w-[4.5rem]' : 'w-72']"
  >
    <div class="flex items-center gap-2.5 px-3 pb-2 pt-4" :class="collapsed ? 'flex-col px-2' : ''">
      <BrandMark :size="collapsed ? 'sm' : 'md'" />
      <div v-if="!collapsed" class="min-w-0 flex-1">
        <p class="nav-title truncate font-semibold tracking-tight">LAW.AI</p>
        <p class="nav-meta truncate text-ink-muted">Chuyên luật lao động</p>
      </div>
      <button
        v-if="mobile"
        type="button"
        class="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-muted"
        aria-label="Đóng danh sách hội thoại"
        @click="emit('close')"
      >
        <X :size="18" aria-hidden="true" />
      </button>
      <button
        v-else
        type="button"
        class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ink-muted hover:bg-muted"
        :aria-label="collapsed ? 'Mở rộng thanh bên' : 'Thu gọn thanh bên'"
        @click="ui.toggleCollapsed()"
      >
        <PanelLeftOpen v-if="collapsed" :size="18" aria-hidden="true" />
        <PanelLeftClose v-else :size="18" aria-hidden="true" />
      </button>
    </div>

    <div class="px-3 pt-1" :class="collapsed ? 'flex justify-center px-2' : ''">
      <AppButton class="!h-9 !text-[13px]" :block="!collapsed" :size="collapsed ? 'icon' : 'sm'" :shape="collapsed ? 'circle' : 'rounded'" aria-label="Cuộc trò chuyện mới" @click="newChat">
        <Plus :size="16" aria-hidden="true" />
        <span v-if="!collapsed">Cuộc trò chuyện mới</span>
      </AppButton>
    </div>

    <div v-if="!collapsed" class="px-3 py-3">
      <label class="search-box">
        <span class="sr-only">Tìm hội thoại</span>
        <Search class="shrink-0 text-ink-muted" :size="16" aria-hidden="true" />
        <input
          :value="conversation.search"
          class="search-input"
          type="search"
          placeholder="Tìm theo tiêu đề hoặc nội dung"
          @input="conversation.setSearch(($event.target as HTMLInputElement).value)"
        />
      </label>
    </div>

    <ConversationList
      v-if="!collapsed"
      :groups="conversation.groupedConversations"
      :active-id="conversation.activeId"
      :loading="conversation.loading"
      :error="conversation.loadError"
      :query="conversation.search"
      @open="openConversation"
      @rename="askRename"
      @remove="askDelete"
      @retry="conversation.reload()"
    />
    <div v-else class="flex-1" />

    <RouterLink
      :to="{ name: 'settings', hash: '#account' }"
      class="mx-3 mb-3 mt-auto flex items-center gap-3 rounded-xl border border-transparent p-2 hover:border-line hover:bg-surface"
      :class="collapsed ? 'justify-center' : ''"
      :aria-label="auth.user ? `Hồ sơ của ${auth.user.name}` : 'Hồ sơ khách'"
      @click="emit('close')"
    >
      <UserAvatar size="sm" />
      <span v-if="!collapsed" class="min-w-0">
        <span class="nav-title block truncate font-medium">{{ auth.user?.name || 'Khách' }}</span>
        <span class="nav-meta block truncate text-ink-muted">{{ auth.user?.email || 'Chưa đăng nhập' }}</span>
      </span>
    </RouterLink>

    <AppModal
      :open="dialog?.mode === 'rename'"
      title="Đổi tên hội thoại"
      description="Tên mới chỉ dùng để nhận biết cuộc trò chuyện."
      @close="dialog = null"
    >
      <label class="block text-sm font-medium" for="rename-conversation">Tên hội thoại</label>
      <input id="rename-conversation" v-model="renameValue" class="field mt-2" maxlength="80" @keydown.enter.prevent="confirmDialog" />
      <p v-if="dialogError" class="mt-2 text-sm text-danger-text" role="alert">{{ dialogError }}</p>
      <template #footer>
        <AppButton variant="secondary" @click="dialog = null">Hủy</AppButton>
        <AppButton :loading="dialogBusy" @click="confirmDialog">Lưu</AppButton>
      </template>
    </AppModal>

    <AppModal
      :open="dialog?.mode === 'delete'"
      title="Xóa cuộc trò chuyện?"
      :description="apiConfig.historyMode === 'api' ? 'Hội thoại sẽ bị xóa trên máy chủ.' : 'Hội thoại sẽ bị xóa khỏi thiết bị này.'"
      @close="dialog = null"
    >
      <p class="text-sm leading-6 text-ink-muted">“{{ dialog?.title }}” sẽ không còn trong danh sách. Thao tác này không hoàn tác.</p>
      <p v-if="dialogError" class="mt-2 text-sm text-danger-text" role="alert">{{ dialogError }}</p>
      <template #footer>
        <AppButton variant="secondary" @click="dialog = null">Hủy</AppButton>
        <AppButton variant="danger" :loading="dialogBusy" @click="confirmDialog">Xóa</AppButton>
      </template>
    </AppModal>
  </aside>
</template>
