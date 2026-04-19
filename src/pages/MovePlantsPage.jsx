import React, { useEffect, useRef, useState, useCallback } from 'react'
import { api } from '../api/client'
import { BrowserMultiFormatReader } from '@zxing/browser'

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  )
}

export default function MovePlantsPage() {
  const videoRef = useRef(null)
  const readerRef = useRef(null)
  const controlsRef = useRef(null)
  const lastScanRef = useRef('')
  const lastScanTimeRef = useRef(0)
  const manualRef = useRef(null)

  const [scanning, setScanning] = useState(false)
  const [cameraError, setCameraError] = useState('')
  const [scannedItems, setScannedItems] = useState([])
  const [locations, setLocations] = useState([])
  const [selectedLocation, setSelectedLocation] = useState('')
  const [manualEntry, setManualEntry] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    api.get('/api/locations').then((res) => setLocations(res.locations || [])).catch(() => {})
    return () => {
      if (controlsRef.current) {
        controlsRef.current.stop()
        controlsRef.current = null
      }
    }
  }, [])

  const addTag = useCallback((raw) => {
    const tag = raw.trim().toUpperCase()
    if (!tag) return false
    const now = Date.now()
    if (tag === lastScanRef.current && now - lastScanTimeRef.current < 2000) return false
    lastScanRef.current = tag
    lastScanTimeRef.current = now
    setScannedItems((prev) => {
      if (prev.find((i) => i.tag === tag)) return prev
      return [...prev, { tag, id: now }]
    })
    return true
  }, [])

  const startScanning = async () => {
    setCameraError('')
    setScanning(true)
    try {
      readerRef.current = new BrowserMultiFormatReader()
      controlsRef.current = await readerRef.current.decodeFromVideoDevice(
        undefined,
        videoRef.current,
        (result) => {
          if (result) {
            const added = addTag(result.getText())
            if (added && navigator.vibrate) navigator.vibrate(80)
          }
        }
      )
    } catch {
      setScanning(false)
      setCameraError('Camera unavailable — use manual entry.')
    }
  }

  const stopScanning = () => {
    if (controlsRef.current) {
      controlsRef.current.stop()
      controlsRef.current = null
    }
    setScanning(false)
  }

  const handleManualAdd = () => {
    if (addTag(manualEntry)) {
      setManualEntry('')
      manualRef.current?.focus()
    }
  }

  const removeItem = (tag) => setScannedItems((prev) => prev.filter((i) => i.tag !== tag))

  const clearAll = () => {
    setScannedItems([])
    setStatus(null)
  }

  const handleMove = async () => {
    if (!selectedLocation) { setStatus({ type: 'error', message: 'Select a destination location.' }); return }
    if (scannedItems.length === 0) { setStatus({ type: 'error', message: 'No plants scanned.' }); return }

    setSubmitting(true)
    setStatus(null)

    const plantIds = scannedItems.map((i) => i.tag)

    try {
      const localRes = await api.post('/api/plants/move', { plantIds, newLocation: selectedLocation })
      const results = localRes.results || []
      const succeeded = results.filter((r) => r.success).length
      const failed = results.filter((r) => !r.success)

      let metrcNote = ''
      try {
        await api.post('/api/metrc/move', {
          plantTags: plantIds,
          location: selectedLocation,
          moveDate: new Date().toISOString().split('T')[0],
        })
        metrcNote = ' · Sent to METRC'
      } catch {
        metrcNote = ' · METRC not configured'
      }

      if (failed.length === 0) {
        setStatus({ type: 'success', message: `Moved ${succeeded} plant${succeeded !== 1 ? 's' : ''} to ${selectedLocation}${metrcNote}` })
        setScannedItems([])
      } else {
        setStatus({
          type: 'warning',
          message: `${succeeded} moved, ${failed.length} failed${metrcNote}`,
        })
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message || 'Move failed.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="h-full flex gap-4 p-4">
      <div className="flex-1 flex flex-col gap-3 min-w-0">
        <div className="flex-1 relative bg-gray-200 dark:bg-charcoal-700 rounded-2xl overflow-hidden border border-gray-200 dark:border-charcoal-600">
          <video
            ref={videoRef}
            className={`w-full h-full object-cover ${scanning ? 'block' : 'hidden'}`}
            playsInline
            muted
          />
          {!scanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-gray-400 dark:text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8H3m2 0V6m0 0h2M3 16h2m-2 0v2m0-2h2" />
              </svg>
              <p className="text-sm">Camera not active</p>
            </div>
          )}
          {scanning && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-2 border-sage-400 rounded-lg w-64 h-20 opacity-80" />
            </div>
          )}
        </div>

        {cameraError && (
          <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl px-3 py-2">{cameraError}</p>
        )}

        <div className="flex gap-2">
          {!scanning ? (
            <button onClick={startScanning} className="btn-primary flex-1 py-3">Start Camera</button>
          ) : (
            <button onClick={stopScanning} className="btn-danger flex-1 py-3">Stop Camera</button>
          )}
        </div>

        <div className="flex gap-2">
          <input
            ref={manualRef}
            type="text"
            className="input-field flex-1"
            placeholder="Enter tag manually…"
            value={manualEntry}
            onChange={(e) => setManualEntry(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleManualAdd()}
            autoCapitalize="none"
            autoCorrect="off"
          />
          <button onClick={handleManualAdd} className="btn-secondary px-5">Add</button>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col gap-3">
        <div className="card flex items-center justify-between py-3">
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            Scanned Plants
            <span className="ml-2 text-xs font-bold bg-sage-500/20 text-sage-600 dark:text-sage-400 px-2 py-0.5 rounded-full">
              {scannedItems.length}
            </span>
          </span>
          {scannedItems.length > 0 && (
            <button onClick={clearAll} className="text-xs text-red-500 hover:text-red-400 font-medium">
              Clear all
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto rounded-2xl border border-gray-200 dark:border-charcoal-600 bg-white dark:bg-charcoal-800">
          {scannedItems.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 text-sm p-4 text-center">
              Scan barcodes or enter tags manually
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-charcoal-700">
              {scannedItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2.5">
                  <span className="font-mono text-sm text-gray-700 dark:text-gray-300 truncate flex-1">{item.tag}</span>
                  <button
                    onClick={() => removeItem(item.tag)}
                    className="ml-3 text-gray-400 hover:text-red-500 dark:hover:text-red-400 flex-shrink-0"
                  >
                    <TrashIcon />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card space-y-3">
          <label className="block text-sm text-gray-500 dark:text-gray-400">Move to Location</label>
          <select
            className="input-field"
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
          >
            <option value="">Select location…</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.name}>{loc.name}</option>
            ))}
          </select>

          {status && (
            <div className={`text-sm px-3 py-2 rounded-xl border ${
              status.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-400' :
              status.type === 'warning' ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400' :
              'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-700 text-red-600 dark:text-red-400'
            }`}>
              {status.message}
            </div>
          )}

          <button
            onClick={handleMove}
            disabled={submitting || scannedItems.length === 0 || !selectedLocation}
            className="btn-primary w-full py-4 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Moving…
              </>
            ) : (
              `Move ${scannedItems.length || ''} Plant${scannedItems.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
