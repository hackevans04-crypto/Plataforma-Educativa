"use client"

import Image from "next/image"
import { ArrowRight, Award, BookOpen, Clock3, GraduationCap, User2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { SiteIconGlyph } from "@/components/ui/site-icon-glyph"

export interface CursoCardData {
  id: string
  title: string
  subtitle?: string
  description: string
  instructor: string
  category: string
  level: string
  access: "libre" | "clave" | "pago"
  priceLabel: string
  lessons: number
  durationLabel: string
  progress: number
  enrolled: boolean
  featured: boolean
  popular: boolean
  isNew: boolean
  certificate: boolean
  image?: string
  icon?: string
  gradient: string
  tags: string[]
}

interface CursoCardProps {
  curso: CursoCardData
  actionLabel: string
  onAction: (courseId: string) => void
}

function accessLabel(access: CursoCardData["access"]) {
  if (access === "pago") return "De pago"
  if (access === "clave") return "Con clave"
  return "Gratis"
}

export default function CursoCard({ curso, actionLabel, onAction }: CursoCardProps) {
  return (
    <article className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#09111f]/88 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
      <div className="relative h-52 overflow-hidden" style={{ background: curso.gradient }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_58%)]" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#08111b]/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            <GraduationCap className="h-3.5 w-3.5 text-primary" />
            {curso.category}
          </div>

          <div className="flex flex-wrap justify-end gap-1.5">
            {curso.featured ? (
              <span className="rounded-full bg-[#f59e0b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08111b]">
                Destacado
              </span>
            ) : null}
            {curso.popular ? (
              <span className="rounded-full bg-[#38bdf8] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08111b]">
                Popular
              </span>
            ) : null}
            {curso.isNew ? (
              <span className="rounded-full bg-emerald-400 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08111b]">
                Nuevo
              </span>
            ) : null}
          </div>
        </div>

        <div className="absolute inset-0 flex items-center justify-center p-8">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[26px] border border-white/20 bg-white/10 backdrop-blur-sm shadow-[0_14px_40px_rgba(0,0,0,0.22)]">
            {curso.image ? (
              <Image
                src={curso.image}
                alt={curso.title}
                width={96}
                height={96}
                className="h-full w-full object-cover"
              />
            ) : (
              <SiteIconGlyph
                name={curso.icon}
                fallback="book-open"
                size={42}
                className="text-white"
              />
            )}
          </div>
        </div>

        <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-full border border-white/12 bg-[#08111b]/58 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">
          <span>{accessLabel(curso.access)}</span>
          <span className="h-1 w-1 rounded-full bg-white/35" />
          <span>{curso.priceLabel}</span>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <div className="flex items-center gap-2 text-xs text-white/45">
            <User2 className="h-3.5 w-3.5" />
            <span className="line-clamp-1">{curso.instructor || "Equipo Hack Evans"}</span>
          </div>

          <h3 className="mt-3 text-xl font-semibold tracking-[-0.03em] text-white">{curso.title}</h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/62">
            {curso.subtitle || curso.description}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/38">Clases</div>
            <div className="mt-1 text-sm font-semibold text-white">{curso.lessons}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/38">Duracion</div>
            <div className="mt-1 text-sm font-semibold text-white">{curso.durationLabel}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-3">
            <div className="text-[10px] uppercase tracking-[0.16em] text-white/38">Nivel</div>
            <div className="mt-1 line-clamp-1 text-sm font-semibold text-white">{curso.level}</div>
          </div>
        </div>

        {curso.tags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {curso.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1 text-xs text-white/55"
              >
                {tag}
              </span>
            ))}
          </div>
        ) : null}

        {curso.progress > 0 ? (
          <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/6 p-3">
            <div className="flex items-center justify-between gap-3 text-xs text-white/60">
              <span className="inline-flex items-center gap-2">
                <BookOpen className="h-3.5 w-3.5 text-emerald-300" />
                Tu progreso
              </span>
              <span className="font-semibold text-emerald-300">{curso.progress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#34d399,#38bdf8)]"
                style={{ width: `${Math.max(0, Math.min(curso.progress, 100))}%` }}
              />
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-white/45">
              <Clock3 className="h-3.5 w-3.5" />
              <span>{curso.durationLabel}</span>
            </div>
            {curso.certificate ? (
              <div className="flex items-center gap-2 text-xs text-amber-300">
                <Award className="h-3.5 w-3.5" />
                <span>Incluye certificado</span>
              </div>
            ) : null}
          </div>

          <button
            type="button"
            onClick={() => onAction(curso.id)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-all",
              curso.enrolled
                ? "bg-emerald-400/12 text-emerald-300 hover:bg-emerald-400/18"
                : "bg-primary text-white hover:bg-[#f14a3d]"
            )}
          >
            {actionLabel}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}
