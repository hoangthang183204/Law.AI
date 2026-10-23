<script setup lang="ts">
import AppHeader from '@/components/layout/AppHeader.vue'
import AppSidebar from '@/components/layout/AppSidebar.vue'
import MobileDrawer from '@/components/layout/MobileDrawer.vue'
</script>

<template>
  <div class="flex h-full min-h-0 overflow-hidden">
    <AppSidebar />
    <MobileDrawer />
    <div class="flex min-w-0 flex-1 flex-col">
      <AppHeader />
      <main id="main" class="min-h-0 flex-1">
        <RouterView />
      </main>
    </div>
  </div>
</template>
