const express = require('express')
const { z } = require('zod')
const { query } = require('../db/pool')
const { requireAuth, requireAdmin } = require('../middleware/auth')

const router = express.Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await query('SELECT id, name, created_at FROM locations ORDER BY name ASC')
    return res.json({ locations: result.rows })
  } catch (err) {
    console.error('[Locations] List error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch locations' })
  }
})

const locationSchema = z.object({
  name: z.string().min(1).max(255),
})

router.post('/', requireAdmin, async (req, res) => {
  try {
    const parsed = locationSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid location name' })
    }

    const result = await query(
      'INSERT INTO locations (name) VALUES ($1) RETURNING id, name',
      [parsed.data.name]
    )
    return res.status(201).json({ location: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Location already exists' })
    }
    console.error('[Locations] Create error:', err.message)
    return res.status(500).json({ error: 'Failed to create location' })
  }
})

router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

    const parsed = locationSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: 'Invalid location name' })
    }

    const result = await query(
      'UPDATE locations SET name = $1 WHERE id = $2 RETURNING id, name',
      [parsed.data.name, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' })
    }

    return res.json({ location: result.rows[0] })
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Location name already in use' })
    }
    console.error('[Locations] Update error:', err.message)
    return res.status(500).json({ error: 'Failed to update location' })
  }
})

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id)
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid ID' })

    const result = await query('DELETE FROM locations WHERE id = $1 RETURNING id', [id])

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Location not found' })
    }

    return res.json({ success: true })
  } catch (err) {
    console.error('[Locations] Delete error:', err.message)
    return res.status(500).json({ error: 'Failed to delete location' })
  }
})

module.exports = router
