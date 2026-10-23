<script setup lang="ts">
import { computed } from 'vue'
import { renderMarkdown } from '@/utils/markdown'

const props = defineProps<{ source: string }>()
const html = computed(() => renderMarkdown(props.source))
</script>

<template>
  <!-- HTML đã được marked tạo ra và DOMPurify làm sạch trước khi gắn vào trang. -->
  <div class="markdown" v-html="html" />
</template>
