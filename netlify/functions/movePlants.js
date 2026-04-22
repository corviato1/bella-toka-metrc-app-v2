const { requireAuth } = require('./_auth')
const { metrcPut } = require('./_metrc')
const { query } = require('./_db')

exports.handler = async (event) => {
  try {
    const user = requireAuth(event)

    const { labels, location } = JSON.parse(event.body)
    const license = process.env.METRC_LICENSE_NUMBER

    if (!labels || !labels.length || !location) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing labels or location' }),
      }
    }

    // 🔵 METRC BATCH (10 max)
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

    // 🔵 LOG EACH TAG (IMPORTANT)
    for (const label of labels) {
      await query(
        `
        INSERT INTO moves (labels, location, username, created_at)
        VALUES ($1, $2, $3, NOW())
        `,
        [[label], location, user.username]
      )
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    }

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}