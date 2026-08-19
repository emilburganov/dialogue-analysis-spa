import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import type { AnalysisRuleType, AnalysisSeverity } from '@/types/analysisRule'

export function parseKeywords(value: unknown): string[] {
  if (typeof value === 'string') {
    return value.split(',').map((item) => item.trim()).filter(Boolean)
  }

  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean)
  }

  return []
}

function buildConfigFieldsSchema(schema: AnalysisRuleType['config_schema']): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {}

  for (const field of schema) {
    if (field.type === 'integer') {
      const min = field.min ?? 1

      shape[field.key] = z.preprocess(
        (value) => {
          if (value === '' || value === null || value === undefined) {
            return undefined
          }

          if (typeof value === 'number' && Number.isNaN(value)) {
            return undefined
          }

          return value
        },
        z.number({ required_error: `${field.label}: укажите значение.` }).min(
          min,
          `${field.label}: минимальное значение ${min}.`,
        ),
      )
    }

    if (field.type === 'keywords') {
      shape[field.key] = z.preprocess(
        (value) => parseKeywords(value),
        z
          .array(z.string().trim().min(1))
          .min(1, `${field.label}: укажите хотя бы одно ключевое слово.`),
      )
    }
  }

  return z.object(shape)
}

export function buildConfigFromSchema(
  schema: AnalysisRuleType['config_schema'],
  source: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const config: Record<string, unknown> = {}

  for (const field of schema) {
    const existing = source?.[field.key]

    if (existing !== undefined) {
      config[field.key] = field.type === 'keywords'
        ? parseKeywords(existing)
        : existing
      continue
    }

    config[field.key] = field.type === 'keywords'
      ? parseKeywords(field.default ?? [])
      : (field.default ?? '')
  }

  return config
}

export function buildEditConfigFromSchema(
  schema: AnalysisRuleType['config_schema'],
  ruleConfig: Record<string, unknown> | null | undefined,
): Record<string, unknown> {
  const config: Record<string, unknown> = {}
  const source = ruleConfig ?? {}

  for (const field of schema) {
    const existing = source[field.key]

    if (field.type === 'keywords') {
      config[field.key] = parseKeywords(existing)
      continue
    }

    if (existing === undefined || existing === null || existing === '') {
      config[field.key] = undefined
      continue
    }

    config[field.key] = Number(existing)
  }

  return config
}

export function buildDefaultCreateFormValues(type: AnalysisRuleType | undefined): {
  rule_type_id: number
  name: string
  description: string
  default_severity: AnalysisSeverity
  is_enabled: boolean
  config: Record<string, unknown>
} {
  return {
    rule_type_id: type?.id ?? 0,
    name: type?.name ?? '',
    description: type?.description ?? '',
    default_severity: type?.default_severity ?? 'medium',
    is_enabled: true,
    config: buildConfigFromSchema(type?.config_schema ?? [], null),
  }
}

export function buildCreateRuleSchema(configSchema: AnalysisRuleType['config_schema']) {
  const baseShape = {
    rule_type_id: z.number().int().positive('Выберите тип правила.'),
    name: z
      .string()
      .trim()
      .min(1, 'Укажите название правила.')
      .max(255, 'Название не должно превышать 255 символов.'),
    description: z
      .string()
      .trim()
      .min(1, 'Укажите описание правила.')
      .max(5000, 'Описание не должно превышать 5000 символов.'),
    default_severity: z.enum(['high', 'medium', 'low']),
    config: buildConfigFieldsSchema(configSchema),
  }

  return toTypedSchema(z.object(baseShape))
}

export function buildUpdateRuleSchema(configSchema: AnalysisRuleType['config_schema']) {
  const baseShape = {
    name: z
      .string()
      .trim()
      .min(1, 'Укажите название правила.')
      .max(255, 'Название не должно превышать 255 символов.'),
    description: z
      .string()
      .trim()
      .min(1, 'Укажите описание правила.')
      .max(5000, 'Описание не должно превышать 5000 символов.'),
    default_severity: z.enum(['high', 'medium', 'low']),
    config: buildConfigFieldsSchema(configSchema),
  }

  return toTypedSchema(z.object(baseShape))
}
