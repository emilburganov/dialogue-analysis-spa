<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'
import * as analysisRulesApi from '@/api/analysisRules'
import AppLayout from '@/components/AppLayout.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import type { AnalysisRule, AnalysisRulePayload, AnalysisRuleType } from '@/types/analysisRule'
import { severityOptions } from '@/types/analysisRule'

const rules = ref<AnalysisRule[]>([])
const types = ref<AnalysisRuleType[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const showCreateForm = ref(false)
const editingRuleId = ref<number | null>(null)

const createForm = reactive({
  slug: '',
  rule_type: '',
  name: '',
  description: '',
  default_severity: 'medium' as AnalysisRulePayload['default_severity'],
  is_enabled: true,
  config: {} as Record<string, unknown>,
})

const editForm = reactive({
  name: '',
  description: '',
  default_severity: 'medium' as AnalysisRulePayload['default_severity'],
  is_enabled: true,
  config: {} as Record<string, unknown>,
})

const selectedCreateType = computed(() => types.value.find((type) => type.type === createForm.rule_type) ?? null)
const editingRule = computed(() => rules.value.find((rule) => rule.id === editingRuleId.value) ?? null)
const editingType = computed(() => {
  if (!editingRule.value) {
    return null
  }

  return types.value.find((type) => type.type === editingRule.value?.rule_type) ?? null
})

function configValueToInput(value: unknown): string {
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  if (value === null || value === undefined) {
    return ''
  }

  return String(value)
}

function buildConfigFromSchema(
  schema: AnalysisRuleType['config_schema'],
  source: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const config: Record<string, unknown> = {}

  for (const field of schema) {
    const existing = source?.[field.key]

    if (existing !== undefined) {
      config[field.key] = existing
      continue
    }

    config[field.key] = field.default ?? ''
  }

  return config
}

async function loadData(): Promise<void> {
  loading.value = true
  error.value = null

  try {
    const [rulesResponse, typesResponse] = await Promise.all([
      analysisRulesApi.fetchAnalysisRules(),
      analysisRulesApi.fetchAnalysisRuleTypes(),
    ])

    rules.value = rulesResponse.data
    types.value = typesResponse.data

    if (!createForm.rule_type && types.value.length > 0) {
      createForm.rule_type = types.value[0].type
      createForm.default_severity = types.value[0].default_severity
      createForm.config = buildConfigFromSchema(types.value[0].config_schema, null)
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось загрузить правила.'
  } finally {
    loading.value = false
  }
}

function resetCreateForm(): void {
  const firstType = types.value[0]

  createForm.slug = ''
  createForm.rule_type = firstType?.type ?? ''
  createForm.name = firstType?.name ?? ''
  createForm.description = firstType?.description ?? ''
  createForm.default_severity = firstType?.default_severity ?? 'medium'
  createForm.is_enabled = true
  createForm.config = buildConfigFromSchema(firstType?.config_schema ?? [], null)
}

function onCreateTypeChange(): void {
  const type = selectedCreateType.value

  if (!type) {
    return
  }

  createForm.name = type.name
  createForm.description = type.description
  createForm.default_severity = type.default_severity
  createForm.config = buildConfigFromSchema(type.config_schema, null)

  if (!createForm.slug) {
    createForm.slug = type.type
  }
}

function startEdit(rule: AnalysisRule): void {
  if (rule.is_system) {
    return
  }

  editingRuleId.value = rule.id
  editForm.name = rule.name
  editForm.description = rule.description ?? ''
  editForm.default_severity = rule.default_severity
  editForm.is_enabled = rule.is_enabled
  editForm.config = buildConfigFromSchema(
    types.value.find((type) => type.type === rule.rule_type)?.config_schema ?? [],
    rule.config,
  )
}

function cancelEdit(): void {
  editingRuleId.value = null
}

async function handleCreate(): Promise<void> {
  saving.value = true
  error.value = null

  try {
    const payload: AnalysisRulePayload = {
      slug: createForm.slug,
      rule_type: createForm.rule_type,
      name: createForm.name,
      description: createForm.description || null,
      default_severity: createForm.default_severity,
      is_enabled: createForm.is_enabled,
      config: createForm.config,
    }

    const response = await analysisRulesApi.createAnalysisRule(payload)
    rules.value = [...rules.value, response.data].sort((a, b) => a.name.localeCompare(b.name))
    showCreateForm.value = false
    resetCreateForm()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось создать правило.'
  } finally {
    saving.value = false
  }
}

async function handleUpdate(ruleId: number): Promise<void> {
  saving.value = true
  error.value = null

  try {
    const payload: AnalysisRulePayload = {
      name: editForm.name,
      description: editForm.description || null,
      default_severity: editForm.default_severity,
      is_enabled: editForm.is_enabled,
      config: editForm.config,
    }

    const response = await analysisRulesApi.updateAnalysisRule(ruleId, payload)
    rules.value = rules.value
      .map((rule) => (rule.id === ruleId ? response.data : rule))
      .sort((a, b) => a.name.localeCompare(b.name))
    cancelEdit()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось сохранить правило.'
  } finally {
    saving.value = false
  }
}

async function handleToggle(rule: AnalysisRule): Promise<void> {
  if (rule.is_system) {
    return
  }

  error.value = null

  try {
    const response = await analysisRulesApi.toggleAnalysisRule(rule.id)
    rules.value = rules.value.map((item) => (item.id === rule.id ? response.data : item))
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось изменить статус правила.'
  }
}

async function handleDelete(rule: AnalysisRule): Promise<void> {
  if (rule.is_system) {
    return
  }

  if (!window.confirm(`Удалить правило «${rule.name}»?`)) {
    return
  }

  error.value = null

  try {
    await analysisRulesApi.deleteAnalysisRule(rule.id)
    rules.value = rules.value.filter((item) => item.id !== rule.id)

    if (editingRuleId.value === rule.id) {
      cancelEdit()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось удалить правило.'
  }
}

onMounted(() => {
  void loadData()
})
</script>

<template>
  <AppLayout title="Правила анализа">
    <div class="mb-6 flex flex-wrap items-center justify-between gap-4">
      <div>
        <RouterLink
          to="/"
          class="text-sm font-medium text-blue-600 transition hover:text-blue-700"
        >
          ← К диалогам
        </RouterLink>
        <p class="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
          Здесь можно включать и отключать правила, менять их параметры и добавлять новые экземпляры без изменения кода.
        </p>
      </div>

      <button
        type="button"
        class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
        @click="showCreateForm = !showCreateForm"
      >
        {{ showCreateForm ? 'Скрыть форму' : 'Добавить правило' }}
      </button>
    </div>

    <div
      v-if="error"
      class="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {{ error }}
    </div>

    <div
      v-if="showCreateForm"
      class="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 class="mb-4 text-lg font-semibold text-slate-900">
        Новое правило
      </h2>

      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="handleCreate">
        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Тип правила</span>
          <select
            v-model="createForm.rule_type"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            @change="onCreateTypeChange"
          >
            <option v-for="type in types" :key="type.type" :value="type.type">
              {{ type.name }}
            </option>
          </select>
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Код (slug)</span>
          <input
            v-model="createForm.slug"
            type="text"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            placeholder="slow_response_strict"
            required
          >
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-medium text-slate-700">Название</span>
          <input
            v-model="createForm.name"
            type="text"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            required
          >
        </label>

        <label class="block md:col-span-2">
          <span class="mb-1 block text-sm font-medium text-slate-700">Описание</span>
          <textarea
            v-model="createForm.description"
            rows="2"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          />
        </label>

        <label class="block">
          <span class="mb-1 block text-sm font-medium text-slate-700">Критичность</span>
          <select
            v-model="createForm.default_severity"
            class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
          >
            <option v-for="option in severityOptions" :key="option.value" :value="option.value">
              {{ option.label }}
            </option>
          </select>
        </label>

        <label class="flex items-center gap-2 self-end">
          <input v-model="createForm.is_enabled" type="checkbox" class="rounded border-slate-300">
          <span class="text-sm text-slate-700">Включено</span>
        </label>

        <template v-if="selectedCreateType">
          <label
            v-for="field in selectedCreateType.config_schema"
            :key="field.key"
            class="block md:col-span-2"
          >
            <span class="mb-1 block text-sm font-medium text-slate-700">{{ field.label }}</span>
            <input
              v-if="field.type === 'integer'"
              v-model.number="createForm.config[field.key]"
              type="number"
              :min="field.min ?? 1"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
            <textarea
              v-else
              :value="configValueToInput(createForm.config[field.key])"
              rows="2"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              @input="createForm.config[field.key] = ($event.target as HTMLTextAreaElement).value"
            />
          </label>
        </template>

        <div class="md:col-span-2">
          <button
            type="submit"
            class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
            :disabled="saving"
          >
            Создать
          </button>
        </div>
      </form>
    </div>

    <div v-if="loading" class="flex justify-center py-16">
      <LoadingSpinner />
    </div>

    <div v-else class="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-slate-200 text-sm">
          <thead class="bg-slate-50">
            <tr>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Правило</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Тип</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Критичность</th>
              <th class="px-4 py-3 text-left font-medium text-slate-600">Статус</th>
              <th class="px-4 py-3 text-right font-medium text-slate-600">Действия</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-200">
            <tr v-for="rule in rules" :key="rule.id">
              <td class="px-4 py-4 align-top">
                <p class="font-medium text-slate-900">{{ rule.name }}</p>
                <p class="mt-1 text-xs text-slate-500">{{ rule.slug }}</p>
                <span
                  v-if="rule.is_system"
                  class="mt-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600"
                >
                  Системное
                </span>
                <p v-if="rule.description" class="mt-2 text-slate-600">{{ rule.description }}</p>
              </td>
              <td class="px-4 py-4 align-top">
                <p class="text-slate-900">{{ rule.type_name }}</p>
              </td>
              <td class="px-4 py-4 align-top">
                {{ rule.default_severity_label }}
              </td>
              <td class="px-4 py-4 align-top">
                <span
                  class="inline-flex rounded-full px-2.5 py-1 text-xs font-medium"
                  :class="rule.is_enabled ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'"
                >
                  {{ rule.is_enabled ? 'Включено' : 'Выключено' }}
                </span>
              </td>
              <td class="px-4 py-4 align-top text-right">
                <div v-if="rule.is_system" class="text-xs text-slate-400">
                  Только просмотр
                </div>
                <div v-else class="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    class="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                    @click="handleToggle(rule)"
                  >
                    {{ rule.is_enabled ? 'Выключить' : 'Включить' }}
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-blue-300 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                    @click="startEdit(rule)"
                  >
                    Редактировать
                  </button>
                  <button
                    type="button"
                    class="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                    @click="handleDelete(rule)"
                  >
                    Удалить
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div
      v-if="editingRule"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      @click.self="cancelEdit"
    >
      <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div class="mb-4 flex items-start justify-between gap-4">
          <div>
            <h2 class="text-lg font-semibold text-slate-900">
              Редактирование: {{ editingRule.name }}
            </h2>
            <p class="mt-1 text-sm text-slate-500">
              {{ editingRule.type_name }} · {{ editingRule.slug }}
            </p>
          </div>
          <button
            type="button"
            class="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100"
            @click="cancelEdit"
          >
            ✕
          </button>
        </div>

        <form class="grid gap-4" @submit.prevent="handleUpdate(editingRule.id)">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Название</span>
            <input
              v-model="editForm.name"
              type="text"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              required
            >
          </label>

          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Описание</span>
            <textarea
              v-model="editForm.description"
              rows="3"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            />
          </label>

          <div class="grid gap-4 md:grid-cols-2">
            <label class="block">
              <span class="mb-1 block text-sm font-medium text-slate-700">Критичность</span>
              <select
                v-model="editForm.default_severity"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
                <option v-for="option in severityOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </select>
            </label>

            <label class="flex items-center gap-2 self-end">
              <input v-model="editForm.is_enabled" type="checkbox" class="rounded border-slate-300">
              <span class="text-sm text-slate-700">Включено</span>
            </label>
          </div>

          <template v-if="editingType">
            <label
              v-for="field in editingType.config_schema"
              :key="field.key"
              class="block"
            >
              <span class="mb-1 block text-sm font-medium text-slate-700">{{ field.label }}</span>
              <input
                v-if="field.type === 'integer'"
                v-model.number="editForm.config[field.key]"
                type="number"
                :min="field.min ?? 1"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
              >
              <textarea
                v-else
                :value="configValueToInput(editForm.config[field.key])"
                rows="3"
                class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
                @input="editForm.config[field.key] = ($event.target as HTMLTextAreaElement).value"
              />
            </label>
          </template>

          <div class="flex justify-end gap-3">
            <button
              type="button"
              class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
              @click="cancelEdit"
            >
              Отмена
            </button>
            <button
              type="submit"
              class="rounded-xl bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
              :disabled="saving"
            >
              Сохранить
            </button>
          </div>
        </form>
      </div>
    </div>
  </AppLayout>
</template>
