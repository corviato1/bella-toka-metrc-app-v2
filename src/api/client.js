// Central API client with auth + safe JSON parsing

import { useAuthStore } from '../store/authStore'

async function request(url, options = {}) {
  const token = useAuthStore.getState().token

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, {
    ...options,
    headers,
  })

  const text = await res.text()

  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (e) {
    console.error('Invalid JSON from server:', text)
    throw new Error('Server returned invalid response')
  }

  if (!res.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export const api = {
  get: (url) => request(url),
  post: (url, body) =>
    request(url, {
      method: 'POST',
      body: JSON.stringify(body),
    }),
}