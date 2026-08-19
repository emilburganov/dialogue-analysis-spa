<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import AppLayout from '@/components/AppLayout.vue'
import DialoguePanel from '@/components/DialoguePanel.vue'
import DialoguesSidebar from '@/components/DialoguesSidebar.vue'

const route = useRoute()

const hasSelectedDialogue = computed(() => route.name === 'dialogue')
</script>

<template>
  <AppLayout title="Анализ диалогов">
    <div class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="grid min-h-[70vh] lg:grid-cols-[360px_minmax(0,1fr)]">
        <div :class="hasSelectedDialogue ? 'hidden lg:block' : 'block'">
          <DialoguesSidebar />
        </div>

        <div
          class="min-h-[50vh] lg:border-l lg:border-slate-200"
          :class="hasSelectedDialogue ? 'block' : 'hidden lg:block'"
        >
          <DialoguePanel v-if="hasSelectedDialogue" />

          <div
            v-else
            class="flex h-full min-h-[50vh] flex-col items-center justify-center px-6 text-center"
          >
            <div class="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h8M8 14h5m-9 6h10a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 class="text-lg font-semibold text-slate-900">
              Выберите диалог
            </h3>
            <p class="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Нажмите на диалог слева, чтобы открыть переписку между менеджером и клиентом.
            </p>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
</template>
