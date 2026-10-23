<script setup lang="ts">
import { useToastStore } from '@/stores/toastStore'

const toast = useToastStore()
</script>

<template>
  <div class="pointer-events-none fixed inset-x-0 top-4 z-[70] flex flex-col items-center gap-2 px-4" aria-live="polite">
    <div
      v-for="item in toast.items"
      :key="item.id"
      class="pointer-events-auto w-full max-w-md rounded-xl border border-line bg-surface px-4 py-3 text-sm soft-shadow"
      :class="item.type === 'error' ? 'text-danger-text' : 'text-ink'"
      role="status"
    >
      <div class="flex items-start justify-between gap-3">
        <p>{{ item.message }}</p>
        <button type="button" class="text-ink-muted hover:text-ink" @click="toast.dismiss(item.id)">Đóng</button>
      </div>
    </div>
  </div>
</template>
