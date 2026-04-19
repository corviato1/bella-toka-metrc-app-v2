const jwt = require('jsonwebtoken')

const JWT_SECRET = process.env.JWT_SECRET

exports.verifyAuth = (event) => {
  const authHeader = event.headers.authorization || event.headers.Authorization

  if (!authHeader) {
    return { error: 'No token provided' }
  }

  const token = authHeader.replace('Bearer ', '')

  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    return { user: decoded }
  } catch (err) {
    return { error: 'Invalid token' }
  }
}