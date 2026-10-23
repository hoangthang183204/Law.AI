<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AppButton from '@/components/common/AppButton.vue'
import AppModal from '@/components/common/AppModal.vue'
import { apiConfig } from '@/config/api'
import { useSpeechSynthesis } from '@/composables/useSpeechSynthesis'
import { isApiError } from '@/services/apiError'
import { useAuthStore } from '@/stores/authStore'
import { useConnectionStore } from '@/stores/connectionStore'
import { useConversationStore } from '@/stores/conversationStore'
import { useSettingsStore } from '@/stores/settingsStore'
import { useThemeStore, type ThemeMode } from '@/stores/themeStore'
import { useToastStore } from '@/stores/toastStore'
import { useUiStore } from '@/stores/uiStore'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const settings = useSettingsStore()
const theme = useThemeStore()
const connection = useConnectionStore()
const conversation = useConversationStore()
const toast = useToastStore()
const ui = useUiStore()
const { supported, voices, stop } = useSpeechSynthesis()

const apiUrl = ref(connection.baseUrl)
const confirmClear = ref(false)
const confirmImport = ref(false)
const themeReady = ref(false)
const busy = ref(false)
const actionError = ref('')

const orderedVoices = computed(() => [...voices.value].sort((a, b) => {
  const av = a.lang.toLowerCase().startsWith('vi') ? 0 : 1
  const bv = b.lang.toLowerCase().startsWith('vi') ? 0 : 1
  return av - bv || a.name.localeCompare(b.name, 'vi')
}))

const themes: Array<{ id: ThemeMode, label: string }> = [
  { id: 'light', label: 'Sáng' },
  { id: 'dark', label: 'Tối' },
  { id: 'system', label: 'Theo hệ thống' },
]

function onSpeechEnabled(checked: boolean) {
  settings.setSpeechEnabled(checked)
  if (!checked) stop()
}

function onAutoRead(checked: boolean) {
  settings.setAutoReadAnswers(checked)
  if (!checked) stop()
}

