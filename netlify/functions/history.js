const { requireAuth } = require('./_auth')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const { rows } = await pool.query(`
      SELECT
        plant_metrc_tag,
        from_location,
        to_location,
        username,
        created_at
      FROM movements
      ORDER BY created_at DESC
      LIMIT 200
    `)

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}