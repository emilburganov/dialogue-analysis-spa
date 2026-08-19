import { defineStore } from 'pinia'
import * as authApi from '@/api/auth'
import { setToken } from '@/api/client'
import type { LoginPayload, User } from '@/types/auth'

interface AuthState {
  user: User | null
  initialized: boolean
  loading: boolean
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    loading: false,
  }),

  getters: {
    isAuthenticated: (state) => state.user !== null,
  },

  actions: {
    async initialize(): Promise<void> {
      if (this.initialized) {
        return
      }

      try {
        this.user = await authApi.fetchMe()
      } catch {
        setToken(null)
        this.user = null
      } finally {
        this.initialized = true
      }
    },

    async login(payload: LoginPayload): Promise<void> {
      this.loading = true

      try {
        const response = await authApi.login(payload)
        setToken(response.token)
        this.user = response.user
      } finally {
        this.loading = false
      }
    },

    async logout(): Promise<void> {
      try {
        await authApi.logout()
      } finally {
        setToken(null)
        this.user = null
      }
    },
  },
})
