"use client"

import React, { useEffect, useMemo, useRef, useState } from "react"
import type { MouseEvent, ReactNode } from "react"
import { ArrowDown, ArrowUp, Award, BadgePlus, BookOpen, Copy, Code2, Eye, EyeOff, FileImage, FileText, GalleryVertical, GraduationCap, GripVertical, HelpCircle, Layers, LayoutTemplate, MessageSquare, Minus, Pencil, PlayCircle, Plus, Sparkles, Star, Target, TextCursorInput, Trash2, Video } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSActionConfig, CMSConfig, CMSSection, CMSSectionType } from "@/hooks/use-cms"
import type { EditorElementInfo } from "@/components/admin/html-editor-bridge"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AnimatedBackground from "@/components/animated-background"
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
import { resolveLandingBuilderItems, useLandingBuilderData } from "@/hooks/use-landing-builder-data"
import FormBuilderSection from "@/components/landing/form-builder-section"
import LandingPopupHost from "@/components/landing/landing-popup-host"
import PublicCoursesHub from "@/components/courses/public-courses-hub"
import { EmbedSection, LogoStripSection, RichTextSection, SpacerSection } from "@/components/landing/cms-page-renderer"
import { getLandingSectionDomId } from "@/hooks/use-landing-actions"

const BG_CLASSES: Record<string, string> = {
  transparent: "",
  dark: "bg-card/30",
  darkDeep: "bg-card",
  accent: "bg-primary/5 border-y border-primary/10",
}

const PAD_CLASSES: Record<string, string> = {
  none: "[&>section]:!py-0",
  sm: "[&>section]:!py-8",
  md: "[&>section]:!py-16",
  lg: "[&>section]:!py-28",
}

