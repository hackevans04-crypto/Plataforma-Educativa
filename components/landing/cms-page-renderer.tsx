"use client"

import { useEffect, useState } from "react"
import { CheckCircle2, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { type CMSSection, useCMS } from "@/hooks/use-cms"
import StudioInlineText from "@/components/studio/studio-inline-text"
import HeroSection from "@/components/landing/hero-section"
import BenefitsSection from "@/components/landing/benefits-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import Pricing from "@/components/pricing"
import ContactSection from "@/components/landing/contact-section"
import CTASection from "@/components/landing/cta-section"
import ImageTextSection from "@/components/landing/image-text-section"
import VideoSection from "@/components/landing/video-section"
import FAQSection from "@/components/landing/faq-section"
import TextBannerSection from "@/components/landing/text-banner-section"
import GallerySection from "@/components/landing/gallery-section"
import StatsSection from "@/components/landing/stats-section"
import CustomCodeSection from "@/components/landing/custom-code-section"
import PageHeroSection from "@/components/landing/page-hero-section"
import FeatureCardsSection from "@/components/landing/feature-cards-section"
import DynamicFeedSection from "@/components/landing/dynamic-feed-section"
import FormBuilderSection from "@/components/landing/form-builder-section"
import LandingPopupHost from "@/components/landing/landing-popup-host"
import {
  getSectionVisibilityClass,
  resolveLandingBuilderItems,
  shouldHideSectionWhenEmpty,
  shouldRenderSectionForAudience,
  useLandingBuilderData,
} from "@/hooks/use-landing-builder-data"
import { getLandingSectionDomId, useLandingActions } from "@/hooks/use-landing-actions"

interface RichTextSectionProps {
  data: Record<string, any>
  editMode?: boolean
  onActivate?: () => void
  onFieldChange?: (field: string, value: string) => void
  onPrimaryAction?: () => void
  onSecondaryAction?: () => void
}

interface LogoItem {
  id: string
  label: string
  subLabel?: string
  imageUrl?: string
  href?: string
}

interface LogoStripSectionProps {
  data: Record<string, any>
  editMode?: boolean
  onActivate?: () => void
  onFieldChange?: (field: string, value: string) => void
  onItemChange?: (index: number, patch: Partial<LogoItem>) => void
}

interface SpacerSectionProps {
  data: Record<string, any>
  editMode?: boolean
}

interface EmbedSectionProps {
  data: Record<string, any>
  editMode?: boolean
  onActivate?: () => void
  onFieldChange?: (field: string, value: string) => void
}

const WIDTH_CLASSES: Record<string, string> = {
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
}

const GRID_CLASSES: Record<number, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-3 xl:grid-cols-5",
  6: "grid-cols-2 md:grid-cols-3 xl:grid-cols-6",
}

const BG_CLASSES: Record<string, string> = {
  transparent: "",
  dark:        "bg-card/30",
  darkDeep:    "bg-card",
  accent:      "bg-primary/5 border-y border-primary/10",
}

const PAD_CLASSES: Record<string, string> = {
  none: "[&>section]:!py-0",
  sm:   "[&>section]:!py-8",
  md:   "[&>section]:!py-16",
  lg:   "[&>section]:!py-28",
}

function buildSrcDoc(html: string) {
  if (/<html[\s>]/i.test(html)) return html

  return [
    "<!DOCTYPE html>",
    "<html>",
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<style>html,body{margin:0;padding:0;width:100%;height:100%;overflow:auto}*,*::before,*::after{box-sizing:border-box}</style>",
    "</head>",
    "<body>",
    html,
    "</body>",
    "</html>",
  ].join("\n")
}

