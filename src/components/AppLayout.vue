<script setup lang="ts">
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

defineProps<{
  title: string
}>()

const auth = useAuthStore()
const router = useRouter()

async function handleLogout(): Promise<void> {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="min-h-screen">
    <header class="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-5">
        <div>
          <p class="mb-1 text-sm font-medium text-slate-500">
            Внутренний сервис
          </p>
          <h1 class="text-2xl font-semibold tracking-tight text-slate-900">
            {{ title }}
          </h1>
        </div>

        <div v-if="auth.user" class="flex items-center gap-4">
          <div class="hidden text-right sm:block">
            <p class="text-sm font-medium text-slate-900">{{ auth.user.name }}</p>
            <p class="text-sm text-slate-500">{{ auth.user.email }}</p>
          </div>
          <button
            type="button"
            class="rounded-xl border border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
            @click="handleLogout"
          >
            Выйти
          </button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-6 py-8">
      <slot />
    </main>
  </div>
</template>
