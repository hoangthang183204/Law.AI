<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import AuthLayout from '@/components/account/AuthLayout.vue'
import GoogleSignInButton from '@/components/account/GoogleSignInButton.vue'
import AppButton from '@/components/common/AppButton.vue'
import { apiConfig } from '@/config/api'
import { useAuthStore } from '@/stores/authStore'
import { useToastStore } from '@/stores/toastStore'
import { safeRedirect } from '@/utils/text'

const auth = useAuthStore()
const toast = useToastStore()
const route = useRoute()
const router = useRouter()
const username = ref('')
const password = ref('')
const remember = ref(false)
const showPassword = ref(false)
const formError = ref('')
const googleBusy = ref(false)
const showRemember = apiConfig.authMode === 'bearer' || apiConfig.useMock

async function submit() {
  formError.value = ''
  if (!username.value.trim() || !password.value) {
    formError.value = 'Hãy nhập email hoặc tên đăng nhập và mật khẩu.'
    return
  }
  const ok = await auth.login({
    username: username.value.trim(),
    password: password.value,
    remember: remember.value,
  })
  if (ok) await router.push(safeRedirect(route.query.redirect))
}

async function signInWithGoogle() {
  formError.value = ''
  googleBusy.value = true
  try {
    const result = await auth.loginWithGoogle(remember.value)
    if (!result) return
    if (result === 'local') {
      toast.info(apiConfig.useMock
        ? 'Đã đăng nhập bằng Google. Phiên demo chỉ lưu trên thiết bị này.'
        : 'Đã đăng nhập bằng Google trên thiết bị này. Máy chủ chưa xác nhận phiên.')
    }
    await router.push(safeRedirect(route.query.redirect))
  } finally {
    googleBusy.value = false
  }
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-2xl font-semibold tracking-tight">Đăng nhập</h1>
    <p class="mt-2 text-sm leading-6 text-ink-muted">Dùng tài khoản Google hoặc tài khoản trên máy chủ của bạn.</p>
    <p v-if="apiConfig.useMock" class="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
      Chế độ demo: mật khẩu không được gửi tới máy chủ và không được lưu.
    </p>
    <p v-if="route.query.reason === 'expired'" class="mt-3 text-sm text-danger-text" role="alert">Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.</p>
    <div class="mt-6">
      <GoogleSignInButton :disabled="auth.loading" :loading="googleBusy" @click="signInWithGoogle" />
    </div>
    <div class="my-5 flex items-center gap-3 text-xs text-ink-muted">
      <span class="h-px flex-1 bg-line" />
      hoặc
      <span class="h-px flex-1 bg-line" />
    </div>
    <form class="space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="login-username">Email hoặc tên đăng nhập</label>
        <input id="login-username" v-model="username" class="field" autocomplete="username" placeholder="Nhập email hoặc tên đăng nhập" required />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="login-password">Mật khẩu</label>
        <div class="relative">
          <input id="login-password" v-model="password" class="field pr-12" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Nhập mật khẩu" required />
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted" :aria-pressed="showPassword" :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="16" aria-hidden="true" />
            <Eye v-else :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
      <label v-if="showRemember" class="flex items-start gap-2 text-sm">
        <input v-model="remember" type="checkbox" class="mt-1" />
        <span>{{ apiConfig.useMock ? 'Ghi nhớ phiên demo trên thiết bị này. Mật khẩu không được lưu.' : 'Ghi nhớ phiên trên thiết bị này. Token được lưu trong trình duyệt, không lưu mật khẩu.' }}</span>
      </label>
      <p v-else class="text-xs leading-5 text-ink-muted">Thời hạn phiên do máy chủ quyết định qua cookie.</p>
      <p v-if="formError || auth.error" class="text-sm text-danger-text" role="alert">{{ formError || auth.error }}</p>
      <AppButton type="submit" block :loading="auth.loading && !googleBusy" :disabled="auth.loading">Đăng nhập</AppButton>
    </form>
    <p class="mt-5 text-sm">
      Chưa có tài khoản?
      <RouterLink class="font-medium text-brand-text" to="/register">Đăng ký</RouterLink>
    </p>
    <RouterLink v-if="!apiConfig.requireAuth" class="mt-2 inline-block text-sm text-ink-muted" to="/chat">Tiếp tục không đăng nhập</RouterLink>
  </AuthLayout>
</template>
