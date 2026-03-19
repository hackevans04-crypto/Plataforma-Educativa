"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  SITE_ICON_OPTIONS,
  renderSiteIconSvg,
  type SiteIconName,
} from "@/lib/site-icon-registry"

interface IconPickerProps {
  value?: SiteIconName | null
  onSelect: (icon: SiteIconName) => void
  className?: string
}

export function IconPicker({ value, onSelect, className }: IconPickerProps) {
  const [query, setQuery] = React.useState("")

  const results = React.useMemo(() => {
    const search = query.trim().toLowerCase()
    if (!search) return SITE_ICON_OPTIONS
    return SITE_ICON_OPTIONS.filter((icon) =>
      [icon.name, icon.label, ...icon.keywords].some((token) => token.toLowerCase().includes(search))
    )
  }, [query])

  return (
    <div className={cn("space-y-2", className)}>
      <input
        type="text"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Buscar icono"
        className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none"
      />

      <div className="grid max-h-60 grid-cols-3 gap-2 overflow-y-auto pr-1">
        {results.map((icon) => (
          <button
            key={icon.name}
            type="button"
            onClick={() => onSelect(icon.name)}
            className={cn(
              "rounded-xl border px-2 py-2 text-center transition-all",
              value === icon.name
                ? "border-primary bg-primary/10 text-primary"
                : "border-white/8 bg-white/[0.03] text-white/70 hover:border-primary/35 hover:text-white"
            )}
          >
            <span
              className="mx-auto mb-1 flex h-8 w-8 items-center justify-center"
              dangerouslySetInnerHTML={{ __html: renderSiteIconSvg(icon.name, { size: 18 }) }}
            />
            <span className="block truncate text-[10px] font-medium">{icon.label}</span>
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-[11px] text-white/35">
          No hay iconos para esa busqueda.
        </div>
      ) : null}
    </div>
  )
}
