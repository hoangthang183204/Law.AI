import { ref } from 'vue'
import { defineStore } from 'pinia'
import { createId } from '@/utils/id'

export interface ToastItem {
  id: string
  type: 'info' | 'success' | 'error'
  message: string
}

export const useToastStore = defineStore('toast', () => {
  const items = ref<ToastItem[]>([])

  function dismiss(id: string) {
    items.value = items.value.filter((item) => item.id !== id)
  }

  function push(type: ToastItem['type'], message: string) {
    const id = createId()
    items.value = [...items.value, { id, type, message }].slice(-3)
    window.setTimeout(() => dismiss(id), type === 'error' ? 6400 : 4200)
  }

  return {
    items,
    dismiss,
    info: (message: string) => push('info', message),
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
  }
})
