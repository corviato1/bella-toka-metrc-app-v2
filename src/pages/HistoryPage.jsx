import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function HistoryPage() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    location: '',
    reporter: '',
  })

  const load = async () => {
    try {
      const query = new URLSearchParams(filters).toString()
      const res = await api.get(`/api/history?${query}`)
      setRows(res)
    } catch (e) {
      setMsg(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const exportCSV = () => {
    const header = ['Date', 'Location', 'Tags', 'User']

    const csv = [
      header.join(','),
      ...rows.map(r =>
        [
          r.created_at,
          r.location,
          (r.labels || []).join('|'),
          r.username,
        ].join(',')
      )
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'history.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 space-y-4">

      {/* FILTER BAR */}
      <div className="card flex flex-wrap gap-2">

        <input
          type="date"
          className="input-field"
          onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
        />

        <input
          type="date"
          className="input-field"
          onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
        />

        <input
          placeholder="Location"
          className="input-field"
          onChange={(e) => setFilters(f => ({ ...f, location: e.target.value }))}
        />

        <input
          placeholder="User"
          className="input-field"
          onChange={(e) => setFilters(f => ({ ...f, reporter: e.target.value }))}
        />

        <button onClick={load} className="btn-primary">
          Apply Filters
        </button>

        <button onClick={exportCSV} className="btn-secondary">
          Export CSV
        </button>

      </div>

      {/* ERROR */}
      {msg && <div className="text-red-400">{msg}</div>}

      {/* TABLE */}
      <div className="card overflow-auto">

        {rows.length === 0 && (
          <div className="text-center text-gray-400 py-10">
            No reports yet
          </div>
        )}

        {rows.map((r, i) => (
          <div key={i} className="border-b border-gray-700 py-2 text-sm">

            <div>{new Date(r.created_at).toLocaleString()}</div>
            <div>{r.location}</div>
            <div className="text-xs text-gray-400">
              {(r.labels || []).join(', ')}
            </div>
            <div>{r.username}</div>

          </div>
        ))}

      </div>

    </div>
  )
}