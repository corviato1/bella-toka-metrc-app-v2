import React, { useEffect, useState } from 'react'
import { api } from '../api/client'
import FacilityMap from '../components/FacilityMap'

export default function WhereIsWhatPage() {
  const [data, setData] = useState({})
  const [msg, setMsg] = useState('')

  const load = async () => {
    try {
      const res = await api.get('/api/where')
      setData(res)
    } catch (e) {
      setMsg(e.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="p-4 space-y-4">
      <button onClick={load} className="bg-blue-600 px-4 py-2 rounded">
        Refresh Map
      </button>

      {msg && <div>{msg}</div>}

      <FacilityMap data={data || {}} />
    </div>
  )
}