import React, { useEffect, useState, useCallback } from 'react'
import { api } from '../api/client'

const SYNC_KEY = 'bt-last-plant-sync'
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function SyncIcon({ spinning }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function PlantIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21V12m0 0C12 7 8 5 4 6c0 4 2 8 8 9m0-9c0-5 4-7 8-6 0 4-2 8-8 9" />
    </svg>
  )
}

function formatRelative(dateStr) {
  if (!dateStr) return 'No movements yet'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function formatSyncTime(ts) {
  if (!ts) return 'Never'
  const d = new Date(ts)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  if (days === 1) return 'Yesterday'
  return d.toLocaleDateString()
}

export default function WhereIsWhatPage() {
  const [summary, setSummary] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')
  const [lastSync, setLastSync] = useState(null)
  const [dbLastSync, setDbLastSync] = useState(null)

  const loadSummary = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/plants/summary')
      setSummary(res.summary || [])
      setDbLastSync(res.lastSync || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const doSync = useCallback(async (manual = false) => {
    setSyncing(true)
    setSyncError('')
    try {
      await api.get('/api/metrc/plants/sync')
      const now = Date.now()
      localStorage.setItem(SYNC_KEY, String(now))
      setLastSync(now)
      await loadSummary()
    } catch (err) {
      if (manual) setSyncError(err.message || 'Sync failed')
    } finally {
      setSyncing(false)
    }
  }, [loadSummary])

  useEffect(() => {
    const stored = localStorage.getItem(SYNC_KEY)
    const ts = stored ? parseInt(stored) : null
    setLastSync(ts)

    loadSummary()

    if (!ts || Date.now() - ts > SEVEN_DAYS_MS) {
      doSync(false)
    }
  }, [])

  const totalPlants = summary.reduce((sum, s) => sum + s.plantCount, 0)

  return (
    <div className="h-full flex flex-col p-4 gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">What is Where</h2>
          <p className="text-sm text-gray-400 dark:text-gray-500">
            {totalPlants} total plant{totalPlants !== 1 ? 's' : ''} · {summary.length} section{summary.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <p className="text-xs text-gray-400 dark:text-gray-500">Last METRC sync</p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {lastSync ? formatSyncTime(lastSync) : dbLastSync ? formatSyncTime(dbLastSync) : 'Never'}
            </p>
          </div>
          <button
            onClick={() => doSync(true)}
            disabled={syncing || loading}
            className="btn-secondary flex items-center gap-2 py-2 px-4 text-sm"
          >
            <SyncIcon spinning={syncing} />
            {syncing ? 'Syncing…' : 'Sync from METRC'}
          </button>
        </div>
      </div>

      {syncError && (
        <p className="text-sm text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-4 py-2 flex-shrink-0">
          METRC not configured — {syncError}
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl px-4 py-2 flex-shrink-0">
          {error}
        </p>
      )}

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <svg className="animate-spin h-7 w-7 text-sage-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
        ) : summary.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-3">
            <PlantIcon />
            <p className="text-sm">No sections found. Add locations and sync.</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 xl:grid-cols-4 gap-4 content-start pb-2">
            {summary.map((section) => (
              <div
                key={section.id}
                className="card flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-800 dark:text-gray-200 text-sm leading-tight">{section.name}</h3>
                  <div className="w-7 h-7 rounded-lg bg-sage-500/15 dark:bg-sage-500/10 flex items-center justify-center text-sage-600 dark:text-sage-400 flex-shrink-0">
                    <PlantIcon />
                  </div>
                </div>
                <div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{section.plantCount}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">plant{section.plantCount !== 1 ? 's' : ''}</p>
                </div>
                <div className="border-t border-gray-100 dark:border-charcoal-700 pt-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Last moved in</p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mt-0.5">
                    {formatRelative(section.lastMovement)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
