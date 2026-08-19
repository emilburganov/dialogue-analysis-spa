<script setup lang="ts">
import type { AnalysisSeverity } from '@/types/analysis'

withDefaults(
  defineProps<{
    severity: AnalysisSeverity
    label: string
    size?: 'sm' | 'md'
  }>(),
  {
    size: 'md',
  },
)

const severityStyles: Record<AnalysisSeverity, string> = {
  high: 'bg-rose-50 text-rose-700 ring-rose-200',
  medium: 'bg-amber-50 text-amber-800 ring-amber-200',
  low: 'bg-slate-100 text-slate-700 ring-slate-200',
}
</script>

<template>
  <span
    class="inline-flex rounded-full font-semibold ring-1 ring-inset"
    :class="[
      severityStyles[severity],
      size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
    ]"
  >
    {{ label }}
  </span>
</template>
