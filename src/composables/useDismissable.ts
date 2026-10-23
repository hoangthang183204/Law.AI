import { onMounted, onUnmounted, type Ref } from 'vue'

export function useDismissable(open: Ref<boolean>, root: Ref<HTMLElement | null>) {
  function onPointerDown(event: PointerEvent) {
    if (!open.value || !root.value) return
    if (root.value.contains(event.target as Node)) return
    open.value = false
  }

  function onKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape' && open.value) open.value = false
  }

  onMounted(() => {
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    document.removeEventListener('pointerdown', onPointerDown)
    document.removeEventListener('keydown', onKeydown)
  })
}
