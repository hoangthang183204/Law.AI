import { onMounted, onUnmounted, ref } from 'vue'

interface RecognitionResult {
  isFinal: boolean
  0?: { transcript?: string }
}

interface RecognitionEvent {
  resultIndex: number
  results: ArrayLike<RecognitionResult>
}

interface RecognitionInstance {
  lang: string
  continuous: boolean
  interimResults: boolean
  onstart: (() => void) | null
  onend: (() => void) | null
  onerror: ((event: { error?: string }) => void) | null
  onresult: ((event: RecognitionEvent) => void) | null
  start: () => void
  stop: () => void
  abort: () => void
}

type RecognitionCtor = new () => RecognitionInstance

function getRecognitionCtor() {
  if (typeof window === 'undefined') return null
  const host = window as Window & {
    SpeechRecognition?: RecognitionCtor
    webkitSpeechRecognition?: RecognitionCtor
  }
  return host.SpeechRecognition ?? host.webkitSpeechRecognition ?? null
}

const supported = getRecognitionCtor() !== null
const isListening = ref(false)
const error = ref('')
let recognition: RecognitionInstance | null = null
let intentionalStop = false

function recognitionErrorMessage(code?: string) {
  if (code === 'aborted') return ''
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return 'Trình duyệt đang chặn quyền micro. Hãy cấp quyền micro cho trang này rồi thử lại.'
  }
  if (code === 'audio-capture') return 'Không tìm thấy micro hoặc micro đang được ứng dụng khác sử dụng.'
  if (code === 'no-speech') return 'Không nghe thấy giọng nói. Hãy nói lại rõ hơn.'
  if (code === 'network') return 'Dịch vụ nhận dạng giọng nói của trình duyệt bị gián đoạn.'
  if (code === 'language-not-supported') return 'Trình duyệt không hỗ trợ nhận dạng tiếng Việt.'
  return 'Không nhận dạng được giọng nói. Hãy thử lại hoặc nhập bằng bàn phím.'
}

async function microphoneAllowed() {
  if (!navigator.permissions?.query) return true
  try {
    const status = await navigator.permissions.query({ name: 'microphone' as PermissionName })
    return status.state !== 'denied'
  } catch {
    return true
  }
}

export function useSpeechRecognition() {
  async function start(handlers: {
    getBase: () => string
    onText: (value: string) => void
    onEnd: (result: { failed: boolean, manual: boolean }) => void
  }) {
    error.value = ''
    if (!supported) {
      error.value = 'Trình duyệt này không hỗ trợ nhận dạng giọng nói. Hãy dùng Chrome hoặc Edge, hoặc nhập câu hỏi bằng bàn phím.'
      handlers.onEnd({ failed: true, manual: false })
      return
    }
    if (!(await microphoneAllowed())) {
      error.value = 'Trình duyệt đang chặn quyền micro. Hãy cấp quyền micro cho trang này rồi thử lại.'
      handlers.onEnd({ failed: true, manual: false })
      return
    }
    const Ctor = getRecognitionCtor()
    if (!Ctor) return
    recognition?.abort()
    intentionalStop = false
    const baseText = handlers.getBase().trim()
    let committed = ''
    let failed = false
    const instance = new Ctor()
    recognition = instance
    instance.lang = 'vi-VN'
    instance.continuous = false
    instance.interimResults = true
    instance.onstart = () => {
      isListening.value = true
    }
    instance.onresult = (event) => {
      let interim = ''
      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index]
        const piece = result?.[0]?.transcript ?? ''
        if (result?.isFinal) committed += piece
        else interim += piece
      }
      const spoken = `${committed} ${interim}`.trim()
      handlers.onText([baseText, spoken].filter(Boolean).join(' '))
    }
    instance.onerror = (event) => {
      const message = recognitionErrorMessage(event.error)
      if (message) {
        failed = true
        error.value = message
      }
    }
    instance.onend = () => {
      isListening.value = false
      recognition = null
      const manual = intentionalStop
      intentionalStop = false
      handlers.onEnd({ failed, manual })
    }
    try {
      instance.start()
    } catch {
      isListening.value = false
      recognition = null
      error.value = 'Không bắt đầu được chế độ nghe. Hãy thử lại.'
      handlers.onEnd({ failed: true, manual: false })
    }
  }

  function stop() {
    intentionalStop = true
    recognition?.stop()
  }

  function clearError() {
    error.value = ''
  }

  onUnmounted(() => {
    if (recognition) stop()
  })

  return { supported, isListening, error, start, stop, clearError }
}

export function useCoarsePointer() {
  const coarse = ref(false)
  let media: MediaQueryList | null = null
  const update = () => {
    coarse.value = media?.matches ?? false
  }
  onMounted(() => {
    media = window.matchMedia('(pointer: coarse)')
    update()
    media.addEventListener('change', update)
  })
  onUnmounted(() => media?.removeEventListener('change', update))
  return coarse
}
