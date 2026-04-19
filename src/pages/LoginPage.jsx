import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)

  const [selectedUser, setSelectedUser] = useState('mike')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleLogin = async () => {
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: selectedUser,   // 🔴 THIS IS CRITICAL
          password: password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      login(data) // store token + user

    } catch (err) {
      setError('Network error')
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-green-600 rounded-xl flex items-center justify-center text-white font-bold">
            BT
          </div>
          <h1 className="text-xl mt-2">Bella Toka</h1>
          <p className="text-sm opacity-70">Plant Management System</p>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl space-y-4">

          <p>Who's signing in?</p>

          <div className="flex gap-2">
            <button
              className={`flex-1 p-3 rounded-lg ${
                selectedUser === 'mike' ? 'bg-green-600' : 'bg-gray-800'
              }`}
              onClick={() => setSelectedUser('mike')}
            >
              Mike
            </button>

            <button
              className={`flex-1 p-3 rounded-lg ${
                selectedUser === 'carmen' ? 'bg-green-600' : 'bg-gray-800'
              }`}
              onClick={() => setSelectedUser('carmen')}
            >
              Carmen
            </button>
          </div>

          <input
            type="password"
            placeholder="Password"
            className="w-full p-3 rounded bg-gray-800"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && (
            <div className="bg-red-900 p-2 rounded text-sm">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            className="w-full bg-green-600 p-3 rounded"
          >
            Sign In
          </button>

        </div>
      </div>
    </div>
  )
}