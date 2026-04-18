require('dotenv').config()
const bcrypt = require('bcrypt')
const { query, initDb } = require('./db/pool')

const USERS = [
  { username: 'mike', password: process.env.MIKE_PASSWORD || 'x' },
  { username: 'carmen', password: process.env.CARMEN_PASSWORD || 'x' },
]

async function seedUsers() {
  await initDb()

  for (const { username, password } of USERS) {
    const hash = await bcrypt.hash(password, 12)
    try {
      await query(
        `INSERT INTO users (username, password_hash) VALUES ($1, $2)
         ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
        [username, hash]
      )
      console.log(`[Setup] User "${username}" created/updated`)
    } catch (err) {
      console.error(`[Setup] Error creating user "${username}":`, err.message)
    }
  }

  process.exit(0)
}

seedUsers().catch(console.error)
