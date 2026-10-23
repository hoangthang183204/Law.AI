<script setup lang="ts">
import { Banknote, Briefcase, Clock, FileText, HeartHandshake, Shield } from 'lucide-vue-next'
import type { Component } from 'vue'
import { SUGGESTIONS, type Suggestion } from '@/constants/content'

defineEmits<{ select: [prompt: string] }>()

const icons: Record<Suggestion['icon'], Component> = {
  Briefcase,
  Banknote,
  Clock,
  Shield,
  HeartHandshake,
  FileText,
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col overflow-y-auto">
    <div class="mx-auto my-auto w-full max-w-3xl px-4 py-6">
      <h2 class="text-2xl font-semibold tracking-tight sm:text-3xl">Xin chào! Tôi có thể giúp gì về luật lao động?</h2>
      <p class="mt-3 text-sm leading-7 text-ink-muted sm:text-base">
        Đặt câu hỏi về hợp đồng, tiền lương, thời giờ làm việc, kỷ luật và chấm dứt hợp đồng lao động.
      </p>
      <div class="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <button
          v-for="item in SUGGESTIONS"
          :key="item.id"
          type="button"
          class="rounded-2xl border border-line bg-surface p-4 text-left transition hover:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
          @click="$emit('select', item.prompt)"
        >
          <component :is="icons[item.icon]" :size="18" class="text-brand-text" aria-hidden="true" />
          <span class="mt-3 block text-sm font-semibold">{{ item.title }}</span>
          <span class="mt-1 block text-sm leading-6 text-ink-muted">{{ item.description }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
