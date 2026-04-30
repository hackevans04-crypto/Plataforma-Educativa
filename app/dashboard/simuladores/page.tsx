"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ClipboardCheck, Clock, Play, Search, Star, Target, Zap } from "lucide-react"
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
  return (
    <Link
      href={`/simulador/${sim.id}`}
      onClick={() => trackEntityClick("simulator", sim.id)}
      className="group block"
    >
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-card shadow-[0_18px_60px_rgba(0,0,0,0.12)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_24px_80px_rgba(0,0,0,0.18)] dark:bg-[#0d0e13]/80">
        <div className={cn("relative aspect-video overflow-hidden bg-gradient-to-br", sim.gradient)}>
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.14),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "34px 34px",
            }}
          />

          <div className="absolute left-4 top-4 flex flex-wrap gap-2">
            {sim.isNew ? (
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#E8392A]">
                Nuevo
              </span>
            ) : null}
            <span className="rounded-full border border-white/20 bg-black/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
              {sim.categoryLabel}
            </span>
          </div>

          <div className="absolute right-4 top-4 rounded-full border border-white/18 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {sim.difficulty}
          </div>

          <div className="absolute left-5 top-20 max-w-[72%]">
            <h3 className="line-clamp-3 text-3xl font-black leading-[1.02] text-white">{sim.title}</h3>
          </div>

          <div className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white backdrop-blur">
            <Play size={18} className="ml-0.5" fill="currentColor" />
          </div>
        </div>

        <div className="p-4">
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{sim.description}</p>

          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#fbbf24]">{sim.rating !== null ? sim.rating.toFixed(1) : "4.6"}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={12}
                  className={i <= Math.round(sim.rating || 4.6) ? "fill-[#fbbf24] text-[#fbbf24]" : "fill-muted text-muted"}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">({sim.completions.toLocaleString()} completados)</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <ClipboardCheck className="h-3 w-3" />
              {sim.questions > 0 ? `${sim.questions} preguntas` : "HTML completo"}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Clock className="h-3 w-3" />
              {sim.time}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-2 py-0.5 text-[11px] text-muted-foreground">
              <Zap className="h-3 w-3" />
              {sim.isPro ? "IA" : sim.difficulty}
            </span>
          </div>

          {sim.progress > 0 ? (
            <div className="mb-3 rounded border border-emerald-500/20 bg-emerald-500/8 px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-emerald-400">Tu progreso</span>
                <span className="font-bold text-emerald-400">{sim.progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-emerald-950/35">
                <div className="h-full rounded-full bg-emerald-400" style={{ width: `${sim.progress}%` }} />
              </div>
            </div>
          ) : null}

          <div className="flex items-center justify-between border-t border-border pt-3">
            <div>
              <p className="text-xl font-bold text-foreground">Practicar</p>
              <p className="text-xs text-muted-foreground">Mismo estilo del catalogo</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary transition-all group-hover:bg-primary group-hover:text-white">
              {sim.progress > 0 ? "Continuar" : "Abrir simulador"}
              <Play size={11} />
            </span>
          </div>
        </div>
      </div>
    </Link>
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
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
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