const SECTION_META: Record<CMSSectionType, { label: string; icon: ReactNode }> = {
  hero: { label: "Hero", icon: <Sparkles className="h-3.5 w-3.5" /> },
  benefits: { label: "Beneficios", icon: <Star className="h-3.5 w-3.5" /> },
  testimonials: { label: "Testimonios", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  pricing: { label: "Precios", icon: <Award className="h-3.5 w-3.5" /> },
  contact: { label: "Contacto", icon: <MessageSquare className="h-3.5 w-3.5" /> },
  cta: { label: "CTA", icon: <BadgePlus className="h-3.5 w-3.5" /> },
  imageText: { label: "Imagen y texto", icon: <FileImage className="h-3.5 w-3.5" /> },
  video: { label: "Video", icon: <Video className="h-3.5 w-3.5" /> },
  faq: { label: "FAQ", icon: <HelpCircle className="h-3.5 w-3.5" /> },
  textBanner: { label: "Banner", icon: <TextCursorInput className="h-3.5 w-3.5" /> },
  gallery: { label: "Galeria", icon: <GalleryVertical className="h-3.5 w-3.5" /> },
  stats: { label: "Estadisticas", icon: <Layers className="h-3.5 w-3.5" /> },
  customCode: { label: "Codigo", icon: <Code2 className="h-3.5 w-3.5" /> },
  pageHero: { label: "Hero de pagina", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  featureCards: { label: "Tarjetas", icon: <BookOpen className="h-3.5 w-3.5" /> },
  simulatorsFeed: { label: "Simuladores", icon: <Target className="h-3.5 w-3.5" /> },
  coursesFeed: { label: "Cursos", icon: <BookOpen className="h-3.5 w-3.5" /> },
  coursesCatalog: { label: "Catalogo cursos", icon: <GraduationCap className="h-3.5 w-3.5" /> },
  evaluationsFeed: { label: "Evaluaciones", icon: <Award className="h-3.5 w-3.5" /> },
  formBuilder: { label: "Formulario", icon: <FileText className="h-3.5 w-3.5" /> },
  richText: { label: "Contenido libre", icon: <TextCursorInput className="h-3.5 w-3.5" /> },
  logoStrip: { label: "Logos", icon: <BadgePlus className="h-3.5 w-3.5" /> },
  spacer: { label: "Espaciador", icon: <Minus className="h-3.5 w-3.5" /> },
  embed: { label: "Embed", icon: <Code2 className="h-3.5 w-3.5" /> },
}

const LEGACY_SECTION_META: Record<string, { label: string; icon: ReactNode }> = {
  navbar: { label: "Navegacion", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  footer: { label: "Footer", icon: <LayoutTemplate className="h-3.5 w-3.5" /> },
  html: { label: "HTML", icon: <Code2 className="h-3.5 w-3.5" /> },
  features: { label: "Features", icon: <BookOpen className="h-3.5 w-3.5" /> },
}

function formatSectionTypeLabel(type: string) {
  return type
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase())
}

function getSectionMeta(type: string): { label: string; icon: ReactNode } {
  return (
    SECTION_META[type as CMSSectionType] ??
    LEGACY_SECTION_META[type] ??
    { label: formatSectionTypeLabel(type || "bloque"), icon: <LayoutTemplate className="h-3.5 w-3.5" /> }
  )
}

function getSimulatorSubmitAction(action: CMSActionConfig): CMSActionConfig {
  return action.postSubmitAction?.type && action.postSubmitAction.type !== "none"
    ? action.postSubmitAction
    : {
        type: "simulator",
        href: action.href,
        openInNewTab: action.openInNewTab,
      }
}

function SectionShell({
  section,
  selected,
  editable,
  compactToolbar = false,
  onSelect,
  onDuplicate,
  onToggleVisibility,
  onMove,
  onDelete,
  onDragStart,
  onDragEnd,
  onContextOpen,
  dragging,
  children,
}: {
  section: CMSSection
  selected: boolean
  editable: boolean
  compactToolbar?: boolean
  onSelect?: (id: string) => void
  onDuplicate?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onMove?: (id: string, direction: -1 | 1) => void
  onDelete?: (id: string) => void
  onDragStart?: (id: string) => void
  onDragEnd?: () => void
  onContextOpen?: (payload: { id: string; x: number; y: number }) => void
  dragging?: boolean
  children: ReactNode
}) {
  const bg = BG_CLASSES[section.style?.bg ?? "transparent"] ?? ""
  const pad = section.style?.padding ? PAD_CLASSES[section.style.padding] ?? "" : ""
  const customBg = section.style?.bg && !BG_CLASSES[section.style.bg]
    ? { backgroundColor: section.style.bg }
    : undefined
  const meta = getSectionMeta(section.type)
  const suppressCompactFloatingChrome = compactToolbar && selected && section.type === "customCode"
  const handleToolbarClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
  }

  return (
    <div
      data-he-edit-id={section.id}
      className={cn("group/section relative", editable && "select-none", dragging && "opacity-45 scale-[0.985]")}
      draggable={editable}
      onClickCapture={(event) => {
        if (!editable || selected) return
        const target = event.target as HTMLElement | null
        if (!target) return
        if (!target.closest("a, button, input, select, textarea, label, summary, [role='button']")) return
        event.preventDefault()
        event.stopPropagation()
        onSelect?.(section.id)
      }}
      onDragStart={(event) => {
        if (!editable) return
        event.dataTransfer.effectAllowed = "move"
        event.dataTransfer.setData("text/plain", section.id)
        onDragStart?.(section.id)
      }}
      onDragEnd={() => onDragEnd?.()}
      onContextMenu={(event) => {
        if (!editable) return
        event.preventDefault()
        onSelect?.(section.id)
        onContextOpen?.({ id: section.id, x: event.clientX, y: event.clientY })
      }}
      onClick={() => {
        if (editable) onSelect?.(section.id)
      }}
    >
      {editable && (
        <div
          className={cn(
            "pointer-events-none absolute inset-0 z-20 rounded-[32px] border transition-all",
            selected
              ? "border-primary/80 bg-primary/[0.02] shadow-[0_0_0_1px_rgba(232,57,42,0.22),0_10px_26px_rgba(232,57,42,0.08)]"
              : "border-transparent group-hover/section:border-primary/25 group-hover/section:bg-primary/[0.012]"
          )}
        >
          {!suppressCompactFloatingChrome ? (
            <span
              className={cn(
                "pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full border border-primary/18 bg-[#09111b]/94 px-2.5 py-1 text-[10px] font-semibold text-white shadow-[0_10px_24px_rgba(0,0,0,0.28)] transition-opacity",
                selected ? "opacity-100" : "opacity-0 group-hover/section:opacity-100"
              )}
              >
                <span className="text-primary">{meta.icon}</span>
                {meta.label}
              </span>
          ) : null}

          {!suppressCompactFloatingChrome ? (
            <div
              className={cn(
                "pointer-events-none absolute z-20 transition-opacity",
                compactToolbar ? "inset-x-3 bottom-3 flex justify-center" : "right-4 top-4",
                selected ? "opacity-100" : "opacity-0 group-hover/section:opacity-100"
              )}
            >
              <div
                data-he-editor-ui="true"
                className={cn(
                  "pointer-events-auto flex items-center gap-1 border border-white/10 bg-[#09111b]/92 shadow-lg",
                  compactToolbar ? "rounded-[20px] px-2 py-2 shadow-[0_18px_48px_rgba(0,0,0,0.38)]" : "rounded-2xl p-1"
                )}
              >
            <button
              type="button"
              onClick={(event) => {
                handleToolbarClick(event)
                onSelect?.(section.id)
              }}
              className={cn(
                "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-white/5 hover:text-white",
                compactToolbar ? "h-9 w-9" : "h-7 w-7"
              )}
              aria-label="Editar bloque"
            >
              <Pencil className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />
            </button>
            {!compactToolbar ? (
              <div className="pointer-events-auto inline-flex h-7 w-7 items-center justify-center rounded-xl text-white/25" aria-hidden="true">
                <GripVertical className="h-3.5 w-3.5" />
              </div>
            ) : null}
            {onDuplicate && (
              <button
                type="button"
                onClick={(event) => {
                  handleToolbarClick(event)
                  onDuplicate(section.id)
                }}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-white/5 hover:text-white",
                  compactToolbar ? "h-9 w-9" : "h-7 w-7"
                )}
                aria-label="Duplicar bloque"
              >
                <Copy className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />
              </button>
            )}
            <div className="pointer-events-none h-5 w-px bg-white/8" />
            {onToggleVisibility && (
              <button
                type="button"
                onClick={(event) => {
                  handleToolbarClick(event)
                  onToggleVisibility(section.id)
                }}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-white/5 hover:text-white",
                  compactToolbar ? "h-9 w-9" : "h-7 w-7"
                )}
                aria-label={section.visible ? "Ocultar bloque" : "Mostrar bloque"}
              >
                {section.visible ? <EyeOff className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} /> : <Eye className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />}
              </button>
            )}
            {onMove && (
              <>
                <button
                  type="button"
                  onClick={(event) => {
                    handleToolbarClick(event)
                    onMove(section.id, -1)
                  }}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-white/5 hover:text-white",
                    compactToolbar ? "h-9 w-9" : "h-7 w-7"
                  )}
                  aria-label="Subir bloque"
                >
                  <ArrowUp className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    handleToolbarClick(event)
                    onMove(section.id, 1)
                  }}
                  className={cn(
                    "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-white/5 hover:text-white",
                    compactToolbar ? "h-9 w-9" : "h-7 w-7"
                  )}
                  aria-label="Bajar bloque"
                >
                  <ArrowDown className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />
                </button>
              </>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={(event) => {
                  handleToolbarClick(event)
                  onDelete(section.id)
                }}
                className={cn(
                  "inline-flex items-center justify-center rounded-xl text-white/45 transition-all hover:bg-red-500/10 hover:text-red-300",
                  compactToolbar ? "h-9 w-9" : "h-7 w-7"
                )}
                aria-label="Eliminar bloque"
              >
                <Trash2 className={cn(compactToolbar ? "h-4 w-4" : "h-3.5 w-3.5")} />
              </button>
            )}
              </div>
            </div>
          ) : null}
        </div>
      )}
      <div className={cn("relative", bg, pad)} style={customBg}>
        {children}
      </div>
    </div>
  )
}

