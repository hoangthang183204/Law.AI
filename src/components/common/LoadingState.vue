<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

withDefaults(defineProps<{ label?: string }>(), { label: 'Đang tải...' })
</script>

<template>
  <div class="flex items-center justify-center gap-3 px-4 py-8 text-sm text-ink-muted" role="status">
    <LoaderCircle class="animate-spin" :size="18" aria-hidden="true" />
    <span>{{ label }}</span>
  </div>
</template>
