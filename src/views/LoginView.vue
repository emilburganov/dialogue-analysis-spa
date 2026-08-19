<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const router = useRouter()

const form = reactive({
  email: 'admin@example.com',
  password: 'password',
})

const error = ref<string | null>(null)

async function handleSubmit(): Promise<void> {
  error.value = null

  try {
    await auth.login(form)
    await router.push({ name: 'dashboard' })
  } catch (exception) {
    error.value = exception instanceof Error
      ? exception.message
      : 'Не удалось выполнить вход.'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center px-4 py-8">
    <section class="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-900/5">
      <p class="mb-2 text-sm font-medium text-slate-500">
        Сервис для анализа диалогов
      </p>
      <h1 class="mb-2 text-3xl font-semibold tracking-tight text-slate-900">
        Вход в систему
      </h1>
      <p class="mb-8 text-sm leading-6 text-slate-600">
        Авторизуйтесь, чтобы получить доступ к интерфейсу анализа диалогов.
      </p>

      <form class="space-y-5" @submit.prevent="handleSubmit">
        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-700">Email:</span>
          <input
            v-model="form.email"
            type="email"
            autocomplete="email"
            required
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          >
        </label>

        <label class="block space-y-2">
          <span class="text-sm font-medium text-slate-700">Пароль:</span>
          <input
            v-model="form.password"
            type="password"
            autocomplete="current-password"
            required
            class="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/15"
          >
        </label>

        <p
          v-if="error"
          class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {{ error }}
        </p>

        <button
          type="submit"
          :disabled="auth.loading"
          class="inline-flex w-full items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {{ auth.loading ? 'Вход...' : 'Войти' }}
        </button>
      </form>
    </section>
  </div>
</template>
