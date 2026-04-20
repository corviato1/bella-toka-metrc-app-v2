const { requireAuth } = require('./_auth')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function normalizeLocation(name) {
  if (!name) return null

  const n = name.toLowerCase()

  if (n.includes('veg1')) return 'R12B'
  if (n.includes('veg2')) return 'R12C'
  if (n.includes('veg3')) return 'R11B'
  if (n.includes('veg4')) return 'R11C'

  if (n.includes('f1')) return 'R10A'
  if (n.includes('f2')) return 'R9A'
  if (n.includes('f3')) return 'R8A'
  if (n.includes('f4')) return 'R7A'
  if (n.includes('f5')) return 'R6A'
  if (n.includes('f6')) return 'R5A'
  if (n.includes('f7')) return 'R4A'
  if (n.includes('f8')) return 'R3A'
  if (n.includes('f9')) return 'R2A'

  if (n.includes('h1')) return 'R1A'
  if (n.includes('h2')) return 'R1B'

  return null
}

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const { rows } = await pool.query(`
      SELECT metrc_tag, current_location_id
      FROM plants
    `)

    const locMap = {}
    const locRows = await pool.query(`SELECT id, name FROM locations`)
    for (const l of locRows.rows) {
      locMap[l.id] = l.name
    }

    const result = {}

    for (const r of rows) {
      const name = locMap[r.current_location_id]
      const code = normalizeLocation(name)

      if (!code) continue

      if (!result[code]) result[code] = []

      result[code].push(r.metrc_tag.slice(-4))
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result),
    }
  } catch (err) {
    const status = err.statusCode || 500
    return {
      statusCode: status,
      body: JSON.stringify({ error: err.message }),
    }
  }
}