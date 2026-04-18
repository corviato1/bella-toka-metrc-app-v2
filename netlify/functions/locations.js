const { Pool } = require('pg')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

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

  try {
    verifyToken(event)
  } catch {
    return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Unauthorized' }) }
  }

  const method = event.httpMethod
  const pathParts = event.path.split('/').filter(Boolean)
  const id = pathParts[pathParts.length - 1]
  const hasId = id && !isNaN(parseInt(id))

  const nameSchema = z.object({ name: z.string().min(1).max(255) })

  if (method === 'GET') {
    const result = await pool.query('SELECT id, name FROM locations ORDER BY name ASC')
    return { statusCode: 200, headers: cors(), body: JSON.stringify({ locations: result.rows }) }
  }

  if (method === 'POST') {
    const parsed = nameSchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid name' }) }
    try {
      const res = await pool.query('INSERT INTO locations (name) VALUES ($1) RETURNING id, name', [parsed.data.name])
      return { statusCode: 201, headers: cors(), body: JSON.stringify({ location: res.rows[0] }) }
    } catch (err) {
      if (err.code === '23505') return { statusCode: 409, headers: cors(), body: JSON.stringify({ error: 'Already exists' }) }
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'Failed' }) }
    }
  }

  if (method === 'PUT' && hasId) {
    const parsed = nameSchema.safeParse(JSON.parse(event.body || '{}'))
    if (!parsed.success) return { statusCode: 400, headers: cors(), body: JSON.stringify({ error: 'Invalid name' }) }
    const res = await pool.query('UPDATE locations SET name=$1 WHERE id=$2 RETURNING id, name', [parsed.data.name, parseInt(id)])
    if (!res.rows.length) return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Not found' }) }
    return { statusCode: 200, headers: cors(), body: JSON.stringify({ location: res.rows[0] }) }
  }

  if (method === 'DELETE' && hasId) {
    const res = await pool.query('DELETE FROM locations WHERE id=$1 RETURNING id', [parseInt(id)])
    if (!res.rows.length) return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Not found' }) }
    return { statusCode: 200, headers: cors(), body: JSON.stringify({ success: true }) }
  }

  return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Not found' }) }
}
