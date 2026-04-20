const fetch = require('node-fetch')

const BASE = process.env.METRC_BASE_URL

// 🔥 SINGLE KEY MODE
const AUTH = Buffer.from(process.env.METRC_API_KEY).toString('base64')

function safeError() {
  return 'METRC request failed. Contact admin.'
}

async function metrcGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('METRC GET ERROR:', text)
    throw new Error(safeError())
  }

  return res.json()
}

async function metrcPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const text = await res.text()
    console.error('METRC POST ERROR:', text)
    throw new Error(safeError())
  }

  return res.json()
}

module.exports = { metrcGet, metrcPost }