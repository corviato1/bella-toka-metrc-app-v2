const BASE = process.env.METRC_BASE_URL
const KEY = process.env.METRC_API_KEY

async function metrcGet(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      Authorization: `Basic ${Buffer.from(KEY).toString('base64')}`,
    },
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`METRC ERROR ${res.status}: ${text}`)
  }

  return res.json()
}

module.exports = { metrcGet }