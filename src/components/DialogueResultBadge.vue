<script setup lang="ts">
import type { DialogueResult } from '@/types/dialogue'

defineProps<{
  result: DialogueResult
  label: string
  size?: 'sm' | 'md'
}>()
</script>

<template>
  <span
    class="inline-flex rounded-full font-semibold"
    :class="[
      result === 'bought'
        ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
        : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-3 py-1 text-xs',
    ]"
  >
    {{ label }}
  </span>
</template>
