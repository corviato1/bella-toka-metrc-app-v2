const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

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

      const username = (body.username || '').toLowerCase()
      const password = body.password || ''

      let valid = false

      if (username === 'mike' && password === process.env.MIKE_PASSWORD) {
        valid = true
      }

      if (username === 'carmen' && password === process.env.CARMEN_PASSWORD) {
        valid = true
      }

      if (!valid) {
        return {
          statusCode: 401,
          headers: cors(),
          body: JSON.stringify({ error: 'Invalid credentials' }),
        }
      }

      const token = jwt.sign(
        { username },
        JWT_SECRET,
        { expiresIn: '12h' }
      )

      return {
        statusCode: 200,
        headers: cors({
          'Set-Cookie': `token=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=43200`,
        }),
        body: JSON.stringify({
          token,
          user: { username },
        }),
      }
    }

    // 🔐 LOGOUT
    if (event.httpMethod === 'POST' && path === '/logout') {
      return {
        statusCode: 200,
        headers: cors({
          'Set-Cookie': 'token=; HttpOnly; Secure; SameSite=None; Max-Age=0; Path=/',
        }),
        body: JSON.stringify({ success: true }),
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