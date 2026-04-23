import React from 'react'
import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  const tabs = [
    { to: '/', label: 'Biowaste' },
    { to: '/move', label: 'Move' },
    { to: '/where', label: 'Map' },
    { to: '/history', label: 'History' },
    { to: '/offline', label: 'Offline' },
  ]

  return (
    <div className="flex flex-col min-h-screen">

      {/* HEADER */}
      <header className="bg-gray-900 text-white p-2 flex overflow-x-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            className="px-3 py-2 whitespace-nowrap"
          >
            {tab.label}
          </NavLink>
        ))}
      </header>

      {/* CONTENT */}
      <main className="flex-1 overflow-y-auto p-2">
        <Outlet />
      </main>

    </div>
  )
}