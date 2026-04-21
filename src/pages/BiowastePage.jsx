import React, { useState, useRef } from 'react'
import { api } from '../api/client'

export default function BiowastePage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [locations, setLocations] = useState([])
  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('Pounds')

  const [image, setImage] = useState(null)
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  // 🔵 LOAD LOCATIONS
  const refreshLocations = async () => {
    setMsg('')
    try {
      const data = await api.get('/api/metrcLocations')
      setLocations(data)
    } catch (e) {
      setMsg(e.message)
    }
  }

  // 🔵 START CAMERA
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    videoRef.current.srcObject = stream
  }

  // 🔵 TAKE PHOTO
  const takePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const data = canvas.toDataURL('image/png')
    setImage(data)
  }

  // 🔵 SUBMIT
  const submit = async () => {
    setMsg('')

    if (!location) return setMsg('Select location')
    if (!weight) return setMsg('Enter weight')

    setLoading(true)

    try {
      await api.post('/api/biowaste', {
        label: 'BULK', // 🔴 placeholder (can improve later)
        weight: Number(weight),
        unit,
        location,
      })

      setMsg('Biowaste submitted')
      setWeight('')
      setImage(null)
    } catch (e) {
      setMsg(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-4 p-4">

      {/* LEFT PANEL (CAMERA) */}
      <div className="flex-1 space-y-4">

        <div className="bg-gray-900 h-[400px] flex items-center justify-center rounded">
          {!image ? (
            <video ref={videoRef} autoPlay className="h-full" />
          ) : (
            <img src={image} className="h-full object-contain" />
          )}
        </div>

        <canvas ref={canvasRef} style={{ display: 'none' }} />

        <div className="flex gap-2">
          <button
            onClick={startCamera}
            className="bg-blue-600 px-4 py-2 rounded"
          >
            Start Camera
          </button>

          <button
            onClick={takePhoto}
            className="bg-green-600 px-4 py-2 rounded"
          >
            Take Photo
          </button>
        </div>

      </div>

      {/* RIGHT PANEL */}
      <div className="w-80 bg-gray-900 p-4 rounded space-y-4">

        <button
          onClick={refreshLocations}
          className="bg-blue-600 px-4 py-2 rounded w-full"
        >
          Refresh Locations
        </button>

        <select
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full p-2 bg-gray-800 rounded"
        >
          <option value="">Select location</option>
          {locations.map((l, i) => (
            <option key={i} value={l.Name || l}>
              {l.Name || l}
            </option>
          ))}
        </select>

        <div className="flex gap-2">
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Weight"
            className="flex-1 p-2 bg-gray-800 rounded"
          />

          <select
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="bg-gray-800 p-2 rounded"
          >
            <option>Pounds</option>
            <option>Grams</option>
          </select>
        </div>

        <button
          onClick={submit}
          disabled={loading}
          className="bg-green-600 p-3 rounded w-full"
        >
          {loading ? 'Submitting...' : 'Submit Report'}
        </button>

        {msg && <div className="text-sm">{msg}</div>}
      </div>

    </div>
  )
}