import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)

  const [selectedUser, setSelectedUser] = useState('mike')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const users = [
    { id: 'mike', label: 'Mike', initial: 'M' },
    { id: 'carmen', label: 'Carmen', initial: 'C' },
  ]

  async function handleLogin() {
    setError(null)
    setLoading(true)

    try {
      await login(selectedUser, password)
      // no manual redirect needed — router handles it
    } catch (err) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6">

        <div className="text-center">
          <div className="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
            <span className="text-white font-bold text-lg">BT</span>
          </div>
          <h1 className="text-xl font-semibold">Bella Toka</h1>
          <p className="text-sm text-gray-400">Plant Management System</p>
        </div>

        <div className="card space-y-4">

          <div className="text-sm text-gray-400">Who's signing in?</div>

          <div className="flex gap-3">
            {users.map((u) => (
              <button
                key={u.id}
                onClick={() => setSelectedUser(u.id)}
                className={`flex-1 p-4 rounded-xl border transition ${
                  selectedUser === u.id
                    ? 'bg-green-600 text-white border-green-600'
                    : 'bg-transparent border-gray-700'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-black/30 flex items-center justify-center mx-auto mb-1">
                  {u.initial}
                </div>
                <div>{u.label}</div>
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <div className="text-sm text-gray-400">Password</div>

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-12"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
              {error}
            </div>
          )}

          <button
            onClick={handleLogin}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

        </div>

        <p className="text-xs text-gray-500 text-center">
          Restricted access — authorized personnel only
        </p>

      </div>
    </div>
  )
}