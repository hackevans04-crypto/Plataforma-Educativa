"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  CirclePlay,
  Clock3,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
} from "lucide-react"
import { useCMS, type CMSHeroConfig, type CMSTextStyle } from "@/hooks/use-cms"
import AnimatedShaderSurface from "@/components/ui/animated-shader-surface"
import StudioInlineText from "@/components/studio/studio-inline-text"
import { withAlpha } from "@/lib/color-utils"

interface HeroSectionProps {
  onGetStarted?: () => void
  onWatchDemo?: () => void
  dataOverride?: CMSHeroConfig
  editMode?: boolean
  onFieldChange?: (
    field: keyof Pick<CMSHeroConfig, "badge" | "titulo" | "descripcion" | "ctaPrimario" | "ctaSecundario">,
    value: string
  ) => void
  onTextStyleChange?: (field: "badge" | "titulo" | "descripcion" | "ctaPrimario" | "ctaSecundario", style: CMSTextStyle) => void
  onFeatureChange?: (index: number, value: string) => void
  onActivate?: () => void
}

const STAT_ICONS = [Users, Trophy, BookOpen]
const INSIGHT_BARS = [
  { label: "Pedagogia", value: "92%", width: "92%", color: "#34d399" },
  { label: "Curriculo", value: "87%", width: "87%", color: "#38bdf8" },
  { label: "Normativa", value: "78%", width: "78%", color: "#fbbf24" },
]

