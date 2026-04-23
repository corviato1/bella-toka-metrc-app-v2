import React, { useEffect, useState } from 'react'
import JSZip from 'jszip'
import { getImages } from '../utils/localDB'

export default function LogsPage() {
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('all')
  const [msg, setMsg] = useState('')

  // LOAD DATA
  const load = async () => {
    const data = await getImages()
    setItems(data.reverse())
  }

  useEffect(() => {
    load()
  }, [])

  // FILTER
  const filtered = items.filter(i => {
    if (filter === 'all') return true
    return i.type === filter
  })

  // EXPORT CSV
  const exportCSV = () => {
    const header = ['Type', 'Location', 'Weight', 'Time']

    const rows = filtered.map(i => [
      i.type,
      i.location || '',
      i.weight || '',
      i.time
    ])

    const csv = [
      header.join(','),
      ...rows.map(r => r.join(','))
    ].join('\n')

    const blob = new Blob([csv], { type: 'text/csv' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'logs.csv'
    a.click()
  }

  // EXPORT IMAGES ZIP
  const exportImages = async () => {
    const zip = new JSZip()

    filtered.forEach((item, i) => {
      const base64 = item.image.split(',')[1]
      zip.file(`${item.type}_${i}.jpg`, base64, { base64: true })
    })

    const blob = await zip.generateAsync({ type: 'blob' })

    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'images.zip'
    a.click()
  }

  return (
    <div className="p-4 space-y-4">

      {/* CONTROLS */}
      <div className="card flex flex-wrap gap-2">

        <select
          className="input-field"
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="biowaste">Biowaste</option>
          <option value="move">Move</option>
        </select>

        <button onClick={exportCSV} className="btn-primary">
          Export CSV
        </button>

        <button onClick={exportImages} className="btn-secondary">
          Export Images
        </button>

        <button onClick={load} className="btn-secondary">
          Refresh
        </button>

      </div>

      {/* GRID */}
      <div className="grid md:grid-cols-3 gap-3">

        {filtered.map((item, i) => (
          <div key={i} className="card space-y-2">

            <img src={item.image} className="rounded-xl" />

            <div className="text-sm">
              <div><b>{item.type}</b></div>
              <div>{item.location}</div>
              <div>{item.weight}</div>
              <div className="text-gray-400 text-xs">
                {new Date(item.time).toLocaleString()}
              </div>
            </div>

          </div>
        ))}

      </div>

      {msg && <div>{msg}</div>}

    </div>
  )
}