<script setup lang="ts">
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { ErrorMessage, Field, useForm } from 'vee-validate'
import * as analysisRulesApi from '@/api/analysisRules'
import AnalysisRuleEditModal from '@/components/AnalysisRuleEditModal.vue'
import AppLayout from '@/components/AppLayout.vue'
import KeywordsChipsInput from '@/components/KeywordsChipsInput.vue'
import LoadingSpinner from '@/components/LoadingSpinner.vue'
import SeverityBadge from '@/components/SeverityBadge.vue'
import {
  buildCreateRuleSchema,
  buildDefaultCreateFormValues,
  parseKeywords,
} from '@/schemas/analysisRuleSchema'
import type { AnalysisRule, AnalysisRulePayload, AnalysisRuleType } from '@/types/analysisRule'
import { severityOptions } from '@/types/analysisRule'
import { applyApiFieldErrors } from '@/utils/apiValidationError'

const rules = ref<AnalysisRule[]>([])
const types = ref<AnalysisRuleType[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref<string | null>(null)
const showCreateForm = ref(false)
const editingRule = ref<AnalysisRule | null>(null)
const createRuleConfigSchema = ref<AnalysisRuleType['config_schema']>([])
const createSubmitAttempted = ref(false)
const createValidationSchema = shallowRef(buildCreateRuleSchema([]))

watch(createRuleConfigSchema, (schema) => {
  createValidationSchema.value = buildCreateRuleSchema(schema)
})

const {
  values: createValues,
  errors: createErrors,
  handleSubmit: submitCreateForm,
  resetForm: resetCreateFormState,
  setFieldError: setCreateFieldError,
} = useForm({
  validationSchema: createValidationSchema,
  initialValues: buildDefaultCreateFormValues(undefined),
  validateOnMount: false,
})

const editingRuleType = computed(() => {
  if (!editingRule.value) {
    return null
  }

  return types.value.find((type) => type.id === editingRule.value?.rule_type_id) ?? null
})

const selectedCreateType = computed(() =>
  types.value.find((type) => type.id === createValues.rule_type_id) ?? null,
)

const showCreateValidation = computed(() => createSubmitAttempted.value)

function hasCreateFieldError(field: string): boolean {
  return showCreateValidation.value && Boolean(createErrors.value[field as keyof typeof createErrors.value])
}

function applyCreateApiErrors(err: unknown): boolean {
  return applyApiFieldErrors(err, (field, message) => {
    setCreateFieldError(field as keyof typeof createValues, message)
  })
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

    if (!createValues.rule_type_id && types.value.length > 0) {
      const firstType = types.value[0]
      createRuleConfigSchema.value = firstType.config_schema
      resetCreateFormState({ values: buildDefaultCreateFormValues(firstType) })
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Не удалось загрузить правила.'
  } finally {
    loading.value = false
  }
}

function resetCreateForm(): void {
  const firstType = types.value[0]
  createRuleConfigSchema.value = firstType?.config_schema ?? []
  createSubmitAttempted.value = false
  resetCreateFormState({
    values: buildDefaultCreateFormValues(firstType),
    errors: {},
    touched: {},
  })
}

function toggleCreateForm(): void {
  if (showCreateForm.value) {
    showCreateForm.value = false
    return
  }

  resetCreateForm()
  showCreateForm.value = true
}

function onCreateTypeChange(): void {
  const type = selectedCreateType.value

  if (!type) {
    return
  }

  createRuleConfigSchema.value = type.config_schema
  createSubmitAttempted.value = false
  resetCreateFormState({
    values: buildDefaultCreateFormValues(type),
    errors: {},
    touched: {},
  })
}

function startEdit(rule: AnalysisRule): void {
  if (rule.is_system) {
    return
  }

  editingRule.value = rule
}

function cancelEdit(): void {
  editingRule.value = null
}

function onRuleSaved(updatedRule: AnalysisRule): void {
  rules.value = rules.value
    .map((rule) => (rule.id === updatedRule.id ? updatedRule : rule))
    .sort((a, b) => a.name.localeCompare(b.name))
  cancelEdit()
}

const handleCreate = submitCreateForm(async (formValues) => {
  saving.value = true
  error.value = null

  try {
    const payload: AnalysisRulePayload = {
      rule_type_id: formValues.rule_type_id,
      name: formValues.name,
      description: formValues.description,
      default_severity: formValues.default_severity,
      is_enabled: true,
      config: formValues.config,
    }

    const response = await analysisRulesApi.createAnalysisRule(payload)
    rules.value = [...rules.value, response.data].sort((a, b) => a.name.localeCompare(b.name))
    showCreateForm.value = false
    resetCreateForm()
  } catch (err) {
    if (!applyCreateApiErrors(err)) {
      error.value = err instanceof Error ? err.message : 'Не удалось создать правило.'
    }
  } finally {
    saving.value = false
  }
})

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

    if (editingRule.value?.id === rule.id) {
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
        @click="toggleCreateForm"
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

      <div
        v-if="showCreateValidation && Object.keys(createErrors).length > 0"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        Исправьте ошибки в форме.
      </div>

      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="createSubmitAttempted = true; handleCreate($event)">
        <Field name="rule_type_id" v-slot="{ field }">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Тип правила:</span>
            <select
              v-bind="field"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="hasCreateFieldError('rule_type_id') ? 'border-red-300' : 'border-slate-300'"
              @change="onCreateTypeChange"
            >
              <option v-for="type in types" :key="type.id" :value="type.id">
                {{ type.name }}
              </option>
            </select>
            <ErrorMessage v-if="showCreateValidation" name="rule_type_id" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <Field name="name" v-slot="{ field }">
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-slate-700">Название:</span>
            <input
              v-bind="field"
              type="text"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="hasCreateFieldError('name') ? 'border-red-300' : 'border-slate-300'"
            >
            <ErrorMessage v-if="showCreateValidation" name="name" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <Field name="description" v-slot="{ field }">
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-slate-700">Описание:</span>
            <textarea
              v-bind="field"
              rows="2"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="hasCreateFieldError('description') ? 'border-red-300' : 'border-slate-300'"
            />
            <ErrorMessage v-if="showCreateValidation" name="description" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <Field name="default_severity" v-slot="{ field }">
          <label class="block md:col-span-2">
            <span class="mb-1 block text-sm font-medium text-slate-700">Критичность:</span>
            <select
              v-bind="field"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option v-for="option in severityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <ErrorMessage v-if="showCreateValidation" name="default_severity" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <template v-if="selectedCreateType">
          <label
            v-for="field in selectedCreateType.config_schema"
            :key="field.key"
            class="block md:col-span-2"
          >
            <span class="mb-1 block text-sm font-medium text-slate-700">{{ field.label }}</span>
            <Field
              v-if="field.type === 'integer'"
              :name="`config.${field.key}`"
              v-slot="{ value, handleChange }"
            >
              <input
                type="number"
                :value="value ?? ''"
                :min="field.min ?? 1"
                class="w-full rounded-xl border px-3 py-2 text-sm"
                :class="hasCreateFieldError(`config.${field.key}`) ? 'border-red-300' : 'border-slate-300'"
                @input="handleChange(($event.target as HTMLInputElement).value === '' ? undefined : Number(($event.target as HTMLInputElement).value))"
              >
            </Field>
            <Field
              v-else-if="field.type === 'keywords'"
              :name="`config.${field.key}`"
              v-slot="{ value, handleChange }"
            >
              <KeywordsChipsInput
                :model-value="parseKeywords(value)"
                :invalid="hasCreateFieldError(`config.${field.key}`)"
                @update:model-value="handleChange"
              />
            </Field>
            <ErrorMessage v-if="showCreateValidation" :name="`config.${field.key}`" class="mt-1 block text-xs text-red-600" />
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
                <SeverityBadge
                  :severity="rule.default_severity"
                  :label="rule.default_severity_label"
                  size="sm"
                />
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

    <AnalysisRuleEditModal
      v-if="editingRule"
      :key="editingRule.id"
      :rule="editingRule"
      :rule-type="editingRuleType"
      @saved="onRuleSaved"
      @cancel="cancelEdit"
    />
  </AppLayout>
</template>
