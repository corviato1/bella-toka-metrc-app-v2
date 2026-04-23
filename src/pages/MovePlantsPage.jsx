import React, { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'

export default function MovePlantsPage() {
  const [tags, setTags] = useState([])
  const [location, setLocation] = useState('')

  const addTag = (tag) => {
    if (!tags.includes(tag)) setTags([...tags, tag])
  }

  return (
    <div className="grid md:grid-cols-2 gap-4">

      {/* LEFT: SCAN */}
      <div className="card space-y-3">
        <h2 className="font-bold text-lg">Scan Plants</h2>
        <BarcodeScanner onScan={addTag} />
        <div className="text-sm text-gray-500">
          Count: {tags.length}
        </div>
      </div>

      {/* RIGHT: ACTION */}
      <div className="card space-y-3">
        <h2 className="font-bold text-lg">Move To</h2>

        <input
          placeholder="Destination"
          className="input-field"
          onChange={(e) => setLocation(e.target.value)}
        />

        <button className="btn-primary w-full">
          Move Plants
        </button>

        <div className="max-h-[300px] overflow-y-auto text-sm">
          {tags.map((t, i) => <div key={i}>{t}</div>)}
        </div>
      </div>

    </div>
  )
}