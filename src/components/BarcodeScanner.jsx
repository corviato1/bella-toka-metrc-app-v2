import { useState } from 'react'

export default function BarcodeScanner({ onScan }) {
  const [input, setInput] = useState('')

  const handleEnter = (e) => {
    if (e.key === 'Enter') {
      onScan(input.trim())
      setInput('')
    }
  }

  return (
    <input
      autoFocus
      value={input}
      onChange={(e) => setInput(e.target.value)}
      onKeyDown={handleEnter}
      placeholder="Scan barcode..."
      style={{ fontSize: '20px', width: '100%' }}
    />
  )
}