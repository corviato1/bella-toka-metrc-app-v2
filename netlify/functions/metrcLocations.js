const { requireAuth } = require('./_auth')
const { metrcGet } = require('./_metrc')

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const license = process.env.METRC_LICENSE_NUMBER

    const locations = await metrcGet(
      `/locations/v2/active?licenseNumber=${license}`
    )

    return {
      statusCode: 200,
      body: JSON.stringify(locations),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}