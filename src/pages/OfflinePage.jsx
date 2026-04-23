import React, { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'

export default function OfflinePage() {
  const [tags, setTags] = useState([])
  const [location, setLocation] = useState('')

  const addTag = (tag) => {
    if (!tags.includes(tag)) setTags([...tags, tag])
  }

  const exportCSV = () => {
    const csv = [
      'Label,LocationName',
      ...tags.map(t => `${t},${location}`)
    ].join('\n')

    const blob = new Blob([csv])
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'moves.csv'
    a.click()
  }

  return (
    <div className="space-y-3">

      <BarcodeScanner onScan={addTag} />

      <div className="card">
        {tags.map((t, i) => <div key={i}>{t}</div>)}
      </div>

      <input
        placeholder="Destination"
        className="input-field"
        onChange={(e) => setLocation(e.target.value)}
      />

      <button onClick={exportCSV} className="btn-primary w-full">
        Export CSV
      </button>

    </div>
  )
}