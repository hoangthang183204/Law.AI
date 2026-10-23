<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg' | 'icon'
  type?: 'button' | 'submit' | 'reset'
  loading?: boolean
  disabled?: boolean
  block?: boolean
  shape?: 'rounded' | 'circle'
}>(), {
  variant: 'primary',
  size: 'md',
  type: 'button',
  loading: false,
  disabled: false,
  block: false,
  shape: 'rounded',
})

const classes = computed(() => {
  const variants = {
    primary: 'bg-brand text-on-brand hover:bg-brand-hover',
    secondary: 'border border-line bg-surface text-ink hover:bg-muted',
    ghost: 'text-ink-muted hover:bg-muted hover:text-ink',
    danger: 'bg-danger text-white hover:opacity-90',
  }
  const sizes = {
    sm: 'h-9 px-3 text-sm',
    md: 'h-10 px-4 text-sm',
    lg: 'h-11 px-5 text-sm',
    icon: 'h-11 w-11',
  }
  return [
    'inline-flex shrink-0 items-center justify-center gap-2 font-medium transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand',
    props.shape === 'circle' ? 'rounded-full' : 'rounded-xl',
    variants[props.variant],
    sizes[props.size],
    props.block ? 'w-full' : '',
  ]
})
</script>

<template>
  <button :type="type" :disabled="disabled || loading" :class="classes">
    <LoaderCircle v-if="loading" class="animate-spin" :size="16" aria-hidden="true" />
    <slot />
  </button>
</template>
