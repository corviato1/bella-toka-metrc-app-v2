import React, { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../api/client'
import { BrowserMultiFormatReader } from '@zxing/browser'

export default function ScannerPage() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [scannedItems, setScannedItems] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [manualEntry, setManualEntry] = useState('')
  const [status, setStatus] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const lastScanRef = useRef('')
  const lastScanTimeRef = useRef(0)

  useEffect(() => {
    api.get('/api/locations').then((res) => {
      setLocations(res.locations || [])
    }).catch(() => {})
  }, [])

  const addTag = useCallback((tag) => {
    const cleaned = tag.trim().toUpperCase()
    if (!cleaned) return false
    const now = Date.now()

    if (cleaned === lastScanRef.current && now - lastScanTimeRef.current < 2000) return false
    lastScanRef.current = cleaned
    lastScanTimeRef.current = now

    setScannedItems((prev) => {
      if (prev.find((i) => i.tag === cleaned)) return prev
      return [...prev, { tag: cleaned, id: Date.now() }]
    })
    return true
  }, [])

  const startScanning = async () => {
    setCameraError('')
    try {
      readerRef.current = new BrowserMultiFormatReader()
      const videoEl = videoRef.current
      setScanning(true)

      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoEl,
        (result, err) => {
          if (result) {
            const text = result.getText()
            const added = addTag(text)
            if (added) {
              try {
                if (navigator.vibrate) navigator.vibrate(80)
              } catch (_) {}
            }
          }
        }
      )
    } catch (err) {
      setScanning(false)
      setCameraError('Camera access denied or unavailable. Use manual entry below.')
    }
  }

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScanning(false)
  }

  useEffect(() => {
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
      }
    }
  }, [])

  const handleManualAdd = () => {
    if (addTag(manualEntry)) {
      setManualEntry('')
    }
  }

  const removeItem = (tag) => {
    setScannedItems((prev) => prev.filter((i) => i.tag !== tag))
  }

  const clearList = () => {
    setScannedItems([])
    setStatus(null)
  }

  const handleDone = async () => {
    if (!selectedLocation) {
      setStatus({ type: 'error', message: 'Please select a location first.' })
      return
    }
    if (scannedItems.length === 0) {
      setStatus({ type: 'error', message: 'No plants scanned yet.' })
      return
    }

    setSubmitting(true)
    setStatus(null)

    try {
      const res = await api.post('/api/plants/move', {
        plantIds: scannedItems.map((i) => i.tag),
        newLocation: selectedLocation,
      })

      const results = res.results || []
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success)

      if (failed.length === 0) {
        setStatus({ type: 'success', message: `Successfully moved ${succeeded} plant(s) to ${selectedLocation}.` })
        setScannedItems([])
      } else {
        setStatus({
          type: 'warning',
          message: `${succeeded} moved successfully. ${failed.length} failed: ${failed.map((f) => f.plantId).join(', ')}`,
        })
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Submission failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-gray-100">Plant Scanner</h2>
        <p className="text-sm text-gray-500 mt-0.5">Scan METRC barcodes to move plants</p>
      </div>

      <div className="card space-y-4">
        <div className="relative bg-charcoal-900 rounded-xl overflow-hidden" style={{ minHeight: 280 }}>
          <video
            ref={videoRef}
            className={`w-full h-full object-cover rounded-xl ${scanning ? 'block' : 'hidden'}`}
            style={{ minHeight: 280 }}
            playsInline
            muted
          />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="w-16 h-16 rounded-2xl bg-charcoal-700 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 0V6m0 0h2M3 16h2m-2 0v2m0-2h2" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm">Camera not active</p>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-sage-400 rounded-lg w-64 h-24 opacity-70" />
            </div>
          )}
        </div>

        {cameraError && (
          <div className="bg-yellow-900/30 border border-yellow-700 text-yellow-400 text-sm px-4 py-3 rounded-xl">
            {cameraError}
          </div>
        )}

        <div className="flex gap-3">
          {!scanning ? (
            <button onClick={startScanning} className="btn-primary flex-1">
              Start Camera
            </button>
          ) : (
            <button onClick={stopScanning} className="btn-danger flex-1">
              Stop Camera
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="input-field flex-1"
            placeholder="Enter tag manually (e.g. 1A4FF010000004500000001)"
            value={manualEntry}
            onChange={(e) => setManualEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
          />
          <button onClick={handleManualAdd} className="btn-secondary px-4">Add</button>
        </div>
      </div>

      <div className="card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-100">
            Scanned Plants
            <span className="ml-2 bg-sage-500/20 text-sage-400 text-xs font-semibold px-2 py-0.5 rounded-full">
              {scannedItems.length}
            </span>
          </h3>
          {scannedItems.length > 0 && (
            <button onClick={clearList} className="text-sm text-red-400 hover:text-red-300">
              Clear List
            </button>
          )}
        </div>

        {scannedItems.length === 0 ? (
          <p className="text-gray-600 text-sm py-3 text-center">No plants scanned yet</p>
        ) : (
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {scannedItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between bg-charcoal-700 rounded-lg px-3 py-2">
                <span className="font-mono text-sm text-gray-300">{item.tag}</span>
                <button
                  onClick={() => removeItem(item.tag)}
                  className="text-gray-600 hover:text-red-400 ml-3 text-xs"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Move to Location</label>
          <select
            className="input-field"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">Select a location...</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>
        </div>

        {status && (
          <div className={`px-4 py-3 rounded-xl text-sm border ${
            status.type === 'success'
              ? 'bg-green-900/30 border-green-700 text-green-400'
              : status.type === 'warning'
              ? 'bg-yellow-900/30 border-yellow-700 text-yellow-400'
              : 'bg-red-900/30 border-red-700 text-red-400'
          }`}>
            {status.message}
          </div>
        )}

        <button
          onClick={handleDone}
          disabled={submitting || scannedItems.length === 0 || !selectedLocation}
          className="btn-primary w-full disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Processing...
            </>
          ) : (
            `Done — Move ${scannedItems.length} Plant${scannedItems.length !== 1 ? 's' : ''}`
          )}
        </button>
      </div>
    </div>
  )
}
