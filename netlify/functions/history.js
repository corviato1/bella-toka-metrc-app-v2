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
      SELECT *
      FROM movements
      ORDER BY created_at DESC
      LIMIT 200
    `)

    return {
      statusCode: 200,
      body: JSON.stringify(rows),
    }
  } catch (err) {
    const status = err.statusCode || 500
    return {
      statusCode: status,
      body: JSON.stringify({ error: err.message }),
    }
  }
}