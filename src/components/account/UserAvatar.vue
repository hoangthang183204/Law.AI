<script setup lang="ts">
import { UserRound } from 'lucide-vue-next'
import { computed } from 'vue'
import { useAuthStore } from '@/stores/authStore'

withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
const auth = useAuthStore()
const initials = computed(() => {
  const source = auth.user?.name || auth.user?.email || ''
  const parts = source.trim().split(/\s+/).slice(0, 2)
  const letters = parts.map((part) => part[0] ?? '').join('')
  return letters.toLocaleUpperCase('vi')
})
</script>

<template>
  <span
    class="inline-flex shrink-0 items-center justify-center rounded-full bg-brand font-semibold text-on-brand"
    :class="size === 'sm' ? 'h-8 w-8 text-xs' : 'h-9 w-9 text-sm'"
  >
    <UserRound v-if="!auth.user" :size="16" aria-hidden="true" />
    <span v-else>{{ initials }}</span>
  </span>
</template>
