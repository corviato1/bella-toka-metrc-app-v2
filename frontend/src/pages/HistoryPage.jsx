import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function HistoryPage() {
  const [movements, setMovements] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 20

  const load = async (pg = 1, q = search) => {
    setLoading(true)
    setError('')
    try {
      const params = new URLSearchParams({ limit: PAGE_SIZE, offset: (pg - 1) * PAGE_SIZE })
      if (q) params.set('search', q)
      const res = await api.get(`/api/movements/history?${params}`)
      setMovements(res.movements || [])
      setTotal(res.total || 0)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(1, '') }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    setPage(1)
    load(1, search)
  }

  const handlePage = (pg) => {
    setPage(pg)
    load(pg, search)
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Movement History</h2>
        <p className="text-sm text-gray-500 mt-0.5">All plant movements and location changes</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          className="input-field flex-1"
          placeholder="Search by plant tag, location, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button type="submit" className="btn-secondary px-5">Search</button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setPage(1); load(1, '') }}
            className="btn-secondary px-4"
          >
            Clear
          </button>
        )}
      </form>

      {error && (
        <div className="card border-red-800 bg-red-900/20 text-red-400 text-sm">{error}</div>
      )}

      <div className="card overflow-hidden p-0">
        <div className="px-5 py-4 border-b border-charcoal-700 flex items-center justify-between">
          <h3 className="font-semibold text-gray-100">Results</h3>
          <span className="text-sm text-gray-500">{total} movement{total !== 1 ? 's' : ''}</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <svg className="animate-spin h-6 w-6 text-sage-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        ) : movements.length === 0 ? (
          <p className="text-gray-500 text-sm py-10 text-center">No movements found</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-gray-500 uppercase tracking-wide border-b border-charcoal-700">
                    <th className="px-5 py-3 text-left">Plant Tag</th>
                    <th className="px-5 py-3 text-left">From</th>
                    <th className="px-5 py-3 text-left">To</th>
                    <th className="px-5 py-3 text-left">User</th>
                    <th className="px-5 py-3 text-left">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr key={m.id} className="border-b border-charcoal-700 hover:bg-charcoal-700/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-gray-300 text-xs">{m.plant_metrc_tag || m.plant_id}</td>
                      <td className="px-5 py-3 text-gray-400">{m.from_location || '—'}</td>
                      <td className="px-5 py-3 text-sage-400 font-medium">{m.to_location}</td>
                      <td className="px-5 py-3 text-gray-500 text-xs">{m.user_email || '—'}</td>
                      <td className="px-5 py-3 text-gray-600 text-xs whitespace-nowrap">
                        {new Date(m.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="px-5 py-4 flex items-center justify-between border-t border-charcoal-700">
                <button
                  onClick={() => handlePage(page - 1)}
                  disabled={page <= 1}
                  className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                >
                  ← Prev
                </button>
                <span className="text-sm text-gray-500">Page {page} of {totalPages}</span>
                <button
                  onClick={() => handlePage(page + 1)}
                  disabled={page >= totalPages}
                  className="btn-secondary py-2 px-4 text-sm disabled:opacity-40"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
