import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiConfig, apiBaseUrlOverrideActive, getApiBaseUrl, setApiBaseUrlOverride } from '@/config/api'

export const useConnectionStore = defineStore('connection', () => {
  const baseUrl = ref(getApiBaseUrl())
  const error = ref('')
  const usingOverride = ref(apiBaseUrlOverrideActive())

  function refresh() {
    baseUrl.value = getApiBaseUrl()
    usingOverride.value = apiBaseUrlOverrideActive()
  }

  function save(value: string) {
    const trimmed = value.trim()
    if (!trimmed) {
      setApiBaseUrlOverride(null)
      error.value = ''
      refresh()
      return true
    }
    const saved = setApiBaseUrlOverride(trimmed)
    if (!saved) {
      error.value = 'Địa chỉ cần bắt đầu bằng http:// hoặc https:// và không chứa thông tin đăng nhập.'
      return false
    }
    error.value = ''
    refresh()
    return true
  }

  function reset() {
    setApiBaseUrlOverride(null)
    error.value = ''
    refresh()
  }

  const defaultBaseUrl = computed(() => apiConfig.defaultBaseUrl)

  return { baseUrl, error, usingOverride, defaultBaseUrl, save, reset }
})
