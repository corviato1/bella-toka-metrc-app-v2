import React, { useState } from 'react'
import { api } from '../api/client'

export default function MovePlantsPage() {
  const [locations, setLocations] = useState([])
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const refreshLocations = async () => {
    setLoading(true)
    setMsg('')
    try {
      const data = await api.get('/api/metrcLocations')
      setLocations(data)
      setMsg('Locations synced from METRC')
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 space-y-4">
      <button
        onClick={refreshLocations}
        className="bg-blue-600 px-4 py-2 rounded"
      >
        {loading ? 'Syncing...' : 'Refresh Locations'}
      </button>

      {msg && <div className="text-sm">{msg}</div>}

      <div className="grid grid-cols-2 gap-2">
        {locations.map((l, i) => (
          <div key={i} className="bg-gray-800 p-2 rounded">
            {l}
          </div>
        ))}
      </div>
    </div>
  )
}