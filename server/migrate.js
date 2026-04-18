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

  console.log('[Migrate] Seeding users mike and carmen...')
  const USERS = [
    { username: 'mike', password: process.env.MIKE_PASSWORD || '0' },
    { username: 'carmen', password: process.env.CARMEN_PASSWORD || '0' },
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
