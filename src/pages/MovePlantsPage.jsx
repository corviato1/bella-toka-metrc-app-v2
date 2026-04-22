import React, { useRef, useState } from 'react'
import { api } from '../api/client'
import BarcodeScanner from '../components/BarcodeScanner'

export default function MovePlantsPage() {
  const videoRef = useRef(null)

  const [scanned, setScanned] = useState([])
  const [locations, setLocations] = useState([])
  const [location, setLocation] = useState('')
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔵 CAMERA
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      videoRef.current.srcObject = stream
    } catch (e) {
      setMsg('Camera error: ' + e.message)
    }
  }

  // 🔵 SCAN
  const addTag = (tag) => {
    if (scanned.includes(tag)) return
    setScanned(prev => [...prev, tag])
  }

  // 🔵 LOAD LOCATIONS
  const loadLocations = async () => {
    try {
      const res = await api.get('/api/metrcLocations')
      setLocations(res)
    } catch (e) {
      setMsg(e.message)
    }
  }

  // 🔵 MOVE
  const move = async () => {
    if (!scanned.length) return setMsg('No plants scanned')
    if (!location) return setMsg('Select location')

    setLoading(true)
    setMsg('')

    try {
      await api.post('/api/movePlants', {
        labels: scanned,
        location,
      })

      setMsg('Move successful')
      setScanned([])

    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 p-4">

      {/* LEFT PANEL */}
      <div className="flex-1 space-y-3">

        <div className="bg-gray-900 h-[350px] flex items-center justify-center rounded">
          <video ref={videoRef} autoPlay className="h-full" />
        </div>

        <button onClick={startCamera} className="btn-primary w-full">
          Start Camera
        </button>

        <BarcodeScanner onScan={addTag} />

      </div>

      {/* RIGHT PANEL */}
      <div className="w-full md:w-80 space-y-3">

        {/* SCANNED */}
        <div className="card">
          <div className="font-bold mb-2">
            Scanned Plants ({scanned.length})
          </div>

          <div className="max-h-[200px] overflow-y-auto text-sm space-y-1">
            {scanned.map((t, i) => (
              <div key={i}>{t}</div>
            ))}
          </div>
        </div>

        {/* LOCATION */}
        <div className="card space-y-2">

          <button onClick={loadLocations} className="btn-secondary w-full">
            Sync Locations
          </button>

          <select
            className="input-field"
            onChange={(e) => setLocation(e.target.value)}
          >
            <option>Select location...</option>
            {locations.map((l, i) => (
              <option key={i}>{l.Name || l}</option>
            ))}
          </select>

          <button
            onClick={move}
            disabled={loading}
            className="btn-primary w-full"
          >
            {loading ? 'Moving...' : 'Move Plants'}
          </button>

        </div>

        {msg && <div className="text-sm">{msg}</div>}

      </div>

    </div>
  )
}