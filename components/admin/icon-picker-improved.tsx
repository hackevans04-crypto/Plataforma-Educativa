"use client"

import { useState } from "react"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { renderSiteIconHtml } from "@/lib/site-icon-registry"
import type { SiteIconName } from "@/lib/site-icon-registry"

interface IconPickerProps {
  value: string
  onChange: (icon: string) => void
  size?: number
}

// Todos los iconos disponibles en el sistema
const ALL_ICONS: SiteIconName[] = [
  "clipboard-list",
  "graduation-cap",
  "book-open",
  "books",
  "file-text",
  "check-circle",
  "bar-chart",
  "timer",
  "target",
  "lightbulb",
  "pin",
  "lock",
  "globe",
  "map-pin",
  "calendar-days",
  "presentation",
  "building",
  "image",
  "sparkles",
  "mail",
  "phone",
  "user",
  "users",
  "message-circle",
  "shield",
  "award",
  "play-circle",
  "rocket",
  "monitor",
  "beaker",
  "palette",
  "music",
  "dumbbell",
  "chef-hat",
  "calculator",
  "wrench",
  "pencil",
  "brain",
]

function IconRenderer({ iconName, size = 24, color = "currentColor" }: { iconName: string; size?: number; color?: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(iconName as any, { size }) }}
      style={{ color, display: "inline-flex" }}
    />
  )
}

export function IconPicker({ value, onChange, size = 24 }: IconPickerProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredIcons = ALL_ICONS.filter((icon) =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          type="text"
          placeholder="Buscar icono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 rounded-lg bg-background border border-border">
        {filteredIcons.length === 0 ? (
          <div className="col-span-6 md:col-span-8 text-center py-8 text-muted-foreground">
            <p className="text-sm">No se encontraron iconos</p>
          </div>
        ) : (
          filteredIcons.map((icon) => (
            <button
              key={icon}
              onClick={() => onChange(icon)}
              className={cn(
                "w-full aspect-square flex items-center justify-center rounded-lg border-2 transition-all hover:border-primary/50",
                value === icon
                  ? "border-primary bg-primary/10 scale-105 ring-2 ring-primary/50"
                  : "border-border hover:bg-primary/5"
              )}
              title={icon}
            >
              <div className="w-6 h-6 flex items-center justify-center">
                <IconRenderer iconName={icon} size={20} color="currentColor" />
              </div>
            </button>
          ))
        )}
      </div>

      {value && (
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-3">
          <div className="w-8 h-8 flex items-center justify-center">
            <IconRenderer iconName={value} size={20} color="currentColor" />
          </div>
          <span className="text-sm font-semibold text-foreground">{value}</span>
        </div>
      )}
    </div>
  )
}
