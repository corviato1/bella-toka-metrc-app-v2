import { create } from 'zustand'

const STORAGE_KEY = 'bella_auth'

function save(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function clear() {
  localStorage.removeItem(STORAGE_KEY)
}

export const useAuthStore = create((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  expiresAt: null,

  hydrate: () => {
    const saved = load()
    if (!saved) return

    const now = Date.now()

    if (saved.expiresAt && now > saved.expiresAt) {
      clear()
      return
    }

    set({
      user: saved.user,
      token: saved.token,
      isAuthenticated: true,
      expiresAt: saved.expiresAt,
    })
  },

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

    const expiresAt = Date.now() + (24 * 60 * 60 * 1000)

    const payload = {
      user: data.user,
      token: data.token,
      expiresAt,
    }

    save(payload)

    set({
      user: data.user,
      token: data.token,
      isAuthenticated: true,
      expiresAt,
    })

    return data
  },

  logout: () => {
    clear()

    set({
      user: null,
      token: null,
      isAuthenticated: false,
      expiresAt: null,
    })
  },
}))