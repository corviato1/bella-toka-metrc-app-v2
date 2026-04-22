const { requireAuth } = require('./_auth')
const { query } = require('./_db')

exports.handler = async (event) => {
  try {
    const user = requireAuth(event)

    const { startDate, endDate, location, reporter } = event.queryStringParameters || {}

    let where = []
    let values = []

    if (startDate) {
      values.push(startDate)
      where.push(`created_at >= $${values.length}`)
    }

    if (endDate) {
      values.push(endDate)
      where.push(`created_at <= $${values.length}`)
    }

    if (location) {
      values.push(location)
      where.push(`location = $${values.length}`)
    }

    if (reporter) {
      values.push(reporter)
      where.push(`username = $${values.length}`)
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : ''

    const res = await query(
      `
      SELECT 
        created_at,
        location,
        labels,
        username
      FROM moves
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT 200
      `,
      values
    )

    return {
      statusCode: 200,
      body: JSON.stringify(res.rows),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}