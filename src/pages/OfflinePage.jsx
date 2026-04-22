import React, { useRef, useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'

export default function OfflinePage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [tags, setTags] = useState([])
  const [images, setImages] = useState([])
  const [location, setLocation] = useState('')
  const [msg, setMsg] = useState('')

  // 🔵 START CAMERA
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      videoRef.current.srcObject = stream
      setScanning(true)
    } catch (e) {
      setMsg('Camera error: ' + e.message)
    }
  }

  // 🔵 STOP CAMERA
  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) {
      stream.getTracks().forEach(t => t.stop())
    }
    setScanning(false)
  }

  // 🔵 CAPTURE IMAGE
  const captureImage = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    const dataUrl = canvas.toDataURL('image/jpeg')

    setImages(prev => [...prev, dataUrl])
  }

  // 🔵 ADD TAG
  const addTag = (tag) => {
    if (tags.includes(tag)) return
    setTags(prev => [...prev, tag])

    // capture image per scan
    captureImage()
  }

  // 🔵 DOWNLOAD IMAGES
  const downloadImages = () => {
    images.forEach((img, i) => {
      const a = document.createElement('a')
      a.href = img
      a.download = `scan_${i + 1}.jpg`
      a.click()
    })
  }

  // 🔵 GENERATE CSV
  const downloadCSV = () => {
    if (!location) {
      setMsg('Select destination location')
      return
    }

    const header = ['Label', 'LocationName']

    const rows = tags.map(tag => [tag, location])

    const csv = [
      header.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = 'metrc_move_upload.csv'
    a.click()

    URL.revokeObjectURL(url)
  }

  // 🔵 COMPLETE FLOW
  const finalize = () => {
    stopCamera()
    downloadImages()
    downloadCSV()
    setMsg('Export complete')
  }

  return (
    <div className="p-4 space-y-4">

      {/* CAMERA */}
      <div className="bg-gray-900 h-[300px] flex items-center justify-center rounded">
        <video ref={videoRef} autoPlay className="h-full" />
      </div>

      <canvas ref={canvasRef} className="hidden" />

      {/* CONTROLS */}
      <div className="flex gap-2">
        <button onClick={startCamera} className="btn-primary">
          Start Scanning
        </button>

        <button onClick={stopCamera} className="btn-secondary">
          Stop
        </button>
      </div>

      {/* SCANNER INPUT */}
      {scanning && (
        <BarcodeScanner onScan={addTag} />
      )}

      {/* TAG LIST */}
      <div className="card">
        <div className="font-bold mb-2">
          Scanned ({tags.length})
        </div>

        <div className="max-h-[200px] overflow-y-auto text-sm space-y-1">
          {tags.map((t, i) => (
            <div key={i}>{t}</div>
          ))}
        </div>
      </div>

      {/* LOCATION */}
      <div className="card space-y-2">

        <select
          className="input-field"
          onChange={(e) => setLocation(e.target.value)}
        >
          <option>Select destination...</option>
          <option>Veg1</option>
          <option>Veg2</option>
          <option>Veg3</option>
          <option>Veg4</option>
          <option>F1</option>
          <option>F2</option>
          <option>F3</option>
          <option>F4</option>
          <option>F5</option>
          <option>F6</option>
          <option>F7</option>
          <option>F8</option>
          <option>F9</option>
          <option>H1</option>
          <option>H2</option>
        </select>

        <button onClick={finalize} className="btn-primary">
          Confirm & Export
        </button>

      </div>

      {msg && <div className="text-green-400">{msg}</div>}

    </div>
  )
}