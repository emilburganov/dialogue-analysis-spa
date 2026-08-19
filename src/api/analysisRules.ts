import { apiRequest } from '@/api/client'
import type { AnalysisRule, AnalysisRulePayload, AnalysisRuleType } from '@/types/analysisRule'

interface ListResponse<T> {
  data: T[]
}

export function fetchAnalysisRuleTypes(): Promise<ListResponse<AnalysisRuleType>> {
  return apiRequest('/analysis-rules/types')
}

export function fetchAnalysisRules(): Promise<ListResponse<AnalysisRule>> {
  return apiRequest('/analysis-rules')
}

export function createAnalysisRule(payload: AnalysisRulePayload): Promise<{ data: AnalysisRule }> {
  return apiRequest('/analysis-rules', {
    method: 'POST',
    body: payload,
  })
}

export function updateAnalysisRule(id: number, payload: AnalysisRulePayload): Promise<{ data: AnalysisRule }> {
  return apiRequest(`/analysis-rules/${id}`, {
    method: 'PUT',
    body: payload,
  })
}

export function toggleAnalysisRule(id: number): Promise<{ data: AnalysisRule }> {
  return apiRequest(`/analysis-rules/${id}/toggle`, {
    method: 'PATCH',
  })
}

export function deleteAnalysisRule(id: number): Promise<void> {
  return apiRequest(`/analysis-rules/${id}`, {
    method: 'DELETE',
  })
}
