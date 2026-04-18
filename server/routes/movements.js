const express = require('express')
const { query } = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

router.use(requireAuth)

router.get('/history', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100)
    const offset = parseInt(req.query.offset) || 0
    const search = req.query.search ? `%${req.query.search}%` : null

    let countQuery, dataQuery, params

    if (search) {
      countQuery = `
        SELECT COUNT(*) FROM movements
        WHERE plant_metrc_tag ILIKE $1
           OR to_location ILIKE $1
           OR from_location ILIKE $1
           OR user_email ILIKE $1
      `
      dataQuery = `
        SELECT id, plant_id, plant_metrc_tag, from_location, to_location, user_id, user_email, timestamp
        FROM movements
        WHERE plant_metrc_tag ILIKE $1
           OR to_location ILIKE $1
           OR from_location ILIKE $1
           OR user_email ILIKE $1
        ORDER BY timestamp DESC
        LIMIT $2 OFFSET $3
      `
      params = [search, limit, offset]
    } else {
      countQuery = 'SELECT COUNT(*) FROM movements'
      dataQuery = `
        SELECT id, plant_id, plant_metrc_tag, from_location, to_location, user_id, user_email, timestamp
        FROM movements
        ORDER BY timestamp DESC
        LIMIT $1 OFFSET $2
      `
      params = [limit, offset]
    }

    const [countResult, dataResult] = await Promise.all([
      search ? query(countQuery, [search]) : query(countQuery),
      query(dataQuery, params),
    ])

    return res.json({
      movements: dataResult.rows,
      total: parseInt(countResult.rows[0].count),
      limit,
      offset,
    })
  } catch (err) {
    console.error('[Movements] History error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch movement history' })
  }
})

module.exports = router
