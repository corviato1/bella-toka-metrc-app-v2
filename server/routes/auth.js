const express = require('express')
const bcrypt = require('bcrypt')
const { z } = require('zod')
const { query } = require('../db/pool')
const { signToken } = require('../middleware/auth')

const router = express.Router()

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(1).max(128),
})

router.post('/login', async (req, res) => {
  try {
    const parsed = loginSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid email or password format' })
    }

    const { email, password } = parsed.data

    const result = await query('SELECT id, email, password_hash, role FROM users WHERE email = $1', [email.toLowerCase()])

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const user = result.rows[0]
    const match = await bcrypt.compare(password, user.password_hash)

    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' })
    }

    const token = signToken({ id: user.id, email: user.email, role: user.role })

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 8 * 60 * 60 * 1000,
    })

    return res.json({
      token,
      user: { id: user.id, email: user.email, role: user.role },
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
