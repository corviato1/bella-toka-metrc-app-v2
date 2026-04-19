const { metrcGet } = require('./_metrc')
const { Pool } = require('pg')
const { requireAuth } = require('./_auth')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const locations = await metrcGet('/locations/v2/active')

    const client = await pool.connect()

    for (const loc of locations) {
      await client.query(
        `INSERT INTO locations (name)
         VALUES ($1)
         ON CONFLICT (name) DO NOTHING`,
        [loc.Name]
      )
    }

    client.release()

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}