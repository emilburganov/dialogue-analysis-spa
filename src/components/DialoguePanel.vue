<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { deleteDialogue, fetchDialogue, sendMessage } from '@/api/dialogues'
import DialogueAnalysisPanel from '@/components/DialogueAnalysisPanel.vue'
import DialogueResultBadge from '@/components/DialogueResultBadge.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import MessageBubble from '@/components/MessageBubble.vue'
import { useAuthStore } from '@/stores/auth'
import type { DialogueDetail } from '@/types/dialogue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const dialogue = ref<DialogueDetail | null>(null)
const loading = ref(false)
const sending = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)
const messageBody = ref('')

const dialogueId = computed(() => Number(route.params.id))

const canViewResult = computed(() => auth.user?.role !== 'client')
const canViewDeletedStatus = computed(() => auth.user?.role !== 'client')
const canDeleteDialogue = computed(() => auth.user?.role === 'client')

const counterpartName = computed(() => {
  if (!dialogue.value || !auth.user) {
    return ''
  }

  if (auth.user.role === 'manager') {
    return dialogue.value.client_name
  }

  if (auth.user.role === 'client') {
    return dialogue.value.manager_name
  }

  return `${dialogue.value.client_name} / ${dialogue.value.manager_name}`
})

function isOwnMessage(sender: 'manager' | 'client'): boolean {
  if (!auth.user) {
    return false
  }

  if (auth.user.role === 'manager') {
    return sender === 'manager'
  }

  if (auth.user.role === 'client') {
    return sender === 'client'
  }

  return false
}

async function loadDialogue(id: number): Promise<void> {
  if (Number.isNaN(id)) {
    return
  }

  loading.value = true
  error.value = null
  dialogue.value = null

  try {
    dialogue.value = await fetchDialogue(id)
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось загрузить диалог.'
  } finally {
    loading.value = false
  }
}

async function handleSendMessage(): Promise<void> {
  const body = messageBody.value.trim()

  if (!body || !dialogue.value || sending.value) {
    return
  }

  sending.value = true
  error.value = null

  try {
    const message = await sendMessage(dialogue.value.id, body)
    dialogue.value.messages.push(message)
    messageBody.value = ''
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось отправить сообщение.'
  } finally {
    sending.value = false
  }
}

async function handleDeleteDialogue(): Promise<void> {
  if (!dialogue.value || deleting.value) {
    return
  }

  if (!window.confirm('Удалить этот диалог? Вы сможете создать новый, если не достигнут лимит.')) {
    return
  }

  deleting.value = true
  error.value = null

  try {
    await deleteDialogue(dialogue.value.id)
    router.push({ name: 'dialogues' })
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось удалить диалог.'
  } finally {
    deleting.value = false
  }
}

watch(
  dialogueId,
  (id) => {
    if (!Number.isNaN(id)) {
      loadDialogue(id)
    }
  },
  { immediate: true },
)

function goBackMobile(): void {
  router.push({ name: 'dialogues' })
}
</script>

<template>
  <section class="flex h-full flex-col bg-slate-50">
    <div class="border-b border-slate-200 bg-white px-4 py-3 lg:hidden">
      <button
        type="button"
        class="text-sm font-medium text-blue-600"
        @click="goBackMobile"
      >
        ← К списку
      </button>
    </div>

    <LoadingSpinner v-if="loading" />

    <p
      v-else-if="error && !dialogue"
      class="m-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ error }}
    </p>

    <template v-else-if="dialogue">
      <header class="border-b border-slate-200 bg-white px-6 py-5">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p class="text-sm font-medium text-slate-500">
              {{ auth.user?.role === 'admin' ? 'Диалог' : 'Собеседник' }}
            </p>
            <h2 class="text-2xl font-semibold text-slate-900">
              {{ counterpartName }}
            </h2>
            <p v-if="auth.user?.role === 'admin'" class="mt-1 text-slate-600">
              Менеджер: {{ dialogue.manager_name }} · Клиент: {{ dialogue.client_name }}
            </p>
            <p v-else-if="auth.user?.role === 'manager'" class="mt-1 text-slate-600">
              Клиент
            </p>
            <p v-else-if="auth.user?.role === 'client'" class="mt-1 text-slate-600">
              Менеджер
            </p>
          </div>

          <div class="flex flex-col items-end gap-2">
            <button
              v-if="canDeleteDialogue"
              type="button"
              :disabled="deleting"
              class="rounded-lg border border-red-200 px-3 py-1.5 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-70"
              @click="handleDeleteDialogue"
            >
              {{ deleting ? 'Удаление...' : 'Удалить диалог' }}
            </button>

            <DialogueResultBadge
              v-if="canViewResult && dialogue.result && dialogue.result_label"
              :result="dialogue.result"
              :label="dialogue.result_label"
            />
          </div>
        </div>

        <div
          v-if="canViewDeletedStatus && dialogue.deleted_by_client"
          class="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
        >
          Клиент удалил этот диалог. Отправка сообщений клиенту недоступна.
        </div>
      </header>

      <DialogueAnalysisPanel
        v-if="canViewResult && dialogue"
        :dialogue-id="dialogue.id"
      />

      <div class="flex-1 space-y-4 overflow-y-auto px-4 py-6 sm:px-6">
        <MessageBubble
          v-for="message in dialogue.messages"
          :key="message.id"
          :message="message"
          :is-own="isOwnMessage(message.sender)"
        />
      </div>

      <div
        v-if="!dialogue.can_send_messages && canViewDeletedStatus && dialogue.deleted_by_client"
        class="border-t border-slate-200 bg-slate-100 px-6 py-4 text-sm text-slate-600"
      >
        Переписка доступна только для просмотра.
      </div>

      <form
        v-if="dialogue.can_send_messages"
        class="border-t border-slate-200 bg-white p-4"
        @submit.prevent="handleSendMessage"
      >
        <p
          v-if="error"
          class="mb-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </p>

        <div class="flex gap-3">
          <textarea
            v-model="messageBody"
            rows="2"
            placeholder="Введите сообщение..."
            class="min-h-[48px] flex-1 resize-none rounded-xl border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          />
          <button
            type="submit"
            :disabled="sending || !messageBody.trim()"
            class="self-end rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {{ sending ? '...' : 'Отправить' }}
          </button>
        </div>
      </form>
    </template>
  </section>
</template>
