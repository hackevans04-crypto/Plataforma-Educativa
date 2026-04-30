"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  SlidersHorizontal,
  Clock,
  X,
  ChevronDown,
  ChevronUp,
  Check,
  Play,
  Target,
  Brain,
  Users,
  Star,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BrandBackdrop from "@/components/brand-backdrop"
import { useAuth } from "@/contexts/auth-context"
import {
  getEntityClickScore,
  getSearchRelevanceScore,
  trackEntityClick,
  trackSearchTerm,
} from "@/lib/discovery-popularity"

type ResultadoSimulador = {
  simuladorId?: string
  porcentaje?: number
}

type SimuladorFuente = {
  id: string
  titulo: string
  descripcion: string
  subtitulo?: string
  categoria?: string
  tags?: string[]
  estado: "borrador" | "en_revision" | "publicado" | "archivado"
  publicarEnPaginaPrincipal?: boolean
  contentMode?: "html" | "quiz"
  htmlContent?: string
  htmlImportName?: string
  preguntas?: unknown[]
  config?: {
    modoIA?: boolean
    tiempoPregunta?: number
    preguntasMax?: number
  }
  createdAt?: string
  updatedAt?: string
}

type SimuladorCard = {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  preguntas: number
  duracion: string
  dificultad: string
  modo: string
  rating: number
  totalIntentos: number
  destacado: boolean
  nuevo: boolean
  color: string
  popularity: number
  tags: string[]
}

const SIMULADORES_KEY = "simuladores"
const RESULTADOS_KEY = "simuladores_resultados"
const SIMULADORES_EVENT = "simuladores-updated"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function inferDifficulty(totalQuestions: number) {
  if (totalQuestions <= 0) return "HTML"
  if (totalQuestions <= 40) return "Basico"
  if (totalQuestions <= 80) return "Intermedio"
  return "Avanzado"
}

function inferCategory(sim: SimuladorFuente) {
  const text = `${sim.categoria || ""} ${sim.titulo} ${sim.descripcion}`.toLowerCase()
  if (text.includes("qsm") || text.includes("quiero ser maestro")) return "QSM"
  if (text.includes("pedagog")) return "Pedagogia"
  if (text.includes("normativa")) return "Normativa"
  if (text.includes("ia")) return "IA"
  return (sim.categoria || "General").trim() || "General"
}

function getQuestionCount(sim: SimuladorFuente) {
  if (sim.contentMode === "html") return 0
  const total = Array.isArray(sim.preguntas) ? sim.preguntas.length : 0
  const max = sim.config?.preguntasMax ?? total
  return Math.max(1, total > 0 ? Math.min(total, max) : max || 20)
}

function getDurationLabel(sim: SimuladorFuente, totalQuestions: number) {
  if (sim.contentMode === "html") return "Libre"
  const secondsPerQuestion = sim.config?.tiempoPregunta ?? 60
  const totalMinutes = Math.max(1, Math.round((secondsPerQuestion * totalQuestions) / 60))
  return `${totalMinutes} min`
}

function isRecentlyCreated(sim: SimuladorFuente) {
  const stamp = new Date(sim.createdAt || sim.updatedAt || 0).getTime()
  if (!stamp) return false
  return (Date.now() - stamp) / (1000 * 60 * 60 * 24) <= 14
}

