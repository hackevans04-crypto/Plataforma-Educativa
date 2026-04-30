"use client"

import Link from "next/link"
import {
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutGrid,
  Sparkles,
  Target,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSSection } from "@/hooks/use-cms"
import type { LandingBuilderItem } from "@/hooks/use-landing-builder-data"
import StudioInlineText from "@/components/studio/studio-inline-text"

const SECTION_COPY = {
  simulatorsFeed: {
    badge: "Simuladores",
    title: "Practica con simuladores listos para competir",
    description: "Activa experiencias reales de examen con bloques conectados desde el admin.",
    button: "Abrir simulador",
    cta: "Ver simuladores",
    href: "/simulador",
    icon: Target,
  },
  coursesFeed: {
    badge: "Cursos",
    title: "Cursos conectados al crecimiento docente",
    description: "Publica rutas de aprendizaje premium y muestralas con una presentacion mas editorial.",
    button: "Ver curso",
    cta: "Explorar cursos",
    href: "/cursos",
    icon: GraduationCap,
  },
  evaluationsFeed: {
    badge: "Evaluaciones",
    title: "Evaluaciones activas para seguimiento real",
    description: "Integra evaluaciones desde el admin y usalas como parte del embudo principal.",
    button: "Abrir evaluacion",
    cta: "Ver evaluaciones",
    href: "/dashboard/evaluaciones",
    icon: ClipboardCheck,
  },
} as const

function cardColumns(columns: number) {
  if (columns === 2) return "lg:grid-cols-2"
  if (columns === 4) return "lg:grid-cols-4"
  return "lg:grid-cols-3"
}

interface DynamicFeedSectionProps {
  section: CMSSection
  items: LandingBuilderItem[]
  editing?: boolean
  editMode?: boolean
  onActivate?: () => void
  onFieldChange?: (field: string, value: string) => void
  onCtaAction?: () => void
}

