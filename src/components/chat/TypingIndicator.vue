<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const slow = ref(false)
let timer = 0

onMounted(() => {
  timer = window.setTimeout(() => {
    slow.value = true
  }, 8000)
})

onUnmounted(() => window.clearTimeout(timer))
</script>

<template>
  <div class="flex items-center gap-3 text-sm text-ink-muted" role="status">
    <span class="typing-dots text-brand" aria-hidden="true"><span></span><span></span><span></span></span>
    <span>{{ slow ? 'Vẫn đang chờ máy chủ. Việc tra cứu có thể mất thêm thời gian.' : 'Đã gửi câu hỏi. Đang chờ máy chủ xử lý.' }}</span>
  </div>
</template>
