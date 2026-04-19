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

  try {
    const path = event.path
      .replace('/.netlify/functions/auth', '')
      .replace('/api/auth', '')

    // 🔐 LOGIN
    if (event.httpMethod === 'POST' && (path === '/login' || path === '' || path === '/')) {
      const body = JSON.parse(event.body || '{}')
      const parsed = loginSchema.safeParse(body)

      if (!parsed.success) {
        return {
          statusCode: 400,
          headers: cors(),
          body: JSON.stringify({ error: 'Invalid input' }),
        }
      }

      const { username, password } = parsed.data

      const result = await pool.query(
        'SELECT id, username, password_hash FROM users WHERE username = $1',
        [username.toLowerCase()]
      )

      if (result.rows.length === 0) {
        return {
          statusCode: 401,
          headers: cors(),
          body: JSON.stringify({ error: 'User not found' }),
        }
      }

      const user = result.rows[0]

      const match = await bcrypt.compare(password, user.password_hash)

      if (!match) {
        return {
          statusCode: 401,
          headers: cors(),
          body: JSON.stringify({ error: 'Password mismatch' }),
        }
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        JWT_SECRET,
        { expiresIn: '8h' }
      )

      return {
        statusCode: 200,
        headers: cors({
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=28800`,
        }),
        body: JSON.stringify({
          token,
          user: { id: user.id, username: user.username },
        }),
      }
    }

    // 🔥 FORCE RESET PASSWORD HASH (THIS FIXES EVERYTHING)
    if (event.httpMethod === 'POST' && path === '/force-set-password') {
      const body = JSON.parse(event.body || '{}')
      const username = body.username || 'mike'
      const password = body.password || 'test123'

      const hash = await bcrypt.hash(password, 10)

      await pool.query(
        'UPDATE users SET password_hash = $1 WHERE username = $2',
        [hash, username]
      )

      return {
        statusCode: 200,
        headers: cors(),
        body: JSON.stringify({
          success: true,
          username,
          password,
          hash
        }),
      }
    }

    // 🔍 DEBUG
    if (event.httpMethod === 'GET' && path === '/debug') {
      const users = await pool.query('SELECT username, password_hash FROM users')

      return {
        statusCode: 200,
        headers: cors(),
        body: JSON.stringify({
          users: users.rows
        }),
      }
    }

    return {
      statusCode: 404,
      headers: cors(),
      body: JSON.stringify({ error: 'Not found' }),
    }

  } catch (err) {
    console.error(err)
    return {
      statusCode: 500,
      headers: cors(),
      body: JSON.stringify({ error: err.message }),
    }
  }
}