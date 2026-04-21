const { requireAuth } = require('./_auth')
const { metrcGet } = require('./_metrc')
const { query } = require('./_db')

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const license = process.env.METRC_LICENSE_NUMBER

    const metrcHistory = await metrcGet(
      `/plants/v2/vegetative?licenseNumber=${license}`
    )

    const local = await query(
      `SELECT * FROM moves
       UNION ALL
       SELECT * FROM biowaste
       ORDER BY created_at DESC
       LIMIT 50`
    )

    return {
      statusCode: 200,
      body: JSON.stringify({
        metrc: metrcHistory,
        local: local.rows,
      }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: err.message,
    }
  }
}