export function RichTextSection({
  data,
  editMode = false,
  onActivate,
  onFieldChange,
  onPrimaryAction,
  onSecondaryAction,
}: RichTextSectionProps) {
  const eyebrow = data.eyebrow || ""
  const title = data.titulo || "Construye cualquier seccion"
  const description = data.descripcion || "Usa este bloque para titulares, descripcion, listas, llamados a la accion y contenido editorial sin tocar codigo."
  const body = data.body || ""
  const bullets = ((data.bullets as string[]) || []).filter(Boolean)
  const alignment = data.alignment || "left"
  const maxWidth = WIDTH_CLASSES[data.maxWidth || "lg"] || WIDTH_CLASSES.lg
  const primaryLabel = data.primaryLabel || ""
  const primaryHref = data.primaryHref || "/registro"
  const secondaryLabel = data.secondaryLabel || ""
  const secondaryHref = data.secondaryHref || "/simulador"

  const isCentered = alignment === "center"
  const isRight = alignment === "right"
  const blockAlignment = isCentered ? "items-center text-center mx-auto" : isRight ? "items-end text-right ml-auto" : "items-start text-left"
  const contentWidth = isCentered ? `${maxWidth} mx-auto` : isRight ? `${maxWidth} ml-auto` : maxWidth
  const bulletsWidth = isCentered ? "mx-auto" : isRight ? "ml-auto" : ""
  const buttonsAlignment = isCentered ? "justify-center" : isRight ? "justify-end" : "justify-start"

  const runAction = (action?: () => void, fallbackHref?: string) => {
    if (editMode) return
    if (action) {
      action()
      return
    }
    if (fallbackHref) {
      window.location.href = fallbackHref
    }
  }

  return (
    <section className="relative overflow-hidden py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-1/2 top-0 h-80 w-[42rem] -translate-x-1/2 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6 lg:px-12">
        <div className={cn("flex flex-col gap-5", contentWidth, blockAlignment)}>
          {eyebrow ? (
            <div className="inline-flex rounded-full border border-primary/20 bg-primary/10 px-4 py-2">
              <StudioInlineText
                as="span"
                value={eyebrow}
                editable={editMode}
                onActivate={onActivate}
                onChange={(value) => onFieldChange?.("eyebrow", value)}
                className="text-xs font-bold uppercase tracking-[0.24em] text-primary"
                editorClassName="min-w-[10rem] text-xs font-bold uppercase tracking-[0.24em] text-primary"
              />
            </div>
          ) : null}

          <StudioInlineText
            as="h2"
            value={title}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("titulo", value)}
            className="font-display text-4xl leading-tight text-foreground md:text-5xl lg:text-6xl"
            editorClassName="font-display text-4xl leading-tight text-foreground md:text-5xl"
          />

          <StudioInlineText
            as="p"
            value={description}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("descripcion", value)}
            className="max-w-3xl text-lg leading-relaxed text-muted-foreground"
            editorClassName="max-w-3xl text-lg leading-relaxed text-muted-foreground"
          />

          {body ? (
            <StudioInlineText
              as="div"
              value={body}
              editable={editMode}
              multiline
              onActivate={onActivate}
              onChange={(value) => onFieldChange?.("body", value)}
              className="max-w-3xl whitespace-pre-line text-base leading-8 text-white/78"
              editorClassName="max-w-3xl whitespace-pre-line text-base leading-8 text-white/78"
            />
          ) : null}

          {bullets.length > 0 ? (
            <div className={cn("grid w-full gap-3 pt-2", bulletsWidth)}>
              {bullets.map((item, index) => (
                <div key={`${item}-${index}`} className={cn("flex items-start gap-3", isRight && "flex-row-reverse")}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <span className="max-w-2xl text-sm leading-7 text-white/76">{item}</span>
                </div>
              ))}
            </div>
          ) : null}

          {primaryLabel || secondaryLabel ? (
            <div className={cn("flex w-full flex-col gap-3 pt-3 sm:flex-row", buttonsAlignment)}>
              {primaryLabel ? (
                <button
                  type="button"
                  onClick={() => runAction(onPrimaryAction, primaryHref)}
                  className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                >
                  <StudioInlineText
                    as="span"
                    value={primaryLabel}
                    editable={editMode}
                    onActivate={onActivate}
                    onChange={(value) => onFieldChange?.("primaryLabel", value)}
                    allowLink={false}
                    className="text-sm font-semibold text-white"
                    editorClassName="min-w-[9rem] text-center text-sm font-semibold text-white"
                  />
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              ) : null}

              {secondaryLabel ? (
                <button
                  type="button"
                  onClick={() => runAction(onSecondaryAction, secondaryHref)}
                  className="inline-flex items-center justify-center rounded-2xl border border-white/10 px-6 py-3.5 text-sm font-semibold text-white/78 transition-all hover:border-primary/30 hover:text-white"
                >
                  <StudioInlineText
                    as="span"
                    value={secondaryLabel}
                    editable={editMode}
                    onActivate={onActivate}
                    onChange={(value) => onFieldChange?.("secondaryLabel", value)}
                    allowLink={false}
                    className="text-sm font-semibold text-white/78"
                    editorClassName="min-w-[9rem] text-center text-sm font-semibold text-white"
                  />
                </button>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

export function LogoStripSection({
  data,
  editMode = false,
  onActivate,
  onFieldChange,
  onItemChange,
}: LogoStripSectionProps) {
  const eyebrow = data.eyebrow || ""
  const title = data.titulo || "Marcas, aliados o herramientas"
  const description = data.descripcion || "Muestra clientes, partners, instituciones o tecnologias usadas en tu flujo."
  const columns = Math.min(6, Math.max(2, Number(data.columns || 4)))
  const items = ((data.items as LogoItem[]) || []).filter((item) => item?.id || item?.label)
  const gridClass = GRID_CLASSES[columns] || GRID_CLASSES[4]

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-7xl px-6 lg:px-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          {eyebrow ? (
            <StudioInlineText
              as="span"
              value={eyebrow}
              editable={editMode}
              onActivate={onActivate}
              onChange={(value) => onFieldChange?.("eyebrow", value)}
              className="inline-flex rounded-full border border-primary/18 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-primary"
              editorClassName="inline-flex min-w-[10rem] rounded-full text-center text-xs font-bold uppercase tracking-[0.24em] text-primary"
            />
          ) : null}

          <StudioInlineText
            as="h2"
            value={title}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("titulo", value)}
            className="mt-4 font-display text-4xl text-foreground md:text-5xl"
            editorClassName="mt-4 font-display text-4xl text-foreground md:text-5xl"
          />

          <StudioInlineText
            as="p"
            value={description}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("descripcion", value)}
            className="mt-4 text-lg leading-relaxed text-muted-foreground"
            editorClassName="mt-4 text-lg leading-relaxed text-muted-foreground"
          />
        </div>

        {items.length === 0 ? (
          <div className="rounded-[28px] border border-dashed border-white/10 bg-card/35 px-6 py-14 text-center text-sm text-muted-foreground">
            Agrega logos o marcas desde el editor del Studio
          </div>
        ) : (
          <div className={cn("grid gap-4", gridClass)}>
            {items.map((item, index) => {
              const content = (
                <div className="group flex h-full min-h-[178px] flex-col items-center justify-center rounded-[26px] border border-white/10 bg-card/75 px-5 py-6 text-center transition-all hover:border-primary/25 hover:bg-card">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-secondary/10">
                    {item.imageUrl ? (
                      <img src={item.imageUrl} alt={item.label || `Logo ${index + 1}`} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-lg font-semibold uppercase text-white/45">
                        {(item.label || `L${index + 1}`).slice(0, 2)}
                      </span>
                    )}
                  </div>

                  <StudioInlineText
                    as="h3"
                    value={item.label || `Logo ${index + 1}`}
                    editable={editMode}
                    multiline
                    onActivate={onActivate}
                    onChange={(value) => onItemChange?.(index, { label: value })}
                    className="mt-4 text-sm font-semibold text-foreground"
                    editorClassName="mt-4 text-center text-sm font-semibold text-foreground"
                  />

                  {item.subLabel ? (
                    <StudioInlineText
                      as="p"
                      value={item.subLabel}
                      editable={editMode}
                      multiline
                      onActivate={onActivate}
                      onChange={(value) => onItemChange?.(index, { subLabel: value })}
                      className="mt-1 text-xs uppercase tracking-[0.18em] text-white/42"
                      editorClassName="mt-1 text-center text-xs uppercase tracking-[0.18em] text-white/60"
                    />
                  ) : null}
                </div>
              )

              if (!item.href || editMode) {
                return <div key={item.id || `logo-${index}`}>{content}</div>
              }

              return (
                <a key={item.id || `logo-${index}`} href={item.href} className="block">
                  {content}
                </a>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

export function SpacerSection({ data, editMode = false }: SpacerSectionProps) {
  const height = Math.min(320, Math.max(24, Number(data.height || 96)))

  return (
    <section className="relative" aria-hidden="true">
      <div style={{ height }} />
      {editMode ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="rounded-full border border-dashed border-white/15 bg-[#08111b]/70 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
            Espaciador {height}px
          </div>
        </div>
      ) : null}
    </section>
  )
}

export function EmbedSection({
  data,
  editMode = false,
  onActivate,
  onFieldChange,
}: EmbedSectionProps) {
  const title = data.titulo || "Embed universal"
  const description = data.descripcion || "Inserta mapas, calendarios, formularios, dashboards o cualquier widget embebible."
  const mode = data.mode || "url"
  const url = data.url || ""
  const html = data.html || ""
  const height = Math.min(900, Math.max(220, Number(data.height || 460)))
  const hasContent = mode === "html" ? Boolean(html.trim()) : Boolean(url.trim())

  return (
    <section className="relative py-20">
      <div className="mx-auto max-w-6xl px-6 lg:px-12">
        <div className="mx-auto mb-8 max-w-3xl text-center">
          <StudioInlineText
            as="h2"
            value={title}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("titulo", value)}
            className="font-display text-4xl text-foreground md:text-5xl"
            editorClassName="font-display text-4xl text-foreground md:text-5xl"
          />
          <StudioInlineText
            as="p"
            value={description}
            editable={editMode}
            multiline
            onActivate={onActivate}
            onChange={(value) => onFieldChange?.("descripcion", value)}
            className="mt-4 text-lg leading-relaxed text-muted-foreground"
            editorClassName="mt-4 text-lg leading-relaxed text-muted-foreground"
          />
        </div>

        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-card/85 shadow-[0_25px_70px_rgba(0,0,0,0.28)]">
          {hasContent ? (
            mode === "html" ? (
              <iframe
                srcDoc={buildSrcDoc(html)}
                title={title}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                className={editMode ? "pointer-events-none block w-full" : "block w-full"}
                style={{ height, border: "none" }}
              />
            ) : (
              <iframe
                src={url}
                title={title}
                loading="lazy"
                allowFullScreen
                className={editMode ? "pointer-events-none block w-full" : "block w-full"}
                style={{ height, border: "none" }}
              />
            )
          ) : (
            <div className="flex flex-col items-center justify-center px-6 py-20 text-center">
              <div className="text-sm font-semibold uppercase tracking-[0.22em] text-primary/75">Embed</div>
              <div className="mt-3 text-2xl font-semibold text-foreground">Sin fuente configurada</div>
              <p className="mt-3 max-w-xl text-sm leading-7 text-muted-foreground">
                Agrega una URL embebible o pega el HTML completo del widget desde el editor del Studio.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function SectionWrapper({
  section,
  className,
  children,
}: {
  section: CMSSection
  className?: string
  children: React.ReactNode
}) {
  const bg       = BG_CLASSES[section.style?.bg ?? "transparent"] ?? ""
  const pad      = section.style?.padding ? PAD_CLASSES[section.style.padding] ?? "" : ""
  const customBg = section.style?.bg && !BG_CLASSES[section.style.bg]
    ? { backgroundColor: section.style.bg } : undefined
  return <div className={cn(bg, pad, className)} style={customBg}>{children}</div>
}

interface CmsPageRendererProps {
  slug: string
  onGetStarted?: () => void
  onWatchDemo?: () => void
  isAuthenticated?: boolean
}

export default function CmsPageRenderer({
  slug,
  onGetStarted,
  onWatchDemo,
  isAuthenticated = false,
}: CmsPageRendererProps) {
  const [sections, setSections] = useState<CMSSection[]>([])
  const { config } = useCMS()
  const datasets = useLandingBuilderData()
  const { activePopup, closePopup, executeAction, pendingPopupSubmitAction } = useLandingActions(config)

  useEffect(() => {
    const page   = config.pages?.find(p => p.slug === slug)
    setSections(page?.sections ?? [])
  }, [config, slug])

  const runSectionAction = (action?: Record<string, any>, fallbackHref?: string) => {
    executeAction(action, fallbackHref)
  }

  const renderSection = (section: CMSSection) => {
    if (!section.visible || !shouldRenderSectionForAudience(section, isAuthenticated)) return null

    const visibilityClass = getSectionVisibilityClass(section)
    const wrap = (content: React.ReactNode) => (
      <SectionWrapper key={section.id} section={section} className={visibilityClass}>
        <div id={getLandingSectionDomId(section.id)}>{content}</div>
      </SectionWrapper>
    )

    if (section.type === "simulatorsFeed" || section.type === "coursesFeed" || section.type === "evaluationsFeed") {
      const items = resolveLandingBuilderItems(section, datasets)
      if (!items.length && shouldHideSectionWhenEmpty(section)) return null
      return wrap(
        <DynamicFeedSection
          section={section}
          items={items}
          onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)}
        />
      )
    }

    switch (section.type) {
      case "hero":         return wrap(<HeroSection onGetStarted={onGetStarted} onWatchDemo={onWatchDemo} />)
      case "benefits":     return wrap(<BenefitsSection />)
      case "testimonials": return wrap(<TestimonialsSection />)
      case "pricing":      return wrap(<Pricing />)
      case "contact":      return wrap(<ContactSection />)
      case "pageHero":     return wrap(<PageHeroSection data={section.data} onGetStarted={() => runSectionAction(section.data?.primaryAction, section.data?.ctaHref)} onWatchDemo={() => runSectionAction(section.data?.secondaryAction, section.data?.ctaSecHref)} />)
      case "featureCards": return wrap(<FeatureCardsSection data={section.data} />)
      case "richText":     return wrap(<RichTextSection data={section.data} onPrimaryAction={() => runSectionAction(section.data?.primaryAction, section.data?.primaryHref)} onSecondaryAction={() => runSectionAction(section.data?.secondaryAction, section.data?.secondaryHref)} />)
      case "logoStrip":    return wrap(<LogoStripSection data={section.data} />)
      case "spacer":       return wrap(<SpacerSection data={section.data} />)
      case "embed":        return wrap(<EmbedSection data={section.data} />)
      case "cta":          return wrap(<CTASection data={section.data} onPrimaryAction={() => runSectionAction(section.data?.primaryAction, section.data?.ctaPrimarioHref)} onSecondaryAction={() => runSectionAction(section.data?.secondaryAction, section.data?.ctaSecundarioHref)} />)
      case "imageText":    return wrap(<ImageTextSection data={section.data} onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)} />)
      case "video":        return wrap(<VideoSection data={section.data} />)
      case "faq":          return wrap(<FAQSection data={section.data} />)
      case "textBanner":   return wrap(<TextBannerSection data={section.data} onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)} />)
      case "gallery":      return wrap(<GallerySection data={section.data} />)
      case "stats":        return wrap(<StatsSection data={section.data} />)
      case "customCode":   return wrap(<CustomCodeSection data={section.data} onAction={(action, fallbackHref) => runSectionAction(action, fallbackHref)} />)
      case "formBuilder":  return wrap(<FormBuilderSection data={section.data} onSubmitAction={() => runSectionAction(section.data?.submitAction)} />)
      default:             return null
    }
  }

  return (
    <>
      {sections.map(renderSection)}
      <LandingPopupHost popup={activePopup} onClose={closePopup} onAction={executeAction} fallbackSubmitAction={pendingPopupSubmitAction} />
    </>
  )
}
