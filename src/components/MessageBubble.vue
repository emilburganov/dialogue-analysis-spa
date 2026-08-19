<script setup lang="ts">
import { formatDateTime } from '@/utils/date'
import type { Message } from '@/types/dialogue'

defineProps<{
  message: Message
  isOwn: boolean
}>()
</script>

<template>
  <article
    class="flex"
    :class="isOwn ? 'justify-end' : 'justify-start'"
  >
    <div
      class="max-w-[85%] rounded-2xl px-4 py-3 shadow-sm sm:max-w-xl"
      :class="isOwn
        ? 'rounded-br-md bg-blue-600 text-white'
        : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'"
    >
      <div
        class="mb-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] font-semibold uppercase tracking-wide"
        :class="isOwn ? 'text-blue-100' : 'text-slate-500'"
      >
        <span>{{ message.sender_label }}</span>
        <span class="opacity-60">·</span>
        <time>{{ formatDateTime(message.sent_at) }}</time>
      </div>
      <p class="whitespace-pre-wrap text-sm leading-6 sm:text-[15px]">
        {{ message.body }}
      </p>
    </div>
  </article>
</template>
