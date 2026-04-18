require('dotenv').config()
const bcrypt = require('bcrypt')
const { query, initDb } = require('./db/pool')

async function createAdmin() {
  const email = process.env.ADMIN_EMAIL || 'admin@facility.com'
  const password = process.env.ADMIN_PASSWORD || 'Admin123!'

  await initDb()

  const hash = await bcrypt.hash(password, 12)

  try {
    await query(
      `INSERT INTO users (email, password_hash, role) VALUES ($1, $2, 'admin')
       ON CONFLICT (email) DO UPDATE SET password_hash = $2, role = 'admin'`,
      [email, hash]
    )
    console.log(`[Setup] Admin user created/updated: ${email}`)
    console.log(`[Setup] Password: ${password}`)
  } catch (err) {
    console.error('[Setup] Error creating admin:', err.message)
  }

  process.exit(0)
}

createAdmin().catch(console.error)
