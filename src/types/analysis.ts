export type AnalysisSeverity = 'high' | 'medium' | 'low'

export interface AnalysisEvent {
  id: number
  analysis_rule_id: number
  rule_name: string
  severity: AnalysisSeverity
  severity_label: string
  title: string
  description: string
  message_ids: number[]
  context: Record<string, unknown> | null
  detected_at: string
}

export interface DialogueAnalysisResponse {
  dialogue_id: number
  total: number
  analyzed_at: string
  data: AnalysisEvent[]
}
