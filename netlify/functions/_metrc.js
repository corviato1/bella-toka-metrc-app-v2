const fetch = require('node-fetch')

const BASE = process.env.METRC_BASE_URL

const AUTH = Buffer.from(
  `${process.env.METRC_API_KEY}:${process.env.METRC_USER_KEY}`
).toString('base64')

async function metrcGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Basic ${AUTH}`,
      'Content-Type': 'application/json',
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(text)
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
    throw new Error(text)
  }

  return res.json()
}

module.exports = { metrcGet, metrcPost }