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
    <div className="grid md:grid-cols-2 gap-4">

      <div className="card space-y-3">
        <h2 className="font-bold text-lg">Scan Offline</h2>
        <BarcodeScanner onScan={addTag} />
        <div>Count: {tags.length}</div>
      </div>

      <div className="card space-y-3">
        <h2 className="font-bold text-lg">Export</h2>

        <input
          placeholder="Destination"
          className="input-field"
          onChange={(e) => setLocation(e.target.value)}
        />

        <button onClick={exportCSV} className="btn-primary w-full">
          Export CSV
        </button>

        <div className="max-h-[300px] overflow-y-auto text-sm">
          {tags.map((t, i) => <div key={i}>{t}</div>)}
        </div>
      </div>

    </div>
  )
}