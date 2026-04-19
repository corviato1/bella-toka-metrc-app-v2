import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      // 🔥 REAL LOGIN (CALLS BACKEND)
      login: async (username, password) => {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ username, password }),
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data.error || 'Login failed')
        }

        set({
          isAuthenticated: true,
          user: data.user,
          token: data.token,
        })
      },

      logout: async () => {
        try {
          await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
          })
        } catch {}

        set({ isAuthenticated: false, user: null, token: null })
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        token: state.token,
      }),
    }
  )
)