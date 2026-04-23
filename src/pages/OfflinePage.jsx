import React, { useRef, useState, useEffect } from 'react'
import JSZip from 'jszip'

export default function OfflinePage() {
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const inputRef = useRef(null)
  const beepRef = useRef(null)

  const [items, setItems] = useState([])
  const [currentTag, setCurrentTag] = useState('')
  const [location, setLocation] = useState('')
  const [msg, setMsg] = useState('')
  const [paused, setPaused] = useState(false)

  // 🔵 FORCE FOCUS (CRITICAL)
  useEffect(() => {
    const interval = setInterval(() => {
      if (!paused && inputRef.current) {
        inputRef.current.focus()
      }
    }, 500)

    return () => clearInterval(interval)
  }, [paused])

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

  const stopCamera = () => {
    const stream = videoRef.current?.srcObject
    if (stream) stream.getTracks().forEach(t => t.stop())
  }

  // 🔵 FEEDBACK
  const beep = () => {
    try {
      beepRef.current.currentTime = 0
      beepRef.current.play()
    } catch {}
  }

  const vibrate = () => {
    if (navigator.vibrate) navigator.vibrate(50)
  }

  // 🔵 CAPTURE IMAGE
  const captureImage = () => {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas) return null

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)

    return canvas.toDataURL('image/jpeg')
  }

  // 🔵 HANDLE SCAN (AUTO CAPTURE)
  const handleScan = (tag) => {
    if (paused) return
    if (!tag) return

    if (items.find(i => i.tag === tag)) {
      setMsg(`Duplicate: ${tag}`)
      return
    }

    setCurrentTag(tag)

    beep()
    vibrate()

    setTimeout(() => {
      const image = captureImage()

      setItems(prev => [
        ...prev,
        {
          tag,
          image,
          time: new Date().toISOString()
        }
      ])

      setCurrentTag('')
      setMsg(`Added: ${tag}`)
    }, 200)
  }

  // 🔵 REMOVE ITEM
  const removeItem = (tag) => {
    setItems(prev => prev.filter(i => i.tag !== tag))
  }

  // 🔵 DOWNLOAD CSV
  const downloadCSV = () => {
    if (!location) return setMsg('Select location')

    const csv = [
      'Label,LocationName',
      ...items.map(i => `${i.tag},${location}`)
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)

    const a = document.createElement('a')
    a.href = url
    a.download = `moves-${new Date().toISOString().slice(0,10)}.csv`
    a.click()

    URL.revokeObjectURL(url)
  }

  // 🔵 DOWNLOAD IMAGES ZIP
  const downloadImagesZip = async () => {
    const zip = new JSZip()
    const folderName = `move-offline-${new Date().toISOString().slice(0,10)}`

    items.forEach((item) => {
      const base64 = item.image.split(',')[1]
      zip.file(`img_${item.tag}.jpg`, base64, { base64: true })
    })

    const blob = await zip.generateAsync({ type: 'blob' })

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${folderName}.zip`
    a.click()
  }

  // 🔵 EXPORT BOTH
  const exportAll = async () => {
    if (!items.length) return setMsg('No items scanned')

    downloadCSV()
    await downloadImagesZip()

    setMsg('CSV + Images downloaded')
  }

  return (
    <div className="grid md:grid-cols-2 gap-4 p-4">

      {/* AUDIO */}
      <audio ref={beepRef} src="/beep.mp3" preload="auto" />

      {/* LEFT PANEL */}
      <div className="card space-y-3">
        <video ref={videoRef} autoPlay className="w-full rounded-xl" />
        <canvas ref={canvasRef} className="hidden" />

        <div className="flex gap-2">
          <button onClick={startCamera} className="btn-primary flex-1">Start</button>
          <button onClick={stopCamera} className="btn-danger flex-1">Stop</button>
        </div>

        <input
          ref={inputRef}
          autoFocus
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleScan(e.target.value.trim())
              e.target.value = ''
            }
          }}
          placeholder="Scan barcode..."
          className="input-field text-lg"
        />

        <button
          onClick={() => setPaused(!paused)}
          className="btn-secondary w-full"
        >
          {paused ? 'Resume' : 'Pause'}
        </button>

        {currentTag && (
          <div className="text-green-400 text-lg">
            Processing: {currentTag}
          </div>
        )}
      </div>

      {/* RIGHT PANEL */}
      <div className="card space-y-3">

        <div className="font-bold text-xl">
          Queue ({items.length})
        </div>

        <div className="max-h-[350px] overflow-y-auto space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-gray-800 px-3 py-2 rounded-xl">
              <span>{item.tag}</span>
              <button
                onClick={() => removeItem(item.tag)}
                className="text-red-400 text-lg"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <input
          placeholder="Destination"
          className="input-field"
          onChange={(e) => setLocation(e.target.value)}
        />

        <button onClick={exportAll} className="btn-primary w-full">
          Export (CSV + Images)
        </button>

        {msg && (
          <div className="text-sm text-yellow-400">
            {msg}
          </div>
        )}
      </div>

    </div>
  )
}