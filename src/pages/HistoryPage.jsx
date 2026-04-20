import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function HistoryPage() {
  const [rows, setRows] = useState([])
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/api/history')
      setRows(res)
    } catch (e) {
      setMsg(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 space-y-2">
      {msg && <div>{msg}</div>}

      {rows.map((r, i) => (
        <div key={i} className="bg-gray-800 p-2 rounded text-sm">
          <div>{r.created_at}</div>
          <div>{r.plant_metrc_tag}</div>
          <div>{r.from_location} → {r.to_location}</div>
          <div>{r.username}</div>
        </div>
      ))}
    </div>
  )
}