<script setup lang="ts">
import { ref, watch } from 'vue'
import { fetchDialogueAnalysis } from '@/api/dialogues'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import type { AnalysisEvent, AnalysisSeverity } from '@/types/analysis'

const props = defineProps<{
  dialogueId: number
}>()

const loading = ref(false)
const error = ref<string | null>(null)
const total = ref(0)
const events = ref<AnalysisEvent[]>([])

const cardAccentStyles: Record<AnalysisSeverity, string> = {
  high: 'border-l-rose-500',
  medium: 'border-l-amber-500',
  low: 'border-l-slate-400',
}

async function loadAnalysis(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const response = await fetchDialogueAnalysis(props.dialogueId)
    total.value = response.total
    events.value = response.data
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось выполнить анализ диалога.'
  } finally {
    loading.value = false
  }
}

watch(
  () => props.dialogueId,
  (id) => {
    if (id > 0) {
      loadAnalysis()
    }
  },
  { immediate: true },
)
</script>

<template>
  <section class="border-b border-slate-200 bg-white px-6 py-5">
    <div class="mb-4 flex items-center justify-between gap-3">
      <div>
        <h3 class="text-base font-semibold text-slate-900">
          Анализ диалога
        </h3>
        <p class="mt-1 text-sm text-slate-500">
          {{ loading ? 'Проверка правил...' : `Обнаружено ${total} ${total === 1 ? 'событие' : 'событий'}` }}
        </p>
      </div>
      <button
        type="button"
        :disabled="loading"
        class="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-70"
        @click="loadAnalysis"
      >
        Обновить
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <p
      v-else-if="error"
      class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ error }}
    </p>

    <p
      v-else-if="events.length === 0"
      class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
    >
      Потенциальных проблем не найдено.
    </p>

    <ul
      v-else
      class="space-y-3"
    >
      <li
        v-for="event in events"
        :key="event.id"
        class="rounded-xl border border-slate-200 border-l-4 bg-slate-50 p-4"
        :class="cardAccentStyles[event.severity]"
      >
        <div class="flex flex-wrap items-start gap-x-4 gap-y-2">
          <div class="flex shrink-0 items-center gap-2">
            <span class="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Критичность:
            </span>
            <SeverityBadge
              :severity="event.severity"
              :label="event.severity_label"
            />
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-medium text-slate-900">
              {{ event.title }}
            </p>
            <p class="mt-1 text-sm text-slate-600">
              {{ event.description }}
            </p>
            <p class="mt-2 text-xs text-slate-500">
              Правило: {{ event.rule_name }} · Сообщения: {{ event.message_ids.join(', ') }}
            </p>
          </div>
        </div>
      </li>
    </ul>
  </section>
</template>
