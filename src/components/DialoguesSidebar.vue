<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { createDialogue, fetchDialogues } from '@/api/dialogues'
import DialogueResultBadge from '@/components/DialogueResultBadge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import { useAuthStore } from '@/stores/auth'
import type { DialogueListItem, DialogueResult } from '@/types/dialogue'
import { formatDateTime } from '@/utils/date'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

const dialogues = ref<DialogueListItem[]>([])
const loading = ref(true)
const creating = ref(false)
const error = ref<string | null>(null)
const search = ref('')
const resultFilter = ref<'all' | DialogueResult>('all')

const selectedId = computed(() => {
  const id = Number(route.params.id)
  return Number.isNaN(id) ? null : id
})

const canViewResult = computed(() => auth.user?.role !== 'client')
const canCreateDialogue = computed(() => auth.user?.role === 'client')
const canViewDeletedStatus = computed(() => auth.user?.role !== 'client')
const maxActiveDialogues = 5
const hasReachedDialogueLimit = computed(() => canCreateDialogue.value && dialogues.value.length >= maxActiveDialogues)

const filteredDialogues = computed(() => {
  const query = search.value.trim().toLowerCase()

  return dialogues.value.filter((dialogue) => {
    const matchesResult = !canViewResult.value
      || resultFilter.value === 'all'
      || dialogue.result === resultFilter.value
    const matchesSearch = query === ''
      || dialogue.client_name.toLowerCase().includes(query)
      || dialogue.manager_name.toLowerCase().includes(query)
      || dialogue.preview.toLowerCase().includes(query)

    return matchesResult && matchesSearch
  })
})

function displayName(dialogue: DialogueListItem): string {
  if (auth.user?.role === 'manager') {
    return dialogue.client_name
  }

  if (auth.user?.role === 'client') {
    return dialogue.manager_name
  }

  return dialogue.client_name
}

function displaySubtitle(dialogue: DialogueListItem): string {
  if (auth.user?.role === 'manager') {
    return 'Клиент'
  }

  if (auth.user?.role === 'client') {
    return 'Менеджер'
  }

  return `${dialogue.manager_name} · ${dialogue.client_name}`
}

async function loadDialogues(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const response = await fetchDialogues()
    dialogues.value = response.data
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось загрузить диалоги.'
  } finally {
    loading.value = false
  }
}

defineExpose({
  reload: loadDialogues,
})

function openDialogue(id: number): void {
  router.push({ name: 'dialogue', params: { id } })
}

async function handleCreateDialogue(): Promise<void> {
  if (creating.value) {
    return
  }

  creating.value = true
  error.value = null

  try {
    const dialogue = await createDialogue()
    await loadDialogues()
    openDialogue(dialogue.id)
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось создать диалог.'
  } finally {
    creating.value = false
  }
}

onMounted(loadDialogues)

watch(
  () => route.name,
  (name) => {
    if (name === 'dialogues' && !loading.value) {
      loadDialogues()
    }
  },
)
</script>

<template>
  <aside class="flex h-full flex-col border-r border-slate-200 bg-white">
    <div class="border-b border-slate-200 p-4">
      <h2 class="text-lg font-semibold text-slate-900">
        Диалоги
      </h2>

      <button
        v-if="canCreateDialogue"
        type="button"
        :disabled="creating || hasReachedDialogueLimit"
        class="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        @click="handleCreateDialogue"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        {{ creating ? 'Создание...' : 'Новый диалог' }}
      </button>
      <p
        v-if="canCreateDialogue && hasReachedDialogueLimit"
        class="mt-2 text-xs text-amber-700"
      >
        Достигнут лимит: не более {{ maxActiveDialogues }} активных диалогов
      </p>

      <div class="mt-4 space-y-3">
        <input
          v-model="search"
          type="search"
          placeholder="Поиск..."
          class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
        >

        <div v-if="canViewResult" class="flex flex-wrap gap-2">
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="resultFilter === 'all'
              ? 'bg-slate-900 text-white'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'"
            @click="resultFilter = 'all'"
          >
            Все
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="resultFilter === 'bought'
              ? 'bg-emerald-600 text-white'
              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'"
            @click="resultFilter = 'bought'"
          >
            Купил
          </button>
          <button
            type="button"
            class="rounded-lg px-3 py-1.5 text-xs font-medium transition"
            :class="resultFilter === 'not_bought'
              ? 'bg-rose-600 text-white'
              : 'bg-rose-50 text-rose-700 hover:bg-rose-100'"
            @click="resultFilter = 'not_bought'"
          >
            Не купил
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto">
      <LoadingSpinner v-if="loading" />

      <p
        v-else-if="error"
        class="m-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ error }}
      </p>

      <p
        v-else-if="filteredDialogues.length === 0"
        class="p-6 text-center text-sm text-slate-500"
      >
        Диалоги не найдены
      </p>

      <button
        v-for="dialogue in filteredDialogues"
        :key="dialogue.id"
        type="button"
        class="flex w-full flex-col gap-2 border-b border-slate-100 px-4 py-4 text-left transition hover:bg-slate-50"
        :class="[
          selectedId === dialogue.id ? 'bg-blue-50 hover:bg-blue-50' : '',
          dialogue.deleted_by_client ? 'opacity-70' : '',
        ]"
        @click="openDialogue(dialogue.id)"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <p class="truncate font-semibold text-slate-900">
              {{ displayName(dialogue) }}
            </p>
            <p class="truncate text-sm text-slate-500">
              {{ displaySubtitle(dialogue) }}
            </p>
          </div>
          <div class="flex shrink-0 flex-col items-end gap-1">
            <span
              v-if="canViewDeletedStatus && dialogue.deleted_by_client"
              class="rounded-lg bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800"
            >
              Удалён клиентом
            </span>
            <DialogueResultBadge
              v-if="canViewResult && dialogue.result && dialogue.result_label"
              :result="dialogue.result"
              :label="dialogue.result_label"
              size="sm"
            />
          </div>
        </div>
        <p class="line-clamp-2 text-sm text-slate-500">
          {{ dialogue.preview }}
        </p>
        <p class="text-xs text-slate-400">
          {{ formatDateTime(dialogue.last_message_at) }}
        </p>
      </button>
    </div>
  </aside>
</template>
