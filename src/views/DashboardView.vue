<script setup lang="ts">
import AppLayout from '@/components/AppLayout.vue'
</script>

<template>
  <AppLayout title="Анализ диалогов">
    <section class="max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div class="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
        Авторизация пройдена
      </div>
      <h2 class="mb-3 text-2xl font-semibold text-slate-900">
        Добро пожаловать
      </h2>
      <p class="leading-7 text-slate-600">
        Вы успешно вошли в систему. Здесь будет интерфейс для анализа диалогов
        менеджеров с клиентами.
      </p>
    </section>
  </AppLayout>
</template>
