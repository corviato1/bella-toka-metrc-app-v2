const { requireAuth } = require('./_auth')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

function last4(tag) {
  return tag ? tag.slice(-4) : ''
}

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const { rows } = await pool.query(`
      SELECT
        plant_metrc_tag,
        current_location
      FROM plants
      WHERE current_location IS NOT NULL
    `)

    const map = {}

    for (const row of rows) {
      const key = row.current_location

      if (!key) continue

      if (!map[key]) {
        map[key] = []
      }

      map[key].push(last4(row.plant_metrc_tag))
    }

    return {
      statusCode: 200,
      body: JSON.stringify(map),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}