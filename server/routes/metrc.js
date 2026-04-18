const express = require('express')
const { query } = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

function getMetrcConfig() {
  const apiKey = process.env.METRC_API_KEY
  const licenseNumber = process.env.METRC_LICENSE_NUMBER
  const baseUrl = process.env.METRC_BASE_URL || 'https://api-ca.metrc.com'
  return { apiKey, licenseNumber, baseUrl }
}

function metrcHeaders(apiKey) {
  const encoded = Buffer.from(`${apiKey}:`).toString('base64')
  return {
    'Authorization': `Basic ${encoded}`,
    'Content-Type': 'application/json',
  }
}

async function metrcFetch(url, options = {}) {
  const res = await fetch(url, options)
  const text = await res.text()
  let body
  try { body = JSON.parse(text) } catch { body = text }
  return { ok: res.ok, status: res.status, body }
}

router.get('/locations/sync', async (req, res) => {
  const { apiKey, licenseNumber, baseUrl } = getMetrcConfig()

  if (!apiKey || !licenseNumber) {
    return res.status(503).json({
      error: 'METRC not configured. Set METRC_API_KEY and METRC_LICENSE_NUMBER env vars.',
      configured: false,
    })
  }

  try {
    const url = `${baseUrl}/locations/v1/active?licenseNumber=${encodeURIComponent(licenseNumber)}`
    const result = await metrcFetch(url, { headers: metrcHeaders(apiKey) })

    if (!result.ok) {
      return res.status(502).json({ error: 'METRC API error', details: result.body })
    }

    const metrcLocations = Array.isArray(result.body) ? result.body : []

    for (const loc of metrcLocations) {
      const name = loc.Name || loc.name
      if (name) {
        await query(
          `INSERT INTO locations (name) VALUES ($1) ON CONFLICT (name) DO NOTHING`,
          [name]
        )
      }
    }

    await query(
      `INSERT INTO sync_log (key, synced_at) VALUES ('locations', NOW())
       ON CONFLICT (key) DO UPDATE SET synced_at = NOW()`
    )

    const allLocations = await query('SELECT id, name FROM locations ORDER BY name ASC')
    return res.json({ synced: metrcLocations.length, locations: allLocations.rows })
  } catch (err) {
    console.error('[METRC] Location sync error:', err.message)
    return res.status(500).json({ error: 'Location sync failed', details: err.message })
  }
})

router.get('/plants/sync', async (req, res) => {
  const { apiKey, licenseNumber, baseUrl } = getMetrcConfig()

  if (!apiKey || !licenseNumber) {
    return res.status(503).json({
      error: 'METRC not configured. Set METRC_API_KEY and METRC_LICENSE_NUMBER env vars.',
      configured: false,
    })
  }

  try {
    const today = new Date().toISOString().split('T')[0]
    const url = `${baseUrl}/plants/v1/vegetative?licenseNumber=${encodeURIComponent(licenseNumber)}&lastModifiedStart=2020-01-01&lastModifiedEnd=${today}`
    const result = await metrcFetch(url, { headers: metrcHeaders(apiKey) })

    if (!result.ok) {
      return res.status(502).json({ error: 'METRC API error', details: result.body })
    }

    const metrcPlants = Array.isArray(result.body) ? result.body : []
    let synced = 0

    for (const plant of metrcPlants) {
      const tag = plant.Label || plant.label
      const location = plant.LocationName || plant.location_name || plant.RoomName
      if (tag) {
        await query(
          `INSERT INTO plants (metrc_tag, current_location)
           VALUES ($1, $2)
           ON CONFLICT (metrc_tag) DO UPDATE SET current_location = EXCLUDED.current_location`,
          [tag, location || null]
        )
        synced++
      }
    }

    await query(
      `INSERT INTO sync_log (key, synced_at) VALUES ('plants', NOW())
       ON CONFLICT (key) DO UPDATE SET synced_at = NOW()`
    )

    return res.json({ synced })
  } catch (err) {
    console.error('[METRC] Plant sync error:', err.message)
    return res.status(500).json({ error: 'Plant sync failed', details: err.message })
  }
})

router.post('/move', async (req, res) => {
  const { apiKey, licenseNumber, baseUrl } = getMetrcConfig()

  if (!apiKey || !licenseNumber) {
    return res.status(503).json({
      error: 'METRC not configured',
      configured: false,
    })
  }

  const { plantTags, location, moveDate } = req.body
  if (!Array.isArray(plantTags) || !location) {
    return res.status(400).json({ error: 'plantTags and location are required' })
  }

  try {
    const body = plantTags.map((tag) => ({
      Id: null,
      Label: tag,
      Location: location,
      ActualDate: moveDate || new Date().toISOString().split('T')[0],
    }))

    const url = `${baseUrl}/plants/v1/moveplants?licenseNumber=${encodeURIComponent(licenseNumber)}`
    const result = await metrcFetch(url, {
      method: 'POST',
      headers: metrcHeaders(apiKey),
      body: JSON.stringify(body),
    })

    if (!result.ok) {
      return res.status(502).json({ error: 'METRC API error', details: result.body })
    }

    return res.json({ success: true, metrc: result.body })
  } catch (err) {
    console.error('[METRC] Move error:', err.message)
    return res.status(500).json({ error: 'METRC move failed', details: err.message })
  }
})

router.post('/biowaste', async (req, res) => {
  const { apiKey, licenseNumber, baseUrl } = getMetrcConfig()

  if (!apiKey || !licenseNumber) {
    return res.status(503).json({
      error: 'METRC not configured',
      configured: false,
    })
  }

  const { reportId } = req.body
  if (!reportId) {
    return res.status(400).json({ error: 'reportId is required' })
  }

  try {
    const reportRes = await query('SELECT * FROM biowaste_reports WHERE id = $1', [reportId])
    if (reportRes.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }

    const report = reportRes.rows[0]
    const body = [{
      WasteType: 'Waste',
      UnitOfWeight: report.weight_unit === 'kg' ? 'Kilograms' : 'Pounds',
      WasteWeight: parseFloat(report.weight_value),
      WasteReason: 'Biowaste',
      ReasonNote: `Location: ${report.location_name}`,
      FinishedDate: new Date(report.reported_at).toISOString().split('T')[0],
    }]

    const url = `${baseUrl}/plantbatches/v1/waste?licenseNumber=${encodeURIComponent(licenseNumber)}`
    const result = await metrcFetch(url, {
      method: 'POST',
      headers: metrcHeaders(apiKey),
      body: JSON.stringify(body),
    })

    const metrcResponse = { status: result.status, body: result.body }
    await query(
      `UPDATE biowaste_reports SET metrc_submitted = $1, metrc_response = $2 WHERE id = $3`,
      [result.ok, JSON.stringify(metrcResponse), reportId]
    )

    if (!result.ok) {
      return res.status(502).json({ error: 'METRC API error', details: result.body })
    }

    return res.json({ success: true, metrc: result.body })
  } catch (err) {
    console.error('[METRC] Biowaste submit error:', err.message)
    return res.status(500).json({ error: 'METRC biowaste submission failed', details: err.message })
  }
})

module.exports = router
