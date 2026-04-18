import React, { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useThemeStore } from '../store/themeStore'

function SunIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
    </svg>
  )
}

function MoonIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
    </svg>
  )
}

const USERS = [
  { username: 'mike', label: 'Mike' },
  { username: 'carmen', label: 'Carmen' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef(null)

  const selectUser = (u) => {
    setUsername(u)
    setError('')
    setTimeout(() => passwordRef.current?.focus(), 0)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!username) {
      setError('Please select a user.')
      return
    }
    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Login failed')
        return
      }

      login(data.user, data.token)
      navigate('/')
    } catch (err) {
      setError('Connection error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="h-full bg-gray-100 dark:bg-charcoal-900 flex items-center justify-center p-6 relative">
      <button
        onClick={toggleTheme}
        className="absolute top-4 right-4 btn-ghost p-2 rounded-xl"
        title="Toggle theme"
      >
        {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
      </button>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-sage-500 flex items-center justify-center text-white font-bold text-xl mx-auto mb-4 select-none">BT</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bella Toka</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Plant Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">Who's signing in?</label>
            <div className="grid grid-cols-2 gap-3">
              {USERS.map((u) => {
                const selected = username === u.username
                return (
                  <button
                    key={u.username}
                    type="button"
                    onClick={() => selectUser(u.username)}
                    className={
                      'h-24 rounded-2xl border-2 font-semibold text-lg transition-all flex flex-col items-center justify-center gap-1 ' +
                      (selected
                        ? 'border-sage-500 bg-sage-500 text-white shadow-md'
                        : 'border-gray-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-700 text-gray-800 dark:text-gray-200 hover:border-sage-400 hover:bg-sage-50 dark:hover:bg-charcoal-600')
                    }
                  >
                    <div className={
                      'w-10 h-10 rounded-full flex items-center justify-center text-base font-bold ' +
                      (selected ? 'bg-white/20 text-white' : 'bg-sage-100 dark:bg-charcoal-600 text-sage-700 dark:text-sage-400')
                    }>
                      {u.label[0]}
                    </div>
                    <span>{u.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Password</label>
            <input
              ref={passwordRef}
              type="password"
              className="input-field"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !username}
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
          Restricted access — authorized personnel only
        </p>
      </div>
    </div>
  )
}
