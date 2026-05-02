"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle, Award, BookOpen, Check, ChevronDown, ChevronUp,
  Clock, Copy, Eye, EyeOff, FileText, GripVertical, Key, Layers,
  LayoutGrid, Link2, Loader2, Lock, Paperclip, Pencil, Play, Plus,
  Save, Settings, Target, Trash2, Trophy, Upload, Users,
  Video, X, Zap, Star, BarChart3, Tag, GraduationCap, Lightbulb,
  Folder, Megaphone, Send
} from "lucide-react"
import {
  COURSE_FEEDBACK_EVENT,
  deleteAnnouncement,
  getAnnouncementsForCourse,
  postAnnouncement,
  type Announcement,
} from "@/lib/course-feedback"
import { cn } from "@/lib/utils"
import type { SimuladorBuilder } from "@/simuladores/types"
import {
  eliminarSimulador as eliminarSimuladorStorage,
  getSimuladores as getSimuladoresStorage,
  actualizarSimulador as actualizarSimuladorStorage,
  guardarSimulador as guardarSimuladorStorage,
} from "@/simuladores/storage"
import { resolveCourseResourceUrl } from "@/lib/course-resource-utils"
import { renderSiteIconHtml } from "@/lib/site-icon-registry"
import { SystemSelect } from "@/components/ui/system-select"

// ─── Tipos internos ───────────────────────────────────────────────────────────

type CursoEstado = "borrador" | "en_revision" | "publicado" | "archivado"
type RecursoTipo = "video" | "documento" | "enlace" | "simulador" | "evaluacion" | "texto"
type ClaseTipo = Extract<RecursoTipo, "video" | "documento" | "enlace" | "texto">
type AccesoTipo = "libre" | "clave" | "pago"
type TabCurso = "info" | "contenido" | "acceso" | "anuncios"
type NivelCurso = string

interface AdjuntoCurso {
  id: string; titulo: string; tipo: "documento" | "enlace"; url: string; archivoNombre?: string
}
interface RecursoCurso {
  id: string; tipo: RecursoTipo; titulo: string; descripcion?: string
  url?: string; simuladorId?: string; evaluacionId?: string
  archivoNombre?: string
  duracionMinutos?: number; orden: number; gratis: boolean
  adjuntos?: AdjuntoCurso[]
}
interface SeccionCurso {
  id: string; titulo: string; descripcion?: string; orden: number; recursos: RecursoCurso[]
}
type RecursoCursoExpandido = RecursoCurso & { secId: string; secTitulo: string }
interface CursoData {
  id: string; titulo: string; subtitulo?: string; descripcion: string
  instructor: string; categoria: string; nivel: NivelCurso; estado: CursoEstado
  acceso: AccesoTipo; clavematricula?: string; precio?: number; precioOriginal?: number
  colorPortada?: string; colorPortada2?: string; portadaImagen?: string; idioma?: string
  tags?: string[]; requisitos?: string[]; objetivos?: string[]
  secciones: SeccionCurso[]; certificado?: boolean
  mostrarSimuladoresDashboard?: boolean; mostrarEvaluacionesDashboard?: boolean
  publicarEnPaginaPrincipal?: boolean
  destacado?: boolean; popular?: boolean; nuevo?: boolean
  createdAt: string; updatedAt: string
}

// ─── Storage ──────────────────────────────────────────────────────────────────

const CURSOS_KEY = "he_cursos"
const CURSOS_EVENT = "he-cursos-updated"
function parseSafe<T>(v: string | null, fallback: T): T {
  try { return v ? JSON.parse(v) ?? fallback : fallback } catch { return fallback }
}
function getCursos(): CursoData[] {
  if (typeof window === "undefined") return []
  return parseSafe(localStorage.getItem(CURSOS_KEY), [])
}
function saveCursos(list: CursoData[]) {
  localStorage.setItem(CURSOS_KEY, JSON.stringify(list))
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CURSOS_EVENT))
  }
}
function guardarCurso(c: CursoData) { const l = getCursos(); l.push(c); saveCursos(l) }
function actualizarCurso(c: CursoData) { saveCursos(getCursos().map(x => x.id === c.id ? c : x)) }
function eliminarCurso(id: string) { saveCursos(getCursos().filter(x => x.id !== id)) }

// ─── Categorías Storage ───────────────────────────────────────────────────────

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

const CATEGORIAS_KEY = "he_categorias"

function getCategorias(): Categoria[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(CATEGORIAS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function getCategoriasActivas(): Categoria[] {
  return getCategorias().filter(c => c.activa)
}

// ─── Utils ────────────────────────────────────────────────────────────────────

function uid() { return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
function uidPref(prefijo: string) { return `${prefijo}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}` }
function esTipoClase(tipo: RecursoTipo): tipo is ClaseTipo {
  return tipo === "video" || tipo === "documento" || tipo === "enlace" || tipo === "texto"
}

const TITULOS_RECURSO: Record<RecursoTipo, string> = {
  video: "Nueva clase en video",
  documento: "Nuevo material de clase",
  enlace: "Nuevo enlace de clase",
  texto: "Nueva leccion",
  simulador: "Nuevo simulador",
  evaluacion: "Nueva evaluacion",
}

function crearRecursoBase(tipo: RecursoTipo, orden: number): RecursoCurso {
  return {
    id: uidPref("rec"),
    tipo,
    titulo: TITULOS_RECURSO[tipo],
    descripcion: "",
    url: "",
    simuladorId: "",
    evaluacionId: "",
    archivoNombre: "",
    duracionMinutos: tipo === "video" ? 10 : tipo === "simulador" ? 30 : tipo === "evaluacion" ? 20 : 5,
    orden,
    gratis: false,
  }
}

function getLinkedActivityIds(curso: CursoData) {
  const ids = new Set<string>()
  curso.secciones.forEach((sec) => {
    sec.recursos.forEach((rec) => {
      if (rec.simuladorId) ids.add(rec.simuladorId)
      if (rec.evaluacionId) ids.add(rec.evaluacionId)
    })
  })
  return ids
}

function getActividadCourseLink(tipo: "simulador" | "evaluacion", curso: CursoData, sim: SimuladorBuilder) {
  const cursoIds = Array.from(new Set([...(sim.cursoIds || []), curso.id].filter(Boolean)))
  const cursoTitulos = Array.from(new Set([...(sim.cursoTitulos || []), curso.titulo || "Curso sin titulo"].filter(Boolean)))
  return {
    ...sim,
    categoria: tipo === "evaluacion" ? "evaluacion" : (sim.categoria || curso.categoria || "otros"),
    cursoIds,
    cursoTitulos,
    cursoId: curso.id,
    cursoTitulo: curso.titulo || "Curso sin titulo",
    updatedAt: new Date().toISOString(),
  }
}

function eliminarActividadesDeCurso(cursoId: string) {
  const simuladores = getSimuladoresStorage() as SimuladorBuilder[]
  simuladores.forEach((sim) => {
    const ids = Array.from(new Set([...(sim.cursoIds || []), sim.cursoId || ""])).filter(Boolean)
    if (!ids.includes(cursoId)) return
    const nextIds = ids.filter((id) => id !== cursoId)
    const nextTitulos = (sim.cursoTitulos || []).filter((_, index) => (sim.cursoIds || [sim.cursoId]).filter(Boolean)[index] !== cursoId)
    actualizarSimuladorStorage({
      ...sim,
      cursoIds: nextIds,
      cursoTitulos: nextTitulos,
      cursoId: nextIds[0],
      cursoTitulo: nextTitulos[0],
      updatedAt: new Date().toISOString(),
    } as any)
  })
}

function duplicarCursoConActividades(curso: CursoData) {
  const ahora = new Date().toISOString()
  const nuevoCursoId = uidPref("curso")
  const nuevoTitulo = curso.titulo ? `${curso.titulo} (copia)` : "Curso copia"
  const linkedIds = getLinkedActivityIds(curso)
  const simuladores = getSimuladoresStorage() as SimuladorBuilder[]
  const simuladoresPorId = new Map(simuladores.filter((sim) => linkedIds.has(sim.id)).map((sim) => [sim.id, sim]))
  const nuevosSimuladores: SimuladorBuilder[] = []

  const secciones = curso.secciones.map((sec, secIndex) => ({
    ...sec,
    id: uidPref("sec"),
    orden: secIndex,
    recursos: sec.recursos.map((rec, recIndex) => {
      const nuevoRecurso: RecursoCurso = {
        ...rec,
        id: uidPref("rec"),
        orden: recIndex,
      }

      const linkedId = rec.tipo === "simulador" ? rec.simuladorId : rec.tipo === "evaluacion" ? rec.evaluacionId : ""
      const linked = linkedId ? simuladoresPorId.get(linkedId) : null

      if (!linked) {
        if (rec.tipo === "simulador") nuevoRecurso.simuladorId = ""
        if (rec.tipo === "evaluacion") nuevoRecurso.evaluacionId = ""
        return nuevoRecurso
      }

      const nuevoSimId = uidPref("sim")
      nuevosSimuladores.push({
        ...linked,
        id: nuevoSimId,
        titulo: linked.titulo ? `${linked.titulo} (copia)` : TITULOS_RECURSO[rec.tipo],
        estado: "borrador",
        cursoId: nuevoCursoId,
        cursoTitulo: nuevoTitulo,
        createdAt: ahora,
        updatedAt: ahora,
      })

      if (rec.tipo === "simulador") {
        nuevoRecurso.simuladorId = nuevoSimId
      }
      if (rec.tipo === "evaluacion") {
        nuevoRecurso.evaluacionId = nuevoSimId
      }

      return nuevoRecurso
    }),
  }))

  nuevosSimuladores.forEach((sim) => guardarSimuladorStorage(sim))

  return {
    ...curso,
    id: nuevoCursoId,
    titulo: nuevoTitulo,
    estado: "borrador" as CursoEstado,
    secciones,
    createdAt: ahora,
    updatedAt: ahora,
  }
}

function crearCursoBase(): CursoData {
  return {
    id: `curso_${Date.now()}`,
    titulo: "Nuevo curso Hack Evans",
    subtitulo: "Completa la informacion del curso para personalizar su portada y propuesta de valor.",
    descripcion: "Curso en construccion. Agrega objetivos, contenidos y una portada para que quede alineado al catalogo principal.",
    instructor: "Equipo Hack Evans",
    categoria: "pedagogia",
    nivel: "intermedio",
    estado: "borrador", acceso: "libre", clavematricula: "", precio: 0,
    colorPortada: "#10b981", colorPortada2: "#059669", portadaImagen: "",
    idioma: "Español", tags: [], requisitos: [], objetivos: [],
    secciones: [], certificado: false, mostrarSimuladoresDashboard: true, mostrarEvaluacionesDashboard: true, publicarEnPaginaPrincipal: true,
    destacado: false, popular: false, nuevo: true,
    createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
  }
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
    contentMode: "html",
    htmlContent: "",
    htmlImportName: "",
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
      titulo: "Certificado de Participacion",
      subtitulo: "Ha completado satisfactoriamente el simulacro",
      textoPie: "Plataforma Educativa HackEvans",
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as SimuladorBuilder
}

function totalLecciones(c: CursoData) {
  return c.secciones.reduce((a, s) => a + s.recursos.length, 0)
}
function totalMinutos(c: CursoData) {
  return c.secciones.reduce((a, s) => a + s.recursos.reduce((b, r) => b + (r.duracionMinutos || 0), 0), 0)
}

function esCursoDePago(curso: CursoData) {
  return curso.acceso === "pago" && (curso.precio || 0) > 0
}

type CursoPublishIssue = { tab: TabCurso; message: string }

function validarCursoParaPublicacion(curso: CursoData): CursoPublishIssue[] {
  const issues: CursoPublishIssue[] = []

  if (!curso.titulo.trim()) {
    issues.push({ tab: "info", message: "Agrega el titulo del curso." })
  }
  if (!curso.descripcion.trim()) {
    issues.push({ tab: "info", message: "Agrega la descripcion principal del curso." })
  }
  if (!curso.instructor.trim()) {
    issues.push({ tab: "info", message: "Agrega el nombre del instructor." })
  }
  if (curso.acceso === "clave" && !curso.clavematricula?.trim()) {
    issues.push({ tab: "acceso", message: "Define la clave de matricula para publicar este curso." })
  }
  if (curso.acceso === "pago" && (curso.precio ?? 0) <= 0) {
    issues.push({ tab: "acceso", message: "Define un precio mayor a 0 para publicar este curso de pago." })
  }
  if (curso.secciones.length === 0) {
    issues.push({ tab: "contenido", message: "Crea al menos una seccion antes de publicar." })
  }
  if (totalLecciones(curso) === 0) {
    issues.push({ tab: "contenido", message: "Agrega al menos una clase, simulador o evaluacion al curso." })
  }

  curso.secciones.forEach((sec, secIndex) => {
    if (!sec.titulo.trim()) {
      issues.push({ tab: "contenido", message: `La seccion ${secIndex + 1} no tiene titulo.` })
    }

    sec.recursos.forEach((rec, recIndex) => {
      const ref = `Seccion ${secIndex + 1}, recurso ${recIndex + 1}`
      if (!rec.titulo.trim()) {
        issues.push({ tab: "contenido", message: `${ref}: agrega el titulo del recurso.` })
      }

      if (rec.tipo === "video" || rec.tipo === "documento" || rec.tipo === "enlace") {
        const linkInfo = resolveCourseResourceUrl(rec.tipo, rec.url)
        if (!linkInfo.valid) {
          issues.push({ tab: "contenido", message: `${ref}: ${linkInfo.message || "enlace invalido"}` })
        }
      }

      if (rec.tipo === "texto" && !rec.url?.trim()) {
        issues.push({ tab: "contenido", message: `${ref}: agrega el contenido de texto.` })
      }

      if (rec.tipo === "simulador" && !rec.simuladorId) {
        issues.push({ tab: "contenido", message: `${ref}: vincula o crea un simulador.` })
      }

      if (rec.tipo === "evaluacion" && !rec.evaluacionId) {
        issues.push({ tab: "contenido", message: `${ref}: vincula o crea una evaluacion.` })
      }
    })
  })

  return issues
}

// CATEGORIAS se obtiene dinámicamente desde getCategorias() en el componente
// Se mantiene esta línea para compatibilidad pero se reemplaza en el formulario

const TIPOS_RECURSO: { tipo: RecursoTipo; label: string; icon: React.ReactNode; desc: string }[] = [
  { tipo: "video",       label: "Video",       icon: <Video className="h-4 w-4" />,    desc: "Clase en video (URL o embed)" },
  { tipo: "documento",   label: "Documento",   icon: <FileText className="h-4 w-4" />, desc: "PDF, Word, etc." },
  { tipo: "enlace",      label: "Enlace",      icon: <Link2 className="h-4 w-4" />,    desc: "Recurso externo" },
  { tipo: "texto",       label: "Texto",       icon: <BookOpen className="h-4 w-4" />, desc: "Contenido de texto" },
  { tipo: "simulador",   label: "Simulador",   icon: <Target className="h-4 w-4" />,   desc: "Simulador del sistema" },
  { tipo: "evaluacion",  label: "Evaluación",  icon: <Award className="h-4 w-4" />,    desc: "Evaluación del curso" },
]
const TIPOS_CLASE_RECURSO = TIPOS_RECURSO.filter((item) =>
  item.tipo === "video" || item.tipo === "documento" || item.tipo === "enlace" || item.tipo === "texto"
)

// ─── ATOMS ────────────────────────────────────────────────────────────────────

const inputCls = "h-10 w-full rounded-xl border border-border bg-secondary/15 px-3.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none transition-all"

function Btn({ children, onClick, variant = "secondary", size = "md", disabled, className, type = "button" }: {
  children: React.ReactNode; onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md"; disabled?: boolean; className?: string; type?: "button" | "submit"
}) {
  const v = { primary: "bg-primary text-white hover:bg-primary/90", secondary: "border border-border bg-secondary/15 text-foreground hover:bg-secondary/35", ghost: "text-muted-foreground hover:text-foreground hover:bg-secondary/20", danger: "border border-red-500/20 bg-red-500/8 text-red-400 hover:bg-red-500/15" }
  const s = { sm: "px-3 py-1.5 text-xs gap-1.5 rounded-xl", md: "px-4 py-2.5 text-sm gap-2 rounded-xl" }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={cn("inline-flex items-center justify-center font-semibold transition-all", v[variant], s[size], disabled && "opacity-40 cursor-not-allowed", className)}>
      {children}
    </button>
  )
}

function Inp({ label, value, onChange, onBlur, placeholder, type = "text", required, hint, className, rows }: {
  label?: string; value: string | number; onChange: (v: string) => void; placeholder?: string
  onBlur?: (v: string) => void; type?: string; required?: boolean; hint?: string; className?: string; rows?: number
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}{required && <span className="text-primary ml-1">*</span>}</label>}
      {rows
        ? <textarea rows={rows} className="w-full rounded-xl border border-border bg-secondary/15 px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/40 focus:border-primary focus:bg-card focus:outline-none transition-all resize-none" value={value} onChange={e => onChange(e.target.value)} onBlur={e => onBlur?.(e.target.value)} placeholder={placeholder} />
        : <input type={type} className={inputCls} value={value} onChange={e => onChange(e.target.value)} onBlur={e => onBlur?.(e.target.value)} placeholder={placeholder} />
      }
      {hint && <span className="text-[11px] text-muted-foreground/60">{hint}</span>}
    </div>
  )
}

