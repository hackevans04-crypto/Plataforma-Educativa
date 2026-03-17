"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Target, Clock, ClipboardCheck, Zap, Search,
  Play, Star, Users
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isCourseActivityVisibleInDashboard } from "@/lib/course-dashboard-visibility"
import type { SimuladorBuilder } from "@/simuladores/types"
import { getResultadosPorSimulador, getSimuladores } from "@/simuladores/storage"

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
}

const CATEGORY_KEYWORDS: Array<{ label: string; keywords: string[] }> = [
  { label: "QSM", keywords: ["qsm", "quiero ser maestro"] },
  { label: "Ser Maestro", keywords: ["ser maestro", "desempeno"] },
  { label: "Saberes", keywords: ["saberes", "pedagogico", "didactica"] },
  { label: "Razonamiento", keywords: ["razonamiento", "logico", "numerico", "verbal"] },
]

const inferCategoryLabel = (sim: SimuladorBuilder) => {
  const text = `${sim.titulo} ${sim.descripcion}`.toLowerCase()
  const match = CATEGORY_KEYWORDS.find((item) =>
    item.keywords.some((keyword) => text.includes(keyword))
  )
  return match?.label || "Otros"
}

const slugify = (value: string) => {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
}

const inferDifficulty = (totalQuestions: number) => {
  if (totalQuestions <= 40) return "Basico"
  if (totalQuestions <= 80) return "Intermedio"
  return "Avanzado"
}

const getTotalQuestions = (sim: SimuladorBuilder) => {
  const max = sim.config?.preguntasMax ?? sim.preguntas.length
  return Math.min(max, sim.preguntas.length)
}

const getTotalMinutes = (sim: SimuladorBuilder) => {
  const totalQuestions = getTotalQuestions(sim)
  const secondsPerQuestion = sim.config?.tiempoPregunta ?? 60
  const totalMinutes = Math.max(1, Math.round((secondsPerQuestion * totalQuestions) / 60))
  return `${totalMinutes} min`
}

const getIsNew = (id: string) => {
  const stamp = Number(id.replace("sim_", ""))
  if (!Number.isFinite(stamp)) return false
  const days = (Date.now() - stamp) / (1000 * 60 * 60 * 24)
  return days <= 14
}

function SimuladoresPageContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [activeCategory, setActiveCategory] = useState("all")
  const [simuladores, setSimuladores] = useState<SimuladorBuilder[]>([])
  const cursoIdFiltro = searchParams.get("cursoId") || ""

  useEffect(() => {
    setSimuladores(getSimuladores())
  }, [])

  const simuladoresUI = useMemo<SimuladorCard[]>(() => {
    return simuladores
      .filter((sim) =>
        sim.estado === "publicado" &&
        sim.categoria !== "evaluacion" &&
        (!cursoIdFiltro || sim.cursoId === cursoIdFiltro) &&
        isCourseActivityVisibleInDashboard(sim.cursoId, "simulador")
      )
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
          courseId: sim.cursoId,
          courseTitle: sim.cursoTitulo,
          description: sim.descripcion || "Simulador disponible",
          questions: totalQuestions,
          time: getTotalMinutes(sim),
          difficulty: inferDifficulty(totalQuestions),
          rating,
          completions,
          progress,
          isNew: getIsNew(sim.id),
          isPro: Boolean(sim.config?.modoIA),
        }
      })
  }, [cursoIdFiltro, simuladores])

  const categoryButtons = useMemo(() => {
    const map = new Map<string, { id: string; label: string; usage: number; count: number }>()
    simuladoresUI.forEach((sim) => {
      const existing = map.get(sim.categoryId) || {
        id: sim.categoryId,
        label: sim.categoryLabel,
        usage: 0,
        count: 0,
      }
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
    if (!ids.has(activeCategory)) {
      setActiveCategory("all")
    }
  }, [activeCategory, categoryButtons])

  const filteredSimuladores = simuladoresUI.filter((sim) => {
    const search = searchTerm.trim().toLowerCase()
    const matchesSearch = search
      ? [sim.title, sim.description].some((value) => value.toLowerCase().includes(search))
      : true
    const matchesCategory = activeCategory === "all" || sim.categoryId === activeCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {cursoIdFiltro ? "Simuladores del curso" : "Simuladores"}
        </h1>
        <p className="text-muted-foreground">
          {cursoIdFiltro
            ? "Aqui aparecen los simuladores publicados para este curso."
            : "Practica con simuladores basados en examenes reales del INEVAL"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar simuladores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {categoryButtons.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                activeCategory === cat.id
                  ? "bg-primary text-white"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50"
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredSimuladores.map((sim) => (
          <div
            key={sim.id}
            className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:-translate-y-1"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-bold text-lg text-foreground">{sim.title}</h3>
                  {sim.isNew && (
                    <span className="px-2 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-full uppercase">
                      Nuevo
                    </span>
                  )}
                  {sim.isPro && (
                    <span className="px-2 py-0.5 bg-[#F5C842]/15 text-[#F5C842] text-[10px] font-bold rounded-full uppercase">
                      Pro
                    </span>
                  )}
                </div>
                {sim.courseTitle && (
                  <div className="mb-2 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                    {sim.courseTitle}
                  </div>
                )}
                <p className="text-sm text-muted-foreground line-clamp-2">{sim.description}</p>
              </div>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-4">
              <span className="flex items-center gap-1">
                <ClipboardCheck className="w-3.5 h-3.5" />
                {sim.questions} preguntas
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {sim.time}
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                {sim.difficulty}
              </span>
            </div>

            {/* Rating & Completions */}
              <div className="flex items-center gap-4 mb-4 pb-4 border-b border-border">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-[#F5C842] text-[#F5C842]" />
                  <span className="text-sm font-medium text-foreground">
                    {sim.rating !== null ? sim.rating.toFixed(1) : "--"}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Users className="w-4 h-4" />
                  {sim.completions.toLocaleString()} completados
                </div>
              </div>

            {/* Progress */}
            {sim.progress > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Tu progreso</span>
                  <span className="text-foreground font-medium">{sim.progress}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${sim.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* CTA */}
            <Link
              href={`/simulador/${sim.id}`}
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary/10 text-primary font-semibold rounded-xl hover:bg-primary hover:text-white transition-all"
            >
              <Play className="w-4 h-4" />
              {sim.progress > 0 ? "Continuar" : "Iniciar Simulador"}
            </Link>
          </div>
        ))}
      </div>

      {filteredSimuladores.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-secondary mx-auto mb-4 flex items-center justify-center">
            <Target className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2">No se encontraron simuladores</h3>
          <p className="text-muted-foreground">Intenta con otros terminos de busqueda</p>
        </div>
      )}
    </div>
  )
}

export default function SimuladoresPage() {
  return (
    <Suspense fallback={null}>
      <SimuladoresPageContent />
    </Suspense>
  )
}
