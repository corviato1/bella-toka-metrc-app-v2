import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

function PhotoIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  )
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function HistoryPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/biowaste/reports')
      setReports(res.reports || [])
    } catch (e) {
      setError(e.message || 'Failed to load history')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Report History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading ? 'Loading…' : `${reports.length} biowaste report${reports.length === 1 ? '' : 's'}`}
            </p>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="btn-secondary text-sm py-2 px-4"
          >
            Refresh
          </button>
        </div>

        {error && (
          <div className="card border-2 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-300">No reports yet</p>
            <p className="text-sm mt-1">Submitted biowaste reports will appear here.</p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          {reports.map((r) => (
            <div
              key={r.id}
              className="card flex items-center gap-4 p-3"
            >
              <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-gray-200 dark:bg-charcoal-700 border border-gray-200 dark:border-charcoal-600 overflow-hidden flex items-center justify-center text-gray-400 dark:text-gray-500 relative">
                <PhotoIcon />
                {r.photo_path && (
                  <img
                    src={r.photo_path}
                    alt="Biowaste"
                    className="absolute inset-0 w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                  />
                )}
              </div>

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-4 gap-2 sm:gap-4 items-center">
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Date</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {formatDate(r.reported_at)}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Location</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {r.location_name}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Weight</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {Number(r.weight_value).toLocaleString(undefined, { maximumFractionDigits: 3 })} {r.weight_unit}
                  </p>
                </div>
                <div className="min-w-0 flex sm:justify-end">
                  {r.metrc_submitted ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      METRC Submitted
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
                      Not Submitted
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
