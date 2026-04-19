import React from 'react'

const layout = [
  ['R12B','R12C'],
  ['R11B','R11C'],

  ['R10A','R10B','R10C','R10D'],
  ['R9A','R9B','R9C','R9D'],
  ['R8A','R8B','R8C','R8D'],
  ['R7A','R7B','R7C','R7D'],
  ['R6A','R6B','R6C','R6D'],
  ['R5A','R5B','R5C','R5D'],
  ['R4A','R4B','R4C','R4D'],
  ['R3A','R3B','R3C','R3D'],
  ['R2A','R2B','R2C','R2D'],

  ['R1A','R1B']
]

function displayName(code) {
  if (code === 'R12B') return 'Veg1'
  if (code === 'R12C') return 'Veg2'
  if (code === 'R11B') return 'Veg3'
  if (code === 'R11C') return 'Veg4'

  if (code.startsWith('R10')) return 'F1'
  if (code.startsWith('R9')) return 'F2'
  if (code.startsWith('R8')) return 'F3'
  if (code.startsWith('R7')) return 'F4'
  if (code.startsWith('R6')) return 'F5'
  if (code.startsWith('R5')) return 'F6'
  if (code.startsWith('R4')) return 'F7'
  if (code.startsWith('R3')) return 'F8'
  if (code.startsWith('R2')) return 'F9'

  if (code === 'R1A') return 'H1'
  if (code === 'R1B') return 'H2'

  return code
}

export default function FacilityMap({ data }) {
  return (
    <div className="space-y-2">
      {layout.map((row, i) => (
        <div key={i} className="flex gap-2 justify-center">
          {row.map(code => (
            <div
              key={code}
              className="w-24 h-24 border bg-gray-800 rounded p-1 text-xs flex flex-col"
            >
              <div className="text-center font-bold">
                {displayName(code)}
              </div>

              <div className="flex flex-wrap gap-1 mt-1 overflow-auto">
                {(data[code] || []).map((tag, i) => (
                  <span
                    key={i}
                    className="bg-green-600 px-1 rounded text-[10px]"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}