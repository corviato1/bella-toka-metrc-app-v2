const { Pool } = require('pg')
const jwt = require('jsonwebtoken')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET

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

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors() }
  }

  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, headers: cors(), body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  try {
    verifyToken(event)
  } catch {
    return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  try {
    const params = event.queryStringParameters || {}
    const limit = Math.min(parseInt(params.limit) || 20, 100)
    const offset = parseInt(params.offset) || 0
    const search = params.search ? `%${params.search}%` : null

    let countQ, dataQ, args

    if (search) {
      countQ = `SELECT COUNT(*) FROM movements WHERE plant_metrc_tag ILIKE $1 OR to_location ILIKE $1 OR from_location ILIKE $1 OR username ILIKE $1`
      dataQ = `SELECT id, plant_id, plant_metrc_tag, from_location, to_location, user_id, username, timestamp FROM movements WHERE plant_metrc_tag ILIKE $1 OR to_location ILIKE $1 OR from_location ILIKE $1 OR username ILIKE $1 ORDER BY timestamp DESC LIMIT $2 OFFSET $3`
      args = [search, limit, offset]
    } else {
      countQ = 'SELECT COUNT(*) FROM movements'
      dataQ = 'SELECT id, plant_id, plant_metrc_tag, from_location, to_location, user_id, username, timestamp FROM movements ORDER BY timestamp DESC LIMIT $1 OFFSET $2'
      args = [limit, offset]
    }

    const [countRes, dataRes] = await Promise.all([
      search ? pool.query(countQ, [search]) : pool.query(countQ),
      pool.query(dataQ, args),
    ])

    return {
      statusCode: 200,
      headers: cors(),
      body: JSON.stringify({
        movements: dataRes.rows,
        total: parseInt(countRes.rows[0].count),
        limit,
        offset,
      }),
    }
  } catch (err) {
    return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'Failed to fetch history' }) }
  }
}
