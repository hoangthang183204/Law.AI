<script setup lang="ts">
import { computed } from 'vue'
import SourceReferences from '@/components/chat/SourceReferences.vue'
import MarkdownContent from '@/components/common/MarkdownContent.vue'
import type { ChatMessage } from '@/types/chat'
import { sameText } from '@/utils/text'

const props = defineProps<{ message: ChatMessage }>()
const structured = computed(() => props.message.structured)
const showContent = computed(() => {
  const content = props.message.content.trim()
  if (!content) return false
  return !sameText(content, structured.value?.summary)
})
const showAnalysis = computed(() => {
  const analysis = structured.value?.analysis?.trim()
  if (!analysis) return false
  return !sameText(analysis, props.message.content) && !sameText(analysis, structured.value?.summary)
})
</script>

<template>
  <div v-if="message.demo" class="mb-3">
    <span class="inline-flex rounded-full bg-warning-soft px-2.5 py-1 text-xs font-medium text-warning">Phản hồi demo</span>
  </div>
  <div class="space-y-4">
    <section v-if="structured?.summary" class="rounded-xl bg-brand-soft px-3 py-3">
      <h3 class="text-xs font-semibold uppercase tracking-wide text-brand-text">Tóm tắt</h3>
      <p class="mt-1 text-sm leading-7">{{ structured.summary }}</p>
    </section>
    <MarkdownContent v-if="showContent" :source="message.content" />
    <section v-if="showAnalysis">
      <h3 class="text-sm font-semibold">Phân tích vấn đề</h3>
      <p class="mt-1 whitespace-pre-wrap text-sm leading-7">{{ structured?.analysis }}</p>
    </section>
    <SourceReferences v-if="structured?.legalBases?.length" :sources="structured.legalBases" heading="Căn cứ pháp lý" />
    <section v-if="structured?.exceptions">
      <h3 class="text-sm font-semibold">Ngoại lệ</h3>
      <p class="mt-1 whitespace-pre-wrap text-sm leading-7">{{ structured.exceptions }}</p>
    </section>
    <section v-if="structured?.conditions">
      <h3 class="text-sm font-semibold">Điều kiện áp dụng</h3>
      <p class="mt-1 whitespace-pre-wrap text-sm leading-7">{{ structured.conditions }}</p>
    </section>
    <section v-if="structured?.notes">
      <h3 class="text-sm font-semibold">Lưu ý về hoàn cảnh cụ thể</h3>
      <p class="mt-1 whitespace-pre-wrap text-sm leading-7">{{ structured.notes }}</p>
    </section>
  </div>
</template>
