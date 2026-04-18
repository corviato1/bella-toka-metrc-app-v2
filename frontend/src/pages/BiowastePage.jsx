import React, { useState, useEffect, useRef } from 'react'
import { api } from '../api/client'
import { useAuthStore } from '../store/authStore'

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  )
}

function SyncIcon({ spinning }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${spinning ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  )
}

export default function BiowastePage() {
  const { token } = useAuthStore()
  const fileInputRef = useRef(null)

  const [photo, setPhoto] = useState(null)
  const [photoUrl, setPhotoUrl] = useState(null)
  const [uploading, setUploading] = useState(false)

  const [locations, setLocations] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncError, setSyncError] = useState('')

  const [location, setLocation] = useState('')
  const [weight, setWeight] = useState('')
  const [unit, setUnit] = useState('lbs')

  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState(null)

  const [formError, setFormError] = useState('')

  useEffect(() => {
    loadLocations()
  }, [])

  async function loadLocations() {
    try {
      const res = await api.get('/api/locations')
      setLocations(res.locations || [])
    } catch (e) {}
  }

  async function handleSync() {
    setSyncing(true)
    setSyncError('')
    try {
      const res = await api.get('/api/metrc/locations/sync')
      setLocations(res.locations || [])
    } catch (e) {
      setSyncError(e.message || 'Sync failed')
      await loadLocations()
    } finally {
      setSyncing(false)
    }
  }

  function handlePhotoClick() {
    setSubmitResult(null)
    fileInputRef.current?.click()
  }

  async function handleFileChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''

    const localUrl = URL.createObjectURL(file)
    setPhotoUrl(localUrl)
    setPhoto(null)
    setUploading(true)

    try {
      const formData = new FormData()
      formData.append('photo', file)

      const res = await fetch('/api/biowaste/photo', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        credentials: 'include',
        body: formData,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setPhoto(data.url)
    } catch (err) {
      setPhoto(null)
    } finally {
      setUploading(false)
    }
  }

  function handleSubmitClick() {
    setFormError('')
    if (!location) { setFormError('Please select a location.'); return }
    if (!weight || isNaN(parseFloat(weight)) || parseFloat(weight) <= 0) {
      setFormError('Please enter a valid weight.')
      return
    }
    setShowConfirm(true)
  }

  async function handleConfirm() {
    setSubmitting(true)
    try {
      const reportRes = await api.post('/api/biowaste/report', {
        photoPath: photo || null,
        locationName: location,
        weightValue: parseFloat(weight),
        weightUnit: unit,
      })

      const reportId = reportRes.reportId

      let metrcOk = false
      let metrcMsg = ''
      try {
        await api.post('/api/metrc/biowaste', { reportId })
        metrcOk = true
      } catch (metrcErr) {
        metrcMsg = metrcErr.message
      }

      setSubmitResult({ success: true, metrcOk, metrcMsg, reportedAt: reportRes.reportedAt })
      setShowConfirm(false)
      setPhoto(null)
      setPhotoUrl(null)
      setLocation('')
      setWeight('')
    } catch (err) {
      setSubmitResult({ success: false, error: err.message })
      setShowConfirm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const now = new Date()

  return (
    <div className="h-full flex gap-4 p-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="flex-1 flex flex-col gap-4 min-w-0">
        <div className="flex-1 relative bg-gray-200 dark:bg-charcoal-700 rounded-2xl overflow-hidden border border-gray-200 dark:border-charcoal-600">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Biowaste"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-400 dark:text-gray-500">
              <CameraIcon />
              <p className="text-sm font-medium">No photo taken</p>
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <div className="text-white text-sm font-medium flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Uploading...
              </div>
            </div>
          )}
        </div>

        <button
          onClick={handlePhotoClick}
          className="btn-secondary flex items-center justify-center gap-3 py-4 text-base"
        >
          <CameraIcon />
          {photoUrl ? 'Retake Photo' : 'Take Photo'}
        </button>

        <div className="card text-sm">
          <p className="text-gray-400 dark:text-gray-500 text-xs">Date &amp; Time</p>
          <p className="font-semibold text-gray-800 dark:text-gray-200 mt-0.5">
            {now.toLocaleString()}
          </p>
        </div>
      </div>

      <div className="w-80 flex-shrink-0 flex flex-col gap-4">
        {submitResult && (
          <div className={`card border-2 ${submitResult.success ? 'border-green-400 dark:border-green-600' : 'border-red-400 dark:border-red-600'}`}>
            {submitResult.success ? (
              <div className="flex flex-col items-center gap-2 text-center py-2">
                <span className="text-green-500 dark:text-green-400"><CheckIcon /></span>
                <p className="font-semibold text-gray-900 dark:text-gray-100">Report Saved</p>
                {submitResult.metrcOk ? (
                  <p className="text-xs text-green-600 dark:text-green-400">Submitted to METRC</p>
                ) : (
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">Saved locally — METRC not configured</p>
                )}
              </div>
            ) : (
              <div className="text-red-600 dark:text-red-400 text-sm">
                <p className="font-semibold">Submission failed</p>
                <p className="mt-1">{submitResult.error}</p>
              </div>
            )}
            <button
              onClick={() => setSubmitResult(null)}
              className="btn-secondary w-full mt-3 py-2 text-sm"
            >
              New Report
            </button>
          </div>
        )}

        <div className="card flex-1 flex flex-col gap-4">
          <h2 className="font-bold text-gray-900 dark:text-gray-100 text-base">Report Biowaste</h2>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-500 dark:text-gray-400">Location</label>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="flex items-center gap-1 text-xs text-sage-500 hover:text-sage-400 font-medium"
                title="Sync locations from METRC"
              >
                <SyncIcon spinning={syncing} />
                {syncing ? 'Syncing…' : 'Sync'}
              </button>
            </div>
            {syncError && <p className="text-xs text-red-500 mb-1">{syncError}</p>}
            <select
              className="input-field"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              <option value="">Select location…</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-1.5">Weight</label>
            <div className="flex gap-2">
              <input
                type="number"
                step="0.001"
                min="0"
                className="input-field flex-1"
                placeholder="0.00"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
              />
              <select
                className="input-field w-20"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
              </select>
            </div>
          </div>

          {formError && (
            <p className="text-sm text-red-500 dark:text-red-400">{formError}</p>
          )}

          <div className="flex-1" />

          <button
            onClick={handleSubmitClick}
            disabled={submitting}
            className="btn-primary w-full py-4 text-base"
          >
            Submit Report
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-6">
          <div className="bg-white dark:bg-charcoal-800 rounded-2xl border border-gray-200 dark:border-charcoal-600 w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">Confirm Report</h3>

              {photoUrl && (
                <img src={photoUrl} alt="Preview" className="w-full h-40 object-cover rounded-xl mb-4 border border-gray-200 dark:border-charcoal-600" />
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Location</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Weight</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{weight} {unit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Date</span>
                  <span className="font-semibold text-gray-900 dark:text-gray-100">{now.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="flex border-t border-gray-200 dark:border-charcoal-600">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 py-4 text-sm font-semibold text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-charcoal-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 py-4 text-sm font-semibold text-white bg-sage-500 hover:bg-sage-400 transition-colors flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending…
                  </>
                ) : 'Confirm & Send'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
