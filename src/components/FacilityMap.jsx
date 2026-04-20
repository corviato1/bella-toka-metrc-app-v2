import React from 'react'

function Cell({ title, items }) {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded p-2 text-xs min-h-[80px] flex flex-col">
      <div className="text-green-400 font-bold mb-1">{title}</div>

      <div className="flex flex-col">
        {items?.map((i, idx) => (
          <div key={idx}>{i}</div>
        ))}
      </div>
    </div>
  )
}

export default function FacilityMap({ data }) {
  return (
    <div className="grid grid-cols-12 gap-2">

      {/* VEG LEFT */}
      <div className="col-span-2 flex flex-col gap-2">
        <Cell title="Veg3" items={data.R11B} />
        <Cell title="Veg4" items={data.R11C} />
        <Cell title="Veg1" items={data.R12B} />
        <Cell title="Veg2" items={data.R12C} />
      </div>

      {/* FLOWER (VERTICAL STACK) */}
      <div className="col-span-8 grid grid-rows-9 gap-2">
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

      {/* HANG RIGHT */}
      <div className="col-span-2 flex flex-col gap-2">
        <Cell title="H2" items={data.R1B} />
        <Cell title="H1" items={data.R1A} />
      </div>

    </div>
  )
}