"use client"

import Link from "next/link"
import { ArrowRight, BookOpen, Sparkles, Trophy, Users } from "lucide-react"

export interface CursosHeroStats {
  totalCursos: number
  totalCategorias: number
  gratuitos: number
  conProgreso: number
}

interface CursosHeroProps {
  stats: CursosHeroStats
  isAuthenticated: boolean
}

export default function CursosHero({ stats, isAuthenticated }: CursosHeroProps) {
  return (
    <section className="relative overflow-hidden px-4 pb-8 pt-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-[#08111b]/85 p-8 shadow-[0_24px_80px_rgba(0,0,0,0.35)] backdrop-blur-2xl sm:p-10 lg:p-12">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,57,42,0.18),transparent_32%),radial-gradient(circle_at_right,rgba(56,189,248,0.14),transparent_28%)]" />
          <div className="absolute -right-16 top-8 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute left-10 top-0 h-32 w-32 rounded-full bg-sky-400/10 blur-3xl" />

          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-end">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
                <Sparkles className="h-3.5 w-3.5" />
                Catalogo Hack Evans
              </div>

              <h1 className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
                Cursos para avanzar con criterio y seguimiento real
              </h1>

              <p className="mt-5 max-w-2xl text-sm leading-7 text-white/68 sm:text-base">
                Explora los cursos publicados de la plataforma, filtra por categoria y revisa tu
                progreso cuando ya estes matriculado. Todo el acceso final se mantiene dentro de tu dashboard.
              </p>

              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link
                  href={isAuthenticated ? "/dashboard/cursos" : "/login?returnTo=%2Fdashboard%2Fcursos"}
                  className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#f14a3d]"
                >
                  {isAuthenticated ? "Ir a mi dashboard" : "Iniciar sesion para continuar"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white/72">
                  <Users className="h-4 w-4 text-sky-300" />
                  Progreso visible desde tu matricula activa
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-2">
              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  <BookOpen className="h-4 w-4 text-primary" />
                  Cursos activos
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{stats.totalCursos}</div>
                <p className="mt-2 text-sm text-white/50">Catalogo publico disponible hoy.</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  <Trophy className="h-4 w-4 text-emerald-300" />
                  Con progreso
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{stats.conProgreso}</div>
                <p className="mt-2 text-sm text-white/50">Cursos que ya muestran avance para tu usuario.</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Categorias
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{stats.totalCategorias}</div>
                <p className="mt-2 text-sm text-white/50">Areas listas para explorar y comparar.</p>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-white/[0.04] p-5">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                  Gratuitos
                </div>
                <div className="mt-3 text-3xl font-semibold text-white">{stats.gratuitos}</div>
                <p className="mt-2 text-sm text-white/50">Cursos listos para matricula inmediata.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
