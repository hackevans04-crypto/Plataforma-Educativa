"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, ClipboardCheck, Clock, Play, Search, Star, Target, Zap } from "lucide-react"
import { cn } from "@/lib/utils"
import { isCourseActivityVisibleInDashboard } from "@/lib/course-dashboard-visibility"
import type { SimuladorBuilder } from "@/simuladores/types"
import { getResultadosPorSimulador, getSimuladores } from "@/simuladores/storage"
import { trackEntityClick, trackSearchTerm } from "@/lib/discovery-popularity"

type SimuladorCard = {
  id: string
  title: string
  categoryId: string
  categoryLabel: string
  courseId?: string
  courseTitle?: string
  description: string
  questions: number
  time: string
  difficulty: string
  rating: number | null
  completions: number
  progress: number
  isNew: boolean
  isPro: boolean
  gradient: string
}

const CATEGORY_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  { label: "QSM", keywords: ["qsm", "quiero ser maestro"] },
  { label: "Ser Maestro", keywords: ["ser maestro", "desempeno"] },
  { label: "Saberes", keywords: ["saberes", "pedagogico", "didactica"] },
  { label: "Razonamiento", keywords: ["razonamiento", "logico", "numerico", "verbal"] },
]

const SIMULATOR_GRADIENTS = [
  "from-[#ff5a3d] via-[#ff7b47] to-[#facc15]",
  "from-[#2563eb] via-[#3b82f6] to-[#38bdf8]",
  "from-[#7c3aed] via-[#a855f7] to-[#f472b6]",
  "from-[#0f9b8e] via-[#20c997] to-[#7be495]",
]

