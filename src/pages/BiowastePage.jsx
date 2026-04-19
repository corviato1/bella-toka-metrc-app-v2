import React, { useEffect, useState } from 'react'
import { api } from '../api/client'

export default function BiowastePage() {
  const [locations, setLocations] = useState([])
  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const loadLocations = async () => {
    try {
      const res = await api.get('/api/locations')
      setLocations(res)
    } catch (e) {
      setError('Failed to load locations')
    }
  }

  const sync = async () => {
    try {
      setLoading(true)
      setError('')
      await api.get('/api/metrcLocations')
      await loadLocations()
    } catch (e) {
      setError(e.message || 'Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const submit = async () => {
    try {
      setLoading(true)
      setError('')
      setSuccess('')

      await api.post('/api/biowaste', {
        location,
        weight: Number(weight),
      })

      setSuccess('Biowaste recorded')
      setWeight('')
    } catch (e) {
      setError(e.message)
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
        <h2 className="text-lg font-bold">Report Biowaste</h2>

        <button
          onClick={sync}
          className="bg-blue-600 px-3 py-1 rounded text-sm"
        >
          Sync METRC
        </button>
      </div>

      <select
        value={location}
        onChange={(e) => setLocation(e.target.value)}
        className="w-full p-3 bg-gray-800 rounded"
      >
        <option value="">Select Location</option>
        {locations.map((l) => (
          <option key={l.name} value={l.name}>
            {l.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={weight}
        onChange={(e) => setWeight(e.target.value)}
        placeholder="Weight (lbs)"
        className="w-full p-3 bg-gray-800 rounded"
      />

      {error && <div className="bg-red-900 p-2 rounded">{error}</div>}
      {success && <div className="bg-green-900 p-2 rounded">{success}</div>}

      <button
        onClick={submit}
        disabled={loading}
        className="w-full bg-green-600 p-3 rounded"
      >
        {loading ? 'Submitting...' : 'Submit'}
      </button>

    </div>
  )
}