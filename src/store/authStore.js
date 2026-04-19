import { create } from 'zustand'

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,

  login: async (username, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })

    const data = await res.json()

    if (!res.ok) {
      throw new Error(data.error || 'Login failed')
    }

    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
    })

    return data
  },

  logout: async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      })
    } catch {}

    set({
      user: null,
      token: null,
      isAuthenticated: false,
    })
  },
}))