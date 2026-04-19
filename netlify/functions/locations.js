const { Pool } = require('pg')
const { requireAuth } = require('./_auth')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const res = await pool.query(`
      SELECT name
      FROM locations
      ORDER BY name
    `)

    return {
      statusCode: 200,
      body: JSON.stringify(res.rows),
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}