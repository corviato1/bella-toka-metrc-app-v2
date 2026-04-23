import React, { useState } from 'react'
import BarcodeScanner from '../components/BarcodeScanner'

export default function MovePlantsPage() {
  const [tags, setTags] = useState([])
  const [location, setLocation] = useState('')

  const addTag = (tag) => {
    if (!tags.includes(tag)) setTags([...tags, tag])
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

      <button className="btn-primary w-full">
        Move Plants
      </button>

    </div>
  )
}