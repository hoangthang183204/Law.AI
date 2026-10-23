<script setup lang="ts">
import AppButton from '@/components/common/AppButton.vue'

withDefaults(defineProps<{
  message: string
  retryable?: boolean
  tone?: 'danger' | 'neutral'
}>(), {
  retryable: false,
  tone: 'danger',
})

const emit = defineEmits<{ retry: [] }>()
</script>

<template>
  <div
    role="alert"
    class="rounded-xl border border-line px-3 py-3"
    :class="tone === 'danger' ? 'bg-danger-soft text-danger-text' : 'bg-muted text-ink'"
  >
    <p class="text-sm leading-6">{{ message }}</p>
    <div v-if="retryable" class="mt-3">
      <AppButton variant="secondary" size="sm" @click="emit('retry')">Thử lại</AppButton>
    </div>
  </div>
</template>
