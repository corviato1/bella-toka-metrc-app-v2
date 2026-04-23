import React, { useRef, useState } from 'react'
import { api } from '../api/client'

export default function BiowastePage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [msg, setMsg] = useState('')

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true })
    videoRef.current.srcObject = stream
  }

  const takePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
  }

  const submit = async () => {
    try {
      await api.post('/api/biowaste', { label: 'bulk', weight, location })
      setMsg('Submitted')
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">

      {/* CAMERA */}
      <div className="card space-y-3">
        <video ref={videoRef} autoPlay className="w-full rounded-xl" />
        <div className="flex gap-2">
          <button onClick={startCamera} className="btn-primary flex-1">Start</button>
          <button onClick={takePhoto} className="btn-secondary flex-1">Photo</button>
        </div>
      </div>

      {/* FORM */}
      <div className="card space-y-3">
        <input
          placeholder="Location"
          className="input-field"
          onChange={(e) => setLocation(e.target.value)}
        />
        <input
          placeholder="Weight"
          className="input-field"
          onChange={(e) => setWeight(e.target.value)}
        />
        <button onClick={submit} className="btn-primary w-full">
          Submit Report
        </button>
        {msg && <div>{msg}</div>}
      </div>

    </div>
  )
}