function buildCatalogoPublico(): SimuladorCard[] {
  if (typeof window === "undefined") return []

  const simuladores = parseSafe<SimuladorFuente[]>(window.localStorage.getItem(SIMULADORES_KEY), [])
  const resultados = parseSafe<ResultadoSimulador[]>(window.localStorage.getItem(RESULTADOS_KEY), [])
  const resultadosPorSimulador = resultados.reduce<Record<string, ResultadoSimulador[]>>((acc, item) => {
    if (!item.simuladorId) return acc
    acc[item.simuladorId] = [...(acc[item.simuladorId] || []), item]
    return acc
  }, {})

  const palette = [
    "from-[#ff5a3d] via-[#ff7b47] to-[#facc15]",
    "from-[#2563eb] via-[#3b82f6] to-[#38bdf8]",
    "from-[#7c3aed] via-[#a855f7] to-[#f472b6]",
    "from-[#0f9b8e] via-[#20c997] to-[#7be495]",
  ]

  return simuladores
    .filter((sim) => sim.estado === "publicado" && sim.publicarEnPaginaPrincipal !== false)
    .map((sim, index) => {
      const intentos = resultadosPorSimulador[sim.id] || []
      const totalIntentos = intentos.length
      const promedio = totalIntentos
        ? intentos.reduce((acc, item) => acc + Number(item.porcentaje || 0), 0) / totalIntentos
        : 0
      const totalQuestions = getQuestionCount(sim)
      const clickScore = getEntityClickScore("simulator", sim.id)
      const searchScore = getSearchRelevanceScore("simulator", [
        sim.titulo,
        sim.descripcion,
        sim.categoria || "",
        ...(sim.tags || []),
      ])
      const popularity =
        totalIntentos * 10 +
        clickScore * 5 +
        searchScore * 4 +
        totalQuestions +
        (sim.config?.modoIA ? 12 : 0) +
        (isRecentlyCreated(sim) ? 8 : 0)

      return {
        id: sim.id,
        titulo: sim.titulo,
        descripcion: sim.subtitulo?.trim() || sim.descripcion || "Practica con un simulador conectado al panel admin.",
        categoria: inferCategory(sim),
        preguntas: totalQuestions,
        duracion: getDurationLabel(sim, totalQuestions),
        dificultad: inferDifficulty(totalQuestions),
        modo: sim.contentMode === "html" ? "HTML completo" : sim.config?.modoIA ? "Asistido por IA" : "Cronometrado",
        rating: totalIntentos ? Math.max(3.8, Math.min(5, Number((promedio / 20).toFixed(1)))) : 4.6,
        totalIntentos,
        destacado: false,
        nuevo: isRecentlyCreated(sim),
        color: palette[index % palette.length],
        popularity,
        tags: sim.tags || [],
      }
    })
    .sort((a, b) => b.popularity - a.popularity)
    .map((sim, index) => ({ ...sim, destacado: index === 0 }))
}

function getCategorias(simuladores: SimuladorCard[]) {
  return ["Todos", ...Array.from(new Set(simuladores.map((sim) => sim.categoria))).sort((a, b) => a.localeCompare(b))]
}

function SimuladorCardView({
  simulador,
  isAuthenticated,
}: {
  simulador: SimuladorCard
  isAuthenticated: boolean
}) {
  const router = useRouter()
  const targetPath = `/dashboard/simuladores?sim=${encodeURIComponent(simulador.id)}`
  const handleClick = (event: React.MouseEvent) => {
    event.preventDefault()
    trackEntityClick("simulator", simulador.id)
    if (isAuthenticated) {
      router.push(targetPath)
    } else {
      router.push(`/login?returnTo=${encodeURIComponent(targetPath)}`)
    }
  }
  return (
    <a
      href={targetPath}
      onClick={handleClick}
      className="group block cursor-pointer"
    >
      <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0e13]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(232,57,42,0.45)] hover:shadow-[0_24px_60px_rgba(232,57,42,0.18)]">
        <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
          <div
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          {simulador.destacado ? (
            <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
              Top
            </div>
          ) : null}
          {simulador.nuevo ? (
            <div className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#E8392A]">
              Nuevo
            </div>
          ) : null}
          <div className="absolute right-3 top-3 rounded-full border border-white/20 bg-black/20 px-3 py-1 text-[11px] font-semibold text-white backdrop-blur">
            {simulador.dificultad}
          </div>
          <div className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/20 bg-white/10 backdrop-blur">
            <Play size={18} className="ml-0.5 text-white" fill="currentColor" />
          </div>
          <div className="absolute left-5 top-5 max-w-[75%]">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">
              {simulador.categoria}
            </p>
            <h3 className="line-clamp-3 text-2xl font-bold leading-tight text-white">{simulador.titulo}</h3>
          </div>
        </div>

        <div className="p-4">
          <p className="mb-4 line-clamp-2 text-sm leading-relaxed text-white/55">{simulador.descripcion}</p>

          <div className="mb-3 flex items-center gap-1.5">
            <span className="text-sm font-bold text-[#fbbf24]">{simulador.rating.toFixed(1)}</span>
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  size={12}
                  className={
                    i <= Math.round(simulador.rating)
                      ? "fill-[#fbbf24] text-[#fbbf24]"
                      : "fill-white/15 text-white/15"
                  }
                />
              ))}
            </div>
            <span className="text-xs text-white/45">({simulador.totalIntentos.toLocaleString()} intentos)</span>
          </div>

          <div className="mb-4 flex flex-wrap gap-1.5">
            {simulador.preguntas > 0 ? (
              <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
                <Target size={10} /> {simulador.preguntas} preguntas
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
                <Target size={10} /> HTML completo
              </span>
            )}
            <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
              <Clock size={10} /> {simulador.duracion}
            </span>
            <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
              <Brain size={10} /> {simulador.modo}
            </span>
          </div>

          <div className="flex items-center justify-between border-t border-white/8 pt-3">
            <div>
              <p className="text-lg font-bold text-white">Practicar</p>
              <p className="text-xs text-white/40">Ranking por uso real y busquedas</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[rgba(232,57,42,0.55)] bg-[rgba(232,57,42,0.12)] px-3 py-2 text-xs font-bold text-[#ff8c7d] transition-all group-hover:bg-[#E8392A] group-hover:text-white">
              Abrir simulador <Play size={11} />
            </span>
          </div>
        </div>
      </div>
    </a>
  )
}

function FiltroSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(true)

  return (
    <div className="border-b border-white/8 py-4">
      <button
        onClick={() => setAbierto(!abierto)}
        className="mb-0 flex w-full items-center justify-between text-sm font-bold text-white transition-colors hover:text-gray-300"
      >
        {titulo}
        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {abierto ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export default function SimuladoresPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [simuladores, setSimuladores] = useState<SimuladorCard[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [categoriaActiva, setCategoriaActiva] = useState("Todos")
  const [dificultadFiltro, setDificultadFiltro] = useState<string[]>([])
  const [modoFiltro, setModoFiltro] = useState<"todos" | "ia" | "cronometrado">("todos")
  const [intentosMinimos, setIntentosMinimos] = useState<number | null>(null)
  const [ordenarPor, setOrdenarPor] = useState("relevancia")
  const [drawerAbierto, setDrawerAbierto] = useState(false)

  useEffect(() => {
    const sync = () => setSimuladores(buildCatalogoPublico())

    sync()
    window.addEventListener("storage", sync)
    window.addEventListener(SIMULADORES_EVENT, sync as EventListener)
    window.addEventListener("focus", sync)

    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(SIMULADORES_EVENT, sync as EventListener)
      window.removeEventListener("focus", sync)
    }
  }, [])

  useEffect(() => {
    if (!busqueda.trim()) return
    const timeout = window.setTimeout(() => {
      trackSearchTerm("simulator", busqueda)
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [busqueda])

  const categorias = useMemo(() => getCategorias(simuladores), [simuladores])

  useEffect(() => {
    if (!categorias.includes(categoriaActiva)) {
      setCategoriaActiva("Todos")
    }
  }, [categoriaActiva, categorias])

  const toggleDificultad = (nivel: string) => {
    setDificultadFiltro((prev) => (prev.includes(nivel) ? prev.filter((item) => item !== nivel) : [...prev, nivel]))
  }

  const simuladoresFiltrados = useMemo(() => {
    return simuladores
      .filter((sim) => {
        const term = busqueda.toLowerCase()
        const matchBusqueda =
          !busqueda ||
          sim.titulo.toLowerCase().includes(term) ||
          sim.descripcion.toLowerCase().includes(term) ||
          sim.categoria.toLowerCase().includes(term) ||
          sim.tags.some((tag) => tag.toLowerCase().includes(term))
        const matchCategoria = categoriaActiva === "Todos" || sim.categoria === categoriaActiva
        const matchDificultad = dificultadFiltro.length === 0 || dificultadFiltro.includes(sim.dificultad)
        const matchModo =
          modoFiltro === "todos" ||
          (modoFiltro === "ia" && sim.modo === "Asistido por IA") ||
          (modoFiltro === "cronometrado" && sim.modo !== "Asistido por IA")
        const matchIntentos = !intentosMinimos || sim.totalIntentos >= intentosMinimos
        return matchBusqueda && matchCategoria && matchDificultad && matchModo && matchIntentos
      })
      .sort((a, b) => {
        if (ordenarPor === "intentos") return b.totalIntentos - a.totalIntentos
        if (ordenarPor === "rating") return b.rating - a.rating
        if (ordenarPor === "preguntas") return b.preguntas - a.preguntas
        return b.popularity - a.popularity
      })
  }, [busqueda, categoriaActiva, dificultadFiltro, intentosMinimos, modoFiltro, ordenarPor, simuladores])

  const filtrosActivos = dificultadFiltro.length > 0 || modoFiltro !== "todos" || intentosMinimos !== null

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent">
      <BrandBackdrop />

      <div className="relative z-10">
        <Navbar
          onLoginClick={() => router.push("/login")}
          onRegisterClick={() => router.push("/registro")}
          hideAuthenticatedUserMenu
        />

        <div className="min-h-screen text-white">
          <div className="border-b border-white/8 bg-[#0a0b10]/40 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6 pt-5">
              <div className="relative max-w-3xl">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar simuladores, categorías o temas..."
                  className="h-11 w-full rounded-full border border-white/12 bg-white/[0.04] pl-11 pr-10 text-sm text-white placeholder:text-white/35 transition-all focus:border-[rgba(232,57,42,0.55)] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[rgba(232,57,42,0.18)]"
                />
                {busqueda ? (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-3">
              <button
                onClick={() => setDrawerAbierto(true)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all ${
                  filtrosActivos
                    ? "border-[#E8392A] bg-[#E8392A] font-semibold text-white"
                    : "border-white/12 bg-white/[0.03] text-white/75 hover:border-[rgba(232,57,42,0.45)] hover:text-white"
                }`}
              >
                <SlidersHorizontal size={14} />
                Todos los filtros
                {filtrosActivos ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-xs text-white">
                    {dificultadFiltro.length + (modoFiltro !== "todos" ? 1 : 0) + (intentosMinimos ? 1 : 0)}
                  </span>
                ) : null}
              </button>

              <div className="h-6 w-px shrink-0 bg-white/10" />

              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm transition-all ${
                    categoriaActiva === cat
                      ? "bg-white text-black font-semibold"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}

              <div className="ml-auto relative shrink-0">
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="appearance-none rounded-full border border-white/12 bg-white/[0.03] py-1.5 pl-4 pr-9 text-sm text-white/75 cursor-pointer transition-colors focus:outline-none hover:border-[rgba(232,57,42,0.45)]"
                >
                  <option value="relevancia" className="bg-[#1c1c1c]">Mas relevante</option>
                  <option value="intentos" className="bg-[#1c1c1c]">Mas usado</option>
                  <option value="rating" className="bg-[#1c1c1c]">Mejor valorado</option>
                  <option value="preguntas" className="bg-[#1c1c1c]">Mas preguntas</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45" />
              </div>
            </div>
          </div>

          <section className="mx-auto max-w-7xl px-6 pb-16 pt-8">
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  {busqueda ? (
                    <p className="text-xl font-bold text-white">
                      {simuladoresFiltrados.length} resultados para <span className="italic">"{busqueda}"</span>
                    </p>
                  ) : (
                    <p className="text-sm text-white/55">
                      Mostrando <span className="font-semibold text-white">{simuladoresFiltrados.length}</span> simuladores
                      {categoriaActiva !== "Todos" ? <> en <span className="font-semibold text-white">{categoriaActiva}</span></> : null}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap gap-2">
                {modoFiltro !== "todos" ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {modoFiltro === "ia" ? "Con IA" : "Cronometrado"}
                    <button onClick={() => setModoFiltro("todos")}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null}
                {intentosMinimos ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {intentosMinimos}+ intentos
                    <button onClick={() => setIntentosMinimos(null)}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null}
                {dificultadFiltro.map((nivel) => (
                  <span key={nivel} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {nivel}
                    <button onClick={() => toggleDificultad(nivel)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                </div>
              </div>

              {simuladoresFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {simuladoresFiltrados.map((simulador) => (
                    <SimuladorCardView
                      key={simulador.id}
                      simulador={simulador}
                      isAuthenticated={isAuthenticated}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Users size={48} className="mb-4 text-white/18" />
                  <h3 className="mb-2 text-2xl font-bold text-white">No encontramos simuladores</h3>
                  <p className="mb-6 text-sm text-white/45">Prueba con otra busqueda o ajusta los filtros.</p>
                  <button
                    onClick={() => {
                      setBusqueda("")
                      setCategoriaActiva("Todos")
                      setDificultadFiltro([])
                      setModoFiltro("todos")
                      setIntentosMinimos(null)
                    }}
                    className="rounded-full border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.12)] px-6 py-2 text-sm font-semibold text-[#ff8c7d] transition-all hover:bg-[#E8392A] hover:text-white"
                  >
                    Limpiar filtros
                  </button>
                </div>
              )}
          </section>

          {drawerAbierto ? (
            <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDrawerAbierto(false)} />
          ) : null}

          <div
            className={`fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto border-r border-white/8 bg-[#0a0b10]/95 backdrop-blur-xl transition-transform duration-300 ${
              drawerAbierto ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/8 p-4">
              <h2 className="text-lg font-bold text-white">Filtros</h2>
              <button onClick={() => setDrawerAbierto(false)} className="p-1 text-white/55 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="px-4">
              <FiltroSeccion titulo="Modo">
                <div className="space-y-2.5">
                  {[
                    { value: "todos" as const, label: "Todos" },
                    { value: "cronometrado" as const, label: "Cronometrado" },
                    { value: "ia" as const, label: "Asistido por IA" },
                  ].map((item) => (
                    <label key={item.value} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => setModoFiltro(item.value)}
                        className={`flex h-4 w-4 items-center justify-center border-2 transition-all ${
                          modoFiltro === item.value ? "border-[#E8392A] bg-[#E8392A]" : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {modoFiltro === item.value ? <Check size={10} className="text-white" /> : null}
                      </div>
                      <span className={`text-sm ${modoFiltro === item.value ? "text-white" : "text-white/55 group-hover:text-white"}`}>
                        {item.label}
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>

              <FiltroSeccion titulo="Dificultad">
                <div className="space-y-2.5">
                  {["Basico", "Intermedio", "Avanzado"].map((nivel) => (
                    <label key={nivel} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => toggleDificultad(nivel)}
                        className={`flex h-4 w-4 items-center justify-center border-2 transition-all ${
                          dificultadFiltro.includes(nivel)
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {dificultadFiltro.includes(nivel) ? <Check size={10} className="text-white" /> : null}
                      </div>
                      <span className={`text-sm ${dificultadFiltro.includes(nivel) ? "text-white" : "text-white/55 group-hover:text-white"}`}>
                        {nivel}
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>

              <FiltroSeccion titulo="Popularidad">
                <div className="space-y-2.5">
                  {[10, 25, 50].map((minimo) => (
                    <label key={minimo} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => setIntentosMinimos(intentosMinimos === minimo ? null : minimo)}
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                          intentosMinimos === minimo
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {intentosMinimos === minimo ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                      </div>
                      <span className={`text-sm ${intentosMinimos === minimo ? "text-white" : "text-white/55 group-hover:text-white"}`}>
                        {minimo}+ intentos
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-white/8 bg-[#0a0b10]/95 p-4 backdrop-blur-xl">
              <button
                onClick={() => {
                  setDificultadFiltro([])
                  setModoFiltro("todos")
                  setIntentosMinimos(null)
                  setCategoriaActiva("Todos")
                }}
                className="flex-1 rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white/65 transition-all hover:border-white hover:text-white"
              >
                Limpiar
              </button>
              <button
                onClick={() => setDrawerAbierto(false)}
                className="flex-1 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.02]"
              >
                Ver {simuladoresFiltrados.length} simuladores
              </button>
            </div>
          </div>
        </div>

        <Footer />
      </div>
    </main>
  )
}
