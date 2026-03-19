"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import {
  AlertCircle, ArrowDown, ArrowLeft, ArrowUp, BadgePlus, Check, ChevronDown, ChevronUp,
  ClipboardCheck, Code2, ExternalLink, Eye, EyeOff, FileImage, FileText, Globe, GraduationCap, ImageIcon, BookOpen,
  LayoutTemplate, Layers, Link2, MessageSquare, Minus, Pencil, Play, Plus,
  RefreshCw, Save, Settings, Sparkles, Star, Tag, TextCursorInput, Trash2, Type,
  Video, X, Zap, BarChart3, AlignCenter, AlignLeft, AlignRight, Target, ChevronLeft, ChevronRight,
  Monitor, Smartphone, Copy, Tablet, Undo2, Redo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  type CMSActionConfig, type CMSConfig, type CMSCustomCodeActionBinding, type CMSFormFieldConfig, type CMSHtmlImportMode, type CMSPage, type CMSPopup, type CMSSection, type CMSSectionSettings, type CMSSectionStyle, type CMSSectionType,
  DEFAULT_CMS, getCMSConfig, publishCMSConfig, saveCMSConfig,
} from "@/hooks/use-cms"
import StudioSitePreview from "@/components/admin/studio-site-preview"
import StudioPreviewFrame from "@/components/admin/studio-preview-frame"
import {
  getDefaultSectionSettings,
  getCollectionKeyFromSection,
  resolveLandingBuilderItems,
  useLandingBuilderData,
} from "@/hooks/use-landing-builder-data"
import { buildImportedHtml, getHtmlImportSettings } from "@/lib/html-import-utils"
import { replaceKnownEmojisInDocumentHtml } from "@/lib/site-icon-registry"

// â”€â”€â”€ Atoms â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const iCls = "h-10 w-full rounded-xl border border-border bg-secondary/15 px-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
const tCls = "w-full rounded-xl border border-border bg-secondary/15 px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
const codeCls = "w-full rounded-xl border border-border bg-[#0d1117] px-4 py-3 text-sm text-green-400 font-mono placeholder:text-muted-foreground/40 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none leading-relaxed"
type CMSChangeHandler = (next: CMSConfig | ((current: CMSConfig) => CMSConfig)) => void

function F({ label, helper, children }: { label: string; helper?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</label>
      {children}
      {helper && <p className="text-[11px] text-muted-foreground">{helper}</p>}
    </div>
  )
}

function Card({ title, children, action, noPad }: { title?: string; children: React.ReactNode; action?: React.ReactNode; noPad?: boolean }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {title && (
        <div className="px-5 py-3.5 border-b border-border bg-secondary/10 flex items-center justify-between">
          <span className="font-semibold text-foreground text-sm">{title}</span>
          {action}
        </div>
      )}
      <div className={noPad ? "" : "p-5 space-y-4"}>{children}</div>
    </div>
  )
}

function Btn({ children, onClick, variant = "default", size = "md", className, disabled }: { children: React.ReactNode; onClick?: () => void; variant?: "default" | "primary" | "danger" | "ghost"; size?: "sm" | "md"; className?: string; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 font-medium rounded-xl transition-all disabled:opacity-50",
        size === "sm" ? "h-8 px-3 text-xs" : "h-10 px-4 text-sm",
        variant === "primary" ? "bg-primary text-white hover:bg-primary/90" :
        variant === "danger"  ? "border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/40" :
        variant === "ghost"   ? "text-muted-foreground hover:text-foreground hover:bg-secondary" :
        "border border-border bg-secondary/20 text-muted-foreground hover:text-foreground hover:border-border/80",
        className
      )}
    >
      {children}
    </button>
  )
}

function UploadImg({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const ref = useRef<HTMLInputElement>(null)
  const isImg = value?.startsWith("data:") || value?.startsWith("http") || value?.startsWith("/")
  const readFile = (file: File) => {
    const r = new FileReader(); r.onload = e => onChange(e.target?.result as string); r.readAsDataURL(file)
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input className={cn(iCls, "flex-1")} value={value} onChange={e => onChange(e.target.value)} placeholder="URL de imagen o sube archivo..." />
        <button onClick={() => ref.current?.click()} className="h-10 px-3 rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-primary hover:border-primary/40 transition-all flex items-center gap-1.5 text-xs">
          <FileImage className="w-4 h-4" />Subir
        </button>
        <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) readFile(f) }} />
      </div>
      {isImg && (
        <div className="relative h-32 rounded-xl overflow-hidden border border-border group">
          <img src={value} alt="" className="w-full h-full object-cover" />
          <button onClick={() => onChange("")} className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/90">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  )
}

function StrList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2">
          <input className={iCls} value={item} placeholder={placeholder} onChange={e => { const n = [...items]; n[i] = e.target.value; onChange(n) }} />
          <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/40 transition-all">
            <Minus className="w-4 h-4" />
          </button>
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
        <Plus className="w-3.5 h-3.5" />Agregar
      </button>
    </div>
  )
}

function StatPairs({ stats, onChange }: { stats: { value: string; label: string }[]; onChange: (v: { value: string; label: string }[]) => void }) {
  return (
    <div className="space-y-2">
      {stats.map((s, i) => (
        <div key={i} className="grid grid-cols-2 gap-2">
          <input className={iCls} value={s.value} placeholder="ej. 15,000+" onChange={e => onChange(stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} />
          <input className={iCls} value={s.label} placeholder="ej. Docentes" onChange={e => onChange(stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
        </div>
      ))}
    </div>
  )
}

function normalizeColorValue(value: string | undefined, fallback = "#E8392A") {
  return /^#([0-9a-fA-F]{6})$/.test(value || "") ? (value as string) : fallback
}

function StudioColorField({
  label,
  value,
  onChange,
  helper,
  fallback = "#E8392A",
}: {
  label: string
  value?: string
  onChange: (value: string) => void
  helper?: string
  fallback?: string
}) {
  return (
    <F label={label} helper={helper}>
      <div className="grid grid-cols-[56px_1fr] gap-2">
        <input
          type="color"
          className="h-10 w-full rounded-xl border border-border bg-secondary/15 cursor-pointer"
          value={normalizeColorValue(value, fallback)}
          onChange={(event) => onChange(event.target.value)}
        />
        <input
          className={iCls}
          value={value || ""}
          onChange={(event) => onChange(event.target.value)}
          placeholder={fallback}
        />
      </div>
    </F>
  )
}

function StudioRangeField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  helper,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min: number
  max: number
  step?: number
  helper?: string
}) {
  return (
    <F label={label} helper={helper}>
      <div className="grid grid-cols-[1fr_72px] gap-3">
        <input
          className="h-10 w-full accent-primary"
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <input
          className={iCls}
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(event) => onChange(Number(event.target.value) || min)}
        />
      </div>
    </F>
  )
}

// â”€â”€â”€ Style Editor (used in every section's "Estilo" tab) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const BG_PRESETS = [
  { key: "transparent", label: "Transparente", cls: "bg-transparent border-dashed" },
  { key: "dark",        label: "Oscuro",        cls: "bg-card/50" },
  { key: "darkDeep",    label: "Profundo",      cls: "bg-[#0d1117]" },
  { key: "accent",      label: "Acento",        cls: "bg-primary/10 border-primary/20" },
]

const PAD_PRESETS = [
  { key: "none", label: "Sin padding" },
  { key: "sm",   label: "Pequeno" },
  { key: "md",   label: "Normal" },
  { key: "lg",   label: "Grande" },
]

function StyleEditor({ style, onChange }: { style?: CMSSectionStyle; onChange: (s: CMSSectionStyle) => void }) {
  const s = style ?? {}
  const isCustomBg = s.bg && !BG_PRESETS.find(p => p.key === s.bg)
  return (
    <div className="space-y-6 p-5">
      <F label="Color de fondo">
        <div className="grid grid-cols-2 gap-2 mb-2">
          {BG_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => onChange({ ...s, bg: p.key as any })}
              className={cn(
                "h-16 rounded-xl border text-xs font-medium transition-all flex items-center justify-center",
                p.cls,
                s.bg === p.key ? "border-primary ring-2 ring-primary/30 text-foreground" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-muted-foreground">Color personalizado:</span>
          <input
            type="color"
            value={isCustomBg ? s.bg! : "#141b24"}
            onChange={e => onChange({ ...s, bg: e.target.value })}
            className="h-9 w-16 rounded-lg border border-border bg-secondary/20 cursor-pointer px-1"
          />
          {isCustomBg && <span className="text-xs text-primary font-mono">{s.bg}</span>}
          {isCustomBg && <button onClick={() => onChange({ ...s, bg: "transparent" })} className="text-xs text-muted-foreground hover:text-red-400"><X className="w-3.5 h-3.5" /></button>}
        </div>
      </F>

      <F label="Espaciado vertical">
        <div className="flex gap-2">
          {PAD_PRESETS.map(p => (
            <button
              key={p.key}
              onClick={() => onChange({ ...s, padding: p.key as any })}
              className={cn(
                "flex-1 h-9 rounded-xl border text-xs font-medium transition-all",
                s.padding === p.key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </F>
    </div>
  )
}

// â”€â”€â”€ Built-in section editors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function HeroEditor({ config, onChange }: { config: CMSConfig; onChange: (c: CMSConfig) => void }) {
  const h = config.hero
  const set = (p: Partial<typeof h>) => onChange({ ...config, hero: { ...h, ...p } })
  const appearance = h.appearance ?? {}
  const setAppearance = (patch: Record<string, any>) => set({ appearance: { ...appearance, ...patch } })
  return (
    <div className="p-5 space-y-5">
      <Card title="Cabecera">
        <F label="Badge superior"><input className={iCls} value={h.badge} onChange={e => set({ badge: e.target.value })} placeholder="QSM 10 - 2026 Actualizado" /></F>
        <F label="Titulo principal" helper="Texto grande del hero"><input className={iCls} value={h.titulo} onChange={e => set({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={h.descripcion} onChange={e => set({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Lista de caracteristicas">
        <StrList items={h.features} onChange={features => set({ features })} placeholder="ej. Acceso 24/7 desde cualquier dispositivo" />
      </Card>
      <Card title="Estadisticas (3 bloques)">
        <p className="text-xs text-muted-foreground">Valor / Etiqueta</p>
        <StatPairs stats={h.stats} onChange={stats => set({ stats })} />
      </Card>
      <Card title="Botones CTA">
        <div className="grid grid-cols-2 gap-4">
          <F label="Boton primario"><input className={iCls} value={h.ctaPrimario} onChange={e => set({ ctaPrimario: e.target.value })} /></F>
          <F label="Boton secundario"><input className={iCls} value={h.ctaSecundario} onChange={e => set({ ctaSecundario: e.target.value })} /></F>
        </div>
      </Card>
      <Card title="Apariencia visual">
        <div className="grid grid-cols-2 gap-3">
          <StudioColorField label="Color badge" value={appearance.badgeColor} onChange={(value) => setAppearance({ badgeColor: value })} />
          <StudioColorField label="Color titulo" value={appearance.titleColor} onChange={(value) => setAppearance({ titleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Color descripcion" value={appearance.descriptionColor} onChange={(value) => setAppearance({ descriptionColor: value })} fallback="#9CA3AF" />
          <StudioColorField label="Boton primario" value={appearance.primaryButtonBg} onChange={(value) => setAppearance({ primaryButtonBg: value })} />
          <StudioColorField label="Texto boton 1" value={appearance.primaryButtonText} onChange={(value) => setAppearance({ primaryButtonText: value })} fallback="#FFFFFF" />
          <StudioColorField label="Texto boton 2" value={appearance.secondaryButtonText} onChange={(value) => setAppearance({ secondaryButtonText: value })} fallback="#FFFFFF" />
          <StudioColorField label="Borde boton 2" value={appearance.secondaryButtonBorder} onChange={(value) => setAppearance({ secondaryButtonBorder: value })} fallback="#374151" />
          <StudioColorField label="Fondo panel derecho" value={appearance.surfaceBg} onChange={(value) => setAppearance({ surfaceBg: value })} fallback="#111827" />
          <StudioColorField label="Borde panel derecho" value={appearance.surfaceBorder} onChange={(value) => setAppearance({ surfaceBorder: value })} fallback="#1F2937" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StudioRangeField label="Padding vertical" value={Number(appearance.sectionPaddingY || 80)} onChange={(value) => setAppearance({ sectionPaddingY: value })} min={48} max={180} step={4} />
          <StudioRangeField label="Padding horizontal" value={Number(appearance.sectionPaddingX || 24)} onChange={(value) => setAppearance({ sectionPaddingX: value })} min={16} max={96} step={4} />
          <StudioRangeField label="Tamano titulo" value={Number(appearance.titleSize || 72)} onChange={(value) => setAppearance({ titleSize: value })} min={42} max={110} />
          <StudioRangeField label="Peso titulo" value={Number(appearance.titleWeight || 700)} onChange={(value) => setAppearance({ titleWeight: value })} min={500} max={900} step={100} />
          <StudioRangeField label="Tamano descripcion" value={Number(appearance.descriptionSize || 18)} onChange={(value) => setAppearance({ descriptionSize: value })} min={14} max={30} />
        </div>
      </Card>
    </div>
  )
}

function BenefitsEditor({ config, onChange }: { config: CMSConfig; onChange: (c: CMSConfig) => void }) {
  const b = config.benefits
  const set = (p: Partial<typeof b>) => onChange({ ...config, benefits: { ...b, ...p } })
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Etiqueta superior"><input className={iCls} value={b.sectionLabel} onChange={e => set({ sectionLabel: e.target.value })} /></F>
        <F label="Titulo"><input className={iCls} value={b.titulo} onChange={e => set({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><textarea className={tCls} rows={2} value={b.descripcion} onChange={e => set({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Tarjetas de beneficios">
        <div className="space-y-2">
          {b.items.map((item, i) => (
            <div key={i} className="rounded-xl border border-border overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/10 hover:bg-secondary/20 text-left">
                <span className="w-6 h-6 rounded-lg bg-primary/15 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                <span className="flex-1 text-sm font-medium text-foreground truncate">{item.title}</span>
                <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mr-1">{item.highlight}</span>
                {open === i ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {open === i && (
                <div className="p-4 space-y-3 bg-card">
                  <F label="Titulo"><input className={iCls} value={item.title} onChange={e => set({ items: b.items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} /></F>
                  <F label="Descripcion"><textarea className={tCls} rows={2} value={item.description} onChange={e => set({ items: b.items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} /></F>
                  <F label="Etiqueta destacada"><input className={iCls} value={item.highlight} onChange={e => set({ items: b.items.map((x, j) => j === i ? { ...x, highlight: e.target.value } : x) })} /></F>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
      <Card title="Estadisticas (4 bloques)"><p className="text-xs text-muted-foreground">Valor / Etiqueta</p><StatPairs stats={b.stats} onChange={stats => set({ stats })} /></Card>
    </div>
  )
}

function TestimonialsEditor({ config, onChange }: { config: CMSConfig; onChange: (c: CMSConfig) => void }) {
  const t = config.testimonials
  const set = (p: Partial<typeof t>) => onChange({ ...config, testimonials: { ...t, ...p } })
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Titulo"><input className={iCls} value={t.titulo} onChange={e => set({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><input className={iCls} value={t.descripcion} onChange={e => set({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Testimonios" action={
        <Btn size="sm" variant="ghost" onClick={() => { const id = `t${Date.now()}`; set({ items: [...t.items, { id, nombre: "Nuevo Docente", cargo: "Docente", location: "Ecuador", texto: "Escribe el testimonio aqui...", rating: 5 }] }); setOpen(id) }}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        <div className="space-y-2">
          {t.items.map(item => (
            <div key={item.id} className="rounded-xl border border-border overflow-hidden">
              <button onClick={() => setOpen(open === item.id ? null : item.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/10 hover:bg-secondary/20 text-left">
                <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center text-primary font-bold text-xs">{item.nombre.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{item.nombre}</div>
                  <div className="text-xs text-muted-foreground">{item.cargo}</div>
                </div>
                <button onClick={e => { e.stopPropagation(); set({ items: t.items.filter(x => x.id !== item.id) }) }} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {open === item.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {open === item.id && (
                <div className="p-4 space-y-3 bg-card">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Nombre"><input className={iCls} value={item.nombre} onChange={e => set({ items: t.items.map(x => x.id === item.id ? { ...x, nombre: e.target.value } : x) })} /></F>
                    <F label="Cargo"><input className={iCls} value={item.cargo} onChange={e => set({ items: t.items.map(x => x.id === item.id ? { ...x, cargo: e.target.value } : x) })} /></F>
                  </div>
                  <F label="Ubicacion"><input className={iCls} value={item.location} onChange={e => set({ items: t.items.map(x => x.id === item.id ? { ...x, location: e.target.value } : x) })} /></F>
                  <F label="Testimonio"><textarea className={tCls} rows={3} value={item.texto} onChange={e => set({ items: t.items.map(x => x.id === item.id ? { ...x, texto: e.target.value } : x) })} /></F>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// â”€â”€â”€ Custom section data editors â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function CTAEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const appearance = (data.appearance as Record<string, any>) || {}
  const sAppearance = (patch: Record<string, any>) => s({ appearance: { ...appearance, ...patch } })
  return (
    <div className="p-5 space-y-5">
      <Card title="Contenido">
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><textarea className={tCls} rows={2} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Botones">
        <div className="grid grid-cols-2 gap-3">
          <F label="Texto boton primario"><input className={iCls} value={data.ctaPrimario || ""} onChange={e => s({ ctaPrimario: e.target.value })} /></F>
          <F label="Link boton primario"><input className={iCls} value={data.ctaPrimarioHref || ""} onChange={e => s({ ctaPrimarioHref: e.target.value })} placeholder="/registro" /></F>
          <F label="Texto boton secundario" helper="Dejar vacÃ­o para ocultar"><input className={iCls} value={data.ctaSecundario || ""} onChange={e => s({ ctaSecundario: e.target.value })} /></F>
          <F label="Link boton secundario"><input className={iCls} value={data.ctaSecundarioHref || ""} onChange={e => s({ ctaSecundarioHref: e.target.value })} /></F>
        </div>
      </Card>
      <Card title="Apariencia visual">
        <div className="grid grid-cols-2 gap-3">
          <StudioColorField label="Color acento" value={appearance.accentColor} onChange={(value) => sAppearance({ accentColor: value })} />
          <StudioColorField label="Color titulo" value={appearance.titleColor} onChange={(value) => sAppearance({ titleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Color descripcion" value={appearance.descriptionColor} onChange={(value) => sAppearance({ descriptionColor: value })} fallback="#D1D5DB" />
          <StudioColorField label="Fondo boton 1" value={appearance.primaryButtonBg} onChange={(value) => sAppearance({ primaryButtonBg: value })} />
          <StudioColorField label="Texto boton 1" value={appearance.primaryButtonText} onChange={(value) => sAppearance({ primaryButtonText: value })} fallback="#FFFFFF" />
          <StudioColorField label="Texto boton 2" value={appearance.secondaryButtonText} onChange={(value) => sAppearance({ secondaryButtonText: value })} fallback="#FFFFFF" />
          <StudioColorField label="Borde boton 2" value={appearance.secondaryButtonBorder} onChange={(value) => sAppearance({ secondaryButtonBorder: value })} fallback="#374151" />
          <StudioRangeField label="Padding vertical" value={Number(appearance.sectionPaddingY || 80)} onChange={(value) => sAppearance({ sectionPaddingY: value })} min={56} max={220} step={4} />
        </div>
      </Card>
    </div>
  )
}

function ImageTextEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  return (
    <div className="p-5 space-y-5">
      <Card title="Contenido">
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
        <F label="Lista de puntos"><StrList items={data.bullets || []} onChange={bullets => s({ bullets })} placeholder="ej. +5,000 preguntas actualizadas" /></F>
      </Card>
      <Card title="Imagen">
        <F label="Imagen principal"><UploadImg value={data.imageUrl || ""} onChange={imageUrl => s({ imageUrl })} /></F>
        <F label="Posicion">
          <div className="flex gap-2">
            {(["left", "right"] as const).map(pos => (
              <button key={pos} onClick={() => s({ imagePosition: pos })} className={cn("flex-1 h-10 rounded-xl border text-sm font-medium transition-all", data.imagePosition === pos ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                Imagen {pos === "left" ? "izquierda" : "derecha"}
              </button>
            ))}
          </div>
        </F>
      </Card>
      <Card title="Boton CTA">
        <div className="grid grid-cols-2 gap-3">
          <F label="Texto"><input className={iCls} value={data.ctaLabel || ""} onChange={e => s({ ctaLabel: e.target.value })} /></F>
          <F label="Link"><input className={iCls} value={data.ctaHref || ""} onChange={e => s({ ctaHref: e.target.value })} /></F>
        </div>
      </Card>
    </div>
  )
}

function VideoEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const toEmbed = (url: string) => {
    const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
    if (yt) return `https://www.youtube.com/embed/${yt[1]}`
    const vi = url.match(/vimeo\.com\/(\d+)/)
    if (vi) return `https://player.vimeo.com/video/${vi[1]}`
    return url
  }
  const embedUrl = data.videoUrl ? toEmbed(data.videoUrl) : ""
  return (
    <div className="p-5 space-y-5">
      <Card title="Contenido">
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><textarea className={tCls} rows={2} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Video">
        <F label="URL de YouTube o Vimeo" helper="Pega la URL normal â€” se convierte en embed automaticamente">
          <input className={iCls} value={data.videoUrl || ""} onChange={e => s({ videoUrl: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." />
        </F>
        {embedUrl ? (
          <div className="rounded-xl overflow-hidden border border-border aspect-video mt-2">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen title="Preview" />
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border aspect-video flex items-center justify-center mt-2 bg-secondary/10">
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <Play className="w-6 h-6 text-primary ml-0.5" />
              </div>
              <p className="text-xs text-muted-foreground">Vista previa aparecera aqui</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}

function FAQEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const items = (data.items || []) as { id: string; pregunta: string; respuesta: string }[]
  const [open, setOpen] = useState<string | null>(null)
  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><input className={iCls} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Preguntas y respuestas" action={
        <Btn size="sm" variant="ghost" onClick={() => { const id = `faq_${Date.now()}`; s({ items: [...items, { id, pregunta: "Nueva pregunta", respuesta: "Respuesta aqui..." }] }); setOpen(id) }}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        <div className="space-y-2">
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin preguntas aun</p>}
          {items.map(item => (
            <div key={item.id} className="rounded-xl border border-border overflow-hidden">
              <button onClick={() => setOpen(open === item.id ? null : item.id)} className="w-full flex items-center gap-3 px-4 py-3 bg-secondary/10 hover:bg-secondary/20 text-left">
                <span className="flex-1 text-sm font-medium text-foreground truncate">{item.pregunta}</span>
                <button onClick={e => { e.stopPropagation(); s({ items: items.filter(x => x.id !== item.id) }) }} className="w-7 h-7 flex items-center justify-center text-muted-foreground hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
                {open === item.id ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
              </button>
              {open === item.id && (
                <div className="p-4 space-y-3 bg-card">
                  <F label="Pregunta"><input className={iCls} value={item.pregunta} onChange={e => s({ items: items.map(x => x.id === item.id ? { ...x, pregunta: e.target.value } : x) })} /></F>
                  <F label="Respuesta"><textarea className={tCls} rows={3} value={item.respuesta} onChange={e => s({ items: items.map(x => x.id === item.id ? { ...x, respuesta: e.target.value } : x) })} /></F>
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function TextBannerEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const align = data.alignment || "center"
  return (
    <div className="p-5 space-y-5">
      <Card title="Contenido">
        <F label="Subtitulo (pequeno, encima del titulo)" helper="Dejar vacÃ­o para ocultar"><input className={iCls} value={data.subtitulo || ""} onChange={e => s({ subtitulo: e.target.value })} placeholder="ej. DESTACADO" /></F>
        <F label="Titulo principal"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion" helper="Texto debajo del titulo"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Boton CTA">
        <div className="grid grid-cols-2 gap-3">
          <F label="Texto del boton" helper="Dejar vacÃ­o para ocultar boton"><input className={iCls} value={data.ctaLabel || ""} onChange={e => s({ ctaLabel: e.target.value })} /></F>
          <F label="Link"><input className={iCls} value={data.ctaHref || ""} onChange={e => s({ ctaHref: e.target.value })} placeholder="/registro" /></F>
        </div>
      </Card>
      <Card title="Alineacion del texto">
        <div className="flex gap-2">
          {([["left", AlignLeft, "Izquierda"], ["center", AlignCenter, "Centro"], ["right", AlignRight, "Derecha"]] as const).map(([val, Icon, lbl]) => (
            <button key={val} onClick={() => s({ alignment: val })} className={cn("flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all", align === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              <Icon className="w-4 h-4" />{lbl}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}

function GalleryEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const images = (data.images || []) as { id: string; url: string; alt: string; caption: string }[]
  const ref = useRef<HTMLInputElement>(null)
  const addImages = (files: FileList) => {
    const newImgs = [...images]
    Array.from(files).forEach(file => {
      const r = new FileReader()
      r.onload = e => {
        newImgs.push({ id: `img_${Date.now()}_${Math.random()}`, url: e.target?.result as string, alt: "", caption: "" })
        s({ images: [...newImgs] })
      }
      r.readAsDataURL(file)
    })
  }
  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Titulo" helper="Dejar vacÃ­o para ocultar"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><input className={iCls} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>
      <Card title="Columnas de la cuadricula">
        <div className="flex gap-2">
          {([2, 3, 4] as const).map(n => (
            <button key={n} onClick={() => s({ columns: n })} className={cn("flex-1 h-10 rounded-xl border text-sm font-medium transition-all", (data.columns || 3) === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              {n} columnas
            </button>
          ))}
        </div>
      </Card>
      <Card title={`Imagenes (${images.length})`} action={
        <div className="flex gap-2">
          <Btn size="sm" variant="ghost" onClick={() => s({ images: [...images, { id: `img_${Date.now()}`, url: "", alt: "", caption: "" }] })}><Plus className="w-3.5 h-3.5" />URL</Btn>
          <Btn size="sm" variant="primary" onClick={() => ref.current?.click()}><FileImage className="w-3.5 h-3.5" />Subir</Btn>
          <input ref={ref} type="file" accept="image/*" multiple className="hidden" onChange={e => { if (e.target.files) addImages(e.target.files) }} />
        </div>
      }>
        {images.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin imÃ¡genes. Agrega desde URL o sube archivos.</p>}
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={img.id} className="flex gap-3 items-start p-3 rounded-xl border border-border bg-secondary/10">
              <div className="w-14 h-14 rounded-lg border border-border overflow-hidden flex-shrink-0 bg-secondary/20">
                {img.url ? <img src={img.url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><FileImage className="w-5 h-5" /></div>}
              </div>
              <div className="flex-1 space-y-2 min-w-0">
                <F label="URL"><input className={iCls} value={img.url} onChange={e => s({ images: images.map((x, j) => j === i ? { ...x, url: e.target.value } : x) })} placeholder="URL de imagen..." /></F>
                <div className="grid grid-cols-2 gap-2">
                  <input className={iCls} value={img.alt} onChange={e => s({ images: images.map((x, j) => j === i ? { ...x, alt: e.target.value } : x) })} placeholder="Alt text" />
                  <input className={iCls} value={img.caption} onChange={e => s({ images: images.map((x, j) => j === i ? { ...x, caption: e.target.value } : x) })} placeholder="Caption (hover)" />
                </div>
              </div>
              <button onClick={() => s({ images: images.filter((_, j) => j !== i) })} className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function StatsEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const items = (data.items || []) as { id: string; numero: string; label: string; icono: string }[]
  const appearance = (data.appearance as Record<string, any>) || {}
  const sAppearance = (patch: Record<string, any>) => s({ appearance: { ...appearance, ...patch } })
  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Titulo" helper="Dejar vacÃ­o para ocultar"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
      </Card>
      <Card title="Estadisticas" action={
        <Btn size="sm" variant="ghost" onClick={() => s({ items: [...items, { id: `st_${Date.now()}`, numero: "1,000+", label: "Nueva estadistica", icono: "ðŸ†" }] })}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin estadÃ­sticas. Agrega la primera.</p>}
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="grid grid-cols-[40px_1fr_1fr_1fr_36px] gap-2 items-center">
              <input className={cn(iCls, "text-center text-lg")} value={item.icono} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, icono: e.target.value } : x) })} placeholder="ðŸ†" />
              <input className={iCls} value={item.numero} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, numero: e.target.value } : x) })} placeholder="ej. 15,000+" />
              <input className={cn(iCls, "col-span-2")} value={item.label} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="ej. Docentes activos" />
              <button onClick={() => s({ items: items.filter((_, j) => j !== i) })} className="h-10 w-9 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/40 transition-all">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Apariencia visual">
        <div className="grid grid-cols-2 gap-3">
          <StudioColorField label="Color acento" value={appearance.accentColor} onChange={(value) => sAppearance({ accentColor: value })} />
          <StudioColorField label="Color titulo" value={appearance.titleColor} onChange={(value) => sAppearance({ titleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Color numero" value={appearance.numberColor} onChange={(value) => sAppearance({ numberColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Color etiqueta" value={appearance.labelColor} onChange={(value) => sAppearance({ labelColor: value })} fallback="#9CA3AF" />
          <StudioColorField label="Fondo tarjeta" value={appearance.cardBg} onChange={(value) => sAppearance({ cardBg: value })} fallback="#111827" />
          <StudioColorField label="Borde tarjeta" value={appearance.cardBorder} onChange={(value) => sAppearance({ cardBorder: value })} fallback="#1F2937" />
          <StudioRangeField label="Padding bloque" value={Number(appearance.sectionPaddingY || 64)} onChange={(value) => sAppearance({ sectionPaddingY: value })} min={40} max={180} step={4} />
          <StudioRangeField label="Padding tarjeta" value={Number(appearance.cardPadding || 0)} onChange={(value) => sAppearance({ cardPadding: value })} min={0} max={64} step={4} />
        </div>
      </Card>
    </div>
  )
}

type HtmlInspectorNodeKind = "image" | "button" | "field" | "icon" | "text" | "container"

const HTML_ICON_SHAPE_TAGS = new Set(["path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "g", "use"])

function looksLikeSelectedHtmlIcon(element: EditorElementInfo | null | undefined) {
  if (!element) return false
  const tag = element.tag
  const classes = String(element.classes || "").toLowerCase()
  const html = String(element.html || "").toLowerCase()
  const text = String(element.text || "").trim()
  return (
    tag === "svg" ||
    HTML_ICON_SHAPE_TAGS.has(tag) ||
    !!element.attrs?.dataIcon ||
    classes.includes("he-inline-icon") ||
    classes.includes("lucide") ||
    html.includes("data-he-icon-root") ||
    html.includes("data-he-icon=") ||
    (html.includes("<svg") && text.length <= 2) ||
    (/^\p{Emoji}+$/u.test(text) && text.length <= 8)
  )
}

function getSelectedHtmlTextValue(element: EditorElementInfo | null | undefined) {
  return String(element?.text || "").replace(/\s+/g, " ").trim()
}

function selectedHtmlHasVisualChrome(element: EditorElementInfo | null | undefined) {
  if (!element) return false
  const background = element.styles.backgroundColor || ""
  const borderWidth = parseFloat(element.styles.borderWidth || "0")
  const borderRadius = parseFloat(element.styles.borderRadius || "0")
  return (
    (!!background && background !== "transparent" && background !== "rgba(0, 0, 0, 0)") ||
    borderWidth > 0 ||
    borderRadius > 0 ||
    (!!element.styles.boxShadow && element.styles.boxShadow !== "none")
  )
}

function looksLikeSelectedHtmlButtonContainer(element: EditorElementInfo | null | undefined) {
  if (!element || element.id === "he-import-root") return false
  if (["img", "input", "textarea", "select"].includes(element.tag)) return false
  if (element.isActionable || looksLikeSelectedHtmlIcon(element)) return false
  if (!["div", "span", "label", "li", "p"].includes(element.tag)) return false
  const html = String(element.html || "").toLowerCase()
  if (/<(input|textarea|select|button|a|img|video|iframe|table|ul|ol)\b/.test(html)) return false
  const text = getSelectedHtmlTextValue(element)
  const childCount = element.children?.length ?? 0
  if (!text || text.length > 90 || childCount > 4) return false
  const display = String(element.styles.display || "").toLowerCase()
  const inlineLike = display.includes("inline") || display.includes("flex") || display.includes("grid")
  const hasIcon = !!element.attrs?.dataIcon || html.includes("<svg") || html.includes("data-he-icon") || /^\p{Emoji}+$/u.test(text)
  return (selectedHtmlHasVisualChrome(element) || hasIcon) && inlineLike
}

function looksLikeSelectedHtmlTextContainer(element: EditorElementInfo | null | undefined) {
  if (!element || element.id === "he-import-root") return false
  if (["img", "input", "textarea", "select"].includes(element.tag)) return false
  if (element.isActionable || looksLikeSelectedHtmlIcon(element) || looksLikeSelectedHtmlButtonContainer(element)) return false
  if (!["div", "span", "label", "li", "p"].includes(element.tag)) return false
  const html = String(element.html || "").toLowerCase()
  if (/<(input|textarea|select|button|a|img|video|iframe|table|ul|ol)\b/.test(html)) return false
  const text = getSelectedHtmlTextValue(element)
  const childCount = element.children?.length ?? 0
  if (!text || text.length > 180 || childCount > 3) return false
  return true
}

function getSelectedHtmlNodeKind(element: EditorElementInfo | null | undefined): HtmlInspectorNodeKind {
  if (!element) return "container"
  if (element.tag === "img") return "image"
  if (["input", "textarea", "select"].includes(element.tag)) return "field"
  if (element.isActionable || looksLikeSelectedHtmlButtonContainer(element)) return "button"
  if (looksLikeSelectedHtmlIcon(element)) return "icon"
  if (element.isText || looksLikeSelectedHtmlTextContainer(element)) return "text"
  return "container"
}

function postHtmlEditorCommand(
  iframeRef: { current: HTMLIFrameElement | null } | undefined,
  command: Record<string, unknown>
) {
  iframeRef?.current?.contentWindow?.postMessage(command, "*")
}

function applySiteThemeToSelectedHtmlElement(
  element: EditorElementInfo,
  iframeRef: { current: HTMLIFrameElement | null } | undefined,
  theme: Record<string, any>
) {
  if (!element?.eid || !iframeRef?.current?.contentWindow) return false

  const eid = element.eid
  const accent = theme.accentColor || "var(--he-primary, #E8392A)"
  const surface = theme.surfaceColor || "var(--he-surface, rgba(13,24,38,.82))"
  const text = theme.textColor || "var(--he-foreground, #E2EAF0)"
  const muted = theme.mutedColor || "var(--he-muted, rgba(226,234,240,.72))"
  const border = theme.borderColor || "var(--he-border, rgba(120,144,171,.18))"
  const fontFamily = theme.fontFamily || "var(--he-font-sans, 'Barlow', system-ui, sans-serif)"
  const kind = getSelectedHtmlNodeKind(element)
  const send = (command: Record<string, unknown>) => postHtmlEditorCommand(iframeRef, command)
  const style = (prop: string, value: string) =>
    send({ __editor_cmd: true, cmd: "style", eid, prop, value })
  const queryStyle = (selector: string, prop: string, value: string) =>
    send({ __editor_cmd: true, cmd: "style_query", eid, selector, prop, value })

  if (kind === "field") {
    ;[
      ["backgroundImage", "none"],
      ["backgroundColor", surface],
      ["color", text],
      ["borderColor", border],
      ["borderWidth", "1px"],
      ["borderRadius", "16px"],
      ["padding", ".85rem 1rem"],
      ["fontFamily", fontFamily],
      ["fontWeight", "500"],
      ["boxShadow", "none"],
      ["outline", "none"],
    ].forEach(([prop, value]) => style(prop, value))

    if (element.tag === "select") {
      ;[
        ["appearance", "none"],
        ["cursor", "pointer"],
        ["paddingRight", "1rem"],
      ].forEach(([prop, value]) => style(prop, value))
      queryStyle("option", "backgroundColor", "#0d1826")
      queryStyle("option", "color", text)
      queryStyle("option", "fontFamily", fontFamily)
    }
  } else if (kind === "button") {
    ;[
      ["backgroundImage", "none"],
      ["display", "inline-flex"],
      ["alignItems", "center"],
      ["justifyContent", "center"],
      ["gap", ".55rem"],
      ["fontFamily", fontFamily],
      ["fontWeight", "700"],
      ["textAlign", "center"],
      ["whiteSpace", "normal"],
      ["overflowWrap", "anywhere"],
      ["maxWidth", "100%"],
      ["minWidth", "0"],
      ["padding", ".8rem 1.2rem"],
      ["borderRadius", "18px"],
      ["borderWidth", "1px"],
      ["boxShadow", "0 10px 26px rgba(232,57,42,.18)"],
      ["backgroundColor", accent],
      ["color", "#ffffff"],
      ["borderColor", `color-mix(in srgb, ${accent} 70%, #ffffff 8%)`],
    ].forEach(([prop, value]) => style(prop, value))
  } else if (kind === "icon") {
    const baseSize = Math.max(18, Math.min(40, Number.parseFloat(element.styles.width || element.styles.height || element.styles.fontSize || "24") || 24))
    ;[
      ["display", "inline-flex"],
      ["alignItems", "center"],
      ["justifyContent", "center"],
      ["color", accent],
      ["fontSize", `${baseSize}px`],
      ["width", `${baseSize}px`],
      ["height", `${baseSize}px`],
      ["lineHeight", "1"],
      ["zIndex", "2"],
    ].forEach(([prop, value]) => style(prop, value))
    queryStyle("[data-he-icon-root='1']", "color", accent)
    queryStyle("[data-he-icon-root='1']", "width", `${baseSize}px`)
    queryStyle("[data-he-icon-root='1']", "height", `${baseSize}px`)
    queryStyle("svg", "color", accent)
    queryStyle("svg", "stroke", "currentColor")
    queryStyle("svg", "fill", "currentColor")
    queryStyle("svg", "width", `${baseSize}px`)
    queryStyle("svg", "height", `${baseSize}px`)
    ;["path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "g", "use"].forEach((selector) => {
      queryStyle(selector, "stroke", "currentColor")
      queryStyle(selector, "fill", "currentColor")
    })
  } else if (kind === "text") {
    const isTitle = /^h[1-6]$/.test(element.tag)
    const isEyebrow = !isTitle && String(element.text || "").trim().length <= 24 && String(element.text || "").trim() === String(element.text || "").trim().toUpperCase()
    if (isTitle) {
      ;[
        ["fontFamily", fontFamily],
        ["fontSize", "clamp(28px, 4vw, 42px)"],
        ["fontWeight", "800"],
        ["lineHeight", "1.08"],
        ["letterSpacing", "-0.02em"],
        ["color", text],
      ].forEach(([prop, value]) => style(prop, value))
    } else if (isEyebrow) {
      ;[
        ["fontFamily", fontFamily],
        ["fontSize", "12px"],
        ["fontWeight", "700"],
        ["letterSpacing", ".08em"],
        ["textTransform", "uppercase"],
        ["color", accent],
      ].forEach(([prop, value]) => style(prop, value))
    } else {
      ;[
        ["fontFamily", fontFamily],
        ["fontSize", "16px"],
        ["fontWeight", "500"],
        ["lineHeight", "1.7"],
        ["letterSpacing", "0"],
        ["color", muted],
      ].forEach(([prop, value]) => style(prop, value))
    }
  } else if (kind === "image") {
    ;[
      ["display", "block"],
      ["maxWidth", "100%"],
      ["height", "auto"],
      ["objectFit", "contain"],
      ["borderRadius", "18px"],
    ].forEach(([prop, value]) => style(prop, value))
  } else {
    ;[
      ["backgroundImage", "none"],
      ["backgroundColor", surface],
      ["color", text],
      ["borderColor", border],
      ["borderWidth", "1px"],
      ["borderRadius", "20px"],
      ["boxShadow", "0 10px 24px rgba(0,0,0,.16)"],
      ["padding", "24px"],
    ].forEach(([prop, value]) => style(prop, value))
  }

  window.setTimeout(() => {
    send({ __editor_cmd: true, cmd: "highlight", eid })
  }, 60)

  return true
}

// CustomCodeEditor: now only handles code view — the visual editor lives in the main inspector panel
function CustomCodeEditor({
  data,
  onChange,
  selectedHtmlElement,
  htmlIframeRef,
}: {
  data: Record<string, any>
  onChange: (d: Record<string, any>) => void
  selectedHtmlElement?: EditorElementInfo | null
  htmlIframeRef?: { current: HTMLIFrameElement | null }
}) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const [showCode, setShowCode] = useState(false)
  const [panel, setPanel] = useState<"visual" | "dev">("visual")
  const hasHtml = !!(data.html || "").trim()
  const importSettings = getHtmlImportSettings(data)
  const themeOverrides = (data.themeOverrides ?? {}) as Record<string, any>
  const canAdapt = !!String(data.html || data.sourceHtml || "").trim()

  const reapplyImportTheme = (nextMode: CMSHtmlImportMode = importSettings.mode) => {
    if (selectedHtmlElement?.eid && htmlIframeRef?.current?.contentWindow) {
      const applied = applySiteThemeToSelectedHtmlElement(selectedHtmlElement, htmlIframeRef, themeOverrides)
      if (applied) return
    }

    const source = String(data.html || data.sourceHtml || "")
    if (!source.trim()) return

    const built = buildImportedHtml(source, {
      mode: nextMode,
      stripNavigation: importSettings.stripNavigation,
      stripFooter: importSettings.stripFooter,
      theme: {
        accentColor: themeOverrides.accentColor || undefined,
        textColor: themeOverrides.textColor || undefined,
        surfaceColor: themeOverrides.surfaceColor || undefined,
        borderColor: themeOverrides.borderColor || undefined,
        backgroundColor: themeOverrides.backgroundColor || undefined,
      },
    })

    s({
      html: built.html,
      importMode: nextMode,
      stripNavigation: importSettings.stripNavigation,
      stripFooter: importSettings.stripFooter,
      themeOverrides,
    })
  }

  const replaceImportedEmojis = () => {
    if (selectedHtmlElement?.eid && htmlIframeRef?.current?.contentWindow) {
      postHtmlEditorCommand(htmlIframeRef, { __editor_cmd: true, cmd: "highlight", eid: selectedHtmlElement.eid })
    }
    const source = String(data.html || data.sourceHtml || "")
    if (!source.trim()) return
    s({ html: replaceKnownEmojisInDocumentHtml(source) })
  }

  const replaceImportedHtml = (_type: CMSSectionType, nextData: Record<string, unknown>) => {
    if (_type !== "customCode") return
    onChange({
      ...data,
      ...nextData,
      actionBindings: Array.isArray(nextData.actionBindings) ? nextData.actionBindings : (data.actionBindings ?? []),
    })
    setPanel("visual")
  }

  return (
    <div className="space-y-4">
      <div className="flex overflow-hidden rounded-2xl border border-white/8">
        {([
          { id: "visual", label: "Visual" },
          { id: "dev", label: "Dev" },
        ] as const).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setPanel(item.id)}
            className={cn(
              "flex-1 py-2 text-xs font-semibold transition-all",
              panel === item.id ? "bg-white/8 text-white" : "text-white/35 hover:text-white/60"
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {hasHtml && (
        <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-[11px] text-white/50 leading-5">
          Haz clic directamente en el bloque del canvas para seleccionar y editar elementos. Los cambios visuales quedan guardados y puedes conectar botones desde la pestaña de Acciones.
        </div>
      )}

      {panel === "visual" ? (
        <>
          <Card title="Adaptacion visual">
            <div className="grid gap-2">
              {([
                ["adapted", "Adaptado al sitio"],
                ["hybrid", "Hibrido"],
                ["sandbox", "Original"],
              ] as const).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => s({ importMode: mode })}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-left text-sm font-semibold leading-5 transition-all",
                    importSettings.mode === mode ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => s({ stripNavigation: !importSettings.stripNavigation })}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all",
                  importSettings.stripNavigation ? "border-primary bg-primary/10" : "border-border bg-secondary/10 hover:border-primary/35"
                )}
              >
                <div>
                  <div className="text-sm font-semibold text-white">Usar navbar del sitio</div>
                  <div className="mt-1 text-xs text-white/45">Oculta el nav importado para mantener el header principal.</div>
                </div>
                <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", importSettings.stripNavigation ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                  {importSettings.stripNavigation ? "Activo" : "Inactivo"}
                </div>
              </button>
              <button
                type="button"
                onClick={() => s({ stripFooter: !importSettings.stripFooter })}
                className={cn(
                  "flex items-start justify-between gap-4 rounded-2xl border px-4 py-4 text-left transition-all",
                  importSettings.stripFooter ? "border-primary bg-primary/10" : "border-border bg-secondary/10 hover:border-primary/35"
                )}
              >
                <div>
                  <div className="text-sm font-semibold text-white">Ocultar footer importado</div>
                  <div className="mt-1 text-xs text-white/45">Evita duplicar el pie de pagina dentro del bloque HTML.</div>
                </div>
                <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", importSettings.stripFooter ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                  {importSettings.stripFooter ? "Activo" : "Inactivo"}
                </div>
              </button>
            </div>
            <div className="grid gap-3">
              <StudioColorField
                label="Color principal"
                value={themeOverrides.accentColor || "#E8392A"}
                onChange={(value) => s({ themeOverrides: { ...themeOverrides, accentColor: value } })}
                helper="Usado para botones, links y acentos del bloque importado."
              />
              <StudioColorField
                label="Color de superficie"
                value={themeOverrides.surfaceColor || ""}
                onChange={(value) => s({ themeOverrides: { ...themeOverrides, surfaceColor: value } })}
                helper="Opcional. Personaliza tarjetas y formularios dentro del HTML."
                fallback="#0d1826"
              />
            </div>
            <div className="grid gap-2">
              <Btn
                variant="primary"
                onClick={() => reapplyImportTheme()}
                disabled={!canAdapt}
                className="w-full justify-center whitespace-normal text-center leading-5"
              >
                <Sparkles className="h-4 w-4" />
                Adaptar al estilo de la pagina
              </Btn>
              <Btn
                variant="ghost"
                onClick={replaceImportedEmojis}
                disabled={!canAdapt}
                className="w-full justify-center whitespace-normal text-center leading-5"
              >
                <Sparkles className="h-4 w-4" />
                Reemplazar emojis por iconos
              </Btn>
            </div>
          </Card>

          <Card title="Nota interna">
            <input
              className={iCls}
              value={data.nota || ""}
              onChange={(e) => s({ nota: e.target.value })}
              placeholder="ej. Landing importada para simulador de pedagogia"
            />
          </Card>
        </>
      ) : (
        <>
          <Card title="Importar / reemplazar HTML">
            <div className="mb-3 text-[11px] leading-5 text-white/45">
              Sube otro archivo `.html` y reemplaza el contenido de este bloque para seguir editandolo con las mismas herramientas visuales.
            </div>
            <HtmlImporter onCreateSection={replaceImportedHtml} />
          </Card>

          <Card title="Codigo HTML" action={
            <button
              type="button"
              onClick={() => setShowCode((value) => !value)}
              className="text-xs text-white/50 transition-colors hover:text-white"
            >
              {showCode ? "Ocultar" : "Mostrar"}
            </button>
          }>
            {showCode ? (
              <div className="space-y-3">
                <textarea
                  className={cn(codeCls, "min-h-[260px]")}
                  value={data.html || ""}
                  onChange={e => s({ html: e.target.value })}
                  placeholder={"<!-- Pega tu HTML aqui -->\n<iframe src=\"https://...\" width=\"100%\" height=\"450\" allowfullscreen></iframe>"}
                  spellCheck={false}
                />
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-5 text-white/45">
                  Si modificas el codigo manualmente, luego puedes volver a pulsar "Adaptar al estilo de la pagina" para reordenar colores, botones y navbar segun el tema del sitio.
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-white/45">
                Manten oculto el codigo si quieres trabajar solo de forma visual. El editor del canvas y las acciones del admin siguen funcionando sin tocar HTML.
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

function RichTextEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (patch: Record<string, any>) => onChange({ ...data, ...patch })
  const bullets = (data.bullets || []) as string[]

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Eyebrow / etiqueta"><input className={iCls} value={data.eyebrow || ""} onChange={e => s({ eyebrow: e.target.value })} placeholder="Contenido flexible" /></F>
        <F label="Titulo"><textarea className={tCls} rows={2} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} placeholder="Construye cualquier seccion" /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} placeholder="Describe la propuesta principal del bloque." /></F>
        <F label="Texto extendido" helper="Opcional. Util para parrafos editoriales o explicativos."><textarea className={tCls} rows={4} value={data.body || ""} onChange={e => s({ body: e.target.value })} placeholder="Amplia el mensaje con mas contexto, bullets o storytelling." /></F>
      </Card>

      <Card title="Contenido adicional">
        <F label="Lista de puntos">
          <StrList items={bullets} onChange={(next) => s({ bullets: next })} placeholder="Punto clave" />
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="Alineacion">
            <div className="grid grid-cols-3 gap-2">
              {([
                ["left", "Izquierda"],
                ["center", "Centro"],
                ["right", "Derecha"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => s({ alignment: key })}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-medium transition-all",
                    (data.alignment || "left") === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </F>
          <F label="Ancho del bloque">
            <div className="grid grid-cols-3 gap-2">
              {([
                ["md", "Compacto"],
                ["lg", "Normal"],
                ["xl", "Ancho"],
              ] as const).map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => s({ maxWidth: key })}
                  className={cn(
                    "h-10 rounded-xl border text-xs font-medium transition-all",
                    (data.maxWidth || "lg") === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </F>
        </div>
      </Card>

      <Card title="Botones">
        <div className="grid grid-cols-2 gap-3">
          <F label="Boton principal"><input className={iCls} value={data.primaryLabel || ""} onChange={e => s({ primaryLabel: e.target.value })} placeholder="Accion principal" /></F>
          <F label="Boton secundario"><input className={iCls} value={data.secondaryLabel || ""} onChange={e => s({ secondaryLabel: e.target.value })} placeholder="Accion secundaria" /></F>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Fallback principal"><input className={iCls} value={data.primaryHref || ""} onChange={e => s({ primaryHref: e.target.value })} placeholder="/registro o #seccion" /></F>
          <F label="Fallback secundario"><input className={iCls} value={data.secondaryHref || ""} onChange={e => s({ secondaryHref: e.target.value })} placeholder="/simulador o https://..." /></F>
        </div>
      </Card>
    </div>
  )
}

function LogoStripEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (patch: Record<string, any>) => onChange({ ...data, ...patch })
  const items = (data.items || []) as Array<{ id: string; label: string; subLabel?: string; imageUrl?: string; href?: string }>

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Eyebrow"><input className={iCls} value={data.eyebrow || ""} onChange={e => s({ eyebrow: e.target.value })} placeholder="Confianza" /></F>
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} placeholder="Marcas, aliados o herramientas" /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} placeholder="Explica que representan estos logos o marcas." /></F>
        <F label="Columnas">
          <input className={iCls} type="number" min={2} max={6} value={data.columns || 4} onChange={e => s({ columns: Math.min(6, Math.max(2, Number(e.target.value) || 4)) })} />
        </F>
      </Card>

      <Card
        title={`Elementos (${items.length})`}
        action={
          <Btn size="sm" variant="ghost" onClick={() => s({ items: [...items, { id: `logo_${Date.now()}`, label: `Logo ${items.length + 1}`, subLabel: "", imageUrl: "", href: "" }] })}>
            <Plus className="w-3.5 h-3.5" />Agregar
          </Btn>
        }
      >
        {items.length === 0 ? <p className="py-4 text-center text-sm text-muted-foreground">Aun no hay logos o marcas cargadas.</p> : null}
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-2xl border border-border bg-secondary/10 p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-foreground">{item.label || `Logo ${index + 1}`}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">Elemento visual</div>
                </div>
                <button onClick={() => s({ items: items.filter((entry) => entry.id !== item.id) })} className="flex h-8 w-8 items-center justify-center rounded-xl border border-border text-muted-foreground transition-all hover:border-red-400/35 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <F label="Nombre"><input className={iCls} value={item.label || ""} onChange={e => s({ items: items.map((entry) => entry.id === item.id ? { ...entry, label: e.target.value } : entry) })} placeholder="Logo 1" /></F>
                <F label="Subtexto"><input className={iCls} value={item.subLabel || ""} onChange={e => s({ items: items.map((entry) => entry.id === item.id ? { ...entry, subLabel: e.target.value } : entry) })} placeholder="Partner / cliente / tecnologia" /></F>
              </div>
              <F label="Imagen">
                <UploadImg value={item.imageUrl || ""} onChange={(value) => s({ items: items.map((entry) => entry.id === item.id ? { ...entry, imageUrl: value } : entry) })} />
              </F>
              <F label="Link opcional"><input className={iCls} value={item.href || ""} onChange={e => s({ items: items.map((entry) => entry.id === item.id ? { ...entry, href: e.target.value } : entry) })} placeholder="https://..." /></F>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

function SpacerEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (patch: Record<string, any>) => onChange({ ...data, ...patch })
  const height = Math.min(Math.max(Number(data.height || 96), 24), 320)

  return (
    <div className="p-5 space-y-5">
      <Card title="Espaciador">
        <F label="Altura" helper="Util para separar secciones y dar aire al layout.">
          <input className={iCls} type="range" min={24} max={320} step={4} value={height} onChange={e => s({ height: Number(e.target.value) })} />
        </F>
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-6 text-center">
          <div className="text-2xl font-semibold text-white">{height}px</div>
          <div className="mt-1 text-xs uppercase tracking-[0.22em] text-white/40">Separacion vertical</div>
        </div>
      </Card>
    </div>
  )
}

function EmbedEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (patch: Record<string, any>) => onChange({ ...data, ...patch })
  const mode = data.mode || "url"

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} placeholder="Embed universal" /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} placeholder="Mapas, calendarios, dashboards, formularios o widgets." /></F>
      </Card>

      <Card title="Fuente">
        <div className="grid grid-cols-2 gap-2">
          {([
            ["url", "URL / iframe src"],
            ["html", "HTML embebido"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              type="button"
              onClick={() => s({ mode: key })}
              className={cn(
                "h-10 rounded-xl border text-xs font-medium transition-all",
                mode === key ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"
              )}
            >
              {label}
            </button>
          ))}
        </div>
        {mode === "html" ? (
          <F label="HTML" helper="Pega el iframe o el embed completo.">
            <textarea className={cn(codeCls, "min-h-[220px]")} value={data.html || ""} onChange={e => s({ html: e.target.value })} placeholder={'<iframe src=\"https://...\" width=\"100%\" height=\"480\"></iframe>'} />
          </F>
        ) : (
          <F label="URL" helper="Pega un enlace embebible: maps, calendar, loom, canva, figma, etc.">
            <input className={iCls} value={data.url || ""} onChange={e => s({ url: e.target.value })} placeholder="https://..." />
          </F>
        )}
        <F label="Altura del viewport">
          <input className={iCls} type="number" min={220} max={900} value={data.height || 460} onChange={e => s({ height: Number(e.target.value) || 460 })} />
        </F>
      </Card>
    </div>
  )
}

function FormBuilderEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (patch: Record<string, any>) => onChange({ ...data, ...patch })
  const fields = (data.fields || []) as Array<{
    id: string
    type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "checkbox"
    label: string
    placeholder?: string
    required?: boolean
    width?: "full" | "half"
    options?: string[]
  }>

  const addField = (type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "checkbox") => {
    const nextField = {
      id: `fld_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: "Nuevo campo",
      placeholder: type === "checkbox" ? "Acepto recibir informacion" : "Escribe aqui",
      required: false,
      width: type === "textarea" || type === "checkbox" ? "full" : "half",
      options: type === "select" ? ["Opcion 1", "Opcion 2"] : [],
    }
    s({ fields: [...fields, nextField] })
  }

  const updateField = (fieldId: string, patch: Record<string, any>) => {
    s({
      fields: fields.map((field) =>
        field.id === fieldId
          ? {
              ...field,
              ...patch,
            }
          : field
      ),
    })
  }

  const moveField = (fieldId: string, direction: -1 | 1) => {
    const index = fields.findIndex((field) => field.id === fieldId)
    const nextIndex = index + direction
    if (index === -1 || nextIndex < 0 || nextIndex >= fields.length) return
    const next = [...fields]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    s({ fields: next })
  }

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Badge superior"><input className={iCls} value={data.badge || ""} onChange={e => s({ badge: e.target.value })} placeholder="Formulario" /></F>
        <F label="Titulo"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} placeholder="Formulario personalizado" /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} placeholder="Describe lo que capturas con este formulario." /></F>
        <F label="Bullets informativos">
          <StrList items={data.bullets || []} onChange={(bullets) => s({ bullets })} placeholder="Ej. Registro rapido sin codigo" />
        </F>
      </Card>

      <Card title="Mensajes del formulario">
        <div className="grid grid-cols-2 gap-3">
          <F label="Texto del boton"><input className={iCls} value={data.submitLabel || ""} onChange={e => s({ submitLabel: e.target.value })} placeholder="Enviar" /></F>
          <F label="Titulo al enviar"><input className={iCls} value={data.successTitle || ""} onChange={e => s({ successTitle: e.target.value })} placeholder="Formulario enviado" /></F>
        </div>
        <F label="Mensaje de confirmacion"><textarea className={tCls} rows={2} value={data.successMessage || ""} onChange={e => s({ successMessage: e.target.value })} placeholder="Recibimos tu informacion correctamente." /></F>
      </Card>

      <Card
        title={`Campos (${fields.length})`}
        action={
          <div className="flex flex-wrap gap-2">
            {([
              ["text", "Texto"],
              ["email", "Email"],
              ["tel", "Telefono"],
              ["textarea", "Area"],
              ["select", "Select"],
            ] as const).map(([type, label]) => (
              <Btn key={type} size="sm" variant="ghost" onClick={() => addField(type)}>
                <Plus className="w-3.5 h-3.5" />{label}
              </Btn>
            ))}
          </div>
        }
      >
        {fields.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aun no has creado campos.</p>}
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="rounded-2xl border border-border bg-secondary/10 p-4 space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-foreground">{field.label || `Campo ${index + 1}`}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{field.type}</div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveField(field.id, -1)} disabled={index === 0} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5 mx-auto" /></button>
                  <button onClick={() => moveField(field.id, 1)} disabled={index === fields.length - 1} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5 mx-auto" /></button>
                  <button onClick={() => s({ fields: fields.filter((item) => item.id !== field.id) })} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:border-red-400/35 hover:text-red-400"><Trash2 className="w-3.5 h-3.5 mx-auto" /></button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <F label="Etiqueta"><input className={iCls} value={field.label} onChange={e => updateField(field.id, { label: e.target.value })} /></F>
                <F label="Tipo">
                  <select className={iCls} value={field.type} onChange={e => updateField(field.id, { type: e.target.value })}>
                    <option value="text">Texto</option>
                    <option value="email">Email</option>
                    <option value="tel">Telefono</option>
                    <option value="number">Numero</option>
                    <option value="textarea">Area de texto</option>
                    <option value="select">Selector</option>
                    <option value="checkbox">Checkbox</option>
                  </select>
                </F>
                <F label="Placeholder / ayuda"><input className={iCls} value={field.placeholder || ""} onChange={e => updateField(field.id, { placeholder: e.target.value })} /></F>
                <F label="Ancho">
                  <div className="flex gap-2">
                    {(["half", "full"] as const).map((width) => (
                      <button
                        key={width}
                        type="button"
                        onClick={() => updateField(field.id, { width })}
                        className={cn(
                          "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                          (field.width || "half") === width ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                        )}
                      >
                        {width === "half" ? "1/2" : "Completo"}
                      </button>
                    ))}
                  </div>
                </F>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateField(field.id, { required: !field.required })}
                  className={cn(
                    "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    field.required ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                  )}
                >
                  {field.required ? "Obligatorio" : "Opcional"}
                </button>
              </div>

              {field.type === "select" && (
                <F label="Opciones del selector">
                  <StrList items={field.options || []} onChange={(options) => updateField(field.id, { options })} placeholder="Ej. Provincia" />
                </F>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// â”€â”€â”€ PageHero Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function PageHeroEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const layout     = data.layout     || "center"
  const rightPanel = data.rightPanel || "none"
  const stats      = (data.stats as { emoji: string; value: string; label: string }[]) || []
  const features   = (data.features as string[]) || []
  const appearance = (data.appearance as Record<string, any>) || {}
  const sAppearance = (patch: Record<string, any>) => s({ appearance: { ...appearance, ...patch } })

  return (
    <div className="p-5 space-y-5">
      <Card title="Badge (etiqueta superior)">
        <div className="grid grid-cols-[80px_1fr_100px] gap-3">
          <F label="Emoji"><input className={iCls} value={data.badgeEmoji || ""} onChange={e => s({ badgeEmoji: e.target.value })} placeholder="â­" /></F>
          <F label="Texto"><input className={iCls} value={data.badge || ""} onChange={e => s({ badge: e.target.value })} placeholder="MI PAGINA" /></F>
          <F label="Color de acento"><input type="color" className="h-10 w-full rounded-xl border border-border bg-secondary/15 cursor-pointer" value={data.accentColor || "#E8392A"} onChange={e => s({ accentColor: e.target.value })} /></F>
        </div>
      </Card>

      <Card title="Titulo">
        <F label="Linea principal" helper="Se muestra en blanco"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} placeholder="Titulo de la pagina" /></F>
        <F label="Linea de acento" helper="Se muestra con el color de acento (opcional)"><input className={iCls} value={data.subtitulo || ""} onChange={e => s({ subtitulo: e.target.value })} placeholder="texto en color" /></F>
        <F label="Descripcion"><textarea className={tCls} rows={3} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>

      <Card title="Lista de caracteristicas (checkmarks)" action={
        <Btn size="sm" variant="ghost" onClick={() => s({ features: [...features, "Nueva caracteristica"] })}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        {features.length === 0 && <p className="text-sm text-muted-foreground text-center py-3">Sin lista de caracteristicas</p>}
        <StrList items={features} onChange={v => s({ features: v })} placeholder="ej. Simuladores actualizados" />
      </Card>

      <Card title="Botones CTA">
        <div className="grid grid-cols-2 gap-3">
          <F label="Texto boton primario"><input className={iCls} value={data.ctaPrimario || ""} onChange={e => s({ ctaPrimario: e.target.value })} placeholder="Comenzar Ahora" /></F>
          <F label="Texto boton secundario"><input className={iCls} value={data.ctaSecundario || ""} onChange={e => s({ ctaSecundario: e.target.value })} placeholder="Saber mas" /></F>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Configura el flujo y redirección de cada botón en la sección <span className="font-semibold text-primary">⚡ Acciones</span> del panel derecho.</p>
      </Card>

      <Card title="Layout">
        <div className="flex gap-2">
          {([["center", AlignCenter, "Centrado"], ["split", AlignLeft, "Dividido (img/stats derecha)"]] as const).map(([val, Icon, lbl]) => (
            <button key={val} onClick={() => s({ layout: val })} className={cn("flex-1 h-10 rounded-xl border flex items-center justify-center gap-2 text-sm font-medium transition-all", layout === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              <Icon className="w-4 h-4" />{lbl}
            </button>
          ))}
        </div>
      </Card>

      <Card title="Panel derecho (solo en layout dividido)">
        <div className="flex gap-2 mb-4">
          {([["none", "Ninguno"], ["stats", "Tarjetas de stats"], ["image", "Imagen"]] as const).map(([val, lbl]) => (
            <button key={val} onClick={() => s({ rightPanel: val })} className={cn("flex-1 h-9 rounded-xl border text-xs font-medium transition-all", rightPanel === val ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              {lbl}
            </button>
          ))}
        </div>

        {rightPanel === "image" && (
          <F label="Imagen derecha"><UploadImg value={data.rightImage || ""} onChange={v => s({ rightImage: v })} /></F>
        )}

        {rightPanel === "stats" && (
          <div className="space-y-3">
            <F label="Titulo del panel"><input className={iCls} value={data.statsTitle || ""} onChange={e => s({ statsTitle: e.target.value })} placeholder="Resultados reales" /></F>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">Estadisticas</span>
              <Btn size="sm" variant="ghost" onClick={() => s({ stats: [...stats, { emoji: "â­", value: "100+", label: "Nueva stat" }] })}>
                <Plus className="w-3.5 h-3.5" />Agregar
              </Btn>
            </div>
            {stats.map((st, i) => (
              <div key={i} className="grid grid-cols-[48px_1fr_1fr_32px] gap-2 items-center">
                <input className={cn(iCls, "text-center text-lg")} value={st.emoji} onChange={e => s({ stats: stats.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) })} placeholder="â­" />
                <input className={iCls} value={st.value} onChange={e => s({ stats: stats.map((x, j) => j === i ? { ...x, value: e.target.value } : x) })} placeholder="ej. 15K+" />
                <input className={iCls} value={st.label} onChange={e => s({ stats: stats.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} placeholder="ej. Docentes activos" />
                <button onClick={() => s({ stats: stats.filter((_, j) => j !== i) })} className="h-10 w-8 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>
      <Card title="Apariencia visual">
        <div className="grid grid-cols-2 gap-3">
          <StudioColorField label="Color titulo" value={appearance.titleColor} onChange={(value) => sAppearance({ titleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Color descripcion" value={appearance.descriptionColor} onChange={(value) => sAppearance({ descriptionColor: value })} fallback="#9CA3AF" />
          <StudioColorField label="Glow de fondo" value={appearance.glowColor} onChange={(value) => sAppearance({ glowColor: value })} fallback={data.accentColor || "#E8392A"} />
          <StudioColorField label="Fondo panel derecho" value={appearance.surfaceBg} onChange={(value) => sAppearance({ surfaceBg: value })} fallback="#111827" />
          <StudioColorField label="Borde panel derecho" value={appearance.surfaceBorder} onChange={(value) => sAppearance({ surfaceBorder: value })} fallback="#1F2937" />
          <StudioRangeField label="Padding vertical" value={Number(appearance.sectionPaddingY || 96)} onChange={(value) => sAppearance({ sectionPaddingY: value })} min={56} max={220} step={4} />
          <StudioRangeField label="Padding horizontal" value={Number(appearance.sectionPaddingX || 24)} onChange={(value) => sAppearance({ sectionPaddingX: value })} min={16} max={96} step={4} />
          <StudioRangeField label="Tamano titulo" value={Number(appearance.titleSize || 64)} onChange={(value) => sAppearance({ titleSize: value })} min={36} max={92} />
          <StudioRangeField label="Tamano descripcion" value={Number(appearance.descriptionSize || 18)} onChange={(value) => sAppearance({ descriptionSize: value })} min={14} max={28} />
        </div>
      </Card>
    </div>
  )
}

import { HtmlImporter } from "@/components/admin/html-importer"
import { HtmlElementInspector } from "@/components/admin/html-element-inspector"
import CustomCodeSection from "@/components/landing/custom-code-section"
import type { EditorElementInfo } from "@/components/admin/html-editor-bridge"


function FeatureCardsEditor({ data, onChange }: { data: Record<string, any>; onChange: (d: Record<string, any>) => void }) {
  const s = (p: Record<string, any>) => onChange({ ...data, ...p })
  const items = (data.items as { id: string; emoji: string; title: string; description: string; accentColor?: string }[]) || []
  const appearance = (data.appearance as Record<string, any>) || {}
  const sAppearance = (patch: Record<string, any>) => s({ appearance: { ...appearance, ...patch } })

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado (opcional)">
        <F label="Titulo" helper="Dejar vacio para omitir"><input className={iCls} value={data.titulo || ""} onChange={e => s({ titulo: e.target.value })} /></F>
        <F label="Descripcion"><input className={iCls} value={data.descripcion || ""} onChange={e => s({ descripcion: e.target.value })} /></F>
      </Card>

      <Card title="Columnas">
        <div className="flex gap-2">
          {([2, 3, 4] as const).map(n => (
            <button key={n} onClick={() => s({ columns: n })} className={cn("flex-1 h-10 rounded-xl border text-sm font-medium transition-all", (data.columns || 3) === n ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
              {n} columnas
            </button>
          ))}
        </div>
      </Card>

      <Card title={`Tarjetas (${items.length})`} action={
        <Btn size="sm" variant="ghost" onClick={() => s({ items: [...items, { id: `fc_${Date.now()}`, emoji: "â­", title: "Nueva tarjeta", description: "Descripcion.", accentColor: "#E8392A" }] })}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin tarjetas. Agrega la primera.</p>}
        <div className="space-y-4">
          {items.map((item, i) => (
            <div key={item.id} className="rounded-xl border border-border bg-secondary/10 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">Tarjeta {i + 1}</span>
                <button onClick={() => s({ items: items.filter((_, j) => j !== i) })} className="w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-[64px_1fr_100px] gap-3">
                <F label="Emoji"><input className={cn(iCls, "text-center text-lg")} value={item.emoji} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, emoji: e.target.value } : x) })} placeholder="â­" /></F>
                <F label="Titulo"><input className={iCls} value={item.title} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, title: e.target.value } : x) })} /></F>
                <F label="Color"><input type="color" className="h-10 w-full rounded-xl border border-border bg-secondary/15 cursor-pointer" value={item.accentColor || "#E8392A"} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, accentColor: e.target.value } : x) })} /></F>
              </div>
              <F label="Descripcion"><textarea className={tCls} rows={2} value={item.description} onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, description: e.target.value } : x) })} /></F>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Apariencia visual">
        <div className="grid grid-cols-2 gap-3">
          <StudioColorField label="Titulo bloque" value={appearance.headingTitleColor} onChange={(value) => sAppearance({ headingTitleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Descripcion bloque" value={appearance.headingDescriptionColor} onChange={(value) => sAppearance({ headingDescriptionColor: value })} fallback="#9CA3AF" />
          <StudioColorField label="Fondo tarjeta" value={appearance.cardBg} onChange={(value) => sAppearance({ cardBg: value })} fallback="#111827" />
          <StudioColorField label="Borde tarjeta" value={appearance.cardBorder} onChange={(value) => sAppearance({ cardBorder: value })} fallback="#1F2937" />
          <StudioColorField label="Titulo tarjeta" value={appearance.titleColor} onChange={(value) => sAppearance({ titleColor: value })} fallback="#FFFFFF" />
          <StudioColorField label="Descripcion tarjeta" value={appearance.descriptionColor} onChange={(value) => sAppearance({ descriptionColor: value })} fallback="#9CA3AF" />
          <StudioRangeField label="Padding bloque" value={Number(appearance.sectionPaddingY || 64)} onChange={(value) => sAppearance({ sectionPaddingY: value })} min={40} max={180} step={4} />
          <StudioRangeField label="Padding tarjeta" value={Number(appearance.cardPadding || 24)} onChange={(value) => sAppearance({ cardPadding: value })} min={16} max={48} step={2} />
        </div>
      </Card>
    </div>
  )
}

function CollectionFeedEditor({
  section,
  onDataChange,
  onSettingsChange,
}: {
  section: CMSSection
  onDataChange: (data: Record<string, any>) => void
  onSettingsChange: (settings: CMSSectionSettings) => void
}) {
  const datasets = useLandingBuilderData()
  const collectionKey = getCollectionKeyFromSection(section.type)
  const defaults = getDefaultSectionSettings(section.type)
  const source = {
    ...(defaults?.source ?? {}),
    ...(section.settings?.source ?? {}),
  }
  const settings: CMSSectionSettings = {
    visibility: {
      ...(defaults?.visibility ?? {}),
      ...(section.settings?.visibility ?? {}),
    },
    source,
  }

  const items = collectionKey ? datasets[collectionKey] : []
  const selectedItems = resolveLandingBuilderItems(
    {
      ...section,
      settings,
    },
    datasets
  )

  const sData = (patch: Record<string, any>) => onDataChange({ ...(section.data ?? {}), ...patch })
  const sSource = (patch: Record<string, any>) =>
    onSettingsChange({
      ...settings,
      source: {
        ...source,
        ...patch,
      },
    })

  const toggleManualId = (id: string) => {
    const manualIds = source.manualIds || []
    sSource({
      manualIds: manualIds.includes(id)
        ? manualIds.filter((item) => item !== id)
        : [...manualIds, id],
    })
  }

  const moveManualId = (id: string, direction: -1 | 1) => {
    const manualIds = [...(source.manualIds || [])]
    const index = manualIds.findIndex((item) => item === id)
    const nextIndex = index + direction
    if (index === -1 || nextIndex < 0 || nextIndex >= manualIds.length) return
    ;[manualIds[index], manualIds[nextIndex]] = [manualIds[nextIndex], manualIds[index]]
    sSource({ manualIds })
  }

  const collectionLabel = section.type === "simulatorsFeed"
    ? "simuladores"
    : section.type === "coursesFeed"
      ? "cursos"
      : "evaluaciones"

  return (
    <div className="p-5 space-y-5">
      <Card title="Encabezado">
        <F label="Badge superior">
          <input className={iCls} value={section.data?.badge || ""} onChange={(event) => sData({ badge: event.target.value })} placeholder="Ej. Simuladores" />
        </F>
        <F label="Titulo">
          <input className={iCls} value={section.data?.titulo || ""} onChange={(event) => sData({ titulo: event.target.value })} placeholder="Titulo del bloque" />
        </F>
        <F label="Descripcion">
          <textarea className={tCls} rows={3} value={section.data?.descripcion || ""} onChange={(event) => sData({ descripcion: event.target.value })} placeholder="Describe el objetivo del bloque." />
        </F>
        <div className="grid grid-cols-2 gap-3">
          <F label="CTA final">
            <input className={iCls} value={section.data?.ctaLabel || ""} onChange={(event) => sData({ ctaLabel: event.target.value })} placeholder="Ver todo" />
          </F>
          <F label="Link CTA">
            <input className={iCls} value={section.data?.ctaHref || ""} onChange={(event) => sData({ ctaHref: event.target.value })} placeholder="/dashboard/simuladores" />
          </F>
        </div>
      </Card>

      <Card title="Fuente de datos">
        <div className="mb-4 rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-4 py-3 text-xs leading-6 text-white/60">
          Este bloque solo muestra contenido <span className="text-white">publicado</span>. Si no aparece en la landing, revisa que el simulador, curso o evaluacion este publicado en su modulo admin.
        </div>
        <div className="grid grid-cols-2 gap-3">
          <F label="Modo">
            <div className="flex gap-2">
              {[
                { key: "auto", label: "Automatico" },
                { key: "manual", label: "Manual" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => sSource({ mode: option.key })}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    (source.mode || "auto") === option.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/35"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </F>
          <F label="Orden">
            <select className={iCls} value={source.order || "latest"} onChange={(event) => sSource({ order: event.target.value })}>
              <option value="latest">Mas recientes</option>
              <option value="alphabetical">Alfabetico</option>
            </select>
          </F>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <F label="Cantidad maxima">
            <input
              type="number"
              min={1}
              max={12}
              className={iCls}
              value={source.limit || 3}
              onChange={(event) => sSource({ limit: Math.max(1, Number(event.target.value) || 1) })}
            />
          </F>
          <F label="Vista">
            <div className="flex gap-2">
              {[
                { key: "grid", label: "Grid" },
                { key: "carousel", label: "Carrusel" },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => sSource({ display: option.key })}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    (source.display || "grid") === option.key
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/35"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </F>
        </div>

        {(source.display || "grid") === "grid" && (
          <F label="Columnas">
            <div className="flex gap-2">
              {[2, 3, 4].map((count) => (
                <button
                  key={count}
                  type="button"
                  onClick={() => sSource({ columns: count })}
                  className={cn(
                    "flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                    Number(source.columns || defaults?.source?.columns || 3) === count
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/35"
                  )}
                >
                  {count} columnas
                </button>
              ))}
            </div>
          </F>
        )}

        <div className="grid grid-cols-3 gap-2">
          {[
            { key: "showBadge", label: "Badge" },
            { key: "showMeta", label: "Metadatos" },
            { key: "showButton", label: "Boton" },
          ].map((option) => {
            const active = source[option.key as keyof typeof source] !== false
            return (
              <button
                key={option.key}
                type="button"
                onClick={() => sSource({ [option.key]: !active })}
                className={cn(
                  "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                  active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                )}
              >
                {option.label}
              </button>
            )
          })}
        </div>
      </Card>

      {source.mode === "manual" && (
        <Card title={`Seleccion manual (${items.length})`}>
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aun no hay {collectionLabel} publicados. Publica contenido primero desde el admin.
            </p>
          ) : (
            <div className="space-y-2">
              {items.map((item) => {
                const active = (source.manualIds || []).includes(item.id)
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => toggleManualId(item.id)}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-2xl border px-3 py-3 text-left transition-all",
                      active ? "border-primary bg-primary/10" : "border-border bg-secondary/10 hover:border-primary/35"
                    )}
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-lg">
                      {item.emoji || "✨"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 truncate text-xs text-white/45">{item.subtitle || item.description}</div>
                    </div>
                    <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", active ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                      {active ? "Incluido" : "Agregar"}
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {(source.manualIds || []).length > 0 && (
            <div className="mt-5 space-y-2 border-t border-white/8 pt-4">
              <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">Orden final del bloque</div>
              {(source.manualIds || []).map((id, index, list) => {
                const item = items.find((entry) => entry.id === id)
                if (!item) return null
                return (
                  <div key={id} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-lg">{item.emoji || "✨"}</div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/35">Posicion {index + 1}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => moveManualId(id, -1)} disabled={index === 0} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5 mx-auto" /></button>
                      <button onClick={() => moveManualId(id, 1)} disabled={index === list.length - 1} className="w-8 h-8 rounded-lg border border-border text-muted-foreground hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5 mx-auto" /></button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      )}

      <Card title="Vista previa de la conexion">
        <div className="rounded-2xl border border-white/8 bg-secondary/10 p-4">
          <div className="text-xs font-bold uppercase tracking-[0.18em] text-white/35">
            {source.mode === "manual" ? "Seleccion manual" : "Fuente automatica"}
          </div>
          <div className="mt-2 text-sm text-white/75">
            {selectedItems.length > 0
              ? `El bloque mostrara ${selectedItems.length} ${collectionLabel}.`
              : `El bloque esta listo para mostrar ${collectionLabel} cuando existan publicados.`}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {selectedItems.slice(0, 4).map((item) => (
              <span key={item.id} className="rounded-full border border-white/8 bg-white/5 px-3 py-1 text-[11px] text-white/55">
                {item.title}
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}

// â”€â”€â”€ Section mini-preview (visual canvas cards) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionMiniPreview({ section }: { section: CMSSection }) {
  const { type, data } = section
  const bar = (w: string, h = "h-1.5", op = "bg-foreground/30") =>
    <div className={`${h} ${op} rounded-sm`} style={{ width: w }} />

  switch (type) {
    case "hero": return (
      <div className="p-3 grid grid-cols-[1.2fr_0.8fr] gap-2">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/15 border border-primary/20">
            <div className="w-1.5 h-1.5 rounded-full bg-primary" />
            {bar("36px", "h-1", "bg-primary/50")}
          </div>
          {bar("80%", "h-2.5", "bg-foreground/60")}
          {bar("55%", "h-2.5", "bg-primary/50")}
          {bar("90%", "h-1", "bg-foreground/15")}
          <div className="flex gap-1 pt-0.5">
            <div className="h-4 w-12 rounded bg-primary/70" />
            <div className="h-4 w-10 rounded bg-secondary/50 border border-border" />
          </div>
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-1.5 space-y-1">
          {[1,2,3].map(i => <div key={i} className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-secondary/40 flex-shrink-0" />{bar("100%","h-1","bg-foreground/20")}</div>)}
        </div>
      </div>
    )
    case "pageHero": {
      const accent = data.accentColor || "#E8392A"
      return (
        <div className={`p-3 ${data.layout === "split" ? "grid grid-cols-[1.2fr_0.8fr] gap-2" : "space-y-1.5 text-center"}`}>
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full border" style={{ backgroundColor: `${accent}18`, borderColor: `${accent}35` }}>
              <div className="h-2 w-2 rounded-full" style={{ backgroundColor: accent }} />
              {bar("28px","h-1","bg-foreground/30")}
            </div>
            {data.titulo && <div className="text-[9px] font-bold text-foreground/70 leading-tight truncate">{data.titulo}</div>}
            {data.subtitulo && <div className="text-[9px] font-bold leading-tight truncate" style={{ color: accent }}>{data.subtitulo}</div>}
            {bar("90%","h-1","bg-foreground/15")}
            <div className="flex gap-1"><div className="h-3 w-10 rounded" style={{ backgroundColor: accent }} /><div className="h-3 w-8 rounded bg-secondary/50 border border-border" /></div>
          </div>
          {data.layout === "split" && (
            <div className="rounded-lg border border-border bg-secondary/20 p-1.5 space-y-1">
              {(data.stats?.length ? data.stats : [{},{},{}]).slice(0,3).map((_: any, i: number) => (
                <div key={i} className="flex items-center gap-1"><div className="w-4 h-4 rounded bg-secondary/40 flex-shrink-0" style={{ backgroundColor: `${accent}20` }} />{bar("100%","h-1.5","bg-foreground/20")}</div>
              ))}
            </div>
          )}
        </div>
      )
    }
    case "featureCards": {
      const cols = Math.min(data.columns || 3, 3)
      const items = (data.items || [{ title: "Tarjeta 1" }, { title: "Tarjeta 2" }, { title: "Tarjeta 3" }]).slice(0, cols)
      return (
        <div className="p-3">
          {data.titulo && <div className="text-[9px] text-center text-foreground/60 font-semibold mb-2 truncate">{data.titulo}</div>}
          <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {items.map((item: any, i: number) => (
              <div key={i} className="rounded border border-border/60 bg-secondary/10 p-1.5 space-y-1">
                <div className="h-5 w-5 rounded-lg bg-primary/15" />
                {bar("90%","h-1.5","bg-foreground/35")}
                {bar("70%","h-1","bg-foreground/15")}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "richText":
      return (
        <div className="p-3 space-y-2">
          {data.eyebrow ? <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[8px] font-bold uppercase tracking-[0.2em] text-primary">{data.eyebrow}</div> : null}
          {bar("68%","h-2.5","bg-foreground/60")}
          {bar("88%","h-1","bg-foreground/15")}
          {bar("76%","h-1","bg-foreground/15")}
          <div className="space-y-1 pt-1">
            {((data.bullets as string[]) || ["Punto 1", "Punto 2"]).slice(0, 2).map((_: string, index: number) => (
              <div key={index} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                {bar("68%","h-1","bg-foreground/18")}
              </div>
            ))}
          </div>
          <div className="flex gap-1.5 pt-1">
            <div className="h-4 w-14 rounded bg-primary/55" />
            <div className="h-4 w-12 rounded border border-border bg-secondary/40" />
          </div>
        </div>
      )
    case "logoStrip": {
      const items = (data.items || [{ label: "Logo" }, { label: "Brand" }, { label: "Tool" }, { label: "Partner" }]).slice(0, 4)
      return (
        <div className="p-3 space-y-2">
          {bar("40%","h-2","bg-foreground/45")}
          <div className="grid grid-cols-4 gap-1.5">
            {items.map((_: any, index: number) => (
              <div key={index} className="rounded-lg border border-border/50 bg-secondary/10 p-1.5 text-center">
                <div className="mx-auto h-7 w-7 rounded-xl border border-primary/18 bg-primary/10" />
                {bar("80%","h-1","bg-foreground/18")}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "spacer":
      return (
        <div className="flex h-full min-h-[88px] items-center justify-center bg-[linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:12px_12px] px-3">
          <div className="rounded-full border border-dashed border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Espaciador {data.height || 96}px
          </div>
        </div>
      )
    case "embed":
      return (
        <div className="p-3 space-y-2">
          {bar("42%","h-2","bg-foreground/45")}
          <div className="flex h-16 items-center justify-center rounded-xl border border-border/50 bg-secondary/10">
            <Code2 className="h-5 w-5 text-fuchsia-400/60" />
          </div>
          {bar("68%","h-1","bg-foreground/20")}
        </div>
      )
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed": {
      const accent = section.type === "coursesFeed" ? "bg-indigo-400/45" : section.type === "evaluationsFeed" ? "bg-amber-400/45" : "bg-primary/50"
      return (
        <div className="p-3 space-y-2">
          <div className="flex items-center justify-between">
            {bar("34%","h-2","bg-foreground/45")}
            <div className={cn("h-4 w-12 rounded-full", accent)} />
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {[1,2,3].map((item) => (
              <div key={item} className="rounded-lg border border-border/50 bg-secondary/10 p-1.5 space-y-1">
                <div className={cn("h-6 w-6 rounded-lg", accent)} />
                {bar("100%","h-1.5","bg-foreground/35")}
                {bar("75%","h-1","bg-foreground/20")}
                <div className="space-y-1 pt-0.5">
                  {bar("70%","h-1","bg-foreground/15")}
                  {bar("55%","h-1","bg-foreground/12")}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "formBuilder":
      return (
        <div className="p-3 space-y-1.5">
          <div className="flex items-center justify-between">
            {bar("38%","h-2","bg-foreground/45")}
            <div className="h-4 w-10 rounded-full bg-emerald-400/40" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <div className="h-7 rounded-lg border border-border/40 bg-secondary/10" />
            <div className="h-7 rounded-lg border border-border/40 bg-secondary/10" />
            <div className="col-span-2 h-12 rounded-lg border border-border/40 bg-secondary/10" />
          </div>
          <div className="h-5 w-20 rounded bg-emerald-400/45" />
        </div>
      )
    case "benefits": return (
      <div className="p-3 space-y-2">
        {bar("55%","h-2","bg-foreground/45")}
        <div className="grid grid-cols-3 gap-1">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="rounded border border-border/50 bg-secondary/10 p-1.5 space-y-1">
              <div className="w-4 h-4 rounded bg-primary/20" />
              {bar("90%","h-1","bg-foreground/35")}
              {bar("75%","h-1","bg-foreground/20")}
            </div>
          ))}
        </div>
      </div>
    )
    case "testimonials": return (
      <div className="p-3 space-y-1.5">
        {bar("50%","h-2","bg-foreground/45")}
        <div className="grid grid-cols-3 gap-1">
          {[1,2,3].map(i => (
            <div key={i} className="rounded border border-border/50 bg-secondary/10 p-1.5 space-y-1">
              <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <div key={s} className="w-1.5 h-1.5 rounded-sm bg-primary/40" />)}</div>
              {bar("100%","h-1","bg-foreground/20")}
              {bar("80%","h-1","bg-foreground/15")}
            </div>
          ))}
        </div>
      </div>
    )
    case "pricing": return (
      <div className="p-3 space-y-2">
        {bar("40%","h-2","bg-foreground/45")}
        <div className="grid grid-cols-3 gap-1">
          {[1,2,3].map(i => (
            <div key={i} className={`rounded border p-1.5 space-y-1 ${i===2?"border-primary/50 bg-primary/5":"border-border/50 bg-secondary/10"}`}>
              {bar("70%","h-1.5","bg-foreground/40")}
              {bar("50%","h-1","bg-foreground/25")}
              {[1,2].map(j => <div key={j} className="flex gap-1 items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500/40" />{bar("80%","h-1","bg-foreground/20")}</div>)}
              <div className="h-3 w-full rounded" style={{ background: i===2?"rgba(232,57,42,0.5)":"rgba(255,255,255,0.08)" }} />
            </div>
          ))}
        </div>
      </div>
    )
    case "cta": return (
      <div className="m-2 p-3 text-center space-y-1.5 bg-primary/5 border border-primary/15 rounded-xl">
        {data.titulo && <div className="text-[9px] font-bold text-foreground/70 truncate">{data.titulo}</div>}
        {bar("75%","h-1","bg-foreground/20")}
        <div className="flex gap-1.5 justify-center pt-1">
          <div className="h-4 w-16 rounded bg-primary/60" />
          <div className="h-4 w-12 rounded bg-secondary/50 border border-border" />
        </div>
      </div>
    )
    case "imageText": return (
      <div className="p-3 grid grid-cols-2 gap-2 items-center">
        <div className="rounded-lg bg-secondary/20 border border-border/40 flex items-center justify-center" style={{ height: 56 }}>
          <ImageIcon className="w-5 h-5 text-muted-foreground/25" />
        </div>
        <div className="space-y-1.5">
          {data.titulo && <div className="text-[9px] font-bold text-foreground/70 truncate">{data.titulo}</div>}
          {bar("90%","h-1","bg-foreground/20")}
          {[0,1].map(i => <div key={i} className="flex gap-1 items-center"><div className="w-1.5 h-1.5 rounded-full bg-green-500/35" />{bar("78%","h-1","bg-foreground/18")}</div>)}
        </div>
      </div>
    )
    case "video": return (
      <div className="p-3 space-y-1.5">
        {data.titulo && <div className="text-[9px] font-bold text-foreground/70 truncate text-center">{data.titulo}</div>}
        <div className="rounded-lg bg-secondary/20 border border-border/40 flex items-center justify-center" style={{ height: 52 }}>
          <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
            <Play className="w-4 h-4 text-primary/50" />
          </div>
        </div>
      </div>
    )
    case "faq": return (
      <div className="p-3 space-y-1.5">
        {data.titulo && <div className="text-[9px] font-bold text-foreground/70 truncate text-center mb-1">{data.titulo}</div>}
        {[1,2,3].map(i => (
          <div key={i} className="flex items-center justify-between rounded border border-border/40 bg-secondary/10 px-2 py-1">
            {bar("65%","h-1","bg-foreground/30")}
            <ChevronDown className="w-2.5 h-2.5 text-muted-foreground/35 flex-shrink-0 ml-1" />
          </div>
        ))}
      </div>
    )
    case "textBanner": return (
      <div className="p-4 text-center space-y-1.5">
        {data.subtitulo && <div className="text-[8px] text-primary/60 font-bold uppercase tracking-wider">{data.subtitulo}</div>}
        {data.titulo && <div className="text-[10px] font-bold text-foreground/70 truncate">{data.titulo}</div>}
        {bar("80%","h-1","bg-foreground/18")}
        {data.ctaLabel && <div className="h-4 w-16 rounded bg-primary/50 mx-auto mt-1" />}
      </div>
    )
    case "gallery": {
      const imgs = (data.images || []).slice(0, 4)
      const cols = Math.min(data.columns || 3, 4)
      return (
        <div className="p-2">
          <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
            {Array.from({ length: cols }).map((_, i) => (
              <div key={i} className="aspect-square rounded overflow-hidden border border-border/40">
                {imgs[i]?.url
                  ? <img src={imgs[i].url} alt="" className="w-full h-full object-cover" />
                  : <div className="w-full h-full bg-secondary/20 flex items-center justify-center"><FileImage className="w-3 h-3 text-muted-foreground/25" /></div>
                }
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "stats": {
      const items = (data.items || []).slice(0, 4)
      return (
        <div className="p-3">
          {data.titulo && <div className="text-[9px] font-bold text-foreground/70 truncate text-center mb-2">{data.titulo}</div>}
          <div className="grid grid-cols-4 gap-1">
            {(items.length ? items : [{ numero: "15K+" }, { numero: "98%" }, { numero: "24/7" }, { numero: "4.9" }]).slice(0,4).map((s: any, i: number) => (
              <div key={i} className="text-center space-y-0.5">
                <div className="mx-auto h-5 w-5 rounded-lg bg-primary/12" />
                {s.numero && <div className="text-[9px] font-bold text-foreground/55">{s.numero}</div>}
                {!s.numero && bar("100%","h-2","bg-foreground/25")}
              </div>
            ))}
          </div>
        </div>
      )
    }
    case "customCode": return (
      <div className="p-3 space-y-1">
        {data.nota && <div className="text-[8px] text-muted-foreground truncate">{data.nota}</div>}
        <div className="rounded bg-[#0d1117] border border-border/30 p-2 space-y-1">
          {bar("55%","h-1","bg-green-400/35")}
          {bar("75%","h-1","bg-blue-400/25")}
          {bar("35%","h-1","bg-green-400/25")}
        </div>
      </div>
    )
    case "contact": return (
      <div className="p-3 space-y-1.5">
        {bar("45%","h-2","bg-foreground/40")}
        {[1,2,3].map(i => <div key={i} className="h-5 w-full rounded border border-border/40 bg-secondary/10" />)}
        <div className="h-5 w-20 rounded bg-primary/55" />
      </div>
    )
    default: return (
      <div className="p-4 space-y-2 opacity-40">
        {bar("60%","h-2","bg-foreground/40")}
        {bar("100%","h-1","bg-foreground/20")}
        {bar("80%","h-1","bg-foreground/20")}
      </div>
    )
  }
}

// â”€â”€â”€ Section canvas card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function SectionCard({
  section, isSelected, idx, total,
  onSelect, onMoveUp, onMoveDown, onToggle, onDelete, onDuplicate,
}: {
  section: CMSSection; isSelected: boolean; idx: number; total: number
  onSelect: () => void; onMoveUp: () => void; onMoveDown: () => void
  onToggle: () => void; onDelete: () => void; onDuplicate?: () => void
}) {
  const meta = getStudioSectionMeta(section.type)
  const Icon = meta?.icon ?? LayoutTemplate
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all select-none",
        isSelected
          ? "border-primary shadow-[0_0_0_3px_rgba(232,57,42,0.15),0_4px_20px_rgba(0,0,0,0.15)]"
          : "border-border/60 hover:border-primary/40 hover:shadow-md",
        !section.visible && "opacity-50"
      )}
    >
      {/* Mini preview */}
      <div className="bg-card relative min-h-[80px]">
        <SectionMiniPreview section={section} />
        {/* Hover overlay */}
        <div className={cn(
          "absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-all",
          isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}>
          <span className="flex items-center gap-1.5 text-xs font-bold text-white bg-primary px-3 py-1.5 rounded-full shadow-lg">
            <Pencil className="w-3 h-3" />Editar bloque
          </span>
        </div>
      </div>
      {/* Controls bar */}
      <div className={cn(
        "flex items-center gap-1 px-3 py-2 border-t transition-colors",
        isSelected ? "bg-primary/8 border-primary/20" : "bg-card border-border/60"
      )}>
        <div className={cn("w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0", meta?.color ?? "bg-secondary text-muted-foreground")}>
          <Icon className="w-3 h-3" />
        </div>
        <span className={cn("flex-1 text-xs font-medium truncate", isSelected ? "text-foreground" : "text-muted-foreground")}>
          {meta?.label ?? section.type}
        </span>
        <div className={cn("flex items-center gap-0.5 transition-opacity", isSelected ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
          <button onClick={e => { e.stopPropagation(); onMoveUp() }} disabled={idx === 0}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 transition-all">
            <ArrowUp className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onMoveDown() }} disabled={idx === total - 1}
            className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-25 transition-all">
            <ArrowDown className="w-3 h-3" />
          </button>
          <button onClick={e => { e.stopPropagation(); onToggle() }}
            className={cn("w-6 h-6 flex items-center justify-center rounded transition-all", section.visible ? "text-emerald-400 hover:bg-emerald-400/10" : "text-muted-foreground/35 hover:bg-secondary")}>
            {section.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
          </button>
          {onDuplicate && (
            <button onClick={e => { e.stopPropagation(); onDuplicate() }}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/60 hover:text-foreground hover:bg-secondary transition-all">
              <Copy className="w-3 h-3" />
            </button>
          )}
          {meta?.deletable && (
            <button onClick={e => { e.stopPropagation(); onDelete() }}
              className="w-6 h-6 flex items-center justify-center rounded text-muted-foreground/35 hover:text-red-400 hover:bg-red-400/10 transition-all">
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Section type meta â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const SM: Record<CMSSectionType, { label: string; icon: React.ElementType; color: string; deletable?: boolean; desc?: string }> = {
  hero:         { label: "Hero Principal",     icon: Sparkles,      color: "text-primary bg-primary/10",        deletable: true, desc: "Hero principal del sitio" },
  benefits:     { label: "Beneficios",         icon: Zap,           color: "text-amber-400 bg-amber-400/10",   deletable: true, desc: "Bloque de beneficios destacados" },
  testimonials: { label: "Testimonios",        icon: Star,          color: "text-blue-400 bg-blue-400/10",     deletable: true, desc: "Opiniones y prueba social" },
  pricing:      { label: "Precios",            icon: Tag,           color: "text-emerald-400 bg-emerald-400/10", deletable: true, desc: "Plantilla de planes y precios" },
  contact:      { label: "Contacto",           icon: Globe,         color: "text-violet-400 bg-violet-400/10", deletable: true, desc: "Plantilla de contacto o soporte" },
  cta:          { label: "CTA Banner",         icon: Zap,           color: "text-orange-400 bg-orange-400/10",  deletable: true, desc: "Llamada a la accion" },
  imageText:    { label: "Imagen + Texto",     icon: ImageIcon,     color: "text-cyan-400 bg-cyan-400/10",      deletable: true, desc: "Imagen con texto y bullets" },
  video:        { label: "Video",              icon: Video,         color: "text-pink-400 bg-pink-400/10",      deletable: true, desc: "YouTube o Vimeo embed" },
  faq:          { label: "Preguntas FAQ",      icon: MessageSquare, color: "text-teal-400 bg-teal-400/10",      deletable: true, desc: "Preguntas frecuentes" },
  textBanner:   { label: "Banner de Texto",    icon: Type,          color: "text-yellow-400 bg-yellow-400/10",  deletable: true, desc: "Titulo + texto + CTA" },
  gallery:      { label: "Galeria",            icon: ImageIcon,     color: "text-indigo-400 bg-indigo-400/10",  deletable: true, desc: "Cuadricula de imagenes" },
  stats:        { label: "Estadisticas",       icon: BarChart3,     color: "text-rose-400 bg-rose-400/10",      deletable: true, desc: "Numeros y metricas" },
  customCode:   { label: "Codigo HTML",        icon: Code2,         color: "text-green-400 bg-green-400/10",    deletable: true, desc: "HTML / iframes / widgets" },
  pageHero:     { label: "Hero de Pagina",     icon: Sparkles,      color: "text-primary bg-primary/10",        deletable: true, desc: "Hero con badge, titulo, CTA" },
  featureCards: { label: "Tarjetas",           icon: LayoutTemplate,color: "text-sky-400 bg-sky-400/10",        deletable: true, desc: "Grid universal de tarjetas editables" },
  simulatorsFeed:{ label: "Simuladores",       icon: Target,        color: "text-primary bg-primary/10",        deletable: true, desc: "Bloque conectado a simuladores publicados" },
  coursesFeed:  { label: "Cursos",             icon: GraduationCap, color: "text-indigo-400 bg-indigo-400/10",  deletable: true, desc: "Bloque conectado al catalogo de cursos" },
  evaluationsFeed:{ label: "Evaluaciones",     icon: ClipboardCheck,color: "text-amber-400 bg-amber-400/10",    deletable: true, desc: "Bloque conectado a evaluaciones activas" },
  formBuilder:  { label: "Formulario",         icon: FileText,      color: "text-emerald-400 bg-emerald-400/10",deletable: true, desc: "Formulario configurable desde el editor" },
  richText:     { label: "Contenido libre",    icon: TextCursorInput,color: "text-violet-400 bg-violet-400/10",  deletable: true, desc: "Texto, listas y botones en un bloque flexible" },
  logoStrip:    { label: "Logos / marcas",     icon: BadgePlus,     color: "text-cyan-400 bg-cyan-400/10",      deletable: true, desc: "Franja de logos, partners o herramientas" },
  spacer:       { label: "Espaciador",         icon: Minus,         color: "text-white/70 bg-white/5",           deletable: true, desc: "Bloque vacio para separar secciones" },
  embed:        { label: "Embed universal",    icon: Code2,         color: "text-fuchsia-400 bg-fuchsia-400/10", deletable: true, desc: "Mapas, calendarios, widgets o embeds" },
}

const LEGACY_SM: Record<string, { label: string; icon: React.ElementType; color: string; deletable?: boolean; desc?: string }> = {
  navbar:   { label: "Navegacion", icon: LayoutTemplate, color: "text-white/70 bg-white/5", deletable: true, desc: "Bloque legacy de navegacion" },
  footer:   { label: "Footer", icon: LayoutTemplate, color: "text-white/70 bg-white/5", deletable: true, desc: "Bloque legacy de footer" },
  html:     { label: "HTML", icon: Code2, color: "text-green-400 bg-green-400/10", deletable: true, desc: "Bloque legacy de HTML" },
  features: { label: "Features", icon: BookOpen, color: "text-sky-400 bg-sky-400/10", deletable: true, desc: "Bloque legacy de features" },
}

function formatStudioSectionLabel(type: string) {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getStudioSectionMeta(type: string) {
  return (
    SM[type as CMSSectionType] ??
    LEGACY_SM[type] ??
    {
      label: formatStudioSectionLabel(type || "bloque"),
      icon: LayoutTemplate,
      color: "text-white/70 bg-white/5",
      deletable: true,
      desc: "Bloque no registrado en la biblioteca actual",
    }
  )
}

function getLibraryCapabilities(type: CMSSectionType) {
  switch (type) {
    case "richText":
      return {
        tags: ["Flexible", "Texto", "CTA"],
        tools: ["Titulos y parrafos", "Listas y botones", "Ajuste editorial"],
        bestFor: ["Secciones editoriales", "Propuestas de valor", "Bloques personalizados"],
        outcome: "Ideal para construir secciones libres con texto, listas y botones sin depender de una plantilla fija.",
      }
    case "featureCards":
      return {
        tags: ["Grid", "Editable", "Cards"],
        tools: ["Tarjetas repetibles", "Columnas rapidas", "Iconos y acentos"],
        bestFor: ["Servicios", "Beneficios", "Pasos del proceso"],
        outcome: "Crea grids ordenados con tarjetas editables y consistentes en desktop, tablet y mobile.",
      }
    case "logoStrip":
      return {
        tags: ["Marcas", "Confianza", "Logos"],
        tools: ["Partners", "Instituciones", "Herramientas"],
        bestFor: ["Partners", "Instituciones", "Tecnologias usadas"],
        outcome: "Sirve para reforzar confianza con logos, marcas aliadas o herramientas integradas.",
      }
    case "spacer":
      return {
        tags: ["Layout", "Ritmo", "Espacio"],
        tools: ["Separacion vertical", "Respira el diseño", "Ajuste de altura"],
        bestFor: ["Separar secciones", "Dar aire", "Ajustar ritmo visual"],
        outcome: "Mantiene orden visual entre bloques sin meter contenido innecesario.",
      }
    case "hero":
    case "pageHero":
      return {
        tags: ["Impacto", "CTA", "Hero"],
        tools: ["Badge y titulo", "Botones conectables", "Panel visual"],
        bestFor: ["Portadas", "Encabezados", "Landing principal"],
        outcome: "Bloque de impacto para abrir la pagina con mensaje fuerte y llamadas a la accion.",
      }
    case "cta":
      return {
        tags: ["Conversion", "Registro", "CTA"],
        tools: ["Cierre de seccion", "Boton primario", "Boton secundario"],
        bestFor: ["Captacion", "Cierre de venta", "Registro rapido"],
        outcome: "Refuerza conversion con una llamada final clara y lista para conectar a acciones.",
      }
    case "formBuilder":
      return {
        tags: ["Leads", "Form", "Envio"],
        tools: ["Campos configurables", "Accion al enviar", "Mensajes de exito"],
        bestFor: ["Leads", "Inscripciones", "Contacto"],
        outcome: "Formulario listo para captar registros con campos, validacion y accion configurable.",
      }
    case "imageText":
      return {
        tags: ["Media", "Story", "Bullets"],
        tools: ["Imagen + copy", "CTA", "Lista destacada"],
        bestFor: ["Casos de uso", "Explicacion visual", "Secciones mixtas"],
        outcome: "Equilibra imagen y texto en un layout estable para mostrar propuesta y beneficios.",
      }
    case "video":
      return {
        tags: ["Media", "Demo", "Embed"],
        tools: ["Video principal", "Texto de apoyo", "Bloque demostrativo"],
        bestFor: ["Demos", "Presentaciones", "Clases introductorias"],
        outcome: "Aterriza una demostracion o video explicativo con soporte visual alrededor.",
      }
    case "gallery":
      return {
        tags: ["Media", "Grid", "Galeria"],
        tools: ["Multiples imagenes", "Columnas", "Presentacion visual"],
        bestFor: ["Capturas", "Evidencias", "Material promocional"],
        outcome: "Organiza imagenes o capturas en una cuadricula limpia y facil de mantener.",
      }
    case "embed":
      return {
        tags: ["Embed", "Widget", "Externo"],
        tools: ["Mapas o calendarios", "Dashboards", "Widgets externos"],
        bestFor: ["Canva", "Calendarios", "Mapas o dashboards"],
        outcome: "Inserta contenido externo sin romper la estructura visual del Studio.",
      }
    case "benefits":
    case "stats":
    case "faq":
    case "testimonials":
      return {
        tags: ["Confianza", "Prueba", "Soporte"],
        tools: ["Reforzar valor", "Prueba social", "Objeciones y metricas"],
        bestFor: ["Objeciones", "Metricas", "Prueba social"],
        outcome: "Bloques pensados para reforzar confianza y convertir mejor antes del CTA.",
      }
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return {
        tags: ["Dinamico", "Admin", "Feed"],
        tools: ["Datos publicados", "Bloque conectado", "CTA automatizable"],
        bestFor: ["Catalogos", "Bloques conectados", "Contenido vivo"],
        outcome: "Trae informacion publicada desde el admin para mantener la pagina siempre actualizada.",
      }
    default:
      return {
        tags: ["Bloque", "Sistema", "Editable"],
        tools: ["Contenido base", "Ajustes visuales", "Uso en landing"],
        bestFor: ["Secciones base", "Paginas de apoyo", "Construccion rapida"],
        outcome: "Bloque adaptable para cubrir necesidades generales dentro del builder.",
      }
  }
}

const ADDABLE: CMSSectionType[] = ["hero", "pageHero", "richText", "featureCards", "logoStrip", "spacer", "benefits", "testimonials", "pricing", "contact", "simulatorsFeed", "coursesFeed", "evaluationsFeed", "formBuilder", "cta", "textBanner", "imageText", "video", "gallery", "stats", "faq", "embed"]
const ADDABLE_PAGE: CMSSectionType[] = ["pageHero", "richText", "featureCards", "logoStrip", "spacer", "benefits", "testimonials", "pricing", "contact", "simulatorsFeed", "coursesFeed", "evaluationsFeed", "formBuilder", "cta", "textBanner", "imageText", "video", "gallery", "stats", "faq", "embed"]

const DEFAULTS: Record<string, Record<string, any>> = {
  cta:        { titulo: "Comienza hoy", descripcion: "Unete a miles de docentes.", ctaPrimario: "Crear cuenta gratis", ctaPrimarioHref: "/registro", ctaSecundario: "Ver planes", ctaSecundarioHref: "#precios", primaryAction: { type: "page", href: "/registro" }, secondaryAction: { type: "section", sectionId: "pricing" } },
  textBanner: { subtitulo: "", titulo: "Tu titulo aqui", descripcion: "", ctaLabel: "", ctaHref: "/registro", ctaAction: { type: "page", href: "/registro" }, alignment: "center" },
  imageText:  { titulo: "La mejor preparacion", descripcion: "Descripcion del bloque.", bullets: ["Primer punto", "Segundo punto"], imageUrl: "", imagePosition: "right", ctaLabel: "Conocer mas", ctaHref: "/registro", ctaAction: { type: "page", href: "/registro" } },
  video:      { titulo: "Conoce la plataforma", descripcion: "Descripcion del video.", videoUrl: "" },
  gallery:    { titulo: "", descripcion: "", columns: 3, images: [] },
  stats:      { titulo: "", items: [{ id: "s1", numero: "15,000+", label: "Docentes activos", icono: "ðŸ‘¨â€ðŸ«" }, { id: "s2", numero: "98%", label: "Aprobacion", icono: "ðŸ†" }] },
  faq:        { titulo: "Preguntas frecuentes", descripcion: "Todo lo que necesitas saber.", items: [{ id: "f1", pregunta: "Â¿Como funciona?", respuesta: "Hack Evans es la plataforma de preparacion docente #1 en Ecuador." }] },
  customCode:   { nota: "", html: "", importMode: "adapted", stripNavigation: true, stripFooter: true, actionBindings: [], themeOverrides: { accentColor: "#E8392A" } },
  richText:   { eyebrow: "Contenido flexible", titulo: "Construye cualquier seccion", descripcion: "Usa este bloque para titulares, descripcion, listas, llamados a la accion y contenido editorial sin tocar codigo.", body: "", bullets: ["Punto clave", "Resultado esperado"], alignment: "left", maxWidth: "lg", primaryLabel: "Accion principal", primaryHref: "/registro", secondaryLabel: "Accion secundaria", secondaryHref: "/simulador", primaryAction: { type: "page", href: "/registro" }, secondaryAction: { type: "page", href: "/simulador" } },
  logoStrip:  { eyebrow: "Confianza", titulo: "Marcas, aliados o herramientas", descripcion: "Muestra clientes, partners, instituciones o tecnologias usadas en tu flujo.", columns: 4, items: [{ id: `lg_${Date.now()}_1`, label: "Logo 1", subLabel: "Partner", imageUrl: "", href: "" }, { id: `lg_${Date.now()}_2`, label: "Logo 2", subLabel: "Cliente", imageUrl: "", href: "" }, { id: `lg_${Date.now()}_3`, label: "Logo 3", subLabel: "Institucion", imageUrl: "", href: "" }, { id: `lg_${Date.now()}_4`, label: "Logo 4", subLabel: "Herramienta", imageUrl: "", href: "" }] },
  spacer:     { height: 96 },
  embed:      { titulo: "Embed universal", descripcion: "Inserta mapas, calendarios, formularios, dashboards o cualquier widget embebible.", mode: "url", url: "", html: "", height: 460 },
  pageHero:     { badge: "PAGINA", badgeEmoji: "â­", accentColor: "#E8392A", layout: "center", titulo: "Titulo de la pagina", subtitulo: "", descripcion: "Descripcion de la pagina.", features: [], ctaPrimario: "Comenzar Ahora", ctaSecundario: "Saber mas", primaryAction: { type: "page", href: "/registro" }, secondaryAction: { type: "page", href: "/simulador" }, rightPanel: "none", stats: [], statsTitle: "" },
  featureCards: { titulo: "", descripcion: "", columns: 3, items: [{ id: `fc_${Date.now()}`, emoji: "â­", title: "Nueva tarjeta", description: "Descripcion de la tarjeta.", accentColor: "#E8392A" }] },
  simulatorsFeed: { badge: "Simuladores", titulo: "Simuladores destacados", descripcion: "Conecta este bloque a simuladores publicados desde el admin.", ctaLabel: "Ver simuladores", ctaHref: "/dashboard/simuladores", ctaAction: { type: "page", href: "/dashboard/simuladores" } },
  coursesFeed: { badge: "Cursos", titulo: "Cursos destacados", descripcion: "Muestra cursos publicados sin tocar codigo.", ctaLabel: "Explorar cursos", ctaHref: "/dashboard/cursos", ctaAction: { type: "page", href: "/dashboard/cursos" } },
  evaluationsFeed: { badge: "Evaluaciones", titulo: "Evaluaciones activas", descripcion: "Expone evaluaciones y diagnosticos conectados desde el panel.", ctaLabel: "Ver evaluaciones", ctaHref: "/dashboard/evaluaciones", ctaAction: { type: "page", href: "/dashboard/evaluaciones" } },
  formBuilder: {
    badge: "Formulario",
    titulo: "Formulario personalizado",
    descripcion: "Crea un formulario desde el admin y conéctalo con tu landing.",
    submitLabel: "Enviar",
    successTitle: "Formulario enviado",
    successMessage: "Recibimos tu informacion correctamente.",
    submitAction: { type: "none" },
    bullets: ["Campos configurables", "Sin tocar codigo", "Listo para captar registros"],
    fields: [
      { id: `fld_${Date.now()}_1`, type: "text", label: "Nombre completo", placeholder: "Escribe tu nombre", required: true, width: "half" },
      { id: `fld_${Date.now()}_2`, type: "email", label: "Correo", placeholder: "correo@dominio.com", required: true, width: "half" },
      { id: `fld_${Date.now()}_3`, type: "textarea", label: "Mensaje", placeholder: "Cuéntanos que necesitas", required: false, width: "full" },
    ],
  },
}

// â”€â”€â”€ Section content editor dispatcher â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function getStudioSectionContent(section: CMSSection, config: CMSConfig): {
  eyebrow: string
  title: string
  description: string
  chips: string[]
} {
  const data = section.data ?? {}
  switch (section.type) {
    case "hero":
      return {
        eyebrow: config.hero.badge,
        title: config.hero.titulo,
        description: config.hero.descripcion,
        chips: config.hero.features?.slice(0, 3) ?? [],
      }
    case "benefits":
      return {
        eyebrow: config.benefits.sectionLabel,
        title: config.benefits.titulo,
        description: config.benefits.descripcion,
        chips: config.benefits.items?.slice(0, 3).map((item) => item.title) ?? [],
      }
    case "testimonials":
      return {
        eyebrow: "Testimonios",
        title: config.testimonials.titulo,
        description: config.testimonials.descripcion,
        chips: config.testimonials.items?.slice(0, 3).map((item) => item.nombre) ?? [],
      }
    case "pricing":
      return {
        eyebrow: "Planes",
        title: "Seccion de precios",
        description: "Muestra planes, beneficios y CTA comerciales.",
        chips: ["Planes", "Suscripcion", "Conversion"],
      }
    case "contact":
      return {
        eyebrow: "Contacto",
        title: "Formulario de contacto",
        description: "Captura leads y mensajes desde la landing.",
        chips: ["Formulario", "WhatsApp", "Email"],
      }
    case "pageHero":
      return {
        eyebrow: data.badge || "Hero",
        title: data.titulo || "Titulo de la pagina",
        description: data.descripcion || "Describe el objetivo principal de esta pagina.",
        chips: data.features?.slice(0, 3) ?? [data.ctaPrimario, data.ctaSecundario].filter(Boolean),
      }
    case "featureCards":
      return {
        eyebrow: "Tarjetas",
        title: data.titulo || "Bloque de tarjetas",
        description: data.descripcion || "Presenta beneficios, modulos o servicios en columnas.",
        chips: data.items?.slice(0, 3).map((item: { title?: string }) => item.title || "Item") ?? [],
      }
    case "richText":
      return {
        eyebrow: data.eyebrow || "Contenido",
        title: data.titulo || "Bloque de contenido flexible",
        description: data.descripcion || "Combina titulo, texto, bullets y botones en una seccion libre.",
        chips: [data.primaryLabel, data.secondaryLabel, ...(data.bullets?.slice(0, 2) ?? [])].filter(Boolean),
      }
    case "logoStrip":
      return {
        eyebrow: data.eyebrow || "Logos",
        title: data.titulo || "Franja de marcas",
        description: data.descripcion || "Muestra aliados, instituciones, partners o herramientas.",
        chips: data.items?.slice(0, 4).map((item: { label?: string }) => item.label || "Logo") ?? [],
      }
    case "spacer":
      return {
        eyebrow: "Layout",
        title: "Espaciador",
        description: `Separa bloques con ${data.height || 96}px de aire visual.`,
        chips: [`${data.height || 96}px`, "Estructura"],
      }
    case "embed":
      return {
        eyebrow: "Embed",
        title: data.titulo || "Integracion visual",
        description: data.descripcion || "Inserta mapas, dashboards, calendarios o widgets.",
        chips: [data.mode === "html" ? "HTML" : "URL", data.url ? "URL cargada" : "", data.html ? "Codigo cargado" : ""].filter(Boolean),
      }
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed": {
      const sourceMode = section.settings?.source?.mode === "manual" ? "Manual" : "Automatico"
      const limit = section.settings?.source?.limit || 3
      const collectionLabel = section.type === "simulatorsFeed"
        ? "Simuladores"
        : section.type === "coursesFeed"
          ? "Cursos"
          : "Evaluaciones"
      return {
        eyebrow: data.badge || collectionLabel,
        title: data.titulo || `${collectionLabel} destacados`,
        description: data.descripcion || `Bloque dinamico conectado al catalogo de ${collectionLabel.toLowerCase()}.`,
        chips: [sourceMode, `${limit} items`, section.settings?.source?.display === "carousel" ? "Carrusel" : "Grid"],
      }
    }
    case "formBuilder":
      return {
        eyebrow: data.badge || "Formulario",
        title: data.titulo || "Formulario personalizado",
        description: data.descripcion || "Captura registros con campos configurados desde el admin.",
        chips: (data.fields || []).slice(0, 3).map((field: { label?: string }) => field.label || "Campo"),
      }
    case "cta":
      return {
        eyebrow: "CTA",
        title: data.titulo || "Llamado a la accion",
        description: data.descripcion || "Usa este bloque para cerrar la pagina con una accion clara.",
        chips: [data.ctaPrimario, data.ctaSecundario].filter(Boolean),
      }
    case "imageText":
      return {
        eyebrow: "Imagen + texto",
        title: data.titulo || "Seccion visual",
        description: data.descripcion || "Combina una imagen con texto explicativo y bullets.",
        chips: data.bullets?.slice(0, 3) ?? [],
      }
    case "video":
      return {
        eyebrow: "Video",
        title: data.titulo || "Video principal",
        description: data.descripcion || "Inserta un video o enlace enriquecido.",
        chips: [data.videoUrl ? "URL cargada" : "Sin URL", "Embebido automatico"],
      }
    case "faq":
      return {
        eyebrow: "FAQ",
        title: data.titulo || "Preguntas frecuentes",
        description: data.descripcion || "Responde dudas clave antes de la conversion.",
        chips: data.items?.slice(0, 3).map((item: { pregunta?: string }) => item.pregunta || "Pregunta") ?? [],
      }
    case "textBanner":
      return {
        eyebrow: data.subtitulo || "Banner",
        title: data.titulo || "Titulo del banner",
        description: data.descripcion || "Mensaje corto con un CTA directo.",
        chips: [data.ctaLabel].filter(Boolean),
      }
    case "gallery":
      return {
        eyebrow: "Galeria",
        title: data.titulo || "Galeria visual",
        description: data.descripcion || "Muestra imagenes del producto, equipo o testimonios.",
        chips: [`${data.images?.length ?? 0} imagenes`, `${data.columns ?? 3} columnas`],
      }
    case "stats":
      return {
        eyebrow: "Estadisticas",
        title: data.titulo || "Metricas clave",
        description: "Refuerza credibilidad con cifras visibles.",
        chips: data.items?.slice(0, 3).map((item: { numero?: string; label?: string }) => `${item.numero || "0"} ${item.label || ""}`.trim()) ?? [],
      }
    case "customCode":
      return {
        eyebrow: data.importMode === "adapted" ? "HTML adaptado" : "HTML",
        title: data.importedTitle || data.nota || "Widget personalizado",
        description: "Bloque libre para HTML importado, widgets o integraciones externas.",
        chips: [
          data.importMode === "adapted" ? "Tema del sitio" : "",
          data.stripNavigation === true ? "Navbar del sitio" : "",
          data.html ? "Codigo cargado" : "Sin codigo",
        ].filter(Boolean),
      }
    default:
      return {
        eyebrow: "Bloque",
        title: "Bloque del sitio",
        description: "Configura contenido y estilo desde el panel derecho.",
        chips: [],
      }
  }
}

function getStudioSectionBg(section: CMSSection) {
  const bg = section.style?.bg
  if (!bg || bg === "transparent") return "linear-gradient(135deg, rgba(19,24,34,0.95), rgba(12,15,22,0.88))"
  if (bg === "dark") return "linear-gradient(135deg, rgba(24,31,44,0.96), rgba(17,23,34,0.92))"
  if (bg === "darkDeep") return "linear-gradient(135deg, rgba(8,11,15,0.98), rgba(18,23,34,0.96))"
  if (bg === "accent") return "linear-gradient(135deg, rgba(232,57,42,0.18), rgba(232,57,42,0.06))"
  return bg
}

function StudioViewport({
  title,
  route,
  sections,
  selectedId,
  onSelect,
  config,
  mode,
  zoomMode,
  onInlineUpdate,
  onDuplicate,
  onToggleVisibility,
  onMove,
  onDelete,
  onAddBlock,
  onReorder,
  previewMode,
  desktopWidth,
  htmlIframeRef,
  onHtmlElementSelect,
  onHtmlEditingChange,
  onHtmlSnapshot,
}: {
  title: string
  route: string
  sections: CMSSection[]
  selectedId: string
  onSelect: (id: string) => void
  config: CMSConfig
  mode: "desktop" | "tablet" | "mobile"
  zoomMode: "fit" | 100 | 75 | 50
  onInlineUpdate?: (sectionId: string, patch: Record<string, any>) => void
  onDuplicate?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onMove?: (id: string, direction: -1 | 1) => void
  onDelete?: (id: string) => void
  onAddBlock?: (index?: number) => void
  onReorder?: (sourceId: string, targetIndex: number) => void
  previewMode?: boolean
  desktopWidth?: 1440 | 1280
  htmlIframeRef?: React.MutableRefObject<HTMLIFrameElement | null>
  onHtmlElementSelect?: (info: EditorElementInfo | null) => void
  onHtmlEditingChange?: (editing: boolean) => void
  onHtmlSnapshot?: (html: string) => void
}) {
  const workspaceRef = useRef<HTMLDivElement>(null)
  const previewRef = useRef<HTMLDivElement>(null)
  const [fitScale, setFitScale] = useState(1)
  const [previewHeight, setPreviewHeight] = useState<number | null>(null)
  const [showGuide, setShowGuide] = useState(true)

  const viewportWidth =
    mode === "mobile"
      ? 390
      : mode === "tablet"
        ? 768
        : desktopWidth ?? 1440

  const isDesktop = mode === "desktop"
  const isTablet = mode === "tablet"
  const canvasShell = "min-h-0 overflow-visible rounded-[28px] border border-white/10 bg-[#07101a] shadow-[0_30px_90px_rgba(0,0,0,0.45)]"

  useEffect(() => {
    const updateScale = () => {
      const workspace = workspaceRef.current
      const preview = previewRef.current
      if (!workspace || !preview) return

      const style = window.getComputedStyle(workspace)
      const paddingX = (parseFloat(style.paddingLeft) || 0) + (parseFloat(style.paddingRight) || 0)
      const availableWidth = Math.max(workspace.clientWidth - paddingX, 320)
      const nextScale = Math.min(1, availableWidth / viewportWidth)
      const appliedScale = zoomMode === "fit" ? nextScale : Math.min(zoomMode / 100, nextScale)
      const nextHeight = preview.scrollHeight * nextScale

      setFitScale(nextScale)
      setPreviewHeight(Number.isFinite(preview.scrollHeight * appliedScale) ? preview.scrollHeight * appliedScale : null)
    }

    updateScale()

    const resizeObserver = new ResizeObserver(() => updateScale())
    if (workspaceRef.current) resizeObserver.observe(workspaceRef.current)
    if (previewRef.current) resizeObserver.observe(previewRef.current)

    window.addEventListener("resize", updateScale)
    return () => {
      resizeObserver.disconnect()
      window.removeEventListener("resize", updateScale)
    }
  }, [isDesktop, viewportWidth, mode, sections, selectedId, route, zoomMode])

  const appliedScale = zoomMode === "fit" ? fitScale : Math.min(zoomMode / 100, fitScale)
  const scaledViewportWidth = Math.max(220, Math.round(viewportWidth * appliedScale))
  const viewportFrameWidth = Math.min(viewportWidth + (isDesktop ? 168 : isTablet ? 96 : 56), 1720)
  const sitePreviewProps = {
    config,
    sections,
    selectedId,
    onSelect,
    onInlineUpdate,
    onDuplicate,
    onToggleVisibility,
    onMove,
    onDelete,
    onAddBlock,
    onReorder,
    previewMode,
    htmlIframeRef,
    onHtmlElementSelect,
    onHtmlEditingChange,
    onHtmlSnapshot,
  }

  useEffect(() => {
    if (typeof window === "undefined") return
    const stored = window.localStorage.getItem("he-studio-guide-dismissed")
    if (stored === "true") setShowGuide(false)
  }, [])

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#060b12]">
      <div
        ref={workspaceRef}
        data-he-studio-scroll-root="1"
        className={cn(
          "studio-scroll relative flex-1 min-h-0 overflow-y-scroll overscroll-contain bg-[#060b12]",
          mode === "desktop" ? "overflow-x-auto" : "overflow-x-hidden"
        )}
        style={{
          backgroundImage: [
            "linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px)",
            "linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px)",
            "radial-gradient(circle at 50% 0%, rgba(232,57,42,0.05) 0%, transparent 50%)",
          ].join(", "),
          backgroundSize: "24px 24px, 24px 24px, auto",
        }}
      >
        <div className="flex min-h-full items-start justify-center px-4 py-6 sm:px-5 md:px-6 xl:px-10 2xl:px-14">
          <div className="w-full" style={{ maxWidth: `${viewportFrameWidth}px` }}>
            <div className="mb-4 flex items-center justify-between gap-3 px-1">
              <div className="rounded-full border border-white/10 bg-[#08111b]/90 px-3 py-1.5 text-[11px] text-white/45">
                {previewMode ? "Preview" : "Canvas"} {title} · {mode} · {zoomMode === "fit" ? `Fit ${Math.round(fitScale * 100)}%` : `${zoomMode}%`}
              </div>
              <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-[#08111b]/90 px-3 py-1.5 text-[11px] text-white/45 xl:flex">
                {previewMode ? (
                  <span>Vista previa interactiva: prueba popups, scroll y formularios sin overlays.</span>
                ) : (
                  <>
                    <span>Click para seleccionar</span>
                    <span className="h-1 w-1 rounded-full bg-white/20" />
                    <span>Doble click para editar texto</span>
                  </>
                )}
              </div>
            </div>

            <div className="mx-auto w-fit max-w-full rounded-[38px] border border-white/6 bg-[#040912]/95 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.42)] xl:p-5">
              <div className="mb-3 flex items-center justify-between gap-3 rounded-[24px] border border-white/6 bg-[#07101a]/95 px-4 py-3">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Viewport</div>
                  <div className="mt-1 text-sm font-semibold text-white">{mode === "desktop" ? "Desktop" : mode === "tablet" ? "Tablet" : "Mobile"} · {viewportWidth}px</div>
                </div>
                <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-white/45">
                  {previewMode ? "Vista previa real" : "Página editable"}
                </div>
              </div>
              <div
                className="mx-auto"
                style={{
                  width: `${scaledViewportWidth}px`,
                  maxWidth: "100%",
                  height: previewHeight ?? undefined,
                }}
              >
              {showGuide && !previewMode && (
                <div className="mb-4 flex items-start justify-between gap-4 rounded-3xl border border-primary/20 bg-[#09111b]/92 px-4 py-3 shadow-[0_18px_50px_rgba(0,0,0,0.35)]">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Guia rapida</div>
                    <div className="mt-2 grid gap-2 text-sm text-white/72 md:grid-cols-3">
                      <div><span className="font-semibold text-white">1.</span> Usa `+ Agregar bloque` para insertar donde quieras.</div>
                      <div><span className="font-semibold text-white">2.</span> Haz click en un bloque y luego click en el texto para editar directo.</div>
                      <div><span className="font-semibold text-white">3.</span> Arrastra un bloque desde su borde para cambiar el orden.</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGuide(false)
                      if (typeof window !== "undefined") {
                        window.localStorage.setItem("he-studio-guide-dismissed", "true")
                      }
                    }}
                    className="inline-flex h-9 items-center rounded-xl border border-white/10 px-3 text-xs font-medium text-white/55 transition-all hover:border-white/20 hover:text-white"
                  >
                    Ocultar
                  </button>
                </div>
              )}
                <div
                  ref={previewRef}
                  className="origin-top transition-transform duration-200 overflow-x-hidden"
                  style={{
                    width: `${viewportWidth}px`,
                    transform: `scale(${appliedScale})`,
                    transformOrigin: "top left",
                  }}
                >
                {isDesktop ? (
                  <div className={cn("flex flex-col", canvasShell)}>
                    <div className="flex items-center gap-2 border-b border-white/5 bg-[#07101a] px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <div className="mx-3 flex-1">
                        <div className="mx-auto flex h-6 max-w-[280px] items-center justify-center gap-1.5 rounded-md border border-white/8 bg-white/6 px-3">
                          <div className="h-3 w-3 text-white/30"><Globe className="h-full w-full" /></div>
                          <span className="truncate font-mono text-[10px] text-white/35">hackevans.ec{route === "/" ? "" : route}</span>
                        </div>
                      </div>
                      <a href={route} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-white/30 transition-colors hover:text-white/60">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                    <div className="flex-1">
                      <StudioSitePreview {...sitePreviewProps} />
                    </div>
                  </div>
                ) : isTablet ? (
                  <div className={cn(canvasShell, "overflow-hidden")}>
                    <div className="flex items-center gap-2 border-b border-white/8 bg-[#07101a] px-4 py-2">
                      <div className="flex items-center gap-1.5">
                        <div className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
                        <div className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
                      </div>
                      <div className="mx-3 flex-1">
                        <div className="mx-auto flex h-6 max-w-[320px] items-center justify-center gap-1.5 rounded-md border border-white/8 bg-white/6 px-3">
                          <Globe className="h-3 w-3 text-white/30" />
                          <span className="truncate font-mono text-[10px] text-white/35">hackevans.ec{route === "/" ? "" : route}</span>
                        </div>
                      </div>
                    </div>
                    <StudioPreviewFrame className="w-full">
                      <StudioSitePreview {...sitePreviewProps} />
                    </StudioPreviewFrame>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex items-center justify-center rounded-t-[32px] border border-white/10 border-b-0 bg-[#0d1620] py-2">
                      <div className="flex h-5 w-24 items-center justify-center gap-2 rounded-full bg-white/8">
                        <div className="h-1.5 w-1.5 rounded-full bg-white/20" />
                        <div className="h-1.5 w-6 rounded-sm bg-white/15" />
                      </div>
                    </div>
                    <div className={cn("overflow-hidden rounded-b-[32px] border border-white/10 border-t-0 shadow-[0_32px_80px_rgba(0,0,0,0.7)]", canvasShell)}>
                      <StudioPreviewFrame className="w-full">
                        <StudioSitePreview {...sitePreviewProps} />
                      </StudioPreviewFrame>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
function duplicateCMSSection(section: CMSSection): CMSSection {
  return {
    ...section,
    id: `${section.type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    data: JSON.parse(JSON.stringify(section.data ?? {})),
    style: section.style ? { ...section.style } : undefined,
    settings: section.settings ? JSON.parse(JSON.stringify(section.settings)) : undefined,
  }
}
function SectionContentEditor({
  section,
  config,
  onChange,
  onUpdateSettings,
}: {
  section: CMSSection
  config: CMSConfig
  onChange: (c: CMSConfig) => void
  onUpdateSettings: (settings: CMSSectionSettings) => void
}) {
  const upd = (data: Record<string, any>) => onChange({ ...config, sections: config.sections.map(s => s.id === section.id ? { ...s, data } : s) })
  switch (section.type) {
    case "hero":         return <HeroEditor config={config} onChange={onChange} />
    case "benefits":     return <BenefitsEditor config={config} onChange={onChange} />
    case "testimonials": return <TestimonialsEditor config={config} onChange={onChange} />
    case "cta":          return <CTAEditor data={section.data} onChange={upd} />
    case "imageText":    return <ImageTextEditor data={section.data} onChange={upd} />
    case "video":        return <VideoEditor data={section.data} onChange={upd} />
    case "faq":          return <FAQEditor data={section.data} onChange={upd} />
    case "textBanner":   return <TextBannerEditor data={section.data} onChange={upd} />
    case "gallery":      return <GalleryEditor data={section.data} onChange={upd} />
    case "stats":        return <StatsEditor data={section.data} onChange={upd} />
    case "customCode":   return <CustomCodeEditor data={section.data} onChange={upd} />
    case "richText":     return <RichTextEditor data={section.data} onChange={upd} />
    case "logoStrip":    return <LogoStripEditor data={section.data} onChange={upd} />
    case "spacer":       return <SpacerEditor data={section.data} onChange={upd} />
    case "embed":        return <EmbedEditor data={section.data} onChange={upd} />
    case "formBuilder":  return <FormBuilderEditor data={section.data} onChange={upd} />
    case "pageHero":     return <PageHeroEditor data={section.data} onChange={upd} />
    case "featureCards": return <FeatureCardsEditor data={section.data} onChange={upd} />
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return <CollectionFeedEditor section={section} onDataChange={upd} onSettingsChange={onUpdateSettings} />
    case "pricing": case "contact":
      return (
        <div className="p-8 text-center">
          <div className="text-4xl mb-3">{section.type === "pricing" ? "ðŸ’°" : "ðŸ“§"}</div>
          <h3 className="font-semibold text-foreground mb-2">Modulo {section.type === "pricing" ? "de Precios" : "de Contacto"}</h3>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto">Este modulo se muestra automaticamente. Usa el toggle de visibilidad para mostrarlo u ocultarlo.</p>
        </div>
      )
    default: return null
  }
}

// Editor dispatcher for page sections (all data-based, no config top-level fields)
function PageSectionContentEditor({
  section,
  onChange,
  onUpdateSettings,
}: {
  section: CMSSection
  onChange: (data: Record<string, any>) => void
  onUpdateSettings: (settings: CMSSectionSettings) => void
}) {
  switch (section.type) {
    case "pageHero":     return <PageHeroEditor data={section.data} onChange={onChange} />
    case "featureCards": return <FeatureCardsEditor data={section.data} onChange={onChange} />
    case "cta":          return <CTAEditor data={section.data} onChange={onChange} />
    case "imageText":    return <ImageTextEditor data={section.data} onChange={onChange} />
    case "video":        return <VideoEditor data={section.data} onChange={onChange} />
    case "faq":          return <FAQEditor data={section.data} onChange={onChange} />
    case "textBanner":   return <TextBannerEditor data={section.data} onChange={onChange} />
    case "gallery":      return <GalleryEditor data={section.data} onChange={onChange} />
    case "stats":        return <StatsEditor data={section.data} onChange={onChange} />
    case "customCode":   return <CustomCodeEditor data={section.data} onChange={onChange} />
    case "richText":     return <RichTextEditor data={section.data} onChange={onChange} />
    case "logoStrip":    return <LogoStripEditor data={section.data} onChange={onChange} />
    case "spacer":       return <SpacerEditor data={section.data} onChange={onChange} />
    case "embed":        return <EmbedEditor data={section.data} onChange={onChange} />
    case "formBuilder":  return <FormBuilderEditor data={section.data} onChange={onChange} />
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return <CollectionFeedEditor section={section} onDataChange={onChange} onSettingsChange={onUpdateSettings} />
    default: return (
      <div className="p-8 text-center text-muted-foreground text-sm">
        Selecciona un bloque para editarlo
      </div>
    )
  }
}

// â”€â”€â”€ Add Section Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function AddModal({
  onAdd,
  onClose,
  pageMode,
}: {
  onAdd: (type: CMSSectionType) => void
  onClose: () => void
  pageMode?: boolean
}) {
  const list = pageMode ? ADDABLE_PAGE : ADDABLE
  const [hovered, setHovered] = useState<CMSSectionType | null>(null)
  const [detailsType, setDetailsType] = useState<CMSSectionType | null>(null)
  const [search, setSearch] = useState("")
  const [groupFilter, setGroupFilter] = useState<string>("all")
  const handleAdd = (type: CMSSectionType) => {
    onAdd(type)
    onClose()
  }

  const groups = STUDIO_BLOCK_GROUPS
    .map((group) => ({
      ...group,
      types: group.types.filter((type) => list.includes(type)),
    }))
    .filter((group) => group.types.length > 0)

  const visibleTypes = groups
    .flatMap((group) => group.types)
    .filter((type, index, array) => array.indexOf(type) === index)
    .filter((type) => {
      if (groupFilter !== "all" && !groups.find((group) => group.id === groupFilter)?.types.includes(type)) {
        return false
      }
      if (!search.trim()) return true
      const meta = getStudioSectionMeta(type)
      const haystack = `${meta.label} ${meta.desc ?? ""}`.toLowerCase()
      return haystack.includes(search.trim().toLowerCase())
    })

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-3" onClick={onClose}>
      <div className="flex h-[min(92vh,980px)] w-full max-w-[min(1440px,calc(100vw-24px))] flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-secondary/10">
          <div>
            <div className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">Biblioteca de bloques</div>
            <div className="font-semibold text-foreground">Combina bloques base, plantillas y bloques dinamicos para crear cualquier pagina</div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="border-b border-border bg-secondary/5 px-5 py-4">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
            <input
              className={iCls}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar bloque, patron o integracion..."
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setGroupFilter("all")}
                className={cn(
                  "h-10 rounded-xl border px-4 text-xs font-semibold transition-all",
                  groupFilter === "all" ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/10 text-muted-foreground hover:border-primary/30"
                )}
              >
                Todo
              </button>
              {groups.map((group) => (
                <button
                  key={group.id}
                  type="button"
                  onClick={() => setGroupFilter(group.id)}
                  className={cn(
                    "h-10 rounded-xl border px-4 text-xs font-semibold transition-all",
                    groupFilter === group.id ? "border-primary bg-primary/10 text-primary" : "border-border bg-secondary/10 text-muted-foreground hover:border-primary/30"
                  )}
                >
                  {group.label}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-3 text-xs leading-5 text-muted-foreground">
            Inspirado en el patron de editores visuales como Wix Studio, Webflow, Framer y Fluid Engine: mezcla elementos base, secciones listas y bloques conectados a datos.
          </div>
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto p-4">
          <div className="space-y-5">
            {visibleTypes.length === 0 ? (
              <div className="flex min-h-[320px] flex-col items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <LayoutTemplate className="h-8 w-8 text-white/20" />
                <div className="mt-3 text-sm font-semibold text-white">Sin coincidencias en la biblioteca</div>
                <div className="mt-2 max-w-md text-xs leading-5 text-white/45">Prueba con otra busqueda o cambia la categoria. El objetivo es que combines bloques base, secciones listas y bloques dinamicos segun tu idea.</div>
              </div>
            ) : (
              groups
                .filter((group) => groupFilter === "all" || group.id === groupFilter)
                .map((group) => {
                  const groupTypes = visibleTypes.filter((type) => group.types.includes(type))
                  if (!groupTypes.length) return null

                  return (
                    <div key={group.id}>
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#7ca0cb]">{group.label}</div>
                          <div className="mt-1 text-[11px] leading-5 text-white/40">{group.description}</div>
                        </div>
                        <span className="rounded-lg border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[10px] text-white/35">{groupTypes.length}</span>
                      </div>
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {groupTypes.map((type) => {
                          const meta = getStudioSectionMeta(type)
                          const Icon = meta.icon
                          const isHov = hovered === type
                          const isExpanded = detailsType === type
                          const fakeSec: CMSSection = { id: `prev-${type}`, type, visible: true, data: (DEFAULTS[type] as Record<string, any>) ?? {} }
                          const profile = getLibraryCapabilities(type)

                          return (
                            <div
                              key={type}
                              onMouseEnter={() => setHovered(type)}
                              onMouseLeave={() => setHovered(null)}
                              className={cn(
                                "flex h-full flex-col overflow-hidden rounded-xl border text-left transition-all",
                                isHov
                                  ? "border-primary shadow-[0_0_0_2px_rgba(232,57,42,0.25),0_8px_24px_rgba(0,0,0,0.2)] -translate-y-0.5"
                                  : "border-border/70 hover:border-primary/40"
                              )}
                            >
                              <div className="relative min-h-[110px] overflow-hidden bg-[#0a0d12]">
                                <SectionMiniPreview section={fakeSec} />
                                <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3">
                                  <div className="flex flex-wrap gap-1.5">
                                    {profile.tags.slice(0, 2).map((tag) => (
                                      <span key={tag} className="rounded-lg border border-white/10 bg-[#07101a]/85 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/70">
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                  <span className="rounded-lg border border-primary/25 bg-black/60 px-2.5 py-1 text-[10px] font-semibold text-primary">
                                    {group.label}
                                  </span>
                                </div>
                                {isHov && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-primary/15">
                                    <span className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-lg">
                                      <Plus className="w-3 h-3" />
                                      Agregar bloque
                                    </span>
                                  </div>
                                )}
                              </div>
                              <div className={cn("flex flex-1 flex-col gap-3 border-t px-4 py-4 transition-colors", isHov ? "border-primary/20 bg-primary/8" : "border-border/60 bg-card")}>
                                <div className="flex items-start gap-3">
                                  <div className={cn("mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg transition-all", meta.color, isHov && "scale-105")}>
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="text-sm font-semibold leading-tight text-foreground">{meta.label}</div>
                                    {meta.desc ? <div className="mt-1 text-[11px] leading-5 text-muted-foreground">{meta.desc}</div> : null}
                                  </div>
                                </div>
                                <div className="flex flex-wrap gap-1.5">
                                  {profile.tags.map((tag) => (
                                    <span key={tag} className="rounded-lg border border-white/10 bg-secondary/20 px-2.5 py-1 text-[10px] font-medium text-white/65">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                                <div className="rounded-lg border border-white/8 bg-[#0c1118] p-3">
                                  <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#7ca0cb]">Incluye</div>
                                  <div className="mt-2 grid gap-2">
                                    {profile.tools.map((tool) => (
                                      <div key={tool} className="flex items-center gap-2 text-[12px] leading-5 text-white/72">
                                        <Check className="h-3.5 w-3.5 text-primary" />
                                        <span>{tool}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                                {isExpanded ? (
                                  <div className="rounded-lg border border-primary/20 bg-primary/6 p-3">
                                    <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Ideal para</div>
                                    <div className="mt-2 flex flex-wrap gap-1.5">
                                      {profile.bestFor.map((item) => (
                                        <span key={item} className="rounded-lg border border-primary/15 bg-black/20 px-2.5 py-1 text-[10px] font-medium text-white/75">
                                          {item}
                                        </span>
                                      ))}
                                    </div>
                                    <div className="mt-3 text-[11px] leading-5 text-white/55">{profile.outcome}</div>
                                  </div>
                                ) : null}
                                <div className="mt-auto flex gap-2 pt-1">
                                  <button
                                    type="button"
                                    onClick={() => setDetailsType((current) => current === type ? null : type)}
                                    className={cn(
                                      "inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold transition-all",
                                      isExpanded
                                        ? "border-primary/35 bg-primary/10 text-primary"
                                        : "border-border bg-secondary/10 text-muted-foreground hover:border-primary/30 hover:text-foreground"
                                    )}
                                  >
                                    {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                                    {isExpanded ? "Ocultar detalles" : "Ver detalles"}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleAdd(type)}
                                    className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-xs font-semibold text-white transition-all hover:bg-primary/90"
                                  >
                                    <Plus className="w-3 h-3" />
                                    Agregar
                                  </button>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>
        {/* Footer */}
        <div className="px-5 py-3 border-t border-border bg-secondary/5 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-primary/50 flex-shrink-0" />
          <p className="text-[11px] text-muted-foreground">Explora bloques del sistema, revisa detalles antes de insertarlos y combinalos luego desde el canvas del Studio.</p>
        </div>
      </div>
    </div>
  )
}

// â”€â”€â”€ Sections Tab â€” Visual Canvas Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabSecciones({ config, onChange, fullscreen = false }: { config: CMSConfig; onChange: (c: CMSConfig) => void; fullscreen?: boolean }) {
  const [selId, setSelId] = useState<string>(config.sections[0]?.id ?? "")
  const [showAdd, setShowAdd] = useState(false)
  const [editorTab, setEditorTab] = useState<"content" | "style">("content")
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop")

  const sections = config.sections
  const sel      = sections.find(s => s.id === selId) ?? null

  const move   = (id: string, dir: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === id)
    const next = idx + dir
    if (next < 0 || next >= sections.length) return
    const arr = [...sections]; [arr[idx], arr[next]] = [arr[next], arr[idx]]
    onChange({ ...config, sections: arr })
  }
  const toggle = (id: string) => onChange({ ...config, sections: sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s) })
  const del    = (id: string) => {
    const next = sections.filter(s => s.id !== id)
    onChange({ ...config, sections: next })
    if (selId === id) setSelId(next[0]?.id ?? "")
  }
  const add = (type: CMSSectionType) => {
    const id = `${type}_${Date.now()}`
    onChange({ ...config, sections: [...sections, { id, type, visible: true, data: DEFAULTS[type] ?? {}, settings: getDefaultSectionSettings(type) }] })
    setSelId(id)
    setEditorTab("content")
  }
  const duplicate = (id: string) => {
    const index = sections.findIndex((section) => section.id === id)
    if (index === -1) return
    const copy = duplicateCMSSection(sections[index])
    const next = [...sections]
    next.splice(index + 1, 0, copy)
    onChange({ ...config, sections: next })
    setSelId(copy.id)
    setEditorTab("content")
  }
  const updStyle = (style: CMSSectionStyle) => onChange({ ...config, sections: sections.map(s => s.id === selId ? { ...s, style } : s) })

  const wrapCls = fullscreen
    ? "flex h-full min-h-0"
    : "flex rounded-2xl border border-border overflow-hidden"
  const wrapStyle = fullscreen ? {} : { minHeight: 720 }

  return (
    <div className={wrapCls} style={wrapStyle}>
      {/* â”€â”€ Left panel: Capas â”€â”€ */}
      {fullscreen ? (
        <div className="w-[clamp(240px,18vw,280px)] flex-shrink-0 flex flex-col border-r border-white/8 bg-[#08111b]">
          {/* Panel header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Capas</div>
              <div className="text-sm font-semibold text-white/80 mt-0.5">PÃ¡gina inicio</div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/8 text-white/40">{sections.length}</span>
          </div>
          {/* Layer cards */}
          <div className="flex-1 overflow-y-auto py-3 px-3 space-y-2">
            {sections.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3">
                <LayoutTemplate className="w-8 h-8 text-white/10" />
                <p className="text-xs text-white/25 text-center">Sin bloques.<br/>Agrega el primero.</p>
              </div>
            )}
            {sections.map((sec, idx) => {
              const meta = getStudioSectionMeta(sec.type)
              const Icon = meta?.icon ?? LayoutTemplate
              const isActive = sec.id === selId
              return (
                <div
                  key={sec.id}
                  onClick={() => { setSelId(sec.id); setEditorTab("content") }}
                  className={cn(
                    "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all select-none",
                    isActive
                      ? "border-primary/60 shadow-[0_0_0_1px_rgba(232,57,42,0.15),0_4px_16px_rgba(232,57,42,0.1)] bg-[#130e14]"
                      : "border-white/8 bg-[#0c1520] hover:border-white/15 hover:bg-[#0e1825]",
                    !sec.visible && "opacity-40"
                  )}
                >
                  {/* Mini preview */}
                  <div className="relative min-h-[72px] bg-[#080f17]">
                    <SectionMiniPreview section={sec} />
                    <div className={cn(
                      "absolute inset-0 flex items-center justify-center transition-all",
                      isActive ? "bg-primary/20" : "opacity-0 group-hover:opacity-100 bg-black/50"
                    )}>
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-primary px-2.5 py-1 rounded-full">
                        <Pencil className="w-2.5 h-2.5" />Editar
                      </span>
                    </div>
                  </div>
                  {/* Name bar */}
                  <div className={cn(
                    "flex items-center gap-2 px-3 py-2 border-t",
                    isActive ? "border-primary/20 bg-primary/8" : "border-white/6"
                  )}>
                    <div className={cn("w-4 h-4 rounded flex items-center justify-center flex-shrink-0", meta?.color ?? "bg-white/10 text-white/50")}>
                      <Icon className="w-2.5 h-2.5" />
                    </div>
                    <span className={cn("flex-1 text-[11px] font-medium truncate", isActive ? "text-white/90" : "text-white/55")}>
                      {meta?.label ?? sec.type}
                    </span>
                    {/* Inline controls */}
                    <div className={cn("flex gap-0.5 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                      <button onClick={e => { e.stopPropagation(); move(sec.id, -1) }} disabled={idx === 0}
                        className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-all">
                        <ArrowUp className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); move(sec.id, 1) }} disabled={idx === sections.length - 1}
                        className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-all">
                        <ArrowDown className="w-2.5 h-2.5" />
                      </button>
                      <button onClick={e => { e.stopPropagation(); toggle(sec.id) }}
                        className={cn("w-5 h-5 flex items-center justify-center rounded transition-all", sec.visible ? "text-emerald-400/70 hover:text-emerald-400" : "text-white/20 hover:text-white/50")}>
                        {sec.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}
                      </button>
                      {meta?.deletable && (
                        <button onClick={e => { e.stopPropagation(); del(sec.id) }}
                          className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-all">
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          {/* Add block CTA */}
          <div className="p-3 border-t border-white/8">
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-2xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_4px_20px_rgba(232,57,42,0.35)]">
              <Plus className="w-4 h-4" />Agregar bloque
            </button>
          </div>
        </div>
      ) : (
        <div className="w-72 flex-shrink-0 flex flex-col border-r border-border bg-[#0a0d12]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <div>
              <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Capas</div>
              <div className="text-xs font-semibold text-foreground">Pagina inicio</div>
            </div>
            <span className="text-xs bg-secondary/50 px-2 py-0.5 rounded-full text-muted-foreground">{sections.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {sections.length === 0 && (
              <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted-foreground">
                <LayoutTemplate className="w-8 h-8 opacity-20" />
                <p className="text-xs text-center">Sin bloques. Agrega el primero.</p>
              </div>
            )}
            {sections.map((sec, idx) => (
              <SectionCard
                key={sec.id}
                section={sec}
                isSelected={sec.id === selId}
                idx={idx}
                total={sections.length}
                onSelect={() => { setSelId(sec.id); setEditorTab("content") }}
                onMoveUp={() => move(sec.id, -1)}
                onMoveDown={() => move(sec.id, 1)}
                onToggle={() => toggle(sec.id)}
                onDuplicate={() => duplicate(sec.id)}
                onDelete={() => del(sec.id)}
              />
            ))}
          </div>
          <div className="p-3 border-t border-border">
            <button onClick={() => setShowAdd(true)}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-primary text-white text-sm font-bold hover:bg-primary/90 transition-all shadow-[0_4px_14px_rgba(232,57,42,0.3)]">
              <Plus className="w-4 h-4" />Agregar bloque
            </button>
          </div>
        </div>
      )}

      {/* â”€â”€ Canvas â”€â”€ */}
      <div className={cn("min-w-0 flex-1 flex flex-col", fullscreen ? "border-r border-white/8 bg-[#060b12]" : "border-r border-border bg-[#05080d]")}>
        {/* Canvas sub-header */}
        {fullscreen ? (
          <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-[#07101a] px-4 h-11 flex-shrink-0">
            <span className="text-[11px] text-white/35 font-mono">hackevans.ec{viewport === "mobile" ? "/m" : ""}</span>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0a1420] p-0.5">
              <button type="button" onClick={() => setViewport("desktop")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "desktop" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70")}>
                <Monitor className="h-3.5 w-3.5" />Desktop
              </button>
              <button type="button" onClick={() => setViewport("mobile")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "mobile" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70")}>
                <Smartphone className="h-3.5 w-3.5" />Mobile
              </button>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 border-b border-border bg-secondary/10 px-4 py-3">
            <div>
              <div className="text-sm font-semibold text-foreground">Studio visual de Inicio</div>
              <div className="text-[11px] text-muted-foreground">Selecciona un bloque para editar</div>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border bg-card/60 p-1">
              <button type="button" onClick={() => setViewport("desktop")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "desktop" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
                <Monitor className="h-3.5 w-3.5" />Desktop
              </button>
              <button type="button" onClick={() => setViewport("mobile")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "mobile" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}>
                <Smartphone className="h-3.5 w-3.5" />Mobile
              </button>
            </div>
          </div>
        )}
        <div className="min-h-0 flex-1">
          <StudioViewport
            title="Inicio"
            route="/"
            sections={sections}
            selectedId={selId}
            onSelect={(id) => { setSelId(id); setEditorTab("content") }}
            config={config}
            mode={viewport}
            zoomMode="fit"
          />
        </div>
      </div>

      {/* â”€â”€ Inspector â”€â”€ */}
      {fullscreen ? (
        <div className="w-[clamp(280px,22vw,320px)] flex-shrink-0 flex flex-col bg-[#08111b] border-l border-white/8">
          {sel ? (
            <>
              {/* Inspector header */}
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-3 mb-3">
                  {(() => { const meta = getStudioSectionMeta(sel.type); const Icon = meta.icon; return (
                    <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0", meta.color)}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  )})()}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-[15px] leading-tight">{getStudioSectionMeta(sel.type).label}</div>
                    <div className="text-[11px] text-white/35 mt-0.5">{sel.visible ? "Visible en la pÃ¡gina" : "Bloque oculto"}</div>
                  </div>
                </div>
                {/* Content / Style tabs */}
                <div className="flex rounded-2xl bg-white/5 p-0.5 border border-white/8">
                  <button onClick={() => setEditorTab("content")} className={cn("flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all", editorTab === "content" ? "bg-primary text-white shadow-sm" : "text-white/45 hover:text-white/70")}>
                    Contenido
                  </button>
                  <button onClick={() => setEditorTab("style")} className={cn("flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all", editorTab === "style" ? "bg-primary text-white shadow-sm" : "text-white/45 hover:text-white/70")}>
                    Estilo
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {editorTab === "content"
                  ? <SectionContentEditor section={sel} config={config} onChange={onChange} onUpdateSettings={() => {}} />
                  : <StyleEditor style={sel.style} onChange={updStyle} />
                }
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-3xl bg-white/4 flex items-center justify-center border border-white/8">
                <LayoutTemplate className="w-7 h-7 text-white/15" />
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-1">Selecciona un bloque</p>
                <p className="text-sm text-white/25">Haz clic en cualquier bloque del canvas para editar su contenido y estilo</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                <Plus className="w-4 h-4" />Agregar bloque
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-[clamp(320px,24vw,380px)] flex-shrink-0 flex flex-col bg-card overflow-hidden">
          {sel ? (
            <>
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-secondary/10">
                {(() => { const meta = getStudioSectionMeta(sel.type); const Icon = meta.icon; return (
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.color)}>
                    <Icon className="w-4 h-4" />
                  </div>
                )})()}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-foreground text-sm">{getStudioSectionMeta(sel.type).label}</div>
                  <div className="text-xs text-muted-foreground">{sel.visible ? "Visible en la pagina" : "Bloque oculto"}</div>
                </div>
                <div className="flex gap-1 bg-secondary/30 rounded-xl p-1">
                  <button onClick={() => setEditorTab("content")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", editorTab === "content" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    <Pencil className="w-3 h-3" />Contenido
                  </button>
                  <button onClick={() => setEditorTab("style")} className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all", editorTab === "style" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    <Settings className="w-3 h-3" />Estilo
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {editorTab === "content"
                  ? <SectionContentEditor section={sel} config={config} onChange={onChange} onUpdateSettings={() => {}} />
                  : <StyleEditor style={sel.style} onChange={updStyle} />
                }
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-secondary/20 flex items-center justify-center">
                <LayoutTemplate className="w-8 h-8 text-muted-foreground/30" />
              </div>
              <div>
                <p className="font-semibold text-foreground mb-1">Selecciona un bloque para editarlo</p>
                <p className="text-sm text-muted-foreground">Haz clic en cualquier bloque del canvas para editar su contenido y estilo</p>
              </div>
              <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-10 px-5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                <Plus className="w-4 h-4" />Agregar primer bloque
              </button>
            </div>
          )}
        </div>
      )}

      {showAdd && <AddModal onAdd={add} onClose={() => setShowAdd(false)} />}
    </div>
  )
}

// â”€â”€â”€ Pages Tab â€” Visual Canvas Editor â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabPaginas({ config, onChange, fullscreen = false }: { config: CMSConfig; onChange: (c: CMSConfig) => void; fullscreen?: boolean }) {
  const pages = config.pages ?? []
  const [selSlug, setSelSlug]     = useState(pages[0]?.slug ?? "")
  const [selId, setSelId]         = useState<string>(pages[0]?.sections[0]?.id ?? "")
  const [editorTab, setEditorTab] = useState<"content" | "style">("content")
  const [showAdd, setShowAdd]     = useState(false)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newTitle, setNewTitle]   = useState("")
  const [newSlug, setNewSlug]     = useState("")
  const [viewport, setViewport]   = useState<"desktop" | "mobile">("desktop")

  const page     = pages.find(p => p.slug === selSlug)
  const sections = page?.sections ?? []
  const sel      = sections.find(s => s.id === selId) ?? null

  const updateSections = (newSecs: CMSSection[]) =>
    onChange({ ...config, pages: pages.map(p => p.slug === selSlug ? { ...p, sections: newSecs } : p) })

  const move   = (id: string, dir: -1 | 1) => {
    const idx = sections.findIndex(s => s.id === id)
    const next = idx + dir
    if (next < 0 || next >= sections.length) return
    const arr = [...sections]; [arr[idx], arr[next]] = [arr[next], arr[idx]]
    updateSections(arr)
  }
  const toggle = (id: string) => updateSections(sections.map(s => s.id === id ? { ...s, visible: !s.visible } : s))
  const del    = (id: string) => {
    const next = sections.filter(s => s.id !== id)
    updateSections(next)
    if (selId === id) setSelId(next[0]?.id ?? "")
  }
  const add = (type: CMSSectionType) => {
    const id = `${type}_${Date.now()}`
    updateSections([...sections, { id, type, visible: true, data: DEFAULTS[type] ?? {}, settings: getDefaultSectionSettings(type) }])
    setSelId(id)
    setEditorTab("content")
  }
  const duplicateSection = (id: string) => {
    const index = sections.findIndex((section) => section.id === id)
    if (index === -1) return
    const copy = duplicateCMSSection(sections[index])
    const next = [...sections]
    next.splice(index + 1, 0, copy)
    updateSections(next)
    setSelId(copy.id)
    setEditorTab("content")
  }
  const updStyle = (style: CMSSectionStyle) => updateSections(sections.map(s => s.id === selId ? { ...s, style } : s))
  const updData  = (data: Record<string, any>) => updateSections(sections.map(s => s.id === selId ? { ...s, data } : s))
  const updatePageMeta = (patch: Partial<CMSPage>) => onChange({
    ...config,
    nav: typeof patch.slug === "string"
      ? {
          ...config.nav,
          items: config.nav.items.map((item) =>
            item.href === `/${selSlug}` ? { ...item, href: `/${patch.slug}` } : item
          ),
        }
      : config.nav,
    pages: pages.map((item) => {
      if (item.slug !== selSlug) return item
      const shouldSyncNavLabel = typeof patch.title === "string" && (!item.navLabel || item.navLabel === item.title)
      return { ...item, ...patch, ...(shouldSyncNavLabel ? { navLabel: patch.title } : {}) }
    }),
  })

  const addPage = () => {
    if (!newTitle.trim() || !newSlug.trim()) return
    const slug = newSlug.trim().replace(/[^a-z0-9-]/g, "-")
    if (pages.find(p => p.slug === slug)) return
    onChange({ ...config, pages: [...pages, { slug, title: newTitle.trim(), sections: [], showInNav: true, navLabel: newTitle.trim() }] })
    setSelSlug(slug)
    setSelId("")
    setShowNewPage(false)
    setNewTitle("")
    setNewSlug("")
  }
  const deletePage = (slug: string) => {
    if (!confirm(`Eliminar la pagina "/${slug}"?`)) return
    const next = pages.filter(p => p.slug !== slug)
    onChange({
      ...config,
      nav: {
        ...config.nav,
        items: config.nav.items.filter((item) => item.href !== `/${slug}`),
      },
      pages: next,
    })
    if (selSlug === slug) { setSelSlug(next[0]?.slug ?? ""); setSelId("") }
  }
  const duplicatePage = (slug: string) => {
    const base = pages.find((item) => item.slug === slug)
    if (!base) return
    let nextSlug = `${slug}-copia`
    let counter = 2
    while (pages.some((item) => item.slug === nextSlug)) {
      nextSlug = `${slug}-copia-${counter}`
      counter += 1
    }
    const nextPage: CMSPage = {
      ...base,
      builtin: false,
      slug: nextSlug,
      title: `${base.title} copia`,
      showInNav: base.showInNav ?? true,
      navLabel: base.navLabel ? `${base.navLabel} copia` : `${base.title} copia`,
      sections: base.sections.map((section) => duplicateCMSSection(section)),
    }
    onChange({ ...config, pages: [...pages, nextPage] })
    setSelSlug(nextSlug)
    setSelId(nextPage.sections[0]?.id ?? "")
  }

  const wrapCls2 = fullscreen
    ? "flex h-full min-h-0"
    : "flex rounded-2xl border border-border overflow-hidden"
  const wrapStyle2 = fullscreen ? {} : { minHeight: 720 }

  return (
    <div className={wrapCls2} style={wrapStyle2}>
      <div className={cn("flex-shrink-0 flex flex-col border-r", fullscreen ? "w-48 border-white/8 bg-[#08111b]" : "w-44 border-border bg-[#080b0f]")}>
        <div className={cn("flex items-center justify-between px-3 py-3 border-b", fullscreen ? "border-white/8" : "border-border")}>
          <span className={cn("text-[10px] font-bold uppercase tracking-[0.22em]", fullscreen ? "text-[#5d7fa8]" : "text-muted-foreground")}>Paginas</span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", fullscreen ? "bg-white/8 text-white/40" : "bg-secondary/50 text-muted-foreground")}>{pages.length}</span>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {pages.map(p => (
            <div
              key={p.slug}
              onClick={() => { setSelSlug(p.slug); setSelId(p.sections[0]?.id ?? "") }}
              className={cn(
                "group relative flex items-start gap-2 px-2.5 py-2 rounded-xl border cursor-pointer transition-all",
                fullscreen
                  ? selSlug === p.slug
                    ? "border-primary/40 bg-[#130e14]"
                    : "border-white/8 bg-[#0c1520] hover:border-white/15 hover:bg-[#0e1825]"
                  : selSlug === p.slug
                    ? "border-primary/60 bg-primary/10"
                    : "border-border/60 bg-card/30 hover:bg-secondary/20"
              )}
            >
              <Globe className={cn("w-3 h-3 flex-shrink-0 mt-0.5", fullscreen ? "text-white/30" : "text-muted-foreground")} />
              <div className="flex-1 min-w-0">
                <div className={cn("text-[11px] font-semibold truncate", fullscreen ? "text-white/80" : "text-foreground")}>{p.title}</div>
                <div className={cn("text-[9px]", fullscreen ? "text-white/25" : "text-muted-foreground/50")}>/{p.slug}</div>
              </div>
              <a
                href={`/${p.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className={cn("absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded opacity-0 transition-all group-hover:opacity-100", fullscreen ? "text-white/30 hover:text-primary" : "text-muted-foreground hover:text-primary")}
              >
                <ExternalLink className="w-2.5 h-2.5" />
              </a>
              {(
                <button onClick={e => { e.stopPropagation(); deletePage(p.slug) }}
                  className={cn("absolute top-1 right-1 w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-all", fullscreen ? "text-white/25 hover:text-red-400" : "text-muted-foreground hover:text-red-400")}>
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              )}
              <button
                onClick={e => { e.stopPropagation(); duplicatePage(p.slug) }}
                className={cn("absolute top-1 right-7 w-5 h-5 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded transition-all", fullscreen ? "text-white/25 hover:text-white/60" : "text-muted-foreground hover:text-foreground")}
              >
                <Copy className="w-2.5 h-2.5" />
              </button>
            </div>
          ))}
        </div>
        <div className={cn("p-2 border-t", fullscreen ? "border-white/8" : "border-border")}>
          <button onClick={() => setShowNewPage(true)}
            className={cn("w-full flex items-center justify-center gap-1 h-8 rounded-xl border border-dashed text-[10px] font-medium transition-all", fullscreen ? "border-white/10 text-white/25 hover:text-white/60 hover:border-white/20" : "border-border text-muted-foreground hover:text-primary hover:border-primary/50")}>
            <Plus className="w-3 h-3" />Nueva pagina
          </button>
        </div>
      </div>

      <div className={cn("flex-shrink-0 flex flex-col border-r", fullscreen ? "w-64 border-white/8 bg-[#08111b]" : "w-72 border-border bg-[#0a0d12]")}>
        {page ? (
          <>
            <div className={cn("flex items-center justify-between px-3 py-3 border-b", fullscreen ? "border-white/8" : "border-border")}>
              <div>
                <div className={cn("text-[10px] font-bold uppercase tracking-[0.22em]", fullscreen ? "text-[#5d7fa8]" : "text-muted-foreground")}>Capas</div>
                <div className={cn("text-[11px] font-semibold mt-0.5", fullscreen ? "text-white/80" : "text-foreground")}>{page.title}</div>
              </div>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", fullscreen ? "bg-white/8 text-white/40" : "bg-secondary/50 text-muted-foreground")}>{sections.length}</span>
            </div>
            <div className={cn("flex-1 overflow-y-auto space-y-2", fullscreen ? "py-3 px-3" : "p-2.5")}>
              {sections.length === 0 && (
                <div className={cn("flex flex-col items-center justify-center h-40 gap-2", fullscreen ? "text-white/25" : "text-muted-foreground")}>
                  <LayoutTemplate className="w-7 h-7 opacity-20" />
                  <p className="text-[11px] text-center">Sin bloques. Agrega el primero.</p>
                </div>
              )}
              {fullscreen ? sections.map((sec, idx) => {
                const meta = getStudioSectionMeta(sec.type)
                const Icon = meta?.icon ?? LayoutTemplate
                const isActive = sec.id === selId
                return (
                  <div
                    key={sec.id}
                    onClick={() => { setSelId(sec.id); setEditorTab("content") }}
                    className={cn(
                      "group relative rounded-2xl border overflow-hidden cursor-pointer transition-all select-none",
                      isActive
                        ? "border-primary/60 shadow-[0_0_0_1px_rgba(232,57,42,0.15)] bg-[#130e14]"
                        : "border-white/8 bg-[#0c1520] hover:border-white/15 hover:bg-[#0e1825]",
                      !sec.visible && "opacity-40"
                    )}
                  >
                    <div className="relative min-h-[72px] bg-[#080f17]">
                      <SectionMiniPreview section={sec} />
                      <div className={cn("absolute inset-0 flex items-center justify-center transition-all", isActive ? "bg-primary/20" : "opacity-0 group-hover:opacity-100 bg-black/50")}>
                        <span className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-primary px-2.5 py-1 rounded-full">
                          <Pencil className="w-2.5 h-2.5" />Editar
                        </span>
                      </div>
                    </div>
                    <div className={cn("flex items-center gap-2 px-3 py-2 border-t", isActive ? "border-primary/20 bg-primary/8" : "border-white/6")}>
                      <div className={cn("w-4 h-4 rounded flex items-center justify-center flex-shrink-0", meta?.color ?? "bg-white/10 text-white/50")}>
                        <Icon className="w-2.5 h-2.5" />
                      </div>
                      <span className={cn("flex-1 text-[11px] font-medium truncate", isActive ? "text-white/90" : "text-white/55")}>{meta?.label ?? sec.type}</span>
                      <div className={cn("flex gap-0.5 transition-opacity", isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100")}>
                        <button onClick={e => { e.stopPropagation(); move(sec.id, -1) }} disabled={idx === 0} className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-all"><ArrowUp className="w-2.5 h-2.5" /></button>
                        <button onClick={e => { e.stopPropagation(); move(sec.id, 1) }} disabled={idx === sections.length - 1} className="w-5 h-5 flex items-center justify-center rounded text-white/40 hover:text-white disabled:opacity-20 transition-all"><ArrowDown className="w-2.5 h-2.5" /></button>
                        <button onClick={e => { e.stopPropagation(); toggle(sec.id) }} className={cn("w-5 h-5 flex items-center justify-center rounded transition-all", sec.visible ? "text-emerald-400/70 hover:text-emerald-400" : "text-white/20 hover:text-white/50")}>{sec.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5" />}</button>
                        {meta?.deletable && <button onClick={e => { e.stopPropagation(); del(sec.id) }} className="w-5 h-5 flex items-center justify-center rounded text-white/20 hover:text-red-400 transition-all"><Trash2 className="w-2.5 h-2.5" /></button>}
                      </div>
                    </div>
                  </div>
                )
              }) : sections.map((sec, idx) => (
                <SectionCard
                  key={sec.id}
                  section={sec}
                  isSelected={sec.id === selId}
                  idx={idx}
                  total={sections.length}
                  onSelect={() => { setSelId(sec.id); setEditorTab("content") }}
                  onMoveUp={() => move(sec.id, -1)}
                  onMoveDown={() => move(sec.id, 1)}
                  onToggle={() => toggle(sec.id)}
                  onDuplicate={() => duplicateSection(sec.id)}
                  onDelete={() => del(sec.id)}
                />
              ))}
            </div>
            <div className={cn("border-t", fullscreen ? "p-3 border-white/8" : "p-2.5 border-border")}>
              <button onClick={() => setShowAdd(true)}
                className={cn("w-full flex items-center justify-center gap-2 rounded-xl text-white font-bold hover:bg-primary/90 transition-all", fullscreen ? "h-11 rounded-2xl bg-primary text-sm shadow-[0_4px_20px_rgba(232,57,42,0.35)]" : "h-9 text-xs bg-primary")}>
                <Plus className={fullscreen ? "w-4 h-4" : "w-3.5 h-3.5"} />Agregar bloque
              </button>
            </div>
          </>
        ) : (
          <div className={cn("flex-1 flex flex-col items-center justify-center gap-2 p-4", fullscreen ? "text-white/30" : "text-muted-foreground")}>
            <Globe className="w-7 h-7 opacity-20" />
            <p className="text-xs text-center">Selecciona una pagina del panel izquierdo</p>
          </div>
        )}
      </div>

      <div className={cn("min-w-0 flex-1 flex flex-col border-r", fullscreen ? "border-white/8 bg-[#060b12]" : "border-border bg-[#05080d]")}>
        {fullscreen ? (
          <div className="flex items-center justify-between gap-3 border-b border-white/8 bg-[#07101a] px-4 h-11 flex-shrink-0">
            <span className="text-[11px] text-white/35 font-mono">hackevans.ec{page ? `/${page.slug}` : ""}</span>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-[#0a1420] p-0.5">
              <button type="button" onClick={() => setViewport("desktop")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "desktop" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70")}>
                <Monitor className="h-3.5 w-3.5" />Desktop
              </button>
              <button type="button" onClick={() => setViewport("mobile")} className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "mobile" ? "bg-primary text-white shadow-sm" : "text-white/40 hover:text-white/70")}>
                <Smartphone className="h-3.5 w-3.5" />Mobile
              </button>
            </div>
          </div>
        ) : (
        <div className={cn("flex items-center justify-between gap-3 border-b px-4 py-3", "border-border bg-secondary/10")}>
          <div>
            <div className="text-sm font-semibold text-foreground">{page ? page.title : "Studio visual"}</div>
            <div className="text-[11px] text-muted-foreground">Selecciona un bloque en el canvas o desde la lista de capas.</div>
          </div>
          <div className={cn("flex items-center gap-1 rounded-xl border p-1", "border-border bg-card/60")}>
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "desktop" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
            >
              <Monitor className="h-3.5 w-3.5" />Desktop
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={cn("inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-[11px] font-medium transition-all", viewport === "mobile" ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground")}
            >
              <Smartphone className="h-3.5 w-3.5" />Mobile
            </button>
          </div>
        </div>
        )}
        <div className="min-h-0 flex-1">
          {page ? (
            <StudioViewport
              title={page.title}
              route={`/${page.slug}`}
              sections={sections}
              selectedId={selId}
              onSelect={(id) => { setSelId(id); setEditorTab("content") }}
              config={config}
              mode={viewport}
              zoomMode="fit"
            />
          ) : (
            <div className={cn("flex h-full items-center justify-center text-sm", fullscreen ? "text-white/20" : "text-muted-foreground")}>
              Elige una pagina para abrir el editor visual.
            </div>
          )}
        </div>
      </div>

      <div className={cn("flex-shrink-0 flex flex-col overflow-hidden", fullscreen ? "w-[clamp(300px,24vw,340px)] bg-[#08111b] border-l border-white/8" : "w-[clamp(320px,24vw,380px)] bg-card")}>
        {sel && page ? (
          <>
            {fullscreen ? (
              <div className="px-4 py-4 border-b border-white/8">
                <div className="flex items-center gap-3 mb-3">
                  {(() => { const meta = getStudioSectionMeta(sel.type); const Icon = meta.icon; return (
                    <div className={cn("w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0", meta.color)}>
                      <Icon className="w-4 h-4" />
                    </div>
                  )})()}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-[15px] leading-tight">{getStudioSectionMeta(sel.type).label}</div>
                    <div className="text-[11px] text-white/35 mt-0.5 flex items-center gap-1">
                      <Globe className="w-2.5 h-2.5" />/{page.slug}
                    </div>
                  </div>
                </div>
                <div className="flex rounded-2xl bg-white/5 p-0.5 border border-white/8">
                  <button onClick={() => setEditorTab("content")} className={cn("flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all", editorTab === "content" ? "bg-primary text-white shadow-sm" : "text-white/45 hover:text-white/70")}>
                    Contenido
                  </button>
                  <button onClick={() => setEditorTab("style")} className={cn("flex-1 h-9 rounded-xl text-[12px] font-semibold transition-all", editorTab === "style" ? "bg-primary text-white shadow-sm" : "text-white/45 hover:text-white/70")}>
                    Estilo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border bg-secondary/10">
                {(() => { const meta = getStudioSectionMeta(sel.type); const Icon = meta.icon; return (
                  <div className={cn("w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0", meta.color)}><Icon className="w-4 h-4" /></div>
                )})()}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{getStudioSectionMeta(sel.type).label}</div>
                  <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Globe className="w-3 h-3" />/{page.slug}
                  </div>
                </div>
                <div className="flex gap-0.5 rounded-xl bg-secondary/30 p-0.5">
                  <button onClick={() => setEditorTab("content")} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all", editorTab === "content" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    <Pencil className="w-3 h-3" />Contenido
                  </button>
                  <button onClick={() => setEditorTab("style")} className={cn("flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all", editorTab === "style" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>
                    <Settings className="w-3 h-3" />Estilo
                  </button>
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {editorTab === "content" ? (
                <div className="space-y-0">
                  <div className="border-b border-border px-5 py-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Pagina</div>
                    <div className="grid gap-3">
                      <F label="Nombre visible">
                        <input
                          className={iCls}
                          value={page.title}
                          onChange={e => updatePageMeta({ title: e.target.value })}
                          placeholder="Nombre de la pagina"
                        />
                      </F>
                      <F label="Slug / URL">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">/</span>
                          <input
                            className={iCls}
                            value={page.slug}
                            onChange={e => {
                              const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "")
                              if (!value || pages.some((item) => item.slug === value && item.slug !== page.slug)) return
                              updatePageMeta({ slug: value })
                              setSelSlug(value)
                            }}
                            placeholder="mi-pagina"
                          />
                        </div>
                      </F>
                    </div>
                  </div>
                  <PageSectionContentEditor section={sel} onChange={updData} onUpdateSettings={() => {}} />
                </div>
              ) : (
                <StyleEditor style={sel.style} onChange={updStyle} />
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            {fullscreen ? (
              <>
                <div className="w-16 h-16 rounded-3xl bg-white/4 flex items-center justify-center border border-white/8">
                  <Globe className="w-7 h-7 text-white/15" />
                </div>
                <div>
                  <p className="font-semibold text-white/60 mb-1">{page ? "Selecciona un bloque" : "Selecciona una pagina"}</p>
                  <p className="text-sm text-white/25">{page ? "Haz clic en cualquier bloque del canvas para editar su contenido y estilo" : "Elige una pagina del panel izquierdo para abrir el editor visual"}</p>
                </div>
                {page && sections.length === 0 && (
                  <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-primary/10 border border-primary/20 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                    <Plus className="w-4 h-4" />Agregar bloque
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-secondary/20 flex items-center justify-center">
                  <Globe className="w-7 h-7 text-muted-foreground/25" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">{page ? "Selecciona un bloque para editarlo" : "Selecciona una pagina"}</p>
                  <p className="text-sm text-muted-foreground">{page ? "Haz clic en cualquier bloque del canvas para editar su contenido" : "Elige una pagina del panel izquierdo para abrir el editor visual"}</p>
                </div>
                {page && sections.length === 0 && (
                  <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 h-9 px-5 rounded-xl bg-primary/10 text-primary text-sm font-semibold hover:bg-primary/20 transition-all">
                    <Plus className="w-4 h-4" />Agregar primer bloque
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {showAdd && <AddModal onAdd={add} onClose={() => setShowAdd(false)} pageMode />}

      {showNewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4" onClick={() => setShowNewPage(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border bg-card shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-widest text-primary mb-0.5">Nueva pagina</div>
                <div className="font-semibold text-foreground">Crear pagina del sitio</div>
              </div>
              <button onClick={() => setShowNewPage(false)} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-all">
                <X className="w-4 h-4" />
              </button>
            </div>
            <F label="Nombre de la pagina" helper="ej: Cursos, Sobre nosotros, Blog">
              <input className={iCls} value={newTitle} autoFocus placeholder="Mis Cursos"
                onChange={e => { setNewTitle(e.target.value); setNewSlug(e.target.value.toLowerCase().trim().replace(/\s+/g,"-").replace(/[^a-z0-9-]/g,"")) }} />
            </F>
            <F label="URL (slug)" helper={`Pagina disponible en: /${newSlug || "mi-pagina"}`}>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground flex-shrink-0">/</span>
                <input className={iCls} value={newSlug} placeholder="mis-cursos"
                  onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g,""))} />
              </div>
            </F>
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs text-emerald-300/80">
              La pagina quedara disponible automaticamente en /{newSlug || "mi-pagina"}. Ya no necesitas crear archivos manualmente.
            </div>
            <div className="flex gap-3 justify-end">
              <Btn onClick={() => setShowNewPage(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={addPage} disabled={!newTitle.trim() || !newSlug.trim()}>
                <Plus className="w-4 h-4" />Crear pagina
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// â”€â”€â”€ Navegacion Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabNavegacion({ config, onChange }: { config: CMSConfig; onChange: (c: CMSConfig) => void }) {
  const nav = config.nav
  const s = (p: Partial<typeof nav>) => onChange({ ...config, nav: { ...nav, ...p } })
  const items = nav.items
  return (
    <div className="space-y-6">
      <Card title="Links del menu" action={
        <Btn size="sm" variant="ghost" onClick={() => s({ items: [...items, { id: `n${Date.now()}`, label: "Nuevo link", href: "/" }] })}>
          <Plus className="w-3.5 h-3.5" />Agregar
        </Btn>
      }>
        <p className="text-xs text-muted-foreground">Estos links aparecen en la barra de navegacion superior. El icono ðŸ”— significa "abrir en nueva pestaÃ±a".</p>
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={item.id} className="flex gap-2 items-center p-3 rounded-xl border border-border bg-secondary/10">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">{i + 1}</div>
              <input className={cn(iCls, "flex-1")} value={item.label} placeholder="Texto del link" onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
              <input className={cn(iCls, "flex-1")} value={item.href} placeholder="URL (/pagina o https://...)" onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} />
              <input className={cn(iCls, "w-28")} value={item.badge || ""} placeholder="Badge (opcional)" onChange={e => s({ items: items.map((x, j) => j === i ? { ...x, badge: e.target.value || undefined } : x) })} />
              <button title="Abrir en nueva pestaÃ±a" onClick={() => s({ items: items.map((x, j) => j === i ? { ...x, external: !x.external } : x) })} className={cn("h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border transition-all", item.external ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40")}>
                <ExternalLink className="w-4 h-4" />
              </button>
              <button onClick={() => s({ items: items.filter((_, j) => j !== i) })} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 hover:border-red-400/40 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin links. Agrega el primero.</p>}
        </div>
        <div className="mt-2 text-xs text-muted-foreground bg-secondary/20 rounded-xl px-4 py-3">
          <span className="font-medium text-foreground">Guia de URLs:</span> usa <code className="text-primary">/</code> para inicio â€¢ <code className="text-primary">/pagina</code> para paginas internas â€¢ <code className="text-primary">#seccion</code> para anclas â€¢ <code className="text-primary">https://...</code> para links externos (activa el icono ðŸ”—)
        </div>
      </Card>
      <Card title="Botones de accion del navbar">
        <div className="grid grid-cols-2 gap-4">
          <F label="Texto boton Iniciar Sesion"><input className={iCls} value={nav.loginLabel} onChange={e => s({ loginLabel: e.target.value })} /></F>
          <F label="Texto boton Registrarse"><input className={iCls} value={nav.registerLabel} onChange={e => s({ registerLabel: e.target.value })} /></F>
        </div>
      </Card>
    </div>
  )
}

// â”€â”€â”€ General Tab â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function TabGeneral({ config, onChange }: { config: CMSConfig; onChange: (c: CMSConfig) => void }) {
  const g = config.general
  const s = (p: Partial<typeof g>) => onChange({ ...config, general: { ...g, ...p } })
  const links = g.footerLinks ?? []
  return (
    <div className="space-y-6">
      <Card title="Identidad de la plataforma">
        <F label="Nombre de la plataforma"><input className={iCls} value={g.nombrePlataforma} onChange={e => s({ nombrePlataforma: e.target.value })} /></F>
        <F label="Tagline / eslogan" helper="Se muestra debajo del logo en el navbar"><input className={iCls} value={g.tagline} onChange={e => s({ tagline: e.target.value })} /></F>
      </Card>
      <Card title="Footer" action={
        <Btn size="sm" variant="ghost" onClick={() => s({ footerLinks: [...links, { id: `fl${Date.now()}`, label: "Nuevo link", href: "#" }] })}>
          <Plus className="w-3.5 h-3.5" />Agregar link
        </Btn>
      }>
        <F label="Texto de copyright"><input className={iCls} value={g.footerText} onChange={e => s({ footerText: e.target.value })} /></F>
        <div className="space-y-2">
          {links.map((link, i) => (
            <div key={link.id} className="flex gap-2">
              <input className={iCls} value={link.label} placeholder="Texto" onChange={e => s({ footerLinks: links.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} />
              <input className={iCls} value={link.href} placeholder="URL" onChange={e => s({ footerLinks: links.map((x, j) => j === i ? { ...x, href: e.target.value } : x) })} />
              <button onClick={() => s({ footerLinks: links.filter((_, j) => j !== i) })} className="h-10 w-10 flex-shrink-0 flex items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// â”€â”€â”€ Main â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

// â”€â”€â”€ Studio Icon Rail tabs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€


const STUDIO_LEFT_TABS = [
  { id: "pages", label: "Paginas", icon: Globe },
  { id: "layers", label: "Capas", icon: Layers },
  { id: "components", label: "Componentes", icon: LayoutTemplate },
  { id: "popups", label: "Popups", icon: MessageSquare },
  { id: "forms", label: "Formularios", icon: FileText },
  { id: "simulators", label: "Simuladores", icon: Target },
  { id: "assets", label: "Assets", icon: FileImage },
  { id: "navigation", label: "Navegacion", icon: Link2 },
  { id: "settings", label: "Configuracion", icon: Settings },
] as const

const STUDIO_INSPECTOR_TABS = [
  { id: "content", label: "Contenido", shortLabel: "Contenido", icon: Pencil },
  { id: "style", label: "Estilo", shortLabel: "Estilo", icon: Settings },
  { id: "actions", label: "Acciones", shortLabel: "Acc.", icon: Zap },
  { id: "advanced", label: "Avanzado", shortLabel: "Dev", icon: Code2 },
] as const

const CUSTOM_CODE_INSPECTOR_TABS = [
  { id: "content", label: "Editor visual", shortLabel: "Editor", icon: Pencil },
  { id: "actions", label: "Acciones", shortLabel: "Acc.", icon: Zap },
  { id: "advanced", label: "Desarrollo", shortLabel: "Dev", icon: Code2 },
] as const

const STUDIO_DEVICES = [
  { id: "desktop", label: "Desktop", icon: Monitor },
  { id: "tablet", label: "Tablet", icon: Tablet },
  { id: "mobile", label: "Mobile", icon: Smartphone },
] as const

const STUDIO_BLOCK_GROUPS = [
  { id: "base", label: "Base universal", description: "Bloques flexibles para construir cualquier layout: texto, tarjetas, logos y espaciadores.", types: ["richText", "featureCards", "logoStrip", "spacer", "textBanner"] as CMSSectionType[] },
  { id: "conversion", label: "Conversion", description: "Llamados a la accion, formularios y plantillas listas para captar registros.", types: ["hero", "pageHero", "cta", "formBuilder", "pricing", "contact"] as CMSSectionType[] },
  { id: "media", label: "Media", description: "Imagenes, galerias, video y embeds para explicar o demostrar tu propuesta.", types: ["imageText", "video", "gallery", "embed"] as CMSSectionType[] },
  { id: "trust", label: "Confianza", description: "Prueba social, beneficios, preguntas frecuentes y metricas para reforzar la pagina.", types: ["benefits", "stats", "faq", "testimonials"] as CMSSectionType[] },
  { id: "dynamic", label: "Dinamicos", description: "Bloques conectados al admin para simuladores, cursos y evaluaciones.", types: ["simulatorsFeed", "coursesFeed", "evaluationsFeed"] as CMSSectionType[] },
  { id: "advanced", label: "Avanzado", description: "Widgets, iframes y codigo libre para integraciones externas.", types: ["customCode"] as CMSSectionType[] },
] as const

type StudioLeftTab = typeof STUDIO_LEFT_TABS[number]["id"]
type StudioInspectorTab = typeof STUDIO_INSPECTOR_TABS[number]["id"]
type StudioViewportMode = typeof STUDIO_DEVICES[number]["id"]
type StudioPageRecord = {
  slug: string
  title: string
  route: string
  sections: CMSSection[]
  builtin?: boolean
  showInNav?: boolean
  navLabel?: string
  home?: boolean
}

function sanitizeStudioSlug(value: string) {
  return value.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

function cloneCMSConfigState(config: CMSConfig) {
  return JSON.parse(JSON.stringify(config)) as CMSConfig
}

function getStudioEditingTips(section: CMSSection | null) {
  if (!section) return []

  switch (section.type) {
    case "hero":
    case "pageHero":
      return ["Haz click sobre titulo, descripcion o botones para editar directo.", "Arrastra el bloque desde el canvas para cambiar su posicion."]
    case "featureCards":
      return ["Haz click en cada tarjeta para editar titulo, descripcion y distintivo visual.", "Usa el inspector para cambiar columnas y estilo."]
    case "richText":
      return ["Edita titulo, descripcion, bullets y botones directo sobre la pagina.", "Usa este bloque como base universal para crear secciones propias."]
    case "logoStrip":
      return ["Carga logos o deja solo etiquetas para partners, clientes o herramientas.", "Sirve para confianza, logos institucionales o tecnologias usadas."]
    case "spacer":
      return ["Usa este bloque para dar aire entre secciones sin tocar codigo.", "Ajusta la altura desde Contenido o Estilo."]
    case "embed":
      return ["Pega una URL embebible o un iframe completo.", "Ideal para mapas, calendarios, dashboards, Loom, Canva o Figma."]
    case "customCode":
      return ["Haz clic sobre cualquier boton, texto o campo del HTML para editarlo visualmente.", "Usa Acciones para conectar botones y links del HTML sin tocar codigo."]
    case "faq":
      return ["Haz click en la pregunta o respuesta para editarla sobre la pagina.", "Puedes ocultar el bloque si aun no esta listo para publicar."]
    case "formBuilder":
      return ["Haz click en titulos y etiquetas para editar rapido.", "Los campos y validaciones finas siguen en el inspector derecho."]
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return ["Edita el titulo y CTA directo sobre el canvas.", "En el inspector ajusta fuente, orden y cantidad de items."]
    default:
      return ["Selecciona el bloque y usa el inspector para contenido, estilo y visibilidad."]
  }
}

function getStudioLayerChildren(section: CMSSection, config: CMSConfig) {
  const data = section.data ?? {}

  switch (section.type) {
    case "hero":
      return [
        config.hero.titulo ? "Titulo" : "",
        config.hero.descripcion ? "Descripcion" : "",
        (config.hero.ctaPrimario || config.hero.ctaSecundario) ? "Botones" : "",
      ].filter(Boolean)
    case "pageHero":
      return [
        data.titulo ? "Titulo" : "",
        data.descripcion ? "Descripcion" : "",
        (data.ctaPrimario || data.ctaSecundario) ? "Botones" : "",
      ].filter(Boolean)
    case "featureCards":
      return ((data.items as Array<{ title?: string }>) ?? []).slice(0, 3).map((item) => item.title || "Tarjeta")
    case "richText":
      return [
        data.titulo ? "Titulo" : "",
        data.descripcion ? "Descripcion" : "",
        (data.primaryLabel || data.secondaryLabel) ? "Botones" : "",
      ].filter(Boolean)
    case "logoStrip":
      return ((data.items as Array<{ label?: string }>) ?? []).slice(0, 4).map((item) => item.label || "Logo")
    case "spacer":
      return [`${data.height || 96}px`, "Separacion"]
    case "embed":
      return [data.mode === "html" ? "HTML" : "URL", data.titulo || "Embed"].filter(Boolean)
    case "benefits":
      return config.benefits.items.slice(0, 3).map((item) => item.title)
    case "testimonials":
      return config.testimonials.items.slice(0, 3).map((item) => item.nombre)
    case "faq":
      return ((data.items as Array<{ pregunta?: string }>) ?? []).slice(0, 3).map((item) => item.pregunta || "Pregunta")
    case "gallery":
      return [`${(data.images as Array<unknown>)?.length ?? 0} imagenes`, `${data.columns ?? 3} columnas`]
    default:
      return getStudioSectionContent(section, config).chips.slice(0, 3)
    }
}

type StudioAssetRecord = {
  id: string
  sectionId: string
  label: string
  type: "image" | "video"
  url: string
}

function getStudioAssets(sections: CMSSection[]) {
  const assets: StudioAssetRecord[] = []

  sections.forEach((section) => {
    const data = section.data ?? {}

    if (section.type === "imageText" && data.imageUrl) {
      assets.push({ id: `${section.id}-image`, sectionId: section.id, label: "Imagen principal", type: "image", url: data.imageUrl })
    }
    if (section.type === "pageHero" && data.rightImage) {
      assets.push({ id: `${section.id}-hero-image`, sectionId: section.id, label: "Imagen lateral", type: "image", url: data.rightImage })
    }
    if (section.type === "gallery") {
      ;((data.images as Array<{ url?: string }>) ?? []).forEach((image, index) => {
        if (!image?.url) return
        assets.push({ id: `${section.id}-gallery-${index}`, sectionId: section.id, label: `Imagen ${index + 1}`, type: "image", url: image.url })
      })
    }
    if (section.type === "video" && data.videoUrl) {
      assets.push({ id: `${section.id}-video`, sectionId: section.id, label: "Video embebido", type: "video", url: data.videoUrl })
    }
  })

  return assets
}

function getStudioSectionOptions(sections: CMSSection[]) {
  return sections.map((section, index) => ({
    id: section.id,
    label: `${index + 1}. ${getStudioSectionMeta(section.type).label ?? section.type}`,
  }))
}

function getActionSummary(action?: CMSActionConfig) {
  if (!action?.type || action.type === "none") return "Sin accion"
  if (action.type === "popup") return `Popup · ${action.popupId || "sin seleccionar"}`
  if (action.type === "section") return `Seccion · ${action.sectionId || "sin destino"}`
  if (action.type === "simulator") {
    if (action.formMode === "section" && action.sectionId) return "Simulador · previo formulario en pagina"
    if (action.formMode === "page" && action.formPageHref) return `Simulador · via pagina ${action.formPageHref}`
    return action.popupId ? "Simulador · previo popup" : `Simulador · ${action.href || "sin destino"}`
  }
  if (action.type === "external") return `Externo · ${action.href || "sin URL"}`
  return `Pagina · ${action.href || "sin destino"}`
}

function getSectionActionSummaries(section: CMSSection, config: CMSConfig) {
  switch (section.type) {
    case "hero":
      return [
        { label: "Boton primario", value: getActionSummary(config.hero.primaryAction) },
        { label: "Boton secundario", value: getActionSummary(config.hero.secondaryAction) },
      ]
    case "pageHero":
    case "richText":
    case "cta":
      return [
        { label: "Boton primario", value: getActionSummary(section.data?.primaryAction) },
        { label: "Boton secundario", value: getActionSummary(section.data?.secondaryAction) },
      ]
    case "textBanner":
    case "imageText":
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return [{ label: "CTA del bloque", value: getActionSummary(section.data?.ctaAction) }]
    case "formBuilder":
      return [{ label: "Despues de enviar", value: getActionSummary(section.data?.submitAction) }]
    default:
      return []
  }
}

function ActionConfigEditor({
  title,
  action,
  onChange,
  sections,
  pages,
  popups,
  simulators,
  onCreateFormPopup,
  onEditFormPopup,
  onCreateFormSection,
  onEditFormSection,
  onUpdatePopup,
  onSyncFlow,
}: {
  title: string
  action?: CMSActionConfig
  onChange: (action: CMSActionConfig) => void
  sections: CMSSection[]
  pages: StudioPageRecord[]
  popups: CMSPopup[]
  simulators: Array<{ id: string; title: string; href: string }>
  onCreateFormPopup?: (submitAction?: CMSActionConfig) => string | undefined
  onEditFormPopup?: (popupId: string) => void
  onCreateFormSection?: (submitAction?: CMSActionConfig) => string | undefined
  onEditFormSection?: (sectionId: string) => void
  onUpdatePopup?: (popupId: string, updater: (popup: CMSPopup) => CMSPopup) => void
  onSyncFlow?: (action: CMSActionConfig) => void
}) {
  const current = action ?? { type: "none" as const }
  const sectionOptions = getStudioSectionOptions(sections)
  const formPopups = popups.filter((popup) => popup.type === "form")
  const formSections = sections.filter((section) => section.type === "formBuilder")
  const simulatorTarget = simulators.find((item) => item.href === current.href) ?? simulators[0] ?? null
  const flowMode = current.formMode || (current.popupId ? "popup" : current.sectionId ? "section" : current.formPageHref ? "page" : "popup")
  const requiresRegistration = current.type === "simulator" && Boolean(current.popupId || current.sectionId || current.formPageHref || current.formMode)
  const selectedFlowPopup = current.popupId ? formPopups.find((popup) => popup.id === current.popupId) ?? null : null
  const selectedFlowSection = current.formMode === "section" && current.sectionId
    ? formSections.find((section) => section.id === current.sectionId) ?? null
    : null
  const effectivePostSubmitAction =
    current.postSubmitAction?.type && current.postSubmitAction.type !== "none"
      ? current.postSubmitAction
      : {
          type: "simulator" as const,
          href: current.href,
          openInNewTab: current.openInNewTab,
        }

  const emitChange = (nextAction: CMSActionConfig) => {
    onChange(nextAction)
    onSyncFlow?.(nextAction)
  }

  const updateAction = (patch: Partial<CMSActionConfig>) => {
    emitChange({ ...current, ...patch })
  }

  const handleTypeChange = (nextType: CMSActionConfig["type"]) => {
    if (!nextType || nextType === "none") {
      emitChange({ type: "none" })
      return
    }

    if (nextType === "simulator") {
      emitChange({
        type: "simulator",
        href: current.href || simulatorTarget?.href || "",
        popupId: current.popupId,
        sectionId: current.sectionId,
        formMode: requiresRegistration ? flowMode : undefined,
        formPageHref: current.formPageHref,
        postSubmitAction: current.postSubmitAction,
        skipIfRegistered: current.skipIfRegistered,
        openInNewTab: current.openInNewTab,
      })
      return
    }

    if (nextType === "popup") {
      emitChange({
        type: "popup",
        popupId: current.popupId || popups[0]?.id,
        openInNewTab: current.openInNewTab,
      })
      return
    }

    if (nextType === "section") {
      emitChange({
        type: "section",
        sectionId: current.sectionId || sectionOptions[0]?.id,
      })
      return
    }

    if (nextType === "page") {
      emitChange({
        type: "page",
        href: current.href || pages[0]?.route || "",
        openInNewTab: current.openInNewTab,
      })
      return
    }

    emitChange({
      type: "external",
      href: current.href || "",
      openInNewTab: current.openInNewTab,
    })
  }

  return (
    <Card title={title} action={<span className="text-[11px] text-muted-foreground">{getActionSummary(current)}</span>}>
      {(!current.type || current.type === "none") ? (
        <div className="mb-4 rounded-2xl border border-primary/20 bg-primary/[0.05] p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-sm font-semibold text-white">Configurar flujo</div>
              <div className="mt-1 text-xs leading-5 text-white/50">
                Define aquí lo que debe pasar al hacer clic. El flujo recomendado conecta botón, formulario y simulador sin tocar código.
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleTypeChange("simulator")}
              className="inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
            >
              Configurar flujo
            </button>
          </div>
        </div>
      ) : null}
      <div className="mb-4 rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm text-white/65">
        <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">Flujo</div>
        <div className="mt-2 grid gap-2 md:grid-cols-3">
          <div><span className="font-semibold text-white">Paso 1.</span> Elige qué debe pasar.</div>
          <div><span className="font-semibold text-white">Paso 2.</span> Define el destino.</div>
          <div><span className="font-semibold text-white">Paso 3.</span> Ajusta el comportamiento.</div>
        </div>
      </div>
      {(popups.length > 0 || sections.length > 0 || simulators.length > 0) && (
        <div className="grid gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 md:grid-cols-3">
          {popups.length > 0 ? (
            <button
              type="button"
              onClick={() => emitChange({ type: "popup", popupId: popups[0].id })}
              className="rounded-xl border border-white/8 bg-[#0b1017] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.04]"
            >
              <div className="text-xs font-semibold text-white">Popup rapido</div>
              <div className="mt-1 text-[11px] text-white/45">Usa `{popups[0].name}` como destino inicial.</div>
            </button>
          ) : null}
          {sections.length > 0 ? (
            <button
              type="button"
              onClick={() => emitChange({ type: "section", sectionId: sections[0].id })}
              className="rounded-xl border border-white/8 bg-[#0b1017] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.04]"
            >
              <div className="text-xs font-semibold text-white">Scroll a seccion</div>
              <div className="mt-1 text-[11px] text-white/45">Conecta este CTA a una seccion de la misma pagina.</div>
            </button>
          ) : null}
          {simulators.length > 0 ? (
            <button
              type="button"
              onClick={() => handleTypeChange("simulator")}
              className="rounded-xl border border-white/8 bg-[#0b1017] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.04]"
            >
              <div className="text-xs font-semibold text-white">Comenzar simulador</div>
              <div className="mt-1 text-[11px] text-white/45">Abre rapido el flujo hacia un simulador publicado.</div>
            </button>
          ) : null}
        </div>
      )}
      <F label="Tipo de accion">
        <select
          className={iCls}
          value={current.type || "none"}
          onChange={(event) => handleTypeChange(event.target.value as CMSActionConfig["type"])}
        >
          <option value="none">Ninguna</option>
          <option value="popup">Abrir popup</option>
          <option value="section">Ir a seccion</option>
          <option value="page">Ir a pagina</option>
          <option value="simulator">Abrir simulador</option>
          <option value="external">Enlace externo</option>
        </select>
      </F>

      {current.type === "popup" && (
        <F label="Popup">
          <select
            className={iCls}
            value={current.popupId || ""}
            onChange={(event) => updateAction({ popupId: event.target.value })}
          >
            <option value="">Selecciona popup</option>
            {popups.map((popup) => (
              <option key={popup.id} value={popup.id}>{popup.name}</option>
            ))}
          </select>
        </F>
      )}

      {current.type === "section" && (
        <F label="Seccion destino">
          <select
            className={iCls}
            value={current.sectionId || ""}
            onChange={(event) => updateAction({ sectionId: event.target.value })}
          >
            <option value="">Selecciona seccion</option>
            {sectionOptions.map((section) => (
              <option key={section.id} value={section.id}>{section.label}</option>
            ))}
          </select>
        </F>
      )}

      {current.type === "page" && (
        <F label="Pagina interna">
          <select
            className={iCls}
            value={current.href || ""}
            onChange={(event) => updateAction({ href: event.target.value })}
          >
            <option value="">Selecciona pagina</option>
            {pages.map((page) => (
              <option key={page.slug} value={page.route}>{page.title}</option>
            ))}
          </select>
        </F>
      )}

      {current.type === "simulator" && (
        <Card title="Wizard · Comenzar simulador">
          <div className="space-y-4">
            <F label="Paso 1 · Simulador destino">
              <select
                className={iCls}
                value={current.href || ""}
                onChange={(event) => emitChange({
                  ...current,
                  href: event.target.value,
                  postSubmitAction:
                    effectivePostSubmitAction.type === "simulator"
                      ? { ...effectivePostSubmitAction, href: event.target.value, openInNewTab: current.openInNewTab }
                      : current.postSubmitAction,
                })}
              >
                <option value="">Selecciona simulador</option>
                {simulators.map((simulator) => (
                  <option key={simulator.id} value={simulator.href}>{simulator.title}</option>
                ))}
              </select>
            </F>

            <F label="Paso 2 · Requiere registro previo">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { key: "no", label: "No" },
                  { key: "yes", label: "Si" },
                ].map((option) => {
                  const active = option.key === "yes" ? requiresRegistration : !requiresRegistration
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => {
                        if (option.key === "yes") {
                          emitChange({
                            ...current,
                            formMode: flowMode,
                            popupId: flowMode === "popup" ? current.popupId || formPopups[0]?.id || "" : undefined,
                            sectionId: flowMode === "section" ? current.sectionId || formSections[0]?.id || "" : undefined,
                            formPageHref: flowMode === "page" ? current.formPageHref || pages[0]?.route || "" : undefined,
                            postSubmitAction: current.postSubmitAction || effectivePostSubmitAction,
                          })
                          return
                        }

                        emitChange({
                          ...current,
                          popupId: undefined,
                          sectionId: undefined,
                          formPageHref: undefined,
                          formMode: undefined,
                          skipIfRegistered: undefined,
                        })
                      }}
                      className={cn(
                        "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                        active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                      )}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </F>

            {requiresRegistration ? (
              <>
                <F label="Paso 3 · ¿Como mostrar el formulario?">
                  <div className="grid gap-2 md:grid-cols-3">
                    {[
                      { key: "popup", label: "Popup" },
                      { key: "section", label: "Seccion" },
                      { key: "page", label: "Pagina" },
                    ].map((option) => {
                      const active = flowMode === option.key
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            emitChange({
                              ...current,
                              formMode: option.key as CMSActionConfig["formMode"],
                              popupId: option.key === "popup" ? current.popupId || formPopups[0]?.id || "" : undefined,
                              sectionId: option.key === "section" ? current.sectionId || formSections[0]?.id || "" : undefined,
                              formPageHref: option.key === "page" ? current.formPageHref || pages[0]?.route || "" : undefined,
                              postSubmitAction: current.postSubmitAction || effectivePostSubmitAction,
                            })
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                            active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </F>

                {flowMode === "popup" ? (
                  <Card title="Paso 4 · Formulario previo">
                    <div className="space-y-4">
                      <F label="Popup / formulario">
                        <select
                          className={iCls}
                          value={current.popupId || ""}
                          onChange={(event) => emitChange({ ...current, popupId: event.target.value, formMode: "popup" })}
                        >
                          <option value="">Selecciona popup form</option>
                          {formPopups.map((popup) => (
                            <option key={popup.id} value={popup.id}>{popup.name}</option>
                          ))}
                        </select>
                      </F>

                      <div className="grid gap-2 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            const popupId = onCreateFormPopup?.(effectivePostSubmitAction)
                            if (!popupId) return
                            emitChange({
                              ...current,
                              popupId,
                              formMode: "popup",
                              sectionId: undefined,
                              formPageHref: undefined,
                              postSubmitAction: effectivePostSubmitAction,
                            })
                          }}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Crear formulario
                        </button>
                        <button
                          type="button"
                          disabled={!selectedFlowPopup}
                          onClick={() => selectedFlowPopup && onEditFormPopup?.(selectedFlowPopup.id)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition-all hover:border-primary/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar formulario
                        </button>
                      </div>

                      {selectedFlowPopup ? (
                        <>
                          <div className="grid grid-cols-2 gap-3">
                            <F label="Nombre interno">
                              <input
                                className={iCls}
                                value={selectedFlowPopup.name}
                                onChange={(event) => onUpdatePopup?.(selectedFlowPopup.id, (popup) => ({ ...popup, name: event.target.value }))}
                              />
                            </F>
                            <F label="Boton enviar">
                              <input
                                className={iCls}
                                value={selectedFlowPopup.submitLabel || ""}
                                onChange={(event) => onUpdatePopup?.(selectedFlowPopup.id, (popup) => ({ ...popup, submitLabel: event.target.value }))}
                              />
                            </F>
                          </div>
                          <F label="Titulo">
                            <input
                              className={iCls}
                              value={selectedFlowPopup.title}
                              onChange={(event) => onUpdatePopup?.(selectedFlowPopup.id, (popup) => ({ ...popup, title: event.target.value }))}
                            />
                          </F>
                          <F label="Descripcion">
                            <textarea
                              className={tCls}
                              rows={2}
                              value={selectedFlowPopup.description}
                              onChange={(event) => onUpdatePopup?.(selectedFlowPopup.id, (popup) => ({ ...popup, description: event.target.value }))}
                            />
                          </F>
                          <PopupFieldListEditor
                            fields={selectedFlowPopup.fields ?? []}
                            onChange={(fields) => onUpdatePopup?.(selectedFlowPopup.id, (popup) => ({ ...popup, fields }))}
                          />
                        </>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                          Crea o selecciona un formulario y quedará conectado automáticamente al botón.
                        </div>
                      )}
                    </div>
                  </Card>
                ) : flowMode === "section" ? (
                  <Card title="Paso 4 · Formulario en la misma pagina">
                    <div className="space-y-4">
                      <F label="Bloque formulario">
                        <select
                          className={iCls}
                          value={current.sectionId || ""}
                          onChange={(event) => emitChange({ ...current, sectionId: event.target.value, formMode: "section" })}
                        >
                          <option value="">Selecciona formulario</option>
                          {formSections.map((section) => (
                            <option key={section.id} value={section.id}>{section.data?.titulo || "Formulario"}</option>
                          ))}
                        </select>
                      </F>
                      <div className="grid gap-2 md:grid-cols-2">
                        <button
                          type="button"
                          onClick={() => {
                            const sectionId = onCreateFormSection?.(effectivePostSubmitAction)
                            if (!sectionId) return
                            emitChange({
                              ...current,
                              formMode: "section",
                              sectionId,
                              popupId: undefined,
                              formPageHref: undefined,
                              postSubmitAction: effectivePostSubmitAction,
                            })
                          }}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                        >
                          <Plus className="h-4 w-4" />
                          Crear bloque formulario
                        </button>
                        <button
                          type="button"
                          disabled={!selectedFlowSection}
                          onClick={() => selectedFlowSection && onEditFormSection?.(selectedFlowSection.id)}
                          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition-all hover:border-primary/35 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar formulario
                        </button>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/45">
                        El formulario se mostrará dentro de la misma página. El botón hará scroll suave hasta ese bloque antes de continuar con el flujo.
                      </div>
                    </div>
                  </Card>
                ) : (
                  <Card title="Paso 4 · Pagina previa">
                    <div className="space-y-4">
                      <F label="Pagina que contiene el formulario">
                        <select
                          className={iCls}
                          value={current.formPageHref || ""}
                          onChange={(event) => emitChange({ ...current, formPageHref: event.target.value, formMode: "page" })}
                        >
                          <option value="">Selecciona pagina</option>
                          {pages.map((page) => (
                            <option key={page.slug} value={page.route}>{page.title}</option>
                          ))}
                        </select>
                      </F>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-xs leading-6 text-white/45">
                        Usa este modo si la captura de datos vive en otra página. El flujo seguirá allí y luego puedes redirigir al simulador desde ese formulario.
                      </div>
                    </div>
                  </Card>
                )}

                <Card title="Paso 5 · Despues del formulario">
                  <div className="space-y-4">
                    <div className="grid gap-2 md:grid-cols-3">
                      {[
                        { key: "simulator", label: "Ir al simulador" },
                        { key: "page", label: "Ir a pagina" },
                        { key: "section", label: "Ir a seccion" },
                      ].map((option) => {
                        const active = effectivePostSubmitAction.type === option.key
                        return (
                          <button
                            key={option.key}
                            type="button"
                            onClick={() => {
                              if (option.key === "simulator") {
                                emitChange({
                                  ...current,
                                  postSubmitAction: {
                                    type: "simulator",
                                    href: current.href,
                                    openInNewTab: current.openInNewTab,
                                  },
                                })
                                return
                              }

                              if (option.key === "page") {
                                emitChange({
                                  ...current,
                                  postSubmitAction: {
                                    type: "page",
                                    href: pages[0]?.route || "",
                                  },
                                })
                                return
                              }

                              emitChange({
                                ...current,
                                postSubmitAction: {
                                  type: "section",
                                  sectionId: sectionOptions[0]?.id || "",
                                },
                              })
                            }}
                            className={cn(
                              "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                              active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                            )}
                          >
                            {option.label}
                          </button>
                        )
                      })}
                    </div>

                    {effectivePostSubmitAction.type === "page" ? (
                      <F label="Pagina destino">
                        <select
                          className={iCls}
                          value={effectivePostSubmitAction.href || ""}
                          onChange={(event) =>
                            emitChange({
                              ...current,
                              postSubmitAction: { type: "page", href: event.target.value },
                            })
                          }
                        >
                          <option value="">Selecciona pagina</option>
                          {pages.map((page) => (
                            <option key={page.slug} value={page.route}>{page.title}</option>
                          ))}
                        </select>
                      </F>
                    ) : null}

                    {effectivePostSubmitAction.type === "section" ? (
                      <F label="Seccion destino">
                        <select
                          className={iCls}
                          value={effectivePostSubmitAction.sectionId || ""}
                          onChange={(event) =>
                            emitChange({
                              ...current,
                              postSubmitAction: { type: "section", sectionId: event.target.value },
                            })
                          }
                        >
                          <option value="">Selecciona seccion</option>
                          {sectionOptions.map((section) => (
                            <option key={section.id} value={section.id}>{section.label}</option>
                          ))}
                        </select>
                      </F>
                    ) : null}

                    <button
                      type="button"
                      onClick={() => emitChange({ ...current, skipIfRegistered: !(current.skipIfRegistered === true) })}
                      className={cn(
                        "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                        current.skipIfRegistered ? "border-primary bg-primary/10" : "border-border bg-secondary/10 hover:border-primary/35"
                      )}
                    >
                      <div>
                        <div className="text-sm font-semibold text-white">Si ya se registró, ir directo</div>
                        <div className="mt-1 text-xs text-white/45">Salta el formulario si el usuario ya dejó sus datos en esta landing.</div>
                      </div>
                      <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", current.skipIfRegistered ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                        {current.skipIfRegistered ? "Activo" : "Inactivo"}
                      </div>
                    </button>
                  </div>
                </Card>
              </>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
                <div className="font-semibold text-white">Paso 3 · Flujo directo</div>
                <div className="mt-1 text-xs leading-5 text-white/45">El botón llevará directo al simulador sin pedir registro previo.</div>
              </div>
            )}
          </div>
        </Card>
      )}

      {(current.type === "page" || current.type === "simulator" || current.type === "external") && (
        <>
          {current.type === "external" && (
            <F label="URL externa">
              <input
                className={iCls}
                value={current.href || ""}
                onChange={(event) => updateAction({ href: event.target.value })}
                placeholder="https://..."
              />
            </F>
          )}
          <button
            type="button"
            onClick={() => updateAction({ openInNewTab: !(current.openInNewTab === true) })}
            className={cn(
              "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
              current.openInNewTab === true
                ? "border-primary bg-primary/10"
                : "border-border bg-secondary/10 hover:border-primary/35"
            )}
          >
            <div>
              <div className="text-sm font-semibold text-white">Abrir en nueva pestaña</div>
              <div className="mt-1 text-xs text-white/45">Útil para enlaces externos, páginas internas separadas o simuladores en otra vista.</div>
            </div>
            <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", current.openInNewTab === true ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
              {current.openInNewTab === true ? "Activo" : "Inactivo"}
            </div>
          </button>
        </>
      )}

      {current.type === "section" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
          <div className="font-semibold text-white">Comportamiento</div>
          <div className="mt-1 text-xs leading-5 text-white/45">El editor ejecutará scroll suave automático hacia la sección seleccionada.</div>
        </div>
      )}

      {current.type === "popup" && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/65">
          <div className="font-semibold text-white">Comportamiento</div>
          <div className="mt-1 text-xs leading-5 text-white/45">Mantiene al usuario en la misma página y abre el popup configurado sobre el contenido actual.</div>
        </div>
      )}

    </Card>
  )
}

function PopupFieldListEditor({
  fields,
  onChange,
}: {
  fields: CMSFormFieldConfig[]
  onChange: (fields: CMSFormFieldConfig[]) => void
}) {
  const addField = (type: CMSFormFieldConfig["type"]) => {
    const nextField: CMSFormFieldConfig = {
      id: `popup_field_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      label: "Nuevo campo",
      placeholder: type === "checkbox" ? "Acepto la politica" : "Escribe aqui",
      required: false,
      width: type === "textarea" || type === "checkbox" ? "full" : "half",
      options: type === "select" ? ["Opcion 1", "Opcion 2"] : [],
    }
    onChange([...fields, nextField])
  }

  const updateField = (fieldId: string, patch: Partial<CMSFormFieldConfig>) => {
    onChange(fields.map((field) => field.id === fieldId ? { ...field, ...patch } : field))
  }

  const moveField = (fieldId: string, direction: -1 | 1) => {
    const index = fields.findIndex((field) => field.id === fieldId)
    const nextIndex = index + direction
    if (index === -1 || nextIndex < 0 || nextIndex >= fields.length) return
    const next = [...fields]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    onChange(next)
  }

  return (
    <Card
      title={`Campos (${fields.length})`}
      action={
        <div className="flex flex-wrap gap-2">
          {(["text", "email", "tel", "textarea", "select"] as const).map((type) => (
            <Btn key={type} size="sm" variant="ghost" onClick={() => addField(type)}>
              <Plus className="h-3.5 w-3.5" />
              {type}
            </Btn>
          ))}
        </div>
      }
    >
      {fields.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">Este popup aun no tiene campos.</p>}
      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={field.id} className="space-y-4 rounded-2xl border border-border bg-secondary/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-foreground">{field.label || `Campo ${index + 1}`}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-muted-foreground">{field.type}</div>
              </div>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => moveField(field.id, -1)} disabled={index === 0} className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowUp className="mx-auto h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => moveField(field.id, 1)} disabled={index === fields.length - 1} className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-all hover:border-primary/35 hover:text-primary disabled:opacity-30"><ArrowDown className="mx-auto h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => onChange(fields.filter((item) => item.id !== field.id))} className="h-8 w-8 rounded-lg border border-border text-muted-foreground transition-all hover:border-red-400/35 hover:text-red-400"><Trash2 className="mx-auto h-3.5 w-3.5" /></button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <F label="Etiqueta"><input className={iCls} value={field.label} onChange={(event) => updateField(field.id, { label: event.target.value })} /></F>
              <F label="Tipo">
                <select className={iCls} value={field.type} onChange={(event) => updateField(field.id, { type: event.target.value as CMSFormFieldConfig["type"] })}>
                  <option value="text">Texto</option>
                  <option value="email">Email</option>
                  <option value="tel">Telefono</option>
                  <option value="number">Numero</option>
                  <option value="textarea">Area de texto</option>
                  <option value="select">Selector</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </F>
              <F label="Placeholder / ayuda"><input className={iCls} value={field.placeholder || ""} onChange={(event) => updateField(field.id, { placeholder: event.target.value })} /></F>
              <F label="Ancho">
                <div className="flex gap-2">
                  {(["half", "full"] as const).map((width) => (
                    <button
                      key={width}
                      type="button"
                      onClick={() => updateField(field.id, { width })}
                      className={cn("flex-1 rounded-xl border px-3 py-2 text-sm font-medium transition-all", (field.width || "half") === width ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35")}
                    >
                      {width === "half" ? "1/2" : "Completo"}
                    </button>
                  ))}
                </div>
              </F>
            </div>

            <button
              type="button"
              onClick={() => updateField(field.id, { required: !field.required })}
              className={cn("flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all", field.required ? "border-primary bg-primary/10" : "border-border bg-secondary/10 hover:border-primary/35")}
            >
              <div>
                <div className="text-sm font-semibold text-white">Campo obligatorio</div>
                <div className="mt-1 text-xs text-white/45">Activalo si el usuario debe completarlo antes de enviar.</div>
              </div>
              <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", field.required ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                {field.required ? "Si" : "No"}
              </div>
            </button>

            {field.type === "select" && (
              <F label="Opciones (una por linea)">
                <textarea
                  className={tCls}
                  rows={3}
                  value={(field.options || []).join("\n")}
                  onChange={(event) => updateField(field.id, { options: event.target.value.split("\n").map((item) => item.trim()).filter(Boolean) })}
                />
              </F>
            )}
          </div>
        ))}
      </div>
    </Card>
  )
}

function StudioLayout({ config, onChange }: { config: CMSConfig; onChange: CMSChangeHandler }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const datasets = useLandingBuilderData()

  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)
  const [published, setPublished] = useState(false)
  const [leftTab, setLeftTab] = useState<StudioLeftTab>("layers")
  const [inspectorTab, setInspectorTab] = useState<StudioInspectorTab>("content")
  const [viewport, setViewport] = useState<StudioViewportMode>("desktop")
  const [desktopWidth, setDesktopWidth] = useState<1440 | 1280>(1440)
  const [zoomMode, setZoomMode] = useState<"fit" | 100 | 75 | 50>("fit")
  const [studioMode, setStudioMode] = useState<"edit" | "preview" | "review">("edit")
  const [focusMode, setFocusMode] = useState(false)
  const [focusLeftOpen, setFocusLeftOpen] = useState(false)
  const [focusRightOpen, setFocusRightOpen] = useState(false)
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false)
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false)
  const [selectedPageSlug, setSelectedPageSlug] = useState("inicio")
  const [selectedSectionId, setSelectedSectionId] = useState("")
  const [showAdd, setShowAdd] = useState(false)
  const [insertIndex, setInsertIndex] = useState<number | null>(null)
  const [componentSearch, setComponentSearch] = useState("")
  const [selectedPopupId, setSelectedPopupId] = useState("")
  const [selectedSimulatorId, setSelectedSimulatorId] = useState("")
  const [formInspectorTarget, setFormInspectorTarget] = useState<"section" | "popup" | null>(null)
  const [simulatorInspectorTarget, setSimulatorInspectorTarget] = useState<"feed" | "item" | null>(null)
  const [showNewPage, setShowNewPage] = useState(false)
  const [newTitle, setNewTitle] = useState("")
  const [newSlug, setNewSlug] = useState("")
  const [past, setPast] = useState<CMSConfig[]>([])
  const [future, setFuture] = useState<CMSConfig[]>([])
  const [isAutosaving, setIsAutosaving] = useState(false)
  const [draggingSectionId, setDraggingSectionId] = useState<string | null>(null)
  const [dropTargetId, setDropTargetId] = useState<string | null>(null)
  const mountedRef = useRef(false)
  const reviewPanelStateRef = useRef<{ left: boolean; right: boolean } | null>(null)

  // ---- HTML editor bridge (shared by canvas iframe + inspector panel) ----
  const [htmlEl, setHtmlEl] = useState<EditorElementInfo | null>(null)
  const [htmlEditing, setHtmlEditing] = useState(false)
  const htmlIframeRef = useRef<HTMLIFrameElement | null>(null)
  const htmlSnapshotTimerRef = useRef<number | null>(null)
  const lastHtmlSnapshotRef = useRef<string>("")
  const selectedHtmlEidRef = useRef<string>("")

  const handleChange = (next: CMSConfig | ((current: CMSConfig) => CMSConfig), trackHistory = true) => {
    if (trackHistory) {
      setPast((current) => [...current.slice(-39), cloneCMSConfigState(config)])
      setFuture([])
    }
    onChange(next)
    setChanged(true)
    setSaved(false)
    setPublished(false)
  }

  const handleUndo = () => {
    if (!past.length) return
    const previous = past[past.length - 1]
    setPast((current) => current.slice(0, -1))
    setFuture((current) => [cloneCMSConfigState(config), ...current.slice(0, 39)])
    onChange(previous)
    setChanged(true)
    setSaved(false)
    setPublished(false)
  }

  const handleRedo = () => {
    if (!future.length) return
    const [next, ...rest] = future
    setFuture(rest)
    setPast((current) => [...current.slice(-39), cloneCMSConfigState(config)])
    onChange(next)
    setChanged(true)
    setSaved(false)
    setPublished(false)
  }

  const handleSave = () => {
    setIsAutosaving(false)
    saveCMSConfig(config, "draft")
    setSaved(true)
    setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePublish = () => {
    publishCMSConfig(config)
    setSaved(true)
    setChanged(false)
    setPublished(true)
    setTimeout(() => setPublished(false), 2500)
  }

  const pages = useMemo<StudioPageRecord[]>(() => [
    {
      slug: "inicio",
      title: "Inicio",
      route: "/",
      home: true,
      builtin: true,
      showInNav: true,
      navLabel: "Inicio",
      sections: config.sections,
    },
    ...(config.pages ?? []).map((page) => ({
      slug: page.slug,
      title: page.title,
      route: `/${page.slug}`,
      sections: page.sections,
      builtin: page.builtin,
      showInNav: page.showInNav,
      navLabel: page.navLabel,
    })),
  ], [config])

  useEffect(() => {
    const requested = sanitizeStudioSlug(searchParams.get("page") ?? "") || "inicio"
    const nextSlug = pages.some((page) => page.slug === requested) ? requested : "inicio"
    setSelectedPageSlug((current) => (current === nextSlug ? current : nextSlug))
  }, [pages, searchParams])

  const currentPage = pages.find((page) => page.slug === selectedPageSlug) ?? pages[0]
  const currentSections = currentPage?.sections ?? []
  const selectedSection = currentSections.find((section) => section.id === selectedSectionId) ?? null
  const studioAssets = useMemo(() => getStudioAssets(currentSections), [currentSections])
  const selectedPopup = config.popups.find((popup) => popup.id === selectedPopupId) ?? config.popups[0] ?? null
  const simulatorActionOptions = useMemo(
    () => [...datasets.simulators, ...datasets.evaluations].map((item) => ({ id: item.id, title: item.title, href: item.href })),
    [datasets.evaluations, datasets.simulators]
  )
  const studioSimulatorItems = useMemo(
    () => [
      ...datasets.simulators.map((item) => ({ ...item, kind: "Simulador" as const })),
      ...datasets.evaluations.map((item) => ({ ...item, kind: "Evaluacion" as const })),
    ],
    [datasets.evaluations, datasets.simulators]
  )
  const selectedSimulator = studioSimulatorItems.find((item) => item.id === selectedSimulatorId) ?? studioSimulatorItems[0] ?? null
  const selectedFormSection =
    formInspectorTarget !== "popup" && selectedSection?.type === "formBuilder" ? selectedSection : null
  const selectedFormPopup =
    formInspectorTarget === "popup"
      ? config.popups.find((popup) => popup.id === selectedPopupId && popup.type === "form") ?? null
      : null
  const selectedFeedSection =
    simulatorInspectorTarget !== "item" && selectedSection && ["simulatorsFeed", "coursesFeed", "evaluationsFeed"].includes(selectedSection.type)
      ? selectedSection
      : null
  const selectedHtmlActionBinding = useMemo(() => {
    if (selectedSection?.type !== "customCode" || !htmlEl?.eid) return null
    const bindings = ((selectedSection.data?.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? [])
    return bindings.find((binding) => binding.eid === htmlEl.eid) ?? null
  }, [selectedSection, htmlEl?.eid])

  useEffect(() => {
    if (!mountedRef.current) {
      mountedRef.current = true
      return
    }
    if (!changed) return

    setIsAutosaving(true)
    const timer = window.setTimeout(() => {
      saveCMSConfig(config, "draft")
      setIsAutosaving(false)
      setSaved(true)
      setChanged(false)
      window.setTimeout(() => setSaved(false), 1800)
    }, 1500)

    return () => window.clearTimeout(timer)
  }, [changed, config])

  useEffect(() => {
    if (!currentSections.length) {
      if (selectedSectionId) setSelectedSectionId("")
      return
    }
    if (!currentSections.some((section) => section.id === selectedSectionId)) {
      setSelectedSectionId(currentSections[0].id)
    }
  }, [currentSections, selectedSectionId])

  useEffect(() => {
    return () => {
      if (htmlSnapshotTimerRef.current) {
        window.clearTimeout(htmlSnapshotTimerRef.current)
      }
    }
  }, [])

  useEffect(() => {
    lastHtmlSnapshotRef.current = selectedSection?.type === "customCode" ? String(selectedSection.data?.html || "") : ""
  }, [selectedSection?.id, selectedSection?.type, selectedSection?.data?.html])

  useEffect(() => {
    selectedHtmlEidRef.current = htmlEl?.eid || ""
  }, [htmlEl?.eid])

  useEffect(() => {
    if (!focusMode || studioMode !== "edit") {
      setFocusLeftOpen(false)
      setFocusRightOpen(false)
      return
    }

    setFocusRightOpen(true)
  }, [focusMode, studioMode])

  useEffect(() => {
    if (!focusMode || studioMode !== "edit") return
    if (selectedSectionId || htmlEl?.eid || htmlEditing) {
      setFocusRightOpen(true)
    }
  }, [focusMode, studioMode, selectedSectionId, htmlEl?.eid, htmlEditing])

  useEffect(() => {
    if (selectedSection?.type !== "customCode" || !htmlEl) return
    const html = String(htmlEl.html || "").toLowerCase()
    const classes = String(htmlEl.classes || "").toLowerCase()
    const text = String(htmlEl.text || "").trim()
    const looksLikeIcon =
      htmlEl.tag === "svg" ||
      ["path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "g", "use"].includes(htmlEl.tag) ||
      !!htmlEl.attrs?.dataIcon ||
      classes.includes("he-inline-icon") ||
      classes.includes("lucide") ||
      (html.includes("<svg") && text.length <= 2) ||
      (/^\p{Emoji}+$/u.test(text) && text.length <= 8)

    if (looksLikeIcon && inspectorTab !== "content") {
      setInspectorTab("content")
    }
  }, [htmlEl, inspectorTab, selectedSection?.type])

  useEffect(() => {
    if (selectedSection?.type !== "customCode") return
    if (!htmlEl && !htmlEditing) return
    if (leftTab !== "layers") setLeftTab("layers")
    if (rightPanelCollapsed) setRightPanelCollapsed(false)
    if (inspectorTab === "style" || inspectorTab !== "content" && inspectorTab !== "actions" && inspectorTab !== "advanced") {
      setInspectorTab("content")
    }
  }, [htmlEditing, htmlEl, inspectorTab, leftTab, rightPanelCollapsed, selectedSection?.type])

  useEffect(() => {
    if (selectedSection?.type === "customCode" && inspectorTab === "style") {
      setInspectorTab("content")
    }
  }, [inspectorTab, selectedSection?.type])

  useEffect(() => {
    if (leftTab === "navigation" && inspectorTab !== "content") {
      setInspectorTab("content")
      return
    }
    if ((leftTab === "pages" || leftTab === "settings") && inspectorTab === "actions") {
      setInspectorTab("content")
    }
  }, [leftTab, inspectorTab])

  useEffect(() => {
    if (!selectedSection && leftTab === "layers" && inspectorTab !== "advanced") {
      setInspectorTab("advanced")
    }
  }, [inspectorTab, leftTab, selectedSection])

  useEffect(() => {
    if (!config.popups.length) {
      if (selectedPopupId) setSelectedPopupId("")
      return
    }
    if (!config.popups.some((popup) => popup.id === selectedPopupId)) {
      setSelectedPopupId(config.popups[0].id)
    }
  }, [config.popups, selectedPopupId])

  useEffect(() => {
    if (!studioSimulatorItems.length) {
      if (selectedSimulatorId) setSelectedSimulatorId("")
      return
    }
    if (!studioSimulatorItems.some((item) => item.id === selectedSimulatorId)) {
      setSelectedSimulatorId(studioSimulatorItems[0].id)
    }
  }, [selectedSimulatorId, studioSimulatorItems])

  useEffect(() => {
    if (studioMode === "review") {
      if (!reviewPanelStateRef.current) {
        reviewPanelStateRef.current = { left: leftPanelCollapsed, right: rightPanelCollapsed }
      }
      if (!leftPanelCollapsed) setLeftPanelCollapsed(true)
      if (!rightPanelCollapsed) setRightPanelCollapsed(true)
      return
    }

    if (reviewPanelStateRef.current) {
      setLeftPanelCollapsed(reviewPanelStateRef.current.left)
      setRightPanelCollapsed(reviewPanelStateRef.current.right)
      reviewPanelStateRef.current = null
    }
  }, [studioMode])

  useEffect(() => {
    if (leftTab === "forms" && selectedSection?.type === "formBuilder") {
      setFormInspectorTarget("section")
    }
  }, [leftTab, selectedSection])

  useEffect(() => {
    if (leftTab === "simulators" && selectedSection && ["simulatorsFeed", "coursesFeed", "evaluationsFeed"].includes(selectedSection.type)) {
      setSimulatorInspectorTarget("feed")
    }
  }, [leftTab, selectedSection])

  const syncStudioRoute = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (!slug || slug === "inicio") params.delete("page")
    else params.set("page", slug)
    const nextQuery = params.toString()
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
  }

  const activatePage = (slug: string, nextTab: StudioLeftTab = leftTab) => {
    setSelectedPageSlug(slug)
    setLeftTab(nextTab)
    syncStudioRoute(slug)
  }

  const updateActiveSections = (
    sections: CMSSection[] | ((sections: CMSSection[]) => CMSSection[]),
    trackHistory = true
  ) => {
    handleChange((currentConfig) => {
      const activeSections = currentPage.home
        ? currentConfig.sections
        : (currentConfig.pages ?? []).find((page) => page.slug === currentPage.slug)?.sections ?? []
      const resolvedSections = typeof sections === "function" ? sections(activeSections) : sections

      if (currentPage.home) {
        return { ...currentConfig, sections: resolvedSections }
      }

      return {
        ...currentConfig,
        pages: (currentConfig.pages ?? []).map((page) =>
          page.slug === currentPage.slug ? { ...page, sections: resolvedSections } : page
        ),
      }
    }, trackHistory)
  }

  const handleHtmlElementSelect = useCallback((info: EditorElementInfo | null) => {
    const nextEid = info?.eid || ""
    const didChangeTarget = nextEid !== selectedHtmlEidRef.current
    selectedHtmlEidRef.current = nextEid
    setHtmlEl(info)
    setHtmlEditing(false)
    setLeftTab("layers")
    setRightPanelCollapsed(false)
    if (info) {
      if (didChangeTarget) {
        setInspectorTab("content")
      }
    }
  }, [])

  const handleHtmlEditingChange = useCallback((editing: boolean) => {
    setHtmlEditing(editing)
    if (editing) {
      setLeftTab("layers")
      setRightPanelCollapsed(false)
      setInspectorTab("content")
    }
  }, [])

  const handleHtmlSnapshot = useCallback((nextHtml: string) => {
    if (selectedSection?.type !== "customCode") return
    const resolvedHtml = String(nextHtml || "")
    if (!resolvedHtml) return
    const currentHtml = String(selectedSection.data?.html || "")
    if (resolvedHtml === currentHtml || resolvedHtml === lastHtmlSnapshotRef.current) return

    if (htmlSnapshotTimerRef.current) {
      window.clearTimeout(htmlSnapshotTimerRef.current)
    }

    const sectionId = selectedSection.id
    htmlSnapshotTimerRef.current = window.setTimeout(() => {
      lastHtmlSnapshotRef.current = resolvedHtml
      updateActiveSections(
        (sections) =>
          sections.map((section) =>
            section.id === sectionId
              ? { ...section, data: { ...(section.data ?? {}), html: resolvedHtml } }
              : section
          ),
        true
      )
    }, 280)
  }, [selectedSection?.data, selectedSection?.id, selectedSection?.type, updateActiveSections])

  useEffect(() => {
    if (selectedSection?.type !== "customCode") return
    const eid = selectedHtmlEidRef.current
    const frameWindow = htmlIframeRef.current?.contentWindow
    if (!eid || !frameWindow) return

    const timer = window.setTimeout(() => {
      frameWindow.postMessage({ __editor_cmd: true, cmd: "highlight", eid }, "*")
    }, 80)

    return () => window.clearTimeout(timer)
  }, [selectedSection?.id, selectedSection?.type, selectedSection?.data?.html])

  const addSection = (type: CMSSectionType) => {
    const nextSection: CMSSection = {
      id: `${type}_${Date.now()}`,
      type,
      visible: true,
      data: DEFAULTS[type] ? JSON.parse(JSON.stringify(DEFAULTS[type])) : {},
      settings: getDefaultSectionSettings(type),
    }

    const next = [...currentSections]
    const targetIndex = insertIndex == null ? next.length : Math.max(0, Math.min(insertIndex, next.length))
    next.splice(targetIndex, 0, nextSection)
    updateActiveSections(next)
    setInsertIndex(null)
    setShowAdd(false)
    setLeftTab("layers")
    setInspectorTab("content")
    setRightPanelCollapsed(false)
    setSelectedSectionId(nextSection.id)
  }

  const createImportedSection = (
    type: CMSSectionType,
    data: Record<string, any>,
    options?: { afterSectionId?: string; targetIndex?: number }
  ) => {
    const nextSection: CMSSection = {
      id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type,
      visible: true,
      data,
      settings: getDefaultSectionSettings(type),
    }

    const next = [...currentSections]
    const targetIndex = (() => {
      if (typeof options?.targetIndex === "number") {
        return Math.max(0, Math.min(options.targetIndex, next.length))
      }
      if (options?.afterSectionId) {
        const afterIndex = next.findIndex((section) => section.id === options.afterSectionId)
        if (afterIndex !== -1) return afterIndex + 1
      }
      return insertIndex == null ? next.length : Math.max(0, Math.min(insertIndex, next.length))
    })()

    next.splice(targetIndex, 0, nextSection)
    updateActiveSections(next)
    setInsertIndex(null)
    setShowAdd(false)
    setLeftTab("layers")
    setInspectorTab("content")
    setRightPanelCollapsed(false)
    setSelectedSectionId(nextSection.id)
  }

  const moveSection = (id: string, dir: -1 | 1) => {
    const index = currentSections.findIndex((section) => section.id === id)
    const nextIndex = index + dir
    if (index === -1 || nextIndex < 0 || nextIndex >= currentSections.length) return
    const next = [...currentSections]
    ;[next[index], next[nextIndex]] = [next[nextIndex], next[index]]
    updateActiveSections(next)
  }

  const reorderSectionByDrop = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return
    const sourceIndex = currentSections.findIndex((section) => section.id === sourceId)
    const targetIndex = currentSections.findIndex((section) => section.id === targetId)
    if (sourceIndex === -1 || targetIndex === -1) return
    const next = [...currentSections]
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    updateActiveSections(next)
  }

  const reorderSectionToIndex = (sourceId: string, targetIndex: number) => {
    if (!sourceId) return
    const sourceIndex = currentSections.findIndex((section) => section.id === sourceId)
    if (sourceIndex === -1) return

    const next = [...currentSections]
    const [moved] = next.splice(sourceIndex, 1)
    const rawTargetIndex = Math.max(0, Math.min(targetIndex, currentSections.length))
    const adjustedIndex = sourceIndex < rawTargetIndex ? rawTargetIndex - 1 : rawTargetIndex
    next.splice(Math.max(0, Math.min(adjustedIndex, next.length)), 0, moved)
    updateActiveSections(next)
    setSelectedSectionId(sourceId)
  }

  const toggleSectionVisibility = (id: string) => {
    updateActiveSections(
      currentSections.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section
      )
    )
  }

  const duplicateSectionInPage = (id: string) => {
    const index = currentSections.findIndex((section) => section.id === id)
    if (index === -1) return
    const copy = duplicateCMSSection(currentSections[index])
    const next = [...currentSections]
    next.splice(index + 1, 0, copy)
    updateActiveSections(next)
    setLeftTab("layers")
    setInspectorTab("content")
    setRightPanelCollapsed(false)
    setSelectedSectionId(copy.id)
  }

  const deleteSection = (id: string) => {
    const target = currentSections.find((section) => section.id === id)
    if (!target) return
    if (!confirm(`Eliminar el bloque "${getStudioSectionMeta(target.type).label ?? target.type}"?`)) return
    const next = currentSections.filter((section) => section.id !== id)
    updateActiveSections(next)
    if (selectedSectionId === id) setSelectedSectionId(next[0]?.id ?? "")
  }

  const updateSelectedSectionData = (data: Record<string, any>) => {
    if (!selectedSection) return
    updateActiveSections((sections) =>
      sections.map((section) => (section.id === selectedSection.id ? { ...section, data } : section))
    )
  }

  const updateSelectedSectionStyle = (style: CMSSectionStyle) => {
    if (!selectedSection) return
    updateActiveSections((sections) =>
      sections.map((section) => (section.id === selectedSection.id ? { ...section, style } : section))
    )
  }

  const updateSelectedSectionSettings = (settings: CMSSectionSettings) => {
    if (!selectedSection) return
    updateActiveSections((sections) =>
      sections.map((section) => (section.id === selectedSection.id ? { ...section, settings } : section))
    )
  }

  const updateHomeHeroAction = (slot: "primaryAction" | "secondaryAction", action: CMSActionConfig) => {
    handleChange((currentConfig) => ({
      ...currentConfig,
      hero: {
        ...currentConfig.hero,
        [slot]: action,
      },
    }))
  }

  const updateSelectedSectionAction = (
    slot: "primaryAction" | "secondaryAction" | "ctaAction" | "submitAction",
    action: CMSActionConfig
  ) => {
    if (!selectedSection) return
    updateSelectedSectionData({
      ...(selectedSection.data ?? {}),
      [slot]: action,
    })
  }

  const updateSelectedHtmlActionBinding = (action: CMSActionConfig) => {
    if (selectedSection?.type !== "customCode" || !htmlEl?.eid) return

    const currentBindings = ((selectedSection.data?.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? [])
    const label = htmlEl.text?.trim() || htmlEl.attrs?.href || `${htmlEl.tag} ${currentBindings.length + 1}`
    const href = htmlEl.attrs?.href || undefined
    const nextBindings = currentBindings.some((binding) => binding.eid === htmlEl.eid)
      ? currentBindings.map((binding) =>
          binding.eid === htmlEl.eid
            ? { ...binding, label, tag: htmlEl.tag, href, action }
            : binding
        )
      : [
          ...currentBindings,
          {
            id: `html_action_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            eid: htmlEl.eid,
            label,
            tag: htmlEl.tag,
            href,
            action,
          },
        ]

    updateSelectedSectionData({
      ...(selectedSection.data ?? {}),
      actionBindings: nextBindings,
    })
  }

  const removeSelectedHtmlActionBinding = () => {
    if (selectedSection?.type !== "customCode" || !htmlEl?.eid) return
    const currentBindings = ((selectedSection.data?.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? [])
    updateSelectedSectionData({
      ...(selectedSection.data ?? {}),
      actionBindings: currentBindings.filter((binding) => binding.eid !== htmlEl.eid),
    })
  }

  const getConnectedSubmitAction = (action?: CMSActionConfig): CMSActionConfig => {
    if (action?.postSubmitAction?.type && action.postSubmitAction.type !== "none") {
      return action.postSubmitAction
    }

    return {
      type: "simulator",
      href: action?.href,
      openInNewTab: action?.openInNewTab,
    }
  }

  const addPopup = (
    type: CMSPopup["type"] = "form",
    options?: {
      preset?: Partial<CMSPopup>
      focusTab?: StudioLeftTab
      selectForForms?: boolean
    }
  ) => {
    const nextPopup: CMSPopup = {
      id: `popup_${Date.now()}`,
      name: options?.preset?.name || (type === "form" ? "Popup formulario" : "Popup informativo"),
      type,
      title: options?.preset?.title || (type === "form" ? "Registro previo" : "Mas informacion"),
      description: options?.preset?.description || (type === "form" ? "Completa tus datos para continuar." : "Configura este popup desde el Studio."),
      submitLabel: options?.preset?.submitLabel || "Continuar",
      successTitle: options?.preset?.successTitle || "Datos recibidos",
      successMessage: options?.preset?.successMessage || "Tu informacion fue registrada.",
      fields: options?.preset?.fields || (type === "form"
        ? [
            { id: `popup_field_${Date.now()}_1`, type: "text", label: "Nombre completo", placeholder: "Escribe tu nombre", required: true, width: "half" },
            { id: `popup_field_${Date.now()}_2`, type: "email", label: "Correo", placeholder: "correo@dominio.com", required: true, width: "half" },
          ]
        : []),
      primaryLabel: options?.preset?.primaryLabel ?? (type === "info" ? "Continuar" : undefined),
      secondaryLabel: options?.preset?.secondaryLabel ?? (type === "info" ? "Cancelar" : undefined),
      primaryAction: options?.preset?.primaryAction || { type: "none" },
      secondaryAction: options?.preset?.secondaryAction || { type: "none" },
      submitAction: options?.preset?.submitAction || { type: "none" },
    }

    handleChange((currentConfig) => ({
      ...currentConfig,
      popups: [...currentConfig.popups, nextPopup],
    }))
    setLeftTab(options?.focusTab || "popups")
    setSelectedPopupId(nextPopup.id)
    if (options?.selectForForms) {
      setFormInspectorTarget("popup")
    }
    setInspectorTab("content")
    setRightPanelCollapsed(false)
    return nextPopup.id
  }

  const updatePopup = (popupId: string, updater: (popup: CMSPopup) => CMSPopup) => {
    handleChange((currentConfig) => ({
      ...currentConfig,
      popups: currentConfig.popups.map((popup) => (popup.id === popupId ? updater(popup) : popup)),
    }))
  }

  const createConnectedFormPopup = (submitAction?: CMSActionConfig) => {
    const resolvedSubmitAction = submitAction?.type && submitAction.type !== "none" ? submitAction : { type: "none" as const }
    return addPopup("form", {
      focusTab: leftTab,
      preset: {
        name: "Formulario conectado",
        title: "Registro previo",
        description: "Completa tus datos para continuar al simulador.",
        submitLabel: "Continuar",
        successTitle: "Registro guardado",
        successMessage: "Tus datos fueron registrados correctamente.",
        submitAction: resolvedSubmitAction,
        fields: [
          { id: `popup_field_${Date.now()}_1`, type: "text", label: "Nombre completo", placeholder: "Escribe tu nombre", required: true, width: "half" },
          { id: `popup_field_${Date.now()}_2`, type: "email", label: "Correo", placeholder: "correo@dominio.com", required: true, width: "half" },
          { id: `popup_field_${Date.now()}_3`, type: "tel", label: "Telefono", placeholder: "0999999999", required: false, width: "full" },
        ],
      },
    })
  }

  const createConnectedFormSection = (submitAction?: CMSActionConfig) => {
    const nextSection: CMSSection = {
      id: `formBuilder_${Date.now()}`,
      type: "formBuilder",
      visible: true,
      data: {
        ...JSON.parse(JSON.stringify(DEFAULTS.formBuilder)),
        titulo: "Formulario conectado",
        descripcion: "Captura el registro antes de continuar al simulador.",
        submitAction: submitAction?.type && submitAction.type !== "none" ? submitAction : { type: "none" },
      },
      settings: getDefaultSectionSettings("formBuilder"),
    }

    handleChange((currentConfig) => ({
      ...currentConfig,
      pages: (currentConfig.pages ?? []).map((page) =>
        page.slug === currentPage.slug
          ? { ...page, sections: [...page.sections, nextSection] }
          : page
      ),
    }))
    return nextSection.id
  }

  const openPopupFormEditor = (popupId: string) => {
    setSelectedPopupId(popupId)
    setSelectedSectionId("")
    setLeftTab("forms")
    setFormInspectorTarget("popup")
    setInspectorTab("content")
    setRightPanelCollapsed(false)
  }

  const openSectionFormEditor = (sectionId: string) => {
    setSelectedSectionId(sectionId)
    setLeftTab("forms")
    setFormInspectorTarget("section")
    setInspectorTab("content")
    setRightPanelCollapsed(false)
  }

  const syncConnectedFlow = (action: CMSActionConfig) => {
    if (action.type !== "simulator") return

    const submitAction = getConnectedSubmitAction(action)
    if (action.popupId) {
      updatePopup(action.popupId, (popup) => ({
        ...popup,
        submitAction,
      }))
    }

    if (action.formMode === "section" && action.sectionId) {
      updateActiveSections((sections) =>
        sections.map((section) =>
          section.id === action.sectionId && section.type === "formBuilder"
            ? {
                ...section,
                data: {
                  ...(section.data ?? {}),
                  submitAction,
                },
              }
            : section
        )
      )
    }
  }

  const deletePopup = (popupId: string) => {
    const popup = config.popups.find((entry) => entry.id === popupId)
    if (!popup) return
    if (!confirm(`Eliminar el popup "${popup.name}"?`)) return
    const nextPopups = config.popups.filter((entry) => entry.id !== popupId)
    handleChange({
      ...config,
      popups: nextPopups,
    })
    setSelectedPopupId(nextPopups[0]?.id ?? "")
  }

  const updateSectionInlineContent = (sectionId: string, patch: Record<string, any>) => {
    const target = currentSections.find((section) => section.id === sectionId)
    if (!target) return

    if (currentPage.home && target.type === "hero") {
      handleChange({
        ...config,
        hero: {
          ...config.hero,
          ...patch,
        },
      })
      return
    }

    updateActiveSections(
      currentSections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              data: {
                ...(section.data ?? {}),
                ...patch,
              },
            }
          : section
      )
    )
  }

  const updateCurrentPageMeta = (patch: Partial<CMSPage>) => {
    if (currentPage.home) return
    handleChange((currentConfig) => ({
      ...currentConfig,
      nav: typeof patch.slug === "string"
        ? {
            ...currentConfig.nav,
            items: currentConfig.nav.items.map((item) =>
              item.href === `/${currentPage.slug}`
                ? { ...item, href: `/${patch.slug}` }
                : item
            ),
          }
        : currentConfig.nav,
      pages: (currentConfig.pages ?? []).map((page) => {
        if (page.slug !== currentPage.slug) return page

        const shouldSyncNavLabel = typeof patch.title === "string" && (!page.navLabel || page.navLabel === page.title)

        return {
          ...page,
          ...patch,
          ...(shouldSyncNavLabel ? { navLabel: patch.title } : {}),
        }
      }),
    }))
  }

  const duplicatePage = (slug: string) => {
    const base = (config.pages ?? []).find((page) => page.slug === slug)
    if (!base) return

    let nextSlug = `${slug}-copia`
    let counter = 2
    while (pages.some((page) => page.slug === nextSlug)) {
      nextSlug = `${slug}-copia-${counter}`
      counter += 1
    }

    const nextPage: CMSPage = {
      ...base,
      builtin: false,
      slug: nextSlug,
      title: `${base.title} copia`,
      showInNav: base.showInNav ?? true,
      navLabel: base.navLabel ? `${base.navLabel} copia` : `${base.title} copia`,
      sections: base.sections.map((section) => duplicateCMSSection(section)),
    }

    handleChange({
      ...config,
      pages: [...(config.pages ?? []), nextPage],
    })
    activatePage(nextSlug, "pages")
    setSelectedSectionId(nextPage.sections[0]?.id ?? "")
    setInspectorTab("content")
  }

  const deletePage = (slug: string) => {
    const page = (config.pages ?? []).find((item) => item.slug === slug)
    if (!page) return
    if (!confirm(`Eliminar la pagina "/${slug}"?`)) return

    handleChange({
      ...config,
      nav: {
        ...config.nav,
        items: config.nav.items.filter((item) => item.href !== `/${slug}`),
      },
      pages: (config.pages ?? []).filter((item) => item.slug !== slug),
    })

    if (selectedPageSlug === slug) {
      setSelectedSectionId("")
      activatePage("inicio", "pages")
    }
  }

  const createPage = () => {
    const title = newTitle.trim()
    const slug = sanitizeStudioSlug(newSlug || newTitle)
    if (!title || !slug || slug === "inicio") return
    if (pages.some((page) => page.slug === slug)) return

    handleChange({
      ...config,
      pages: [...(config.pages ?? []), { slug, title, sections: [], showInNav: true, navLabel: title }],
    })

    setShowNewPage(false)
    setNewTitle("")
    setNewSlug("")
    setSelectedSectionId("")
    activatePage(slug, "pages")
    setInspectorTab("content")
  }

  const currentPageTitle = currentPage?.title ?? "Studio"
  const currentRoute = currentPage?.route ?? "/"
  const selectedSectionMeta = selectedSection ? getStudioSectionMeta(selectedSection.type) : null
  const SelectedSectionIcon = selectedSectionMeta?.icon
  const reviewModeActive = studioMode === "review"
  const focusEditingMode = focusMode && studioMode === "edit"
  const canvasOnlyMode = reviewModeActive || focusMode
  const inspectorTabs =
    selectedSection?.type === "customCode"
      ? CUSTOM_CODE_INSPECTOR_TABS
      : STUDIO_INSPECTOR_TABS
  const activeLeftTabMeta = STUDIO_LEFT_TABS.find((tabItem) => tabItem.id === leftTab) ?? STUDIO_LEFT_TABS[1]

  const renderInspectorCollapseAction = () => (
    <button
      type="button"
      onClick={() => {
        if (focusEditingMode) {
          setFocusRightOpen(false)
          return
        }
        setRightPanelCollapsed(true)
      }}
      className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/45 transition-all hover:border-white/20 hover:text-white"
      aria-label={focusEditingMode ? "Ocultar inspector flotante" : "Ocultar inspector"}
      title={focusEditingMode ? "Ocultar inspector flotante" : "Ocultar inspector"}
    >
      <ChevronRight className="h-4 w-4" />
    </button>
  )

  const renderInspectorTabsRow = ({
    disableAll = false,
    contentOnly = false,
    onlyAdvanced = false,
  }: {
    disableAll?: boolean
    contentOnly?: boolean
    onlyAdvanced?: boolean
  } = {}) => (
    <div className={cn("grid gap-1 border-b border-white/8 px-4 py-3", onlyAdvanced ? "grid-cols-1" : inspectorTabs.length === 3 ? "grid-cols-3" : "grid-cols-4")}>
      {(onlyAdvanced ? inspectorTabs.filter((tabItem) => tabItem.id === "advanced") : inspectorTabs).map((tabItem) => {
        const disabled = (disableAll && tabItem.id !== "advanced") || (contentOnly && tabItem.id !== "content")
        return (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => {
              if (disabled) return
              setInspectorTab(tabItem.id)
            }}
            disabled={disabled}
            title={tabItem.label}
            className={cn(
              "inline-flex min-w-0 items-center justify-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-all disabled:cursor-not-allowed disabled:opacity-35",
              inspectorTab === tabItem.id ? "bg-white/10 text-white shadow-sm" : "text-white/40 hover:text-white/70"
            )}
          >
            <tabItem.icon className="h-3.5 w-3.5 flex-shrink-0" />
            <span className="truncate">{tabItem.shortLabel}</span>
          </button>
        )
      })}
    </div>
  )

  const renderCollapsedInspectorRail = () => (
    <div className="flex h-full flex-col items-center gap-3 px-2 py-3">
      <button
        type="button"
        onClick={() => setRightPanelCollapsed(false)}
        className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:text-white"
        aria-label="Abrir inspector"
        title="Abrir inspector"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8 bg-[#101926] text-primary">
        {SelectedSectionIcon ? <SelectedSectionIcon className="h-5 w-5" /> : <Pencil className="h-5 w-5" />}
      </div>

      <div className="grid w-full gap-2">
        {(!selectedSection ? inspectorTabs.filter((tabItem) => tabItem.id === "advanced") : inspectorTabs).map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => {
              setInspectorTab(tabItem.id)
              setRightPanelCollapsed(false)
            }}
            className={cn(
              "inline-flex h-11 w-full items-center justify-center rounded-2xl border transition-all",
              inspectorTab === tabItem.id
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-white/8 bg-white/[0.03] text-white/45 hover:text-white/70"
            )}
            aria-label={tabItem.label}
            title={tabItem.label}
          >
            <tabItem.icon className="h-4 w-4" />
          </button>
        ))}
      </div>

      <div className="mt-auto text-center">
        <div className="text-[10px] uppercase tracking-[0.24em] text-white/25">
          {selectedSection ? "Bloque" : "Panel"}
        </div>
        <div className="mt-1 text-[11px] font-medium text-white/55 [writing-mode:vertical-rl] rotate-180">
          {selectedSectionMeta?.label ?? "Inspector"}
        </div>
      </div>
    </div>
  )

  const openFocusLeftTab = (tab: StudioLeftTab) => {
    setLeftTab(tab)
    setFocusLeftOpen((current) => (leftTab === tab ? !current : true))
  }

  const openFocusInspectorTab = (tab: StudioInspectorTab) => {
    setInspectorTab(tab)
    setFocusRightOpen(true)
  }

  const renderLeftIconRail = () => (
    <div className="flex h-full w-[64px] flex-shrink-0 flex-col items-center gap-2 border-r border-white/8 bg-[#050c16] px-2 py-3">
      <button
        type="button"
        onClick={() => setLeftPanelCollapsed((value) => !value)}
        className="inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/50 transition-all hover:border-white/20 hover:text-white"
        aria-label={leftPanelCollapsed ? "Abrir panel izquierdo" : "Colapsar panel izquierdo"}
        title={leftPanelCollapsed ? "Abrir panel izquierdo" : "Colapsar panel izquierdo"}
      >
        {leftPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="mt-2 grid w-full gap-2">
        {STUDIO_LEFT_TABS.map((tabItem) => (
          <button
            key={tabItem.id}
            type="button"
            onClick={() => {
              setLeftTab(tabItem.id)
              setLeftPanelCollapsed(false)
            }}
            className={cn(
              "inline-flex h-11 w-full flex-col items-center justify-center gap-1 rounded-2xl border transition-all",
              leftTab === tabItem.id
                ? "border-primary/45 bg-primary/10 text-primary"
                : "border-white/8 bg-white/[0.03] text-white/45 hover:text-white/70"
            )}
            aria-label={tabItem.label}
            title={tabItem.label}
          >
            <tabItem.icon className="h-4 w-4" />
            <span className="text-[10px] font-medium leading-none">{tabItem.label.slice(0, 3)}</span>
          </button>
        ))}
      </div>
    </div>
  )

  const renderPagesSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Paginas</div>
          <div className="text-sm font-semibold text-white">Sitio publicado</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{pages.length}</span>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {pages.map((page) => (
          <div
            key={page.slug}
            role="button"
            tabIndex={0}
            onClick={() => activatePage(page.slug, "pages")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") activatePage(page.slug, "pages") }}
            className={cn(
              "group w-full rounded-2xl border px-3 py-3 text-left transition-all cursor-pointer",
              selectedPageSlug === page.slug
                ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]"
                : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
            )}
          >
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-[#0b1017] text-white/45">
                <Globe className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-white">{page.title}</div>
                  {page.home && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Home</span>}
                  {!page.home && page.showInNav !== false && <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Menu</span>}
                </div>
                <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/35">{page.route}</div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
              <a href={page.route} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-primary/30 hover:text-primary">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
              {!page.home && (
                <button type="button" onClick={(event) => { event.stopPropagation(); duplicatePage(page.slug) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-white/20 hover:text-white/70">
                  <Copy className="h-3.5 w-3.5" />
                </button>
              )}
              {!page.home && (
                <button type="button" onClick={(event) => { event.stopPropagation(); deletePage(page.slug) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-red-400/35 hover:text-red-400">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-white/8 p-4">
        <button type="button" onClick={() => setShowNewPage(true)} className="flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 bg-white/[0.03] text-sm font-semibold text-white/55 transition-all hover:border-primary/40 hover:text-primary">
          <Plus className="h-4 w-4" />
          Nueva pagina
        </button>
      </div>
    </div>
  )

  const renderLayersSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Capas</div>
          <div className="text-sm font-semibold text-white">{currentPageTitle}</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{currentSections.length}</span>
      </div>
      <div className="border-b border-white/8 px-4 py-3">
        <button
          type="button"
          onClick={() => {
            setInsertIndex(null)
            setShowAdd(true)
          }}
          className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Agregar bloque
        </button>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {currentSections.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
            <LayoutTemplate className="h-8 w-8 text-white/20" />
            <div className="text-sm font-semibold text-white">Sin bloques</div>
            <div className="text-xs text-white/45">Agrega el primer bloque para empezar a editar esta pagina.</div>
          </div>
        ) : (
          currentSections.map((section, index) => {
            const meta = getStudioSectionMeta(section.type)
            const Icon = meta?.icon ?? LayoutTemplate
            const active = selectedSectionId === section.id
            const children = getStudioLayerChildren(section, config)
            return (
              <div
                key={section.id}
                role="button"
                tabIndex={0}
                draggable
                onDragStart={() => {
                  setDraggingSectionId(section.id)
                  setDropTargetId(section.id)
                }}
                onDragEnd={() => {
                  setDraggingSectionId(null)
                  setDropTargetId(null)
                }}
                onDragOver={(event) => {
                  event.preventDefault()
                  setDropTargetId(section.id)
                }}
                onDrop={(event) => {
                  event.preventDefault()
                  if (draggingSectionId) reorderSectionByDrop(draggingSectionId, section.id)
                  setDraggingSectionId(null)
                  setDropTargetId(null)
                }}
                onClick={() => { setSelectedSectionId(section.id); setLeftTab("layers"); setInspectorTab("content") }}
                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedSectionId(section.id); setLeftTab("layers"); setInspectorTab("content") } }}
                className={cn(
                  "group w-full rounded-2xl border px-3 py-3 text-left transition-all cursor-pointer",
                  active ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]" : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]",
                  !section.visible && "opacity-60",
                  draggingSectionId === section.id && "opacity-40",
                  dropTargetId === section.id && draggingSectionId !== section.id && "border-primary/45 bg-primary/[0.08]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl", meta?.color ?? "bg-white/5 text-white/40")}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-white">{meta?.label ?? section.type}</div>
                      {!section.visible && <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">Oculto</span>}
                    </div>
                    <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/30">Bloque {index + 1}</div>
                    {children.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {children.map((child, childIndex) => (
                          <div key={`${section.id}-${childIndex}`} className="flex items-center gap-2 text-[11px] text-white/38">
                            <span className="inline-block h-px w-3 bg-white/15" />
                            <span className="truncate">{child}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button type="button" disabled={index === 0} onClick={(event) => { event.stopPropagation(); moveSection(section.id, -1) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-white/20 hover:text-white/70 disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                  <button type="button" disabled={index === currentSections.length - 1} onClick={(event) => { event.stopPropagation(); moveSection(section.id, 1) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-white/20 hover:text-white/70 disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); toggleSectionVisibility(section.id) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-primary/30 hover:text-white/70">{section.visible ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); duplicateSectionInPage(section.id) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-white/20 hover:text-white/70"><Copy className="h-3.5 w-3.5" /></button>
                  {meta?.deletable && <button type="button" onClick={(event) => { event.stopPropagation(); deleteSection(section.id) }} className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-red-400/35 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>}
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )

  const renderNavigationSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Navegacion</div>
          <div className="text-sm font-semibold text-white">Menu del sitio</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{config.nav.items.length}</span>
      </div>
      <div className="flex-1 space-y-5 overflow-y-auto p-4">
        {config.nav.items.map((item, index) => (
          <div key={item.id} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-[#0b1017] text-white/40"><Link2 className="h-4 w-4" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-white">{item.label || `Link ${index + 1}`}</div>
                  {item.external && <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">Externo</span>}
                </div>
                <div className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-white/30">{item.href}</div>
              </div>
            </div>
          </div>
        ))}
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Paginas del menu</div>
          <div className="space-y-2">
            {(config.pages ?? []).filter((page) => page.showInNav !== false).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                No hay paginas publicadas en el menu.
              </div>
            ) : (
              (config.pages ?? [])
                .filter((page) => page.showInNav !== false)
                .map((page) => (
                  <button
                    key={`nav-page-${page.slug}`}
                    type="button"
                    onClick={() => activatePage(page.slug, "pages")}
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-primary/25 hover:bg-white/[0.05]"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-white">{page.navLabel || page.title}</div>
                      <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/30">/{page.slug}</div>
                    </div>
                    <span className="rounded-full bg-emerald-500/12 px-2 py-0.5 text-[10px] font-semibold text-emerald-300">Auto</span>
                  </button>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  )

  const renderPagesInspector = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Globe className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{currentPageTitle}</div>
          <div className="text-xs text-white/40">{currentRoute}</div>
        </div>
        <div className="ml-auto">{renderInspectorCollapseAction()}</div>
      </div>
      {renderInspectorTabsRow()}
      <div className="flex-1 overflow-y-auto p-5">
        {inspectorTab === "content" && (
          <div className="space-y-5">
            <Card title="Pagina">
              <F label="Nombre visible"><input className={iCls} value={currentPageTitle} disabled={currentPage.home} onChange={(event) => updateCurrentPageMeta({ title: event.target.value })} /></F>
              <F label="Ruta publica">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <input
                    className={iCls}
                    value={currentPage.home ? "" : currentPage.slug}
                    disabled={currentPage.home}
                    onChange={(event) => {
                      if (currentPage.home) return
                      const nextSlug = sanitizeStudioSlug(event.target.value)
                      if (!nextSlug || pages.some((page) => page.slug === nextSlug && page.slug !== currentPage.slug)) return
                      updateCurrentPageMeta({ slug: nextSlug })
                      setSelectedPageSlug(nextSlug)
                      syncStudioRoute(nextSlug)
                    }}
                  />
                </div>
              </F>
              {currentPage.home && <p className="text-xs text-muted-foreground">La pagina principal usa la ruta `/` y los bloques globales del sitio.</p>}
              {!currentPage.home && (
                <>
                  <div className="grid gap-3 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-semibold text-white">Mostrar en navegacion</div>
                        <div className="text-xs text-white/45">Si la activas, la pagina aparece automaticamente en el menu publico.</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => updateCurrentPageMeta({ showInNav: currentPage.showInNav === false })}
                        className={cn(
                          "relative inline-flex h-7 w-12 items-center rounded-full border transition-all",
                          currentPage.showInNav === false ? "border-white/10 bg-white/5" : "border-emerald-400/35 bg-emerald-500/20"
                        )}
                      >
                        <span
                          className={cn(
                            "inline-block h-5 w-5 rounded-full bg-white transition-all",
                            currentPage.showInNav === false ? "translate-x-1" : "translate-x-6"
                          )}
                        />
                      </button>
                    </div>
                    <F label="Texto del menu">
                      <input
                        className={iCls}
                        value={currentPage.navLabel ?? currentPageTitle}
                        disabled={currentPage.showInNav === false}
                        onChange={(event) => updateCurrentPageMeta({ navLabel: event.target.value })}
                        placeholder="Texto que aparece en el menu"
                      />
                    </F>
                  </div>
                </>
              )}
            </Card>
          </div>
        )}

        {inspectorTab === "style" && <TabGeneral config={config} onChange={handleChange} />}

        {inspectorTab === "advanced" && (
          <div className="space-y-5">
            <Card title="Importar HTML inteligente">
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Carga un archivo `.html` en esta pagina y conviertelo en un bloque editable, libre y ordenable dentro del Studio.
                </p>
                <HtmlImporter
                  onCreateSection={(type, data) => {
                    createImportedSection(type, data)
                  }}
                />
                <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-5 text-white/45">
                  Despues de importarlo puedes mover el bloque desde Capas, editar el HTML completo y ajustar elementos directamente sobre el canvas.
                </div>
              </div>
            </Card>
            <Card title="Datos tecnicos">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Slug</span><span className="font-medium text-foreground">{currentPage.slug}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Tipo</span><span className="font-medium text-foreground">{currentPage.home ? "Pagina principal" : "Pagina del sitio"}</span></div>
                {!currentPage.home && <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Menu</span><span className="font-medium text-foreground">{currentPage.showInNav === false ? "Oculto" : currentPage.navLabel || currentPage.title}</span></div>}
              </div>
            </Card>
            {!currentPage.home && (
              <Card title="Acciones">
                <div className="grid grid-cols-2 gap-3">
                  <Btn onClick={() => duplicatePage(currentPage.slug)}><Copy className="h-4 w-4" />Duplicar</Btn>
                  <Btn variant="danger" onClick={() => deletePage(currentPage.slug)}><Trash2 className="h-4 w-4" />Eliminar</Btn>
                </div>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  )

  const renderComponentsSidebar = () => {
    const addableList = currentPage.home ? ADDABLE : ADDABLE_PAGE
    const normalizedSearch = componentSearch.trim().toLowerCase()
    const groupedBlocks = STUDIO_BLOCK_GROUPS
      .map((group) => ({
        ...group,
        types: group.types.filter((type) => {
          if (!addableList.includes(type)) return false
          if (!normalizedSearch) return true
          const meta = getStudioSectionMeta(type)
          const haystack = `${meta.label} ${meta.desc ?? ""}`.toLowerCase()
          return haystack.includes(normalizedSearch)
        }),
      }))
      .filter((group) => group.types.length > 0)

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Componentes</div>
            <div className="text-sm font-semibold text-white">Biblioteca visual</div>
          </div>
          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{addableList.length}</span>
        </div>
        <div className="border-b border-white/8 px-4 py-3">
          <div className="rounded-2xl border border-dashed border-primary/20 bg-primary/5 px-3 py-3 text-xs leading-5 text-white/55">
            Usa este panel como biblioteca universal: tarjetas, videos, FAQs, formularios, simuladores, cursos, evaluaciones, galerias y bloques HTML.
          </div>
          <div className="mt-3">
            <input
              className={iCls}
              value={componentSearch}
              placeholder="Buscar bloque..."
              onChange={(event) => setComponentSearch(event.target.value)}
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-5">
            <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] p-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Code2 className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">Importar HTML</div>
                  <div className="mt-1 text-xs leading-5 text-white/45">
                    Sube un archivo `.html` y conviertelo en un bloque libre, editable y reordenable dentro del canvas.
                  </div>
                </div>
              </div>
              <div className="mt-3">
                <HtmlImporter
                  onCreateSection={(type, data) => {
                    createImportedSection(type, data)
                  }}
                />
              </div>
              <div className="mt-3 rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[11px] leading-5 text-white/45">
                El bloque queda listo para editar codigo, tocar elementos desde el canvas y cambiar su posicion desde Capas.
              </div>
            </div>
            {groupedBlocks.length === 0 ? (
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
                <LayoutTemplate className="h-8 w-8 text-white/20" />
                <div className="mt-3 text-sm font-semibold text-white">Sin coincidencias</div>
                <div className="mt-2 text-xs leading-5 text-white/45">Prueba con otro nombre de bloque o limpia la busqueda.</div>
              </div>
            ) : (
              groupedBlocks.map((group) => (
                <div key={group.id}>
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">{group.label}</div>
                      {"description" in group ? <div className="mt-1 max-w-[260px] text-[11px] leading-5 text-white/38">{group.description}</div> : null}
                    </div>
                    <div className="rounded-full border border-white/8 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/35">{group.types.length}</div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {group.types.map((type) => {
                      const meta = getStudioSectionMeta(type)
                      const Icon = meta.icon
                      const previewSection: CMSSection = {
                        id: `library-${type}`,
                        type,
                        visible: true,
                        data: DEFAULTS[type] ? JSON.parse(JSON.stringify(DEFAULTS[type])) : {},
                      }

                      return (
                        <button
                          key={type}
                          type="button"
                          onClick={() => addSection(type)}
                          className="group overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03] text-left transition-all hover:border-primary/35 hover:bg-white/[0.05]"
                        >
                          <div className="min-h-[88px] bg-[#08111b]">
                            <SectionMiniPreview section={previewSection} />
                          </div>
                          <div className="flex items-start gap-3 border-t border-white/8 px-3 py-3">
                            <div className={cn("mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl", meta.color)}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-semibold text-white">{meta.label}</div>
                              <div className="mt-1 text-xs leading-5 text-white/45">{meta.desc ?? "Bloque reutilizable del editor."}</div>
                            </div>
                            <div className="pt-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                              <Plus className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  const renderPopupsSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Popups</div>
          <div className="text-sm font-semibold text-white">Overlays y modales</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{config.popups.length}</span>
      </div>
      <div className="border-b border-white/8 p-4">
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-xs leading-5 text-white/50">
          Los formularios son opcionales. Puedes usarlos como bloque en la pagina o dentro de un popup, segun el flujo que necesites.
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={() => addPopup("form")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Popup form
          </button>
          <button type="button" onClick={() => addPopup("info")} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/75 transition-all hover:border-primary/35 hover:text-white">
            <Plus className="h-4 w-4" />
            Popup info
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        {config.popups.length === 0 ? (
          <div className="flex h-full min-h-[220px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
            <MessageSquare className="h-8 w-8 text-white/20" />
            <div className="text-sm font-semibold text-white">Sin popups</div>
            <div className="text-xs leading-5 text-white/45">Crea un popup para usarlo en botones, formularios y flujos previos al simulador.</div>
          </div>
        ) : (
          config.popups.map((popup) => {
            const active = selectedPopupId === popup.id
            return (
              <button
                key={popup.id}
                type="button"
                onClick={() => {
                  setSelectedSectionId("")
                  setSelectedPopupId(popup.id)
                  setLeftTab("popups")
                  setInspectorTab("content")
                  setRightPanelCollapsed(false)
                }}
                className={cn(
                  "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                  active ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]" : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl border border-white/8 bg-[#0b1017] text-primary">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="truncate text-sm font-semibold text-white">{popup.name}</div>
                      <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">{popup.type === "form" ? "Formulario" : "Info"}</span>
                    </div>
                    <div className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-white/30">{popup.title}</div>
                    <div className="mt-2 text-xs leading-5 text-white/45">{popup.description || "Sin descripcion"}</div>
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </div>
  )

  const renderFormsSidebar = () => {
    const pageForms = currentSections.filter((section) => section.type === "formBuilder")
    const popupForms = config.popups.filter((popup) => popup.type === "form")

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Formularios</div>
            <div className="text-sm font-semibold text-white">Reutilizables</div>
          </div>
          <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{pageForms.length + popupForms.length}</span>
        </div>
        <div className="border-b border-white/8 p-4">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => addSection("formBuilder")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Bloque form
            </button>
            <button type="button" onClick={() => addPopup("form")} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/75 transition-all hover:border-primary/35 hover:text-white">
              <Plus className="h-4 w-4" />
              Popup form
            </button>
          </div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-4">
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Bloques en esta página</div>
            <div className="space-y-2">
              {pageForms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">No hay formularios insertados en esta página.</div>
              ) : (
                pageForms.map((section) => (
                  <div
                    key={section.id}
                    className={cn(
                      "rounded-2xl border px-3 py-3 transition-all",
                      selectedSectionId === section.id ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]" : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormInspectorTarget("section")
                          setSelectedSectionId(section.id)
                          setSelectedPopupId("")
                          setLeftTab("forms")
                          setInspectorTab("content")
                          setRightPanelCollapsed(false)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-sm font-semibold text-white">{section.data?.titulo || "Formulario"}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/30">{section.id}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSection(section.id)}
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-red-400/35 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
            <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Popups formulario</div>
            <div className="space-y-2">
              {popupForms.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">No hay popups de formulario creados.</div>
              ) : (
                popupForms.map((popup) => (
                  <div
                    key={popup.id}
                    className={cn(
                      "rounded-2xl border px-3 py-3 transition-all",
                      selectedPopupId === popup.id ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]" : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setFormInspectorTarget("popup")
                          setSelectedSectionId("")
                          setSelectedPopupId(popup.id)
                          setLeftTab("forms")
                          setInspectorTab("content")
                          setRightPanelCollapsed(false)
                        }}
                        className="min-w-0 flex-1 text-left"
                      >
                        <div className="text-sm font-semibold text-white">{popup.name}</div>
                        <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/30">{popup.title}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePopup(popup.id)}
                        className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-red-400/35 hover:text-red-400"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSimulatorsSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Simuladores</div>
          <div className="text-sm font-semibold text-white">Contenido reutilizable</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{studioSimulatorItems.length}</span>
      </div>
      <div className="border-b border-white/8 p-4">
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-3 py-3 text-xs leading-5 text-white/50">
          Los simuladores, evaluaciones y cursos son opcionales. Solo agrega estos bloques si quieres conectarlos a la pagina actual.
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <button type="button" onClick={() => addSection("simulatorsFeed")} className="flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <Plus className="h-4 w-4" />
            Bloque sim
          </button>
          <button type="button" onClick={() => addSection("evaluationsFeed")} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/75 transition-all hover:border-primary/35 hover:text-white">
            <Plus className="h-4 w-4" />
            Bloque eval
          </button>
          <button type="button" onClick={() => addSection("coursesFeed")} className="flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] text-sm font-semibold text-white/75 transition-all hover:border-primary/35 hover:text-white">
            <Plus className="h-4 w-4" />
            Bloque curso
          </button>
        </div>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-4">
        <div>
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Bloques en esta pagina</div>
          <div className="space-y-2">
            {currentSections.filter((section) => ["simulatorsFeed", "coursesFeed", "evaluationsFeed"].includes(section.type)).length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                Esta pagina aun no tiene bloques conectados. Agrega uno arriba si quieres mostrar simuladores, cursos o evaluaciones.
              </div>
            ) : (
              currentSections
                .filter((section) => ["simulatorsFeed", "coursesFeed", "evaluationsFeed"].includes(section.type))
                .map((section) => {
                  const meta = getStudioSectionMeta(section.type)
                  const Icon = meta?.icon ?? Target
                  return (
                    <div
                      key={section.id}
                      className={cn(
                        "rounded-2xl border px-3 py-3 transition-all",
                        selectedSectionId === section.id
                          ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]"
                          : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
                      )}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSimulatorInspectorTarget("feed")
                            setSelectedPopupId("")
                            setSelectedSectionId(section.id)
                            setLeftTab("simulators")
                            setInspectorTab("content")
                            setRightPanelCollapsed(false)
                          }}
                          className="min-w-0 flex-1 text-left"
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-[#0b1017]", meta?.color ?? "text-white/40")}>
                              <Icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-sm font-semibold text-white">{section.data?.titulo || meta?.label || "Bloque"}</div>
                              <div className="mt-1 text-[11px] uppercase tracking-[0.18em] text-white/30">{meta?.label || section.type}</div>
                            </div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteSection(section.id)}
                          className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-white/8 text-white/35 transition-all hover:border-red-400/35 hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
            )}
          </div>
        </div>

        <div className="pt-1">
          <div className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Contenido reutilizable</div>
        </div>
        {studioSimulatorItems.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">Publica simuladores o evaluaciones para conectarlos desde el Studio.</div>
        ) : (
          studioSimulatorItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setSimulatorInspectorTarget("item")
                setSelectedSectionId("")
                setSelectedPopupId("")
                setSelectedSimulatorId(item.id)
                setLeftTab("simulators")
                setInspectorTab("content")
                setRightPanelCollapsed(false)
              }}
              className={cn(
                "w-full rounded-2xl border px-3 py-3 text-left transition-all",
                selectedSimulatorId === item.id ? "border-primary/60 bg-primary/10 shadow-[0_0_0_1px_rgba(232,57,42,0.16)]" : "border-white/8 bg-white/[0.03] hover:border-primary/25 hover:bg-white/[0.05]"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/8 bg-[#0b1017] text-xl">
                  {item.emoji || "🎯"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="truncate text-sm font-semibold text-white">{item.title}</div>
                    <span className="rounded-full bg-white/8 px-2 py-0.5 text-[10px] text-white/50">{item.kind}</span>
                  </div>
                  <div className="mt-1 truncate text-[11px] uppercase tracking-[0.18em] text-white/30">{item.href}</div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  )

  const renderAssetsSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Assets</div>
          <div className="text-sm font-semibold text-white">Media del canvas</div>
        </div>
        <span className="rounded-full border border-white/8 bg-white/5 px-2 py-0.5 text-[11px] text-white/45">{studioAssets.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {studioAssets.length === 0 ? (
          <div className="flex h-full min-h-[260px] flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-6 text-center">
            <FileImage className="h-8 w-8 text-white/20" />
            <div className="text-sm font-semibold text-white">Sin assets detectados</div>
            <div className="text-xs leading-5 text-white/45">Agrega imagenes o videos desde un bloque para gestionarlos aqui.</div>
          </div>
        ) : (
          <div className="space-y-3">
            {studioAssets.map((asset) => (
              <button
                key={asset.id}
                type="button"
                onClick={() => {
                  setSelectedSectionId(asset.sectionId)
                  setInspectorTab("content")
                }}
                className="flex w-full items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.05]"
              >
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/8 bg-[#0b1017]">
                  {asset.type === "image" ? (
                    asset.url.startsWith("data:") || asset.url.startsWith("http") || asset.url.startsWith("/") ? (
                      <img src={asset.url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <ImageIcon className="h-4 w-4 text-white/35" />
                    )
                  ) : (
                    <Video className="h-4 w-4 text-white/35" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-white">{asset.label}</div>
                  <div className="mt-1 truncate text-xs text-white/40">{asset.url}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )

  const renderSettingsSidebar = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#5d7fa8]">Configuracion</div>
          <div className="text-sm font-semibold text-white">Sitio y pagina</div>
        </div>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Pagina activa</div>
          <div className="mt-2 text-sm font-semibold text-white">{currentPageTitle}</div>
          <div className="mt-1 text-xs text-white/45">{currentRoute}</div>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="rounded-full border border-white/8 bg-white/5 px-2 py-1 text-[10px] text-white/45">{currentSections.length} bloques</span>
            <span className="rounded-full border border-white/8 bg-white/5 px-2 py-1 text-[10px] text-white/45">{currentSections.filter((section) => section.visible).length} visibles</span>
          </div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Marca</div>
          <div className="mt-2 text-sm font-semibold text-white">{config.general.nombrePlataforma}</div>
          <div className="mt-1 text-xs leading-5 text-white/45">{config.general.tagline}</div>
        </div>
        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-white/35">Accesos rapidos</div>
          <div className="mt-3 grid grid-cols-1 gap-2">
            <button type="button" onClick={() => setLeftTab("pages")} className="rounded-xl border border-white/8 px-3 py-2 text-left text-sm text-white/65 transition-all hover:border-primary/35 hover:text-white">Editar paginas</button>
            <button type="button" onClick={() => setLeftTab("navigation")} className="rounded-xl border border-white/8 px-3 py-2 text-left text-sm text-white/65 transition-all hover:border-primary/35 hover:text-white">Editar navegacion</button>
            <button type="button" onClick={() => setLeftTab("assets")} className="rounded-xl border border-white/8 px-3 py-2 text-left text-sm text-white/65 transition-all hover:border-primary/35 hover:text-white">Ver assets</button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPopupsInspector = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><MessageSquare className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{selectedPopup?.name || "Selecciona un popup"}</div>
          <div className="text-xs text-white/40">{selectedPopup ? `${selectedPopup.type === "form" ? "Formulario" : "Informativo"} reutilizable` : "Usalo en acciones y botones"}</div>
        </div>
        <div className="ml-auto">{renderInspectorCollapseAction()}</div>
      </div>
      {renderInspectorTabsRow({ disableAll: !selectedPopup })}
      <div className="flex-1 overflow-y-auto">
        {!selectedPopup ? (
          <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-3 px-8 text-center">
            <MessageSquare className="h-10 w-10 text-white/20" />
            <div className="text-base font-semibold text-white">Sin popup seleccionado</div>
            <div className="max-w-xs text-sm text-white/45">Crea o selecciona un popup para conectarlo a botones y formularios.</div>
          </div>
        ) : inspectorTab === "content" ? (
          <div className="space-y-4 p-4">
            <Card title="Popup">
              <div className="grid grid-cols-2 gap-3">
                <F label="Nombre interno"><input className={iCls} value={selectedPopup.name} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, name: event.target.value }))} /></F>
                <F label="Tipo">
                  <select className={iCls} value={selectedPopup.type} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, type: event.target.value as CMSPopup["type"] }))}>
                    <option value="form">Formulario</option>
                    <option value="info">Informativo</option>
                  </select>
                </F>
              </div>
              <F label="Titulo"><input className={iCls} value={selectedPopup.title} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, title: event.target.value }))} /></F>
              <F label="Descripcion"><textarea className={tCls} rows={3} value={selectedPopup.description} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, description: event.target.value }))} /></F>
            </Card>

            {selectedPopup.type === "form" ? (
              <>
                <Card title="Mensajes">
                  <div className="grid grid-cols-2 gap-3">
                    <F label="Boton enviar"><input className={iCls} value={selectedPopup.submitLabel || ""} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, submitLabel: event.target.value }))} /></F>
                    <F label="Titulo exito"><input className={iCls} value={selectedPopup.successTitle || ""} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, successTitle: event.target.value }))} /></F>
                  </div>
                  <F label="Mensaje exito"><textarea className={tCls} rows={2} value={selectedPopup.successMessage || ""} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, successMessage: event.target.value }))} /></F>
                </Card>
                <PopupFieldListEditor
                  fields={selectedPopup.fields ?? []}
                  onChange={(fields) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, fields }))}
                />
              </>
            ) : (
              <Card title="Botones">
                <div className="grid grid-cols-2 gap-3">
                  <F label="Boton primario"><input className={iCls} value={selectedPopup.primaryLabel || ""} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, primaryLabel: event.target.value }))} /></F>
                  <F label="Boton secundario"><input className={iCls} value={selectedPopup.secondaryLabel || ""} onChange={(event) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, secondaryLabel: event.target.value }))} /></F>
                </div>
              </Card>
            )}
          </div>
        ) : inspectorTab === "style" ? (
          <div className="space-y-4 p-4">
            <Card title="Estilo">
              <p className="text-sm text-muted-foreground">El popup usa un estilo base unificado. La siguiente fase puede abrir control total de colores, bordes y layout.</p>
            </Card>
          </div>
        ) : inspectorTab === "actions" ? (
          <div className="space-y-4 p-4">
            {selectedPopup.type === "form" ? (
              <ActionConfigEditor
                title="Accion al enviar"
                action={selectedPopup.submitAction}
                onChange={(action) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, submitAction: action }))}
                sections={currentSections}
                pages={pages}
                popups={config.popups}
                simulators={simulatorActionOptions}
                onCreateFormPopup={createConnectedFormPopup}
                onEditFormPopup={openPopupFormEditor}
                onCreateFormSection={createConnectedFormSection}
                onEditFormSection={openSectionFormEditor}
                onUpdatePopup={updatePopup}
                onSyncFlow={syncConnectedFlow}
              />
            ) : (
              <>
                <ActionConfigEditor
                  title="Boton primario"
                  action={selectedPopup.primaryAction}
                  onChange={(action) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, primaryAction: action }))}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
                <ActionConfigEditor
                  title="Boton secundario"
                  action={selectedPopup.secondaryAction}
                  onChange={(action) => updatePopup(selectedPopup.id, (popup) => ({ ...popup, secondaryAction: action }))}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <Card title="Popup">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">ID</span><span className="font-mono text-foreground">{selectedPopup.id}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Tipo</span><span className="font-medium text-foreground">{selectedPopup.type}</span></div>
              </div>
            </Card>
            <Card title="Acciones">
              <div className="grid grid-cols-1 gap-3">
                <Btn variant="danger" onClick={() => deletePopup(selectedPopup.id)}><Trash2 className="h-4 w-4" />Eliminar popup</Btn>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )

  const renderFormsInspector = () => {
    if (selectedFormSection) {
      return renderLayersInspector()
    }

    if (selectedFormPopup) {
      return renderPopupsInspector()
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">Formularios</div>
            <div className="text-xs text-white/40">Bloques y popups reutilizables</div>
          </div>
          <div className="ml-auto">{renderInspectorCollapseAction()}</div>
        </div>
        <div className="flex-1 overflow-y-auto p-5">
          <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-8 text-center">
            <FileText className="h-10 w-10 text-white/20" />
            <div className="text-base font-semibold text-white">Selecciona un formulario</div>
            <div className="max-w-xs text-sm leading-6 text-white/45">
              Elige un bloque `Formulario` de la pagina o un `Popup form` para editar campos, mensajes y la accion despues del envio.
            </div>
            <div className="grid w-full max-w-xs gap-3">
              <button
                type="button"
                onClick={() => addSection("formBuilder")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Agregar formulario
              </button>
              <button
                type="button"
                onClick={() => addPopup("form")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition-all hover:border-primary/35 hover:text-white"
              >
                <Plus className="h-4 w-4" />
                Crear popup form
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const renderSimulatorsInspector = () => {
    if (selectedFeedSection) {
      return renderLayersInspector()
    }

    return (
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Target className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white">{selectedSimulator?.title || "Simuladores"}</div>
            <div className="text-xs text-white/40">{selectedSimulator ? `${selectedSimulator.kind} reutilizable` : "Conecta contenido del admin a la landing"}</div>
          </div>
          <div className="ml-auto">{renderInspectorCollapseAction()}</div>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {selectedSimulator ? (
            <>
              <Card title="Resumen">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/8 bg-[#0b1017] text-2xl">
                    {selectedSimulator.emoji || "🎯"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-base font-semibold text-white">{selectedSimulator.title}</div>
                    <div className="mt-1 text-sm text-white/55">{selectedSimulator.subtitle || selectedSimulator.category || "Publicado desde el admin"}</div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full border border-white/8 bg-white/[0.04] px-2.5 py-1 text-[11px] text-white/55">{selectedSimulator.kind}</span>
                      {selectedSimulator.badge ? <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">{selectedSimulator.badge}</span> : null}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/55">{selectedSimulator.description}</p>
              </Card>

              <Card title="Metricas">
                <div className="grid grid-cols-1 gap-3">
                  {selectedSimulator.metrics.map((metric) => (
                    <div key={metric.key} className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                      <div className="text-sm text-white/55">{metric.label}</div>
                      <div className="text-sm font-semibold text-white">{metric.value}</div>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Usar en landing">
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      const nextType = selectedSimulator.kind === "Evaluacion" ? "evaluationsFeed" : "simulatorsFeed"
                      addSection(nextType)
                      setLeftTab("layers")
                    }}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                  >
                    <Plus className="h-4 w-4" />
                    Crear bloque conectado
                  </button>
                  <a
                    href={selectedSimulator.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-sm font-semibold text-white/70 transition-all hover:border-primary/35 hover:text-white"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver contenido publicado
                  </a>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-8 text-center">
              <Target className="h-10 w-10 text-white/20" />
              <div className="text-base font-semibold text-white">Sin simuladores publicados</div>
              <div className="max-w-xs text-sm leading-6 text-white/45">
                Publica un simulador o una evaluacion desde el admin para conectarlo a la landing con un bloque dinamico.
              </div>
              <button
                type="button"
                onClick={() => addSection("simulatorsFeed")}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-primary px-4 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                <Plus className="h-4 w-4" />
                Agregar bloque de simuladores
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderLayersInspector = () => (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        {selectedSection ? (
          <>
            {(() => {
              const meta = getStudioSectionMeta(selectedSection.type)
              const Icon = meta?.icon ?? LayoutTemplate
              return <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl", meta?.color ?? "bg-white/5 text-white/35")}><Icon className="h-4 w-4" /></div>
            })()}
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">{getStudioSectionMeta(selectedSection.type).label ?? selectedSection.type}</div>
              <div className="text-xs text-white/40">{currentRoute}</div>
            </div>
          </>
        ) : (
          <>
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/5 text-white/35"><LayoutTemplate className="h-4 w-4" /></div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">Selecciona un bloque</div>
              <div className="text-xs text-white/40">Haz clic en el canvas o en la lista de capas.</div>
            </div>
          </>
        )}
        <div className="ml-auto">{renderInspectorCollapseAction()}</div>
      </div>
      {selectedSection
        ? (selectedSection.type === "customCode" ? null : renderInspectorTabsRow())
        : renderInspectorTabsRow({ onlyAdvanced: true })}
      <div className="studio-scroll min-h-0 flex-1 overflow-y-scroll overscroll-contain pr-1">
        {!selectedSection ? (
          inspectorTab === "advanced" ? (
            <div className="space-y-5 p-5">
              <Card title="Importar HTML">
                <div className="space-y-3">
                  <div className="text-sm leading-6 text-white/50">
                    Sube tu archivo `.html` desde `Dev` y el Studio lo convierte automaticamente en un bloque editable dentro del canvas.
                  </div>
                  <HtmlImporter
                    onCreateSection={(type, data) => {
                      createImportedSection(type, data)
                    }}
                  />
                  <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[11px] leading-5 text-white/45">
                    El bloque se agrega automaticamente a la pagina actual y luego puedes editarlo, moverlo y conectarle acciones.
                  </div>
                </div>
              </Card>
            </div>
          ) : (
            <div className="flex h-full min-h-[320px] flex-col gap-4 p-5">
              <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-white/10 bg-white/[0.03] px-8 py-10 text-center">
                <LayoutTemplate className="h-10 w-10 text-white/20" />
                <div className="text-base font-semibold text-white">Editor del bloque</div>
                <div className="max-w-xs text-sm text-white/45">Usa Dev para importar un archivo HTML editable o selecciona un bloque existente en el canvas.</div>
                <button onClick={() => setInspectorTab("advanced")} className="mt-2 inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm font-semibold text-white/70 transition-all hover:border-primary/35 hover:text-white">
                  <Code2 className="w-4 h-4" />
                  Ir a Dev
                </button>
              </div>
            </div>
          )
        ) : selectedSection.type === "customCode" ? (
          <div className="flex min-h-0 min-w-0 flex-col gap-3 p-4 pb-8">
            <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px] font-medium",
              htmlEditing ? "border-emerald-500/25 bg-emerald-500/5 text-emerald-400"
              : htmlEl    ? "border-primary/25 bg-primary/5 text-primary/80"
              :              "border-white/8 bg-white/3 text-white/40")}>
              <span className={cn("w-2 h-2 rounded-full flex-shrink-0",
                htmlEditing ? "bg-emerald-400 animate-pulse" : htmlEl ? "bg-primary" : "bg-white/20")} />
              {htmlEditing ? "Editando inline — Esc para salir"
               : htmlEl   ? `<${htmlEl.tag}> seleccionado — edita propiedades abajo`
               :             "Haz clic en el bloque del canvas para seleccionar un elemento"}
            </div>
            <HtmlElementInspector
              key={htmlEl ? `${htmlEl.eid ?? htmlEl.tag}` : "html-inspector-empty"}
              element={htmlEl}
              isEditing={htmlEditing}
              iframeRef={htmlIframeRef as React.RefObject<HTMLIFrameElement>}
              onClose={() => { setHtmlEl(null); setHtmlEditing(false) }}
            />
            {!htmlEl && !htmlEditing ? (
              <div className="border-t border-white/8 pt-3">
                <CustomCodeEditor
                  data={selectedSection.data}
                  onChange={updateSelectedSectionData}
                  selectedHtmlElement={htmlEl}
                  htmlIframeRef={htmlIframeRef as { current: HTMLIFrameElement | null }}
                />
              </div>
            ) : null}
          </div>
        ) : inspectorTab === "content" ? (
          <div className="space-y-5 p-5">
            <Card title="Resumen del bloque">
              {(() => {
                const summary = getStudioSectionContent(selectedSection, config)
                return (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Etiqueta</span>
                      <span className="max-w-[180px] truncate font-medium text-foreground">{summary.eyebrow || "Sin etiqueta"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Titulo</span>
                      <span className="max-w-[180px] truncate font-medium text-foreground">{summary.title || "Sin titulo"}</span>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <span className="text-muted-foreground">Visible</span>
                      <span className={cn("font-medium", selectedSection.visible ? "text-emerald-400" : "text-amber-400")}>
                        {selectedSection.visible ? "Si" : "No"}
                      </span>
                    </div>
                    {summary.chips.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {summary.chips.slice(0, 3).map((chip, index) => (
                          <span key={`${selectedSection.id}-chip-${index}`} className="rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] text-white/55">
                            {chip}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )
              })()}
            </Card>
            <Card title="Edicion rapida">
              <div className="space-y-2 text-sm text-white/70">
                {getStudioEditingTips(selectedSection).map((tip, index) => (
                  <div key={`${selectedSection.id}-tip-${index}`} className="flex items-start gap-2">
                    <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-primary" />
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </Card>
            {currentPage.home ? (
              <SectionContentEditor
                section={selectedSection}
                config={config}
                onChange={handleChange}
                onUpdateSettings={updateSelectedSectionSettings}
              />
            ) : (
              <PageSectionContentEditor
                section={selectedSection}
                onChange={updateSelectedSectionData}
                onUpdateSettings={updateSelectedSectionSettings}
              />
            )}
            {(selectedSection.type === "pageHero" || selectedSection.type === "cta" || selectedSection.type === "richText") && (
              <>
                <div className="flex items-center gap-2 px-1 pt-2">
                  <div className="h-px flex-1 bg-white/8" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">⚡ Flujo de botones</span>
                  <div className="h-px flex-1 bg-white/8" />
                </div>
                <ActionConfigEditor
                  title="Boton primario"
                  action={selectedSection.data?.primaryAction}
                  onChange={(action) => updateSelectedSectionAction("primaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
                <ActionConfigEditor
                  title="Boton secundario"
                  action={selectedSection.data?.secondaryAction}
                  onChange={(action) => updateSelectedSectionAction("secondaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
              </>
            )}
          </div>
        ) : inspectorTab === "style" ? (
          <StyleEditor style={selectedSection.style} onChange={updateSelectedSectionStyle} />
        ) : inspectorTab === "actions" ? (
          <div className="space-y-5 p-5">
            {(() => {
              const actionRows = getSectionActionSummaries(selectedSection, config)
              if (!actionRows.length) return null
              return (
                <Card title="Flujo actual">
                  <div className="space-y-3">
                    {actionRows.map((row) => (
                      <div key={`${selectedSection.id}-${row.label}`} className="flex items-center justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-sm">
                        <span className="text-white/55">{row.label}</span>
                        <span className="max-w-[170px] truncate font-medium text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )
            })()}
            {selectedSection.type === "hero" ? (
              <>
                <ActionConfigEditor
                  title="Boton primario"
                  action={config.hero.primaryAction}
                  onChange={(action) => updateHomeHeroAction("primaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
                <ActionConfigEditor
                  title="Boton secundario"
                  action={config.hero.secondaryAction}
                  onChange={(action) => updateHomeHeroAction("secondaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
              </>
            ) : selectedSection.type === "pageHero" || selectedSection.type === "cta" || selectedSection.type === "richText" ? (
              <>
                <ActionConfigEditor
                  title="Boton primario"
                  action={selectedSection.data?.primaryAction}
                  onChange={(action) => updateSelectedSectionAction("primaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
                <ActionConfigEditor
                  title="Boton secundario"
                  action={selectedSection.data?.secondaryAction}
                  onChange={(action) => updateSelectedSectionAction("secondaryAction", action)}
                  sections={currentSections}
                  pages={pages}
                  popups={config.popups}
                  simulators={simulatorActionOptions}
                  onCreateFormPopup={createConnectedFormPopup}
                  onEditFormPopup={openPopupFormEditor}
                  onCreateFormSection={createConnectedFormSection}
                  onEditFormSection={openSectionFormEditor}
                  onUpdatePopup={updatePopup}
                  onSyncFlow={syncConnectedFlow}
                />
              </>
            ) : selectedSection.type === "textBanner" || selectedSection.type === "imageText" || selectedSection.type === "simulatorsFeed" || selectedSection.type === "coursesFeed" || selectedSection.type === "evaluationsFeed" ? (
              <ActionConfigEditor
                title="CTA del bloque"
                action={selectedSection.data?.ctaAction}
                onChange={(action) => updateSelectedSectionAction("ctaAction", action)}
                sections={currentSections}
                pages={pages}
                popups={config.popups}
                simulators={simulatorActionOptions}
                onCreateFormPopup={createConnectedFormPopup}
                onEditFormPopup={openPopupFormEditor}
                onCreateFormSection={createConnectedFormSection}
                onEditFormSection={openSectionFormEditor}
                onUpdatePopup={updatePopup}
                onSyncFlow={syncConnectedFlow}
              />
            ) : selectedSection.type === "formBuilder" ? (
              <ActionConfigEditor
                title="Accion tras enviar"
                action={selectedSection.data?.submitAction}
                onChange={(action) => updateSelectedSectionAction("submitAction", action)}
                sections={currentSections}
                pages={pages}
                popups={config.popups}
                simulators={simulatorActionOptions}
                onCreateFormPopup={createConnectedFormPopup}
                onEditFormPopup={openPopupFormEditor}
                onCreateFormSection={createConnectedFormSection}
                onEditFormSection={openSectionFormEditor}
                onUpdatePopup={updatePopup}
                onSyncFlow={syncConnectedFlow}
              />
            ) : (selectedSection as CMSSection).type === "customCode" ? (
              <>
                <Card title="Elemento HTML">
                  {htmlEl?.eid ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                        <div className="text-sm font-semibold text-white">
                          {htmlEl.tag}
                          {htmlEl.isActionable ? " interactivo" : ""}
                        </div>
                        <div className="mt-1 text-xs text-white/45">
                          {htmlEl.text?.trim() || htmlEl.attrs?.href || "Seleccionado desde el canvas"}
                        </div>
                      </div>
                      {htmlEl.isActionable ? (
                        <div className="rounded-2xl border border-primary/15 bg-primary/[0.04] px-4 py-3 text-sm text-white/65">
                          Conecta este boton o enlace sin tocar codigo. El destino se ejecutara desde el motor de acciones del sitio.
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 text-sm text-white/45">
                          Este elemento no es un boton ni un link. Selecciona un CTA del HTML para configurarle una accion.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-5 text-sm text-white/45">
                      Selecciona un boton o link dentro del HTML importado para conectarlo desde aqui.
                    </div>
                  )}
                </Card>

                {htmlEl?.eid && htmlEl.isActionable ? (
                  <>
                    <ActionConfigEditor
                      title="Accion del elemento"
                      action={selectedHtmlActionBinding?.action}
                      onChange={updateSelectedHtmlActionBinding}
                      sections={currentSections}
                      pages={pages}
                      popups={config.popups}
                      simulators={simulatorActionOptions}
                      onCreateFormPopup={createConnectedFormPopup}
                      onEditFormPopup={openPopupFormEditor}
                      onCreateFormSection={createConnectedFormSection}
                      onEditFormSection={openSectionFormEditor}
                      onUpdatePopup={updatePopup}
                      onSyncFlow={syncConnectedFlow}
                    />
                    {selectedHtmlActionBinding ? (
                      <Card title="Gestion">
                        <Btn variant="danger" onClick={removeSelectedHtmlActionBinding}>
                          <Trash2 className="h-4 w-4" />
                          Quitar accion conectada
                        </Btn>
                      </Card>
                    ) : null}
                  </>
                ) : null}

                {(((selectedSection.data?.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? []).length > 0) ? (
                  <Card title="Acciones conectadas">
                    <div className="space-y-3">
                      {(((selectedSection.data?.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? [])).map((binding) => (
                        <button
                          key={binding.id}
                          type="button"
                          onClick={() => {
                            htmlIframeRef.current?.contentWindow?.postMessage({ __editor_cmd: true, cmd: "highlight", eid: binding.eid }, "*")
                            setInspectorTab("content")
                          }}
                          className="flex w-full items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-white/[0.05]"
                        >
                          <div>
                            <div className="text-sm font-semibold text-white">{binding.label}</div>
                            <div className="mt-1 text-xs text-white/40">{binding.tag || "elemento"} · {getActionSummary(binding.action || { type: "none" })}</div>
                          </div>
                          <Pencil className="h-4 w-4 text-white/35" />
                        </button>
                      ))}
                    </div>
                  </Card>
                ) : null}
              </>
            ) : (
              <Card title="Sin acciones configurables">
                <p className="text-sm text-muted-foreground">Este bloque no expone acciones por ahora. Usa Contenido y Estilo para ajustar su presentacion.</p>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-5 p-5">
            <Card title="Importar HTML inteligente">
              <HtmlImporter
                onCreateSection={(type, data) => {
                  createImportedSection(type, data, { afterSectionId: selectedSection.id })
                }}
              />
            </Card>
            <Card title="Bloque">
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">ID</span><span className="font-mono text-foreground">{selectedSection.id}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Tipo</span><span className="font-medium text-foreground">{selectedSection.type}</span></div>
                <div className="flex items-center justify-between gap-4"><span className="text-muted-foreground">Estado</span><span className={cn("font-medium", selectedSection.visible ? "text-emerald-400" : "text-amber-400")}>{selectedSection.visible ? "Visible" : "Oculto"}</span></div>
              </div>
            </Card>
            <Card title="Visibilidad publica">
              <div className="space-y-4">
                <F label="Audiencia">
                  <select
                    className={iCls}
                    value={selectedSection.settings?.visibility?.audience || "all"}
                    onChange={(event) =>
                      updateSelectedSectionSettings({
                        ...(selectedSection.settings ?? {}),
                        visibility: {
                          ...(selectedSection.settings?.visibility ?? {}),
                          audience: event.target.value as "all" | "guest" | "authenticated",
                        },
                      })
                    }
                  >
                    <option value="all">Todos</option>
                    <option value="guest">Solo visitantes</option>
                    <option value="authenticated">Solo usuarios autenticados</option>
                  </select>
                </F>
                <F label="Dispositivo">
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { key: "all", label: "Todos" },
                      { key: "desktop", label: "Desktop" },
                      { key: "mobile", label: "Mobile" },
                    ].map((option) => {
                      const active = (selectedSection.settings?.visibility?.device || "all") === option.key
                      return (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() =>
                            updateSelectedSectionSettings({
                              ...(selectedSection.settings ?? {}),
                              visibility: {
                                ...(selectedSection.settings?.visibility ?? {}),
                                device: option.key as "all" | "desktop" | "mobile",
                              },
                            })
                          }
                          className={cn(
                            "rounded-xl border px-3 py-2 text-sm font-medium transition-all",
                            active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/35"
                          )}
                        >
                          {option.label}
                        </button>
                      )
                    })}
                  </div>
                </F>
                <button
                  type="button"
                  onClick={() =>
                    updateSelectedSectionSettings({
                      ...(selectedSection.settings ?? {}),
                      visibility: {
                        ...(selectedSection.settings?.visibility ?? {}),
                        hideIfEmpty: !(selectedSection.settings?.visibility?.hideIfEmpty === true),
                      },
                    })
                  }
                  className={cn(
                    "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left transition-all",
                    selectedSection.settings?.visibility?.hideIfEmpty === true
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/10 hover:border-primary/35"
                  )}
                >
                  <div>
                    <div className="text-sm font-semibold text-white">Ocultar si no hay datos</div>
                    <div className="mt-1 text-xs text-white/45">Util para bloques conectados a simuladores, cursos o evaluaciones.</div>
                  </div>
                  <div className={cn("rounded-full px-2 py-1 text-[10px] font-semibold", selectedSection.settings?.visibility?.hideIfEmpty === true ? "bg-primary text-white" : "bg-white/5 text-white/40")}>
                    {selectedSection.settings?.visibility?.hideIfEmpty === true ? "Activo" : "Inactivo"}
                  </div>
                </button>
              </div>
            </Card>
            <Card title="Acciones">
              <div className="grid grid-cols-2 gap-3">
                <Btn onClick={() => toggleSectionVisibility(selectedSection.id)}>{selectedSection.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{selectedSection.visible ? "Ocultar" : "Mostrar"}</Btn>
                <Btn onClick={() => duplicateSectionInPage(selectedSection.id)}><Copy className="h-4 w-4" />Duplicar</Btn>
                <Btn onClick={() => moveSection(selectedSection.id, -1)}><ArrowUp className="h-4 w-4" />Subir</Btn>
                <Btn onClick={() => moveSection(selectedSection.id, 1)}><ArrowDown className="h-4 w-4" />Bajar</Btn>
              </div>
              {getStudioSectionMeta(selectedSection.type)?.deletable && <div className="pt-3"><Btn variant="danger" onClick={() => deleteSection(selectedSection.id)} className="w-full justify-center"><Trash2 className="h-4 w-4" />Eliminar bloque</Btn></div>}
            </Card>
          </div>
        )}
      </div>
    </div>
  )

  const forceHtmlInspector =
    selectedSection?.type === "customCode" && (Boolean(htmlEl) || htmlEditing)

  const renderNavigationInspector = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Link2 className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Navegacion del sitio</div>
          <div className="text-xs text-white/40">Edita los links y botones del header publico.</div>
        </div>
        <div className="ml-auto">{renderInspectorCollapseAction()}</div>
      </div>
      {renderInspectorTabsRow({ contentOnly: true })}
      <div className="flex-1 overflow-y-auto p-5">
        <TabNavegacion config={config} onChange={handleChange} />
      </div>
    </div>
  )

  const renderSettingsInspector = () => (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-white/8 px-5 py-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 text-primary"><Settings className="h-4 w-4" /></div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">Configuracion global</div>
          <div className="text-xs text-white/40">Identidad del sitio, footer y ajustes base.</div>
        </div>
        <div className="ml-auto">{renderInspectorCollapseAction()}</div>
      </div>
      <div className="flex-1 overflow-y-auto p-5">
        <TabGeneral config={config} onChange={handleChange} />
      </div>
    </div>
  )

  const renderActiveLeftSidebar = () => {
    if (leftTab === "pages") return renderPagesSidebar()
    if (leftTab === "layers") return renderLayersSidebar()
    if (leftTab === "components") return renderComponentsSidebar()
    if (leftTab === "popups") return renderPopupsSidebar()
    if (leftTab === "forms") return renderFormsSidebar()
    if (leftTab === "simulators") return renderSimulatorsSidebar()
    if (leftTab === "assets") return renderAssetsSidebar()
    if (leftTab === "navigation") return renderNavigationSidebar()
    return renderSettingsSidebar()
  }

  const renderActiveInspectorPanel = () => {
    if (forceHtmlInspector) return renderLayersInspector()
    if (leftTab === "pages") return renderPagesInspector()
    if (leftTab === "layers" || leftTab === "components" || leftTab === "assets") return renderLayersInspector()
    if (leftTab === "popups") return renderPopupsInspector()
    if (leftTab === "forms") return renderFormsInspector()
    if (leftTab === "simulators") return renderSimulatorsInspector()
    if (leftTab === "navigation") return renderNavigationInspector()
    return renderSettingsInspector()
  }

  const renderFocusModeDock = () => {
    if (!focusEditingMode) return null

    const dockButtons = [
      {
        key: "layers",
        label: "Capas",
        icon: Layers,
        active: focusLeftOpen && leftTab === "layers",
        onClick: () => openFocusLeftTab("layers"),
      },
      {
        key: "components",
        label: "Bloques",
        icon: LayoutTemplate,
        active: focusLeftOpen && leftTab === "components",
        onClick: () => openFocusLeftTab("components"),
      },
      {
        key: "pages",
        label: "Paginas",
        icon: Globe,
        active: focusLeftOpen && leftTab === "pages",
        onClick: () => openFocusLeftTab("pages"),
      },
      {
        key: "add",
        label: "Agregar",
        icon: Plus,
        active: false,
        onClick: () => {
          setInsertIndex(null)
          setShowAdd(true)
        },
      },
      {
        key: "inspector",
        label: "Inspector",
        icon: SelectedSectionIcon ?? Pencil,
        active: focusRightOpen,
        onClick: () => setFocusRightOpen((current) => !current),
      },
    ] as const

    return (
      <div className="pointer-events-none absolute inset-0 z-30">
        <div className="pointer-events-auto absolute left-3 right-3 bottom-3 flex flex-wrap items-center gap-2 rounded-[26px] border border-white/10 bg-[#08111b]/92 p-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl md:left-3 md:right-auto md:top-3 md:bottom-auto md:w-[170px] md:flex-col">
          <div className="w-full rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] font-bold uppercase tracking-[0.22em] text-primary/85">
            Modo enfoque
          </div>
          {dockButtons.map((button) => (
            <button
              key={button.key}
              type="button"
              onClick={button.onClick}
              className={cn(
                "inline-flex h-10 min-w-[126px] flex-1 items-center justify-center gap-2 rounded-2xl border px-3 text-sm font-medium transition-all md:w-full md:flex-none md:justify-start",
                button.active
                  ? "border-primary/40 bg-primary/12 text-primary shadow-[0_10px_30px_rgba(232,57,42,0.18)]"
                  : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
              )}
            >
              <button.icon className="h-4 w-4 flex-shrink-0" />
              <span className="truncate">{button.label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  const renderFocusLeftOverlay = () => {
    if (!focusEditingMode || !focusLeftOpen) return null

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute inset-x-3 bottom-3 max-h-[78%] lg:inset-y-3 lg:left-3 lg:right-auto lg:w-[340px] xl:w-[360px]">
          <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#08111b]/96 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <button
              type="button"
              onClick={() => setFocusLeftOpen(false)}
              className="absolute right-3 top-3 z-20 inline-flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#0b1220]/90 text-white/50 transition-all hover:border-white/20 hover:text-white"
              aria-label={`Cerrar panel ${activeLeftTabMeta.label}`}
              title={`Cerrar panel ${activeLeftTabMeta.label}`}
            >
              <X className="h-4 w-4" />
            </button>
            <div className="min-h-0 flex-1">{renderActiveLeftSidebar()}</div>
          </div>
        </div>
      </div>
    )
  }

  const renderFocusRightOverlay = () => {
    if (!focusEditingMode || !focusRightOpen) return null

    return (
      <div className="pointer-events-none absolute inset-0 z-20">
        <div className="pointer-events-auto absolute inset-x-3 bottom-3 max-h-[82%] lg:inset-y-3 lg:right-3 lg:left-auto lg:w-[360px] xl:w-[390px]">
          <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-[30px] border border-white/10 bg-[#08111b]/96 shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            {renderActiveInspectorPanel()}
          </div>
        </div>
      </div>
    )
  }

  const renderFocusContextBar = () => {
    if (!focusEditingMode) return null

    const currentFocusTabs = selectedSection
      ? inspectorTabs
      : inspectorTabs.filter((tabItem) => tabItem.id === "advanced")

    const focusTitle = htmlEl?.eid
      ? `${htmlEl.tag}${htmlEl.eid ? ` [${htmlEl.eid}]` : ""}`
      : selectedSectionMeta?.label ?? "Selecciona un bloque"

    const focusSubtitle = htmlEl?.eid
      ? "Elemento HTML activo"
      : selectedSection
        ? `Bloque ${selectedSection.type}`
        : "Haz clic en el canvas para comenzar"

    return (
      <div className="pointer-events-none absolute inset-x-0 bottom-4 z-30 hidden justify-center lg:flex">
        <div className="studio-scroll pointer-events-auto flex max-w-[min(860px,calc(100%-220px))] items-center gap-2 overflow-x-auto rounded-[26px] border border-white/10 bg-[#08111b]/92 px-3 py-2 shadow-[0_24px_70px_rgba(0,0,0,0.45)] backdrop-blur-xl">
          <div className="shrink-0 rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div className="text-xs font-semibold text-white">{focusTitle}</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-white/35">{focusSubtitle}</div>
          </div>
          {currentFocusTabs.map((tabItem) => (
            <button
              key={tabItem.id}
              type="button"
              onClick={() => openFocusInspectorTab(tabItem.id)}
              className={cn(
                "inline-flex h-10 shrink-0 items-center gap-2 rounded-2xl border px-3.5 text-sm font-medium transition-all",
                inspectorTab === tabItem.id && focusRightOpen
                  ? "border-primary/40 bg-primary/12 text-primary"
                  : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"
              )}
            >
              <tabItem.icon className="h-4 w-4" />
              {tabItem.label}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex h-[100dvh] min-h-0 w-full flex-col overflow-hidden bg-[#07111f] pb-[env(safe-area-inset-bottom)] pt-[env(safe-area-inset-top)] text-white">
      <header className="relative z-30 flex flex-shrink-0 flex-col gap-3 border-b border-white/10 bg-[#08111f] px-3 py-3 sm:px-4 xl:px-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">Studio</div>
          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-2">
            <div className="truncate text-lg font-semibold text-white">{currentPageTitle}</div>
            <span className="truncate text-xs uppercase tracking-[0.18em] text-white/28">{currentRoute}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {changed && !isAutosaving && <span className="rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] text-amber-300">Sin guardar</span>}
            {saved && !changed && <span className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">Guardado</span>}
            {isAutosaving && <span className="rounded-full border border-sky-400/20 bg-sky-500/10 px-2.5 py-1 text-[11px] text-sky-300">Auto guardando...</span>}
            {published && <span className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-1 text-[11px] text-primary">Publicado</span>}
          </div>
        </div>

        <div className="studio-scroll flex max-w-full items-center gap-2 overflow-x-auto pb-1 lg:justify-end lg:pb-0">
          <a href={currentRoute} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3.5 text-sm font-medium text-white/65 transition-all hover:border-white/20 hover:text-white whitespace-nowrap">
            <ExternalLink className="h-4 w-4" />
            Ver sitio
          </a>
          <button onClick={handleSave} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl bg-primary px-3.5 text-sm font-semibold text-white transition-all hover:bg-primary/90 whitespace-nowrap">
            <Save className="h-4 w-4" />
            Guardar
          </button>
          <button onClick={handlePublish} className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-primary/30 bg-primary/12 px-3.5 text-sm font-semibold text-primary transition-all hover:bg-primary/20 whitespace-nowrap">
            <Check className="h-4 w-4" />
            Publicar
          </button>
          <a href="/admin" className="inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border border-white/10 px-3.5 text-sm font-medium text-white/65 transition-all hover:border-white/20 hover:text-white whitespace-nowrap">
            <ArrowLeft className="h-4 w-4" />
            Volver al admin
          </a>
        </div>
        </div>

        <div className="studio-scroll flex items-center gap-2 overflow-x-auto pb-1 lg:justify-center lg:pb-0">
          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            <button
              type="button"
              onClick={handleUndo}
              disabled={!past.length}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Deshacer"
            >
              <Undo2 className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={handleRedo}
              disabled={!future.length}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-white/40 transition-all hover:text-white disabled:cursor-not-allowed disabled:opacity-25"
              aria-label="Rehacer"
            >
              <Redo2 className="h-4 w-4" />
            </button>
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {STUDIO_DEVICES.map((device) => (
              <button
                key={device.id}
                type="button"
                onClick={() => setViewport(device.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all",
                  viewport === device.id ? "bg-primary text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                <device.icon className="h-3.5 w-3.5" />
                {device.label}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {(["fit", 100, 75, 50] as const).map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => setZoomMode(value)}
                className={cn(
                  "inline-flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-all",
                  zoomMode === value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                {value === "fit" ? "Fit" : `${value}%`}
              </button>
            ))}
          </div>
          <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
            {([
              { id: "edit", label: "Editar" },
              { id: "preview", label: "Vista previa" },
              { id: "review", label: "Revisar pagina" },
            ] as const).map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setStudioMode(option.id)}
                className={cn(
                  "inline-flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-all",
                  studioMode === option.id ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setFocusMode((value) => !value)}
            className={cn(
              "inline-flex h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-medium transition-all whitespace-nowrap",
              focusMode
                ? "border-primary/35 bg-primary/12 text-primary"
                : "border-white/10 text-white/60 hover:border-white/20 hover:text-white"
            )}
          >
            <Monitor className="h-4 w-4" />
            {focusMode ? "Salir enfoque" : "Modo enfoque"}
          </button>
          {viewport === "desktop" && (
            <div className="flex shrink-0 items-center gap-1 rounded-2xl border border-white/10 bg-white/[0.03] p-1">
              {([1440, 1280] as const).map((width) => (
                <button
                  key={width}
                  type="button"
                  onClick={() => setDesktopWidth(width)}
                  className={cn(
                    "inline-flex items-center rounded-xl px-3 py-2 text-xs font-medium transition-all",
                    desktopWidth === width ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                  )}
                >
                  {width}px
                </button>
              ))}
            </div>
          )}
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 w-full">
        {!canvasOnlyMode && (
          <aside className={cn("flex min-h-0 flex-shrink-0 border-r border-white/10 bg-[#060d18] transition-all duration-200", leftPanelCollapsed ? "w-[64px]" : "w-[clamp(220px,18vw,272px)] max-[1200px]:w-[220px]")}>
            {renderLeftIconRail()}
            {!leftPanelCollapsed && (
              <div className="min-h-0 min-w-0 flex-1">
                {renderActiveLeftSidebar()}
              </div>
            )}
          </aside>
        )}

        <main className="min-w-0 min-h-0 flex-1 flex flex-col overflow-hidden bg-[#060b12]">
          <StudioViewport
            title={currentPageTitle}
            route={currentRoute}
            sections={currentSections}
            selectedId={selectedSectionId}
            onSelect={(id) => {
              setSelectedSectionId(id)
              setLeftTab("layers")
              setInspectorTab("content")
              setRightPanelCollapsed(false)
            }}
            config={config}
            mode={viewport}
            desktopWidth={desktopWidth}
            zoomMode={zoomMode}
            previewMode={studioMode !== "edit"}
            onInlineUpdate={updateSectionInlineContent}
            onDuplicate={duplicateSectionInPage}
            onToggleVisibility={toggleSectionVisibility}
            onMove={moveSection}
            onDelete={deleteSection}
            onReorder={reorderSectionToIndex}
            onAddBlock={(index) => {
              setInsertIndex(index ?? null)
              setShowAdd(true)
            }}
            htmlIframeRef={htmlIframeRef}
            onHtmlElementSelect={handleHtmlElementSelect}
            onHtmlEditingChange={handleHtmlEditingChange}
            onHtmlSnapshot={handleHtmlSnapshot}
          />
        </main>

        {!canvasOnlyMode && (
          <aside className={cn("relative flex min-h-0 flex-shrink-0 flex-col border-l border-white/10 bg-[#08111b] transition-all duration-200", rightPanelCollapsed ? "w-[64px]" : "w-[clamp(240px,28vw,360px)] min-w-[240px] max-[1200px]:w-[280px]")}>
            {rightPanelCollapsed ? (
              renderCollapsedInspectorRail()
            ) : (
              renderActiveInspectorPanel()
            )}
          </aside>
        )}

        {focusEditingMode ? (
          <>
            {renderFocusModeDock()}
            {renderFocusLeftOverlay()}
            {renderFocusRightOverlay()}
            {renderFocusContextBar()}
          </>
        ) : null}
      </div>

      {showAdd && (
        <AddModal
          onAdd={addSection}
          onClose={() => { setInsertIndex(null); setShowAdd(false) }}
          pageMode={!currentPage.home}
        />
      )}

      {showNewPage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/72 p-4 backdrop-blur-sm" onClick={() => setShowNewPage(false)}>
          <div className="w-full max-w-md rounded-3xl border border-white/10 bg-[#0a111b] p-6 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-3">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-primary">Nueva pagina</div>
                <div className="mt-1 text-lg font-semibold text-white">Crear pagina del sitio</div>
              </div>
              <button type="button" onClick={() => setShowNewPage(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 text-white/40 transition-all hover:text-white/70">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-4">
              <F label="Nombre de la pagina">
                <input className={iCls} value={newTitle} autoFocus placeholder="Ej. Cursos premium" onChange={(event) => { const value = event.target.value; setNewTitle(value); setNewSlug(sanitizeStudioSlug(value)) }} />
              </F>
              <F label="Slug / URL" helper={`La pagina quedara disponible en /${newSlug || "mi-pagina"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/</span>
                  <input className={iCls} value={newSlug} placeholder="mi-pagina" onChange={(event) => setNewSlug(sanitizeStudioSlug(event.target.value))} />
                </div>
              </F>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Btn onClick={() => setShowNewPage(false)}>Cancelar</Btn>
              <Btn variant="primary" onClick={createPage} disabled={!newTitle.trim() || !newSlug.trim()}>
                <Plus className="h-4 w-4" />
                Crear pagina
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


const DASH_TABS = [
  { id: "nav",      label: "Navegacion", icon: Link2 },
  { id: "sections", label: "Inicio",     icon: LayoutTemplate },
  { id: "pages",    label: "Paginas",    icon: Globe },
  { id: "general",  label: "General",    icon: Settings },
]

function DashboardLayout({ config, onChange }: { config: CMSConfig; onChange: CMSChangeHandler }) {
  const [tab, setTab] = useState("sections")
  const [saved, setSaved] = useState(false)
  const [changed, setChanged] = useState(false)

  const handleChange = (next: CMSConfig) => { onChange(next); setChanged(true) }

  const handleSave = () => {
    saveCMSConfig(config, "draft")
    setSaved(true); setChanged(false)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleReset = () => {
    if (!confirm("Â¿Restablecer toda la configuracion al estado por defecto?")) return
    onChange({ ...DEFAULT_CMS }); setChanged(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutTemplate className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl text-foreground">Editor Studio</h1>
            <p className="text-xs text-muted-foreground">Constructor visual sin codigo para inicio y paginas internas</p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {changed && (
            <span className="flex items-center gap-1.5 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 px-3 py-1.5 rounded-full">
              <AlertCircle className="w-3.5 h-3.5" />Cambios sin guardar
            </span>
          )}
          <a href="/" target="_blank" className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-card text-xs text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
            <ExternalLink className="w-3.5 h-3.5" />Ver sitio
          </a>
          <button onClick={handleReset} className="flex items-center gap-1.5 h-9 px-4 rounded-xl border border-border bg-card text-xs text-muted-foreground hover:text-foreground transition-all">
            <RefreshCw className="w-3.5 h-3.5" />Restablecer
          </button>
          <button onClick={handleSave} className={cn("flex items-center gap-1.5 h-9 px-5 rounded-xl text-sm font-semibold transition-all", saved ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-primary text-white hover:bg-primary/90")}>
            {saved ? <><Check className="w-4 h-4" />Guardado</> : <><Save className="w-4 h-4" />Guardar</>}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        {[
          { v: config.sections.filter(s => s.visible).length.toString(), l: "Secciones inicio" },
          { v: (config.pages ?? []).length.toString(), l: "Paginas del sitio" },
          { v: config.nav.items.length.toString(), l: "Links del menu" },
          { v: config.sections.length.toString(), l: "Bloques en total" },
        ].map((s, i) => (
          <div key={i} className="rounded-2xl border border-border bg-card px-5 py-4">
            <div className="text-2xl font-display text-foreground mb-0.5">{s.v}</div>
            <div className="text-xs text-muted-foreground">{s.l}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1.5 rounded-2xl bg-secondary/20 border border-border w-fit">
        {DASH_TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all", tab === t.id ? "bg-card text-foreground shadow-sm border border-border" : "text-muted-foreground hover:text-foreground")}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {tab === "nav"      && <TabNavegacion config={config} onChange={handleChange} />}
      {tab === "sections" && <TabSecciones  config={config} onChange={handleChange} />}
      {tab === "pages"    && <TabPaginas    config={config} onChange={handleChange} />}
      {tab === "general"  && <TabGeneral    config={config} onChange={handleChange} />}
    </div>
  )
}

// â”€â”€â”€ Main export â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function AdminCMSPage({ studioMode = false }: { studioMode?: boolean }) {
  const [config, setConfig] = useState<CMSConfig | null>(null)

  useEffect(() => { setConfig(getCMSConfig("draft")) }, [])

  useEffect(() => {
    if (!studioMode || typeof document === "undefined") return

    const docEl = document.documentElement
    const body = document.body
    const previous = {
      docOverflow: docEl.style.overflow,
      docHeight: docEl.style.height,
      bodyOverflow: body.style.overflow,
      bodyHeight: body.style.height,
      bodyOverscroll: body.style.overscrollBehavior,
    }

    window.scrollTo({ top: 0, left: 0, behavior: "auto" })
    docEl.style.overflow = "hidden"
    docEl.style.height = "100%"
    body.style.overflow = "hidden"
    body.style.height = "100%"
    body.style.overscrollBehavior = "none"

    return () => {
      docEl.style.overflow = previous.docOverflow
      docEl.style.height = previous.docHeight
      body.style.overflow = previous.bodyOverflow
      body.style.height = previous.bodyHeight
      body.style.overscrollBehavior = previous.bodyOverscroll
    }
  }, [studioMode])

  const handleChange: CMSChangeHandler = (next) => {
    setConfig((current) => {
      if (!current) return typeof next === "function" ? next(DEFAULT_CMS) : next
      return typeof next === "function" ? next(current) : next
    })
  }

  if (!config) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  )

  if (studioMode) {
    return <StudioLayout config={config} onChange={handleChange} />
  }

  return <DashboardLayout config={config} onChange={handleChange} />
}
