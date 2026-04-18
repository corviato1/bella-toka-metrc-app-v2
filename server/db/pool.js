const { Pool } = require('pg')

let pool

function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL

    if (!connectionString) {
      console.warn('[DB] WARNING: DATABASE_URL not set. Database features will not work.')
      return null
    }

    pool = new Pool({
      connectionString,
      ssl: connectionString.includes('neon.tech') || connectionString.includes('sslmode=require')
        ? { rejectUnauthorized: false }
        : false,
      max: 10,
      idleTimeoutMillis: 30000,
    })

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message)
    })
  }
  return pool
}

async function query(text, params) {
  const p = getPool()
  if (!p) throw new Error('Database not configured. Set DATABASE_URL environment variable.')
  return p.query(text, params)
}

async function initDb() {
  const fs = require('fs')
  const path = require('path')
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
  try {
    await query(schema)
    console.log('[DB] Schema initialized successfully')
  } catch (err) {
    console.error('[DB] Schema init error:', err.message)
  }
}

module.exports = { query, getPool, initDb }
