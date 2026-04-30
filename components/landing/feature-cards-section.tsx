"use client"

import { useEffect, useState } from "react"
import StudioInlineText from "@/components/studio/studio-inline-text"
import { SiteIconGlyph } from "@/components/ui/site-icon-glyph"

interface FeatureCardItem {
  id: string
  icon?: string
  emoji?: string
  title: string
  description: string
  accentColor?: string
}

interface FeatureCardsSectionProps {
  data: Record<string, any>
  editMode?: boolean
  onActivate?: () => void
  onFieldChange?: (field: "titulo" | "descripcion" | "eyebrow", value: string) => void
  onItemChange?: (index: number, patch: Partial<FeatureCardItem>) => void
}

export default function FeatureCardsSection({
  data,
  editMode = false,
  onActivate,
  onFieldChange,
  onItemChange,
}: FeatureCardsSectionProps) {
  const [vis, setVis] = useState(false)

  useEffect(() => {
    setVis(true)
  }, [])

  const titulo = data.titulo || ""
  const descripcion = data.descripcion || ""
  const eyebrow = data.eyebrow || ""
  const items = (data.items as FeatureCardItem[]) || []
  const columns = data.columns || 3
  const appearance = (data.appearance as Record<string, any>) || {}
  const headingTitleColor = appearance.headingTitleColor
  const headingDescriptionColor = appearance.headingDescriptionColor
  const headingFontFamily = appearance.headingFontFamily
  const headingFontWeight = appearance.headingFontWeight
  const cardBg = appearance.cardBg
  const cardBorder = appearance.cardBorder
  const titleColor = appearance.titleColor
  const descriptionColor = appearance.descriptionColor
  const cardTitleFontFamily = appearance.cardTitleFontFamily
  const cardTitleFontWeight = appearance.cardTitleFontWeight
  const cardDescriptionFontFamily = appearance.cardDescriptionFontFamily
  const cardDescriptionFontWeight = appearance.cardDescriptionFontWeight
  const cardPadding = Math.min(48, Math.max(18, Number(appearance.cardPadding || 24)))
  const paddingY = Math.min(180, Math.max(54, Number(appearance.sectionPaddingY || 76)))

  const colsClass =
    columns === 2 ? "grid-cols-1 md:grid-cols-2" :
    columns === 4 ? "grid-cols-2 md:grid-cols-4" :
                    "grid-cols-1 md:grid-cols-3"

  return (
    <section className="relative overflow-hidden" style={{ paddingTop: paddingY, paddingBottom: paddingY }}>
      <div className="landing-container relative">
        {(eyebrow || titulo || descripcion) ? (
          <div className={vis ? "animate-slide-up" : "opacity-0 translate-y-6"}>
            {eyebrow ? (
              <div className="mb-4 flex justify-center">
                <StudioInlineText
                  as="span"
                  value={eyebrow}
                  editable={editMode}
                  onActivate={onActivate}
                  onChange={(value) => onFieldChange?.("eyebrow", value)}
                  className="inline-flex rounded-full border border-primary/18 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary"
                  editorClassName="inline-flex min-w-[10rem] rounded-full text-center text-xs font-bold uppercase tracking-[0.24em] text-primary"
                />
              </div>
            ) : null}
            {titulo ? (
              <StudioInlineText
                as="h2"
                value={titulo}
                editable={editMode}
                multiline
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("titulo", value)}
                className="landing-title text-center text-4xl leading-[0.96] text-white md:text-5xl"
                editorClassName="landing-title mx-auto max-w-4xl text-center text-4xl leading-[0.96] text-white md:text-5xl"
                style={{ color: headingTitleColor, fontFamily: headingFontFamily, fontWeight: headingFontWeight }}
                editorStyle={{ color: headingTitleColor, fontFamily: headingFontFamily, fontWeight: headingFontWeight }}
              />
            ) : null}

            {descripcion ? (
              <StudioInlineText
                as="p"
                value={descripcion}
                editable={editMode}
                multiline
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("descripcion", value)}
                className="mx-auto mt-5 max-w-3xl text-center text-lg leading-8 text-[var(--he-landing-muted)]"
                editorClassName="mx-auto mt-5 max-w-3xl text-center text-lg leading-8 text-[var(--he-landing-muted)]"
                style={{ color: headingDescriptionColor, fontFamily: headingFontFamily, fontWeight: cardDescriptionFontWeight }}
                editorStyle={{ color: headingDescriptionColor, fontFamily: headingFontFamily, fontWeight: cardDescriptionFontWeight }}
              />
            ) : null}
          </div>
        ) : null}

        {items.length === 0 ? (
          <div className="landing-panel-soft mt-8 rounded-[30px] px-8 py-12 text-center text-sm text-white/52">
            Agrega tarjetas desde el editor para poblar esta seccion.
          </div>
        ) : (
          <div className={`mt-10 grid ${colsClass} gap-5`}>
            {items.map((item, index) => {
              const color = item.accentColor || "#E8392A"
              return (
                <div
                  key={item.id}
                  className={vis ? "animate-slide-up" : "opacity-0 translate-y-6"}
                  style={{ animationDelay: `${index * 90}ms` }}
                >
                  <div
                    className={index === 0 ? "landing-panel rounded-[30px]" : "landing-panel-soft rounded-[30px]"}
                    style={{
                      backgroundColor: cardBg,
                      borderColor: cardBorder,
                      padding: cardPadding,
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {(item.icon || item.emoji) ? (
                        <div
                          className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/8"
                          style={{ backgroundColor: `${color}20` }}
                        >
                          <SiteIconGlyph
                            name={item.icon || item.emoji}
                            fallback={index === 0 ? "sparkles" : index === 1 ? "bar-chart" : "shield"}
                            size={20}
                            className="text-white"
                          />
                        </div>
                      ) : null}
                      <div className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/36">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                    </div>

                    {item.title ? (
                      <StudioInlineText
                        as="h3"
                        value={item.title}
                        editable={editMode}
                        multiline
                        onActivate={onActivate}
                        onChange={(value) => onItemChange?.(index, { title: value })}
                        className="mt-5 text-2xl font-semibold tracking-[-0.03em] text-white"
                        editorClassName="mt-5 text-2xl font-semibold tracking-[-0.03em] text-white"
                        style={{ color: titleColor, fontFamily: cardTitleFontFamily, fontWeight: cardTitleFontWeight }}
                        editorStyle={{ color: titleColor, fontFamily: cardTitleFontFamily, fontWeight: cardTitleFontWeight }}
                      />
                    ) : null}

                    {item.description ? (
                      <StudioInlineText
                        as="p"
                        value={item.description}
                        editable={editMode}
                        multiline
                        onActivate={onActivate}
                        onChange={(value) => onItemChange?.(index, { description: value })}
                        className="mt-4 text-sm leading-7 text-white/58"
                        editorClassName="mt-4 text-sm leading-7 text-white/58"
                        style={{ color: descriptionColor, fontFamily: cardDescriptionFontFamily, fontWeight: cardDescriptionFontWeight }}
                        editorStyle={{ color: descriptionColor, fontFamily: cardDescriptionFontFamily, fontWeight: cardDescriptionFontWeight }}
                      />
                    ) : null}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
