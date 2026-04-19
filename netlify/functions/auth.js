const { signToken } = require('./_auth')

exports.handler = async (event) => {
  try {
    const { username, password } = JSON.parse(event.body)

    if (!username || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing credentials' }),
      }
    }

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
        body: JSON.stringify({ error: 'Invalid credentials' }),
      }
    }

    const token = signToken(username)

    return {
      statusCode: 200,
      body: JSON.stringify({
        user: username,
        token,
      }),
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}