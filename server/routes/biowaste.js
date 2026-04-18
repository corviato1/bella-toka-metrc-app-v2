const express = require('express')
const multer = require('multer')
const path = require('path')
const { query } = require('../db/pool')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()
router.use(requireAuth)

const storage = multer.diskStorage({
  destination: path.join(__dirname, '../uploads'),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg'
    cb(null, `biowaste-${Date.now()}${ext}`)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'))
    }
  },
})

router.post('/photo', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No photo uploaded' })
  }
  const url = `/uploads/${req.file.filename}`
  return res.json({ url, filename: req.file.filename })
})

router.post('/report', async (req, res) => {
  const { photoPath, locationName, weightValue, weightUnit } = req.body

  if (!locationName || weightValue == null) {
    return res.status(400).json({ error: 'locationName and weightValue are required' })
  }

  const unit = weightUnit || 'lbs'
  const weight = parseFloat(weightValue)

  if (isNaN(weight) || weight <= 0) {
    return res.status(400).json({ error: 'weightValue must be a positive number' })
  }

  try {
    const result = await query(
      `INSERT INTO biowaste_reports
         (photo_path, location_name, weight_value, weight_unit, reported_by, user_id, metrc_submitted)
       VALUES ($1, $2, $3, $4, $5, $6, FALSE)
       RETURNING id, reported_at`,
      [photoPath || null, locationName, weight, unit, req.user.username, req.user.id]
    )

    const report = result.rows[0]
    return res.status(201).json({ reportId: report.id, reportedAt: report.reported_at })
  } catch (err) {
    console.error('[Biowaste] Report error:', err.message)
    return res.status(500).json({ error: 'Failed to save report' })
  }
})

router.get('/reports', async (req, res) => {
  try {
    const {
      startDate,
      endDate,
      location,
      metrcStatus,
      reporter,
    } = req.query

    let limit = parseInt(req.query.limit, 10)
    if (isNaN(limit) || limit <= 0) limit = 50
    if (limit > 200) limit = 200

    let offset = parseInt(req.query.offset, 10)
    if (isNaN(offset) || offset < 0) offset = 0

    const conditions = []
    const params = []

    if (startDate) {
      params.push(startDate)
      conditions.push(`reported_at >= $${params.length}`)
    }
    if (endDate) {
      params.push(endDate)
      conditions.push(`reported_at <= $${params.length}`)
    }
    if (location) {
      params.push(location)
      conditions.push(`location_name = $${params.length}`)
    }
    if (metrcStatus === 'submitted') {
      conditions.push(`metrc_submitted = TRUE`)
    } else if (metrcStatus === 'not_submitted') {
      conditions.push(`metrc_submitted = FALSE`)
    }
    if (reporter) {
      params.push(`%${reporter}%`)
      conditions.push(`reported_by ILIKE $${params.length}`)
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM biowaste_reports ${whereClause}`,
      params
    )
    const total = countResult.rows[0].total

    params.push(limit)
    params.push(offset)
    const result = await query(
      `SELECT id, photo_path, location_name, weight_value, weight_unit,
              reported_by, metrc_submitted, reported_at
       FROM biowaste_reports
       ${whereClause}
       ORDER BY reported_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    )

    return res.json({
      reports: result.rows,
      total,
      limit,
      offset,
      hasMore: offset + result.rows.length < total,
    })
  } catch (err) {
    console.error('[Biowaste] List error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

function parseListFilters(req) {
  const { startDate, endDate, location, metrcStatus, reporter } = req.query
  const conditions = []
  const params = []
  if (startDate) {
    params.push(startDate)
    conditions.push(`reported_at >= $${params.length}`)
  }
  if (endDate) {
    params.push(endDate)
    conditions.push(`reported_at <= $${params.length}`)
  }
  if (location) {
    params.push(location)
    conditions.push(`location_name = $${params.length}`)
  }
  if (metrcStatus === 'submitted') {
    conditions.push(`metrc_submitted = TRUE`)
  } else if (metrcStatus === 'not_submitted') {
    conditions.push(`metrc_submitted = FALSE`)
  }
  if (reporter) {
    params.push(`%${reporter}%`)
    conditions.push(`reported_by ILIKE $${params.length}`)
  }
  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  return { whereClause, params }
}

function csvEscape(value) {
  if (value == null) return ''
  let s = String(value)
  // Mitigate CSV formula injection: prefix any cell starting with =, +, -, @,
  // tab, or carriage return with a single quote so spreadsheets treat it as text.
  if (/^[=+\-@\t\r]/.test(s)) {
    s = "'" + s
  }
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

router.get('/reports.csv', async (req, res) => {
  try {
    const { whereClause, params } = parseListFilters(req)
    const result = await query(
      `SELECT id, reported_at, location_name, weight_value, weight_unit,
              reported_by, metrc_submitted, photo_path
       FROM biowaste_reports
       ${whereClause}
       ORDER BY reported_at DESC`,
      params
    )

    const header = ['Report ID', 'Date', 'Location', 'Weight', 'Unit', 'Reporter', 'METRC Status', 'Photo']
    const lines = [header.map(csvEscape).join(',')]
    for (const r of result.rows) {
      const dateStr = r.reported_at ? new Date(r.reported_at).toISOString() : ''
      lines.push([
        r.id,
        dateStr,
        r.location_name,
        r.weight_value,
        r.weight_unit,
        r.reported_by,
        r.metrc_submitted ? 'Submitted' : 'Not Submitted',
        r.photo_path || '',
      ].map(csvEscape).join(','))
    }
    const csv = '\uFEFF' + lines.join('\r\n') + '\r\n'

    const stamp = new Date().toISOString().slice(0, 10)
    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="biowaste-reports-${stamp}.csv"`)
    res.setHeader('Cache-Control', 'no-store')
    return res.send(csv)
  } catch (err) {
    console.error('[Biowaste] CSV export error:', err.message)
    return res.status(500).json({ error: 'Failed to export reports' })
  }
})

router.get('/reports/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid report id' })
  }
  try {
    const result = await query(
      `SELECT id, photo_path, location_name, weight_value, weight_unit,
              reported_by, user_id, metrc_submitted, metrc_response, reported_at
       FROM biowaste_reports
       WHERE id = $1`,
      [id]
    )
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Report not found' })
    }
    return res.json({ report: result.rows[0] })
  } catch (err) {
    console.error('[Biowaste] Detail error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch report' })
  }
})

module.exports = router
