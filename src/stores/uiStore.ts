import { ref } from 'vue'
import { defineStore } from 'pinia'

const COLLAPSE_KEY = 'legalai.sidebar.collapsed'

export const useUiStore = defineStore('ui', () => {
  const mobileNavOpen = ref(false)
  const sidebarCollapsed = ref(false)
  const pageTitle = ref('Cuộc trò chuyện mới')
  const scrollLocks = ref(0)

  try {
    sidebarCollapsed.value = localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    sidebarCollapsed.value = false
  }

  function setPageTitle(title: string) {
    pageTitle.value = title
  }

  function toggleCollapsed() {
    sidebarCollapsed.value = !sidebarCollapsed.value
    try {
      localStorage.setItem(COLLAPSE_KEY, sidebarCollapsed.value ? '1' : '0')
    } catch {
      // Trạng thái thu gọn vẫn có hiệu lực đến khi tải lại trang.
    }
  }

  function openMobileNav() {
    mobileNavOpen.value = true
  }

  function closeMobileNav() {
    mobileNavOpen.value = false
  }

  function lockScroll() {
    scrollLocks.value += 1
    document.body.style.overflow = 'hidden'
  }

  function unlockScroll() {
    scrollLocks.value = Math.max(0, scrollLocks.value - 1)
    if (scrollLocks.value === 0) document.body.style.overflow = ''
  }

  return {
    mobileNavOpen,
    sidebarCollapsed,
    pageTitle,
    setPageTitle,
    toggleCollapsed,
    openMobileNav,
    closeMobileNav,
    lockScroll,
    unlockScroll,
  }
})
