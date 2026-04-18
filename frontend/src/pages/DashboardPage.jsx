import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api/client'

function StatCard({ label, value, sub }) {
  return (
    <div className="card flex flex-col gap-1">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-gray-100">{value ?? '—'}</p>
      {sub && <p className="text-xs text-gray-500">{sub}</p>}
    </div>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null)
  const [recentMovements, setRecentMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      try {
        const [plantsRes, movementsRes] = await Promise.all([
          api.get('/api/plants/list'),
          api.get('/api/movements/history?limit=5'),
        ])

        const plants = plantsRes.plants || []
        const locationCounts = {}
        plants.forEach((p) => {
          const loc = p.current_location || 'Unknown'
          locationCounts[loc] = (locationCounts[loc] || 0) + 1
        })

        setStats({
          total: plants.length,
          locations: locationCounts,
        })
        setRecentMovements(movementsRes.movements || [])
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-sage-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-gray-500 text-sm">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card border-red-800 bg-red-900/20 text-red-400">
        <p className="font-semibold">Failed to load dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-0.5">Overview of your facility</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Plants" value={stats?.total} />
        {Object.entries(stats?.locations || {}).slice(0, 3).map(([loc, count]) => (
          <StatCard key={loc} label={loc} value={count} sub="plants" />
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-100">Recent Movements</h3>
          <Link to="/history" className="text-sm text-sage-400 hover:text-sage-300">View all</Link>
        </div>

        {recentMovements.length === 0 ? (
          <p className="text-gray-500 text-sm py-4 text-center">No movements recorded yet</p>
        ) : (
          <div className="space-y-2">
            {recentMovements.map((m) => (
              <div key={m.id} className="flex items-center justify-between py-2.5 border-b border-charcoal-700 last:border-0">
                <div>
                  <p className="text-sm font-mono text-gray-300">{m.plant_metrc_tag || m.plant_id}</p>
                  <p className="text-xs text-gray-500">
                    {m.from_location || '?'} → {m.to_location}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">{m.user_email || 'Unknown'}</p>
                  <p className="text-xs text-gray-600">
                    {new Date(m.timestamp).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link to="/scanner" className="card hover:border-sage-500 transition-all duration-200 cursor-pointer block group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-sage-500/20 flex items-center justify-center text-sage-400 group-hover:bg-sage-500/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 0V6m0 0h2M3 16h2m-2 0v2m0-2h2" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">Scan Plants</h3>
              <p className="text-sm text-gray-500">Scan METRC tags and move plants</p>
            </div>
          </div>
        </Link>

        <Link to="/history" className="card hover:border-sage-500 transition-all duration-200 cursor-pointer block group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 group-hover:bg-blue-500/30 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-100">Movement History</h3>
              <p className="text-sm text-gray-500">Track plant movements and logs</p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
