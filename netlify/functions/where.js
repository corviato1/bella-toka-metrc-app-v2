const { metrcGet } = require('./_metrc')
const { requireAuth } = require('./_auth')

function last4(tag) {
  return tag ? tag.slice(-4) : ''
}

function mapLocation(name) {
  const match = name.match(/Row (\d+).*Bay ([A-D])/i)
  if (!match) return null
  return `R${match[1]}${match[2].toUpperCase()}`
}

exports.handler = async (event) => {
  try {
    requireAuth(event)

    const plants = await metrcGet('/plants/v2/active')

    const map = {}

    plants.forEach(p => {
      const bay = mapLocation(p.LocationName)
      if (!bay) return

      if (!map[bay]) map[bay] = []

      map[bay].push(last4(p.Label))
    })

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