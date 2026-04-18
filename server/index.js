require('dotenv').config()
const express = require('express')
const rateLimit = require('express-rate-limit')
const cors = require('cors')

const authRoutes = require('./routes/auth')
const plantsRoutes = require('./routes/plants')
const locationsRoutes = require('./routes/locations')
const movementsRoutes = require('./routes/movements')
const { initDb } = require('./db/pool')

const app = express()
const PORT = process.env.API_PORT || 8888

app.set('trust proxy', 1)

app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: false }))

app.use(cors({
  origin: process.env.FRONTEND_URL || true,
  credentials: true,
}))

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts, please try again later.' },
})

app.use(globalLimiter)

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/api/auth', authLimiter, authRoutes)
app.use('/api/plants', plantsRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/movements', movementsRoutes)

app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err.message)
  res.status(500).json({ error: 'Internal server error' })
})

async function start() {
  if (process.env.DATABASE_URL) {
    await initDb()
  } else {
    console.warn('[Server] DATABASE_URL not set — skipping DB initialization')
  }

  app.listen(PORT, 'localhost', () => {
    console.log(`[Server] API server running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)
