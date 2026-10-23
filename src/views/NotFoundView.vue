<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <main id="main" class="grid h-full place-items-center px-4 text-center">
    <div>
      <h1 class="text-2xl font-semibold">Không tìm thấy trang</h1>
      <p class="mt-2 text-sm text-ink-muted">Đường dẫn này không có trong LAW.AI.</p>
      <RouterLink class="mt-4 inline-flex h-10 items-center rounded-xl bg-brand px-4 text-sm font-medium text-on-brand" to="/chat">Về cuộc trò chuyện</RouterLink>
    </div>
  </main>
</template>
