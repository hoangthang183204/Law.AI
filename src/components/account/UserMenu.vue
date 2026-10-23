<script setup lang="ts">
import { LogOut, Settings, UserRound } from 'lucide-vue-next'
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import UserAvatar from '@/components/account/UserAvatar.vue'
import { apiConfig } from '@/config/api'
import { useDismissable } from '@/composables/useDismissable'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'

const auth = useAuthStore()
const toast = useToastStore()
const router = useRouter()
const open = ref(false)
const root = ref<HTMLElement | null>(null)
useDismissable(open, root)

function close() {
  open.value = false
}

async function logout() {
  close()
  const confirmed = await auth.logout()
  if (confirmed) toast.success('Đã đăng xuất.')
  else toast.error('Đã xóa phiên trên thiết bị này, nhưng máy chủ chưa xác nhận đăng xuất.')
  await router.push(apiConfig.requireAuth ? '/login' : '/chat')
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      type="button"
      class="rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
      :aria-expanded="open"
      aria-haspopup="menu"
      aria-label="Menu tài khoản"
      @click="open = !open"
    >
      <UserAvatar />
    </button>
    <div v-if="open" role="menu" class="absolute right-0 z-30 mt-2 w-64 rounded-2xl border border-line bg-surface p-2 soft-shadow">
      <div class="border-b border-line px-2 py-2">
        <p class="truncate text-sm font-semibold">{{ auth.user?.name || 'Khách' }}</p>
        <p class="truncate text-xs text-ink-muted">{{ auth.user?.email || 'Chưa đăng nhập' }}</p>
      </div>
      <div class="mt-1 space-y-1">
        <RouterLink v-if="!auth.user" class="menu-link" to="/login" role="menuitem" @click="close">Đăng nhập</RouterLink>
        <RouterLink v-if="!auth.user" class="menu-link" to="/register" role="menuitem" @click="close">Tạo tài khoản</RouterLink>
        <RouterLink class="menu-link" :to="{ name: 'settings', hash: '#account' }" role="menuitem" @click="close">
          <UserRound :size="16" aria-hidden="true" /> Hồ sơ
        </RouterLink>
        <RouterLink class="menu-link" :to="{ name: 'settings' }" role="menuitem" @click="close">
          <Settings :size="16" aria-hidden="true" /> Cài đặt
        </RouterLink>
        <button v-if="auth.user" type="button" class="menu-link w-full text-danger-text" role="menuitem" @click="logout">
          <LogOut :size="16" aria-hidden="true" /> Đăng xuất
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.menu-link {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border-radius: 0.75rem;
  padding: 0.55rem 0.65rem;
  font-size: 0.875rem;
  text-align: left;
}
.menu-link:hover {
  background: var(--muted);
}
</style>
