import { ref } from 'vue'
import { defineStore } from 'pinia'

const KEY = 'legalai.settings'

function clampRate(value: number) {
  if (!Number.isFinite(value)) return 1
  return Math.min(1.2, Math.max(0.8, Math.round(value * 10) / 10))
}

export const useSettingsStore = defineStore('settings', () => {
  const speechEnabled = ref(true)
  const speechRate = ref(1)
  const speechVoiceURI = ref<string | null>(null)
  const autoSendVoice = ref(false)
  const autoReadAnswers = ref(false)

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify({
        speechEnabled: speechEnabled.value,
        speechRate: speechRate.value,
        speechVoiceURI: speechVoiceURI.value,
        autoSendVoice: autoSendVoice.value,
        autoReadAnswers: autoReadAnswers.value,
      }))
    } catch {
      // Cài đặt vẫn giữ trong bộ nhớ phiên này.
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY)
      if (!raw) return
      const parsed: unknown = JSON.parse(raw)
      if (typeof parsed !== 'object' || parsed === null) return
      const data = parsed as Record<string, unknown>
      if (typeof data.speechEnabled === 'boolean') speechEnabled.value = data.speechEnabled
      if (typeof data.speechRate === 'number') speechRate.value = clampRate(data.speechRate)
      if (typeof data.speechVoiceURI === 'string' || data.speechVoiceURI === null) speechVoiceURI.value = data.speechVoiceURI
      if (typeof data.autoSendVoice === 'boolean') autoSendVoice.value = data.autoSendVoice
      if (typeof data.autoReadAnswers === 'boolean') autoReadAnswers.value = data.autoReadAnswers
    } catch {
      // Bỏ qua dữ liệu cài đặt hỏng.
    }
  }

  load()

  function setSpeechEnabled(value: boolean) {
    speechEnabled.value = value
    if (!value) autoReadAnswers.value = false
    persist()
  }

  function setSpeechRate(value: number) {
    speechRate.value = clampRate(value)
    persist()
  }

  function setSpeechVoiceURI(value: string | null) {
    speechVoiceURI.value = value
    persist()
  }

  function setAutoSendVoice(value: boolean) {
    autoSendVoice.value = value
    persist()
  }

  function setAutoReadAnswers(value: boolean) {
    autoReadAnswers.value = value
    if (value) speechEnabled.value = true
    persist()
  }

  return {
    speechEnabled,
    speechRate,
    speechVoiceURI,
    autoSendVoice,
    autoReadAnswers,
    setSpeechEnabled,
    setSpeechRate,
    setSpeechVoiceURI,
    setAutoSendVoice,
    setAutoReadAnswers,
  }
})
