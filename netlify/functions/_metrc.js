const fetch = require('node-fetch')

function getAuthHeader() {
  const key = process.env.METRC_API_KEY
  if (!key) throw new Error('Missing METRC_API_KEY')

  return {
    Authorization: `Basic ${Buffer.from(key).toString('base64')}`,
    'Content-Type': 'application/json',
  }
}

async function metrcGet(path) {
  const base = process.env.METRC_BASE_URL
  if (!base) throw new Error('Missing METRC_BASE_URL')

  const res = await fetch(`${base}${path}`, {
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