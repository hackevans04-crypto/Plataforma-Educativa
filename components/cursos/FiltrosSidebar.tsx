"use client"

import { RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CursosFilters {
  access: "todos" | "libre" | "clave" | "pago"
  level: string
  featuredOnly: boolean
  certificateOnly: boolean
  withProgressOnly: boolean
}

interface FiltrosSidebarProps {
  filters: CursosFilters
  levels: string[]
  onFiltersChange: (filters: CursosFilters) => void
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-left transition-all hover:border-white/15 hover:bg-white/[0.05]"
    >
      <div>
        <div className="text-sm font-semibold text-white">{label}</div>
        <div className="mt-1 text-xs leading-5 text-white/48">{description}</div>
      </div>
      <div
        className={cn(
          "mt-0.5 h-5 w-10 rounded-full p-0.5 transition-all",
          checked ? "bg-primary" : "bg-white/12"
        )}
      >
        <div
          className={cn(
            "h-4 w-4 rounded-full bg-white transition-transform",
            checked ? "translate-x-5" : "translate-x-0"
          )}
        />
      </div>
    </button>
  )
}

export default function FiltrosSidebar({
  filters,
  levels,
  onFiltersChange,
}: FiltrosSidebarProps) {
  const update = <K extends keyof CursosFilters>(key: K, value: CursosFilters[K]) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const reset = () => {
    onFiltersChange({
      access: "todos",
      level: "todos",
      featuredOnly: false,
      certificateOnly: false,
      withProgressOnly: false,
    })
  }

  return (
    <aside className="rounded-[30px] border border-white/10 bg-[#09111f]/85 p-5 backdrop-blur-2xl">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Filtros</div>
          <div className="mt-1 text-xs text-white/45">Refina el catalogo publico.</div>
        </div>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs font-medium text-white/65 transition-all hover:border-white/20 hover:text-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Limpiar
        </button>
      </div>

      <div className="mt-5 space-y-5">
        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Acceso
          </div>
          <select
            value={filters.access}
            onChange={(event) => update("access", event.target.value as CursosFilters["access"])}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition-all focus:border-primary/35"
          >
            <option value="todos">Todos los accesos</option>
            <option value="libre">Gratis</option>
            <option value="clave">Con clave</option>
            <option value="pago">De pago</option>
          </select>
        </div>

        <div>
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/40">
            Nivel
          </div>
          <select
            value={filters.level}
            onChange={(event) => update("level", event.target.value)}
            className="h-11 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-3 text-sm text-white outline-none transition-all focus:border-primary/35"
          >
            <option value="todos">Todos los niveles</option>
            {levels.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          <ToggleRow
            label="Solo destacados"
            description="Prioriza los cursos marcados como destacados o populares."
            checked={filters.featuredOnly}
            onChange={(checked) => update("featuredOnly", checked)}
          />
          <ToggleRow
            label="Solo con certificado"
            description="Muestra cursos que incluyen certificado al completar."
            checked={filters.certificateOnly}
            onChange={(checked) => update("certificateOnly", checked)}
          />
          <ToggleRow
            label="Solo con progreso"
            description="Filtra cursos donde tu usuario ya tiene matricula y avance."
            checked={filters.withProgressOnly}
            onChange={(checked) => update("withProgressOnly", checked)}
          />
        </div>
      </div>
    </aside>
  )
}
