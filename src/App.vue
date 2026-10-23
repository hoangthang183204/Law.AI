<script setup lang="ts">
import DemoBanner from '@/components/common/DemoBanner.vue'
import ToastHost from '@/components/common/ToastHost.vue'
import { useThemeStore } from '@/stores/themeStore'

useThemeStore().init()
</script>

<template>
  <div class="flex h-dvh flex-col overflow-hidden bg-canvas text-ink">
    <a class="skip-link" href="#main">Đi tới nội dung</a>
    <DemoBanner />
    <div class="min-h-0 flex-1">
      <RouterView />
    </div>
    <ToastHost />
  </div>
</template>