function renderSectionContent(
  section: CMSSection,
  config: CMSConfig,
  datasets: ReturnType<typeof useLandingBuilderData>,
  selected: boolean,
  viewportMode: "desktop" | "tablet" | "mobile",
  editable: boolean,
  htmlIframeRef?: React.MutableRefObject<HTMLIFrameElement | null>,
  onSelect?: (id: string) => void,
  onInlineUpdate?: (sectionId: string, patch: Record<string, any>) => void,
  onAction?: (action?: CMSActionConfig, fallbackHref?: string) => void,
  onHtmlElementSelect?: (info: EditorElementInfo | null) => void,
  onHtmlEditingChange?: (editing: boolean) => void,
  onHtmlSnapshot?: (html: string) => void,
  onHtmlInteractionLockChange?: (locked: boolean) => void,
  onHtmlOpenInspector?: () => void
) {
  switch (section.type) {
    case "hero":
      return (
        <HeroSection
          dataOverride={config.hero}
          onGetStarted={() => onAction?.(config.hero.primaryAction, "/registro")}
          onWatchDemo={() => onAction?.(config.hero.secondaryAction, "/simulador")}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onTextStyleChange={(field, style) =>
            onInlineUpdate?.(section.id, {
              textStyles: {
                ...(config.hero.textStyles ?? {}),
                [field]: style,
              },
            })
          }
          onFeatureChange={(index, value) =>
            onInlineUpdate?.(section.id, {
              features: config.hero.features.map((feature, featureIndex) => (featureIndex === index ? value : feature)),
            })
          }
        />
      )
    case "benefits":
      return <BenefitsSection dataOverride={config.benefits} />
    case "testimonials":
      return <TestimonialsSection dataOverride={config.testimonials} />
    case "pricing":
      return <Pricing />
    case "contact":
      return <ContactSection />
    case "cta":
      return <CTASection data={section.data} onPrimaryAction={() => onAction?.(section.data?.primaryAction, section.data?.ctaPrimarioHref)} onSecondaryAction={() => onAction?.(section.data?.secondaryAction, section.data?.ctaSecundarioHref)} />
    case "imageText":
      return <ImageTextSection data={section.data} onCtaAction={() => onAction?.(section.data?.ctaAction, section.data?.ctaHref)} />
    case "video":
      return <VideoSection data={section.data} />
    case "faq":
      return (
        <FAQSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onItemChange={(index, patch) =>
            onInlineUpdate?.(section.id, {
              items: ((section.data.items as Array<Record<string, any>>) ?? []).map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
              ),
            })
          }
        />
      )
    case "textBanner":
      return <TextBannerSection data={section.data} onCtaAction={() => onAction?.(section.data?.ctaAction, section.data?.ctaHref)} />
    case "gallery":
      return <GallerySection data={section.data} />
    case "stats":
      return <StatsSection data={section.data} />
    case "customCode":
      const htmlRuntimeEnabled = Boolean(onSelect) && editable
      return (
        <CustomCodeSection
          data={section.data}
          viewportMode={viewportMode}
          editMode={htmlRuntimeEnabled}
          iframeRef={htmlRuntimeEnabled && htmlIframeRef ? htmlIframeRef as React.RefObject<HTMLIFrameElement> : undefined}
          onActivate={!htmlRuntimeEnabled && !selected ? () => onSelect?.(section.id) : undefined}
          onElementSelect={htmlRuntimeEnabled ? (info) => {
            onSelect?.(section.id)
            onHtmlElementSelect?.(info)
          } : undefined}
          onEditingChange={htmlRuntimeEnabled ? (editing) => {
            if (editing) onSelect?.(section.id)
            onHtmlEditingChange?.(editing)
          } : undefined}
          onEditorSnapshot={htmlRuntimeEnabled ? onHtmlSnapshot : undefined}
          onAction={(action, fallbackHref) => onAction?.(action, fallbackHref)}
          onInteractionLockChange={htmlRuntimeEnabled ? onHtmlInteractionLockChange : undefined}
          onOpenInspector={htmlRuntimeEnabled ? onHtmlOpenInspector : undefined}
        />
      )
    case "pageHero":
      return (
        <PageHeroSection
          data={section.data}
          onGetStarted={() => onAction?.(section.data?.primaryAction, section.data?.ctaHref)}
          onWatchDemo={() => onAction?.(section.data?.secondaryAction, section.data?.ctaSecHref)}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onTextStyleChange={(field, style) =>
            onInlineUpdate?.(section.id, {
              textStyles: {
                ...((section.data?.textStyles as Record<string, unknown>) ?? {}),
                [field]: style,
              },
            })
          }
          onFeatureChange={(index, value) =>
            onInlineUpdate?.(section.id, {
              features: ((section.data.features as string[]) ?? []).map((feature, featureIndex) => (featureIndex === index ? value : feature)),
            })
          }
        />
      )
    case "featureCards":
      return (
        <FeatureCardsSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onItemChange={(index, patch) =>
            onInlineUpdate?.(section.id, {
              items: ((section.data.items as Array<Record<string, any>>) ?? []).map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
              ),
            })
          }
        />
      )
    case "richText":
      return (
        <RichTextSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onPrimaryAction={() => onAction?.(section.data?.primaryAction, section.data?.primaryHref)}
          onSecondaryAction={() => onAction?.(section.data?.secondaryAction, section.data?.secondaryHref)}
        />
      )
    case "logoStrip":
      return (
        <LogoStripSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onItemChange={(index, patch) =>
            onInlineUpdate?.(section.id, {
              items: ((section.data.items as Array<Record<string, any>>) ?? []).map((item, itemIndex) =>
                itemIndex === index ? { ...item, ...patch } : item
              ),
            })
          }
        />
      )
    case "spacer":
      return <SpacerSection data={section.data} editMode={selected} />
    case "embed":
      return (
        <EmbedSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
        />
      )
    case "formBuilder":
      return (
        <FormBuilderSection
          data={section.data}
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onSubmitAction={() => onAction?.(section.data?.submitAction)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onBulletChange={(index, value) =>
            onInlineUpdate?.(section.id, {
              bullets: ((section.data.bullets as string[]) ?? []).map((item, itemIndex) => (itemIndex === index ? value : item)),
            })
          }
          onFormFieldChange={(index, patch) =>
            onInlineUpdate?.(section.id, {
              fields: ((section.data.fields as Array<Record<string, any>>) ?? []).map((field, fieldIndex) =>
                fieldIndex === index ? { ...field, ...patch } : field
              ),
            })
          }
        />
      )
    case "simulatorsFeed":
    case "coursesFeed":
    case "evaluationsFeed":
      return (
        <DynamicFeedSection
          section={section}
          items={resolveLandingBuilderItems(section, datasets)}
          editing
          editMode={selected}
          onActivate={() => onSelect?.(section.id)}
          onFieldChange={(field, value) => onInlineUpdate?.(section.id, { [field]: value })}
          onCtaAction={() => onAction?.(section.data?.ctaAction, section.data?.ctaHref)}
        />
      )
    case "coursesCatalog":
      return (
        <PublicCoursesHub
          variant={section.data?.variant === "page" ? "page" : "home"}
          content={section.data}
          onCatalogAction={() => onAction?.(section.data?.ctaAction, section.data?.ctaHref)}
        />
      )
    default:
      return null
  }
}

