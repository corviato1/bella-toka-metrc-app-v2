const { requireAuth } = require('./_auth')
const { metrcGet } = require('./_metrc')
const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

exports.handler = async (event) => {
  try {
    const user = requireAuth(event)

    const data = await metrcGet('/locations/v1/active')

    if (!Array.isArray(data)) {
      throw new Error('METRC did not return array')
    }

    const client = await pool.connect()

    try {
      await client.query('BEGIN')

      for (const loc of data) {
        if (!loc || !loc.Name) continue

        await client.query(
          `INSERT INTO locations (name)
           VALUES ($1)
           ON CONFLICT (name) DO NOTHING`,
          [loc.Name]
        )
      }

      await client.query('COMMIT')
    } catch (e) {
      await client.query('ROLLBACK')
      throw e
    } finally {
      client.release()
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    }

  } catch (err) {
    console.error('METRC LOCATIONS ERROR:', err)

    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({
        error: err.message
      }),
    }
  }
}