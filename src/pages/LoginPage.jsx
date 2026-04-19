import React, { useState } from 'react'
import { useAuthStore } from '../store/authStore'

export default function LoginPage() {
  const login = useAuthStore((s) => s.login)

  const [user, setUser] = useState('mike')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async () => {
    try {
      setError('')
      await login(user, password)
    } catch (e) {
      setError(e.message || 'Login failed')
    }
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="space-y-4 w-80">

        <h1 className="text-xl text-center font-bold">
          Bella Toka Login
        </h1>

        {/* USER SELECT */}
        <div className="flex gap-2">
          <button
            onClick={() => setUser('mike')}
            className={`flex-1 p-2 rounded ${
              user === 'mike'
                ? 'bg-green-600'
                : 'bg-gray-700'
            }`}
          >
            Mike
          </button>

          <button
            onClick={() => setUser('carmen')}
            className={`flex-1 p-2 rounded ${
              user === 'carmen'
                ? 'bg-green-600'
                : 'bg-gray-700'
            }`}
          >
            Carmen
          </button>
        </div>

        {/* PASSWORD INPUT */}
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            className="w-full p-2 pr-16 bg-gray-800 rounded"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-gray-400 hover:text-white"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>

        {/* ERROR */}
        {error && (
          <div className="text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* LOGIN BUTTON */}
        <button
          onClick={handleLogin}
          className="w-full bg-green-600 p-2 rounded font-semibold"
        >
          Login
        </button>

      </div>
    </div>
  )
}