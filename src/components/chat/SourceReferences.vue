<script setup lang="ts">
import { computed } from 'vue'
import type { SourceReference } from '@/types/chat'
import { formatLegalDate } from '@/utils/datetime'
import { legalPosition, safeHttpUrl } from '@/utils/text'

const props = withDefaults(defineProps<{
  sources: SourceReference[]
  heading?: string
}>(), {
  heading: '',
})

const detailed = computed(() => props.sources.some((source) => source.documentName || source.documentNumber || source.article || source.clause || source.point))
const title = computed(() => props.heading || (detailed.value ? 'Căn cứ pháp lý và nguồn tham khảo' : 'Nguồn tham khảo'))

function link(source: SourceReference) {
  return safeHttpUrl(source.url)
}
</script>

<template>
  <section class="space-y-2">
    <h3 class="text-sm font-semibold">{{ title }}</h3>
    <article v-for="(source, index) in sources" :key="`${source.documentNumber ?? source.title ?? 'source'}-${index}`" class="rounded-xl border border-line bg-canvas px-3 py-3">
      <h4 class="text-sm font-medium">{{ source.documentName || source.title || 'Nguồn tham khảo' }}</h4>
      <dl class="mt-2 space-y-1 text-sm text-ink-muted">
        <div v-if="source.documentNumber"><dt class="sr-only">Số hiệu</dt><dd>Số hiệu: {{ source.documentNumber }}</dd></div>
        <div v-if="legalPosition(source).length"><dt class="sr-only">Vị trí</dt><dd>{{ legalPosition(source).join(', ') }}</dd></div>
        <div v-if="source.issuedDate"><dt class="sr-only">Ngày ban hành</dt><dd>Ngày ban hành: {{ formatLegalDate(source.issuedDate) }}</dd></div>
        <div v-if="source.effectiveDate"><dt class="sr-only">Ngày hiệu lực</dt><dd>Ngày hiệu lực theo dữ liệu máy chủ: {{ formatLegalDate(source.effectiveDate) }}</dd></div>
      </dl>
      <p v-if="source.inForce === true" class="mt-2 text-sm">Máy chủ ghi nhận văn bản còn hiệu lực.</p>
      <p v-else-if="source.inForce === false" class="mt-2 text-sm">Máy chủ ghi nhận văn bản không còn hiệu lực hoặc chưa hiệu lực.</p>
      <blockquote v-if="source.excerpt" class="mt-2 border-l-2 border-line pl-3 text-sm leading-6">{{ source.excerpt }}</blockquote>
      <a v-if="link(source)" class="mt-2 inline-block text-sm text-brand-text underline" :href="link(source) || undefined" target="_blank" rel="noopener noreferrer">Mở nguồn</a>
    </article>
  </section>
</template>
