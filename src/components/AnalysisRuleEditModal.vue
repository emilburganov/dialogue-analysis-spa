<script setup lang="ts">
import { computed, ref, shallowRef } from 'vue'
import { ErrorMessage, Field, useForm } from 'vee-validate'
import * as analysisRulesApi from '@/api/analysisRules'
import KeywordsChipsInput from '@/components/KeywordsChipsInput.vue'
import {
  buildEditConfigFromSchema,
  buildUpdateRuleSchema,
  parseKeywords,
} from '@/schemas/analysisRuleSchema'
import type { AnalysisRule, AnalysisRulePayload, AnalysisRuleType } from '@/types/analysisRule'
import { severityOptions } from '@/types/analysisRule'
import { applyApiFieldErrors } from '@/utils/apiValidationError'

const props = defineProps<{
  rule: AnalysisRule
  ruleType: AnalysisRuleType | null
}>()

const emit = defineEmits<{
  saved: [rule: AnalysisRule]
  cancel: []
}>()

const submitAttempted = ref(false)
const localError = ref<string | null>(null)
const saving = ref(false)

const configSchema = props.ruleType?.config_schema ?? []
const validationSchema = shallowRef(buildUpdateRuleSchema(configSchema))

const {
  errors,
  handleSubmit,
  setFieldError,
} = useForm({
  validationSchema,
  initialValues: buildFormValues(props.rule, props.ruleType),
  validateOnMount: false,
})

const showValidation = computed(() => submitAttempted.value)

function buildFormValues(rule: AnalysisRule, ruleType: AnalysisRuleType | null) {
  return {
    name: rule.name,
    description: rule.description,
    default_severity: rule.default_severity,
    config: buildEditConfigFromSchema(ruleType?.config_schema ?? [], rule.config),
  }
}

function hasFieldError(field: string): boolean {
  return showValidation.value && Boolean(errors.value[field as keyof typeof errors.value])
}

const saveRule = handleSubmit(async (formValues) => {
  localError.value = null
  saving.value = true

  try {
    const payload: AnalysisRulePayload = {
      name: formValues.name,
      description: formValues.description,
      default_severity: formValues.default_severity,
      is_enabled: props.rule.is_enabled,
      config: formValues.config,
    }

    const response = await analysisRulesApi.updateAnalysisRule(props.rule.id, payload)
    emit('saved', response.data)
  } catch (err) {
    if (!applyApiFieldErrors(err, (field, message) => {
      setFieldError(field as 'name' | 'description' | 'default_severity' | `config.${string}`, message)
    })) {
      localError.value = err instanceof Error ? err.message : 'Не удалось сохранить правило.'
    }
  } finally {
    saving.value = false
  }
})

function handleFormSubmit(event: Event): void {
  submitAttempted.value = true
  void saveRule(event)
}
</script>

<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
    @click.self="emit('cancel')"
  >
    <div class="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
      <div class="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 class="text-lg font-semibold text-slate-900">
            Редактирование: {{ rule.name }}
          </h2>
          <p class="mt-1 text-sm text-slate-500">
            {{ rule.type_name }}
          </p>
        </div>
        <button
          type="button"
          class="rounded-lg px-2 py-1 text-slate-500 transition hover:bg-slate-100"
          @click="emit('cancel')"
        >
          ✕
        </button>
      </div>

      <div
        v-if="localError"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        {{ localError }}
      </div>

      <div
        v-if="showValidation && Object.keys(errors).length > 0"
        class="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        Исправьте ошибки в форме.
      </div>

      <form class="grid gap-4" @submit.prevent="handleFormSubmit">
        <Field name="name" v-slot="{ field }">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Название</span>
            <input
              v-bind="field"
              type="text"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="hasFieldError('name') ? 'border-red-300' : 'border-slate-300'"
            >
            <ErrorMessage v-if="showValidation" name="name" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <Field name="description" v-slot="{ field }">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Описание</span>
            <textarea
              v-bind="field"
              rows="3"
              class="w-full rounded-xl border px-3 py-2 text-sm"
              :class="hasFieldError('description') ? 'border-red-300' : 'border-slate-300'"
            />
            <ErrorMessage v-if="showValidation" name="description" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <Field name="default_severity" v-slot="{ field }">
          <label class="block">
            <span class="mb-1 block text-sm font-medium text-slate-700">Критичность</span>
            <select
              v-bind="field"
              class="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm"
            >
              <option v-for="option in severityOptions" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
            <ErrorMessage v-if="showValidation" name="default_severity" class="mt-1 block text-xs text-red-600" />
          </label>
        </Field>

        <template v-if="ruleType">
          <label
            v-for="field in ruleType.config_schema"
            :key="field.key"
            class="block"
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
                :class="hasFieldError(`config.${field.key}`) ? 'border-red-300' : 'border-slate-300'"
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
                :invalid="hasFieldError(`config.${field.key}`)"
                @update:model-value="handleChange"
              />
            </Field>
            <ErrorMessage v-if="showValidation" :name="`config.${field.key}`" class="mt-1 block text-xs text-red-600" />
          </label>
        </template>

        <div class="flex justify-end gap-3">
          <button
            type="button"
            class="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700"
            @click="emit('cancel')"
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
</template>
