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

const PAGE_SIZE = 25

const emptyFilters = {
  startDate: '',
  endDate: '',
  location: '',
  metrcStatus: 'all',
  reporter: '',
}

function localDayBound(dateStr, endOfDay) {
  // dateStr is "YYYY-MM-DD" from <input type="date">. Build the boundary in
  // the user's local timezone so a "day" matches what they see on the calendar.
  const [y, m, d] = dateStr.split('-').map(Number)
  if (!y || !m || !d) return null
  return endOfDay
    ? new Date(y, m - 1, d, 23, 59, 59, 999)
    : new Date(y, m - 1, d, 0, 0, 0, 0)
}

function buildQuery(filters, offset, limit) {
  const params = new URLSearchParams()
  if (filters.startDate) {
    const start = localDayBound(filters.startDate, false)
    if (start) params.set('startDate', start.toISOString())
  }
  if (filters.endDate) {
    const end = localDayBound(filters.endDate, true)
    if (end) params.set('endDate', end.toISOString())
  }
  if (filters.location) params.set('location', filters.location)
  if (filters.metrcStatus && filters.metrcStatus !== 'all') params.set('metrcStatus', filters.metrcStatus)
  if (filters.reporter.trim()) params.set('reporter', filters.reporter.trim())
  params.set('limit', String(limit))
  params.set('offset', String(offset))
  return params.toString()
}

export default function HistoryPage() {
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [locations, setLocations] = useState([])
  const [filters, setFilters] = useState(emptyFilters)
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters)

  useEffect(() => {
    api.get('/api/locations')
      .then((res) => setLocations(res.locations || []))
      .catch(() => {})
  }, [])

  const load = useCallback(async (filtersToUse) => {
    setLoading(true)
    setError('')
    try {
      const qs = buildQuery(filtersToUse, 0, PAGE_SIZE)
      const res = await api.get(`/api/biowaste/reports?${qs}`)
      setReports(res.reports || [])
      setTotal(res.total || 0)
      setHasMore(!!res.hasMore)
    } catch (e) {
      setError(e.message || 'Failed to load history')
      setReports([])
      setTotal(0)
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load(appliedFilters)
  }, [load, appliedFilters])

  const loadMore = async () => {
    setLoadingMore(true)
    setError('')
    try {
      const qs = buildQuery(appliedFilters, reports.length, PAGE_SIZE)
      const res = await api.get(`/api/biowaste/reports?${qs}`)
      setReports((prev) => [...prev, ...(res.reports || [])])
      setTotal(res.total || 0)
      setHasMore(!!res.hasMore)
    } catch (e) {
      setError(e.message || 'Failed to load more')
    } finally {
      setLoadingMore(false)
    }
  }

  const onApply = (e) => {
    e.preventDefault()
    setAppliedFilters(filters)
  }

  const onReset = () => {
    setFilters(emptyFilters)
    setAppliedFilters(emptyFilters)
  }

  const updateFilter = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const filtersDirty = JSON.stringify(filters) !== JSON.stringify(appliedFilters)
  const hasActiveFilters = JSON.stringify(appliedFilters) !== JSON.stringify(emptyFilters)

  return (
    <div className="h-full overflow-auto p-4">
      <div className="max-w-5xl mx-auto flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Report History</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
              {loading
                ? 'Loading…'
                : `Showing ${reports.length} of ${total} biowaste report${total === 1 ? '' : 's'}${hasActiveFilters ? ' (filtered)' : ''}`}
            </p>
          </div>
          <button
            onClick={() => load(appliedFilters)}
            disabled={loading}
            className="btn-secondary text-sm py-2 px-4"
          >
            Refresh
          </button>
        </div>

        <form onSubmit={onApply} className="card grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4">
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Start date
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => updateFilter('startDate', e.target.value)}
              className="input text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            End date
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => updateFilter('endDate', e.target.value)}
              className="input text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Location
            <select
              value={filters.location}
              onChange={(e) => updateFilter('location', e.target.value)}
              className="input text-sm"
            >
              <option value="">All locations</option>
              {locations.map((l) => (
                <option key={l.id} value={l.name}>{l.name}</option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            METRC status
            <select
              value={filters.metrcStatus}
              onChange={(e) => updateFilter('metrcStatus', e.target.value)}
              className="input text-sm"
            >
              <option value="all">All</option>
              <option value="submitted">Submitted</option>
              <option value="not_submitted">Not submitted</option>
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400">
            Reporter
            <input
              type="text"
              value={filters.reporter}
              onChange={(e) => updateFilter('reporter', e.target.value)}
              placeholder="username"
              className="input text-sm"
            />
          </label>
          <div className="sm:col-span-2 lg:col-span-5 flex flex-wrap items-center gap-2 justify-end">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="btn-secondary text-sm py-2 px-4"
              >
                Clear filters
              </button>
            )}
            <button
              type="submit"
              disabled={!filtersDirty && !hasActiveFilters}
              className="btn-primary text-sm py-2 px-4 disabled:opacity-50"
            >
              Apply filters
            </button>
          </div>
        </form>

        {error && (
          <div className="card border-2 border-red-400 dark:border-red-600 text-red-600 dark:text-red-400 text-sm">
            {error}
          </div>
        )}

        {!loading && !error && reports.length === 0 && (
          <div className="card text-center py-12 text-gray-500 dark:text-gray-400">
            <p className="font-semibold text-gray-700 dark:text-gray-300">
              {hasActiveFilters ? 'No reports match your filters' : 'No reports yet'}
            </p>
            <p className="text-sm mt-1">
              {hasActiveFilters
                ? 'Try adjusting or clearing your filters.'
                : 'Submitted biowaste reports will appear here.'}
            </p>
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

              <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-5 gap-2 sm:gap-4 items-center">
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
                <div className="min-w-0">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Reporter</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                    {r.reported_by || '—'}
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

        {!loading && hasMore && (
          <div className="flex justify-center pt-2 pb-4">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="btn-secondary text-sm py-2 px-6"
            >
              {loadingMore ? 'Loading…' : 'Load more'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
