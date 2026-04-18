const express = require('express')
const { z } = require('zod')
const { query } = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

router.get('/list', async (req, res) => {
  try {
    const result = await query('SELECT id, metrc_tag, current_location, created_at FROM plants ORDER BY created_at DESC')
    return res.json({ plants: result.rows })
  } catch (err) {
    console.error('[Plants] List error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch plants' })
  }
})

router.get('/summary', async (req, res) => {
  try {
    const locResult = await query('SELECT id, name FROM locations ORDER BY name ASC')
    const locations = locResult.rows

    const plantCounts = await query(`
      SELECT current_location, COUNT(*) as count
      FROM plants
      WHERE current_location IS NOT NULL
      GROUP BY current_location
    `)

    const lastMoves = await query(`
      SELECT DISTINCT ON (to_location) to_location, timestamp
      FROM movements
      ORDER BY to_location, timestamp DESC
    `)

    const syncResult = await query(`SELECT synced_at FROM sync_log WHERE key = 'plants'`)
    const lastSync = syncResult.rows[0]?.synced_at || null

    const countMap = {}
    for (const row of plantCounts.rows) {
      countMap[row.current_location] = parseInt(row.count)
    }

    const moveMap = {}
    for (const row of lastMoves.rows) {
      moveMap[row.to_location] = row.timestamp
    }

    const summary = locations.map((loc) => ({
      id: loc.id,
      name: loc.name,
      plantCount: countMap[loc.name] || 0,
      lastMovement: moveMap[loc.name] || null,
    }))

    return res.json({ summary, lastSync })
  } catch (err) {
    console.error('[Plants] Summary error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch summary' })
  }
})

const moveSchema = z.object({
  plantIds: z.array(z.string().min(1).max(50)).min(1).max(200),
  newLocation: z.string().min(1).max(255),
})

router.post('/move', async (req, res) => {
  try {
    const parsed = moveSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid request', details: parsed.error.issues })
    }

    const { plantIds, newLocation } = parsed.data
    const results = []

    for (const tag of plantIds) {
      try {
        const cleanTag = tag.trim().toUpperCase()

        let plantResult = await query(
          'SELECT id, metrc_tag, current_location FROM plants WHERE metrc_tag = $1',
          [cleanTag]
        )

        let plant
        let fromLoc = null
        if (plantResult.rows.length === 0) {
          const insertResult = await query(
            'INSERT INTO plants (metrc_tag, current_location) VALUES ($1, $2) RETURNING id, metrc_tag, current_location',
            [cleanTag, newLocation]
          )
          plant = insertResult.rows[0]
        } else {
          plant = plantResult.rows[0]
          fromLoc = plant.current_location
          await query(
            'UPDATE plants SET current_location = $1 WHERE id = $2',
            [newLocation, plant.id]
          )
        }

        await query(
          `INSERT INTO movements (plant_id, plant_metrc_tag, from_location, to_location, user_id, username)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [plant.id, cleanTag, fromLoc, newLocation, req.user.id, req.user.username]
        )

        results.push({ plantId: cleanTag, success: true })
      } catch (err) {
        console.error(`[Plants] Move error for ${tag}:`, err.message)
        results.push({ plantId: tag, success: false, error: err.message })
      }
    }

    return res.json({ results })
  } catch (err) {
    console.error('[Plants] Move error:', err.message)
    return res.status(500).json({ error: 'Failed to move plants' })
  }
})

module.exports = router
