const { requireAuth } = require('./_auth')
const { metrcPost } = require('./_metrc')
const { query } = require('./_db')

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const { label, weight, unit, location } = JSON.parse(event.body)
    const license = process.env.METRC_LICENSE_NUMBER

    const payload = [
      {
        PlantLabel: label,
        WasteMethodName: 'Other',
        Weight: weight,
        UnitOfMeasureName: unit,
        LocationName: location,
      },
    ]

    await metrcPost(
      `/plants/v2/waste?licenseNumber=${license}`,
      payload
    )

    await query(
      `INSERT INTO biowaste (label, weight, unit, location, created_at)
       VALUES ($1, $2, $3, $4, NOW())`,
      [label, weight, unit, location]
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