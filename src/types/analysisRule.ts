export type AnalysisSeverity = 'high' | 'medium' | 'low'

export interface AnalysisRuleConfigField {
  key: string
  label: string
  type: 'integer' | 'keywords'
  default?: string | number | string[]
  min?: number
}

export interface AnalysisRuleType {
  type: string
  name: string
  description: string
  default_severity: AnalysisSeverity
  config_schema: AnalysisRuleConfigField[]
}

export interface AnalysisRule {
  id: number
  slug: string
  rule_type: string
  name: string
  description: string | null
  default_severity: AnalysisSeverity
  default_severity_label: string
  is_enabled: boolean
  is_system: boolean
  config: Record<string, unknown> | null
  type_name: string
  type_description: string
}

export interface AnalysisRulePayload {
  slug?: string
  rule_type?: string
  name: string
  description?: string | null
  default_severity?: AnalysisSeverity
  is_enabled?: boolean
  config?: Record<string, unknown>
}

export const severityOptions: { value: AnalysisSeverity; label: string }[] = [
  { value: 'high', label: 'Высокая' },
  { value: 'medium', label: 'Средняя' },
  { value: 'low', label: 'Низкая' },
]
