"use client"

import { X, Search } from "lucide-react"
import { useState } from "react"
import { renderSiteIconHtml } from "@/lib/site-icon-registry"
import { siteIconRegistry } from "@/lib/site-icon-registry"
import { cn } from "@/lib/utils"

interface IconPickerModalProps {
  isOpen: boolean
  value: string
  onChange: (icon: string) => void
  onClose: () => void
}

function IconRenderer({ iconName, size = 20, color = "currentColor" }: { iconName: string; size?: number; color?: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(iconName as any, { size }) }}
      style={{ color, display: "inline-flex" }}
    />
  )
}

export function IconPickerModal({ isOpen, value, onChange, onClose }: IconPickerModalProps) {
  const [searchTerm, setSearchTerm] = useState("")

  if (!isOpen) return null

  // Obtener todos los iconos disponibles
  const allIcons = Object.keys(siteIconRegistry || {}).filter(icon =>
    icon.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleIconClick = (icon: string) => {
    onChange(icon)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Seleccionar Ícono
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="sticky top-16 bg-card border-b border-border p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Buscar icono..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto p-4">
          {allIcons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground text-sm font-semibold">
                No se encontraron iconos
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
              {allIcons.map((icon) => (
                <button
                  key={icon}
                  onClick={() => handleIconClick(icon)}
                  className={cn(
                    "p-3 rounded-lg transition-all hover:shadow-md",
                    value === icon
                      ? "bg-primary text-white border-2 border-primary shadow-lg"
                      : "bg-background border-2 border-border text-foreground hover:border-primary/50"
                  )}
                  title={icon}
                >
                  <div className="flex items-center justify-center">
                    <IconRenderer iconName={icon} size={24} color="currentColor" />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer Info */}
        <div className="sticky bottom-0 bg-card border-t border-border px-6 py-4 text-sm text-muted-foreground text-center">
          {allIcons.length} icono{allIcons.length !== 1 ? 's' : ''} disponible{allIcons.length !== 1 ? 's' : ''}
        </div>
      </div>
    </div>
  )
}
