export type DialogueResult = 'bought' | 'not_bought'

export interface DialogueListItem {
  id: number
  manager_name: string
  client_name: string
  last_message_at: string
  preview: string
  result?: DialogueResult
  result_label?: string
  deleted_by_client?: boolean
}

export interface Message {
  id: number
  sender: 'manager' | 'client'
  sender_label: string
  body: string
  sent_at: string
}

export interface DialogueDetail {
  id: number
  manager_name: string
  client_name: string
  can_send_messages: boolean
  messages: Message[]
  result?: DialogueResult
  result_label?: string
  deleted_by_client?: boolean
}

export interface DialoguesResponse {
  data: DialogueListItem[]
}