function Sel({ label, value, onChange, options, hint, className }: {
  label?: string; value: string; onChange: (v: string) => void
  options: { value: string; label: string }[]; hint?: string; className?: string
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</label>}
      <SystemSelect value={value} onValueChange={onChange} options={options} />
      {hint && <span className="text-[11px] text-muted-foreground/60">{hint}</span>}
    </div>
  )
}

function Toggle({ label, sublabel, value, onChange }: { label: string; sublabel?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/40 last:border-0">
      <div><div className="text-sm font-medium text-foreground">{label}</div>{sublabel && <div className="text-xs text-muted-foreground mt-0.5">{sublabel}</div>}</div>
      <button type="button" onClick={() => onChange(!value)} className={cn("relative h-5 w-9 rounded-full transition-colors duration-200 shrink-0 ml-4", value ? "bg-primary" : "bg-secondary border border-border")}>
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all duration-200", value ? "left-[18px]" : "left-0.5")} />
      </button>
    </div>
  )
}

function Card({ icon, title, subtitle, action, children }: { icon?: React.ReactNode; title: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-border bg-secondary/5">
        <div className="flex items-center gap-3 min-w-0">
          {icon && <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">{icon}</div>}
          <div><div className="text-sm font-bold text-foreground">{title}</div>{subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}</div>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function estadoBadge(estado: CursoEstado) {
  const m: Record<CursoEstado, { cls: string; dot: string; label: string }> = {
    borrador:    { cls: "bg-amber-500/12 text-amber-400 border-amber-500/25",   dot: "bg-amber-400",    label: "Borrador" },
    en_revision: { cls: "bg-blue-500/12 text-blue-400 border-blue-500/25",      dot: "bg-blue-400",     label: "En revisión" },
    publicado:   { cls: "bg-emerald-500/12 text-emerald-400 border-emerald-500/25", dot: "bg-emerald-400", label: "Publicado" },
    archivado:   { cls: "bg-zinc-600/20 text-zinc-400 border-zinc-600/20",      dot: "bg-zinc-500",     label: "Archivado" },
  }
  return m[estado]
}

// ─── PANEL: LISTA CURSOS ──────────────────────────────────────────────────────

function PanelListaCursos({ cursos, onNuevo, onEditar, onDuplicar, onEliminar, categorias = [] }: {
  cursos: CursoData[]
  onNuevo: () => void
  onEditar: (curso: CursoData) => void
  onDuplicar: (curso: CursoData) => void
  onEliminar: (id: string) => void
  categorias?: Categoria[]
}) {
  const [q, setQ] = useState(""); const [est, setEst] = useState("todos")
  const [cat, setCat] = useState("todas")
  const [orden, setOrden] = useState("actualizado")
  const [page, setPage] = useState(1)
  const pageSize = 6
  const filtered = cursos.filter(c => {
    const mq = !q || c.titulo.toLowerCase().includes(q.toLowerCase()) || c.categoria.toLowerCase().includes(q.toLowerCase())
    const mc = cat === "todas" || c.categoria === cat
    return mq && mc && (est === "todos" || c.estado === est)
  }).sort((a, b) => {
    if (orden === "titulo") return (a.titulo || "").localeCompare(b.titulo || "")
    if (orden === "precio") return Number(b.precio || 0) - Number(a.precio || 0)
    if (orden === "popularidad") {
      const sa = (a.destacado ? 3 : 0) + (a.popular ? 2 : 0) + (a.nuevo ? 1 : 0)
      const sb = (b.destacado ? 3 : 0) + (b.popular ? 2 : 0) + (b.nuevo ? 1 : 0)
      return sb - sa
    }
    return new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime()
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize)
  const stats = [
    { l: "Total cursos", v: cursos.length, c: "" },
    { l: "Publicados", v: cursos.filter(c => c.estado === "publicado").length, c: "text-emerald-400" },
    { l: "Total secciones", v: cursos.reduce((a, c) => a + c.secciones.length, 0), c: "" },
    { l: "Total lecciones", v: cursos.reduce((a, c) => a + totalLecciones(c), 0), c: "" },
  ]
  useEffect(() => { setPage(1) }, [q, est, cat, orden])
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(s => (
          <div key={s.l} className="rounded-2xl border border-border bg-card p-4">
            <div className="text-xs text-muted-foreground mb-1">{s.l}</div>
            <div className={cn("text-2xl font-bold", s.c || "text-foreground")}>{s.v}</div>
          </div>
        ))}
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <input className={cn(inputCls, "pl-9")} placeholder="Buscar cursos..." value={q} onChange={e => setQ(e.target.value)} />
          <svg className="absolute left-3 top-3 h-4 w-4 text-muted-foreground/40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
        </div>
        <div className="sm:w-44">
          <SystemSelect
            value={est}
            onValueChange={setEst}
            options={[
              { value: "todos", label: "Todos los estados" },
              { value: "borrador", label: "Borrador" },
              { value: "en_revision", label: "En revisión" },
              { value: "publicado", label: "Publicado" },
              { value: "archivado", label: "Archivado" },
            ]}
          />
        </div>
        <div className="sm:w-44">
          <SystemSelect
            value={cat}
            onValueChange={setCat}
            options={[
              { value: "todas", label: "Todas las categorias" },
              ...Array.from(new Set(cursos.map(c => c.categoria).filter(Boolean))).sort((a, b) => a.localeCompare(b)).map(value => ({ value, label: value })),
            ]}
          />
        </div>
        <div className="sm:w-44">
          <SystemSelect
            value={orden}
            onValueChange={setOrden}
            options={[
              { value: "actualizado", label: "Mas reciente" },
              { value: "popularidad", label: "Mas visible" },
              { value: "titulo", label: "A-Z" },
              { value: "precio", label: "Mayor precio" },
            ]}
          />
        </div>
        <Btn variant="primary" onClick={onNuevo}><Plus className="h-4 w-4" />Agregar curso</Btn>
      </div>
      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <span className="rounded-full border border-border bg-card px-3 py-1.5">{filtered.length} resultados</span>
        <span className="rounded-full border border-border bg-card px-3 py-1.5">Pagina {page} de {totalPages}</span>
      </div>
      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 py-20 text-center">
          <div className="mb-3"><BookOpen className="h-12 w-12 mx-auto text-muted-foreground/60" /></div>
          <div className="text-sm font-semibold text-foreground mb-1">{cursos.length === 0 ? "Aún no tienes cursos" : "Sin resultados"}</div>
          <div className="text-xs text-muted-foreground mb-5">{cursos.length === 0 ? "Crea un curso profesional con secciones, simuladores y evaluaciones" : "Prueba otro término"}</div>
        </div>
      ) : (
        <>
        <div className="space-y-4">
          {paginated.map(c => {
            const badge = estadoBadge(c.estado)
            const lec = totalLecciones(c)
            const horas = totalMinutos(c) > 0 ? (totalMinutos(c) / 60).toFixed(1) : "1.0"
            const gratis = c.acceso !== "pago" || (c.precio || 0) <= 0
            const totalRatings = 180 + lec * 9
            const rating = c.destacado ? 4.9 : c.popular ? 4.8 : c.nuevo ? 4.7 : 4.6

            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card p-4 transition-all hover:border-primary/30 hover:shadow-lg hover:shadow-black/5">
                <div className="grid gap-4 xl:grid-cols-[112px_minmax(0,1.8fr)_minmax(220px,0.9fr)_auto] xl:items-center">
                  <div className="relative h-24 w-full overflow-hidden rounded-2xl border border-border bg-muted/40 xl:w-28">
                    {c.portadaImagen ? (
                      <img src={c.portadaImagen} alt="Portada" className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${c.colorPortada || "#10b981"}, ${c.colorPortada2 || "#059669"})` }} />
                    )}
                    {c.nuevo ? <div className="absolute left-2 top-2 bg-[#a435f0] px-1.5 py-0.5 text-[10px] font-bold text-white">Nuevo</div> : null}
                    {!c.nuevo && (c.destacado || c.popular) ? <div className="absolute left-2 top-2 bg-[#eceb98] px-1.5 py-0.5 text-[10px] font-bold text-[#3d3c0a]">Top</div> : null}
                    {gratis ? <div className="absolute right-2 top-2 bg-[#1db954] px-1.5 py-0.5 text-[10px] font-bold text-white">Gratis</div> : null}
                  </div>

                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", badge.cls)}>
                        <span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />
                        {badge.label}
                      </span>
                      <span className="rounded-full border border-border bg-secondary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                        {c.categoria || "General"}
                      </span>
                      {c.acceso === "clave" ? <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400"><Key className="h-2.5 w-2.5" />Con clave</span> : null}
                      {c.certificado ? <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400"><Trophy className="h-2.5 w-2.5" />Certif.</span> : null}
                      {c.publicarEnPaginaPrincipal !== false ? <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300"><Eye className="h-2.5 w-2.5" />Inicio</span> : null}
                    </div>

                    <div className="mb-1 line-clamp-1 text-lg font-bold text-foreground">{c.titulo || <span className="italic text-muted-foreground">Sin título</span>}</div>
                    <div className="mb-1 line-clamp-2 text-sm text-muted-foreground">{c.subtitulo?.trim() || c.descripcion || "Curso listo para publicarse en la portada y dashboard."}</div>
                    <div className="text-sm text-muted-foreground">{c.instructor || "Sin instructor"}</div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-sm font-bold text-[#f4c150]">{rating.toFixed(1)}</span>
                      <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={12} className="fill-[#f4c150] text-[#f4c150]" />)}</div>
                      <span className="text-xs text-muted-foreground">({totalRatings.toLocaleString()})</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {horas}h</span>
                      <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground">{lec} clases</span>
                      <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground"><GraduationCap className="h-3 w-3" /> {c.nivel || "Todos los niveles"}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      {gratis ? (
                        <span className="text-2xl font-bold text-[#1db954]">Gratis</span>
                      ) : (
                        <>
                          <span className="text-2xl font-bold text-foreground">{(c.precio || 0).toFixed(2)} US$</span>
                          <span className="text-sm text-muted-foreground line-through">{Number(c.precioOriginal || Math.max((c.precio || 0) * 1.7, c.precio || 0)).toFixed(2)} US$</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 xl:justify-end">
                    <button onClick={() => onEditar(c)} className="flex items-center gap-1.5 rounded-xl border border-[#a435f0] bg-transparent px-3 py-2 text-xs font-bold text-[#a435f0] transition-all hover:bg-[#a435f0] hover:text-white">
                      <Pencil className="h-3.5 w-3.5" />
                      Editar
                    </button>
                    <button onClick={() => onDuplicar(c)} className="flex items-center gap-1.5 rounded-xl border border-border bg-transparent px-3 py-2 text-xs font-bold text-foreground transition-all hover:bg-secondary/40">
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                    <button onClick={() => onEliminar(c.id)} className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-transparent px-3 py-2 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
        {totalPages > 1 ? (
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)} de {filtered.length} cursos
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={page === 1} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition-all hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-40">Anterior</button>
              <div className="hidden items-center gap-1 sm:flex">
                {Array.from({ length: totalPages }).slice(0, 7).map((_, index) => {
                  const pageNumber = index + 1
                  const active = pageNumber === page
                  return (
                    <button
                      key={pageNumber}
                      onClick={() => setPage(pageNumber)}
                      className={cn(
                        "h-9 min-w-9 rounded-lg border px-3 text-sm font-semibold transition-all",
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-border bg-background text-foreground hover:bg-secondary/40"
                      )}
                    >
                      {pageNumber}
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={page === totalPages} className="rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground transition-all hover:bg-secondary/40 disabled:cursor-not-allowed disabled:opacity-40">Siguiente</button>
            </div>
          </div>
        ) : null}

        {false && <div className="space-y-3">
          {filtered.map(c => {
            const badge = estadoBadge(c.estado)
            const lec = totalLecciones(c)
            const min = totalMinutos(c)
            const h = Math.floor(min / 60)
            return (
              <div key={c.id} className="rounded-2xl border border-border bg-card overflow-hidden hover:border-primary/30 transition-all">
                <div style={{ background: `linear-gradient(135deg, ${c.colorPortada || "#10b981"}, ${c.colorPortada2 || "#059669"})` }} className="h-1.5" />
                <div className="p-5 flex items-center gap-4">
                  <div className="relative flex h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-border bg-secondary/10">
                    {c.portadaImagen ? (
                      <img src={c.portadaImagen} alt="Portada" className="h-full w-full object-cover" />
                    ) : (
                      <div style={{ background: `linear-gradient(135deg, ${c.colorPortada || "#10b981"}, ${c.colorPortada2 || "#059669"})` }} className="flex h-full w-full items-center justify-center text-3xl text-white">
                        <BookOpen className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", badge.cls)}><span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />{badge.label}</span>
                      {c.acceso === "clave" && <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] font-bold text-amber-400"><Key className="h-2.5 w-2.5" />Con clave</span>}
                      {c.certificado && <span className="inline-flex items-center gap-1 rounded-full border border-yellow-500/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold text-yellow-400"><Trophy className="h-2.5 w-2.5" />Certif.</span>}
                      {c.publicarEnPaginaPrincipal !== false && <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300"><Eye className="h-2.5 w-2.5" />Inicio</span>}
                    </div>
                    <div className="font-bold text-foreground line-clamp-1">{c.titulo || <span className="italic text-muted-foreground">Sin título</span>}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                      <span>{c.instructor || "Sin instructor"}</span>
                      <span>·</span>
                      {c.categoria && categoriasMap.has(c.categoria) ? (
                        <>
                          <span dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(categoriasMap.get(c.categoria)!.icono as any, { size: 12 }) }} style={{ display: "inline-flex" }} />
                          <span>{c.categoria}</span>
                        </>
                      ) : (
                        <span>{c.categoria || "Sin categoría"}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{c.secciones.length} secciones</span>
                      <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{lec} lecciones</span>
                      {h > 0 && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{h}h</span>}
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{c.acceso === "libre" ? "Libre" : c.acceso === "clave" ? "Con clave" : "Pago"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Btn size="sm" onClick={() => onEditar(c)}><Pencil className="h-3.5 w-3.5" />Editar</Btn>
                    <Btn size="sm" onClick={() => onDuplicar(c)}><Copy className="h-3.5 w-3.5" /></Btn>
                    <Btn size="sm" variant="danger" onClick={() => onEliminar(c.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                  </div>
                </div>
              </div>
            )
          })}
        </div>}
        </>
      )}
    </div>
  )
}

// ─── PANEL: INFO CURSO ────────────────────────────────────────────────────────

function AdminCursoVisualPreview({ curso }: { curso: CursoData }) {
  const badge = estadoBadge(curso.estado)
  const lec = totalLecciones(curso)
  const horas = totalMinutos(curso) > 0 ? (totalMinutos(curso) / 60).toFixed(1) : "1.0"
  const gratis = curso.acceso !== "pago" || (curso.precio || 0) <= 0
  const totalRatings = 180 + lec * 9
  const rating = curso.destacado ? 4.9 : curso.popular ? 4.8 : curso.nuevo ? 4.7 : 4.6

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative h-40 w-full overflow-hidden bg-muted/40">
        {curso.portadaImagen ? (
          <img src={curso.portadaImagen} alt="Portada" className="h-full w-full object-cover" />
        ) : (
          <div className="h-full w-full" style={{ background: `linear-gradient(135deg, ${curso.colorPortada || "#10b981"}, ${curso.colorPortada2 || "#059669"})` }} />
        )}
        {curso.nuevo ? <div className="absolute left-3 top-3 bg-[#a435f0] px-2 py-0.5 text-[11px] font-bold text-white">Nuevo</div> : null}
        {!curso.nuevo && (curso.destacado || curso.popular) ? <div className="absolute left-3 top-3 bg-[#eceb98] px-2 py-0.5 text-[11px] font-bold text-[#3d3c0a]">Mas vendido</div> : null}
        {gratis ? <div className="absolute right-3 top-3 bg-[#1db954] px-2 py-0.5 text-[11px] font-bold text-white">Gratis</div> : null}
      </div>
      <div className="p-3">
        <div className="mb-2 flex flex-wrap items-center gap-2">
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", badge.cls)}><span className={cn("h-1.5 w-1.5 rounded-full", badge.dot)} />{badge.label}</span>
          <span className="rounded-full border border-border bg-secondary/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{curso.categoria || "General"}</span>
          {curso.publicarEnPaginaPrincipal !== false ? <span className="inline-flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[10px] font-bold text-sky-300"><Eye className="h-2.5 w-2.5" />Inicio</span> : null}
        </div>
        <div className="mb-1 line-clamp-2 text-base font-bold text-foreground">{curso.titulo || "Nuevo curso Hack Evans"}</div>
        <div className="mb-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{curso.subtitulo?.trim() || curso.descripcion || "Completa la informacion para personalizar este curso."}</div>
        <div className="mb-2 text-xs text-muted-foreground">{curso.instructor || "Equipo Hack Evans"}</div>
        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#f4c150]">{rating.toFixed(1)}</span>
          <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map((i) => <Star key={i} size={11} className="fill-[#f4c150] text-[#f4c150]" />)}</div>
          <span className="text-xs text-muted-foreground">({totalRatings.toLocaleString()})</span>
        </div>
        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground"><Clock className="h-3 w-3" /> {horas} horas</span>
          <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground">{lec} clases</span>
          <span className="flex items-center gap-1 rounded bg-secondary/35 px-2 py-0.5 text-[11px] text-muted-foreground"><GraduationCap className="h-3 w-3" /> {curso.nivel || "Todos los niveles"}</span>
        </div>
        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-baseline gap-2">
            {gratis ? <span className="text-lg font-bold text-[#1db954]">Gratis</span> : <><span className="text-lg font-bold text-foreground">{(curso.precio || 0).toFixed(2)} US$</span><span className="text-sm text-muted-foreground line-through">{Number(curso.precioOriginal || Math.max((curso.precio || 0) * 1.7, curso.precio || 0)).toFixed(2)} US$</span></>}
          </div>
          <span className="rounded border border-border px-3 py-2 text-xs font-bold text-[#a435f0]">Vista previa</span>
        </div>
      </div>
    </div>
  )
}

function PanelInfoCurso({ curso, setCurso }: { curso: CursoData; setCurso: (c: CursoData) => void }) {
  const set = (p: Partial<CursoData>) => setCurso({ ...curso, ...p })
  const fileRef = useRef<HTMLInputElement | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    setCategorias(getCategorias())
    const handleUpdate = () => setCategorias(getCategorias())
    window.addEventListener("he-categorias-updated", handleUpdate)
    return () => window.removeEventListener("he-categorias-updated", handleUpdate)
  }, [])

  const handlePortadaImage = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") set({ portadaImagen: reader.result })
    }
    reader.readAsDataURL(file)
  }

  const categoriasActivas = categorias.filter(c => c.activa)
  const categoriasOptions = categoriasActivas.map(c => ({
    value: c.nombre,
    label: (
      <div className="flex items-center gap-2">
        <span dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(c.icono as any, { size: 16 }) }} style={{ display: "inline-flex" }} />
        <span>{c.nombre}</span>
      </div>
    )
  }))

  return (
    <div className="space-y-5">
      <Card icon={<BookOpen className="h-4 w-4" />} title="Identidad del curso" subtitle="Portada, título, descripción y metadatos">
        <div className="space-y-4">
          <div className="grid gap-4 xl:grid-cols-[160px_minmax(0,1fr)_360px]">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Portada</label>
              <div className="h-32 w-32 overflow-hidden rounded-2xl border border-border bg-secondary/20">
                {curso.portadaImagen ? (
                  <img src={curso.portadaImagen} alt="Portada del curso" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-center text-sm font-medium text-muted-foreground px-3">
                    Sube una imagen de portada para el curso
                  </div>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/10 px-3 py-2 text-sm font-semibold text-foreground hover:border-primary hover:bg-primary/10 transition-all">
                  <Upload className="h-4 w-4" /> Subir imagen
                </button>
                {curso.portadaImagen && (
                  <button type="button" onClick={() => set({ portadaImagen: "" })} className="inline-flex items-center gap-2 rounded-2xl border border-border bg-secondary/10 px-3 py-2 text-sm font-semibold text-foreground hover:border-destructive hover:text-destructive transition-all">
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                )}
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => { if (e.target.files?.[0]) handlePortadaImage(e.target.files[0]) }} />
              </div>
            </div>
            <div className="flex-1 space-y-3">
              <Inp label="Título del curso" value={curso.titulo} onChange={v => set({ titulo: v })} placeholder="Ej: Saberes Pedagógicos Fundamentales" required />
              <Inp label="Subtítulo" value={curso.subtitulo || ""} onChange={v => set({ subtitulo: v })} placeholder="Ej: Prepárate con los fundamentos de pedagogía y didáctica" />
              <div className="rounded-2xl border border-border bg-card p-3 xl:hidden">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vista rápida</div>
                <AdminCursoVisualPreview curso={curso} />
              </div>
            </div>
            <div className="hidden xl:block">
              <div className="rounded-2xl border border-border bg-card p-3">
                <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Vista rápida</div>
                <AdminCursoVisualPreview curso={curso} />
              </div>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color principal</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-secondary/10 p-0" value={curso.colorPortada || "#10b981"} onChange={e => set({ colorPortada: e.target.value })} />
                <input type="text" className={inputCls} value={curso.colorPortada || "#10b981"} onChange={e => set({ colorPortada: e.target.value })} placeholder="#10b981" />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Color secundario</label>
              <div className="flex items-center gap-2">
                <input type="color" className="h-10 w-14 cursor-pointer rounded-xl border border-border bg-secondary/10 p-0" value={curso.colorPortada2 || "#059669"} onChange={e => set({ colorPortada2: e.target.value })} />
                <input type="text" className={inputCls} value={curso.colorPortada2 || "#059669"} onChange={e => set({ colorPortada2: e.target.value })} placeholder="#059669" />
              </div>
            </div>
          </div>
          <span className="text-[11px] text-muted-foreground/60">Elige dos colores para ver mejor la paleta de portada.</span>
          <Inp label="Descripción completa" value={curso.descripcion} onChange={v => set({ descripcion: v })} placeholder="Describe el objetivo, contenido y lo que aprenderá el estudiante..." rows={3} />
          <div className="grid gap-3 sm:grid-cols-3">
            <Inp label="Instructor" value={curso.instructor} onChange={v => set({ instructor: v })} placeholder="Nombre del instructor" required />
            <div>
              {categoriasActivas.length > 0 ? (
                <Sel 
                  label="Categoría" 
                  value={curso.categoria} 
                  onChange={v => set({ categoria: v })} 
                  options={categoriasOptions}
                />
              ) : (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Categoría</label>
                  <div className="h-10 rounded-xl border border-border bg-background px-3 flex items-center text-sm text-muted-foreground">
                    <span>No hay categorías creadas</span>
                  </div>
                  <span className="text-[11px] text-amber-500">Crea una categoría desde el panel de Categorías</span>
                </div>
              )}
            </div>
            <Inp label="Nivel" value={curso.nivel} onChange={v => set({ nivel: v })} placeholder="Básico, Intermedio, Avanzado..." />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Inp label="Idioma" value={curso.idioma || ""} onChange={v => set({ idioma: v })} placeholder="Español" />
            <Inp label="Tags (separados por coma)" value={(curso.tags || []).join(", ")} onChange={v => set({ tags: v.split(",").map(t => t.trim()).filter(Boolean) })} placeholder="QSM, pedagogia, 2026" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Inp label="Objetivos del curso (uno por línea)" value={(curso.objetivos || []).join("\n")} onChange={v => set({ objetivos: v.split("\n").filter(Boolean) })} placeholder={"Comprender los fundamentos pedagógicos\nAplicar estrategias didácticas modernas"} rows={3} />
            <Inp label="Requisitos previos (uno por línea)" value={(curso.requisitos || []).join("\n")} onChange={v => set({ requisitos: v.split("\n").filter(Boolean) })} placeholder={"Ser docente o estudiante de educación\nTener conexión a internet"} rows={3} />
          </div>
        </div>
      </Card>

      <Card icon={<Settings className="h-4 w-4" />} title="Estado y configuración">
        <div className="grid gap-4 sm:grid-cols-2">
          <Sel className="max-w-xs" label="Estado de publicación" value={curso.estado} onChange={v => set({ estado: v as CursoEstado })} options={[
            { value: "borrador", label: "Borrador" }, { value: "en_revision", label: "En revisión" },
            { value: "publicado", label: "Publicado" }, { value: "archivado", label: "Archivado" },
          ]} />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Precio final</label>
            <input
              type="text"
              inputMode="decimal"
              className={cn(inputCls, "w-32")}
              value={curso.precio === undefined || curso.precio === null ? "" : String(curso.precio)}
              onChange={e => {
                const raw = e.target.value
                const clean = raw.replace(/,/g, ".").replace(/[^0-9.]/g, "")
                const parts = clean.split(".")
                const integer = parts[0].replace(/^0+(?=[1-9])/, "") || "0"
                const decimals = parts[1] ? parts[1].slice(0, 2) : ""
                const normalized = decimals ? `${integer}.${decimals}` : integer
                set({ precio: normalized === "" ? 0 : Number(normalized) })
              }}
              placeholder="0.00"
            />
            <span className="text-[11px] text-muted-foreground/60">Usa 0 para cursos gratis. Si el acceso es de pago, este valor se usa en la compra.</span>
          </div>
        </div>
        {curso.acceso === "pago" && (
          <div className="mt-4 max-w-xs">
            <Inp
              label="Precio anterior (opcional)"
              value={curso.precioOriginal === undefined || curso.precioOriginal === null ? "" : String(curso.precioOriginal)}
              onChange={v => set({ precioOriginal: v.trim() === "" ? 0 : Number(v.replace(/,/g, ".")) || 0 })}
              placeholder="49.99"
            />
          </div>
        )}
        <div className="mt-4">
          <Toggle label="Publicar en pagina principal" sublabel="Si esta activo y el curso esta publicado, aparecera en la portada y en /cursos para los estudiantes." value={curso.publicarEnPaginaPrincipal !== false} onChange={v => set({ publicarEnPaginaPrincipal: v })} />
          <Toggle label="Destacado" sublabel="Aparece en la sección de cursos destacados" value={curso.destacado || false} onChange={v => set({ destacado: v })} />
          <Toggle label="Popular" sublabel="Muestra badge 'Popular' en la tarjeta del curso" value={curso.popular || false} onChange={v => set({ popular: v })} />
          <Toggle label="Nuevo" sublabel="Muestra badge 'Nuevo' en la tarjeta del curso" value={curso.nuevo || false} onChange={v => set({ nuevo: v })} />
          <Toggle label="Incluye certificado" sublabel="El estudiante recibe un certificado al completar el 100%" value={curso.certificado || false} onChange={v => set({ certificado: v })} />
        </div>
      </Card>
    </div>
  )
}

// ─── PANEL: ACCESO Y MATRÍCULA ────────────────────────────────────────────────

function PanelAcceso({ curso, setCurso }: { curso: CursoData; setCurso: (c: CursoData) => void }) {
  const set = (p: Partial<CursoData>) => setCurso({ ...curso, ...p })
  const [showClave, setShowClave] = useState(false)
  return (
    <div className="space-y-5">
      <Card icon={<Key className="h-4 w-4" />} title="Control de acceso" subtitle="Define cómo los estudiantes acceden al curso">
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "libre", icon: <Users className="h-5 w-5" />, label: "Libre", desc: "Cualquiera puede matricularse sin restricciones" },
              { value: "clave", icon: <Key className="h-5 w-5" />, label: "Con clave", desc: "Requiere clave de matrícula para inscribirse" },
              { value: "pago", icon: <Star className="h-5 w-5" />, label: "Pago por curso", desc: "Los estudiantes pagan directamente por acceder a este curso" },
            ].map(opt => (
              <button key={opt.value} type="button" onClick={() => set({ acceso: opt.value as AccesoTipo })}
                className={cn("flex flex-col gap-2 rounded-2xl border p-4 text-left transition-all", curso.acceso === opt.value ? "border-primary bg-primary/8" : "border-border bg-secondary/10 hover:border-primary/40")}>
                <div className="text-primary">{opt.icon}</div>
                <div className="text-sm font-bold text-foreground">{opt.label}</div>
                <div className="text-xs text-muted-foreground leading-snug">{opt.desc}</div>
              </button>
            ))}
          </div>

          {curso.acceso === "clave" && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 space-y-3">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm"><Key className="h-4 w-4" />Configurar clave de matrícula</div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <input
                    type={showClave ? "text" : "password"}
                    className={inputCls}
                    value={curso.clavematricula || ""}
                    onChange={e => set({ clavematricula: e.target.value })}
                    placeholder="Escribe la clave de matrícula..."
                  />
                </div>
                <button type="button" onClick={() => setShowClave(p => !p)} className="px-3 rounded-xl border border-border bg-secondary/20 text-muted-foreground hover:text-foreground transition-colors text-sm">{showClave ? "Ocultar" : "Ver"}</button>
                <button type="button"
                  onClick={() => {
                    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
                    const clave = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("")
                    set({ clavematricula: clave }); setShowClave(true)
                  }}
                  className="px-3 rounded-xl border border-border bg-secondary/20 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  Generar
                </button>
              </div>
              {curso.clavematricula && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  Clave configurada. Los estudiantes la ingresarán al matricularse.
                </div>
              )}
            </div>
          )}

          {curso.acceso === "pago" && (
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 p-4">
              <div className="flex items-center gap-2 text-violet-400 font-semibold text-sm mb-2"><Star className="h-4 w-4" />Pago por curso</div>
              <div className="text-xs text-muted-foreground">Los estudiantes deberán pagar el precio especificado para acceder a este curso.</div>
            </div>
          )}
        </div>
      </Card>

      <Card icon={<Eye className="h-4 w-4" />} title="Visibilidad en dashboard" subtitle="Define si este curso mostrara sus simuladores y evaluaciones en el dashboard">
        <Toggle
          label="Mostrar simuladores"
          sublabel="Activa u oculta la pesta?a y el listado de simuladores del curso para los estudiantes."
          value={curso.mostrarSimuladoresDashboard !== false}
          onChange={v => set({ mostrarSimuladoresDashboard: v })}
        />
        <Toggle
          label="Mostrar evaluaciones"
          sublabel="Activa u oculta la pesta?a y el listado de evaluaciones del curso para los estudiantes."
          value={curso.mostrarEvaluacionesDashboard !== false}
          onChange={v => set({ mostrarEvaluacionesDashboard: v })}
        />
      </Card>

      {/* Estudiantes matriculados */}
      <Card icon={<Users className="h-4 w-4" />} title="Estudiantes matriculados" subtitle="Gestión de matrículas del curso">
        <div className="rounded-xl border border-dashed border-border py-10 text-center">
          <Users className="mx-auto h-8 w-8 text-muted-foreground/25 mb-2" />
          <div className="text-sm text-muted-foreground">Las matrículas de este curso se gestionan en tiempo real.</div>
          <div className="text-xs text-muted-foreground mt-1">Cuando los estudiantes se matriculen, aparecerán aquí.</div>
        </div>
      </Card>
    </div>
  )
}

// ─── PANEL: CONTENIDO ─────────────────────────────────────────────────────────

function PanelContenido({ curso, setCurso }: { curso: CursoData; setCurso: (c: CursoData) => void }) {
  const [expSeccion, setExpSeccion] = useState<string | null>(curso.secciones[0]?.id ?? null)
  const [expRecurso, setExpRecurso] = useState<string | null>(null)

  const [dragSecI, setDragSecI] = useState<number | null>(null)
  const [overSecI, setOverSecI] = useState<number | null>(null)
  const [actividadesVersion, setActividadesVersion] = useState(0)
  const [seccionSimuladorId, setSeccionSimuladorId] = useState("")
  const [seccionEvaluacionId, setSeccionEvaluacionId] = useState("")
  const [simuladorDisponibleId, setSimuladorDisponibleId] = useState("")
  const [evaluacionDisponibleId, setEvaluacionDisponibleId] = useState("")

  const updSecciones = (secciones: SeccionCurso[]) => setCurso({ ...curso, secciones, updatedAt: new Date().toISOString() })
  const addSeccion = () => {
    const sec: SeccionCurso = { id: uidPref("sec"), titulo: "Nueva sección", descripcion: "", orden: curso.secciones.length, recursos: [] }
    updSecciones([...curso.secciones, sec])
    setExpSeccion(sec.id)
  }
  const delSeccion = (id: string) => { updSecciones(curso.secciones.filter(s => s.id !== id)); if (expSeccion === id) setExpSeccion(null) }
  const updSeccion = (id: string, p: Partial<SeccionCurso>) => updSecciones(curso.secciones.map(s => s.id === id ? { ...s, ...p } : s))

  const addRecurso = (secId: string, tipo: RecursoTipo, seccionesBase?: SeccionCurso[]) => {
    const base = seccionesBase ?? curso.secciones
    const sec = base.find(s => s.id === secId)
    const r = crearRecursoBase(tipo, sec?.recursos.length || 0)
    const secciones = base.map(s => s.id === secId ? { ...s, recursos: [...s.recursos, r] } : s)
    updSecciones(secciones)
    setExpRecurso(r.id)
  }

  const delRecurso = (secId: string, recId: string) => {
    updSecciones(curso.secciones.map(s => s.id === secId ? { ...s, recursos: s.recursos.filter(r => r.id !== recId) } : s))
    if (expRecurso === recId) setExpRecurso(null)
  }
  const updRecurso = (secId: string, recId: string, p: Partial<RecursoCurso>) => {
    updSecciones(curso.secciones.map(s => s.id === secId ? { ...s, recursos: s.recursos.map(r => r.id === recId ? { ...r, ...p } : r) } : s))
  }

  const addAdjunto = (secId: string, recId: string, tipo: "documento" | "enlace") => {
    const adj: AdjuntoCurso = { id: uidPref("adj"), titulo: tipo === "documento" ? "Nuevo documento" : "Nuevo enlace", tipo, url: "" }
    updSecciones(curso.secciones.map(s => s.id === secId ? {
      ...s, recursos: s.recursos.map(r => r.id === recId ? { ...r, adjuntos: [...(r.adjuntos || []), adj] } : r)
    } : s))
  }
  const updAdjunto = (secId: string, recId: string, adjId: string, p: Partial<AdjuntoCurso>) => {
    updSecciones(curso.secciones.map(s => s.id === secId ? {
      ...s, recursos: s.recursos.map(r => r.id === recId ? { ...r, adjuntos: (r.adjuntos || []).map(a => a.id === adjId ? { ...a, ...p } : a) } : r)
    } : s))
  }
  const delAdjunto = (secId: string, recId: string, adjId: string) => {
    updSecciones(curso.secciones.map(s => s.id === secId ? {
      ...s, recursos: s.recursos.map(r => r.id === recId ? { ...r, adjuntos: (r.adjuntos || []).filter(a => a.id !== adjId) } : r)
    } : s))
  }

  const [cargandoTituloId, setCargandoTituloId] = useState<string | null>(null)

  const detectarTipoUrl = (url: string): RecursoTipo => {
    const u = url.toLowerCase().trim()
    if (!u) return "enlace"
    if (u.includes("youtube.com") || u.includes("youtu.be") || u.includes("vimeo.com") || u.includes("loom.com") || u.match(/\.(mp4|webm|mov|avi)(\?|$)/)) return "video"
    if (u.includes("drive.google.com") || u.includes("dropbox.com") || u.match(/\.(pdf|doc|docx|ppt|pptx|xls|xlsx)(\?|$)/)) return "documento"
    return "enlace"
  }

  const autoCompletarDesdeUrl = async (secId: string, recId: string, url: string, tituloActual: string) => {
    if (!url.trim()) return
    const tipo = detectarTipoUrl(url)
    const info = resolveCourseResourceUrl(tipo, url)
    const updates: Partial<RecursoCurso> = { tipo, url: info.normalizedUrl || url }

    const esTituloDefault = !tituloActual || Object.values(TITULOS_RECURSO).includes(tituloActual) || tituloActual === "Nueva clase en video" || tituloActual === "Nuevo material de clase" || tituloActual === "Nuevo enlace" || tituloActual === "Nueva clase de texto"

    if (esTituloDefault && (url.includes("youtube.com") || url.includes("youtu.be") || url.includes("vimeo.com"))) {
      setCargandoTituloId(recId)
      try {
        const noembedUrl = `https://noembed.com/embed?url=${encodeURIComponent(url)}`
        const res = await fetch(noembedUrl)
        const data = await res.json()
        if (data.title) updates.titulo = data.title
      } catch { /* silencioso */ }
      setCargandoTituloId(null)
    }

    updRecurso(secId, recId, updates)
  }

  const onDropSec = (ti: number) => {
    if (dragSecI === null || dragSecI === ti) return
    const items = [...curso.secciones]; const [m] = items.splice(dragSecI, 1); items.splice(ti, 0, m)
    updSecciones(items); setDragSecI(null); setOverSecI(null)
  }

  const recursoIcon = (tipo: RecursoTipo) => {
    const t = TIPOS_RECURSO.find(x => x.tipo === tipo)
    return t ? t.icon : <FileText className="h-3.5 w-3.5" />
  }

  const TIPO_COLOR: Record<string, string> = {
    video:      "bg-blue-500/10 text-blue-400",
    documento:  "bg-orange-500/10 text-orange-400",
    enlace:     "bg-cyan-500/10 text-cyan-400",
    texto:      "bg-purple-500/10 text-purple-400",
  }

  const simuladoresStorage = useMemo(
    () => getSimuladoresStorage() as SimuladorBuilder[],
    [actividadesVersion, curso.id, curso.secciones, curso.titulo]
  )
  const linkedActivityIds = useMemo(() => getLinkedActivityIds(curso), [curso])
  const recursosPorActividad = useMemo(() => {
    const map = new Map<string, RecursoCursoExpandido>()
    curso.secciones.forEach((sec) => {
      sec.recursos.forEach((rec) => {
        const actividadId = rec.tipo === "simulador" ? rec.simuladorId : rec.tipo === "evaluacion" ? rec.evaluacionId : ""
        if (!actividadId || map.has(actividadId)) return
        map.set(actividadId, { ...rec, secId: sec.id, secTitulo: sec.titulo })
      })
    })
    return map
  }, [curso.secciones])

  const simuladoresCurso = useMemo(
    () => simuladoresStorage
      .filter((sim) => sim.categoria !== "evaluacion" && ((sim.cursoIds || []).includes(curso.id) || sim.cursoId === curso.id || linkedActivityIds.has(sim.id)))
      .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "es")),
    [curso.id, linkedActivityIds, simuladoresStorage]
  )
  const evaluacionesCurso = useMemo(
    () => simuladoresStorage
      .filter((sim) => sim.categoria === "evaluacion" && (sim.cursoId === curso.id || linkedActivityIds.has(sim.id)))
      .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "es")),
    [curso.id, linkedActivityIds, simuladoresStorage]
  )
  const simuladoresDisponibles = useMemo(
    () => simuladoresStorage
      .filter((sim) => sim.estado !== "archivado" && sim.categoria !== "evaluacion" && (!sim.cursoId || sim.cursoId === curso.id || (sim.cursoIds || []).includes(curso.id)) && !linkedActivityIds.has(sim.id))
      .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "es")),
    [curso.id, linkedActivityIds, simuladoresStorage]
  )
  const evaluacionesDisponibles = useMemo(
    () => simuladoresStorage
      .filter((sim) => sim.estado !== "archivado" && sim.categoria === "evaluacion" && (!sim.cursoId || sim.cursoId === curso.id) && !linkedActivityIds.has(sim.id))
      .sort((a, b) => (a.titulo || "").localeCompare(b.titulo || "", "es")),
    [curso.id, linkedActivityIds, simuladoresStorage]
  )
  const seccionOptions = curso.secciones.map((sec) => ({ value: sec.id, label: sec.titulo || "Seccion sin titulo" }))

  useEffect(() => {
    if (!seccionSimuladorId && curso.secciones[0]?.id) setSeccionSimuladorId(curso.secciones[0].id)
    if (!seccionEvaluacionId && curso.secciones[0]?.id) setSeccionEvaluacionId(curso.secciones[0].id)
  }, [curso.secciones, seccionEvaluacionId, seccionSimuladorId])

  const persistirCurso = (cursoDraft: CursoData) => {
    const actualizado = { ...cursoDraft, updatedAt: new Date().toISOString() }
    const existe = getCursos().find((item) => item.id === actualizado.id)
    if (existe) actualizarCurso(actualizado)
    else guardarCurso(actualizado)
    return actualizado
  }

  const asegurarSeccionActividad = (tipo: "simulador" | "evaluacion") => {
    const secSeleccionada = tipo === "simulador" ? seccionSimuladorId : seccionEvaluacionId
    const existente = curso.secciones.find((sec) => sec.id === secSeleccionada) || curso.secciones[0]
    if (existente) {
      if (tipo === "simulador") setSeccionSimuladorId(existente.id)
      else setSeccionEvaluacionId(existente.id)
      return { secId: existente.id, secciones: curso.secciones }
    }

    const nuevaSeccion: SeccionCurso = {
      id: uidPref("sec"),
      titulo: tipo === "simulador" ? "Simuladores" : "Evaluaciones",
      descripcion: "",
      orden: curso.secciones.length,
      recursos: [],
    }
    const secciones = [...curso.secciones, nuevaSeccion]
    updSecciones(secciones)
    setExpSeccion(nuevaSeccion.id)
    if (tipo === "simulador") setSeccionSimuladorId(nuevaSeccion.id)
    else setSeccionEvaluacionId(nuevaSeccion.id)
    return { secId: nuevaSeccion.id, secciones }
  }

  const vincularActividadAlCurso = (tipo: "simulador" | "evaluacion", actividadId: string) => {
    const actividad = simuladoresStorage.find((sim) => sim.id === actividadId)
    if (!actividad) return

    const { secId, secciones } = asegurarSeccionActividad(tipo)
    if (secciones.some((sec) => sec.recursos.some((rec) => tipo === "simulador" ? rec.simuladorId === actividad.id : rec.evaluacionId === actividad.id))) {
      setExpSeccion(secId)
      return
    }

    const seccionesActualizadas = secciones.map((sec) => {
      if (sec.id !== secId) return sec
      const recurso = crearRecursoBase(tipo, sec.recursos.length)
      return {
        ...sec,
        recursos: [
          ...sec.recursos,
          {
            ...recurso,
            titulo: actividad.titulo || TITULOS_RECURSO[tipo],
            descripcion: actividad.descripcion || "",
            simuladorId: tipo === "simulador" ? actividad.id : "",
            evaluacionId: tipo === "evaluacion" ? actividad.id : "",
          },
        ],
      }
    })

    updSecciones(seccionesActualizadas)
    actualizarSimuladorStorage(getActividadCourseLink(tipo, curso, actividad) as any)
    setActividadesVersion((value) => value + 1)
    if (tipo === "simulador") setSimuladorDisponibleId("")
    else setEvaluacionDisponibleId("")
  }

  const quitarActividadDelCurso = (tipo: "simulador" | "evaluacion", actividadId: string) => {
    const seccionesActualizadas = curso.secciones.map((sec) => ({
      ...sec,
      recursos: sec.recursos.filter((rec) => tipo === "simulador" ? rec.simuladorId !== actividadId : rec.evaluacionId !== actividadId),
    }))
    updSecciones(seccionesActualizadas)

    const sigueVinculada = seccionesActualizadas.some((sec) =>
      sec.recursos.some((rec) => tipo === "simulador" ? rec.simuladorId === actividadId : rec.evaluacionId === actividadId)
    )
    if (sigueVinculada) return

    const actividad = simuladoresStorage.find((sim) => sim.id === actividadId)
    const linkedIds = Array.from(new Set([...(actividad.cursoIds || []), actividad.cursoId || ""])).filter(Boolean)
    if (!actividad || !linkedIds.includes(curso.id)) return

    actualizarSimuladorStorage({
      ...actividad,
      cursoIds: linkedIds.filter((id) => id !== curso.id),
      cursoTitulos: (actividad.cursoTitulos || []).filter((_, index) => linkedIds[index] !== curso.id),
      cursoId: linkedIds.filter((id) => id !== curso.id)[0],
      cursoTitulo: (actividad.cursoTitulos || []).filter((_, index) => linkedIds[index] !== curso.id)[0],
      updatedAt: new Date().toISOString(),
    } as any)
    setActividadesVersion((value) => value + 1)
  }

  const editarActividad = (actividadId: string) => {
    window.location.href = `/admin/simuladores?simId=${encodeURIComponent(actividadId)}&from=curso&tab=general`
  }

  const eliminarActividad = (tipo: "simulador" | "evaluacion", actividadId: string) => {
    const seccionesActualizadas = curso.secciones.map((sec) => ({
      ...sec,
      recursos: sec.recursos.filter((rec) => tipo === "simulador" ? rec.simuladorId !== actividadId : rec.evaluacionId !== actividadId),
    }))
    updSecciones(seccionesActualizadas)
    eliminarSimuladorStorage(actividadId)
    setActividadesVersion((v) => v + 1)
  }

  const crearYEditarActividad = (tipo: "simulador" | "evaluacion") => {
    const { secId, secciones } = asegurarSeccionActividad(tipo)
    const actividadId = uidPref("sim")
    const actividadBase = crearSimuladorBase()
    const actividad = getActividadCourseLink(tipo, curso, {
      ...actividadBase,
      id: actividadId,
      titulo: tipo === "simulador"
        ? `Simulador ${curso.titulo || "del curso"}`
        : `Evaluacion ${curso.titulo || "del curso"}`,
      descripcion: tipo === "simulador"
        ? "Simulador vinculado a este curso."
        : "Evaluacion vinculada a este curso.",
      categoria: tipo === "evaluacion" ? "evaluacion" : (curso.categoria || "otros"),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as SimuladorBuilder)

    const seccionesActualizadas = secciones.map((sec) => {
      if (sec.id !== secId) return sec
      const recurso = crearRecursoBase(tipo, sec.recursos.length)
      return {
        ...sec,
        recursos: [
          ...sec.recursos,
          {
            ...recurso,
            titulo: actividad.titulo,
            descripcion: actividad.descripcion,
            simuladorId: tipo === "simulador" ? actividad.id : "",
            evaluacionId: tipo === "evaluacion" ? actividad.id : "",
          },
        ],
      }
    })

    const siguienteCurso = persistirCurso({ ...curso, secciones: seccionesActualizadas })
    setCurso(siguienteCurso)
    guardarSimuladorStorage(actividad as any)
    setActividadesVersion((value) => value + 1)
    window.location.href = `/admin/simuladores?simId=${encodeURIComponent(actividad.id)}&from=curso&tab=general`
  }

  const mostrarSims = curso.mostrarSimuladoresDashboard !== false
  const mostrarEvals = curso.mostrarEvaluacionesDashboard !== false

  return (
    <div className="space-y-4">
      <div className="grid gap-4 xl:grid-cols-2">
        <Card
          icon={<Target className="h-4 w-4" />}
          title="Simuladores del curso"
          subtitle={`${simuladoresCurso.length} vinculados · ${mostrarSims ? "visible en dashboard" : "oculto en dashboard"}`}
          action={
            <div className="flex items-center gap-2">
              <Btn size="sm" variant={mostrarSims ? "ghost" : "ghost"}
                onClick={() => setCurso({ ...curso, mostrarSimuladoresDashboard: !mostrarSims, updatedAt: new Date().toISOString() })}
                className={mostrarSims ? "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" : "text-muted-foreground"}>
                {mostrarSims ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {mostrarSims ? "Visible" : "Oculto"}
              </Btn>
              <Btn size="sm" variant="primary" onClick={() => { window.location.href = `/admin/simuladores?cursoId=${encodeURIComponent(curso.id)}` }}><Plus className="h-3.5 w-3.5" />Ir a simuladores</Btn>
            </div>
          }
        >
          <div className="space-y-2">
            {simuladoresCurso.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                Este curso todavía no tiene simuladores vinculados. Créalo o asígnalo desde el módulo independiente de simuladores.
              </div>
            ) : (
              simuladoresCurso.map((sim) => (
                <div key={sim.id} className="rounded-xl border border-border bg-secondary/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">{sim.titulo || "Simulador sin titulo"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className={cn("capitalize", sim.estado === "publicado" ? "text-emerald-400" : "")}>{sim.estado}</span>
                        <span>{sim.preguntas.length} preguntas</span>
                        {sim.categoria && <span>{sim.categoria}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Btn size="sm" variant="ghost" onClick={() => editarActividad(sim.id)}><Pencil className="h-3.5 w-3.5" />Editar</Btn>
                      <Btn size="sm" variant="danger" onClick={() => eliminarActividad("simulador", sim.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>

        <Card
          icon={<Award className="h-4 w-4" />}
          title="Evaluaciones del curso"
          subtitle={`${evaluacionesCurso.length} vinculadas · ${mostrarEvals ? "visible en dashboard" : "oculto en dashboard"}`}
          action={
            <div className="flex items-center gap-2">
              <Btn size="sm" variant="ghost"
                onClick={() => setCurso({ ...curso, mostrarEvaluacionesDashboard: !mostrarEvals, updatedAt: new Date().toISOString() })}
                className={mostrarEvals ? "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10" : "text-muted-foreground"}>
                {mostrarEvals ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                {mostrarEvals ? "Visible" : "Oculto"}
              </Btn>
              <Btn size="sm" variant="primary" onClick={() => crearYEditarActividad("evaluacion")}><Plus className="h-3.5 w-3.5" />Nueva evaluacion</Btn>
            </div>
          }
        >
          <div className="space-y-2">
            {evaluacionesCurso.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                Aún no hay evaluaciones en este curso. Crea la primera con el botón de arriba.
              </div>
            ) : (
              evaluacionesCurso.map((sim) => (
                <div key={sim.id} className="rounded-xl border border-border bg-secondary/10 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold text-foreground">{sim.titulo || "Evaluacion sin titulo"}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
                        <span className={cn("capitalize", sim.estado === "publicado" ? "text-emerald-400" : "")}>{sim.estado}</span>
                        <span>{sim.preguntas.length} preguntas</span>
                        {sim.categoria && <span>{sim.categoria}</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Btn size="sm" variant="ghost" onClick={() => editarActividad(sim.id)}><Pencil className="h-3.5 w-3.5" />Editar</Btn>
                      <Btn size="sm" variant="danger" onClick={() => eliminarActividad("evaluacion", sim.id)}><Trash2 className="h-3.5 w-3.5" /></Btn>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card icon={<Layers className="h-4 w-4" />} title="Estructura del curso"
        subtitle={`${curso.secciones.length} secciones — ${totalLecciones(curso)} lecciones — ${Math.floor(totalMinutos(curso) / 60)}h`}
        action={<Btn size="sm" variant="primary" onClick={addSeccion}><Plus className="h-3.5 w-3.5" />Agregar sección</Btn>}>

        {curso.secciones.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border py-14 text-center">
            <div className="flex justify-center mb-2"><Folder className="h-10 w-10 text-muted-foreground" /></div>
            <div className="text-xs text-muted-foreground mb-4">El curso aún no tiene secciones. Agrega la primera para organizar el contenido.</div>
            <Btn size="sm" onClick={addSeccion}><Plus className="h-3.5 w-3.5" />Primera sección</Btn>
          </div>
        ) : (
          <div className="space-y-3">
            {curso.secciones.map((sec, si) => {
              const isExpSec = expSeccion === sec.id
              return (
                <div key={sec.id}
                  draggable onDragStart={() => setDragSecI(si)} onDragOver={e => { e.preventDefault(); setOverSecI(si) }} onDrop={() => onDropSec(si)} onDragEnd={() => { setDragSecI(null); setOverSecI(null) }}
                  className={cn("rounded-2xl border overflow-hidden transition-all", overSecI === si && dragSecI !== si ? "border-primary/60 bg-primary/5" : "border-border bg-card")}>

                  {/* Header sección */}
                  <div className="flex items-center gap-3 px-4 py-3.5 bg-secondary/8">
                    <GripVertical className="h-4 w-4 text-muted-foreground/30 cursor-grab shrink-0" />
                    <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-primary/15 text-xs font-bold text-primary shrink-0">{si + 1}</div>
                    <div className="flex-1 min-w-0">
                      {isExpSec ? (
                        <input className="w-full bg-transparent text-sm font-semibold text-foreground focus:outline-none border-b border-primary/50 pb-0.5" value={sec.titulo} onChange={e => updSeccion(sec.id, { titulo: e.target.value })} />
                      ) : (
                        <button type="button" className="text-sm font-semibold text-foreground hover:text-primary transition-colors text-left w-full truncate" onClick={() => setExpSeccion(sec.id)}>{sec.titulo}</button>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{sec.recursos.length} lección{sec.recursos.length !== 1 ? "es" : ""}</span>
                    <Btn size="sm" variant="ghost" onClick={() => setExpSeccion(isExpSec ? null : sec.id)} className="h-7 w-7 p-0">{isExpSec ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}</Btn>
                    <Btn size="sm" variant="danger" onClick={() => delSeccion(sec.id)} className="h-7 w-7 p-0"><Trash2 className="h-3 w-3" /></Btn>
                  </div>

                  {/* Contenido de la sección */}
                  {isExpSec && (
                    <div className="border-t border-border/50 px-4 pb-5 pt-4 space-y-4">
                      <Inp label="Descripción de la sección" value={sec.descripcion || ""} onChange={v => updSeccion(sec.id, { descripcion: v })} placeholder="Describe brevemente qué aprenderá el estudiante en esta sección..." rows={2} />

                      {/* Lista de lecciones */}
                      <div className="space-y-2">
                        {sec.recursos.length === 0 && (
                          <div className="rounded-xl border border-dashed border-border/50 py-8 text-center text-xs text-muted-foreground">
                            Esta sección aún no tiene lecciones. Agrega la primera abajo.
                          </div>
                        )}
                        {sec.recursos.map((rec) => {
                          const isExpRec = expRecurso === rec.id
                          const linkInfo = (rec.tipo === "video" || rec.tipo === "enlace" || rec.tipo === "documento")
                            ? resolveCourseResourceUrl(rec.tipo, rec.url)
                            : null
                          return (
                            <div key={rec.id} className={cn("rounded-xl border overflow-hidden transition-all", isExpRec ? "border-primary/40 bg-card" : "border-border/60 bg-card/50")}>
                              {/* Header lección */}
                              <div className="flex items-center gap-3 px-3.5 py-3">
                                <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-xl", TIPO_COLOR[rec.tipo])}>
                                  {recursoIcon(rec.tipo)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="text-sm font-semibold text-foreground line-clamp-1">{rec.titulo || TITULOS_RECURSO[rec.tipo]}</div>
                                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-[10px] text-muted-foreground capitalize">{rec.tipo}</span>
                                    {rec.duracionMinutos ? <span className="text-[10px] text-muted-foreground">{rec.duracionMinutos}min</span> : null}
                                    {rec.gratis && <span className="text-[10px] font-bold text-emerald-400">GRATIS</span>}
                                    {(rec.adjuntos?.length || 0) > 0 && (
                                      <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground/60">
                                        <Paperclip className="h-2.5 w-2.5" />{rec.adjuntos!.length} adjunto{rec.adjuntos!.length > 1 ? "s" : ""}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Btn size="sm" variant="ghost" onClick={() => setExpRecurso(isExpRec ? null : rec.id)} className="h-7 px-2.5 gap-1 text-[11px]">
                                    {isExpRec ? <><ChevronUp className="h-3 w-3" />Cerrar</> : <><Pencil className="h-2.5 w-2.5" />Editar</>}
                                  </Btn>
                                  <Btn size="sm" variant="danger" onClick={() => delRecurso(sec.id, rec.id)} className="h-7 w-7 p-0"><X className="h-2.5 w-2.5" /></Btn>
                                </div>
                              </div>

                              {/* Editor de la lección */}
                              {isExpRec && (
                                <div className="border-t border-border/50 bg-secondary/5 px-4 pb-5 pt-4 space-y-4">
                                  {/* Título */}
                                  <div className="relative">
                                    <Inp label="Título de la lección" value={rec.titulo} onChange={v => updRecurso(sec.id, rec.id, { titulo: v })} placeholder="Ej: Clase 1 — Introducción" />
                                    {cargandoTituloId === rec.id && (
                                      <div className="absolute right-3 top-8 flex items-center gap-1.5 text-[11px] text-primary">
                                        <Loader2 className="h-3 w-3 animate-spin" />Obteniendo título...
                                      </div>
                                    )}
                                  </div>

                                  {/* Smart URL / Contenido principal */}
                                  {rec.tipo !== "texto" ? (
                                    <div className="space-y-2">
                                      <div className="space-y-1.5">
                                        <div className="flex items-center justify-between">
                                          <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                            Pegar enlace del video o recurso
                                          </label>
                                          {rec.tipo && (
                                            <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                              rec.tipo === "video" ? "bg-blue-500/10 text-blue-400" :
                                              rec.tipo === "documento" ? "bg-orange-500/10 text-orange-400" :
                                              "bg-cyan-500/10 text-cyan-400")}>
                                              {recursoIcon(rec.tipo)}{rec.tipo}
                                            </span>
                                          )}
                                        </div>
                                        <input
                                          className="w-full rounded-xl border border-border bg-secondary/10 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                                          value={rec.url || ""}
                                          placeholder="YouTube, Vimeo, Drive, PDF, https://..."
                                          onChange={e => {
                                            const url = e.target.value
                                            updRecurso(sec.id, rec.id, { url })
                                            if (url.trim()) {
                                              const tipo = detectarTipoUrl(url)
                                              if (tipo !== rec.tipo) updRecurso(sec.id, rec.id, { url, tipo })
                                            }
                                          }}
                                          onBlur={e => autoCompletarDesdeUrl(sec.id, rec.id, e.target.value, rec.titulo)}
                                          onPaste={e => {
                                            const url = e.clipboardData.getData("text")
                                            if (url.trim()) setTimeout(() => autoCompletarDesdeUrl(sec.id, rec.id, url, rec.titulo), 50)
                                          }}
                                        />
                                      </div>
                                      {rec.tipo === "documento" && (
                                        <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border bg-secondary/10 px-3 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-secondary/20 transition-all">
                                          <Upload className="h-3.5 w-3.5" />Subir archivo (.pdf, .doc, .ppt)
                                          <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                            onChange={e => {
                                              const file = e.target.files?.[0]; if (!file) return
                                              const reader = new FileReader()
                                              reader.onload = () => updRecurso(sec.id, rec.id, { url: typeof reader.result === "string" ? reader.result : "", archivoNombre: file.name, titulo: rec.titulo || file.name, tipo: "documento" })
                                              reader.readAsDataURL(file); e.currentTarget.value = ""
                                            }} />
                                        </label>
                                      )}
                                      {rec.archivoNombre && <div className="text-[11px] text-emerald-400">📎 {rec.archivoNombre}</div>}
                                      {linkInfo && (
                                        <div className={cn("flex items-center gap-2 rounded-xl border px-3 py-2 text-[11px]", linkInfo.valid ? "border-emerald-500/20 bg-emerald-500/5 text-emerald-300" : "border-red-500/20 bg-red-500/5 text-red-300")}>
                                          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                          <span className="flex-1">{linkInfo.valid ? `Listo para publicar${linkInfo.provider ? ` · ${linkInfo.provider}` : ""}` : linkInfo.message}</span>
                                          {linkInfo.valid && linkInfo.openUrl && (
                                            <a href={linkInfo.openUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] text-foreground hover:bg-card">
                                              <Eye className="h-3 w-3" />Probar
                                            </a>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <Inp label="Contenido de la lección" value={rec.url || ""} onChange={v => updRecurso(sec.id, rec.id, { url: v })} placeholder="Escribe el contenido completo de la lección..." rows={6} />
                                  )}
                                  {/* Descripción + Gratis */}
                                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_200px] gap-4 items-end">
                                    <Inp label="Descripción (opcional)" value={rec.descripcion || ""} onChange={v => updRecurso(sec.id, rec.id, { descripcion: v })} placeholder="Descripción breve de esta lección..." />
                                    <Toggle label="Vista previa gratuita" sublabel="Visible sin matrícula (demo)" value={rec.gratis} onChange={v => updRecurso(sec.id, rec.id, { gratis: v })} />
                                  </div>

                                  {/* ── Materiales adjuntos ── */}
                                  <div className="rounded-xl border border-border/60 bg-secondary/5 overflow-hidden">
                                    <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-secondary/10">
                                      <div className="flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-semibold text-foreground">Materiales adjuntos</span>
                                        {(rec.adjuntos?.length || 0) > 0 && <span className="text-xs text-muted-foreground bg-secondary/50 px-1.5 py-0.5 rounded-full">{rec.adjuntos?.length}</span>}
                                        <span className="text-xs text-muted-foreground hidden sm:block">· PDFs, documentos y enlaces de apoyo para esta lección</span>
                                      </div>
                                      <div className="flex items-center gap-2 shrink-0">
                                        <Btn size="sm" variant="ghost" onClick={() => addAdjunto(sec.id, rec.id, "documento")}>
                                          <FileText className="h-3.5 w-3.5" />PDF / Doc
                                        </Btn>
                                        <Btn size="sm" variant="ghost" onClick={() => addAdjunto(sec.id, rec.id, "enlace")}>
                                          <Link2 className="h-3.5 w-3.5" />Enlace
                                        </Btn>
                                      </div>
                                    </div>
                                    <div className="p-3 space-y-2">
                                      {(rec.adjuntos?.length || 0) === 0 && (
                                        <div className="text-xs text-muted-foreground/60 text-center py-3">
                                          Agrega PDFs, documentos o enlaces de apoyo para esta lección
                                        </div>
                                      )}
                                      {(rec.adjuntos || []).map(adj => (
                                        <div key={adj.id} className="flex items-center gap-2 rounded-xl border border-border/60 bg-card px-3 py-2.5">
                                          <div className={cn("h-7 w-7 shrink-0 flex items-center justify-center rounded-lg", adj.tipo === "documento" ? "bg-orange-500/10 text-orange-400" : "bg-cyan-500/10 text-cyan-400")}>
                                            {adj.tipo === "documento" ? <FileText className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
                                          </div>
                                          <input className="w-32 sm:w-40 shrink-0 bg-transparent text-xs font-medium text-foreground focus:outline-none border-r border-border/40 pr-2" value={adj.titulo} onChange={e => updAdjunto(sec.id, rec.id, adj.id, { titulo: e.target.value })} placeholder="Título..." />
                                          <input className="flex-1 min-w-0 bg-transparent text-xs text-muted-foreground focus:outline-none" value={adj.url} onChange={e => updAdjunto(sec.id, rec.id, adj.id, { url: e.target.value })} placeholder="https://... o sube archivo" />
                                          {adj.tipo === "documento" && (
                                            <label className="shrink-0 cursor-pointer h-7 w-7 flex items-center justify-center rounded-lg border border-border/60 text-muted-foreground hover:text-primary hover:border-primary/40 transition-colors" title="Subir archivo">
                                              <Upload className="h-3.5 w-3.5" />
                                              <input type="file" className="hidden" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx"
                                                onChange={e => {
                                                  const file = e.target.files?.[0]; if (!file) return
                                                  const reader = new FileReader()
                                                  reader.onload = () => updAdjunto(sec.id, rec.id, adj.id, { url: typeof reader.result === "string" ? reader.result : "", titulo: adj.titulo || file.name })
                                                  reader.readAsDataURL(file); e.currentTarget.value = ""
                                                }} />
                                            </label>
                                          )}
                                          <button type="button" onClick={() => delAdjunto(sec.id, rec.id, adj.id)} className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground/40 hover:text-red-400 hover:bg-red-400/10 transition-colors">
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>

                      {/* Agregar clase */}
                      <button type="button" onClick={() => addRecurso(sec.id, "video")}
                        className="flex items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/8 hover:border-primary/60 transition-all w-full justify-center">
                        <Plus className="h-4 w-4" />Agregar clase
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>

    </div>
  )
}
function PanelPreviewCurso({ curso }: { curso: CursoData }) {
  const lec = totalLecciones(curso)
  const min = totalMinutos(curso)
  const h = Math.floor(min / 60)
  return (
    <div className="space-y-5">
      <Card icon={<Eye className="h-4 w-4" />} title="Vista previa del curso" subtitle="Así se alinea con el diseño del catálogo y del admin">
        <AdminCursoVisualPreview curso={curso} />
      </Card>

      {/* Estructura */}
      <Card icon={<Layers className="h-4 w-4" />} title="Estructura del contenido">
        {curso.secciones.length === 0 ? (
          <div className="text-center py-8 text-xs text-muted-foreground">Sin contenido aún. Agrega secciones en la pestaña "Contenido".</div>
        ) : (
          <div className="space-y-3">
            {curso.secciones.map((sec, i) => (
              <div key={sec.id} className="rounded-xl border border-border p-3">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold text-primary">Sección {i + 1}</span>
                  <span className="text-sm font-semibold text-foreground">{sec.titulo}</span>
                  <span className="ml-auto text-xs text-muted-foreground">{sec.recursos.length} recursos</span>
                </div>
                <div className="space-y-1.5">
                  {sec.recursos.map(r => (
                    <div key={r.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className={cn("flex h-5 w-5 items-center justify-center rounded",
                        r.tipo === "simulador" ? "text-primary" : r.tipo === "evaluacion" ? "text-amber-400" : r.tipo === "video" ? "text-blue-400" : "text-muted-foreground")}>
                        {TIPOS_RECURSO.find(t => t.tipo === r.tipo)?.icon}
                      </span>
                      <span>{r.titulo || "Sin título"}</span>
                      {r.duracionMinutos && <span className="ml-auto">{r.duracionMinutos}min</span>}
                      {r.gratis && <Check className="h-4 w-4 text-emerald-400" />}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Ficha */}
      <Card icon={<Settings className="h-4 w-4" />} title="Ficha técnica">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {[
            ["ID", curso.id.substring(0, 16)], ["Estado", curso.estado], ["Acceso", curso.acceso],
            ["Secciones", curso.secciones.length], ["Lecciones", lec], ["Duración", `${h}h ${min % 60}min`],
            ["Instructor", curso.instructor || "—"], ["Nivel", curso.nivel], ["Precio", esCursoDePago(curso) ? `$${(curso.precio || 0).toFixed(2)}` : "Gratis"],
          ].map(([k, v]) => (
            <div key={k as string} className="rounded-xl border border-border bg-secondary/8 px-3 py-2.5">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">{k}</div>
              <div className="text-xs font-bold text-foreground font-mono truncate">{String(v)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

// ════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL — ADMIN CURSOS
// ════════════════════════════════════════════════════════════

export default function AdminCursosPage() {
  const [tab, setTab] = useState<TabCurso | "lista">("lista")
  const [cursos, setCursosState] = useState<CursoData[]>([])
  const [curso, setCurso] = useState<CursoData | null>(null)
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [publishIssues, setPublishIssues] = useState<CursoPublishIssue[]>([])
  const [confirmDel, setConfirmDel] = useState<string | null>(null)

  useEffect(() => { setCursosState(getCursos()) }, [])
  useEffect(() => {
    setCategorias(getCategorias())
    const handleUpdate = () => setCategorias(getCategorias())
    window.addEventListener("he-categorias-updated", handleUpdate)
    return () => window.removeEventListener("he-categorias-updated", handleUpdate)
  }, [])
  const refresh = useCallback(() => setCursosState(getCursos()), [])
  useEffect(() => { setPublishIssues([]) }, [curso])

  const handleNuevo = () => { setCurso(crearCursoBase()); setTab("info") }
  const handleEditar = (c: CursoData) => { setCurso({ ...c }); setTab("info") }

  const handleGuardar = async () => {
    if (!curso) return; setSaving(true)
    await new Promise(r => setTimeout(r, 200))
    const upd = { ...curso, updatedAt: new Date().toISOString() }
    const existe = getCursos().find(c => c.id === upd.id)
    if (existe) actualizarCurso(upd); else guardarCurso(upd)
    setPublishIssues([])
    setCurso(upd); refresh(); setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handlePublicar = () => {
    if (!curso) return
    const issues = validarCursoParaPublicacion(curso)
    if (issues.length > 0) {
      setPublishIssues(issues)
      setTab(issues[0].tab)
      return
    }
    const pub = { ...curso, estado: "publicado" as CursoEstado, updatedAt: new Date().toISOString() }
    const existe = getCursos().find(c => c.id === pub.id)
    if (existe) actualizarCurso(pub); else guardarCurso(pub)
    setPublishIssues([])
    setCurso(pub); refresh(); setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const handleDuplicar = (cursoBase: CursoData) => {
    const copia = duplicarCursoConActividades(cursoBase)
    guardarCurso(copia)
    refresh()
  }

  const handleDel = (id: string) => {
    eliminarActividadesDeCurso(id)
    eliminarCurso(id); refresh()
    if (curso?.id === id) { setCurso(null); setTab("lista") }
    setConfirmDel(null)
  }

  const badge = curso ? estadoBadge(curso.estado) : null
  const editorActivo = tab !== "lista" && !!curso

  const TABS = [
    { id: "lista" as const, label: "Cursos", icon: <LayoutGrid className="h-3.5 w-3.5" /> },
    { id: "info" as const, label: "Información", icon: <BookOpen className="h-3.5 w-3.5" />, req: true },
    { id: "contenido" as const, label: "Contenido", icon: <Layers className="h-3.5 w-3.5" />, req: true },
    { id: "acceso" as const, label: "Acceso", icon: <Key className="h-3.5 w-3.5" />, req: true },
    { id: "anuncios" as const, label: "Anuncios", icon: <Megaphone className="h-3.5 w-3.5" />, req: true },
  ]

  return (
    <div className="space-y-0 -m-6 lg:-m-8">
      {/* Top bar */}
      <div className="sticky top-0 z-20 border-b border-border bg-card/85 backdrop-blur-md px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 py-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-primary mb-0.5">Admin · Cursos</div>
            <div className="text-lg font-bold text-foreground">Gestión de Cursos</div>
          </div>
          <div className="flex items-center gap-2">
            {saved && <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400"><Check className="h-3 w-3" />Guardado</div>}
            {editorActivo ? (
              <>
                <Btn onClick={handleGuardar} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}Guardar</Btn>
                <Btn variant="primary" onClick={handlePublicar}><Zap className="h-4 w-4" />Publicar</Btn>
              </>
            ) : null}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center overflow-x-auto scrollbar-hide">
          {TABS.map(t => {
            const disabled = Boolean((t as any).req && !editorActivo)
            const active = tab === t.id
            return (
              <button key={t.id} type="button" disabled={disabled} onClick={() => {
                if (disabled) return
                if (t.id === "lista") {
                  setTab("lista")
                  return
                }
                setTab(t.id)
              }}
                className={cn("flex items-center gap-1.5 whitespace-nowrap px-4 py-2.5 text-xs font-semibold border-b-2 transition-all",
                  active ? "border-primary text-primary bg-primary/5" : disabled ? "border-transparent text-muted-foreground/25 cursor-not-allowed" : "border-transparent text-muted-foreground hover:text-foreground hover:bg-secondary/15")}>
                {t.icon}{t.label}
              </button>
            )
          })}
          {editorActivo && <button type="button" onClick={() => { setCurso(null); setTab("lista"); refresh() }} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-xs text-muted-foreground hover:text-foreground transition-colors"><X className="h-3.5 w-3.5" />Cerrar</button>}
        </div>
      </div>

      {/* Banner edición */}
      {editorActivo && curso && badge && (
        <div className="flex items-center gap-3 border-b border-border bg-secondary/8 px-6 py-2.5">
          <span className={cn("h-2 w-2 rounded-full", badge.dot)} />
          <span className="text-xs text-muted-foreground">Editando: <span className="font-semibold text-foreground">{curso.titulo || "Sin título"}</span></span>
          <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-bold", badge.cls)}>{badge.label}</span>
          {curso.acceso === "clave" && curso.clavematricula && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-400"><Key className="h-3 w-3" />Clave: <code className="font-mono">{curso.clavematricula}</code></span>
          )}
          <span className="ml-auto text-[10px] text-muted-foreground/30 font-mono hidden lg:block">{curso.id}</span>
        </div>
      )}

      {editorActivo && publishIssues.length > 0 && (
        <div className="border-b border-red-500/15 bg-red-500/5 px-6 py-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-500/10">
              <AlertCircle className="h-4 w-4 text-red-300" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-semibold text-red-200">No se pudo publicar el curso</div>
              <div className="mt-1 space-y-1 text-xs text-red-200/90">
                {publishIssues.slice(0, 4).map((issue, index) => (
                  <div key={`${issue.message}-${index}`}>- {issue.message}</div>
                ))}
                {publishIssues.length > 4 && (
                  <div>- Hay {publishIssues.length - 4} validaciones adicionales por corregir.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="px-6 lg:px-8 py-6">
        {tab === "lista"    && <PanelListaCursos cursos={cursos} categorias={categorias} onEditar={handleEditar} onEliminar={id => setConfirmDel(id)} onNuevo={handleNuevo} onDuplicar={handleDuplicar} />}
        {tab === "info"     && curso && <PanelInfoCurso curso={curso} setCurso={setCurso} />}
        {tab === "contenido" && curso && <PanelContenido curso={curso} setCurso={setCurso} />}
        {tab === "acceso"   && curso && <PanelAcceso curso={curso} setCurso={setCurso} />}
        {tab === "anuncios" && curso && <PanelAnuncios cursoId={curso.id} />}
      </div>

      {/* Modal eliminar */}
      {confirmDel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10"><Trash2 className="h-5 w-5 text-red-400" /></div>
              <div><div className="text-sm font-bold text-foreground">Eliminar curso</div><div className="text-xs text-muted-foreground">Esta acción es irreversible</div></div>
            </div>
            <div className="text-sm text-muted-foreground mb-5">¿Confirmas que deseas eliminar este curso y todo su contenido?</div>
            <div className="flex gap-3">
              <Btn onClick={() => setConfirmDel(null)} className="flex-1">Cancelar</Btn>
              <Btn variant="danger" onClick={() => handleDel(confirmDel)} className="flex-1">Eliminar</Btn>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function PanelAnuncios({ cursoId }: { cursoId: string }) {
  const [items, setItems] = useState<Announcement[]>([])
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")

  useEffect(() => {
    const sync = () => setItems(getAnnouncementsForCourse(cursoId))
    sync()
    if (typeof window === "undefined") return
    window.addEventListener(COURSE_FEEDBACK_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(COURSE_FEEDBACK_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [cursoId])

  const submit = () => {
    if (!title.trim() || !body.trim()) return
    postAnnouncement({
      courseId: cursoId,
      authorName: "Equipo Hack Evans",
      title: title.trim(),
      body: body.trim(),
    })
    setTitle("")
    setBody("")
  }

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black text-foreground">Publicar anuncio para los estudiantes de este curso</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Los anuncios aparecen en la pestaña "Anuncios" del curso para los matriculados, en el dropdown de la campana de notificaciones del usuario y disparan eventos en tiempo real.
        </p>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Título del anuncio"
          className="mb-2 h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
        />
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={4}
          placeholder="Mensaje del anuncio..."
          className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
        <button
          onClick={submit}
          disabled={!title.trim() || !body.trim()}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
        >
          <Send className="h-3.5 w-3.5" />
          Publicar anuncio
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Anuncios publicados ({items.length})
        </p>
        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center text-xs text-muted-foreground">
            Aún no has publicado anuncios para este curso.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((a) => (
              <div key={a.id} className="flex items-start justify-between gap-3 rounded-xl border border-border bg-secondary/15 p-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-primary">
                    {a.authorName} · {new Date(a.createdAt).toLocaleString("es-EC")}
                  </p>
                  <p className="mt-1 text-sm font-black text-foreground">{a.title}</p>
                  <p className="mt-1 whitespace-pre-line text-xs text-muted-foreground">{a.body}</p>
                </div>
                <button
                  onClick={() => deleteAnnouncement(a.id)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
