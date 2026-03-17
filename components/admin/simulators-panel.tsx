"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  AlertCircle, Archive, Award, BarChart2, BookOpen, Check, CheckCircle2,
  ChevronDown, ChevronUp, Clock, Copy, Eye, FileText, Filter, Globe,
  GripVertical, HelpCircle, LayoutGrid, Loader2, Palette, Pencil, Play,
  Plus, RefreshCw, Save, Search, Settings, Sliders, Sparkles, Star,
  Tag, Trash2, Trophy, Upload, Users, X, Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type {
  CampoBuilder, CampoTipo, PreguntaBuilder, SimuladorBuilder,
} from "@/simuladores/types"
import {
  actualizarSimulador, eliminarSimulador, getSimuladores, guardarSimulador,
} from "@/simuladores/storage"

// ─────────────────────────────────────────────────────────────────
// UTILS
// ─────────────────────────────────────────────────────────────────

function uid() {
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function crearSimuladorBase(): SimuladorBuilder {
  return {
    id: `sim_${Date.now()}`,
    titulo: "",
    descripcion: "",
    subtitulo: "",
    categoria: "",
    tags: [],
    icono: "🎯",
    estado: "borrador",
    formMode: "personalizado",
    formulario: [],
    preguntas: [],
    instrucciones: "",
    config: {
      tiempoPregunta: 60,
      preguntasMax: 10,
      retroalimentacion: true,
      revisionFinal: true,
      modoIA: false,
      detectarDuplicadas: true,
      intentosMax: 3,
      cooldownMinutos: 30,
      ordenAleatorioPeguntas: false,
      ordenAleatorioOpciones: false,
      mostrarNumeroPregunta: true,
      permitirNavegacion: false,
      pasarSinResponder: false,
      mostrarTemporizador: true,
      umbralAprobacion: 70,
      mensajeAprobado: "¡Felicitaciones! Aprobaste el simulacro.",
      mensajeReprobado: "Sigue practicando. Puedes volver a intentarlo.",
    },
    tema: {
      colorPrimario: "#e53935",
      colorSecundario: "#1a237e",
      colorFondo: "#ffffff",
      colorTexto: "#1a1a2e",
      borderRadius: "suave",
      estiloCard: "elevado",
      mostrarProgreso: true,
      animaciones: true,
      oscuro: false,
    },
    certificado: {
      habilitado: false,
      umbralAprobacion: 80,
      titulo: "Certificado de Participación",
      subtitulo: "Ha completado satisfactoriamente el simulacro",
      textoPie: "Plataforma Educativa HackEvans",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as SimuladorBuilder
}

type BadgeInfo = { label: string; cls: string; dot: string }

function estadoBadge(estado: SimuladorBuilder["estado"]): BadgeInfo {
  const m: Record<string, BadgeInfo> = {
    borrador:    { label: "Borrador",    cls: "bg-amber-500/10 text-amber-500 border-amber-500/30",     dot: "bg-amber-500" },
    en_revision: { label: "En revisión", cls: "bg-blue-500/10 text-blue-400 border-blue-500/30",       dot: "bg-blue-400" },
    publicado:   { label: "Publicado",   cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30", dot: "bg-emerald-400" },
    archivado:   { label: "Archivado",   cls: "bg-zinc-600/20 text-zinc-400 border-zinc-600/30",       dot: "bg-zinc-500" },
  }
  return m[estado] ?? m.borrador
}

// ─────────────────────────────────────────────────────────────────
// ATOM COMPONENTS
// ─────────────────────────────────────────────────────────────────

const inputCls =
  "h-10 w-full rounded-xl border border-border bg-secondary/15 px-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"

function Btn({
  children, onClick, variant = "secondary", size = "md", disabled, className, type = "button",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger" | "success"
  size?: "xs" | "sm" | "md"
  disabled?: boolean
  className?: string
  type?: "button" | "submit"
}) {
  const v = {
    primary:   "bg-primary text-white hover:bg-primary/90 shadow-sm shadow-primary/20",
    secondary: "border border-border bg-card text-foreground hover:bg-secondary/30",
    ghost:     "text-muted-foreground hover:text-foreground hover:bg-secondary/20",
    danger:    "border border-red-500/25 bg-red-500/8 text-red-400 hover:bg-red-500/20 hover:border-red-500/50",
    success:   "border border-emerald-500/25 bg-emerald-500/8 text-emerald-400 hover:bg-emerald-500/15",
  }
  const s = {
    xs: "h-6 px-2 text-[11px] gap-1 rounded-lg",
    sm: "h-8 px-3 text-xs gap-1.5 rounded-xl",
    md: "h-9 px-4 text-sm gap-2 rounded-xl",
  }
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-semibold transition-all select-none",
        v[variant], s[size],
        disabled && "opacity-40 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  )
}

function Inp({
  label, value, onChange, placeholder, type = "text", required, hint, className, rows,
}: {
  label?: string
  value: string | number
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  required?: boolean
  hint?: string
  className?: string
  rows?: number
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
          {required && <span className="text-primary">*</span>}
        </label>
      )}
      {rows ? (
        <textarea
          rows={rows}
          className="w-full rounded-xl border border-border bg-secondary/15 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      ) : (
        <input
          type={type}
          className={inputCls}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
        />
      )}
      {hint && <span className="text-[11px] text-muted-foreground/60 leading-relaxed">{hint}</span>}
    </div>
  )
}

function Sel({
  label, value, onChange, options, hint, className,
}: {
  label?: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  hint?: string
  className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </label>
      )}
      <select className={inputCls} value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {hint && <span className="text-[11px] text-muted-foreground/60">{hint}</span>}
    </div>
  )
}

function Toggle({
  label, sublabel, value, onChange,
}: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="group flex items-center justify-between gap-4 rounded-xl px-4 py-3 hover:bg-secondary/10 transition-colors cursor-pointer" onClick={() => onChange(!value)}>
      <div className="min-w-0 flex-1 pointer-events-none">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{sublabel}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        onClick={e => { e.stopPropagation(); onChange(!value) }}
        className={cn(
          "relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0 border",
          value ? "bg-primary border-primary" : "bg-secondary/40 border-border",
        )}
      >
        <span className={cn(
          "absolute top-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200",
          value ? "left-[18px]" : "left-0.5",
        )} />
      </button>
    </div>
  )
}

function Stepper({
  label, sublabel, value, min = 0, max, step = 1, unit, onChange,
}: {
  label: string; sublabel?: string; value: number; min?: number; max?: number
  step?: number; unit?: string; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 hover:bg-secondary/10 transition-colors">
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - step))}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/25 hover:bg-secondary transition-colors text-muted-foreground"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
        <span className="min-w-[64px] text-center text-sm font-bold text-foreground tabular-nums">
          {value}
          {unit && <span className="text-xs text-muted-foreground ml-0.5 font-normal">{unit}</span>}
        </span>
        <button
          type="button"
          onClick={() => onChange(max ? Math.min(max, value + step) : value + step)}
          className="flex h-7 w-7 items-center justify-center rounded-lg border border-border bg-secondary/25 hover:bg-secondary transition-colors text-muted-foreground"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

function SCard({
  icon, title, subtitle, action, children, noPad,
}: {
  icon?: React.ReactNode; title: string; subtitle?: string
  action?: React.ReactNode; children: React.ReactNode; noPad?: boolean
}) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-border/60 bg-secondary/5">
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <div className="text-sm font-bold text-foreground">{title}</div>
            {subtitle && <div className="text-xs text-muted-foreground truncate">{subtitle}</div>}
          </div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className={noPad ? "" : "p-5"}>{children}</div>
    </div>
  )
}

function ColorPick({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</label>
      <div className="flex items-center gap-2">
        <input type="color" value={value} onChange={e => onChange(e.target.value)} className="h-10 w-10 rounded-xl border border-border cursor-pointer p-1 bg-transparent" />
        <input type="text" value={value} onChange={e => onChange(e.target.value)} className="flex-1 h-10 rounded-xl border border-border bg-secondary/15 px-3 text-sm font-mono text-foreground focus:border-primary focus:outline-none" />
      </div>
    </div>
  )
}

