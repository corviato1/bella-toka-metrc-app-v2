import { useState } from 'react'

export default function BarcodeScanner({ onScan }) {
  const [value, setValue] = useState('')

  const handleKey = (e) => {
    if (e.key === 'Enter') {
      const v = value.trim()
      if (!v) return

      onScan(v)
      setValue('')
    }
  }

  return (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={handleKey}
      placeholder="Scan or enter tag..."
      className="input-field text-lg"
    />
  )
}