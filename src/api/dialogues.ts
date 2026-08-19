import { apiRequest } from '@/api/client'
import type { DialogueAnalysisResponse } from '@/types/analysis'
import type { DialogueDetail, DialogueResult, DialoguesResponse, Message } from '@/types/dialogue'

export function fetchDialogues(): Promise<DialoguesResponse> {
  return apiRequest<DialoguesResponse>('/dialogues')
}

export function createDialogue(): Promise<DialogueDetail> {
  return apiRequest<DialogueDetail>('/dialogues', {
    method: 'POST',
  })
}

export function fetchDialogue(id: number): Promise<DialogueDetail> {
  return apiRequest<DialogueDetail>(`/dialogues/${id}`)
}

export function sendMessage(dialogueId: number, body: string): Promise<Message> {
  return apiRequest<Message>(`/dialogues/${dialogueId}/messages`, {
    method: 'POST',
    body: { body },
  })
}

export function updateDialogueResult(dialogueId: number, result: DialogueResult): Promise<DialogueDetail> {
  return apiRequest<DialogueDetail>(`/dialogues/${dialogueId}/result`, {
    method: 'PATCH',
    body: { result },
  })
}

export function deleteDialogue(dialogueId: number): Promise<void> {
  return apiRequest<void>(`/dialogues/${dialogueId}`, {
    method: 'DELETE',
  })
}

export function fetchDialogueAnalysis(dialogueId: number): Promise<DialogueAnalysisResponse> {
  return apiRequest<DialogueAnalysisResponse>(`/dialogues/${dialogueId}/analysis`)
}
