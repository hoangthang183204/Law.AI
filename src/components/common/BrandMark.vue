<script setup lang="ts">
import { Scale } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(defineProps<{ size?: 'sm' | 'md' }>(), { size: 'md' })
const box = computed(() => props.size === 'sm' ? 'h-8 w-8 rounded-lg' : 'h-10 w-10 rounded-xl')
const icon = computed(() => props.size === 'sm' ? 16 : 20)
</script>

<template>
  <span class="inline-flex shrink-0 items-center justify-center bg-brand text-on-brand" :class="box" aria-hidden="true">
    <Scale :size="icon" :stroke-width="1.75" />
  </span>
</template>