function ImageUploadBtn({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isImage = value?.startsWith("data:") || value?.startsWith("http") || value?.startsWith("/")

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return
    const reader = new FileReader()
    reader.onload = e => onChange(e.target?.result as string)
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  return (
    <div
      className={cn(
        "group relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-dashed border-border bg-secondary/20 cursor-pointer overflow-hidden transition-all hover:border-primary/60 hover:bg-secondary/40",
      )}
      onClick={() => inputRef.current?.click()}
      onDragOver={e => e.preventDefault()}
      onDrop={handleDrop}
      title="Subir imagen"
    >
      {isImage ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="ícono" className="h-full w-full object-cover" />
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-5 w-5 text-white" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1.5 pointer-events-none">
          <Upload className="h-5 w-5 text-muted-foreground/50" />
          <span className="text-[10px] font-semibold text-muted-foreground/50 text-center leading-tight">Subir<br />imagen</span>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: LISTA
// ─────────────────────────────────────────────────────────────────

const MOTORES = [
  { n: 1, title: "Motor Form Builder", desc: "Formulario inicial de datos del participante", color: "text-primary", bg: "bg-primary/8 border-primary/20" },
  { n: 2, title: "Motor Banco de Preguntas", desc: "Editor y gestor del banco de preguntas", color: "text-blue-400", bg: "bg-blue-500/8 border-blue-500/20" },
  { n: 3, title: "Motor Simulador Builder", desc: "Constructor visual del simulacro completo", color: "text-amber-400", bg: "bg-amber-500/8 border-amber-500/20" },
  { n: 4, title: "Motor Renderizador", desc: "Presentación del simulacro para el usuario", color: "text-emerald-400", bg: "bg-emerald-500/8 border-emerald-500/20" },
]

function PanelLista({ simuladores, onEditar, onEliminar, onNuevo }: {
  simuladores: SimuladorBuilder[]
  onEditar: (s: SimuladorBuilder) => void
  onEliminar: (id: string) => void
  onNuevo: () => void
}) {
  const [q, setQ] = useState("")
  const [est, setEst] = useState("todos")

  const filtered = simuladores.filter(s => {
    const mq = !q || s.titulo.toLowerCase().includes(q.toLowerCase())
      || (s.descripcion || "").toLowerCase().includes(q.toLowerCase())
      || (s.categoria || "").toLowerCase().includes(q.toLowerCase())
    return mq && (est === "todos" || s.estado === est)
  })

  const stats = [
    { label: "Total", value: simuladores.length, icon: <LayoutGrid className="h-4 w-4" />, color: "text-foreground" },
    { label: "Publicados", value: simuladores.filter(s => s.estado === "publicado").length, icon: <Globe className="h-4 w-4" />, color: "text-emerald-400" },
    { label: "Borradores", value: simuladores.filter(s => s.estado === "borrador").length, icon: <FileText className="h-4 w-4" />, color: "text-amber-400" },
    { label: "Preguntas totales", value: simuladores.reduce((a, s) => a + s.preguntas.length, 0), icon: <BookOpen className="h-4 w-4" />, color: "text-blue-400" },
  ]

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border border-border bg-card p-4 flex items-start gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-secondary/30 text-muted-foreground shrink-0">
              {s.icon}
            </div>
            <div>
              <div className={cn("text-2xl font-bold leading-none", s.color)}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture overview */}
      <SCard icon={<Zap className="h-4 w-4" />} title="Arquitectura del sistema" subtitle="Motor visual tipo SaaS para crear simuladores con LocalStorage">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MOTORES.map(m => (
            <div key={m.n} className={cn("rounded-xl border p-3.5", m.bg)}>
              <div className={cn("text-xs font-bold mb-1", m.color)}>Motor {m.n}</div>
              <div className="text-xs font-semibold text-foreground leading-snug">{m.title}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{m.desc}</div>
            </div>
          ))}
        </div>
      </SCard>

      {/* Search & filter bar */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground/40" />
          <input
            className={cn(inputCls, "pl-10")}
            placeholder="Buscar por título, categoría, descripción…"
            value={q}
            onChange={e => setQ(e.target.value)}
          />
        </div>
        <select
          className={cn(inputCls, "sm:w-48")}
          value={est}
          onChange={e => setEst(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="borrador">🟡 Borrador</option>
          <option value="en_revision">🔵 En revisión</option>
          <option value="publicado">🟢 Publicado</option>
          <option value="archivado">⚫ Archivado</option>
        </select>
        <Btn variant="primary" onClick={onNuevo}>
          <Plus className="h-4 w-4" />Nuevo simulador
        </Btn>
      </div>

      {/* Results count */}
      {simuladores.length > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            {filtered.length} de {simuladores.length} simuladores
          </span>
          {q && (
            <button onClick={() => setQ("")} className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              <X className="h-3 w-3" />Limpiar búsqueda
            </button>
          )}
        </div>
      )}

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center">
          <div className="text-5xl mb-4">{simuladores.length === 0 ? "🎯" : "🔍"}</div>
          <div className="text-base font-bold text-foreground mb-1">
            {simuladores.length === 0 ? "Aún no tienes simuladores" : "Sin resultados"}
          </div>
          <div className="text-sm text-muted-foreground mb-6">
            {simuladores.length === 0
              ? "Usa el constructor para crear el primero."
              : "Prueba con otro término de búsqueda."}
          </div>
          {simuladores.length === 0 && (
            <Btn variant="primary" onClick={onNuevo}>
              <Plus className="h-4 w-4" />Crear mi primer simulador
            </Btn>
          )}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map(sim => {
            const badge = estadoBadge(sim.estado)
            const errP = sim.preguntas.filter(p => !p.pregunta || p.opciones.filter(Boolean).length < 2).length
            const pct = sim.config.preguntasMax > 0
              ? Math.min(100, Math.round((sim.preguntas.length / sim.config.preguntasMax) * 100))
              : 0
            const cp = (sim as any).tema?.colorPrimario || "#e53935"
            return (
              <div key={sim.id} className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 hover:shadow-md transition-all">
                {/* Color stripe */}
                <div className="h-1" style={{ background: cp }} />
                <div className="p-5 flex flex-col gap-4">
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-2xl shrink-0 overflow-hidden" style={{ background: `${cp}15` }}>
                      {(sim as any).icono?.startsWith("data:") || (sim as any).icono?.startsWith("http") || (sim as any).icono?.startsWith("/")
                        // eslint-disable-next-line @next/next/no-img-element
                        ? <img src={(sim as any).icono} alt="" className="h-full w-full object-cover" />
                        : <span>{(sim as any).icono || "🎯"}</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-bold", badge.cls)}>
                          <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                          {badge.label}
                        </span>
                        {errP > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-0.5 text-[10px] font-bold text-red-400">
                            <AlertCircle className="h-2.5 w-2.5" />{errP} error{errP > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                      <div className="text-sm font-bold text-foreground leading-snug">
                        {sim.titulo || <span className="italic text-muted-foreground">Sin título</span>}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                        {(sim as any).subtitulo || sim.descripcion || <span className="italic">Sin descripción</span>}
                      </div>
                    </div>
                  </div>

                  {/* Progress */}
                  <div>
                    <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
                      <span>{sim.preguntas.length} / {sim.config.preguntasMax} preguntas</span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary/40 overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cp }} />
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{sim.config.tiempoPregunta}s/preg</span>
                    <span className="flex items-center gap-1"><FileText className="h-3 w-3" />{sim.formulario.length} campos</span>
                    <span className="flex items-center gap-1"><Users className="h-3 w-3" />{sim.config.intentosMax ?? 3} intentos</span>
                    {(sim as any).categoria && (
                      <span className="flex items-center gap-1"><Tag className="h-3 w-3" />{(sim as any).categoria}</span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1 border-t border-border/60">
                    <Btn size="sm" onClick={() => onEditar(sim)} className="flex-1">
                      <Pencil className="h-3.5 w-3.5" />Editar
                    </Btn>
                    <Btn size="sm" onClick={() => {
                      guardarSimulador({ ...sim, id: uid(), titulo: `${sim.titulo} (copia)`, estado: "borrador" } as SimuladorBuilder)
                      window.location.reload()
                    }}>
                      <Copy className="h-3.5 w-3.5" />
                    </Btn>
                    <Btn size="sm" variant="danger" onClick={() => onEliminar(sim.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: GENERAL
// ─────────────────────────────────────────────────────────────────

function PanelGeneral({ sim, setSim }: { sim: SimuladorBuilder; setSim: (s: SimuladorBuilder) => void }) {
  const set = (p: Partial<SimuladorBuilder>) => setSim({ ...sim, ...p })
  const tema = (sim as any).tema || {}
  const cert = (sim as any).certificado || {}
  const setTema = (p: object) => set({ tema: { ...tema, ...p } } as any)
  const setCert = (p: object) => set({ certificado: { ...cert, ...p } } as any)
  const [tagsDraft, setTagsDraft] = useState(((sim as any).tags || []).join(", "))

  useEffect(() => {
    setTagsDraft(((sim as any).tags || []).join(", "))
  }, [sim.id])

  const parseTags = (value: string) =>
    value.split(",").map((t) => t.trim()).filter(Boolean)

  return (
    <div className="space-y-5">
      {/* Identity */}
      <SCard icon={<Sparkles className="h-4 w-4" />} title="Identidad del simulador" subtitle="Ícono, título, descripción y metadatos de presentación">
        <div className="space-y-5">
          <div className="flex items-start gap-4">
            <div className="flex flex-col gap-1.5 shrink-0">
              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Imagen</label>
              <ImageUploadBtn value={(sim as any).icono || ""} onChange={v => set({ icono: v } as any)} />
              {(sim as any).icono?.startsWith("data:") && (
                <button type="button" onClick={() => set({ icono: "" } as any)}
                  className="text-[10px] text-muted-foreground/60 hover:text-red-400 transition-colors text-center">
                  Quitar
                </button>
              )}
            </div>
            <div className="flex-1 space-y-3">
              <Inp label="Título del simulador" value={sim.titulo} onChange={v => set({ titulo: v })} placeholder="Ej: Simulador de Evaluación Docente 2025" required />
              <Inp label="Subtítulo" value={(sim as any).subtitulo || ""} onChange={v => set({ subtitulo: v } as any)} placeholder="Ej: Prepara tu evaluación con preguntas reales" />
            </div>
          </div>
          <Inp label="Descripción completa" value={sim.descripcion} onChange={v => set({ descripcion: v })} placeholder="Describe el objetivo, el público y el contenido del simulador…" rows={3} />
          <Inp label="Instrucciones para el participante" value={(sim as any).instrucciones || ""} onChange={v => set({ instrucciones: v } as any)} placeholder="Ej: Lee cada pregunta con atención. Tienes 60 segundos por pregunta." rows={2} />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Inp label="Categoría" value={(sim as any).categoria || ""} onChange={v => set({ categoria: v } as any)} placeholder="Ej: Pedagogía" />
            <Inp
              label="Tags (separados por coma)"
              value={tagsDraft}
              onChange={(v) => {
                setTagsDraft(v)
                set({ tags: parseTags(v) } as any)
              }}
              placeholder="Ej: docentes, SENESCYT, 2025"
              className="sm:col-span-2"
            />
          </div>
        </div>
      </SCard>

      {/* Status & form mode */}
      <SCard icon={<Settings className="h-4 w-4" />} title="Estado y acceso" subtitle="Controla quién puede verlo y cómo se capturan los datos">
        <div className="grid gap-4 sm:grid-cols-2">
          <Sel
            label="Estado de publicación"
            value={sim.estado}
            onChange={v => set({ estado: v as any })}
            options={[
              { value: "borrador",    label: "🟡 Borrador — solo visible para admin" },
              { value: "en_revision", label: "🔵 En revisión — pendiente de aprobación" },
              { value: "publicado",   label: "🟢 Publicado — visible para usuarios" },
              { value: "archivado",   label: "⚫ Archivado — desactivado" },
            ]}
          />
          <Sel
            label="Formulario inicial"
            value={(sim as any).formMode || "personalizado"}
            onChange={v => set({ formMode: v as any })}
            options={[
              { value: "personalizado", label: "📋 Personalizado — diseñas los campos" },
              { value: "perfil",        label: "👤 Perfil del usuario — datos automáticos" },
              { value: "ninguno",       label: "⛔ Sin formulario — va directo al simulacro" },
            ]}
            hint="Define si el usuario completa datos antes de comenzar"
          />
        </div>
      </SCard>

      {/* Visual theme */}
      <SCard icon={<Palette className="h-4 w-4" />} title="Tema visual" subtitle="Personaliza colores, bordes y estilo para los participantes">
        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <ColorPick label="Color primario"   value={tema.colorPrimario || "#e53935"}  onChange={v => setTema({ colorPrimario: v })} />
            <ColorPick label="Color secundario" value={tema.colorSecundario || "#1a237e"} onChange={v => setTema({ colorSecundario: v })} />
            <ColorPick label="Color de fondo"   value={tema.colorFondo || "#ffffff"}     onChange={v => setTema({ colorFondo: v })} />
            <ColorPick label="Color de texto"   value={tema.colorTexto || "#1a1a2e"}     onChange={v => setTema({ colorTexto: v })} />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Sel label="Radio de bordes" value={tema.borderRadius || "suave"} onChange={v => setTema({ borderRadius: v })} options={[
              { value: "suave",    label: "Suave (redondeado)" },
              { value: "cuadrado", label: "Cuadrado" },
              { value: "pill",     label: "Pill (muy redondeado)" },
            ]} />
            <Sel label="Estilo de tarjetas" value={tema.estiloCard || "elevado"} onChange={v => setTema({ estiloCard: v })} options={[
              { value: "elevado", label: "Elevado (sombra)" },
              { value: "plano",   label: "Plano" },
              { value: "borde",   label: "Solo borde" },
            ]} />
          </div>
          <div className="rounded-xl border border-border bg-secondary/5 divide-y divide-border/60">
            <Toggle label="Modo oscuro para usuarios" sublabel="El simulador se mostrará con fondo oscuro" value={tema.oscuro || false} onChange={v => setTema({ oscuro: v })} />
            <Toggle label="Mostrar barra de progreso" sublabel="Visible mientras el usuario responde" value={tema.mostrarProgreso !== false} onChange={v => setTema({ mostrarProgreso: v })} />
            <Toggle label="Animaciones" sublabel="Transiciones al pasar de pregunta en pregunta" value={tema.animaciones !== false} onChange={v => setTema({ animaciones: v })} />
          </div>
          {/* Live color preview */}
          <div className="rounded-xl border border-border bg-secondary/5 p-4 flex items-center gap-4">
            <span className="text-xs text-muted-foreground">Vista previa:</span>
            <button type="button" className="px-5 py-2 text-sm font-semibold text-white" style={{
              background: tema.colorPrimario || "#e53935",
              borderRadius: tema.borderRadius === "cuadrado" ? "6px" : tema.borderRadius === "pill" ? "999px" : "12px",
            }}>
              Comenzar simulacro →
            </button>
          </div>
        </div>
      </SCard>

      {/* Certificate */}
      <SCard icon={<Trophy className="h-4 w-4" />} title="Certificado de aprobación" subtitle="Configura el certificado que reciben los participantes">
        <div className="space-y-1">
          <div className="rounded-xl border border-border bg-secondary/5 divide-y divide-border/60">
            <Toggle label="Emitir certificado al aprobar" sublabel="Los participantes que alcancen el umbral recibirán un certificado" value={cert.habilitado || false} onChange={v => setCert({ habilitado: v })} />
          </div>
          {cert.habilitado && (
            <div className="pt-4 space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <Inp label="Título del certificado" value={cert.titulo || ""} onChange={v => setCert({ titulo: v })} placeholder="Ej: Certificado de Participación" />
                <Inp label="Subtítulo" value={cert.subtitulo || ""} onChange={v => setCert({ subtitulo: v })} placeholder="Ej: Ha completado satisfactoriamente" />
              </div>
              <div className="rounded-xl border border-border bg-secondary/5">
                <Stepper label="Umbral de aprobación" sublabel="Porcentaje mínimo para obtener certificado" value={cert.umbralAprobacion || 80} min={1} max={100} step={5} unit="%" onChange={v => setCert({ umbralAprobacion: v })} />
              </div>
              <Inp label="Texto del pie del certificado" value={cert.textoPie || ""} onChange={v => setCert({ textoPie: v })} placeholder="Ej: Plataforma Educativa HackEvans" />
            </div>
          )}
        </div>
      </SCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: FORMULARIO
// ─────────────────────────────────────────────────────────────────

const TIPOS_CAMPO: { tipo: CampoTipo; label: string; icon: string; desc: string; grupo: string }[] = [
  { tipo: "text",     label: "Texto corto",   icon: "T",  desc: "Nombre, ciudad…",        grupo: "Texto" },
  { tipo: "email",    label: "Email",          icon: "@",  desc: "Correo electrónico",      grupo: "Texto" },
  { tipo: "tel",      label: "Teléfono",       icon: "✆",  desc: "Número de teléfono",      grupo: "Texto" },
  { tipo: "number",   label: "Número",         icon: "#",  desc: "Edad, código…",           grupo: "Texto" },
  { tipo: "date",     label: "Fecha",          icon: "📅", desc: "Fecha de nacimiento",      grupo: "Texto" },
  { tipo: "textarea", label: "Texto largo",    icon: "¶",  desc: "Respuestas largas",        grupo: "Texto" },
  { tipo: "select",   label: "Desplegable",    icon: "▾",  desc: "Lista de opciones",        grupo: "Selección" },
  { tipo: "radio",    label: "Opción única",   icon: "◉",  desc: "Una opción de varias",     grupo: "Selección" },
  { tipo: "checkbox", label: "Casillas",       icon: "☑",  desc: "Múltiples opciones",       grupo: "Selección" },
  { tipo: "range",    label: "Rango / Escala", icon: "〰", desc: "Escala del 1 al 10",       grupo: "Especial" },
  { tipo: "heading",  label: "Título sección", icon: "H",  desc: "Encabezado visual",        grupo: "Layout" },
  { tipo: "divider",  label: "Separador",      icon: "—",  desc: "Línea divisora",           grupo: "Layout" },
]

const CAMPOS_RAPIDOS = [
  { label: "Nombres",               name: "nombres",       type: "text"   as CampoTipo, required: true,  icon: "👤", placeholder: "Tus nombres" },
  { label: "Apellidos",             name: "apellidos",     type: "text"   as CampoTipo, required: true,  icon: "👤", placeholder: "Tus apellidos" },
  { label: "Correo electrónico",    name: "correo",        type: "email"  as CampoTipo, required: true,  icon: "✉️", placeholder: "tucorreo@ejemplo.com" },
  { label: "Teléfono / Celular",    name: "telefono",      type: "tel"    as CampoTipo, required: false, icon: "📱", placeholder: "09 999 9999" },
  { label: "Fecha de nacimiento",   name: "fecha_nac",     type: "date"   as CampoTipo, required: false, icon: "📅" },
  { label: "Ciudad",                name: "ciudad",        type: "text"   as CampoTipo, required: false, icon: "🏙️", placeholder: "Tu ciudad" },
  { label: "Institución educativa", name: "institucion",   type: "text"   as CampoTipo, required: false, icon: "🏫", placeholder: "Nombre de tu institución" },
  { label: "Especialidad",          name: "especialidad",  type: "text"   as CampoTipo, required: false, icon: "📚", placeholder: "Ej: Matemáticas" },
  { label: "Cargo / Función",       name: "cargo",         type: "text"   as CampoTipo, required: false, icon: "💼", placeholder: "Ej: Docente titular" },
  { label: "Género",                name: "genero",        type: "radio"  as CampoTipo, required: false, icon: "👥", options: ["Masculino", "Femenino", "No especifica"] },
  {
    label: "Subnivel educativo", name: "subnivel", type: "select" as CampoTipo, required: false, icon: "🎓",
    options: ["Inicial", "Básica Elemental (1°-3°)", "Básica Media (4°-6°)", "Básica Superior (7°-9°)", "Bachillerato General Unificado"],
  },
  {
    label: "Provincia", name: "provincia", type: "select" as CampoTipo, required: false, icon: "📍",
    options: ["Azuay","Bolívar","Cañar","Carchi","Chimborazo","Cotopaxi","El Oro","Esmeraldas","Galápagos","Guayas","Imbabura","Loja","Los Ríos","Manabí","Morona Santiago","Napo","Orellana","Pastaza","Pichincha","Santa Elena","Santo Domingo","Sucumbíos","Tungurahua","Zamora Chinchipe"],
  },
  {
    label: "Nivel de instrucción", name: "instruccion", type: "select" as CampoTipo, required: false, icon: "🎓",
    options: ["Bachillerato", "Tecnólogo/Técnico", "Tercer Nivel", "Cuarto Nivel / Maestría", "Doctorado / PhD"],
  },
]

function PanelFormulario({ sim, setSim }: { sim: SimuladorBuilder; setSim: (s: SimuladorBuilder) => void }) {
  const [expId, setExpId] = useState<string | null>(null)
  const [dragI, setDragI] = useState<number | null>(null)
  const [overI, setOverI] = useState<number | null>(null)
  const [showTypes, setShowTypes] = useState(false)
  const [showQuick, setShowQuick] = useState(true)

  const upd = (formulario: CampoBuilder[]) => setSim({ ...sim, formulario })
  const addTipo = (tipo: CampoTipo) => {
    const c: CampoBuilder = {
      id: uid(), type: tipo, required: false, cols: 1,
      label: tipo === "heading" ? "Nueva sección" : tipo === "divider" ? "" : "",
      name: `campo_${Date.now()}`,
      placeholder: "",
      options: (tipo === "select" || tipo === "radio" || tipo === "checkbox") ? ["Opción 1", "Opción 2"] : undefined,
      min: tipo === "range" ? "1" : undefined,
      max: tipo === "range" ? "10" : undefined,
      step: tipo === "range" ? "1" : undefined,
    }
    upd([...sim.formulario, c])
    setExpId(c.id)
    setShowTypes(false)
  }
  const addRapido = (t: typeof CAMPOS_RAPIDOS[0]) => {
    const c: CampoBuilder = {
      id: uid(), type: t.type, label: t.label, name: t.name, required: t.required,
      placeholder: (t as any).placeholder || "",
      options: (t as any).options ? [...(t as any).options] : undefined,
      icon: (t as any).icon || "", cols: 1,
    }
    upd([...sim.formulario, c])
    setExpId(c.id)
  }
  const updC = (id: string, p: Partial<CampoBuilder>) => upd(sim.formulario.map(c => c.id === id ? { ...c, ...p } : c))
  const delC = (id: string) => { upd(sim.formulario.filter(c => c.id !== id)); if (expId === id) setExpId(null) }
  const onDrop = (ti: number) => {
    if (dragI === null || dragI === ti) return
    const items = [...sim.formulario]
    const [m] = items.splice(dragI, 1)
    items.splice(ti, 0, m)
    upd(items); setDragI(null); setOverI(null)
  }

  const formMode = (sim as any).formMode || "personalizado"

  if (formMode === "ninguno") return (
    <SCard icon={<FileText className="h-4 w-4" />} title="Sin formulario" subtitle="El simulacro inicia directamente">
      <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center">
        <div className="text-4xl mb-3">⛔</div>
        <div className="text-sm font-semibold text-foreground mb-1">Modo sin formulario activo</div>
        <div className="text-xs text-muted-foreground mb-4">Los participantes irán directamente al simulacro sin completar datos.</div>
        <Btn size="sm" onClick={() => setSim({ ...sim, formMode: "personalizado" })}>Activar formulario personalizado</Btn>
      </div>
    </SCard>
  )

  if (formMode === "perfil") return (
    <SCard icon={<Users className="h-4 w-4" />} title="Perfil del usuario" subtitle="Datos automáticos del perfil guardado">
      <div className="rounded-xl border border-dashed border-border bg-secondary/5 p-8 text-center">
        <div className="text-4xl mb-3">👤</div>
        <div className="text-sm text-muted-foreground">Los datos del participante se toman del perfil guardado.</div>
      </div>
    </SCard>
  )

  const grps = [...new Set(TIPOS_CAMPO.map(t => t.grupo))]

  return (
    <div className="space-y-5">
      {/* Quick fields */}
      <SCard
        icon={<Zap className="h-4 w-4" />}
        title="Campos rápidos"
        subtitle="Inserta campos predefinidos con un clic"
        action={
          <button type="button" onClick={() => setShowQuick(p => !p)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors">
            {showQuick ? "Ocultar" : "Mostrar"}
          </button>
        }
      >
        {showQuick && (
          <div className="flex flex-wrap gap-2">
            {CAMPOS_RAPIDOS.map(c => (
              <button key={c.name} type="button" onClick={() => addRapido(c)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/15 px-3 py-1.5 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-secondary/30 transition-all">
                <span>{(c as any).icon}</span>{c.label}
              </button>
            ))}
          </div>
        )}
      </SCard>

      {/* Form builder */}
      <SCard
        icon={<FileText className="h-4 w-4" />}
        title="Constructor de formulario"
        subtitle={`${sim.formulario.length} campos configurados — arrastra para reordenar`}
        action={
          <div className="relative">
            <Btn size="sm" variant="primary" onClick={() => setShowTypes(p => !p)}>
              <Plus className="h-3.5 w-3.5" />Agregar campo
            </Btn>
            {showTypes && (
              <div className="absolute right-0 top-10 z-50 rounded-2xl border border-border bg-card p-4 shadow-2xl w-80">
                {grps.map(g => (
                  <div key={g} className="mb-4 last:mb-0">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{g}</div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {TIPOS_CAMPO.filter(t => t.grupo === g).map(t => (
                        <button key={t.tipo} type="button" onClick={() => addTipo(t.tipo)}
                          className="flex items-center gap-2 rounded-xl border border-border bg-secondary/10 px-3 py-2.5 text-left hover:border-primary/50 hover:bg-secondary/25 transition-all">
                          <span className="text-sm font-mono font-bold text-primary w-5 shrink-0">{t.icon}</span>
                          <div>
                            <div className="text-xs font-semibold text-foreground">{t.label}</div>
                            <div className="text-[10px] text-muted-foreground">{t.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        }
        noPad
      >
        {sim.formulario.length === 0 ? (
          <div className="p-5">
            <div className="rounded-xl border border-dashed border-border py-12 text-center">
              <div className="text-3xl mb-2">📋</div>
              <div className="text-xs text-muted-foreground">Usa campos rápidos o el botón "Agregar campo" para empezar</div>
            </div>
          </div>
        ) : (
          <div className="p-3 space-y-2">
            {sim.formulario.map((campo, idx) => {
              const isExp = expId === campo.id
              const isLayout = campo.type === "divider" || campo.type === "heading"
              const tipoInfo = TIPOS_CAMPO.find(t => t.tipo === campo.type)
              return (
                <div key={campo.id}
                  draggable
                  onDragStart={() => setDragI(idx)}
                  onDragOver={e => { e.preventDefault(); setOverI(idx) }}
                  onDrop={() => onDrop(idx)}
                  onDragEnd={() => { setDragI(null); setOverI(null) }}
                  className={cn("rounded-xl border overflow-hidden transition-all",
                    overI === idx && dragI !== idx ? "border-primary/60 bg-primary/5" : isLayout ? "border-border/50 bg-secondary/5" : "border-border bg-card")}>
                  {campo.type === "divider" ? (
                    <div className="flex items-center gap-3 px-4 py-2.5">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
                      <div className="flex-1 h-px bg-border" />
                      <span className="text-xs text-muted-foreground">Separador</span>
                      <div className="flex-1 h-px bg-border" />
                      <button type="button" onClick={() => delC(campo.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ) : campo.type === "heading" ? (
                    <div className="flex items-center gap-3 px-4 py-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab" />
                      {isExp
                        ? <input className="flex-1 text-base font-bold text-foreground bg-transparent border-b border-primary focus:outline-none" value={campo.label} onChange={e => updC(campo.id, { label: e.target.value })} placeholder="Título de sección…" />
                        : <span className="flex-1 text-base font-bold text-foreground">{campo.label || "Título de sección"}</span>
                      }
                      <button type="button" onClick={() => setExpId(isExp ? null : campo.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-foreground"><Pencil className="h-3 w-3" /></button>
                      <button type="button" onClick={() => delC(campo.id)} className="flex h-6 w-6 items-center justify-center rounded-lg text-muted-foreground/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground/25 cursor-grab shrink-0" />
                        <span className="text-xs font-mono font-bold text-primary w-5 shrink-0">{tipoInfo?.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="text-sm font-semibold text-foreground">
                            {campo.label || <span className="italic text-muted-foreground">Sin etiqueta</span>}
                          </span>
                          <span className="ml-2 text-[11px] text-muted-foreground">
                            [{campo.type}]{campo.required && <span className="text-primary ml-1">*</span>}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Btn size="xs" variant="ghost" onClick={() => setExpId(isExp ? null : campo.id)}>
                            {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
                          </Btn>
                          <Btn size="xs" variant="danger" onClick={() => delC(campo.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Btn>
                        </div>
                      </div>
                      {isExp && (
                        <div className="border-t border-border bg-secondary/5 px-4 pb-4 pt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-3">
                            <Inp label="Etiqueta visible" value={campo.label} onChange={v => updC(campo.id, { label: v })} placeholder="Ej: Nombres completos" />
                            <Inp label="Nombre (identificador)" value={campo.name} onChange={v => updC(campo.id, { name: v.toLowerCase().replace(/\s+/g,"_").replace(/[^a-z0-9_]/g,"") })} placeholder="Ej: nombres" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <Inp label="Placeholder" value={campo.placeholder || ""} onChange={v => updC(campo.id, { placeholder: v })} placeholder="Texto de ayuda dentro del campo" />
                            <Inp label="Texto de ayuda (helper)" value={(campo as any).helperText || ""} onChange={v => updC(campo.id, { helperText: v } as any)} placeholder="Ej: Solo letras, sin números" />
                          </div>
                          <div className="grid grid-cols-3 gap-3 items-end">
                            <Sel label="Tipo de campo" value={campo.type} onChange={v => updC(campo.id, { type: v as CampoTipo })} options={TIPOS_CAMPO.filter(t => t.grupo !== "Layout").map(t => ({ value: t.tipo, label: `${t.icon} ${t.label}` }))} />
                            <Sel label="Ancho en formulario" value={String(campo.cols || 1)} onChange={v => updC(campo.id, { cols: Number(v) as 1|2 })} options={[{ value: "1", label: "Mitad (1/2)" }, { value: "2", label: "Completo (2/2)" }]} />
                            <label className="flex items-center gap-2 pb-2 cursor-pointer">
                              <input type="checkbox" checked={campo.required} onChange={e => updC(campo.id, { required: e.target.checked })} className="h-4 w-4 rounded accent-primary" />
                              <span className="text-sm text-foreground font-medium">Requerido</span>
                            </label>
                          </div>
                          {(campo.type === "select" || campo.type === "radio" || campo.type === "checkbox") && (
                            <div className="space-y-2">
                              <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Opciones</label>
                              {(campo.options || []).map((op, oi) => (
                                <div key={oi} className="flex items-center gap-2">
                                  <span className="text-xs text-muted-foreground w-5 text-right shrink-0">{oi + 1}.</span>
                                  <input className={cn(inputCls, "h-8 text-xs")} value={op} onChange={e => {
                                    const ops = [...(campo.options || [])]; ops[oi] = e.target.value; updC(campo.id, { options: ops })
                                  }} placeholder={`Opción ${oi + 1}`} />
                                  <button type="button" onClick={() => {
                                    const ops = (campo.options || []).filter((_, i) => i !== oi); updC(campo.id, { options: ops })
                                  }} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15">
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ))}
                              <button type="button" onClick={() => updC(campo.id, { options: [...(campo.options || []), ""] })}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                <Plus className="h-3 w-3" />Agregar opción
                              </button>
                            </div>
                          )}
                          {campo.type === "range" && (
                            <div className="grid grid-cols-3 gap-3">
                              <Inp label="Mínimo" value={campo.min || "1"} onChange={v => updC(campo.id, { min: v })} type="number" />
                              <Inp label="Máximo" value={campo.max || "10"} onChange={v => updC(campo.id, { max: v })} type="number" />
                              <Inp label="Paso" value={campo.step || "1"} onChange={v => updC(campo.id, { step: v })} type="number" />
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </SCard>

      {/* Live preview */}
      {sim.formulario.filter(c => c.type !== "divider" && c.type !== "heading" && c.label).length > 0 && (
        <SCard icon={<Eye className="h-4 w-4" />} title="Vista previa del formulario" subtitle="Así se verá para el usuario">
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2, 1fr)" }}>
            {sim.formulario.map(c => {
              if (c.type === "divider") return <div key={c.id} className="col-span-2 border-t border-border my-1" />
              if (c.type === "heading") return <div key={c.id} className="col-span-2 text-base font-bold text-foreground mt-2">{c.label}</div>
              const span = c.cols === 2 ? "col-span-2" : "col-span-1"
              return (
                <div key={c.id} className={span}>
                  <label className="block text-xs text-muted-foreground mb-1">{c.label}{c.required && <span className="text-primary ml-1">*</span>}</label>
                  {c.type === "select" ? (
                    <select disabled className="w-full h-9 rounded-xl border border-border bg-secondary/15 px-3 text-xs text-muted-foreground/50"><option>Selecciona…</option></select>
                  ) : c.type === "textarea" ? (
                    <textarea disabled rows={2} className="w-full rounded-xl border border-border bg-secondary/15 px-3 py-2 text-xs text-muted-foreground/50 resize-none" placeholder={c.placeholder} />
                  ) : c.type === "radio" || c.type === "checkbox" ? (
                    <div className="flex flex-wrap gap-3">{(c.options || []).slice(0, 3).map((op, i) => (
                      <label key={i} className="flex items-center gap-1.5 text-xs text-muted-foreground/60">
                        <input type={c.type === "radio" ? "radio" : "checkbox"} disabled className="accent-primary" />{op}
                      </label>
                    ))}</div>
                  ) : (
                    <input disabled className="w-full h-9 rounded-xl border border-border bg-secondary/15 px-3 text-xs text-muted-foreground/50" placeholder={c.placeholder || c.label} />
                  )}
                </div>
              )
            })}
          </div>
        </SCard>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: PREGUNTAS
// ─────────────────────────────────────────────────────────────────

const DIF_CONFIG = {
  basico:     { label: "Básico",     cls: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", dot: "bg-emerald-400" },
  intermedio: { label: "Intermedio", cls: "bg-amber-500/10 text-amber-400 border-amber-500/20",     dot: "bg-amber-400" },
  avanzado:   { label: "Avanzado",   cls: "bg-red-500/10 text-red-400 border-red-500/20",           dot: "bg-red-400" },
}

function PanelPreguntas({ sim, setSim }: { sim: SimuladorBuilder; setSim: (s: SimuladorBuilder) => void }) {
  const [expId, setExpId] = useState<string | null>(null)
  const [q, setQ] = useState("")
  const [dif, setDif] = useState("todos")
  const [dragI, setDragI] = useState<number | null>(null)
  const [overI, setOverI] = useState<number | null>(null)
  const [importText, setImportText] = useState("")
  const [showImport, setShowImport] = useState(false)
  const [importingFile, setImportingFile] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)

  const upd = (preguntas: PreguntaBuilder[]) => setSim({ ...sim, preguntas })
  const add = () => {
    const p: PreguntaBuilder = {
      id: uid(), tipo: "opcion_multiple", pregunta: "", contexto: "",
      opciones: ["", "", "", ""], respuesta: 0, explicacion: "",
      categoria: "", tema: "", dificultad: "basico", anio: new Date().getFullYear(),
    }
    upd([...sim.preguntas, p])
    setExpId(p.id)
  }
  const del = (id: string) => { upd(sim.preguntas.filter(p => p.id !== id)); if (expId === id) setExpId(null) }
  const updP = (id: string, p: Partial<PreguntaBuilder>) => upd(sim.preguntas.map(x => x.id === id ? { ...x, ...p } : x))
  const updOpt = (pid: string, idx: number, val: string) => upd(sim.preguntas.map(p => {
    if (p.id !== pid) return p
    const o = [...p.opciones]; o[idx] = val; return { ...p, opciones: o }
  }))
  const addOpt = (pid: string) => upd(sim.preguntas.map(p => p.id === pid ? { ...p, opciones: [...p.opciones, ""] } : p))
  const delOpt = (pid: string, idx: number) => upd(sim.preguntas.map(p => {
    if (p.id !== pid) return p
    const opciones = p.opciones.filter((_, i) => i !== idx)
    const respuesta = p.respuesta >= idx && p.respuesta > 0 ? p.respuesta - 1 : p.respuesta
    return { ...p, opciones, respuesta }
  }))
  const onDrop = (ti: number) => {
    if (dragI === null || dragI === ti) return
    const items = [...sim.preguntas]
    const [m] = items.splice(dragI, 1)
    items.splice(ti, 0, m)
    upd(items); setDragI(null); setOverI(null)
  }

  const parsePreguntas = (raw: string) => {
    const lines = raw.split("\n").filter(l => l.trim())
    const nuevas: PreguntaBuilder[] = []
    let curr: Partial<PreguntaBuilder> | null = null
    for (const line of lines) {
      const t = line.trim()
      if (t.match(/^\d+[\.\)]/)) {
        if (curr?.pregunta) nuevas.push({
          id: uid(),
          pregunta: curr.pregunta,
          opciones: curr.opciones || ["", "", "", ""],
          respuesta: curr.respuesta || 0,
          dificultad: "basico",
          anio: new Date().getFullYear(),
        } as PreguntaBuilder)
        curr = { pregunta: t.replace(/^\d+[\.\)]\s*/, ""), opciones: [] }
      } else if (t.match(/^[a-dA-D][\.\)]/)) {
        if (curr) {
          if (!curr.opciones) curr.opciones = []
          curr.opciones.push(t.replace(/^[a-dA-D][\.\)]\s*/, ""))
        }
      } else if (t.toLowerCase().startsWith("respuesta:") || t.toLowerCase().startsWith("correcta:")) {
        if (curr) {
          const ans = t.replace(/^[^:]+:\s*/i, "").trim().toUpperCase()
          curr.respuesta = ["A", "B", "C", "D"].indexOf(ans) >= 0 ? ["A", "B", "C", "D"].indexOf(ans) : 0
        }
      }
    }
    if (curr?.pregunta) nuevas.push({
      id: uid(),
      pregunta: curr.pregunta,
      opciones: curr.opciones || ["", "", "", ""],
      respuesta: curr.respuesta || 0,
      dificultad: "basico",
      anio: new Date().getFullYear(),
    } as PreguntaBuilder)
    return nuevas
  }

  const importar = () => {
    setImportError(null)
    const nuevas = parsePreguntas(importText)
    if (nuevas.length === 0) {
      setImportError("No se detectaron preguntas. Revisa el formato del texto.")
      return
    }
    upd([...sim.preguntas, ...nuevas])
    setImportText("")
    setShowImport(false)
  }

  const extractPdfText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf")
    const pdfjsAny = pdfjs as any
    pdfjsAny.disableWorker = true
    const doc = await pdfjsAny.getDocument({ data: arrayBuffer }).promise
    let text = ""
    for (let i = 1; i <= doc.numPages; i += 1) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      const pageText = content.items
        .map((item: any) => ("str" in item ? item.str : ""))
        .join(" ")
      text += `${pageText}\n`
    }
    return text
  }

  const extractDocxText = async (file: File) => {
    const arrayBuffer = await file.arrayBuffer()
    const mammoth = await import("mammoth/mammoth.browser")
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value || ""
  }

  const handleFile = async (file?: File | null) => {
    if (!file) return
    setImportError(null)
    setImportingFile(true)
    try {
      const ext = file.name.split(".").pop()?.toLowerCase()
      let text = ""
      if (ext === "pdf") {
        text = await extractPdfText(file)
      } else if (ext === "docx") {
        text = await extractDocxText(file)
      } else if (ext === "txt") {
        text = await file.text()
      } else if (ext === "doc") {
        throw new Error("El formato .doc no es compatible. Usa .docx.")
      } else {
        throw new Error("Formato no soportado. Usa PDF, DOCX o TXT.")
      }
      if (!text.trim()) throw new Error("No se pudo extraer texto del archivo.")
      setImportText(text)
      setShowImport(true)
    } catch (err: any) {
      setImportError(err?.message || "No se pudo leer el archivo.")
    } finally {
      setImportingFile(false)
    }
  }

  const filtered = sim.preguntas.filter(p => {
    const mq = !q || p.pregunta.toLowerCase().includes(q.toLowerCase())
      || (p.categoria || "").toLowerCase().includes(q.toLowerCase())
      || (p.contexto || "").toLowerCase().includes(q.toLowerCase())
    return mq && (dif === "todos" || p.dificultad === dif)
  })

  const byDif = {
    basico:     sim.preguntas.filter(p => p.dificultad === "basico").length,
    intermedio: sim.preguntas.filter(p => p.dificultad === "intermedio").length,
    avanzado:   sim.preguntas.filter(p => p.dificultad === "avanzado").length,
  }

  return (
    <div className="space-y-5">
      {/* Difficulty stats */}
      <div className="grid grid-cols-3 gap-3">
        {(["basico", "intermedio", "avanzado"] as const).map(d => {
          const cfg = DIF_CONFIG[d]
          return (
            <div key={d} className={cn("rounded-2xl border p-4 text-center", cfg.cls.replace("text-", "").replace("border-", "").split(" ")[0], "bg-card border-border")}>
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={cn("h-2 w-2 rounded-full", cfg.dot)} />
                <span className="text-xs text-muted-foreground">{cfg.label}</span>
              </div>
              <div className={cn("text-2xl font-bold", cfg.cls.split(" ")[1])}>{byDif[d]}</div>
            </div>
          )
        })}
      </div>

      {/* Question bank */}
      <SCard
        icon={<BookOpen className="h-4 w-4" />}
        title={`Banco de preguntas — ${sim.preguntas.length} total`}
        subtitle="Arrastra para reordenar · haz clic en el lápiz para editar"
        action={
          <div className="flex gap-2">
            <Btn size="sm" onClick={() => { setShowImport(p => !p); setImportError(null) }}>
              <Upload className="h-3.5 w-3.5" />Importar
            </Btn>
            <Btn size="sm" variant="primary" onClick={add}>
              <Plus className="h-3.5 w-3.5" />Nueva pregunta
            </Btn>
          </div>
        }
        noPad
      >
        <div className="p-4">
          {/* Import tool */}
          {showImport && (
            <div className="mb-4 rounded-xl border border-border bg-secondary/10 p-4 space-y-3">
              <div className="text-xs font-bold text-foreground">Importar preguntas desde texto plano</div>
              <div className="text-xs text-muted-foreground">
                Formato: <code className="bg-secondary/40 px-1.5 py-0.5 rounded">1. Pregunta</code> →{" "}
                <code className="bg-secondary/40 px-1.5 py-0.5 rounded">a) Opción A</code> →{" "}
                <code className="bg-secondary/40 px-1.5 py-0.5 rounded">Respuesta: A</code>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="file"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={e => { const f = e.target.files?.[0]; e.currentTarget.value = ""; handleFile(f) }}
                  disabled={importingFile}
                  className="text-xs text-muted-foreground file:mr-3 file:rounded-lg file:border file:border-border file:bg-secondary/30 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-foreground hover:file:bg-secondary/40"
                />
                {importingFile && (
                  <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />Procesando archivo...
                  </span>
                )}
              </div>
              {importError && (
                <div className="text-xs text-red-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />{importError}
                </div>
              )}
              <textarea rows={6}
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs font-mono text-foreground focus:border-primary focus:outline-none resize-none"
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={"1. ¿Cuál es el objetivo de la pedagogía?\na) Enseñar contenidos\nb) Guiar el aprendizaje\nc) Evaluar al estudiante\nd) Diseñar el currículo\nRespuesta: B"}
              />
              <div className="flex gap-2">
                <Btn size="sm" variant="primary" onClick={importar}>Importar preguntas</Btn>
                <Btn size="sm" onClick={() => setShowImport(false)}>Cancelar</Btn>
              </div>
            </div>
          )}

          {/* Search + filter */}
          {sim.preguntas.length > 4 && (
            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted-foreground/40" />
                <input className={cn(inputCls, "pl-9 h-8 text-xs")} placeholder="Buscar preguntas…" value={q} onChange={e => setQ(e.target.value)} />
              </div>
              <select className={cn(inputCls, "w-36 h-8 text-xs")} value={dif} onChange={e => setDif(e.target.value)}>
                <option value="todos">Todas</option>
                <option value="basico">Básico</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
          )}

          {sim.preguntas.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border py-14 text-center">
              <div className="text-3xl mb-2">✏️</div>
              <div className="text-xs text-muted-foreground mb-4">Sin preguntas. Agrega la primera o importa desde texto.</div>
              <Btn size="sm" onClick={add}><Plus className="h-3.5 w-3.5" />Primera pregunta</Btn>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((preg, idx) => {
                const isExp = expId === preg.id
                const err = !preg.pregunta || preg.opciones.filter(Boolean).length < 2
                const difCfg = DIF_CONFIG[preg.dificultad || "basico"]
                return (
                  <div key={preg.id}
                    draggable
                    onDragStart={() => setDragI(idx)}
                    onDragOver={e => { e.preventDefault(); setOverI(idx) }}
                    onDrop={() => onDrop(idx)}
                    onDragEnd={() => { setDragI(null); setOverI(null) }}
                    className={cn("rounded-xl border overflow-hidden transition-all",
                      overI === idx && dragI !== idx ? "border-primary/60 bg-primary/5" : err ? "border-red-500/25 bg-red-500/3" : "border-border bg-card")}>
                    {/* Question header */}
                    <div className="flex items-start gap-3 px-4 py-3">
                      <GripVertical className="h-4 w-4 text-muted-foreground/25 cursor-grab shrink-0 mt-0.5" />
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-secondary/50 text-[11px] font-bold text-muted-foreground mt-0.5">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground line-clamp-2">
                          {preg.pregunta || <span className="italic text-muted-foreground">Sin enunciado…</span>}
                        </div>
                        {preg.contexto && (
                          <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 italic">{preg.contexto.substring(0, 80)}…</div>
                        )}
                        <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", difCfg.cls)}>
                            <span className={cn("h-1.5 w-1.5 rounded-full", difCfg.dot)} />
                            {difCfg.label}
                          </span>
                          {preg.categoria && (
                            <span className="inline-flex items-center rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">{preg.categoria}</span>
                          )}
                          <span className="text-[11px] text-muted-foreground">
                            {preg.opciones.filter(Boolean).length} opciones · correcta: {String.fromCharCode(65 + preg.respuesta)}
                          </span>
                          {err && (
                            <span className="text-[11px] text-red-400 flex items-center gap-0.5">
                              <AlertCircle className="h-3 w-3" />Incompleta
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <Btn size="xs" variant="ghost" onClick={() => setExpId(isExp ? null : preg.id)}>
                          {isExp ? <ChevronUp className="h-3.5 w-3.5" /> : <Pencil className="h-3 w-3" />}
                        </Btn>
                        <Btn size="xs" variant="danger" onClick={() => del(preg.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Btn>
                      </div>
                    </div>

                    {/* Expanded editor */}
                    {isExp && (
                      <div className="border-t border-border bg-secondary/5 px-4 pb-5 pt-4 space-y-4">
                        <Inp label="Contexto / Caso (opcional)" value={preg.contexto || ""} onChange={v => updP(preg.id, { contexto: v })} placeholder="Describe el caso o contexto previo a la pregunta. Aparecerá en un recuadro antes del enunciado." rows={2} />
                        <Inp label="Enunciado de la pregunta" value={preg.pregunta} onChange={v => updP(preg.id, { pregunta: v })} placeholder="Escribe el enunciado completo…" rows={2} required />

                        {/* Options */}
                        <div>
                          <label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-2 block">
                            Opciones — haz clic en la letra para marcar la correcta
                          </label>
                          <div className="space-y-2">
                            {preg.opciones.map((op, oi) => (
                              <div key={oi} className="flex items-center gap-2">
                                <button type="button" onClick={() => updP(preg.id, { respuesta: oi })}
                                  className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border font-bold text-xs transition-all",
                                    preg.respuesta === oi
                                      ? "border-emerald-500 bg-emerald-500 text-white shadow-sm shadow-emerald-500/20"
                                      : "border-border bg-secondary/20 text-muted-foreground hover:border-emerald-400/60")}>
                                  {preg.respuesta === oi ? <Check className="h-3.5 w-3.5" /> : String.fromCharCode(65 + oi)}
                                </button>
                                <input
                                  className={cn(inputCls, "h-9", preg.respuesta === oi && "border-emerald-500/40 bg-emerald-500/5")}
                                  value={op}
                                  onChange={e => updOpt(preg.id, oi, e.target.value)}
                                  placeholder={`Opción ${String.fromCharCode(65 + oi)}`}
                                />
                                <button type="button" onClick={() => delOpt(preg.id, oi)} disabled={preg.opciones.length <= 2}
                                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15 disabled:opacity-25 transition-colors">
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ))}
                            {preg.opciones.length < 6 && (
                              <button type="button" onClick={() => addOpt(preg.id)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-dashed border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                                <Plus className="h-3 w-3" />Agregar opción
                              </button>
                            )}
                          </div>
                        </div>

                        <Inp label="Explicación / Fundamentación pedagógica" value={preg.explicacion || ""} onChange={v => updP(preg.id, { explicacion: v })} placeholder="Explica por qué la respuesta es correcta y los argumentos que la sustentan…" rows={2} />

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                          <Inp label="Categoría temática" value={preg.categoria || ""} onChange={v => updP(preg.id, { categoria: v })} placeholder="Ej: Didáctica" />
                          <Inp label="Subtema" value={preg.tema || ""} onChange={v => updP(preg.id, { tema: v })} placeholder="Ej: Estrategias activas" />
                          <Sel label="Dificultad" value={preg.dificultad || "basico"} onChange={v => updP(preg.id, { dificultad: v as any })} options={[
                            { value: "basico",     label: "🟢 Básico" },
                            { value: "intermedio", label: "🟡 Intermedio" },
                            { value: "avanzado",   label: "🔴 Avanzado" },
                          ]} />
                          <Inp label="Año / Fuente" value={preg.anio ? String(preg.anio) : ""} onChange={v => updP(preg.id, { anio: Number(v) })} type="number" placeholder={String(new Date().getFullYear())} />
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {filtered.length === 0 && sim.preguntas.length > 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Sin resultados para la búsqueda actual.
            </div>
          )}
        </div>
      </SCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: CONFIGURACIÓN
// ─────────────────────────────────────────────────────────────────

function PanelConfig({ sim, setSim }: { sim: SimuladorBuilder; setSim: (s: SimuladorBuilder) => void }) {
  const cfg = sim.config
  const set = (p: Partial<typeof cfg>) => setSim({ ...sim, config: { ...cfg, ...p } })

  return (
    <div className="space-y-5">
      {/* Time & quantity */}
      <SCard icon={<Clock className="h-4 w-4" />} title="Tiempo y cantidad" subtitle="Controla el ritmo y el tamaño del simulacro" noPad>
        <div className="divide-y divide-border/60">
          <Stepper label="Tiempo por pregunta" sublabel="Segundos disponibles para responder cada pregunta" value={cfg.tiempoPregunta} min={10} max={600} step={5} unit="s" onChange={v => set({ tiempoPregunta: v })} />
          <Stepper label="Preguntas por sesión" sublabel={`Máximo de preguntas presentadas. Banco actual: ${sim.preguntas.length}`} value={cfg.preguntasMax} min={1} max={500} onChange={v => set({ preguntasMax: v })} />
          <Toggle label="Mostrar temporizador" sublabel="El usuario ve la cuenta regresiva durante el simulacro" value={cfg.mostrarTemporizador !== false} onChange={v => set({ mostrarTemporizador: v })} />
          <Toggle label="Mostrar número de pregunta" sublabel="Ej: 'Pregunta 3 de 10'" value={cfg.mostrarNumeroPregunta !== false} onChange={v => set({ mostrarNumeroPregunta: v })} />
        </div>
      </SCard>

      {/* Access control */}
      <SCard icon={<Users className="h-4 w-4" />} title="Intentos y acceso" subtitle="Controla cuántas veces puede realizarse el simulacro" noPad>
        <div className="divide-y divide-border/60">
          <Stepper label="Intentos máximos" sublabel="Número de veces que el usuario puede hacer el simulacro" value={cfg.intentosMax ?? 3} min={1} max={99} onChange={v => set({ intentosMax: v })} />
          <Stepper label="Espera entre intentos" sublabel="Minutos que debe esperar antes de volver a intentar (0 = sin espera)" value={cfg.cooldownMinutos ?? 30} min={0} max={1440} step={5} unit="min" onChange={v => set({ cooldownMinutos: v })} />
        </div>
      </SCard>

      {/* Behavior */}
      <SCard icon={<Sliders className="h-4 w-4" />} title="Comportamiento del simulacro" subtitle="Opciones avanzadas de experiencia del usuario" noPad>
        <div className="divide-y divide-border/60">
          <Toggle label="Retroalimentación inmediata" sublabel="Muestra si la respuesta fue correcta o incorrecta en el momento, con explicación" value={cfg.retroalimentacion !== false} onChange={v => set({ retroalimentacion: v })} />
          <Toggle label="Revisión al finalizar" sublabel="El usuario puede revisar todas sus respuestas con las correcciones al terminar" value={cfg.revisionFinal !== false} onChange={v => set({ revisionFinal: v })} />
          <Toggle label="Orden aleatorio de preguntas" sublabel="Cada sesión presenta las preguntas en orden diferente" value={cfg.ordenAleatorioPeguntas || false} onChange={v => set({ ordenAleatorioPeguntas: v })} />
          <Toggle label="Orden aleatorio de opciones" sublabel="Las alternativas se barajan en cada sesión" value={cfg.ordenAleatorioOpciones || false} onChange={v => set({ ordenAleatorioOpciones: v })} />
          <Toggle label="Permitir navegar hacia atrás" sublabel="El usuario puede ir a preguntas anteriores para cambiar su respuesta" value={cfg.permitirNavegacion || false} onChange={v => set({ permitirNavegacion: v })} />
          <Toggle label="Permitir pasar sin responder" sublabel="El usuario puede dejar preguntas en blanco y avanzar" value={cfg.pasarSinResponder || false} onChange={v => set({ pasarSinResponder: v })} />
          <Toggle label="Modo IA (generación automática)" sublabel="Genera preguntas automáticamente usando inteligencia artificial" value={cfg.modoIA || false} onChange={v => set({ modoIA: v })} />
          <Toggle label="Detectar preguntas duplicadas" sublabel="Avisa si una pregunta ya existe en el banco con contenido similar" value={cfg.detectarDuplicadas !== false} onChange={v => set({ detectarDuplicadas: v })} />
        </div>
      </SCard>

      {/* Results & grading */}
      <SCard icon={<Trophy className="h-4 w-4" />} title="Aprobación y mensajes" subtitle="Umbral de aprobación y mensajes personalizados al finalizar" noPad>
        <div className="divide-y divide-border/60">
          <Stepper label="Umbral de aprobación" sublabel="Porcentaje mínimo de aciertos para aprobar" value={cfg.umbralAprobacion ?? 70} min={1} max={100} step={5} unit="%" onChange={v => set({ umbralAprobacion: v })} />
        </div>
        <div className="p-4 pt-3 space-y-3">
          <Inp label="Mensaje al aprobar" value={cfg.mensajeAprobado || ""} onChange={v => set({ mensajeAprobado: v })} placeholder="Ej: ¡Felicitaciones! Has aprobado el simulacro." />
          <Inp label="Mensaje al reprobar" value={cfg.mensajeReprobado || ""} onChange={v => set({ mensajeReprobado: v })} placeholder="Ej: Sigue practicando. Puedes volver a intentarlo." />
        </div>
      </SCard>

      {/* Config summary */}
      <div className="rounded-2xl border border-border bg-secondary/5 p-5">
        <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Resumen de configuración</div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[
            { l: "Tiempo/pregunta",  v: `${cfg.tiempoPregunta}s` },
            { l: "Preguntas/sesión", v: cfg.preguntasMax },
            { l: "Intentos máx.",    v: cfg.intentosMax ?? 3 },
            { l: "Cooldown",         v: `${cfg.cooldownMinutos ?? 30}min` },
            { l: "Aprobación",       v: `${cfg.umbralAprobacion ?? 70}%` },
            { l: "Retroalim.",       v: cfg.retroalimentacion !== false ? "✅" : "❌" },
            { l: "Revisión final",   v: cfg.revisionFinal !== false ? "✅" : "❌" },
            { l: "Aleat. preguntas", v: cfg.ordenAleatorioPeguntas ? "✅" : "❌" },
          ].map(i => (
            <div key={i.l} className="rounded-xl border border-border bg-card px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground">{i.l}</div>
              <div className="text-sm font-bold text-foreground">{i.v}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// PANEL: VISTA PREVIA
// ─────────────────────────────────────────────────────────────────

function PanelPreview({ sim }: { sim: SimuladorBuilder }) {
  const tema = (sim as any).tema || {}
  const cp = tema.colorPrimario || "#e53935"
  const cs = tema.colorSecundario || "#1a237e"
  const cf = tema.colorFondo || "#ffffff"
  const ct = tema.colorTexto || "#1a1a2e"
  const br = tema.borderRadius === "cuadrado" ? "6px" : tema.borderRadius === "pill" ? "20px" : "14px"
  const formMode = (sim as any).formMode || "personalizado"

  return (
    <div className="space-y-5">
      <SCard icon={<Eye className="h-4 w-4" />} title="Vista previa completa" subtitle="Simulación del simulador tal como lo verán los usuarios">
        <div className="rounded-2xl border border-border overflow-hidden" style={{ background: cf, color: ct }}>
          {/* Banner */}
          <div className="px-8 py-10 text-center" style={{ background: `linear-gradient(135deg, ${cp} 0%, ${cs} 100%)`, color: "#fff" }}>
            <div className="flex justify-center mb-4">
              {(sim as any).icono?.startsWith("data:") || (sim as any).icono?.startsWith("http") || (sim as any).icono?.startsWith("/")
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={(sim as any).icono} alt="" className="h-16 w-16 rounded-2xl object-cover shadow-lg" />
                : <span className="text-5xl">{(sim as any).icono || "🎯"}</span>
              }
            </div>
            <div className="text-2xl font-bold mb-1">{sim.titulo || "Título del simulador"}</div>
            {(sim as any).subtitulo && <div className="text-sm opacity-80 mt-1">{(sim as any).subtitulo}</div>}
            {sim.descripcion && <div className="text-xs opacity-70 mt-2 max-w-md mx-auto leading-relaxed">{sim.descripcion}</div>}
          </div>

          <div className="p-6 space-y-5">
            {/* Instructions */}
            {(sim as any).instrucciones && (
              <div className="rounded-xl p-4" style={{ background: `${cp}10`, border: `1px solid ${cp}25` }}>
                <div className="text-xs font-bold mb-1.5" style={{ color: cp }}>📌 Instrucciones</div>
                <div className="text-sm opacity-80">{(sim as any).instrucciones}</div>
              </div>
            )}

            {/* Form */}
            {formMode !== "ninguno" && (
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider mb-3 opacity-50">Datos del participante</div>
                {formMode === "perfil" ? (
                  <div className="rounded-xl p-4 text-sm text-center opacity-50" style={{ border: "1px dashed currentColor" }}>
                    Se usarán los datos del perfil guardado
                  </div>
                ) : sim.formulario.length === 0 ? (
                  <div className="rounded-xl p-4 text-sm text-center opacity-30" style={{ border: "1px dashed currentColor" }}>Sin campos configurados</div>
                ) : (
                  <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(2,1fr)" }}>
                    {sim.formulario.slice(0, 6).map(c => {
                      if (c.type === "divider") return <div key={c.id} className="col-span-2" style={{ borderBottom: "1px solid currentColor", opacity: 0.15 }} />
                      if (c.type === "heading") return <div key={c.id} className="col-span-2 font-bold mt-1">{c.label}</div>
                      const span = c.cols === 2 ? "col-span-2" : "col-span-1"
                      return (
                        <div key={c.id} className={span}>
                          <div className="text-xs opacity-50 mb-1">{c.label}{c.required && <span style={{ color: cp }} className="ml-1">*</span>}</div>
                          <div className="h-9 rounded-xl px-3 flex items-center text-xs opacity-35" style={{ background: `${ct}10`, border: `1px solid ${ct}20`, borderRadius: br }}>
                            {c.placeholder || c.label}
                          </div>
                        </div>
                      )
                    })}
                    {sim.formulario.length > 6 && (
                      <div className="col-span-2 text-xs opacity-40 text-center">… y {sim.formulario.length - 6} campos más</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Info pills */}
            <div className="flex flex-wrap justify-center gap-2 py-3 border-t" style={{ borderColor: `${ct}15` }}>
              {[
                `📋 ${sim.preguntas.length} preguntas`,
                `⏱ ${sim.config.tiempoPregunta}s por pregunta`,
                sim.config.retroalimentacion !== false && "💡 Retroalimentación",
                sim.config.revisionFinal !== false && "📊 Revisión final",
                (sim as any).certificado?.habilitado && "🏆 Certificado",
              ].filter(Boolean).map((p, i) => (
                <span key={i} className="text-xs px-3 py-1.5 rounded-full font-medium" style={{ background: `${cp}12`, color: cp, border: `1px solid ${cp}25` }}>
                  {p as string}
                </span>
              ))}
            </div>

            {/* CTA Button */}
            <button type="button" className="w-full py-4 text-base font-bold text-white flex items-center justify-center gap-2"
              style={{ background: `linear-gradient(90deg, ${cp}, ${cs})`, borderRadius: br }}>
              <Play className="h-5 w-5" />Comenzar Simulacro →
            </button>
          </div>
        </div>
      </SCard>

      {/* Technical sheet */}
      <SCard icon={<Settings className="h-4 w-4" />} title="Ficha técnica" subtitle="Resumen completo de configuración">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            ["ID",               sim.id],
            ["Estado",           sim.estado],
            ["Formulario",       (sim as any).formMode || "personalizado"],
            ["Preguntas",        sim.preguntas.length],
            ["Campos",           sim.formulario.length],
            ["Tiempo/preg.",     `${sim.config.tiempoPregunta}s`],
            ["Máx. preguntas",   sim.config.preguntasMax],
            ["Intentos",         sim.config.intentosMax ?? 3],
            ["Cooldown",         `${sim.config.cooldownMinutos ?? 30}min`],
            ["Aprobación",       `${sim.config.umbralAprobacion ?? 70}%`],
            ["Certificado",      (sim as any).certificado?.habilitado ? "Sí" : "No"],
            ["Creado",           sim.createdAt ? new Date(sim.createdAt).toLocaleDateString("es") : "—"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5 rounded-xl border border-border bg-secondary/10 px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</div>
              <div className="text-xs font-bold text-foreground font-mono truncate">{String(v)}</div>
            </div>
          ))}
        </div>
      </SCard>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────

type TabId = "lista" | "general" | "formulario" | "preguntas" | "configuracion" | "preview"

const TABS: { id: TabId; label: string; icon: React.ReactNode; req?: boolean }[] = [
  { id: "lista",         label: "Lista simuladores", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
  { id: "general",       label: "General",           icon: <Sparkles className="h-3.5 w-3.5" />,   req: true },
  { id: "formulario",    label: "Formulario",        icon: <FileText className="h-3.5 w-3.5" />,    req: true },
  { id: "preguntas",     label: "Banco de preguntas",icon: <BookOpen className="h-3.5 w-3.5" />,    req: true },
  { id: "configuracion", label: "Configuración",     icon: <Sliders className="h-3.5 w-3.5" />,    req: true },
  { id: "preview",       label: "Vista previa",      icon: <Eye className="h-3.5 w-3.5" />,         req: true },
]

export default function AdminSimulatorsPanel() {
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabId>("lista")
  const [simuladores, setSimuladores] = useState<SimuladorBuilder[]>([])
  const [sim, setSim] = useState<SimuladorBuilder | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [confirmDel, setConfirmDel] = useState<string | null>(null)
  const simId = searchParams.get("simId")
  const tabParam = searchParams.get("tab")
  const fromCurso = searchParams.get("from") === "curso"

  useEffect(() => { if (typeof window !== "undefined") setSimuladores(getSimuladores()) }, [])
  const refresh = useCallback(() => setSimuladores(getSimuladores()), [])

  useEffect(() => {
    if (!simId || simuladores.length === 0) return
    const found = simuladores.find((item) => item.id === simId)
    if (!found) return
    setSim(found)
    if (tabParam && TABS.some((item) => item.id === tabParam)) {
      setTab(tabParam as TabId)
      return
    }
    setTab("general")
  }, [simId, simuladores, tabParam])

  const handleNuevo = () => { setSim(crearSimuladorBase()); setTab("general") }
  const handleEditar = (s: SimuladorBuilder) => { setSim({ ...s }); setTab("general") }

  const handleGuardar = async () => {
    if (!sim) return
    setSaving(true)
    await new Promise(r => setTimeout(r, 150))
    const updSim = { ...sim, updatedAt: new Date().toISOString() }
    const existe = (getSimuladores() as any[]).find((s: any) => s.id === updSim.id)
    if (existe) actualizarSimulador(updSim as any)
    else guardarSimulador(updSim as any)
    setSim(updSim); refresh(); setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePublicar = () => {
    if (!sim) return
    const pub = { ...sim, estado: "publicado" as const, updatedAt: new Date().toISOString() }
    const existe = (getSimuladores() as any[]).find((s: any) => s.id === pub.id)
    if (existe) actualizarSimulador(pub as any)
    else guardarSimulador(pub as any)
    setSim(pub); refresh(); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDel = (id: string) => {
    eliminarSimulador(id); refresh()
    if (sim?.id === id) { setSim(null); setTab("lista") }
    setConfirmDel(null)
  }

  const errores = sim ? {
    preguntas: sim.preguntas.filter(p => !p.pregunta || p.opciones.filter(Boolean).length < 2).length,
    campos:    sim.formulario.filter(c => c.type !== "divider" && c.type !== "heading" && !c.label).length,
  } : null

  const badge = sim ? estadoBadge(sim.estado) : null

  return (
    <div className="min-h-screen bg-background">
      {/* ── Sticky top bar ── */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/90 backdrop-blur-lg">
        {/* Title row */}
        <div className="flex items-center justify-between gap-4 px-6 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Simuladores</div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Constructor Profesional</h1>
            <p className="text-xs text-muted-foreground mt-0.5 hidden sm:block">Motor visual tipo SaaS para crear simuladores, formularios y bancos de preguntas con localStorage.</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {fromCurso && (
              <Link
                href="/admin/cursos"
                className="inline-flex h-9 items-center justify-center rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground transition-all hover:bg-secondary/30"
              >
                Volver a cursos
              </Link>
            )}
            {saved && (
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400">
                <Check className="h-3 w-3" />Guardado
              </div>
            )}
            {sim ? (
              <>
                <Btn onClick={handleGuardar} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  Guardar
                </Btn>
                <Btn variant="primary" onClick={handlePublicar}>
                  <Zap className="h-4 w-4" />Publicar
                </Btn>
              </>
            ) : (
              <Btn variant="primary" onClick={handleNuevo}>
                <Plus className="h-4 w-4" />Nuevo simulador
              </Btn>
            )}
          </div>
        </div>

        {/* Tab bar */}
        <div className="flex items-center overflow-x-auto px-6 gap-0.5 pb-0">
          {TABS.map(t => {
            const disabled = !!(t.req && !sim)
            const active = tab === t.id
            return (
              <button
                key={t.id}
                type="button"
                disabled={disabled}
                onClick={() => !disabled && setTab(t.id)}
                className={cn(
                  "relative flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-semibold border-b-2 transition-all",
                  active
                    ? "border-primary text-primary"
                    : disabled
                    ? "border-transparent text-muted-foreground/30 cursor-not-allowed"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/15",
                )}
              >
                {t.icon}{t.label}
                {t.id === "preguntas"  && (errores?.preguntas ?? 0) > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">{errores!.preguntas}</span>
                )}
                {t.id === "formulario" && (errores?.campos ?? 0) > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">{errores!.campos}</span>
                )}
              </button>
            )
          })}
          {sim && (
            <button
              type="button"
              onClick={() => { setSim(null); setTab("lista"); refresh() }}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors shrink-0"
            >
              <X className="h-3.5 w-3.5" />Cerrar
            </button>
          )}
        </div>
      </div>

      {/* ── Editing banner ── */}
      {sim && badge && (
        <div className="flex items-center gap-3 border-b border-border bg-secondary/5 px-6 py-2">
          <span className={cn("h-2 w-2 rounded-full shrink-0", badge.dot)} />
          <span className="text-xs text-muted-foreground">
            Editando: <span className="font-semibold text-foreground">{sim.titulo || "Sin título"}</span>
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-bold", badge.cls)}>
            {badge.label}
          </span>
          <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono hidden lg:block">{sim.id}</span>
        </div>
      )}

      {/* ── Content ── */}
      <div className="px-6 py-6 max-w-5xl mx-auto">
        {tab === "lista"         && <PanelLista simuladores={simuladores} onEditar={handleEditar} onEliminar={id => setConfirmDel(id)} onNuevo={handleNuevo} />}
        {tab === "general"       && sim && <PanelGeneral sim={sim} setSim={setSim} />}
        {tab === "formulario"    && sim && <PanelFormulario sim={sim} setSim={setSim} />}
        {tab === "preguntas"     && sim && <PanelPreguntas sim={sim} setSim={setSim} />}
        {tab === "configuracion" && sim && <PanelConfig sim={sim} setSim={setSim} />}
        {tab === "preview"       && sim && <PanelPreview sim={sim} />}
      </div>

      {/* ── Delete confirmation modal ── */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 shrink-0">
                <Trash2 className="h-5 w-5 text-red-400" />
              </div>
              <div>
                <div className="text-sm font-bold text-foreground">Eliminar simulador</div>
                <div className="text-xs text-muted-foreground">Esta acción es irreversible</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              ¿Confirmas que deseas eliminar este simulador junto con su formulario y todas sus preguntas?
            </p>
            <div className="flex gap-3">
              <Btn onClick={() => setConfirmDel(null)} className="flex-1">Cancelar</Btn>
              <Btn variant="danger" onClick={() => handleDel(confirmDel)} className="flex-1">
                <Trash2 className="h-4 w-4" />Eliminar
              </Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
