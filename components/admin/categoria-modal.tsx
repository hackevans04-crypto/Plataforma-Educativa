"use client"

import { X, Save, Loader2 } from "lucide-react"
import { useState } from "react"
import { renderSiteIconHtml } from "@/lib/site-icon-registry"
import { IconPickerModal } from "./icon-picker-modal"
import { cn } from "@/lib/utils"

interface Categoria {
  id: string
  nombre: string
  descripcion: string
  color: string
  icono: string
  orden: number
  activa: boolean
  createdAt: string
  updatedAt: string
}

function IconRenderer({ iconName, size = 24, color = "currentColor" }: { iconName: string; size?: number; color?: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(iconName as any, { size }) }}
      style={{ color, display: "inline-flex" }}
    />
  )
}

interface CategoriaModalProps {
  isOpen: boolean
  categoria: Categoria | null
  formData: {
    nombre: string
    descripcion: string
    color: string
    icono: string
    activa: boolean
    subcategoriasInput?: string
  }
  onFormChange: (data: any) => void
  onSave: () => void
  onCancel: () => void
  loading: boolean
}

export function CategoriaModal({
  isOpen,
  categoria,
  formData,
  onFormChange,
  onSave,
  onCancel,
  loading
}: CategoriaModalProps) {
  const [showIconPicker, setShowIconPicker] = useState(false)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">
            Editar Categoría
          </h2>
          <button
            onClick={onCancel}
            className="p-2 rounded-lg hover:bg-background transition-colors text-muted-foreground hover:text-foreground"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Preview */}
          <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center">
            <div className="flex justify-center mb-3">
              <div
                className="w-20 h-20 rounded-xl flex items-center justify-center"
                style={{
                  backgroundColor: formData.color + "20",
                  border: `2px solid ${formData.color}`
                }}
              >
                <div className="w-10 h-10 flex items-center justify-center" style={{ color: formData.color }}>
                  <IconRenderer iconName={formData.icono} size={40} color={formData.color} />
                </div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground font-semibold">Vista previa</p>
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={formData.nombre}
              onChange={(e) => onFormChange({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Descripción
            </label>
            <textarea
              value={formData.descripcion}
              onChange={(e) => onFormChange({ ...formData, descripcion: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Color
            </label>
            <div className="flex gap-3">
              <input
                type="color"
                value={formData.color}
                onChange={(e) => onFormChange({ ...formData, color: e.target.value })}
                className="w-16 h-10 rounded-lg border-2 border-border cursor-pointer"
              />
              <input
                type="text"
                value={formData.color.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9A-F]{6}$/i.test(val)) {
                    onFormChange({ ...formData, color: val })
                  }
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
              />
            </div>
          </div>

          {/* Ícono */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Ícono
            </label>
            <button
              type="button"
              onClick={() => setShowIconPicker(true)}
              className="w-full p-3 rounded-lg bg-background border-2 border-border text-foreground flex items-center gap-2 hover:border-primary/50 transition-all"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <IconRenderer iconName={formData.icono} size={20} color="currentColor" />
              </div>
              <span className="text-sm flex-1 text-left">{formData.icono}</span>
              <span className="text-muted-foreground text-sm">▼</span>
            </button>
          </div>

          {/* Subcategorías */}
          <div>
            <label className="block text-sm font-bold text-foreground mb-2">
              Subcategorías
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                (separadas por coma o nueva línea)
              </span>
            </label>
            <textarea
              value={formData.subcategoriasInput ?? ""}
              onChange={(e) => onFormChange({ ...formData, subcategoriasInput: e.target.value })}
              rows={3}
              placeholder="Ej: Algebra, Geometría, Cálculo, Trigonometría"
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Activa */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <input
              type="checkbox"
              id="activa"
              checked={formData.activa}
              onChange={(e) => onFormChange({ ...formData, activa: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer accent-primary"
            />
            <label htmlFor="activa" className="text-sm font-semibold text-foreground cursor-pointer">
              Categoría Activa
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-6 flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 rounded-lg border-2 border-border text-foreground hover:bg-background transition-all font-semibold"
          >
            Cancelar
          </button>
          <button
            onClick={onSave}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Guardar cambios
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modal de selección de icono */}
      <IconPickerModal
        isOpen={showIconPicker}
        value={formData.icono}
        onChange={(icon) => onFormChange({ ...formData, icono: icon })}
        onClose={() => setShowIconPicker(false)}
      />
    </div>
  )
}
