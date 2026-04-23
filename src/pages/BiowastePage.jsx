import React, { useRef, useState } from 'react'
import { api } from '../api/client'
import { saveImage } from '../utils/localDB'

export default function BiowastePage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const scannerRef = useRef(null)

  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [image, setImage] = useState(null)
  const [msg, setMsg] = useState('')
  const [scannerMode, setScannerMode] = useState(false)

  // CAMERA
  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
    })
    videoRef.current.srcObject = stream
  }

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  // CAPTURE
  const capture = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const img = canvas.toDataURL('image/jpeg')
    setImage(img)
    setMsg('Image captured')
  }

  // SUBMIT
  const submit = async () => {
    if (!location) return setMsg('Enter location')
    if (!weight) return setMsg('Enter weight')
    if (!image) return setMsg('Capture image first')

    try {
      await saveImage({
        id: Date.now(),
        type: 'biowaste',
        image,
        location,
        weight,
        time: new Date().toISOString()
      })

      await api.post('/api/biowaste', {
        label: 'bulk',
        weight,
        location,
      })

      setMsg('Logged')
      setWeight('')
      setImage(null)
    } catch (e) {
      setMsg(e.message)
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 p-4">

      {/* LEFT */}
      <div className="card space-y-3">
        <video ref={videoRef} autoPlay className="w-full rounded-xl" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          <button onClick={startCamera} className="btn-primary flex-1">Start</button>
          <button onClick={capture} className="btn-secondary flex-1">Capture</button>
          <button onClick={stopCamera} className="btn-danger flex-1">Stop</button>
        </div>

        {image && <img src={image} className="rounded-xl" />}
      </div>

      {/* RIGHT */}
      <div className="card space-y-3">

        <input
          placeholder="Location"
          className="input-field"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        />

        <input
          placeholder="Weight"
          className="input-field"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
        />

        <button onClick={submit} className="btn-primary w-full">
          Submit Biowaste
        </button>

        <button
          onClick={() => {
            setScannerMode(!scannerMode)
            setTimeout(() => scannerRef.current?.focus(), 100)
          }}
          className="btn-secondary w-full"
        >
          {scannerMode ? 'Disable Scanner Mode' : 'Enable Scanner Mode'}
        </button>

        {scannerMode && (
          <input
            ref={scannerRef}
            autoFocus
            placeholder="Scan here..."
            className="input-field"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setMsg(`Scanned: ${e.target.value}`)
                e.target.value = ''
              }
            }}
          />
        )}

        {msg && <div className="text-yellow-400">{msg}</div>}
      </div>

    </div>
  )
}