export default function DynamicFeedSection({
  section,
  items,
  editing = false,
  editMode = false,
  onActivate,
  onFieldChange,
  onCtaAction,
}: DynamicFeedSectionProps) {
  const copy = SECTION_COPY[section.type as keyof typeof SECTION_COPY]
  if (!copy) return null

  const source = section.settings?.source
  const title = section.data?.titulo || copy.title
  const description = section.data?.descripcion || copy.description
  const badge = section.data?.badge || copy.badge
  const ctaLabel = section.data?.ctaLabel || copy.cta
  const ctaHref = section.data?.ctaHref || copy.href
  const display = source?.display || "grid"
  const columns = Math.min(4, Math.max(2, Number(source?.columns || 3)))
  const showMeta = source?.showMeta !== false
  const showButton = source?.showButton !== false
  const showBadge = source?.showBadge !== false
  const Icon = copy.icon

  return (
    <section className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute left-[6%] top-14 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[8%] top-16 h-72 w-72 rounded-full bg-[#38bdf8]/7 blur-3xl" />
      </div>

      <div className="landing-container relative">
        <div className="grid gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
          <div>
            <div className="landing-badge">
              <Icon className="h-4 w-4" />
              <StudioInlineText
                as="span"
                value={badge}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("badge", value)}
                className="text-sm font-semibold"
                editorClassName="min-w-[10rem] text-sm font-semibold"
              />
            </div>

            <StudioInlineText
              as="h2"
              value={title}
              editable={editMode}
              multiline
              onActivate={onActivate}
              onChange={(value) => onFieldChange?.("titulo", value)}
              className="landing-title mt-5 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl"
              editorClassName="landing-title mt-5 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl"
            />
            <StudioInlineText
              as="p"
              value={description}
              editable={editMode}
              multiline
              onActivate={onActivate}
              onChange={(value) => onFieldChange?.("descripcion", value)}
              className="mt-5 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
              editorClassName="mt-5 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
            />
          </div>

          <div className="landing-panel rounded-[32px] p-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="landing-kicker">Bloque conectado</div>
                <div className="mt-2 text-xl font-semibold text-white">
                  {items.length} elemento{items.length === 1 ? "" : "s"} disponible{items.length === 1 ? "" : "s"} para esta seccion.
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                  <LayoutGrid className="h-3.5 w-3.5 text-primary" />
                  {display === "carousel" ? "Modo carousel" : "Modo grid"}
                </div>

                {onCtaAction ? (
                  <button
                    type="button"
                    onClick={onCtaAction}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                  >
                    <StudioInlineText
                      as="span"
                      value={ctaLabel}
                      editable={editMode}
                      onActivate={onActivate}
                      onChange={(value) => onFieldChange?.("ctaLabel", value)}
                      className="text-sm font-semibold text-white"
                      editorClassName="min-w-[10rem] text-sm font-semibold text-white"
                    />
                    <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <Link
                    href={ctaHref}
                    onClick={editing ? (event) => event.preventDefault() : undefined}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white"
                  >
                    <StudioInlineText
                      as="span"
                      value={ctaLabel}
                      editable={editMode}
                      onActivate={onActivate}
                      onChange={(value) => onFieldChange?.("ctaLabel", value)}
                      className="text-sm font-semibold text-white"
                      editorClassName="min-w-[10rem] text-sm font-semibold text-white"
                    />
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="landing-panel-soft mt-8 rounded-[32px] px-8 py-14 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[22px] bg-white/[0.04] text-primary">
              <Icon className="h-6 w-6" />
            </div>
            <div className="mt-5 text-2xl font-semibold text-white">
              {editing ? "Este bloque todavia no tiene contenido conectado" : "Sin contenido disponible por ahora"}
            </div>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-white/52">
              {editing
                ? "Publica simuladores, cursos o evaluaciones desde el admin para llenar este bloque automaticamente."
                : "Cuando el administrador publique nuevos elementos, apareceran aqui con el mismo estilo premium de la portada."}
            </p>
          </div>
        ) : (
          <div
            className={cn(
              "mt-8",
              display === "carousel"
                ? "flex snap-x gap-5 overflow-x-auto pb-2"
                : `grid gap-5 md:grid-cols-2 ${cardColumns(columns)}`
            )}
          >
            {items.map((item) => (
              <article
                key={item.id}
                className={cn(
                  "group overflow-hidden rounded-[30px]",
                  display === "carousel" && "min-w-[320px] snap-start md:min-w-[360px]"
                )}
              >
                <div className="landing-panel-soft h-full rounded-[30px] p-6 transition-all duration-300 group-hover:-translate-y-1 group-hover:border-primary/25">
                  <div className="flex items-start justify-between gap-4">
                    <div
                      className="flex h-14 w-14 items-center justify-center rounded-[20px] text-2xl"
                      style={{ backgroundColor: `${item.accentColor || "#E8392A"}18` }}
                    >
                      {item.emoji || "✨"}
                    </div>

                    {showBadge && item.badge ? (
                      <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/55">
                        {item.badge}
                      </span>
                    ) : null}
                  </div>

                  {item.category ? (
                    <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
                      {item.category}
                    </div>
                  ) : null}

                  <h3 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-white">
                    {item.title}
                  </h3>
                  {item.subtitle ? (
                    <div className="mt-2 text-sm text-white/45">{item.subtitle}</div>
                  ) : null}
                  <p className="mt-4 text-sm leading-7 text-white/58">{item.description}</p>

                  {showMeta ? (
                    <div className="mt-6 grid gap-3 sm:grid-cols-3">
                      {item.metrics.slice(0, 3).map((metric) => (
                        <div
                          key={metric.key}
                          className="rounded-[20px] border border-white/8 bg-white/[0.03] px-3 py-3"
                        >
                          <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-white/35">
                            {metric.label}
                          </div>
                          <div className="mt-2 text-sm font-semibold text-white">{metric.value}</div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {showButton ? (
                    <div className="mt-6">
                      <Link
                        href={item.href}
                        onClick={editing ? (event) => event.preventDefault() : undefined}
                        className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-white transition-all hover:border-primary/30 hover:bg-primary/10"
                      >
                        {copy.button}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
