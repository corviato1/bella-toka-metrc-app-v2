import { Client } from 'pg'
import jwt from 'jsonwebtoken'

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

let isConnected = false

async function connectDB() {
  if (!isConnected) {
    await client.connect()
    isConnected = true
  }
}

function verifyToken(event) {
  const auth = event.headers.authorization || ''
  const token = auth.replace('Bearer ', '')

  if (!token) throw new Error('Unauthorized')

  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    throw new Error('Invalid token')
  }
}

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const user = verifyToken(event)

    const body = JSON.parse(event.body || '{}')

    const {
      location,
      weight,
      unit,
      photoBase64
    } = body

    if (!location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Location required' })
      }
    }

    if (!weight) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Weight required' })
      }
    }

    await connectDB()

    const result = await client.query(
      `
      INSERT INTO biowaste_reports (
        location,
        weight,
        unit,
        photo_base64,
        user_name,
        created_at
      )
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id
      `,
      [
        location,
        weight,
        unit || 'lbs',
        photoBase64 || null,
        user.username || 'unknown'
      ]
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        reportId: result.rows[0].id
      })
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message || 'Server error'
      })
    }
  }
}