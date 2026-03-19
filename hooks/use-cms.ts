"use client"

import { useEffect, useState } from "react"

// ─── Nav ──────────────────────────────────────────────────────────────────────

export interface CMSNavItem {
  id: string
  label: string
  href: string
  external?: boolean
  badge?: string
}

export type CMSActionType = "none" | "section" | "page" | "popup" | "external" | "simulator"

export interface CMSActionConfig {
  type?: CMSActionType
  sectionId?: string
  href?: string
  popupId?: string
  formMode?: "popup" | "section" | "page"
  formPageHref?: string
  postSubmitAction?: CMSActionConfig
  skipIfRegistered?: boolean
  openInNewTab?: boolean
}

export type CMSTextAlign = "left" | "center" | "right"
export type CMSTextSize = "sm" | "md" | "lg" | "xl" | "2xl"

export interface CMSTextStyle {
  bold?: boolean
  italic?: boolean
  color?: string
  align?: CMSTextAlign
  size?: CMSTextSize
  href?: string
}

export interface CMSHeroAppearance {
  badgeColor?: string
  titleColor?: string
  descriptionColor?: string
  primaryButtonBg?: string
  primaryButtonText?: string
  secondaryButtonText?: string
  secondaryButtonBorder?: string
  surfaceBg?: string
  surfaceBorder?: string
  sectionPaddingY?: number
  sectionPaddingX?: number
  titleSize?: number
  titleWeight?: number
  descriptionSize?: number
}

export type CMSHtmlImportMode = "sandbox" | "hybrid" | "adapted"

export interface CMSCustomCodeThemeConfig {
  accentColor?: string
  textColor?: string
  mutedColor?: string
  surfaceColor?: string
  borderColor?: string
  backgroundColor?: string
  navBackground?: string
  navBorderColor?: string
  radius?: number
  fontFamily?: string
}

export interface CMSCustomCodeImportSettings {
  mode?: CMSHtmlImportMode
  stripNavigation?: boolean
  stripFooter?: boolean
}

export interface CMSCustomCodeActionBinding {
  id: string
  eid: string
  label: string
  tag?: string
  href?: string
  action?: CMSActionConfig
}

export type CMSFormFieldType = "text" | "email" | "tel" | "number" | "textarea" | "select" | "checkbox"

export interface CMSFormFieldConfig {
  id: string
  type: CMSFormFieldType
  label: string
  placeholder?: string
  required?: boolean
  width?: "full" | "half"
  options?: string[]
}

export interface CMSPopup {
  id: string
  name: string
  type: "form" | "info"
  title: string
  description: string
  submitLabel?: string
  successTitle?: string
  successMessage?: string
  fields?: CMSFormFieldConfig[]
  primaryLabel?: string
  secondaryLabel?: string
  primaryAction?: CMSActionConfig
  secondaryAction?: CMSActionConfig
  submitAction?: CMSActionConfig
}

// ─── Section system ───────────────────────────────────────────────────────────

export type CMSSectionType =
  | "hero" | "benefits" | "testimonials" | "pricing" | "contact"
  | "cta" | "imageText" | "video" | "faq"
  | "textBanner" | "gallery" | "stats" | "customCode"
  | "pageHero" | "featureCards" | "richText" | "logoStrip" | "spacer" | "embed"
  | "simulatorsFeed" | "coursesFeed" | "evaluationsFeed"
  | "formBuilder"

export interface CMSSectionStyle {
  bg?: "transparent" | "dark" | "darkDeep" | "accent" | string
  padding?: "none" | "sm" | "md" | "lg"
}

export interface CMSSectionVisibility {
  audience?: "all" | "guest" | "authenticated"
  device?: "all" | "desktop" | "mobile"
  hideIfEmpty?: boolean
}

export interface CMSSectionSourceSettings {
  mode?: "auto" | "manual"
  order?: "latest" | "alphabetical"
  limit?: number
  manualIds?: string[]
  display?: "grid" | "carousel"
  columns?: 2 | 3 | 4
  showMeta?: boolean
  showButton?: boolean
  showBadge?: boolean
}

export interface CMSSectionSettings {
  visibility?: CMSSectionVisibility
  source?: CMSSectionSourceSettings
}

export interface CMSSection {
  id: string
  type: CMSSectionType
  visible: boolean
  data: Record<string, any>
  style?: CMSSectionStyle
  settings?: CMSSectionSettings
}

