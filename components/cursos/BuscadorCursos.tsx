"use client"

import { Search, SlidersHorizontal } from "lucide-react"

interface BuscadorCursosProps {
  value: string
  onChange: (value: string) => void
  totalResultados: number
}

export default function BuscadorCursos({
  value,
  onChange,
  totalResultados,
}: BuscadorCursosProps) {
  return (
    <div className="flex flex-col gap-3 rounded-[28px] border border-white/10 bg-[#09111f]/82 p-4 backdrop-blur-2xl sm:flex-row sm:items-center sm:justify-between">
      <label className="flex flex-1 items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3">
        <Search className="h-4 w-4 text-white/45" />
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Buscar por titulo, instructor, categoria o tag..."
          className="w-full bg-transparent text-sm text-white placeholder:text-white/34 focus:outline-none"
        />
      </label>

      <div className="inline-flex items-center gap-3 rounded-[22px] border border-white/8 bg-white/[0.04] px-4 py-3 text-sm text-white/65">
        <SlidersHorizontal className="h-4 w-4 text-primary" />
        <span>{totalResultados} resultados</span>
      </div>
    </div>
  )
}
