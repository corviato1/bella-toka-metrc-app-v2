import { useAuthStore } from '../store/authStore'

async function request(path, options = {}) {
  const { token } = useAuthStore.getState()

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(path, {
    ...options,
    headers,
    credentials: 'include',
  })

  if (response.status === 401) {
    useAuthStore.getState().logout()
    throw new Error('Session expired.')
  }

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
}