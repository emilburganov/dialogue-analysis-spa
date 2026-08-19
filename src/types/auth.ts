export type UserRole = 'admin' | 'manager' | 'client'

export interface User {
  id: number
  name: string
  email: string
  role: UserRole
  role_label: string
}

export interface AuthResponse {
  user: User
  token: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface ApiError {
  message: string
  errors?: Record<string, string[]>
}
