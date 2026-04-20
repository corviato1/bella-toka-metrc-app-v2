import React from 'react'

function Cell({ title, items }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2 text-xs min-h-[140px] flex flex-col">
      <div className="text-green-400 font-bold mb-1">{title}</div>

      {/* vertical stack */}
      <div className="flex flex-col gap-1 overflow-y-auto">
        {Array.isArray(items) &&
          items.map((i, idx) => (
            <div key={idx} className="whitespace-nowrap">
              {i}
            </div>
          ))}
      </div>
    </div>
  )
}

export default function FacilityMap({ data = {} }) {
  return (
    <div className="grid grid-cols-12 gap-2">

      {/* VEG (NOW SAME STYLE AS FLOWER) */}
      <div className="col-span-2 grid grid-cols-1 gap-2">
        <Cell title="Veg3" items={data.R11B} />
        <Cell title="Veg4" items={data.R11C} />
        <Cell title="Veg1" items={data.R12B} />
        <Cell title="Veg2" items={data.R12C} />
      </div>

      {/* FLOWER */}
      <div className="col-span-8 grid grid-cols-9 gap-2">
        <Cell title="F1" items={data.R10A} />
        <Cell title="F2" items={data.R9A} />
        <Cell title="F3" items={data.R8A} />
        <Cell title="F4" items={data.R7A} />
        <Cell title="F5" items={data.R6A} />
        <Cell title="F6" items={data.R5A} />
        <Cell title="F7" items={data.R4A} />
        <Cell title="F8" items={data.R3A} />
        <Cell title="F9" items={data.R2A} />
      </div>

      {/* HANG (NOW SAME STYLE AS FLOWER) */}
      <div className="col-span-2 grid grid-cols-1 gap-2">
        <Cell title="H2" items={data.R1B} />
        <Cell title="H1" items={data.R1A} />
      </div>

    </div>
  )
}