import React, { useState, useRef, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
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

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  )
}

export default function Layout() {
  const { user, logout } = useAuthStore()
  const { theme, toggleTheme } = useThemeStore()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleLogout = async () => {
    setMenuOpen(false)
    await logout()
    navigate('/login')
  }

  const tabs = [
    { to: '/', label: 'Report Biowaste', end: true },
    { to: '/move', label: 'Move Plants' },
    { to: '/where', label: 'What is Where' },
  ]

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <header className="h-14 flex-shrink-0 bg-white dark:bg-charcoal-800 border-b border-gray-200 dark:border-charcoal-600 flex items-center px-4 gap-4">
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-sage-500 flex items-center justify-center text-white font-bold text-xs select-none">BT</div>
          <span className="font-bold text-gray-900 dark:text-gray-100 text-sm whitespace-nowrap">Bella Toka</span>
        </div>

        <nav className="flex-1 flex items-center justify-center gap-1">
          {tabs.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) => `nav-tab ${isActive ? 'active' : ''}`}
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="btn-ghost p-2 rounded-xl"
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="btn-ghost flex items-center gap-1.5 px-3 py-2"
            >
              <span className="text-sm font-medium capitalize">{user?.username || 'User'}</span>
              <ChevronDownIcon />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-charcoal-800 border border-gray-200 dark:border-charcoal-600 rounded-xl shadow-lg z-50 overflow-hidden">
                <div className="px-4 py-2 border-b border-gray-100 dark:border-charcoal-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Signed in as</p>
                  <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 capitalize">{user?.username}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  )
}
