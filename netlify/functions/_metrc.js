const fetch = require('node-fetch')

const BASE = process.env.METRC_BASE_URL
const USER = process.env.METRC_USER_KEY
const KEY = process.env.METRC_API_KEY

function getAuthHeader() {
  if (!BASE) throw new Error('Missing METRC_BASE_URL')
  if (!USER || !KEY) throw new Error('Missing METRC_USER_KEY or METRC_API_KEY')

  const token = Buffer.from(`${USER}:${KEY}`).toString('base64')

  return {
    Authorization: `Basic ${token}`,
    'Content-Type': 'application/json',
  }
}

async function metrcGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'GET',
    headers: getAuthHeader(),
  })

  const text = await res.text()

  let data
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON from METRC: ${text}`)
  }

  if (!res.ok) {
    throw new Error(`METRC ERROR ${res.status}: ${JSON.stringify(data)}`)
  }

  return data
}

module.exports = { metrcGet }