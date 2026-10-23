import { ref } from 'vue'
import { useSettingsStore } from '@/stores/settingsStore'

const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
const speakingId = ref<string | null>(null)
const status = ref<'idle' | 'speaking' | 'paused'>('idle')
const notice = ref('')
const voices = ref<SpeechSynthesisVoice[]>([])

let generation = 0
let chunks: string[] = []
let chunkIndex = 0
let listened = false

function chunkSpeech(text: string, size = 220) {
  const sentences = text.split(/([.!?;]\s+)/).reduce<string[]>((list, part, index, source) => {
    if (index % 2 === 1) return list
    const sentence = `${part}${source[index + 1] ?? ''}`.trim()
    if (sentence) list.push(sentence)
    return list
  }, [])
  const result: string[] = []
  let current = ''
  for (const sentence of sentences.length ? sentences : [text]) {
    if (sentence.length > size) {
      if (current) result.push(current)
      for (let index = 0; index < sentence.length; index += size) result.push(sentence.slice(index, index + size))
      current = ''
      continue
    }
    const next = current ? `${current} ${sentence}` : sentence
    if (next.length > size && current) {
      result.push(current)
      current = sentence
    } else {
      current = next
    }
  }
  if (current.trim()) result.push(current.trim())
  return result.filter(Boolean)
}

function ensureVoices() {
  if (!supported || listened) return
  listened = true
  const load = () => {
    voices.value = [...window.speechSynthesis.getVoices()]
  }
  load()
  window.speechSynthesis.addEventListener('voiceschanged', load)
}

function selectVoice(preferred: string | null) {
  const list = window.speechSynthesis.getVoices()
  voices.value = list
  if (preferred) {
    const chosen = list.find((voice) => voice.voiceURI === preferred)
    if (chosen) return chosen
  }
  return list.find((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith('vi')) ?? null
}

function resetState() {
  chunks = []
  chunkIndex = 0
  speakingId.value = null
  status.value = 'idle'
}

export function useSpeechSynthesis() {
  ensureVoices()

  function stop() {
    generation += 1
    resetState()
    if (supported) window.speechSynthesis.cancel()
  }

  function utter(token: number, rate: number, voice: SpeechSynthesisVoice | null) {
    if (!supported || token !== generation) return
    const part = chunks[chunkIndex]
    if (!part) {
      resetState()
      return
    }
    const utterance = new SpeechSynthesisUtterance(part)
    utterance.lang = voice?.lang || 'vi-VN'
    utterance.rate = rate
    if (voice) utterance.voice = voice
    utterance.onend = () => {
      if (token !== generation || status.value === 'paused') return
      chunkIndex += 1
      utter(token, rate, voice)
    }
    utterance.onerror = (event) => {
      if (token !== generation) return
      if (event.error === 'interrupted' || event.error === 'canceled') return
      resetState()
      notice.value = 'Không đọc được nội dung này.'
    }
    window.speechSynthesis.speak(utterance)
  }

  function speak(messageId: string, text: string) {
    if (!supported) return { ok: false as const, reason: 'unsupported' as const }
    const settings = useSettingsStore()
    if (!settings.speechEnabled) return { ok: false as const, reason: 'disabled' as const }
    const plain = text.trim()
    if (!plain) return { ok: false as const, reason: 'empty' as const }
    stop()
    const token = generation
    const voice = selectVoice(settings.speechVoiceURI)
    notice.value = !voice || !voice.lang.toLowerCase().startsWith('vi')
      ? 'Thiết bị không có giọng tiếng Việt. Đang dùng giọng đọc mặc định của trình duyệt.'
      : ''
    chunks = chunkSpeech(plain)
    chunkIndex = 0
    speakingId.value = messageId
    status.value = 'speaking'
    window.setTimeout(() => utter(token, settings.speechRate, voice), 40)
    return { ok: true as const, reason: 'started' as const }
  }

  function pause() {
    if (!supported || status.value !== 'speaking') return
    window.speechSynthesis.pause()
    status.value = 'paused'
  }

  function resume() {
    if (!supported || status.value !== 'paused') return
    window.speechSynthesis.resume()
    status.value = 'speaking'
  }

  return { supported, speakingId, status, notice, voices, speak, pause, resume, stop }
}
