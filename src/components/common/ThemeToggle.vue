<script setup lang="ts">
import { Moon, Sun } from 'lucide-vue-next'
import { computed } from 'vue'
import { useThemeStore } from '@/stores/themeStore'

const theme = useThemeStore()
const label = computed(() => theme.isDark ? 'Bật chế độ sáng' : 'Bật chế độ tối')
</script>

<template>
  <button
    type="button"
    class="inline-flex h-10 w-10 items-center justify-center rounded-xl text-ink-muted hover:bg-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    :aria-label="label"
    :title="label"
    @click="theme.toggle()"
  >
    <Sun v-if="theme.isDark" :size="18" aria-hidden="true" />
    <Moon v-else :size="18" aria-hidden="true" />
  </button>
</template>
