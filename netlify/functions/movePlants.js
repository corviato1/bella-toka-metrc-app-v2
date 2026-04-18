const { Pool } = require('pg')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET
const METRC_API_KEY = process.env.METRC_API_KEY
const METRC_LICENSE = process.env.METRC_LICENSE_NUMBER

function cors() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
  }
}

function verifyToken(event) {
  const authHeader = event.headers['authorization'] || event.headers['Authorization'] || ''
  const cookieHeader = event.headers['cookie'] || ''
  let token = null

  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7)
  } else {
    const match = cookieHeader.match(/token=([^;]+)/)
    if (match) token = match[1]
  }

  if (!token) throw new Error('Unauthorized')
  return jwt.verify(token, JWT_SECRET)
}

async function callMetrcApi(plantIds, locationName) {
  if (!METRC_API_KEY || !METRC_LICENSE) {
    console.log('[METRC] API key not configured, skipping METRC sync')
    return { success: true, skipped: true }
  }

  const body = plantIds.map((tag) => ({
    Id: tag,
    Location: locationName,
    ActualDate: new Date().toISOString().split('T')[0],
  }))

  const response = await fetch(
    `https://api.metrc.com/plants/v1/moveplants?licenseNumber=${METRC_LICENSE}`,
    {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${Buffer.from(`${METRC_API_KEY}:`).toString('base64')}`,
      },
      body: JSON.stringify(body),
    }
  )

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`METRC error ${response.status}: ${text}`)
  }

  return { success: true }
}

const moveSchema = z.object({
  plantIds: z.array(z.string().min(1).max(50)).min(1).max(200),
  newLocation: z.string().min(1).max(255),
})

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors() }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let user
  try {
    user = verifyToken(event)
  } catch {
    return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const parsed = moveSchema.safeParse(body)

    if (!parsed.success) {
      return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid request' }) }
    }

    const { plantIds, newLocation } = parsed.data
    const results = []

    for (const tag of plantIds) {
      const cleanTag = tag.trim().toUpperCase()
      try {
        let plantResult = await pool.query(
          'SELECT id, metrc_tag, current_location FROM plants WHERE metrc_tag = $1',
          [cleanTag]
        )

        let plant
        if (plantResult.rows.length === 0) {
          const ins = await pool.query(
            'INSERT INTO plants (metrc_tag, current_location) VALUES ($1, $2) RETURNING id, metrc_tag, current_location',
            [cleanTag, newLocation]
          )
          plant = ins.rows[0]
        } else {
          plant = plantResult.rows[0]
          await pool.query('UPDATE plants SET current_location = $1 WHERE id = $2', [newLocation, plant.id])
        }

        await pool.query(
          'INSERT INTO movements (plant_id, plant_metrc_tag, from_location, to_location, user_id, username) VALUES ($1,$2,$3,$4,$5,$6)',
          [plant.id, cleanTag, plant.current_location, newLocation, user.id, user.username]
        )

        results.push({ plantId: cleanTag, success: true })
      } catch (err) {
        results.push({ plantId: tag, success: false, error: err.message })
      }
    }

    const successIds = results.filter((r) => r.success).map((r) => r.plantId)
    if (successIds.length > 0) {
      try {
        await callMetrcApi(successIds, newLocation)
      } catch (err) {
        console.error('[METRC] API call failed:', err.message)
      }
    }

    return { statusCode: 200, headers: cors(), body: JSON.stringify({ results }) }
  } catch (err) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'Failed to process request' }) }
  }
}
