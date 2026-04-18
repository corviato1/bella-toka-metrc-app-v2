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
    const result = await query(
      `SELECT id, photo_path, location_name, weight_value, weight_unit,
              reported_by, metrc_submitted, reported_at
       FROM biowaste_reports
       ORDER BY reported_at DESC
       LIMIT 50`
    )
    return res.json({ reports: result.rows })
  } catch (err) {
    console.error('[Biowaste] List error:', err.message)
    return res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

module.exports = router