export default function StudioSitePreview({
  config,
  sections,
  selectedId,
  viewportMode = "desktop",
  editorMode,
  onSelect,
  onPreviewNavigate,
  onInlineUpdate,
  onDuplicate,
  onToggleVisibility,
  onMove,
  onDelete,
  onAddBlock,
  onReorder,
  previewMode = false,
  htmlIframeRef,
  onHtmlElementSelect,
  onHtmlEditingChange,
  onHtmlSnapshot,
  onHtmlInteractionLockChange,
  onHtmlOpenInspector,
}: {
  config: CMSConfig
  sections: CMSSection[]
  selectedId?: string
  viewportMode?: "desktop" | "tablet" | "mobile"
  editorMode?: "edit" | "preview" | "review"
  onSelect?: (id: string) => void
  onPreviewNavigate?: (href: string) => void
  onInlineUpdate?: (sectionId: string, patch: Record<string, any>) => void
  onDuplicate?: (id: string) => void
  onToggleVisibility?: (id: string) => void
  onMove?: (id: string, direction: -1 | 1) => void
  onDelete?: (id: string) => void
  onAddBlock?: (index?: number) => void
  onReorder?: (sourceId: string, targetIndex: number) => void
  previewMode?: boolean
  htmlIframeRef?: React.MutableRefObject<HTMLIFrameElement | null>
  onHtmlElementSelect?: (info: EditorElementInfo | null) => void
  onHtmlEditingChange?: (editing: boolean) => void
  onHtmlSnapshot?: (html: string) => void
  onHtmlInteractionLockChange?: (locked: boolean) => void
  onHtmlOpenInspector?: () => void
}) {
  const datasets = useLandingBuilderData()
  const rootRef = useRef<HTMLDivElement>(null)
  const currentEditorMode = editorMode ?? (previewMode ? "preview" : "edit")
  const editable = currentEditorMode === "edit"
  const compactToolbar = viewportMode === "mobile"
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropIndex, setDropIndex] = useState<number | null>(null)
  const [contextMenu, setContextMenu] = useState<{ id: string; x: number; y: number } | null>(null)
  const [activePopupId, setActivePopupId] = useState<string | null>(null)
  const [pendingPopupSubmitAction, setPendingPopupSubmitAction] = useState<CMSActionConfig | undefined>(undefined)
  const [previewNotice, setPreviewNotice] = useState<string | null>(null)
  const visibleSections = useMemo(
    () => sections.map((section, index) => ({ section, index })).filter((entry) => entry.section.visible),
    [sections]
  )
  const contextSection = contextMenu ? (
    contextMenu.id === "navbar" || contextMenu.id === "footer"
      ? { id: contextMenu.id, type: contextMenu.id, visible: true, data: {} } as any
      : sections.find((section) => section.id === contextMenu.id) ?? null
  ) : null
  const activePopup = useMemo(
    () => config.popups.find((popup) => popup.id === activePopupId) ?? null,
    [activePopupId, config.popups]
  )

  useEffect(() => {
    const closeMenu = () => setContextMenu(null)
    const ownerWindow = rootRef.current?.ownerDocument?.defaultView ?? window
    const ownerDocument = rootRef.current?.ownerDocument ?? document
    ownerWindow.addEventListener("click", closeMenu)
    ownerWindow.addEventListener("resize", closeMenu)
    ownerDocument.addEventListener("click", closeMenu)
    return () => {
      ownerWindow.removeEventListener("click", closeMenu)
      ownerWindow.removeEventListener("resize", closeMenu)
      ownerDocument.removeEventListener("click", closeMenu)
    }
  }, [])

  useEffect(() => {
    if (!previewNotice) return
    const timer = window.setTimeout(() => setPreviewNotice(null), 2400)
    return () => window.clearTimeout(timer)
  }, [previewNotice])

  useEffect(() => {
    if (!editable) return

    const root = rootRef.current
    if (!root) return

    const resolveEditId = (target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : null
      return element?.closest<HTMLElement>("[data-he-edit-id]")?.dataset.heEditId || ""
    }

    const isEditorUiTarget = (target: EventTarget | null) => {
      const element = target instanceof HTMLElement ? target : null
      return Boolean(element?.closest("[data-he-editor-ui='true'], [data-he-editor-input='true'], [data-studio-inline='true']"))
    }

    const handleClickCapture = (event: Event) => {
      if (isEditorUiTarget(event.target)) return

      const target = event.target instanceof HTMLElement ? event.target : null
      if (!target) return

      const editId = resolveEditId(target)
      if (!editId) return

      const interactiveTarget = target.closest("a, button, input, select, textarea, label, summary, [role='button'], [role='link']")
      const insideForm = Boolean(target.closest("form"))
      if (!interactiveTarget && !insideForm) return

      const isSelected = selectedId === editId
      const isChrome = editId === "navbar" || editId === "footer"

      event.preventDefault()
      event.stopPropagation()

      if (!isSelected || isChrome) {
        onSelect?.(editId)
      }

      if (isChrome) {
        setPreviewNotice(editId === "navbar" ? "Navbar seleccionado: edita sus links desde el panel." : "Footer seleccionado: edita sus links y texto desde el panel.")
      }
    }

    const handleSubmitCapture = (event: Event) => {
      if (isEditorUiTarget(event.target)) return

      const editId = resolveEditId(event.target)
      if (!editId) return

      event.preventDefault()
      event.stopPropagation()
      if (selectedId !== editId) onSelect?.(editId)
    }

    root.addEventListener("click", handleClickCapture, true)
    root.addEventListener("submit", handleSubmitCapture, true)

    return () => {
      root.removeEventListener("click", handleClickCapture, true)
      root.removeEventListener("submit", handleSubmitCapture, true)
    }
  }, [editable, onSelect, selectedId])

  const executePreviewAction = (action?: CMSActionConfig, fallbackHref?: string) => {
    if (editable) {
      setPreviewNotice("Modo edicion: selecciona el bloque y edita desde el panel.")
      return
    }

    const nextAction = action?.type && action.type !== "none"
      ? action
      : fallbackHref
        ? { type: "page" as const, href: fallbackHref }
        : undefined

    if (!nextAction) return

    switch (nextAction.type) {
      case "popup":
        if (nextAction.popupId) {
          setPendingPopupSubmitAction(undefined)
          setActivePopupId(nextAction.popupId)
          setPreviewNotice(`Popup: ${config.popups.find((popup) => popup.id === nextAction.popupId)?.name || nextAction.popupId}`)
        }
        return
      case "section": {
        const sectionId = nextAction.sectionId
        if (!sectionId) return
        const target = rootRef.current?.querySelector<HTMLElement>(`#${getLandingSectionDomId(sectionId)}`)
        if (target) {
          target.scrollIntoView({ behavior: "smooth", block: "start" })
          setPreviewNotice(`Scroll a sección: ${getSectionMeta(sections.find((section) => section.id === sectionId)?.type || "pageHero").label || sectionId}`)
        }
        return
      }
      case "page":
        if (nextAction.href?.startsWith("/")) {
          if (onPreviewNavigate) {
            onPreviewNavigate(nextAction.href)
            return
          }
        }
        setPreviewNotice(`Destino configurado: ${nextAction.href || "sin enlace"}`)
        return
      case "external":
        setPreviewNotice(`Destino configurado: ${nextAction.href || "sin enlace"}`)
        return
      case "simulator":
        if (nextAction.popupId) {
          setPendingPopupSubmitAction(getSimulatorSubmitAction(nextAction))
          setActivePopupId(nextAction.popupId)
          setPreviewNotice(`Flujo de simulador: popup previo + ${nextAction.href || "destino"}`)
          return
        }
        if (nextAction.formMode === "section" && nextAction.sectionId) {
          const target = rootRef.current?.querySelector<HTMLElement>(`#${getLandingSectionDomId(nextAction.sectionId)}`)
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" })
            setPreviewNotice("Flujo de simulador: mostrar formulario en la misma pagina")
            return
          }
        }
        if (nextAction.formMode === "page" && nextAction.formPageHref) {
          setPreviewNotice(`Flujo de simulador: redirigir a ${nextAction.formPageHref}`)
          return
        }
        if (nextAction.href?.startsWith("/")) {
          if (onPreviewNavigate) {
            onPreviewNavigate(nextAction.href)
            return
          }
        }
        setPreviewNotice(`Destino configurado: ${nextAction.href || "sin enlace"}`)
        return
      default:
        if (nextAction.href) setPreviewNotice(`Destino configurado: ${nextAction.href}`)
    }
  }

  const handlePreviewChromeNavigation = (targetId: "navbar" | "footer", href: string) => {
    if (editable) {
      onSelect?.(targetId)
      setPreviewNotice(targetId === "navbar" ? "Navbar seleccionado: edita sus links desde el panel." : "Footer seleccionado: edita sus links y texto desde el panel.")
      return
    }

    if (href.startsWith("#")) {
      executePreviewAction({ type: "section", sectionId: href.slice(1), href })
      return
    }

    executePreviewAction({ type: /^https?:\/\//i.test(href) ? "external" : "page", href }, href)
  }

  const renderInsertSlot = (index: number, key: string) => (
    <div
      key={key}
      data-he-editor-ui="true"
      className={cn("group relative flex items-center justify-center py-3", draggingId ? "pointer-events-auto" : "pointer-events-none")}
      onDragOver={(event) => {
        if (!draggingId) return
        event.preventDefault()
        if (dropIndex !== index) setDropIndex(index)
      }}
      onDrop={(event) => {
        if (!draggingId) return
        event.preventDefault()
        onReorder?.(draggingId, index)
        setDraggingId(null)
        setDropIndex(null)
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node | null)) return
        if (dropIndex === index) setDropIndex(null)
      }}
    >
      <div
        className={cn(
          "h-px w-full transition-all",
          draggingId && dropIndex === index ? "bg-primary/70" : "bg-white/6 group-hover:bg-primary/20"
        )}
      />
      <button
        type="button"
        onClick={() => onAddBlock?.(index)}
        aria-label={`Agregar bloque en posicion ${index + 1}`}
        className={cn(
          "pointer-events-auto absolute inline-flex h-8 items-center gap-1 rounded-full border px-2.5 text-[10px] font-semibold transition-all focus:opacity-100 focus:scale-100",
          draggingId && dropIndex === index
            ? "border-primary bg-primary text-white shadow-[0_10px_30px_rgba(232,57,42,0.18)]"
            : "border-white/10 bg-[#09111b]/96 text-white/45 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 hover:border-primary/35 hover:text-white"
        )}
        title="Agregar bloque"
      >
        <Plus className="h-3.5 w-3.5" />
        <span className="hidden md:inline">Agregar bloque</span>
      </button>
    </div>
  )

  return (
    <main ref={rootRef} data-he-editor-mode={currentEditorMode} className="relative bg-transparent">
      <AnimatedBackground className="absolute inset-0 z-0" />
      {editable && contextMenu && contextSection ? (
        <div
          data-he-editor-ui="true"
          className="fixed z-[80] min-w-[210px] rounded-2xl border border-white/10 bg-[#09111b]/96 p-2 shadow-[0_18px_50px_rgba(0,0,0,0.45)]"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="px-2 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[0.22em] text-white/35">
            {getSectionMeta(contextSection.type).label}
          </div>
          <div className="grid gap-1">
            <button type="button" onClick={() => { onSelect?.(contextSection.id); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/5 hover:text-white"><Pencil className="h-4 w-4" />Editar</button>
            {contextSection.id !== "navbar" && contextSection.id !== "footer" && onDuplicate && <button type="button" onClick={() => { onDuplicate(contextSection.id); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/5 hover:text-white"><Copy className="h-4 w-4" />Duplicar</button>}
            {contextSection.id !== "navbar" && contextSection.id !== "footer" && onToggleVisibility && <button type="button" onClick={() => { onToggleVisibility(contextSection.id); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/5 hover:text-white">{contextSection.visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}{contextSection.visible ? "Ocultar" : "Mostrar"}</button>}
            {contextSection.id !== "navbar" && contextSection.id !== "footer" && onMove && <button type="button" onClick={() => { onMove(contextSection.id, -1); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/5 hover:text-white"><ArrowUp className="h-4 w-4" />Subir</button>}
            {contextSection.id !== "navbar" && contextSection.id !== "footer" && onMove && <button type="button" onClick={() => { onMove(contextSection.id, 1); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-white/75 transition-all hover:bg-white/5 hover:text-white"><ArrowDown className="h-4 w-4" />Bajar</button>}
            {contextSection.id !== "navbar" && contextSection.id !== "footer" && onDelete && <button type="button" onClick={() => { onDelete(contextSection.id); setContextMenu(null) }} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-300 transition-all hover:bg-red-500/10"><Trash2 className="h-4 w-4" />Eliminar</button>}
          </div>
        </div>
      ) : null}
      {previewNotice ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-[70] -translate-x-1/2 rounded-full border border-white/10 bg-[#09111b]/96 px-4 py-2 text-xs font-medium text-white/75 shadow-[0_18px_50px_rgba(0,0,0,0.45)]">
          {previewNotice}
        </div>
      ) : null}
      <div className="relative z-10">
        <div
          data-he-edit-id="navbar"
          className={cn(
            editable && "group relative cursor-pointer transition-all",
            editable && selectedId === "navbar" && "ring-2 ring-primary ring-inset"
          )}
          onClickCapture={(event) => {
            if (!editable) return
            event.preventDefault()
            event.stopPropagation()
            onSelect?.("navbar")
          }}
          onClick={() => editable && onSelect?.("navbar")}
          onContextMenu={(e) => {
            if (editable) {
              e.preventDefault()
              e.stopPropagation()
              setContextMenu({ id: "navbar", x: e.clientX, y: e.clientY })
            }
          }}
        >
          {editable && selectedId === "navbar" && (
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-between bg-primary/10 px-4 py-1.5">
              <div className="text-[11px] font-bold text-primary">NAVEGACIÓN</div>
            </div>
          )}
          <Navbar
            previewMode
            navOverride={config.nav}
            pageLinksOverride={config.pages}
            generalOverride={config.general}
            onPreviewNavigate={(href) => handlePreviewChromeNavigation("navbar", href)}
            onLoginClick={() => {}}
            onRegisterClick={() => {}}
          />
        </div>
        {visibleSections.length === 0 ? (
          <div className="px-6 py-20 lg:px-12">
            <div className="mx-auto flex max-w-3xl flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border bg-card/70 px-8 py-16 text-center">
              <LayoutTemplate className="h-10 w-10 text-muted-foreground/30" />
              <div className="text-lg font-semibold text-foreground">Esta pagina aun no tiene bloques</div>
              <div className="max-w-lg text-sm text-muted-foreground">
                Agrega el primer bloque desde el panel izquierdo para empezar a construir la pagina.
              </div>
              {editable && onAddBlock && (
                <button
                  type="button"
                  onClick={() => onAddBlock()}
                  className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                >
                  <BadgePlus className="h-4 w-4" />
                  Agregar primer bloque
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {editable && renderInsertSlot(visibleSections[0]?.index ?? 0, "slot-top")}
            {visibleSections.map(({ section, index }, visibleIndex) => {
              const nextEntry = visibleSections[visibleIndex + 1]
              const trailingInsertIndex = nextEntry ? nextEntry.index : index + 1

              return (
                <div key={section.id}>
                  <SectionShell
                    section={section}
                    selected={selectedId === section.id}
                    editable={editable}
                    compactToolbar={compactToolbar}
                    onSelect={onSelect}
                    onDuplicate={onDuplicate}
                    onToggleVisibility={onToggleVisibility}
                    onMove={onMove}
                    onDelete={onDelete}
                    onDragStart={setDraggingId}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setDropIndex(null)
                    }}
                    onContextOpen={setContextMenu}
                    dragging={draggingId === section.id}
                  >
                    <div id={getLandingSectionDomId(section.id)}>
                      {renderSectionContent(section, config, datasets, editable && selectedId === section.id, viewportMode, editable, htmlIframeRef, onSelect, onInlineUpdate, executePreviewAction, onHtmlElementSelect, onHtmlEditingChange, onHtmlSnapshot, onHtmlInteractionLockChange, onHtmlOpenInspector)}
                    </div>
                  </SectionShell>
                  {editable && renderInsertSlot(trailingInsertIndex, `slot-after-${section.id}`)}
                </div>
              )
            })}
          </>
        )}
        <div
          data-he-edit-id="footer"
          className={cn(
            editable && "group relative cursor-pointer transition-all",
            editable && selectedId === "footer" && "ring-2 ring-primary ring-inset"
          )}
          onClickCapture={(event) => {
            if (!editable) return
            event.preventDefault()
            event.stopPropagation()
            onSelect?.("footer")
          }}
          onClick={() => editable && onSelect?.("footer")}
          onContextMenu={(event) => {
            if (!editable) return
            event.preventDefault()
            event.stopPropagation()
            setContextMenu({ id: "footer", x: event.clientX, y: event.clientY })
          }}
        >
          {editable && selectedId === "footer" ? (
            <div className="pointer-events-none absolute left-0 right-0 top-0 z-50 flex items-center justify-between bg-primary/10 px-4 py-1.5">
              <div className="text-[11px] font-bold text-primary">FOOTER</div>
            </div>
          ) : null}
          <Footer
            previewMode
            generalOverride={config.general}
            navOverride={config.nav}
            pageLinksOverride={config.pages}
            onPreviewNavigate={(href) => handlePreviewChromeNavigation("footer", href)}
          />
        </div>
      </div>
      <LandingPopupHost popup={activePopup} onClose={() => { setActivePopupId(null); setPendingPopupSubmitAction(undefined) }} onAction={(action) => executePreviewAction(action)} fallbackSubmitAction={pendingPopupSubmitAction} />
    </main>
  )
}
