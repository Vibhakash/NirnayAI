import { create } from 'zustand'
import { authAPI } from '@/services/api'

export interface User {
  id: string
  email: string
  full_name: string
  role: string
  organization?: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  isAuthenticated: boolean

  // Actions
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearError: () => void
  initializeAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authAPI.login(email, password)
      const { access_token, user } = response.data

      // Store token and user
      localStorage.setItem('auth_token', access_token)
      localStorage.setItem('user', JSON.stringify(user))

      set({
        token: access_token,
        user,
        isAuthenticated: true,
        isLoading: false,
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Login failed. Please check your credentials.'
      set({
        error: errorMessage,
        isLoading: false,
        isAuthenticated: false,
      })
      throw error
    }
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user')
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      error: null,
    })
  },

  setUser: (user: User | null) => {
    set({ user })
  },

  setToken: (token: string | null) => {
    set({ token })
  },

  clearError: () => {
    set({ error: null })
  },

  initializeAuth: () => {
    const token = localStorage.getItem('auth_token')
    const userStr = localStorage.getItem('user')

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr)
        set({
          token,
          user,
          isAuthenticated: true,
        })
      } catch (error) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user')
        set({
          token: null,
          user: null,
          isAuthenticated: false,
        })
      }
    }
  },
}))
