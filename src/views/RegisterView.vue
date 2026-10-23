<script setup lang="ts">
import { Eye, EyeOff } from 'lucide-vue-next'
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import AuthLayout from '@/components/account/AuthLayout.vue'
import AppButton from '@/components/common/AppButton.vue'
import { apiConfig } from '@/config/api'
import { useAuthStore } from '@/stores/authStore'

const auth = useAuthStore()
const router = useRouter()
const name = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const formError = ref('')
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

async function submit() {
  formError.value = ''
  if (name.value.trim().length < 2) {
    formError.value = 'Hãy nhập họ tên ít nhất 2 ký tự.'
    return
  }
  if (!emailPattern.test(email.value.trim())) {
    formError.value = 'Email chưa đúng định dạng.'
    return
  }
  if (password.value.length < 8) {
    formError.value = 'Mật khẩu cần ít nhất 8 ký tự.'
    return
  }
  if (password.value !== confirmPassword.value) {
    formError.value = 'Mật khẩu xác nhận chưa khớp.'
    return
  }
  const ok = await auth.register({
    name: name.value.trim(),
    email: email.value.trim(),
    password: password.value,
  })
  if (ok) await router.push('/chat')
}
</script>

<template>
  <AuthLayout>
    <h1 class="text-2xl font-semibold">Tạo tài khoản</h1>
    <p class="mt-2 text-sm leading-6 text-ink-muted">Đăng ký được gửi tới backend. Nếu máy chủ không hỗ trợ, ứng dụng sẽ báo rõ.</p>
    <p v-if="apiConfig.useMock" class="mt-3 rounded-xl bg-warning-soft px-3 py-2 text-sm text-warning">
      Chế độ demo tạo phiên cục bộ. Mật khẩu không được lưu.
    </p>
    <form class="mt-6 space-y-4" @submit.prevent="submit">
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="register-name">Họ tên</label>
        <input id="register-name" v-model="name" class="field" autocomplete="name" placeholder="Nguyễn Văn A" required />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="register-email">Email</label>
        <input id="register-email" v-model="email" class="field" type="email" autocomplete="email" placeholder="ten@email.com" required />
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="register-password">Mật khẩu</label>
        <div class="relative">
          <input id="register-password" v-model="password" class="field pr-12" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Ít nhất 8 ký tự" required />
          <button type="button" class="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-2 text-ink-muted" :aria-pressed="showPassword" :aria-label="showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'" @click="showPassword = !showPassword">
            <EyeOff v-if="showPassword" :size="16" aria-hidden="true" />
            <Eye v-else :size="16" aria-hidden="true" />
          </button>
        </div>
      </div>
      <div>
        <label class="mb-1.5 block text-sm font-medium" for="register-confirm">Xác nhận mật khẩu</label>
        <input id="register-confirm" v-model="confirmPassword" class="field" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" placeholder="Nhập lại mật khẩu" required />
      </div>
      <p v-if="formError || auth.error" class="text-sm text-danger-text" role="alert">{{ formError || auth.error }}</p>
      <AppButton type="submit" block :loading="auth.loading">Đăng ký</AppButton>
    </form>
    <p class="mt-4 text-sm">
      Đã có tài khoản?
      <RouterLink class="font-medium text-brand-text" to="/login">Đăng nhập</RouterLink>
    </p>
  </AuthLayout>
</template>
