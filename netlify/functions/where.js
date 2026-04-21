const { requireAuth } = require('./_auth')
const { metrcGet } = require('./_metrc')

function last4(label) {
  return label ? label.slice(-4) : ''
}

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const license = process.env.METRC_LICENSE_NUMBER

    const veg = await metrcGet(
      `/plants/v2/vegetative?licenseNumber=${license}`
    )

    const flower = await metrcGet(
      `/plants/v2/flowering?licenseNumber=${license}`
    )

    const all = [...veg, ...flower]

    const map = {}

    for (const plant of all) {
      const loc = plant.LocationName

      if (!loc) continue

      if (!map[loc]) map[loc] = []

      map[loc].push(last4(plant.Label))
    }

    return {
      statusCode: 200,
      body: JSON.stringify(map),
    }
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    }
  }
}