function scrollToHash() {
  if (!route.hash || !/^#[A-Za-z][\w-]*$/.test(route.hash)) return
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.getElementById(route.hash.slice(1))?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
}

onMounted(() => {
  ui.setPageTitle('Cài đặt')
  void nextTick(() => {
    scrollToHash()
    requestAnimationFrame(() => {
      themeReady.value = true
    })
  })
})

function chooseTheme(id: ThemeMode) {
  if (!themeReady.value) return
  theme.setMode(id)
}

watch(() => route.hash, () => void nextTick(scrollToHash))
watch(() => connection.baseUrl, (value) => {
  apiUrl.value = value
})

function saveUrl() {
  const ok = connection.save(apiUrl.value)
  if (ok) toast.success('Đã cập nhật địa chỉ API. Yêu cầu tiếp theo sẽ dùng địa chỉ này.')
}

async function logout() {
  const confirmed = await auth.logout()
  if (confirmed) toast.success('Đã đăng xuất.')
  else toast.error('Đã xóa phiên trên thiết bị này, nhưng máy chủ chưa xác nhận đăng xuất.')
  await router.push(apiConfig.requireAuth ? '/login' : '/chat')
}

async function clearHistory() {
  busy.value = true
  actionError.value = ''
  try {
    await conversation.clearAll()
    confirmClear.value = false
    toast.success('Đã xóa hội thoại trong phạm vi lưu trữ hiện tại.')
    await router.push('/chat')
  } catch (error) {
    actionError.value = isApiError(error) ? error.message : 'Không xóa được toàn bộ hội thoại.'
  } finally {
    busy.value = false
  }
}

function importGuest() {
  const count = conversation.importGuestHistory()
  confirmImport.value = false
  if (count) toast.success(`Đã chuyển ${count} hội thoại khách vào tài khoản trên thiết bị này.`)
}
</script>

<template>
  <div class="h-full overflow-y-auto">
    <div class="mx-auto flex w-full max-w-3xl flex-col gap-4 px-4 py-6">
      <h2 class="text-2xl font-semibold">Cài đặt</h2>

      <section id="account" class="rounded-2xl border border-line bg-surface p-4">
        <h3 class="font-semibold">Tài khoản</h3>
        <div v-if="auth.user" class="mt-3 text-sm leading-6">
          <p>{{ auth.user.name }}</p>
          <p class="text-ink-muted">{{ auth.user.email }}</p>
          <p class="mt-2 text-ink-muted">Ứng dụng hiển thị hồ sơ do máy chủ trả về. Chưa có API cập nhật hồ sơ nên không có ô sửa tên giả.</p>
          <AppButton class="mt-3" variant="secondary" @click="logout">Đăng xuất</AppButton>
        </div>
        <div v-else class="mt-3 text-sm leading-6 text-ink-muted">
          <p>Bạn đang dùng với tư cách khách. Hội thoại khách được lưu riêng trên thiết bị này.</p>
          <div class="mt-3 flex flex-wrap gap-2">
            <RouterLink class="inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand" to="/login">Đăng nhập</RouterLink>
            <RouterLink class="inline-flex h-10 items-center rounded-xl border border-line px-4 text-sm font-medium" to="/register">Đăng ký</RouterLink>
          </div>
        </div>
      </section>

      <section id="appearance" class="rounded-2xl border border-line bg-surface p-4">
        <h3 class="font-semibold">Giao diện</h3>
        <div class="mt-3 flex flex-wrap gap-3 text-sm">
          <label v-for="item in themes" :key="item.id" class="inline-flex items-center gap-2">
            <input type="radio" name="theme" :value="item.id" :checked="theme.mode === item.id" @change="chooseTheme(item.id)" />
            {{ item.label }}
          </label>
        </div>
      </section>

      <section id="voice" class="rounded-2xl border border-line bg-surface p-4">
        <h3 class="font-semibold">Giọng nói</h3>
        <div v-if="!supported" class="mt-3 text-sm text-ink-muted">Trình duyệt này không hỗ trợ đọc văn bản.</div>
        <div v-else class="mt-3 space-y-4 text-sm">
          <label class="flex items-start gap-2">
            <input :checked="settings.speechEnabled" type="checkbox" class="mt-1" @change="onSpeechEnabled(($event.target as HTMLInputElement).checked)" />
            <span>Hiện nút nghe trên từng câu trả lời.</span>
          </label>
          <label class="flex items-start gap-2">
            <input :checked="settings.autoReadAnswers" type="checkbox" class="mt-1" @change="onAutoRead(($event.target as HTMLInputElement).checked)" />
            <span>Tự đọc câu trả lời khi có kết quả, để nghe mà không cần đọc chữ. Bật xong, câu trả lời vừa xong sẽ được đọc ngay.</span>
          </label>
          <div>
            <label class="mb-1.5 block font-medium" for="voice-select">Giọng đọc</label>
            <select id="voice-select" class="field" :value="settings.speechVoiceURI ?? ''" @change="settings.setSpeechVoiceURI(($event.target as HTMLSelectElement).value || null)">
              <option value="">Tự động, ưu tiên tiếng Việt</option>
              <option v-for="voice in orderedVoices" :key="voice.voiceURI" :value="voice.voiceURI">{{ voice.name }} · {{ voice.lang }}</option>
            </select>
            <p v-if="!orderedVoices.length" class="mt-2 text-ink-muted">Trình duyệt chưa cung cấp danh sách giọng đọc.</p>
          </div>
          <div>
            <label class="mb-1.5 block font-medium" for="voice-rate">Tốc độ đọc: {{ settings.speechRate.toFixed(1) }}×</label>
            <input id="voice-rate" :value="settings.speechRate" type="range" min="0.8" max="1.2" step="0.1" @input="settings.setSpeechRate(Number(($event.target as HTMLInputElement).value))" />
          </div>
        </div>
        <label class="mt-4 flex items-start gap-2 text-sm">
          <input :checked="settings.autoSendVoice" type="checkbox" class="mt-1" @change="settings.setAutoSendVoice(($event.target as HTMLInputElement).checked)" />
          <span>Tự động gửi sau khi trình duyệt kết thúc nhận dạng. Mặc định tắt. Bấm dừng để giữ nội dung và sửa trước khi gửi.</span>
        </label>
      </section>

      <section id="conversations" class="rounded-2xl border border-line bg-surface p-4">
        <h3 class="font-semibold">Hội thoại</h3>
        <p class="mt-2 text-sm leading-6 text-ink-muted">Ứng dụng luôn hỏi xác nhận trước khi xóa. Lịch sử đang dùng chế độ {{ apiConfig.historyMode === 'api' ? 'máy chủ' : 'thiết bị này' }}.</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <AppButton variant="danger" :disabled="!conversation.conversations.length" @click="confirmClear = true">Xóa toàn bộ hội thoại</AppButton>
          <AppButton v-if="conversation.guestImportCount" variant="secondary" @click="confirmImport = true">Chuyển hội thoại khách vào tài khoản này</AppButton>
        </div>
        <p v-if="actionError" class="mt-2 text-sm text-danger-text" role="alert">{{ actionError }}</p>
      </section>

      <section id="connection" class="rounded-2xl border border-line bg-surface p-4">
        <h3 class="font-semibold">Kết nối backend</h3>
        <dl class="mt-3 space-y-1 text-sm text-ink-muted">
          <div>Chế độ demo: {{ apiConfig.useMock ? 'đang bật' : 'đang tắt' }}</div>
          <div>Xác thực: {{ apiConfig.authMode === 'bearer' ? 'Bearer token' : 'cookie' }}</div>
          <div>Bắt buộc đăng nhập: {{ apiConfig.requireAuth ? 'có' : 'không' }}</div>
          <div>Lịch sử: {{ apiConfig.historyMode === 'api' ? 'API' : 'LocalStorage' }}</div>
        </dl>
        <label class="mb-1.5 mt-4 block text-sm font-medium" for="api-url">Địa chỉ API</label>
        <input id="api-url" v-model="apiUrl" class="field" inputmode="url" autocomplete="off" spellcheck="false" />
        <p class="mt-2 text-xs leading-5 text-ink-muted">Trình duyệt sẽ gửi câu hỏi trực tiếp tới địa chỉ này. Không nhập khóa bí mật. Giá trị mặc định từ file .env là {{ connection.defaultBaseUrl }}.</p>
        <p v-if="connection.error" class="mt-2 text-sm text-danger-text" role="alert">{{ connection.error }}</p>
        <div class="mt-3 flex flex-wrap gap-2">
          <AppButton @click="saveUrl">Lưu địa chỉ</AppButton>
          <AppButton v-if="connection.usingOverride" variant="secondary" @click="connection.reset()">Dùng địa chỉ từ .env</AppButton>
        </div>
      </section>
    </div>

    <AppModal :open="confirmClear" title="Xóa toàn bộ hội thoại?" description="Ứng dụng sẽ hỏi lại đúng một lần ở hộp thoại này." @close="confirmClear = false">
      <p class="text-sm leading-6 text-ink-muted">Các cuộc trò chuyện trong phạm vi lưu trữ hiện tại sẽ bị xóa.</p>
      <template #footer>
        <AppButton variant="secondary" @click="confirmClear = false">Hủy</AppButton>
        <AppButton variant="danger" :loading="busy" @click="clearHistory">Xóa</AppButton>
      </template>
    </AppModal>
    <AppModal :open="confirmImport" title="Chuyển hội thoại khách?" description="Bản sao được lưu trong tài khoản trên thiết bị này. Danh sách khách sau đó được xóa khỏi thiết bị." @close="confirmImport = false">
      <template #footer>
        <AppButton variant="secondary" @click="confirmImport = false">Hủy</AppButton>
        <AppButton @click="importGuest">Chuyển</AppButton>
      </template>
    </AppModal>
  </div>
</template>
