import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function MovePlantsPage() {
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedLocation, setSelectedLocation] = useState('')
  const [scannedTags, setScannedTags] = useState([])
  const [input, setInput] = useState('')

  const loadLocations = async () => {
    setLoading(true)
    setError('')

    try {
      const res = await api.get('/api/locations')

      // 🔥 CRITICAL FIX — normalize to array
      let locArray = []

      if (Array.isArray(res)) {
        locArray = res
      } else if (res && typeof res === 'object') {
        locArray = Object.values(res)
      }

      setLocations(locArray)

      if (locArray.length > 0) {
        setSelectedLocation(locArray[0].name || locArray[0])
      }

    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  const handleScan = (e) => {
    if (e.key === 'Enter' && input.trim()) {
      setScannedTags((prev) => [...prev, input.trim()])
      setInput('')
    }
  }

  const handleSubmit = async () => {
    try {
      await api.post('/api/movePlants', {
        tags: scannedTags,
        to_location: selectedLocation,
      })

      setScannedTags([])
      alert('Moved successfully')

    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="p-4 flex flex-col gap-4 h-full">

      <h2 className="text-lg font-bold">Move Plants</h2>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      {loading ? (
        <div>Loading...</div>
      ) : (
        <>
          {/* LOCATION SELECT */}
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="p-3 rounded bg-gray-800"
          >
            {locations.map((loc, i) => {
              const name = loc.name || loc
              return (
                <option key={i} value={name}>
                  {name}
                </option>
              )
            })}
          </select>

          {/* SCAN INPUT */}
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleScan}
            placeholder="Scan METRC tag..."
            className="p-3 rounded bg-gray-800"
          />

          {/* TAG LIST */}
          <div className="bg-gray-900 p-3 rounded max-h-40 overflow-auto">
            {scannedTags.map((tag, i) => (
              <div key={i} className="text-sm">
                {tag}
              </div>
            ))}
          </div>

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            className="bg-green-600 p-3 rounded"
          >
            Move Plants
          </button>
        </>
      )}
    </div>
  )
}