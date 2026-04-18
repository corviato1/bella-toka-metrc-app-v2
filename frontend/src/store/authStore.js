import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      isAuthenticated: false,
      user: null,
      token: null,

      login: (user, token) => set({ isAuthenticated: true, user, token }),

      logout: async () => {
        try {
          await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
        } catch (e) {
          // ignore
        }
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
