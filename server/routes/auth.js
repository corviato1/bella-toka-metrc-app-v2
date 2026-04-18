const express = require('express')
const bcrypt = require('bcrypt')
const { z } = require('zod')
const { query } = require('../db/pool')
const { signToken } = require('../middleware/auth')

const router = express.Router()

const loginSchema = z.object({
  username: z.string().min(1).max(50),
  password: z.string().max(128).optional().default(''),
})

const isDevEnvironment = () => process.env.NODE_ENV !== 'production'

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid username or password' })
    }

    const { username, password } = parsed.data

    const result = await query(
      'SELECT id, username, password_hash FROM users WHERE username = $1',
      [username.toLowerCase()]
    )

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]

    if (isDevEnvironment()) {
      console.log(`[Auth] DEV mode: bypassing password check for "${user.username}"`)
    } else {
      const match = await bcrypt.compare(password, user.password_hash)
      if (!match) {
        return res.status(401).json({ error: 'Invalid credentials' })
      }
    }

    const token = signToken({ id: user.id, username: user.username })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    })

    return res.json({
      token,
      user: { id: user.id, username: user.username },
    })
  } catch (err) {
    console.error('[Auth] Login error:', err.message)
    return res.status(500).json({ error: 'Login failed' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  return res.json({ success: true })
})

module.exports = router
