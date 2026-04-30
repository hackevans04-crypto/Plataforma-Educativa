"use client"

import { useEffect, useState } from "react"
import { ArrowRight, CheckCircle2, CirclePlay } from "lucide-react"
import StudioInlineText from "@/components/studio/studio-inline-text"
import AnimatedShaderSurface from "@/components/ui/animated-shader-surface"
import { SiteIconGlyph } from "@/components/ui/site-icon-glyph"
import type { CMSTextStyle } from "@/hooks/use-cms"
import { withAlpha } from "@/lib/color-utils"

interface PageHeroSectionProps {
  data: Record<string, any>
  onGetStarted?: () => void
  onWatchDemo?: () => void
  editMode?: boolean
  onFieldChange?: (field: string, value: string) => void
  onTextStyleChange?: (field: string, style: CMSTextStyle) => void
  onFeatureChange?: (index: number, value: string) => void
  onActivate?: () => void
}

interface HeroStat {
  icon?: string
  emoji?: string
  value: string
  label: string
  note?: string
}

export default function PageHeroSection({
  data,
  onGetStarted,
  onWatchDemo,
  editMode = false,
  onFieldChange,
  onTextStyleChange,
  onFeatureChange,
  onActivate,
}: PageHeroSectionProps) {
  const [vis, setVis] = useState(false)

  useEffect(() => {
    setVis(true)
  }, [])

  const accent = "#E8392A"
  const layout = data.layout || "split"
  const badge = data.badge || ""
  const badgeIcon = data.badgeIcon || data.badgeEmoji || ""
  const titulo = data.titulo || ""
  const subtitulo = data.subtitulo || ""
  const desc = data.descripcion || ""
  const features = (data.features as string[]) || []
  const ctaPri = data.ctaPrimario || ""
  const ctaPriHref = data.ctaHref || ""
  const ctaSec = data.ctaSecundario || ""
  const ctaSecHref = data.ctaSecHref || ""
  const rightPanel = data.rightPanel || "none"
  const statsTitle = data.statsTitle || ""
  const stats = (data.stats as HeroStat[]) || []
  const rightImg = data.rightImage || ""
  const textStyles = (data.textStyles as Record<string, CMSTextStyle>) || {}
  const appearance = (data.appearance as Record<string, any>) || {}
  const sectionPaddingY = Math.min(220, Math.max(64, Number(appearance.sectionPaddingY || 108)))
  const sectionPaddingX = Math.min(96, Math.max(16, Number(appearance.sectionPaddingX || 24)))
  const titleSize = Math.min(92, Math.max(36, Number(appearance.titleSize || 66)))
  const descriptionSize = Math.min(28, Math.max(14, Number(appearance.descriptionSize || 18)))
  const titleColor = appearance.titleColor
  const descriptionColor = appearance.descriptionColor
  const titleFontFamily = appearance.titleFontFamily
  const titleFontWeight = appearance.titleFontWeight
  const descriptionFontFamily = appearance.descriptionFontFamily
  const descriptionFontWeight = appearance.descriptionFontWeight
  const surfaceBg = appearance.surfaceBg || "rgba(8, 12, 22, 0.86)"
  const surfaceBorder = appearance.surfaceBorder || "rgba(148, 163, 184, 0.16)"
  const sectionGlow = appearance.glowColor || accent
  const shaderSecondary = "#ff6b4d"
  const heroShellBg = appearance.heroShellBg || "rgba(5, 10, 18, 0.74)"

  const handlePri = () => {
    if (editMode) return
    if (onGetStarted) {
      onGetStarted()
      return
    }
    if (ctaPriHref) {
      window.location.href = ctaPriHref
    }
  }

  const handleSec = () => {
    if (editMode) return
    if (onWatchDemo) {
      onWatchDemo()
      return
    }
    if (ctaSecHref) {
      window.location.href = ctaSecHref
    }
  }

  const leftBlock = (
    <div className={vis ? "animate-slide-up" : "opacity-0 translate-y-6"}>
      {badge ? (
        <div
          className="landing-badge"
          style={{
            borderColor: `${accent}35`,
            background: `linear-gradient(180deg, ${accent}20, ${accent}10)`,
            color: accent,
          }}
        >
          {badgeIcon ? (
            <span
              className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.06]"
              aria-hidden="true"
            >
              <SiteIconGlyph name={badgeIcon} fallback="sparkles" size={16} className="text-current" />
            </span>
          ) : null}
          <StudioInlineText
            as="span"
            value={badge}
            editable={editMode}
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("badge", value)}
            formatting={textStyles.badge}
            onFormattingChange={(style) => onTextStyleChange?.("badge", style)}
            className="text-sm font-semibold"
            editorClassName="min-w-[14rem] text-sm font-semibold"
            style={{ color: accent }}
            editorStyle={{ color: accent }}
          />
        </div>
      ) : null}

      {titulo ? (
        <StudioInlineText
          as="h1"
          value={titulo}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("titulo", value)}
          formatting={textStyles.titulo}
          onFormattingChange={(style) => onTextStyleChange?.("titulo", style)}
          className="landing-title mt-6 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl"
          editorClassName="landing-title mt-6 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl"
          style={{
            color: titleColor,
            fontSize: `clamp(${Math.max(36, Math.round(titleSize * 0.62))}px, 6vw, ${titleSize}px)`,
            fontFamily: titleFontFamily,
            fontWeight: titleFontWeight,
          }}
          editorStyle={{
            color: titleColor,
            fontSize: `clamp(${Math.max(34, Math.round(titleSize * 0.55))}px, 5.6vw, ${Math.max(42, titleSize - 8)}px)`,
            fontFamily: titleFontFamily,
            fontWeight: titleFontWeight,
          }}
        />
      ) : null}

      {subtitulo ? (
        <StudioInlineText
          as="h1"
          value={subtitulo}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("subtitulo", value)}
          formatting={textStyles.subtitulo}
          onFormattingChange={(style) => onTextStyleChange?.("subtitulo", style)}
          className="landing-title mt-2 text-4xl leading-[0.96] md:text-5xl lg:text-6xl"
          editorClassName="landing-title mt-2 text-4xl leading-[0.96] md:text-5xl lg:text-6xl"
          style={{ color: accent, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
          editorStyle={{ color: accent, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
        />
      ) : null}

      {desc ? (
        <StudioInlineText
          as="p"
          value={desc}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("descripcion", value)}
          formatting={textStyles.descripcion}
          onFormattingChange={(style) => onTextStyleChange?.("descripcion", style)}
          className="mt-6 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
          editorClassName="mt-6 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]"
          style={{
            color: descriptionColor,
            fontSize: descriptionSize,
            fontFamily: descriptionFontFamily,
            fontWeight: descriptionFontWeight,
          }}
          editorStyle={{
            color: descriptionColor,
            fontSize: descriptionSize,
            fontFamily: descriptionFontFamily,
            fontWeight: descriptionFontWeight,
          }}
        />
      ) : null}

      {features.length > 0 ? (
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {features.map((feature, index) => (
            <div key={index} className="landing-panel-soft rounded-[24px] p-4">
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-white/[0.05] text-primary">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <StudioInlineText
                as="span"
                value={feature}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFeatureChange?.(index, value)}
                className="text-sm leading-6 text-white/82"
                editorClassName="min-h-[3rem] text-sm leading-6 text-white/82"
              />
            </div>
          ))}
        </div>
      ) : null}

      {(ctaPri || ctaSec) ? (
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          {ctaPri ? (
            <button
              onClick={handlePri}
              className="inline-flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(232,57,42,0.28)]"
              style={{ backgroundColor: accent }}
            >
              <StudioInlineText
                as="span"
                value={ctaPri}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("ctaPrimario", value)}
                formatting={textStyles.ctaPrimario}
                onFormattingChange={(style) => onTextStyleChange?.("ctaPrimario", style)}
                allowLink={false}
                className="text-sm font-semibold text-white"
                editorClassName="min-w-[10rem] text-sm font-semibold text-white"
              />
              <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}

          {ctaSec ? (
            <button
              onClick={handleSec}
              className="inline-flex items-center justify-center gap-2 rounded-full border px-6 py-3.5 text-sm font-semibold transition-all hover:border-primary/35 hover:bg-white/[0.04]"
              style={{ borderColor: `${accent}33`, color: "#f7fbff" }}
            >
              <CirclePlay className="h-4 w-4 text-primary" />
              <StudioInlineText
                as="span"
                value={ctaSec}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("ctaSecundario", value)}
                formatting={textStyles.ctaSecundario}
                onFormattingChange={(style) => onTextStyleChange?.("ctaSecundario", style)}
                allowLink={false}
                className="text-sm font-semibold"
                editorClassName="min-w-[10rem] text-sm font-semibold"
                style={{ color: "#f7fbff" }}
                editorStyle={{ color: "#f7fbff" }}
              />
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )

  const rightBlock =
    rightPanel === "stats" ? (
      <div className={vis ? "animate-slide-up" : "opacity-0 translate-y-6"} style={{ animationDelay: "160ms" }}>
        <div
          className="landing-panel rounded-[34px] p-6 shadow-[0_30px_90px_rgba(5,10,18,0.35)]"
          style={{ backgroundColor: surfaceBg, borderColor: surfaceBorder }}
        >
          <div className="mb-5 flex items-center gap-3 rounded-[26px] border border-white/8 bg-white/[0.03] p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] text-primary">
              <SiteIconGlyph name={badgeIcon || "bar-chart"} fallback="bar-chart" size={18} className="text-current" />
            </div>
            <div>
              <div className="text-base font-semibold text-white">{statsTitle || "Resultados reales"}</div>
              <div className="text-sm text-white/45">Indicadores claros para priorizar mejor tu avance</div>
            </div>
          </div>

          <div className="space-y-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="rounded-[26px] border border-white/8 bg-white/[0.03] p-4 transition-all duration-300 hover:border-white/14 hover:bg-white/[0.045]"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/8"
                    style={{ backgroundColor: `${accent}22` }}
                  >
                    <SiteIconGlyph
                      name={stat.icon || stat.emoji}
                      fallback={index === 0 ? "users" : index === 1 ? "award" : "clipboard-list"}
                      size={18}
                      className="text-white"
                    />
                  </div>
                  <div>
                    <div className="text-2xl font-semibold tracking-[-0.04em] text-white">{stat.value}</div>
                    <div className="text-sm text-white/52">{stat.label}</div>
                    {stat.note ? <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/32">{stat.note}</div> : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : rightPanel === "image" && rightImg ? (
      <div className={vis ? "animate-slide-up" : "opacity-0 translate-y-6"} style={{ animationDelay: "160ms" }}>
        <div className="landing-panel overflow-hidden rounded-[32px] p-3">
          <img src={rightImg} alt="" className="h-full w-full rounded-[26px] object-cover" />
        </div>
      </div>
    ) : null

  return (
    <section
      className="relative overflow-hidden"
      style={{ paddingTop: sectionPaddingY, paddingBottom: sectionPaddingY }}
    >
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(circle at top, ${withAlpha(sectionGlow, 0.14)}, transparent 56%)`,
        }}
      />
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

          <div className="relative z-10">
            {layout === "center" ? (
              <div className="mx-auto max-w-4xl text-center">{leftBlock}</div>
            ) : (
              <div className={`grid items-center gap-10 ${rightBlock ? "lg:grid-cols-[1.08fr_0.92fr]" : ""}`}>
                {leftBlock}
                {rightBlock}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
