import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'

export default function BiowastePage() {
  const fileInputRef = useRef(null)

  const [photoBase64, setPhotoBase64] = useState(null)
  const [photoPreview, setPhotoPreview] = useState(null)

  const [locations, setLocations] = useState([])
  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lbs')

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    try {
      const res = await api.get('/api/locations')
      setLocations(res.locations || [])
    } catch {}
  }

  function handlePhotoClick() {
    fileInputRef.current?.click()
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()

    reader.onload = () => {
      setPhotoBase64(reader.result)
      setPhotoPreview(reader.result)
    }

    reader.readAsDataURL(file)
  }

  async function handleSubmit() {
    if (!location) {
      setStatus({ type: 'error', message: 'Select a location.' })
      return
    }

    if (!weight) {
      setStatus({ type: 'error', message: 'Enter weight.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      await api.post('/api/biowaste/report', {
        location,
        weight,
        unit,
        photoBase64
      })

      setStatus({ type: 'success', message: 'Submitted successfully.' })
      setPhotoBase64(null)
      setPhotoPreview(null)
      setWeight('')
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-4 space-y-4">

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Biowaste Report</h2>

        <select
          className="input-field mb-3"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">Select Location</option>
          {locations.map((l) => (
            <option key={l.id} value={l.name}>{l.name}</option>
          ))}
        </select>

        <input
          className="input-field mb-3"
          type="number"
          placeholder="Weight"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <select
          className="input-field mb-3"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="lbs">lbs</option>
          <option value="kg">kg</option>
        </select>

        <button className="btn-secondary w-full mb-3" onClick={handlePhotoClick}>
          Add Photo
        </button>

        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
        />

        {photoPreview && (
          <img src={photoPreview} className="rounded-xl mb-3 max-h-60 w-full object-cover" />
        )}

        <button
          className="btn-primary w-full"
          onClick={handleSubmit}
          disabled={submitting}
        >
          {submitting ? 'Submitting...' : 'Submit'}
        </button>

        {status && (
          <div className={`mt-3 text-sm ${status.type === 'error' ? 'text-red-500' : 'text-green-500'}`}>
            {status.message}
          </div>
        )}
      </div>

    </div>
  )
}