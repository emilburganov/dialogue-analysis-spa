import { apiRequest } from '@/api/client'
import type { AuthResponse, LoginPayload, User } from '@/types/auth'

export function login(payload: LoginPayload): Promise<AuthResponse> {
  return apiRequest<AuthResponse>('/login', {
    method: 'POST',
    body: payload,
    auth: false,
  })
}

export function logout(): Promise<void> {
  return apiRequest<void>('/logout', {
    method: 'POST',
  })
}

export function fetchMe(): Promise<User> {
  return apiRequest<User>('/me')
}