const inferCategoryLabel = (sim: SimuladorBuilder) => {
  const text = `${sim.titulo} ${sim.descripcion}`.toLowerCase()
  const match = CATEGORY_KEYWORDS.find((item) => item.keywords.some((keyword) => text.includes(keyword)))
  return match?.label || "Otros"
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")

const inferDifficulty = (totalQuestions: number) => {
  if (totalQuestions <= 0) return "HTML"
  if (totalQuestions <= 40) return "Basico"
  if (totalQuestions <= 80) return "Intermedio"
  return "Avanzado"
}

const getTotalQuestions = (sim: SimuladorBuilder) => {
  if (sim.contentMode === "html") return 0
  const max = sim.config?.preguntasMax ?? sim.preguntas.length
  return Math.min(max, sim.preguntas.length)
}

const getTotalMinutes = (sim: SimuladorBuilder) => {
  const totalQuestions = getTotalQuestions(sim)
  if (sim.contentMode === "html") return "Libre"
  const secondsPerQuestion = sim.config?.tiempoPregunta ?? 60
  const totalMinutes = Math.max(1, Math.round((secondsPerQuestion * totalQuestions) / 60))
  return `${totalMinutes} min`
}

const simulatorMatchesCourse = (sim: SimuladorBuilder, courseId: string) => {
  if (!courseId) return true
  const linked = Array.from(new Set([...(sim.cursoIds || []), sim.cursoId || ""])).filter(Boolean)
  return linked.includes(courseId)
}

const getIsNew = (id: string) => {
  const stamp = Number(id.replace("sim_", ""))
  if (!Number.isFinite(stamp)) return false
  const days = (Date.now() - stamp) / (1000 * 60 * 60 * 24)
  return days <= 14
}

function DashboardSimulatorCard({ sim }: { sim: SimuladorCard }) {
  const [hovered, setHovered] = useState(false)
  const [side, setSide] = useState<"right" | "left">("right")
  const cardRef = useRef<HTMLDivElement>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const onEnter = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
    if (enterTimer.current) clearTimeout(enterTimer.current)
    enterTimer.current = setTimeout(() => {
      const node = cardRef.current
      if (node) {
        const rect = node.getBoundingClientRect()
        setSide(window.innerWidth - rect.right < 360 ? "left" : "right")
      }
      setHovered(true)
    }, 280)
  }
  const scheduleClose = () => {
    if (enterTimer.current) { clearTimeout(enterTimer.current); enterTimer.current = null }
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(() => setHovered(false), 180)
  }
  const cancelClose = () => {
    if (leaveTimer.current) { clearTimeout(leaveTimer.current); leaveTimer.current = null }
  }
  useEffect(() => () => {
    if (enterTimer.current) clearTimeout(enterTimer.current)
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
  }, [])

  const bullets = [
    sim.questions > 0 ? `${sim.questions} preguntas` : "Simulador HTML completo",
    `Duración estimada: ${sim.time}`,
    `Nivel ${sim.difficulty.toLowerCase()}`,
    sim.isPro ? "Asistencia con IA incluida" : "Práctica autoevaluada",
  ]

  return (
    <div
      ref={cardRef}
      className="group relative block"
      onMouseEnter={onEnter}
      onMouseLeave={scheduleClose}
    >
      <Link
        href={`/simulador/${sim.id}`}
        onClick={() => trackEntityClick("simulator", sim.id)}
        className="block"
      >
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_10px_30px_rgba(0,0,0,0.1)] transition-all duration-300 hover:border-primary/35">
          <div className={cn("relative aspect-video overflow-hidden bg-gradient-to-br", sim.gradient)}>
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_55%)]" />
            <div className="absolute left-2 top-2 flex flex-wrap gap-1">
              {sim.isNew ? (
                <span className="rounded-full bg-white px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] text-[#E8392A]">Nuevo</span>
              ) : null}
              <span className="rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/90">
                {sim.categoryLabel}
              </span>
            </div>
            <div className="absolute right-2 top-2 rounded-full border border-white/20 bg-black/30 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
              {sim.difficulty}
            </div>
            <div className="absolute left-3 bottom-3 right-3">
              <h3 className="line-clamp-2 text-base font-black leading-tight text-white">{sim.title}</h3>
            </div>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-white/10 text-white backdrop-blur">
              <Play size={14} fill="currentColor" />
            </div>
          </div>

          <div className="p-2.5">
            <p className="mb-1.5 line-clamp-2 text-[11px] leading-relaxed text-muted-foreground">{sim.description}</p>

            <div className="mb-1.5 flex items-center gap-1">
              <span className="text-xs font-bold text-[#fbbf24]">{sim.rating !== null ? sim.rating.toFixed(1) : "4.6"}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star
                    key={i}
                    size={10}
                    className={i <= Math.round(sim.rating || 4.6) ? "fill-[#fbbf24] text-[#fbbf24]" : "fill-muted text-muted"}
                  />
                ))}
              </div>
              <span className="text-[10px] text-muted-foreground">({sim.completions})</span>
            </div>

            <div className="flex flex-wrap gap-1">
              <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <ClipboardCheck className="h-2.5 w-2.5" />
                {sim.questions > 0 ? `${sim.questions}` : "HTML"}
              </span>
              <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
                <Clock className="h-2.5 w-2.5" />
                {sim.time}
              </span>
              {sim.progress > 0 ? (
                <span className="flex items-center gap-1 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-500">
                  {sim.progress}%
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </Link>

      {hovered ? (
        <div
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className={`pointer-events-auto absolute top-0 z-50 hidden w-80 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:block ${side === "right" ? "left-full ml-3" : "right-full mr-3"}`}
        >
          <h4 className="text-sm font-black leading-snug text-foreground">{sim.title}</h4>
          <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-emerald-500">
            {sim.categoryLabel} · {sim.difficulty}
          </p>
          <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{sim.description}</p>
          <ul className="mt-3 space-y-1.5">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-2 text-[12px] leading-snug text-foreground/90">
                <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                {b}
              </li>
            ))}
          </ul>
          <Link
            href={`/simulador/${sim.id}`}
            className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-black text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)]"
          >
            <Play size={14} fill="currentColor" />
            {sim.progress > 0 ? "Continuar simulador" : "Abrir simulador"}
          </Link>
        </div>
      ) : null}
    </div>
  )
}

function SimuladoresPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [simuladores, setSimuladores] = useState<SimuladorBuilder[]>([])
  const cursoIdFiltro = searchParams.get("cursoId") || ""
  const launchSim = searchParams.get("sim") || ""

  useEffect(() => {
    const sync = () => setSimuladores(getSimuladores())
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("simuladores-updated", sync as EventListener)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("simuladores-updated", sync as EventListener)
      window.removeEventListener("focus", sync)
    }
  }, [])

  useEffect(() => {
    if (!launchSim) return
    router.replace(`/simulador/${launchSim}`)
  }, [launchSim, router])

  useEffect(() => {
    if (!searchTerm.trim()) return
    const timeout = window.setTimeout(() => {
      trackSearchTerm("simulator", searchTerm)
    }, 500)
    return () => window.clearTimeout(timeout)
  }, [searchTerm])

  const simuladoresUI = useMemo<SimuladorCard[]>(() => {
    return simuladores
      .filter((sim) => {
        if (sim.estado !== "publicado") return false
        if (sim.categoria === "evaluacion") return false
        if (!simulatorMatchesCourse(sim, cursoIdFiltro)) return false
        const courseId = sim.cursoId || sim.cursoIds?.[0]
        const visibleByCourse = isCourseActivityVisibleInDashboard(courseId, "simulador")
        const isPublic = sim.publicarEnPaginaPrincipal !== false
        return visibleByCourse || isPublic
      })
      .map((sim) => {
        const resultados = getResultadosPorSimulador(sim.id)
        const completions = resultados.length
        const promedio =
          completions > 0
            ? resultados.reduce((acc: number, item: any) => acc + (item.porcentaje || 0), 0) / completions
            : 0
        const rating = completions > 0 ? Math.round((promedio / 20) * 10) / 10 : null
        const ultimo = resultados[completions - 1]
        const progress = ultimo?.porcentaje ?? 0
        const totalQuestions = getTotalQuestions(sim)
        const rawCategory = (sim.categoria || "").trim()
        const categoryLabel = rawCategory || inferCategoryLabel(sim)
        const categoryId = slugify(categoryLabel) || "otros"
        return {
          id: sim.id,
          title: sim.titulo,
          categoryId,
          categoryLabel,
          courseId: sim.cursoId || sim.cursoIds?.[0],
          courseTitle: sim.cursoTitulo || sim.cursoTitulos?.[0],
          description: sim.descripcion || "Simulador disponible",
          questions: totalQuestions,
          time: getTotalMinutes(sim),
          difficulty: inferDifficulty(totalQuestions),
          rating,
          completions,
          progress,
          isNew: getIsNew(sim.id),
          isPro: Boolean(sim.config?.modoIA),
          gradient: SIMULATOR_GRADIENTS[Math.abs(categoryId.length + completions) % SIMULATOR_GRADIENTS.length],
        }
      })
  }, [cursoIdFiltro, simuladores])

  const categoryButtons = useMemo(() => {
    const map = new Map<string, { id: string; label: string; usage: number; count: number }>()
    simuladoresUI.forEach((sim) => {
      const existing = map.get(sim.categoryId) || { id: sim.categoryId, label: sim.categoryLabel, usage: 0, count: 0 }
      existing.usage += sim.completions
      existing.count += 1
      map.set(sim.categoryId, existing)
    })
    const sorted = Array.from(map.values()).sort((a, b) => {
      if (b.usage !== a.usage) return b.usage - a.usage
      if (b.count !== a.count) return b.count - a.count
      return a.label.localeCompare(b.label, "es")
    })
    return [{ id: "all", label: "Todos" }, ...sorted.map((item) => ({ id: item.id, label: item.label }))]
  }, [simuladoresUI])

  useEffect(() => {
    const ids = new Set(categoryButtons.map((cat) => cat.id))
    if (!ids.has(activeCategory)) setActiveCategory("all")
  }, [activeCategory, categoryButtons])

  const filteredSimuladores = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return simuladoresUI.filter((sim) => {
      const matchesSearch = search ? [sim.title, sim.description].some((value) => value.toLowerCase().includes(search)) : true
      const matchesCategory = activeCategory === "all" || sim.categoryId === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [activeCategory, searchTerm, simuladoresUI])

  const selectedCategoryLabel = categoryButtons.find((cat) => cat.id === activeCategory)?.label || "Todos"

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 md:mb-12">
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Simuladores</h1>
        <p className="text-lg text-muted-foreground">
          Practica con el mismo sistema visual del catalogo y accede a simuladores publicados desde admin.
        </p>
      </div>

      {cursoIdFiltro ? (
        <div className="mb-8 rounded-2xl border border-border bg-card p-5">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">Curso filtrado</div>
          <h2 className="text-2xl font-bold text-foreground">Simuladores vinculados al curso</h2>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Aqui ves solo los simuladores que fueron asignados a este curso desde el modulo de admin.
          </p>
        </div>
      ) : null}

      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar simuladores, categorias o temas..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-lg border border-border bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <div className="mb-8">
        <div className="mb-3 flex items-center gap-2">
          <Target className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">Filtrar por categoria</span>
          <span className="ml-auto text-xs text-muted-foreground">{filteredSimuladores.length} simuladores</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categoryButtons.map((cat) => {
            const active = activeCategory === cat.id
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
                  active ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
                )}
              >
                {cat.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{filteredSimuladores.length}</span> simuladores
          <span className="mx-2 text-muted-foreground/50">·</span>
          categoria activa: <span className="font-semibold text-foreground">{selectedCategoryLabel}</span>
        </p>
      </div>

      {filteredSimuladores.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filteredSimuladores.map((sim) => (
            <DashboardSimulatorCard key={sim.id} sim={sim} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center">
          <Target className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
          <h3 className="mb-2 text-lg font-bold text-foreground">No encontramos simuladores</h3>
          <p className="mx-auto max-w-xl text-sm text-muted-foreground">
            Prueba otra busqueda, cambia de categoria o publica simuladores desde admin para que aparezcan aqui.
          </p>
        </div>
      )}
    </div>
  )
}

export default function SimuladoresPage() {
  return (
    <Suspense fallback={<div className="p-6 text-muted-foreground">Cargando simuladores...</div>}>
      <SimuladoresPageContent />
    </Suspense>
  )
}
