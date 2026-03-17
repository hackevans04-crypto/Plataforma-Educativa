"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import {
  Award, BarChart3, CheckCircle, Clock, FileCheck2,
  Play, Search, Target, Trophy, Users,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { isCourseActivityVisibleInDashboard } from "@/lib/course-dashboard-visibility"
import type { SimuladorBuilder } from "@/simuladores/types"
import { getResultadosPorSimulador, getSimuladores } from "@/simuladores/storage"

type EvaluacionCard = {
  id: string
  title: string
  description: string
  categoryLabel: string
  courseId?: string
  courseTitle?: string
  questions: number
  duration: string
  attempts: number
  lastScore: number | null
  bestScore: number | null
  status: "available" | "completed"
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

function EvaluacionesPageContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState("")
  const [filter, setFilter] = useState<"all" | "available" | "completed">("all")
  const [evaluaciones, setEvaluaciones] = useState<SimuladorBuilder[]>([])
  const cursoIdFiltro = searchParams.get("cursoId") || ""

  useEffect(() => {
    setEvaluaciones(getSimuladores())
  }, [])

  const evaluacionesUI = useMemo<EvaluacionCard[]>(() => {
    return evaluaciones
      .filter((sim) =>
        sim.estado === "publicado" &&
        sim.categoria === "evaluacion" &&
        (!cursoIdFiltro || sim.cursoId === cursoIdFiltro) &&
        isCourseActivityVisibleInDashboard(sim.cursoId, "evaluacion")
      )
      .map((sim) => {
        const resultados = getResultadosPorSimulador(sim.id)
        const attempts = resultados.length
        const orderedScores = resultados
          .map((item: any) => Number(item.porcentaje || 0))
          .filter((value: number) => Number.isFinite(value))
        const lastScore = orderedScores.length > 0 ? orderedScores[orderedScores.length - 1] : null
        const bestScore = orderedScores.length > 0 ? Math.max(...orderedScores) : null
        return {
          id: sim.id,
          title: sim.titulo,
          description: sim.descripcion || "Evaluacion disponible",
          categoryLabel: sim.cursoTitulo || sim.categoria || "Evaluacion",
          courseId: sim.cursoId,
          courseTitle: sim.cursoTitulo,
          questions: getTotalQuestions(sim),
          duration: getTotalMinutes(sim),
          attempts,
          lastScore,
          bestScore,
          status: attempts > 0 ? "completed" : "available",
        }
      })
  }, [cursoIdFiltro, evaluaciones])

  const filteredEvaluaciones = useMemo(() => {
    const search = searchTerm.trim().toLowerCase()
    return evaluacionesUI.filter((ev) => {
      const matchesSearch = search
        ? [ev.title, ev.description, ev.courseTitle || ""].some((value) => value.toLowerCase().includes(search))
        : true
      const matchesFilter = filter === "all" || ev.status === filter
      return matchesSearch && matchesFilter
    })
  }, [evaluacionesUI, filter, searchTerm])

  const stats = useMemo(() => {
    const completadas = evaluacionesUI.filter((ev) => ev.status === "completed")
    const mejores = completadas.map((ev) => ev.bestScore ?? 0)
    const promedio = mejores.length > 0 ? Math.round(mejores.reduce((acc, item) => acc + item, 0) / mejores.length) : 0
    const mejor = mejores.length > 0 ? Math.max(...mejores) : 0
    const intentos = evaluacionesUI.reduce((acc, ev) => acc + ev.attempts, 0)
    return [
      { label: "Evaluaciones", value: String(evaluacionesUI.length), icon: FileCheck2, color: "text-primary" },
      { label: "Completadas", value: String(completadas.length), icon: CheckCircle, color: "text-emerald-400" },
      { label: "Promedio", value: `${promedio}%`, icon: BarChart3, color: "text-blue-400" },
      { label: "Mejor nota", value: `${mejor}%`, icon: Trophy, color: "text-amber-400" },
      { label: "Intentos", value: String(intentos), icon: Users, color: "text-muted-foreground" },
    ]
  }, [evaluacionesUI])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-2">
          {cursoIdFiltro ? "Evaluaciones del curso" : "Evaluaciones"}
        </h1>
        <p className="text-muted-foreground">
          {cursoIdFiltro
            ? "Aqui aparecen las evaluaciones publicadas para este curso."
            : "Mide tu avance con evaluaciones y simulacros publicados por el admin."}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl bg-secondary", stat.color)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{stat.value}</div>
                  <div className="text-xs text-muted-foreground">{stat.label}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar evaluaciones..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            className="w-full rounded-xl border border-border bg-card py-2.5 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none transition-colors"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
          {[
            { id: "all" as const, label: "Todas" },
            { id: "available" as const, label: "Disponibles" },
            { id: "completed" as const, label: "Completadas" },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setFilter(item.id)}
              className={cn(
                "rounded-xl px-4 py-2 text-sm font-semibold transition-all whitespace-nowrap",
                filter === item.id
                  ? "bg-primary text-white"
                  : "border border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredEvaluaciones.map((ev) => (
          <div key={ev.id} className="rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/30">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="mb-2 flex items-center gap-2">
                  <div className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                    ev.status === "completed" ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"
                  )}>
                    {ev.status === "completed" ? <CheckCircle className="h-5 w-5" /> : <Award className="h-5 w-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="line-clamp-2 text-lg font-bold text-foreground">{ev.title}</h3>
                    {ev.courseTitle && (
                      <div className="mt-1 inline-flex rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {ev.courseTitle}
                      </div>
                    )}
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{ev.description}</p>
              </div>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3.5 w-3.5" />
                {ev.questions} preguntas
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" />
                {ev.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5" />
                {ev.attempts} intentos
              </span>
            </div>

            <div className="mb-4 grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Ultimo resultado</div>
                <div className="mt-1 font-semibold text-foreground">{ev.lastScore !== null ? `${ev.lastScore}%` : "Pendiente"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Mejor resultado</div>
                <div className="mt-1 font-semibold text-foreground">{ev.bestScore !== null ? `${ev.bestScore}%` : "Sin intentos"}</div>
              </div>
            </div>

            <Link
              href={`/simulador/${ev.id}`}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all",
                ev.status === "completed"
                  ? "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
              )}
            >
              <Play className="h-4 w-4" />
              {ev.status === "completed" ? "Repetir evaluacion" : "Iniciar evaluacion"}
            </Link>
          </div>
        ))}
      </div>

      {filteredEvaluaciones.length === 0 && (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
            <Award className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-foreground">No se encontraron evaluaciones</h3>
          <p className="text-muted-foreground">Prueba con otra busqueda o publica evaluaciones desde el admin.</p>
        </div>
      )}
    </div>
  )
}

export default function EvaluacionesPage() {
  return (
    <Suspense fallback={null}>
      <EvaluacionesPageContent />
    </Suspense>
  )
}