// ─── Built-in section configs ─────────────────────────────────────────────────

export interface CMSHeroConfig {
  badge: string
  titulo: string
  descripcion: string
  features: string[]
  stats: { value: string; label: string }[]
  ctaPrimario: string
  ctaSecundario: string
  primaryAction?: CMSActionConfig
  secondaryAction?: CMSActionConfig
  textStyles?: Record<string, CMSTextStyle>
  appearance?: CMSHeroAppearance
}

export interface CMSBenefitItem {
  title: string
  description: string
  highlight: string
}

export interface CMSBenefitsConfig {
  sectionLabel: string
  titulo: string
  descripcion: string
  items: CMSBenefitItem[]
  stats: { value: string; label: string }[]
}

export interface CMSTestimonialItem {
  id: string
  nombre: string
  cargo: string
  location: string
  texto: string
  rating: number
}

export interface CMSTestimonialsConfig {
  titulo: string
  descripcion: string
  items: CMSTestimonialItem[]
}

// ─── Multi-page system ────────────────────────────────────────────────────────

export interface CMSPage {
  slug: string
  title: string
  builtin?: boolean
  showInNav?: boolean
  navLabel?: string
  sections: CMSSection[]
}

// ─── Full config ──────────────────────────────────────────────────────────────

export interface CMSConfig {
  nav: {
    items: CMSNavItem[]
    loginLabel: string
    registerLabel: string
  }
  sections: CMSSection[]
  hero: CMSHeroConfig
  benefits: CMSBenefitsConfig
  testimonials: CMSTestimonialsConfig
  general: {
    nombrePlataforma: string
    tagline: string
    footerText: string
    footerLinks: { id: string; label: string; href: string }[]
  }
  pages: CMSPage[]
  popups: CMSPopup[]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CMS: CMSConfig = {
  nav: {
    items: [
      { id: "n1", label: "Inicio", href: "/" },
      { id: "n2", label: "Docentes EC", href: "/docentes-ec" },
      { id: "n3", label: "IA", href: "/ia" },
    ],
    loginLabel: "Iniciar Sesion",
    registerLabel: "Registrarse Gratis",
  },
  sections: [
    { id: "hero",         type: "hero",         visible: true, data: {} },
    { id: "benefits",     type: "benefits",     visible: true, data: {} },
    { id: "testimonials", type: "testimonials", visible: true, data: {} },
    { id: "pricing",      type: "pricing",      visible: true, data: {} },
    { id: "contact",      type: "contact",      visible: true, data: {} },
  ],
  hero: {
    badge: "QSM 10 - 2026 Actualizado",
    titulo: "Prepara tu Exito Docente",
    descripcion:
      "La plataforma #1 en Ecuador para docentes. Simuladores actualizados, evaluaciones personalizadas y seguimiento en tiempo real de tu progreso.",
    features: [
      "Simuladores con preguntas reales del INEVAL",
      "Analisis detallado de tu rendimiento",
      "Acceso 24/7 desde cualquier dispositivo",
    ],
    stats: [
      { value: "15,000+", label: "Docentes preparados" },
      { value: "98%", label: "Tasa de aprobacion" },
      { value: "50+", label: "Simuladores disponibles" },
    ],
    ctaPrimario: "Comenzar Ahora",
    ctaSecundario: "Ver Demo",
    primaryAction: { type: "page", href: "/registro" },
    secondaryAction: { type: "page", href: "/simulador" },
  },
  benefits: {
    sectionLabel: "Por que elegirnos",
    titulo: "CONSULTORIA EDUCATIVA",
    descripcion:
      "La plataforma mas completa para tu preparacion docente. Herramientas profesionales disenadas para maximizar tu exito.",
    items: [
      { title: "Simuladores Actualizados", description: "Preguntas basadas en examenes reales del INEVAL, actualizadas constantemente con el banco de preguntas oficial.", highlight: "+5,000 preguntas" },
      { title: "Analisis de Rendimiento", description: "Estadisticas detalladas de tu progreso, areas de mejora y comparacion con otros usuarios.", highlight: "Metricas en tiempo real" },
      { title: "Practica en Tiempo Real", description: "Simulacion exacta del examen con temporizador, condiciones reales y retroalimentacion inmediata.", highlight: "Modo examen real" },
      { title: "Contenido Verificado", description: "Material validado por expertos pedagogicos y alineado 100% con el curriculo nacional vigente.", highlight: "Certificado INEVAL" },
      { title: "Respuestas Instantaneas", description: "Retroalimentacion inmediata con explicaciones detalladas para cada pregunta respondida.", highlight: "Aprende al instante" },
      { title: "Comunidad Activa", description: "Conecta con miles de docentes, comparte experiencias y aprende de otros profesionales.", highlight: "+15,000 docentes" },
    ],
    stats: [
      { value: "98%", label: "Tasa de Aprobacion" },
      { value: "15K+", label: "Docentes Activos" },
      { value: "50+", label: "Simuladores" },
      { value: "24/7", label: "Soporte Disponible" },
    ],
  },
  testimonials: {
    titulo: "Lo que dicen nuestros docentes",
    descripcion: "Miles de educadores han transformado su carrera con nuestra plataforma",
    items: [
      { id: "t1", nombre: "Maria Fernanda Lopez", cargo: "Docente de Matematicas", location: "Quito, Pichincha", texto: "Gracias a Hack Evans pude aprobar el QSM en mi primer intento. Los simuladores son identicos al examen real y las explicaciones me ayudaron a entender mis errores.", rating: 5 },
      { id: "t2", nombre: "Carlos Andres Mendoza", cargo: "Docente de Ciencias Naturales", location: "Guayaquil, Guayas", texto: "La mejor inversion para mi carrera docente. El analisis de rendimiento me permitio enfocarme en mis areas debiles y mejorar significativamente.", rating: 5 },
      { id: "t3", nombre: "Ana Patricia Reyes", cargo: "Docente de Lengua y Literatura", location: "Cuenca, Azuay", texto: "Despues de varios intentos fallidos, finalmente logre mi nombramiento gracias a esta plataforma. El contenido esta muy bien organizado y actualizado.", rating: 5 },
      { id: "t4", nombre: "Roberto Sanchez", cargo: "Docente de Estudios Sociales", location: "Ambato, Tungurahua", texto: "Los cursos de pedagogia digital complementan perfectamente los simuladores. Me siento mucho mas preparado para cualquier evaluacion.", rating: 5 },
      { id: "t5", nombre: "Lucia Morales", cargo: "Docente de Ingles", location: "Manta, Manabi", texto: "Excelente plataforma. El soporte es muy rapido y los recursos estan siempre actualizados con las ultimas normativas del Ministerio.", rating: 5 },
    ],
  },
  general: {
    nombrePlataforma: "Hack Evans",
    tagline: "La plataforma #1 para docentes en Ecuador",
    footerText: "© 2026 Hack Evans. Todos los derechos reservados.",
    footerLinks: [
      { id: "fl1", label: "Privacidad", href: "#" },
      { id: "fl2", label: "Terminos", href: "#" },
      { id: "fl3", label: "Contacto", href: "#contacto" },
    ],
  },
  pages: [
    {
      slug: "docentes-ec",
      title: "Docentes EC",
      builtin: true,
      showInNav: true,
      navLabel: "Docentes EC",
      sections: [
        {
          id: "dec-hero",
          type: "pageHero",
          visible: true,
          data: {
            badge: "DOCENTES EC",
            badgeEmoji: "👨‍🏫",
            accentColor: "#E8392A",
            layout: "split",
            titulo: "Preparacion enfocada en",
            subtitulo: "docentes ecuatorianos",
            descripcion: "Accede a simuladores actualizados, evaluaciones por perfil y reportes claros para tu avance. Todo alineado al proceso oficial en Ecuador.",
            features: ["Simuladores por area y perfil docente", "Rutas de estudio personalizadas", "Seguimiento real de progreso", "Banco de preguntas actualizado"],
            ctaPrimario: "Comenzar Ahora",
            ctaSecundario: "Ver Demo",
            rightPanel: "stats",
            statsTitle: "Resultados reales",
            stats: [
              { emoji: "👥", value: "15K+", label: "Docentes EC" },
              { emoji: "🏆", value: "98%", label: "Tasa de aprobacion" },
              { emoji: "📖", value: "5,000+", label: "Preguntas reales" },
            ],
          },
        },
      ],
    },
    {
      slug: "ia",
      title: "IA",
      builtin: true,
      showInNav: true,
      navLabel: "IA",
      sections: [
        {
          id: "ia-hero",
          type: "pageHero",
          visible: true,
          data: {
            badge: "IA",
            badgeEmoji: "⚡",
            accentColor: "#3b82f6",
            layout: "center",
            titulo: "Inteligencia Artificial para tu preparacion",
            descripcion: "Automatiza el estudio con asistentes inteligentes, diagnosticos rapidos y planes ajustados a tu nivel.",
            ctaPrimario: "Probar IA",
            ctaSecundario: "Ver Demo",
            rightPanel: "none",
          },
        },
        {
          id: "ia-features",
          type: "featureCards",
          visible: true,
          data: {
            columns: 3,
            items: [
              { id: "f1", emoji: "🧠", title: "Rutas inteligentes", description: "La IA detecta tus debilidades y prioriza temas clave.", accentColor: "#3b82f6" },
              { id: "f2", emoji: "✨", title: "Generacion de preguntas", description: "Banco dinamico con variaciones y explicaciones claras.", accentColor: "#3b82f6" },
              { id: "f3", emoji: "📊", title: "Analisis avanzado", description: "Reportes visuales con progreso por competencia.", accentColor: "#3b82f6" },
            ],
          },
        },
        {
          id: "ia-checks",
          type: "textBanner",
          visible: true,
          data: {
            titulo: "Todo lo que necesitas",
            descripcion: "Recomendaciones personalizadas • Feedback inmediato por pregunta • Ajuste automatico del nivel",
            ctaLabel: "Comenzar gratis",
            ctaHref: "/registro",
            alignment: "center",
          },
        },
      ],
    },
    {
      slug: "simulador",
      title: "Simulador",
      builtin: true,
      showInNav: true,
      navLabel: "Simulador",
      sections: [
        {
          id: "sim-hero",
          type: "pageHero",
          visible: true,
          data: {
            badge: "SIMULADOR QSM",
            badgeEmoji: "🎯",
            accentColor: "#E8392A",
            layout: "center",
            titulo: "Practica con simuladores reales",
            descripcion: "Examenes identicos al INEVAL con retroalimentacion inmediata y analisis de rendimiento detallado.",
            ctaPrimario: "Comenzar Simulador",
            ctaHref: "/registro",
            ctaSecundario: "Ver Precios",
            ctaSecHref: "/#precios",
            rightPanel: "none",
          },
        },
        {
          id: "sim-features",
          type: "featureCards",
          visible: true,
          data: {
            columns: 3,
            items: [
              { id: "sf1", emoji: "📝", title: "Preguntas reales INEVAL", description: "Banco actualizado con mas de 5,000 preguntas verificadas del examen oficial.", accentColor: "#E8392A" },
              { id: "sf2", emoji: "⏱️", title: "Modo examen real", description: "Temporizador, condiciones reales y retroalimentacion inmediata al terminar.", accentColor: "#E8392A" },
              { id: "sf3", emoji: "📈", title: "Analisis de rendimiento", description: "Estadisticas detalladas por area, competencia y comparacion con otros docentes.", accentColor: "#E8392A" },
            ],
          },
        },
      ],
    },
  ],
  popups: [
    {
      id: "popup-registro-simulador",
      name: "Registro previo simulador",
      type: "form",
      title: "Antes de comenzar",
      description: "Completa tus datos para acceder al simulador y guardar tu avance.",
      submitLabel: "Continuar al simulador",
      successTitle: "Datos enviados",
      successMessage: "Tu registro fue guardado correctamente.",
      submitAction: { type: "page", href: "/simulador" },
      fields: [
        { id: "popup_name", type: "text", label: "Nombre completo", placeholder: "Escribe tu nombre", required: true, width: "full" },
        { id: "popup_email", type: "email", label: "Correo", placeholder: "correo@dominio.com", required: true, width: "half" },
        { id: "popup_phone", type: "tel", label: "Telefono", placeholder: "0999999999", required: false, width: "half" },
      ],
    },
  ],
}

// ─── Storage ──────────────────────────────────────────────────────────────────

export type CMSSource = "draft" | "published"

const CMS_DRAFT_KEY = "he_cms_config_draft"
const CMS_PUBLISHED_KEY = "he_cms_config_published"
const CMS_LEGACY_KEY = "he_cms_config"
const CMS_DRAFT_EVENT = "cms-draft-config-updated"
const CMS_PUBLISHED_EVENT = "cms-published-config-updated"

function getCMSStorageKey(source: CMSSource) {
  return source === "draft" ? CMS_DRAFT_KEY : CMS_PUBLISHED_KEY
}

function getCMSEventName(source: CMSSource) {
  return source === "draft" ? CMS_DRAFT_EVENT : CMS_PUBLISHED_EVENT
}

function normalizeCMSPage(page: Partial<CMSPage> | undefined): CMSPage | null {
  if (!page?.slug) return null

  const defaultPage = DEFAULT_CMS.pages.find((entry) => entry.slug === page.slug)
  const title = page.title ?? defaultPage?.title ?? "Nueva pagina"

  return {
    slug: page.slug,
    title,
    builtin: page.builtin ?? defaultPage?.builtin ?? false,
    showInNav: page.showInNav ?? defaultPage?.showInNav ?? true,
    navLabel: page.navLabel ?? defaultPage?.navLabel ?? title,
    sections: page.sections ?? defaultPage?.sections ?? [],
  }
}

export function getCMSConfig(source: CMSSource = "published"): CMSConfig {
  if (typeof window === "undefined") return DEFAULT_CMS
  try {
    const legacyRaw = localStorage.getItem(CMS_LEGACY_KEY)
    const draftRaw = localStorage.getItem(CMS_DRAFT_KEY) ?? legacyRaw
    const publishedRaw = localStorage.getItem(CMS_PUBLISHED_KEY) ?? draftRaw

    if (legacyRaw) {
      if (!localStorage.getItem(CMS_DRAFT_KEY)) localStorage.setItem(CMS_DRAFT_KEY, legacyRaw)
      if (!localStorage.getItem(CMS_PUBLISHED_KEY)) localStorage.setItem(CMS_PUBLISHED_KEY, publishedRaw ?? legacyRaw)
    }

    const raw = source === "draft" ? draftRaw : publishedRaw
    if (!raw) return DEFAULT_CMS
    const p = JSON.parse(raw)
    const normalizedPages = Array.isArray(p.pages)
      ? p.pages
          .map((page: Partial<CMSPage>) => normalizeCMSPage(page))
          .filter((page: CMSPage | null): page is CMSPage => Boolean(page))
      : DEFAULT_CMS.pages
    return {
      nav:          { ...DEFAULT_CMS.nav,          ...(p.nav          ?? {}) },
      sections:     p.sections ?? DEFAULT_CMS.sections,
      hero:         { ...DEFAULT_CMS.hero,         ...(p.hero         ?? {}) },
      benefits:     { ...DEFAULT_CMS.benefits,     ...(p.benefits     ?? {}) },
      testimonials: { ...DEFAULT_CMS.testimonials, ...(p.testimonials ?? {}) },
      general:      { ...DEFAULT_CMS.general,      ...(p.general      ?? {}) },
      pages:        normalizedPages,
      popups:       p.popups ?? DEFAULT_CMS.popups,
    }
  } catch {
    return DEFAULT_CMS
  }
}

export function saveCMSConfig(config: CMSConfig, source: CMSSource = "draft"): void {
  if (typeof window === "undefined") return
  const payload = JSON.stringify(config)
  localStorage.setItem(getCMSStorageKey(source), payload)
  window.dispatchEvent(new CustomEvent(getCMSEventName(source)))
}

export function publishCMSConfig(config: CMSConfig): void {
  if (typeof window === "undefined") return
  const payload = JSON.stringify(config)
  localStorage.setItem(CMS_DRAFT_KEY, payload)
  localStorage.setItem(CMS_PUBLISHED_KEY, payload)
  window.dispatchEvent(new CustomEvent(CMS_DRAFT_EVENT))
  window.dispatchEvent(new CustomEvent(CMS_PUBLISHED_EVENT))
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCMS(source: CMSSource = "published") {
  const [config, setConfig] = useState<CMSConfig>(DEFAULT_CMS)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const syncConfig = () => {
      setConfig(getCMSConfig(source))
      setIsLoading(false)
    }

    syncConfig()

    const handleStorage = (event: StorageEvent) => {
      const validKeys = [getCMSStorageKey(source), CMS_LEGACY_KEY]
      if (!event.key || validKeys.includes(event.key)) {
        syncConfig()
      }
    }

    window.addEventListener("storage", handleStorage)
    window.addEventListener(getCMSEventName(source), syncConfig)

    return () => {
      window.removeEventListener("storage", handleStorage)
      window.removeEventListener(getCMSEventName(source), syncConfig)
    }
  }, [source])

  return { config, isLoading }
}
