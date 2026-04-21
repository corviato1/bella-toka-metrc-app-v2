const { requireAuth } = require('./_auth')
const { metrcPut } = require('./_metrc')
const { query } = require('./_db')

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const { labels, location } = JSON.parse(event.body)
    const license = process.env.METRC_LICENSE_NUMBER

    if (!labels || !location) {
      return { statusCode: 400, body: 'Missing data' }
    }

    // batch max 10 per METRC rules
    const chunks = []
    for (let i = 0; i < labels.length; i += 10) {
      chunks.push(labels.slice(i, i + 10))
    }

    for (const chunk of chunks) {
      const payload = chunk.map(label => ({
        Label: label,
        LocationName: location,
      }))

      await metrcPut(
        `/plants/v2/location?licenseNumber=${license}`,
        payload
      )
    }

    // log to neon
    await query(
      `INSERT INTO moves (labels, location, created_at)
       VALUES ($1, $2, NOW())`,
      [labels, location]
    )

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: err.message,
    }
  }
}