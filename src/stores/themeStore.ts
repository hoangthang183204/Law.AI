import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ThemeMode = 'light' | 'dark' | 'system'

const KEY = 'legalai.theme'

function systemDark() {
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

function isThemeMode(value: string | null): value is ThemeMode {
  return value === 'light' || value === 'dark' || value === 'system'
}

export const useThemeStore = defineStore('theme', () => {
  const mode = ref<ThemeMode>('system')
  const isDark = ref(false)
  let listening = false

  function apply(next: ThemeMode) {
    const dark = next === 'dark' || (next !== 'light' && systemDark())
    mode.value = next
    isDark.value = dark
    document.documentElement.classList.toggle('dark', dark)
    document.documentElement.style.colorScheme = dark ? 'dark' : 'light'
    document.documentElement.style.backgroundColor = dark ? '#0f141b' : '#f3f5f8'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#0f141b' : '#f3f5f8')
    try {
      localStorage.setItem(KEY, next)
    } catch {
      // Tùy chọn giao diện vẫn có hiệu lực trong phiên hiện tại.
    }
  }

  function init() {
    let stored: ThemeMode = 'system'
    try {
      const raw = localStorage.getItem(KEY)
      if (isThemeMode(raw)) stored = raw
    } catch {
      stored = 'system'
    }
    apply(stored)
    if (listening) return
    listening = true
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (mode.value === 'system') apply('system')
    })
  }

  function setMode(next: ThemeMode) {
    apply(next)
  }

  function toggle() {
    apply(isDark.value ? 'light' : 'dark')
  }

  return { mode, isDark, init, setMode, toggle }
})
