require('dotenv').config()
const { query, getPool } = require('./db/pool')
const bcrypt = require('bcrypt')

async function migrate() {
  console.log('[Migrate] Checking schema...')

  const pool = getPool()
  if (!pool) {
    console.error('[Migrate] DATABASE_URL not set')
    process.exit(1)
  }

  const colCheck = await query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'email'
  `)

  if (colCheck.rows.length > 0) {
    console.log('[Migrate] Renaming users.email → users.username')
    await query(`ALTER TABLE users RENAME COLUMN email TO username`)
    await query(`ALTER TABLE users ALTER COLUMN username TYPE VARCHAR(50)`)
  } else {
    console.log('[Migrate] users.username already exists, skipping rename')
  }

  const hasRole = await query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'role'
  `)
  if (hasRole.rows.length > 0) {
    console.log('[Migrate] Dropping users.role column')
    await query(`ALTER TABLE users DROP COLUMN role`)
  }

  const movColCheck = await query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'movements' AND column_name = 'user_email'
  `)
  if (movColCheck.rows.length > 0) {
    console.log('[Migrate] Renaming movements.user_email → movements.username')
    await query(`ALTER TABLE movements RENAME COLUMN user_email TO username`)
    await query(`ALTER TABLE movements ALTER COLUMN username TYPE VARCHAR(50)`)
  } else {
    const hasUsername = await query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'movements' AND column_name = 'username'
    `)
    if (hasUsername.rows.length === 0) {
      console.log('[Migrate] Adding movements.username column')
      await query(`ALTER TABLE movements ADD COLUMN username VARCHAR(50)`)
    } else {
      console.log('[Migrate] movements.username already exists, skipping')
    }
  }

  const hasBiowaste = await query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'biowaste_reports'
  `)
  if (hasBiowaste.rows.length === 0) {
    console.log('[Migrate] Creating biowaste_reports table')
    await query(`
      CREATE TABLE IF NOT EXISTS biowaste_reports (
        id SERIAL PRIMARY KEY,
        photo_path VARCHAR(500),
        location_name VARCHAR(255) NOT NULL,
        weight_value NUMERIC(10,3) NOT NULL,
        weight_unit VARCHAR(10) NOT NULL DEFAULT 'lbs',
        reported_by VARCHAR(50),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        metrc_response JSONB,
        metrc_submitted BOOLEAN NOT NULL DEFAULT FALSE,
        reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  } else {
    console.log('[Migrate] biowaste_reports table exists, skipping')
  }

  const hasSyncLog = await query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_name = 'sync_log'
  `)
  if (hasSyncLog.rows.length === 0) {
    console.log('[Migrate] Creating sync_log table')
    await query(`
      CREATE TABLE IF NOT EXISTS sync_log (
        key VARCHAR(100) PRIMARY KEY,
        synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)
  } else {
    console.log('[Migrate] sync_log table exists, skipping')
  }

  console.log('[Migrate] Seeding users mike and carmen...')
  const USERS = [
    { username: 'mike', password: process.env.MIKE_PASSWORD || 'x' },
    { username: 'carmen', password: process.env.CARMEN_PASSWORD || 'x' },
  ]

  for (const { username, password } of USERS) {
    const hash = await bcrypt.hash(password, 12)
    try {
      await query(
        `INSERT INTO users (username, password_hash) VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
        [username, hash]
      )
      console.log(`[Migrate] User "${username}" ready`)
    } catch (err) {
      console.error(`[Migrate] Error upserting "${username}":`, err.message)
    }
  }

  console.log('[Migrate] Done.')
  process.exit(0)
}

migrate().catch((err) => {
  console.error('[Migrate] Fatal:', err.message)
  process.exit(1)
})
