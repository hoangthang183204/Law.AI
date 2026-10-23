<script setup lang="ts">
import BrandMark from '@/components/common/BrandMark.vue'
</script>

<template>
  <div class="grid h-full min-h-0 bg-canvas md:grid-cols-[minmax(18rem,0.9fr)_minmax(24rem,1.1fr)]">
    <section class="hidden min-h-0 flex-col border-r border-line bg-sidebar px-10 py-10 md:flex lg:px-14">
      <div class="flex items-center gap-3">
        <BrandMark />
        <div>
          <p class="text-base font-semibold tracking-tight">LAW.AI</p>
            <p class="text-xs text-ink-muted">Chuyên luật lao động</p>
        </div>
      </div>
      <div class="my-auto max-w-sm py-12">
        <h2 class="text-3xl font-semibold leading-tight tracking-tight">Hỏi luật lao động Việt Nam bằng hội thoại.</h2>
        <p class="mt-4 text-sm leading-6 text-ink-muted">
          Câu trả lời, nguồn và căn cứ pháp lý chỉ hiện khi máy chủ của bạn cung cấp.
        </p>
      </div>
      <p class="max-w-sm text-xs leading-5 text-ink-muted">
        Thông tin mang tính tham khảo, không thay thế việc kiểm tra văn bản pháp luật hiện hành và tư vấn phù hợp với hoàn cảnh cụ thể.
      </p>
    </section>
    <section class="flex items-center justify-center overflow-y-auto px-4 py-8">
      <div class="w-full max-w-[26rem] rounded-2xl border border-line bg-surface px-5 py-6 soft-shadow sm:px-8 sm:py-8">
        <div class="mb-6 flex items-center gap-3 md:hidden">
          <BrandMark />
          <div>
            <p class="font-semibold tracking-tight">LAW.AI</p>
            <p class="text-xs text-ink-muted">Chuyên luật lao động</p>
          </div>
        </div>
        <slot />
      </div>
    </section>
  </div>
</template>
