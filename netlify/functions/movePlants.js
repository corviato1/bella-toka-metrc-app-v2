const { Pool } = require('pg')
const { requireAuth } = require('./_auth')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
})

exports.handler = async (event) => {
  try {
    const user = requireAuth(event)

    const { tags, toLocation } = JSON.parse(event.body)

    if (!tags || !toLocation) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing data' }),
      }
    }

    const client = await pool.connect()

    for (const tag of tags) {
      await client.query(
        `UPDATE plants
         SET current_location = $1
         WHERE metrc_tag = $2`,
        [toLocation, tag]
      )

      await client.query(
        `INSERT INTO movements
         (plant_metrc_tag, to_location, username)
         VALUES ($1, $2, $3)`,
        [tag, toLocation, user.username]
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