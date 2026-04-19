import React, { useEffect, useState } from 'react'

export default function MovePlantsPage() {
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [tags, setTags] = useState([])
  const [input, setInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')

  const loadLocations = async () => {
    try {
      const res = await fetch('/api/locations')
      const data = await res.json()
      setLocations(data)
    } catch {
      setError('Failed to load locations')
    }
  }

  const syncLocations = async () => {
    try {
      setLoading(true)
      setError('')
      await fetch('/api/metrcLocations')
      await loadLocations()
      alert('METRC locations synced')
    } catch {
      setError('Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (!input) return
    setTags([...tags, input])
    setInput('')
  }

  const submitMove = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      const res = await fetch('/api/movePlants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tags,
          toLocation: selectedLocation,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Move failed')
        return
      }

      setSuccess('Plants moved')
      setTags([])
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadLocations()
  }, [])

  return (
    <div className="space-y-4">

      <div className="flex justify-between items-center">
        <h2 className="text-lg">Move Plants</h2>

        <button
          onClick={syncLocations}
          className="bg-blue-600 px-3 py-1 rounded"
        >
          Sync METRC Locations
        </button>
      </div>

      <select
        className="w-full p-3 bg-gray-800 rounded"
        value={selectedLocation}
        onChange={(e) => setSelectedLocation(e.target.value)}
      >
        <option value="">Select Destination</option>
        {locations.map((l, i) => (
          <option key={i} value={l.name}>
            {l.name}
          </option>
        ))}
      </select>

      <div className="flex gap-2">
        <input
          className="flex-1 p-3 bg-gray-800 rounded"
          placeholder="Scan / Enter Tag"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          onClick={addTag}
          className="bg-green-600 px-4 rounded"
        >
          Add
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {tags.map((t, i) => (
          <div key={i} className="bg-gray-700 px-2 py-1 rounded text-sm">
            {t}
          </div>
        ))}
      </div>

      {error && <div className="bg-red-900 p-2 rounded">{error}</div>}
      {success && <div className="bg-green-900 p-2 rounded">{success}</div>}

      <button
        onClick={submitMove}
        disabled={loading}
        className="w-full bg-green-600 p-3 rounded"
      >
        Move Plants
      </button>
    </div>
  )
}