export default function HeroSection({
  onGetStarted,
  onWatchDemo,
  dataOverride,
  editMode = false,
  onFieldChange,
  onTextStyleChange,
  onFeatureChange,
  onActivate,
}: HeroSectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const { config } = useCMS()
  const hero = dataOverride ?? config.hero
  const textStyles = hero.textStyles ?? {}
  const appearance = hero.appearance ?? {}
  const accent = appearance.primaryButtonBg || "#E8392A"
  const accentText = appearance.primaryButtonText || "#ffffff"
  const secondaryBorder = appearance.secondaryButtonBorder || "rgba(148, 163, 184, 0.16)"
  const secondaryText = appearance.secondaryButtonText || "#f8fbff"
  const badgeColor = appearance.badgeColor || accent
  const titleColor = appearance.titleColor
  const descriptionColor = appearance.descriptionColor
  const surfaceBg = appearance.surfaceBg || "rgba(8, 12, 22, 0.88)"
  const surfaceBorder = appearance.surfaceBorder || "rgba(148, 163, 184, 0.16)"
  const sectionPaddingY = Math.min(180, Math.max(86, Number(appearance.sectionPaddingY || 112)))
  const sectionPaddingX = Math.min(72, Math.max(24, Number(appearance.sectionPaddingX || 24)))
  const titleSize = Math.min(104, Math.max(46, Number(appearance.titleSize || 74)))
  const descriptionSize = Math.min(28, Math.max(16, Number(appearance.descriptionSize || 18)))
  const shaderSecondary = appearance.shaderSecondaryColor || "#38bdf8"
  const heroShellBg = appearance.heroShellBg || "rgba(5, 10, 18, 0.74)"

  useEffect(() => {
    setIsVisible(true)
  }, [])

  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: sectionPaddingY, paddingBottom: sectionPaddingY }}
    >
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-0 h-72 w-72 rounded-full bg-[rgba(56,189,248,0.08)] blur-3xl" />
        <div className="absolute right-[10%] top-[18%] h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-white/[0.03] blur-3xl" />
        <div className="absolute inset-x-0 top-16 h-px bg-gradient-to-r from-transparent via-white/12 to-transparent" />
      </div>

      <div
        className="landing-container relative"
        style={{ paddingLeft: sectionPaddingX, paddingRight: sectionPaddingX }}
      >
        <div
          className="relative overflow-hidden rounded-[40px] border px-6 py-8 shadow-[0_34px_110px_rgba(0,0,0,0.34)] md:px-8 md:py-10 lg:px-10"
          style={{
            backgroundColor: heroShellBg,
            borderColor: `${accent}20`,
            boxShadow: `0 34px 110px rgba(0,0,0,0.34), 0 0 0 1px ${withAlpha(accent, 0.06)}`,
          }}
        >
          <AnimatedShaderSurface accentColor={accent} secondaryColor={shaderSecondary} />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(5,10,18,0.08),rgba(5,10,18,0.42)_48%,rgba(5,10,18,0.78))]" />
          <div
            className="absolute -left-16 top-10 h-56 w-56 rounded-full blur-3xl"
            style={{ backgroundColor: withAlpha(accent, 0.18) }}
          />
          <div
            className="absolute -right-10 top-0 h-64 w-64 rounded-full blur-3xl"
            style={{ backgroundColor: withAlpha(shaderSecondary, 0.14) }}
          />
          <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

          <div className="relative z-10 grid items-center gap-12 lg:grid-cols-[1.02fr_0.98fr] xl:gap-16">
            <div
              className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
              style={{ animationDelay: "80ms" }}
            >
              <div
                className="landing-badge"
                style={{
                  borderColor: `${badgeColor}35`,
                  background: `linear-gradient(180deg, ${badgeColor}20, ${badgeColor}10)`,
                  color: badgeColor,
                }}
              >
                <Sparkles className="h-4 w-4" />
                <StudioInlineText
                  as="span"
                  value={hero.badge}
                  editable={editMode}
                  onActivate={onActivate}
                  onChange={(value) => onFieldChange?.("badge", value)}
                  formatting={textStyles.badge}
                  onFormattingChange={(style) => onTextStyleChange?.("badge", style)}
                  className="text-sm font-semibold"
                  editorClassName="min-w-[14rem] text-sm font-semibold"
                  style={{ color: badgeColor }}
                  editorStyle={{ color: badgeColor }}
                />
              </div>

              <StudioInlineText
                as="h1"
                value={hero.titulo}
                editable={editMode}
                multiline
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("titulo", value)}
                formatting={textStyles.titulo}
                onFormattingChange={(style) => onTextStyleChange?.("titulo", style)}
                className="landing-title mt-7 max-w-3xl text-[clamp(3.2rem,6vw,6.5rem)] leading-[0.94] text-[var(--he-landing-text)]"
                editorClassName="landing-title max-w-3xl text-4xl leading-[0.94] text-[var(--he-landing-text)] md:text-6xl"
                style={{
                  color: titleColor,
                  fontSize: `clamp(${Math.max(48, Math.round(titleSize * 0.62))}px, 7vw, ${titleSize}px)`,
                }}
                editorStyle={{
                  color: titleColor,
                  fontSize: `clamp(${Math.max(38, Math.round(titleSize * 0.5))}px, 6vw, ${Math.max(48, titleSize - 12)}px)`,
                }}
              />

              <StudioInlineText
                as="p"
                value={hero.descripcion}
                editable={editMode}
                multiline
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("descripcion", value)}
                formatting={textStyles.descripcion}
                onFormattingChange={(style) => onTextStyleChange?.("descripcion", style)}
                className="mt-6 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
                editorClassName="max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
                style={{ color: descriptionColor, fontSize: descriptionSize }}
                editorStyle={{ color: descriptionColor, fontSize: descriptionSize }}
              />

              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {hero.features.map((feature, index) => (
                  <div
                    key={index}
                    className="landing-panel-soft rounded-[24px] p-4"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.06] text-primary">
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <StudioInlineText
                      as="span"
                      value={feature}
                      editable={editMode}
                      onActivate={onActivate}
                      onChange={(value) => onFeatureChange?.(index, value)}
                      className="block text-sm font-medium leading-6 text-white/85"
                      editorClassName="block min-h-[3rem] text-sm font-medium leading-6 text-white/85"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={onGetStarted}
                  className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_38px_rgba(232,57,42,0.28)]"
                  style={{
                    background: `linear-gradient(135deg, ${accent} 0%, #ff6b5e 100%)`,
                    color: accentText,
                  }}
                >
                  <StudioInlineText
                    as="span"
                    value={hero.ctaPrimario}
                    editable={editMode}
                    onActivate={onActivate}
                    onChange={(value) => onFieldChange?.("ctaPrimario", value)}
                    formatting={textStyles.ctaPrimario}
                    onFormattingChange={(style) => onTextStyleChange?.("ctaPrimario", style)}
                    allowLink={false}
                    className="text-sm font-semibold"
                    editorClassName="min-w-[10rem] text-sm font-semibold"
                    style={{ color: accentText }}
                    editorStyle={{ color: accentText }}
                  />
                  <ArrowRight className="h-4 w-4" />
                </button>

                <button
                  onClick={onWatchDemo}
                  className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition-all hover:border-primary/35 hover:bg-white/[0.04]"
                  style={{ borderColor: secondaryBorder, color: secondaryText }}
                >
                  <CirclePlay className="h-4 w-4 text-primary" />
                  <StudioInlineText
                    as="span"
                    value={hero.ctaSecundario}
                    editable={editMode}
                    onActivate={onActivate}
                    onChange={(value) => onFieldChange?.("ctaSecundario", value)}
                    formatting={textStyles.ctaSecundario}
                    onFormattingChange={(style) => onTextStyleChange?.("ctaSecundario", style)}
                    allowLink={false}
                    className="text-sm font-semibold"
                    editorClassName="min-w-[10rem] text-sm font-semibold"
                    style={{ color: secondaryText }}
                    editorStyle={{ color: secondaryText }}
                  />
                </button>
              </div>

              <div className="mt-10 grid gap-3 lg:grid-cols-[1.15fr_0.85fr]">
                <div className="landing-panel-soft rounded-[26px] px-5 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="landing-kicker">Confianza</div>
                      <div className="mt-2 text-base font-semibold text-white">
                        Miles de docentes usan la plataforma para llegar listos al examen.
                      </div>
                    </div>
                    <div className="flex -space-x-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div
                          key={item}
                          className="flex h-11 w-11 items-center justify-center rounded-full border border-[#07101c] bg-white/10 text-sm font-semibold text-white/75"
                        >
                          {String.fromCharCode(64 + item)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="landing-panel-soft rounded-[26px] px-5 py-4">
                  <div className="landing-kicker">Sesion</div>
                  <div className="mt-2 flex items-center gap-2 text-lg font-semibold text-white">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                    124 docentes conectados
                  </div>
                  <div className="mt-2 text-sm text-white/55">
                    Preparando QSM 2026 ahora mismo.
                  </div>
                </div>
              </div>

              <div className="mt-10 grid gap-3 sm:grid-cols-3">
                {hero.stats.map((stat, index) => {
                  const Icon = STAT_ICONS[index] ?? Users
                  return (
                    <div key={index} className="landing-panel-soft rounded-[26px] p-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-primary">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="mt-5 text-3xl font-semibold tracking-[-0.04em] text-white">
                        {stat.value}
                      </div>
                      <div className="mt-1 text-sm text-white/55">{stat.label}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
              style={{ animationDelay: "180ms" }}
            >
              <div
                className="landing-panel relative rounded-[34px] p-4 md:p-5"
                style={{ backgroundColor: surfaceBg, borderColor: surfaceBorder }}
              >
                <div className="absolute -right-4 top-8 hidden rounded-[24px] border border-white/10 bg-[#08111b]/92 px-4 py-3 shadow-[0_28px_60px_rgba(0,0,0,0.35)] md:block">
                  <div className="landing-kicker">En vivo</div>
                  <div className="mt-2 flex items-center gap-2 text-base font-semibold text-white">
                    <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse-dot" />
                    Cohorte activa
                  </div>
                  <div className="mt-1 text-sm text-white/50">Convocatoria 2026</div>
                </div>

                <div className="grid gap-4 xl:grid-cols-[1.05fr_0.72fr]">
                  <div className="rounded-[28px] border border-white/10 bg-[#09111f]/88 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <BookOpen className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-base font-semibold text-white">Simulador oficial QSM</div>
                          <div className="mt-1 text-sm text-white/50">Sesion activa y guardado automatico</div>
                        </div>
                      </div>

                      <div className="rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-300">
                        75% completado
                      </div>
                    </div>

                    <div className="mt-6">
                      <div className="mb-2 flex items-center justify-between text-sm">
                        <span className="text-white/45">Avance del intento</span>
                        <span className="font-semibold text-white">Pregunta 15 de 20</span>
                      </div>
                      <div className="h-2.5 overflow-hidden rounded-full bg-white/[0.06]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: "75%",
                            background: "linear-gradient(90deg, #E8392A 0%, #ff6b5e 45%, #38bdf8 100%)",
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 rounded-[26px] border border-white/8 bg-white/[0.02] p-5">
                      <div className="landing-kicker">Pregunta actual</div>
                      <p className="mt-3 text-[1.05rem] font-medium leading-8 text-white">
                        Segun el curriculo nacional, cual es el enfoque pedagogico principal en la educacion basica?
                      </p>

                      <div className="mt-5 space-y-2.5">
                        {[
                          { label: "A", text: "Constructivismo", active: true },
                          { label: "B", text: "Conductismo" },
                          { label: "C", text: "Cognitivismo" },
                          { label: "D", text: "Conectivismo" },
                        ].map((option) => (
                          <div
                            key={option.label}
                            className="flex items-center gap-3 rounded-[22px] border px-4 py-3"
                            style={{
                              borderColor: option.active ? "rgba(52, 211, 153, 0.3)" : "rgba(148, 163, 184, 0.12)",
                              background: option.active ? "rgba(52, 211, 153, 0.1)" : "rgba(255,255,255,0.02)",
                            }}
                          >
                            <div
                              className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold"
                              style={{
                                backgroundColor: option.active ? "#34d399" : "rgba(255,255,255,0.06)",
                                color: option.active ? "#04121a" : "#ffffff",
                              }}
                            >
                              {option.label}
                            </div>
                            <div className={option.active ? "font-semibold text-emerald-300" : "text-white/72"}>
                              {option.text}
                            </div>
                            {option.active ? <CheckCircle2 className="ml-auto h-4 w-4 text-emerald-300" /> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-[26px] border border-white/10 bg-[#09111f]/88 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#38bdf8]/12 text-[#38bdf8]">
                          <BarChart3 className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Mapa de rendimiento</div>
                          <div className="text-xs text-white/45">Competencias priorizadas</div>
                        </div>
                      </div>

                      <div className="mt-5 space-y-4">
                        {INSIGHT_BARS.map((item) => (
                          <div key={item.label}>
                            <div className="mb-2 flex items-center justify-between text-sm">
                              <span className="text-white/55">{item.label}</span>
                              <span className="font-semibold text-white">{item.value}</span>
                            </div>
                            <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                              <div
                                className="h-full rounded-full"
                                style={{ width: item.width, backgroundColor: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-[26px] border border-white/10 bg-[#09111f]/88 p-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                          <BrainCircuit className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">Siguiente mejor accion</div>
                          <div className="text-xs text-white/45">Recomendacion inteligente</div>
                        </div>
                      </div>

                      <div className="mt-4 rounded-[22px] border border-primary/15 bg-primary/8 p-4">
                        <div className="text-sm font-semibold text-white">Refuerza normativa y gestion escolar</div>
                        <div className="mt-2 text-sm leading-6 text-white/60">
                          Tu nivel es alto en pedagogia. Ahora conviene consolidar normativa para subir tu puntaje global.
                        </div>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
                        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <Clock3 className="h-4 w-4 text-[#38bdf8]" />
                            Ritmo recomendado
                          </div>
                          <div className="mt-2 text-xl font-semibold text-white">25 min hoy</div>
                        </div>
                        <div className="rounded-[22px] border border-white/8 bg-white/[0.03] p-4">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <ShieldCheck className="h-4 w-4 text-emerald-400" />
                            Consistencia
                          </div>
                          <div className="mt-2 text-xl font-semibold text-white">9 dias seguidos</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
