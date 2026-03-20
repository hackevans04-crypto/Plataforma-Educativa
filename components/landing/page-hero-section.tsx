"use client"

import { useEffect, useState } from "react"
import { CheckCircle2 } from "lucide-react"
import StudioInlineText from "@/components/studio/studio-inline-text"
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
  useEffect(() => { setVis(true) }, [])

  const accent       = data.accentColor   || "#E8392A"
  const layout       = data.layout        || "split"
  const badge        = data.badge         || ""
  const badgeEmoji   = data.badgeEmoji    || ""
  const titulo       = data.titulo        || ""
  const subtitulo    = data.subtitulo     || ""
  const desc         = data.descripcion   || ""
  const features     = (data.features as string[]) || []
  const ctaPri       = data.ctaPrimario   || ""
  const ctaPriHref   = data.ctaHref       || ""
  const ctaSec       = data.ctaSecundario || ""
  const ctaSecHref   = data.ctaSecHref    || ""
  const rightPanel   = data.rightPanel    || "none"
  const statsTitle   = data.statsTitle    || ""
  const stats        = (data.stats as { emoji: string; value: string; label: string }[]) || []
  const rightImg     = data.rightImage    || ""
  const textStyles   = (data.textStyles as Record<string, CMSTextStyle>) || {}
  const appearance   = (data.appearance as Record<string, any>) || {}
  const sectionPaddingY = Math.min(220, Math.max(56, Number(appearance.sectionPaddingY || 96)))
  const sectionPaddingX = Math.min(96, Math.max(16, Number(appearance.sectionPaddingX || 24)))
  const titleSize = Math.min(92, Math.max(36, Number(appearance.titleSize || 64)))
  const descriptionSize = Math.min(28, Math.max(14, Number(appearance.descriptionSize || 18)))
  const titleColor = appearance.titleColor
  const descriptionColor = appearance.descriptionColor
  const titleFontFamily = appearance.titleFontFamily
  const titleFontWeight = appearance.titleFontWeight
  const descriptionFontFamily = appearance.descriptionFontFamily
  const descriptionFontWeight = appearance.descriptionFontWeight
  const surfaceBg = appearance.surfaceBg
  const surfaceBorder = appearance.surfaceBorder
  const sectionGlow = appearance.glowColor || accent

  const handlePri = () => {
    if (editMode) return
    if (onGetStarted) { onGetStarted(); return }
    if (ctaPriHref) { window.location.href = ctaPriHref }
  }
  const handleSec = () => {
    if (editMode) return
    if (onWatchDemo) { onWatchDemo(); return }
    if (ctaSecHref) { window.location.href = ctaSecHref }
  }

  const leftBlock = (
    <div className={`transition-all duration-700 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
      {badge && (
        <div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full border mb-6"
          style={{ backgroundColor: `${accent}18`, borderColor: `${accent}35` }}
        >
          <StudioInlineText
            as="span"
            value={badgeEmoji}
            editable={editMode}
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("badgeEmoji", value)}
            formatting={textStyles.badgeEmoji}
            onFormattingChange={(style) => onTextStyleChange?.("badgeEmoji", style)}
            className="text-base"
            editorClassName="min-w-[3rem] text-base"
          />
        <StudioInlineText
          as="span"
          value={badge}
          editable={editMode}
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("badge", value)}
          formatting={textStyles.badge}
          onFormattingChange={(style) => onTextStyleChange?.("badge", style)}
          className="text-xs font-bold tracking-[0.2em] uppercase"
          editorClassName="min-w-[14rem] text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: accent }}
          editorStyle={{ color: accent }}
        />
        </div>
      )}

      {titulo && (
        <StudioInlineText
          as="h1"
          value={titulo}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("titulo", value)}
          formatting={textStyles.titulo}
          onFormattingChange={(style) => onTextStyleChange?.("titulo", style)}
          className="font-display text-4xl md:text-5xl lg:text-6xl text-foreground leading-[1.1] mb-1"
          editorClassName="font-display text-3xl md:text-5xl text-foreground leading-[1.1]"
          style={{ color: titleColor, fontSize: `clamp(${Math.max(34, Math.round(titleSize * 0.58))}px, 5.2vw, ${titleSize}px)`, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
          editorStyle={{ color: titleColor, fontSize: `clamp(${Math.max(30, Math.round(titleSize * 0.48))}px, 4.8vw, ${Math.max(36, titleSize - 8)}px)`, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
        />
      )}
      {subtitulo && (
        <StudioInlineText
          as="h1"
          value={subtitulo}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("subtitulo", value)}
          formatting={textStyles.subtitulo}
          onFormattingChange={(style) => onTextStyleChange?.("subtitulo", style)}
          className="font-display text-4xl md:text-5xl lg:text-6xl leading-[1.1] mb-5"
          editorClassName="font-display text-3xl md:text-5xl leading-[1.1]"
          style={{ color: accent, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
          editorStyle={{ color: accent, fontFamily: titleFontFamily, fontWeight: titleFontWeight }}
        />
      )}
      {!subtitulo && titulo && <div className="mb-5" />}

      {desc && (
        <StudioInlineText
          as="p"
          value={desc}
          editable={editMode}
          multiline
          onActivate={onActivate}
          onChange={(value) => onFieldChange?.("descripcion", value)}
          formatting={textStyles.descripcion}
          onFormattingChange={(style) => onTextStyleChange?.("descripcion", style)}
          className="text-lg text-muted-foreground leading-relaxed max-w-xl mb-8"
          editorClassName="max-w-xl text-lg text-muted-foreground"
          style={{ color: descriptionColor, fontSize: descriptionSize, fontFamily: descriptionFontFamily, fontWeight: descriptionFontWeight }}
          editorStyle={{ color: descriptionColor, fontSize: descriptionSize, fontFamily: descriptionFontFamily, fontWeight: descriptionFontWeight }}
        />
      )}

      {features.length > 0 && (
        <ul className="space-y-3 mb-8">
          {features.map((f, i) => (
            <li key={i} className="flex items-center gap-3 text-foreground">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <StudioInlineText
                as="span"
                value={f}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFeatureChange?.(i, value)}
                className="flex-1"
              />
            </li>
          ))}
        </ul>
      )}

      {(ctaPri || ctaSec) && (
        <div className="flex flex-col sm:flex-row gap-4">
          {ctaPri && (
            <button
              onClick={handlePri}
              className="flex items-center justify-center gap-2 px-7 py-3.5 text-white font-bold rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-lg"
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
                editorClassName="min-w-[10rem] text-sm font-bold text-white"
              />
            </button>
          )}
          {ctaSec && (
            <button
              onClick={handleSec}
              className="flex items-center justify-center gap-2 px-7 py-3.5 border border-border text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-all"
            >
              <StudioInlineText
                as="span"
                value={ctaSec}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("ctaSecundario", value)}
                formatting={textStyles.ctaSecundario}
                onFormattingChange={(style) => onTextStyleChange?.("ctaSecundario", style)}
                allowLink={false}
                editorClassName="min-w-[10rem] text-sm font-semibold text-foreground"
              />
            </button>
          )}
        </div>
      )}
    </div>
  )

  const rightBlock =
    rightPanel === "stats" ? (
      <div className={`transition-all duration-700 delay-150 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div
          className="rounded-2xl border border-border bg-card/80 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          style={{ backgroundColor: surfaceBg, borderColor: surfaceBorder }}
        >
          {statsTitle && (
            <div className="text-sm font-semibold text-muted-foreground mb-4 uppercase tracking-[0.2em]">
              {statsTitle}
            </div>
          )}
          <div className="space-y-4">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-4 rounded-xl border border-border/70 bg-secondary/20 px-4 py-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${accent}20` }}
                >
                  {s.emoji}
                </div>
                <div>
                  <div className="text-xl font-bold text-foreground">{s.value}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ) : rightPanel === "image" && rightImg ? (
      <div className={`transition-all duration-700 delay-150 ${vis ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
        <div className="rounded-2xl overflow-hidden border border-border">
          <img src={rightImg} alt="" className="w-full object-cover" />
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
        style={{ background: `radial-gradient(circle at top, ${withAlpha(sectionGlow, 0.16)}, transparent 55%)` }}
      />
      <div
        className="max-w-7xl mx-auto relative"
        style={{ paddingLeft: sectionPaddingX, paddingRight: sectionPaddingX }}
      >
        {layout === "center" ? (
          <div className="text-center max-w-3xl mx-auto">
            {leftBlock}
          </div>
        ) : (
          <div className={`grid ${rightBlock ? "lg:grid-cols-[1.15fr_0.85fr]" : ""} gap-12 items-center`}>
            {leftBlock}
            {rightBlock}
          </div>
        )}
      </div>
    </section>
  )
}
