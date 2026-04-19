import { useEffect, useState } from 'react'

export default function DebugPage() {
  const [data, setData] = useState(null)

  useEffect(() => {
    fetch('/api/auth/debug')
      .then(r => r.json())
      .then(setData)
  }, [])

  return (
    <div style={{ padding: 20 }}>
      <h1>DEBUG</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}