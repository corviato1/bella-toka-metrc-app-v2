const jwt = require('jsonwebtoken')

const SECRET = process.env.JWT_SECRET

function requireAuth(event) {
  const header = event.headers.authorization

  if (!header) {
    throw new Error('No token')
  }

  const token = header.split(' ')[1]

  try {
    return jwt.verify(token, SECRET)
  } catch {
    throw new Error('Invalid token')
  }
}

function signToken(user) {
  return jwt.sign(
    { username: user },
    SECRET,
    { expiresIn: '12h' }
  )
}

module.exports = { requireAuth, signToken }