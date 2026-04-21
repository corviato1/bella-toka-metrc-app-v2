const fetch = require('node-fetch')

const BASE = process.env.METRC_BASE_URL
const INTEGRATOR = process.env.METRC_API_KEY
const USER = process.env.METRC_USER_KEY

function authHeaders() {
  if (!BASE || !INTEGRATOR || !USER) {
    throw new Error('Missing METRC env vars')
  }

  const token = Buffer.from(`${INTEGRATOR}:${USER}`).toString('base64')

  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  }
}

async function metrcGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: authHeaders(),
  })

  const text = await res.text()

  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON: ${text}`)
  }

  if (!res.ok) {
    throw new Error(`METRC ${res.status}: ${JSON.stringify(json)}`)
  }

  // handle both response types
  if (json && json.Data) return json.Data
  return json
}

async function metrcPost(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  const json = await res.json()

  if (!res.ok) {
    throw new Error(`METRC POST ERROR ${res.status}: ${JSON.stringify(json)}`)
  }

  return json
}

async function metrcPut(path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(body),
  })

  const text = await res.text()

  if (!res.ok) {
    throw new Error(`METRC PUT ERROR ${res.status}: ${text}`)
  }

  return true
}

module.exports = { metrcGet, metrcPost, metrcPut }