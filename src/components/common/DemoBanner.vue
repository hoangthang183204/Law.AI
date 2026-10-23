<script setup lang="ts">
import { apiConfig } from '@/config/api'
</script>

<template>
  <div v-if="apiConfig.useMock" class="shrink-0 bg-warning-soft px-4 py-2 text-center text-sm text-warning">
    Chế độ demo: câu trả lời không đến từ mô hình pháp luật và không phải kết quả tra cứu.
  </div>
</template>
