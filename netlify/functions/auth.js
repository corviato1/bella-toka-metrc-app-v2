const bcrypt = require('bcrypt')
const { Pool } = require('pg')
const jwt = require('jsonwebtoken')
const { z } = require('zod')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

const JWT_SECRET = process.env.JWT_SECRET

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().min(1).max(128),
})

function cors(extra = {}) {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json',
    ...extra,
  }
}

exports.handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: cors() }
  }

  const path = event.path.replace('/.netlify/functions/auth', '').replace('/api/auth', '')

  if (event.httpMethod === 'POST' && (path === '/login' || path === '' || path === '/')) {
    try {
      const body = JSON.parse(event.body || '{}')
      const parsed = loginSchema.safeParse(body)

      if (!parsed.success) {
        return {
          statusCode: 400,
          headers: cors(),
          body: JSON.stringify({ error: 'Invalid username or password' }),
        }
      }

      const { username, password } = parsed.data
      const result = await pool.query(
        'SELECT id, username, password_hash FROM users WHERE username = $1',
        [username.toLowerCase()]
      )

      if (result.rows.length === 0) {
        return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Invalid credentials' }) }
      }

      const user = result.rows[0]
      const match = await bcrypt.compare(password, user.password_hash)

      if (!match) {
        return { statusCode: 401, headers: cors(), body: JSON.stringify({ error: 'Invalid credentials' }) }
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' })

      return {
        statusCode: 200,
        headers: cors({
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=Strict; Max-Age=28800; Path=/`,
        }),
        body: JSON.stringify({ token, user: { id: user.id, username: user.username } }),
      }
    } catch (err) {
      return { statusCode: 500, headers: cors(), body: JSON.stringify({ error: 'Login failed' }) }
    }
  }

  if (event.httpMethod === 'POST' && path === '/logout') {
    return {
      statusCode: 200,
      headers: cors({
        'Set-Cookie': 'token=; HttpOnly; Secure; SameSite=Strict; Max-Age=0; Path=/',
      }),
      body: JSON.stringify({ success: true }),
    }
  }

  return { statusCode: 404, headers: cors(), body: JSON.stringify({ error: 'Not found' }) }
}
