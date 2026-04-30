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

export interface CMSNavAppearance {
  fontFamily?: string
  fontSize?: string
  fontWeight?: string
  letterSpacing?: string
  surfaceColor?: string
  borderColor?: string
  brandColor?: string
  taglineColor?: string
  linkColor?: string
  linkHoverColor?: string
  primaryButtonColor?: string
  primaryButtonTextColor?: string
  secondaryButtonColor?: string
  secondaryButtonTextColor?: string
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
  heroShellBg?: string
  shaderSecondaryColor?: string
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
  | "simulatorsFeed" | "coursesFeed" | "evaluationsFeed" | "coursesCatalog"
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
  schemaVersion?: number
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
    navAppearance?: CMSNavAppearance
  }
  pages: CMSPage[]
  popups: CMSPopup[]
}

const CURRENT_CMS_SCHEMA_VERSION = 4
const HOME_ALLOWED_TYPES = new Set<CMSSection["type"]>(["hero"])
const REFRESHED_BUILTIN_PAGE_SLUGS = new Set(["docentes-ec", "ia", "simulador"])

function cloneCMSSection(section: CMSSection): CMSSection {
  return {
    ...section,
    data: section.data ? { ...section.data } : {},
    style: section.style ? { ...section.style } : undefined,
    settings: section.settings ? JSON.parse(JSON.stringify(section.settings)) : undefined,
  }
}

function normalizeHomeSections(
  sections: CMSSection[] | undefined,
  _schemaVersion?: number
): CMSSection[] {
  const baseSections: CMSSection[] = Array.isArray(sections)
    ? sections.map(cloneCMSSection)
    : DEFAULT_CMS.sections.map(cloneCMSSection)

  const filteredSections = baseSections.filter((section) => HOME_ALLOWED_TYPES.has(section.type))
  if (filteredSections.some((section) => section.type === "hero")) return filteredSections

  return [{ id: "hero", type: "hero", visible: true, data: {} }]
}

// ─── Defaults ─────────────────────────────────────────────────────────────────

export const DEFAULT_CMS: CMSConfig = {
  schemaVersion: CURRENT_CMS_SCHEMA_VERSION,
  nav: {
    items: [
      { id: "n1", label: "Inicio", href: "/" },
      { id: "n2", label: "Docentes EC", href: "/docentes-ec" },
      { id: "n3", label: "Cursos", href: "/cursos" },
      { id: "n4", label: "IA", href: "/ia" },
    ],
    loginLabel: "Iniciar Sesion",
    registerLabel: "Registrarse Gratis",
  },
  sections: [
    { id: "hero",         type: "hero",         visible: true, data: {} },
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
    footerText: "(c) 2026 Hack Evans. Todos los derechos reservados.",
    footerLinks: [
      { id: "fl1", label: "Privacidad", href: "#" },
      { id: "fl2", label: "Terminos", href: "#" },
      { id: "fl3", label: "Contacto", href: "#contacto" },
    ],
    navAppearance: {
      fontFamily: "'Space Grotesk', var(--font-barlow), system-ui, sans-serif",
      fontSize: "13px",
      fontWeight: "600",
      letterSpacing: "0.06em",
      surfaceColor: "#0b1220",
      borderColor: "#1e293b",
      brandColor: "#ffffff",
      taglineColor: "#94a3b8",
      linkColor: "#cbd5e1",
      linkHoverColor: "#ffffff",
      primaryButtonColor: "#E8392A",
      primaryButtonTextColor: "#ffffff",
      secondaryButtonColor: "#0f172a",
      secondaryButtonTextColor: "#ffffff",
    },
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
            badgeIcon: "presentation",
            accentColor: "#E8392A",
            layout: "split",
            titulo: "Preparacion clara para",
            subtitulo: "docentes en Ecuador",
            descripcion: "Organiza tu avance con simuladores alineados al proceso oficial, reportes por competencia y una ruta de estudio pensada para convocatorias reales.",
            features: [
              "Simuladores por perfil y convocatoria",
              "Prioridades de estudio por competencia",
              "Seguimiento de progreso en una sola vista",
              "Acceso guiado desde cualquier dispositivo",
            ],
            ctaPrimario: "Comenzar ahora",
            ctaSecundario: "Ver simuladores",
            rightPanel: "stats",
            statsTitle: "Indicadores del ecosistema",
            stats: [
              { icon: "users", value: "15K+", label: "Docentes activos" },
              { icon: "award", value: "98%", label: "Aprobacion reportada" },
              { icon: "clipboard-list", value: "5,000+", label: "Preguntas verificadas" },
            ],
          },
        },
        {
          id: "dec-cards",
          type: "featureCards",
          visible: true,
          data: {
            titulo: "Un flujo mas profesional para preparar tu convocatoria",
            descripcion: "Cada bloque esta pensado para que el docente sepa que estudiar, cuanto domina y cual es la siguiente accion recomendada.",
            columns: 3,
            items: [
              {
                id: "dec-f1",
                icon: "calendar-days",
                title: "Ruta por convocatoria",
                description: "El contenido se organiza por etapa, perfil y prioridad para evitar estudiar sin foco.",
                accentColor: "#E8392A",
              },
              {
                id: "dec-f2",
                icon: "bar-chart",
                title: "Panel de avance util",
                description: "Visualiza fortalezas, brechas y progreso por competencia con una lectura inmediata.",
                accentColor: "#E8392A",
              },
              {
                id: "dec-f3",
                icon: "shield",
                title: "Contenido alineado",
                description: "Materiales y simuladores revisados para mantenerse conectados con el proceso docente en Ecuador.",
                accentColor: "#E8392A",
              },
            ],
          },
        },
        {
          id: "dec-rich",
          type: "richText",
          visible: true,
          style: { bg: "dark" },
          data: {
            eyebrow: "METODO DE ESTUDIO",
            titulo: "Una experiencia hecha para tomar mejores decisiones",
            descripcion: "No se trata solo de practicar mas, sino de practicar mejor y saber donde intervenir primero.",
            body: "Hack Evans reune simulacion, lectura de resultados y accion recomendada en un mismo flujo. Asi la experiencia se siente mas intuitiva y el docente no pierde tiempo entre pasos desconectados.",
            bullets: [
              "Diagnostico inicial para ubicar tu nivel actual",
              "Practica guiada con bloques que responden a tus errores",
              "Recomendaciones concretas para la siguiente sesion",
            ],
            primaryLabel: "Crear mi cuenta",
            primaryHref: "/registro",
            primaryAction: { type: "page", href: "/registro" },
            secondaryLabel: "Ir al simulador",
            secondaryHref: "/simulador",
            secondaryAction: { type: "page", href: "/simulador" },
            alignment: "left",
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
            badge: "IA APLICADA",
            badgeIcon: "sparkles",
            accentColor: "#3b82f6",
            layout: "split",
            titulo: "Inteligencia artificial para una",
            subtitulo: "preparacion mas precisa",
            descripcion: "Activa asistentes que detectan tus brechas, recomiendan el siguiente paso y convierten tu estudio en un flujo mas simple y accionable.",
            features: [
              "Diagnostico inicial en pocos pasos",
              "Sugerencias de estudio segun rendimiento",
              "Explicaciones y refuerzos al instante",
              "Ajuste automatico de dificultad",
            ],
            ctaPrimario: "Probar IA",
            ctaSecundario: "Ver recorrido",
            rightPanel: "stats",
            statsTitle: "Flujo asistido por IA",
            stats: [
              { icon: "lightbulb", value: "24/7", label: "Asistencia para estudiar" },
              { icon: "file-text", value: "1 clic", label: "Diagnostico inicial" },
              { icon: "bar-chart", value: "Auto", label: "Ajuste por rendimiento" },
            ],
          },
        },
        {
          id: "ia-features",
          type: "featureCards",
          visible: true,
          data: {
            titulo: "Automatizaciones utiles para estudiar con menos friccion",
            descripcion: "La IA no complica la experiencia: ordena la informacion, prioriza acciones y deja mas claro que hacer despues.",
            columns: 4,
            items: [
              {
                id: "f1",
                icon: "lightbulb",
                title: "Planes inteligentes",
                description: "La IA detecta debilidades y reorganiza los temas que mas impacto tienen en tu avance.",
                accentColor: "#3b82f6",
              },
              {
                id: "f2",
                icon: "file-text",
                title: "Preguntas y explicaciones",
                description: "Genera refuerzos claros, ejemplos y variaciones para practicar sin repetir siempre lo mismo.",
                accentColor: "#3b82f6",
              },
              {
                id: "f3",
                icon: "bar-chart",
                title: "Reportes accionables",
                description: "Resume patrones de error y traduce los datos en prioridades faciles de ejecutar.",
                accentColor: "#3b82f6",
              },
              {
                id: "f4",
                icon: "monitor",
                title: "Todo en una sola vista",
                description: "Menos pasos, mejor lectura del progreso y un flujo continuo desde diagnostico hasta practica.",
                accentColor: "#3b82f6",
              },
            ],
          },
        },
        {
          id: "ia-rich",
          type: "richText",
          visible: true,
          style: { bg: "dark" },
          data: {
            eyebrow: "ASISTENTES PRACTICOS",
            titulo: "La IA acompana sin volver compleja la experiencia",
            descripcion: "El objetivo es reducir friccion: menos pasos, mejores recomendaciones y una lectura clara del avance.",
            bullets: [
              "Sugiere temas segun tus errores mas recientes",
              "Ajusta la dificultad conforme mejoras",
              "Resume debilidades antes de cada simulacion",
            ],
            primaryLabel: "Crear mi cuenta",
            primaryHref: "/registro",
            primaryAction: { type: "page", href: "/registro" },
            secondaryLabel: "Explorar simuladores",
            secondaryHref: "/simulador",
            secondaryAction: { type: "page", href: "/simulador" },
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
            badge: "SIMULADORES",
            badgeIcon: "target",
            accentColor: "#E8392A",
            layout: "split",
            titulo: "Simuladores listos para practicar con una experiencia mas clara",
            subtitulo: "PRACTICA GUIADA",
            descripcion: "Presenta tus simuladores publicados con una portada estructurada, conectada al admin y alineada al mismo sistema visual del sitio.",
            features: [
              "Feed conectado a simuladores publicados",
              "Filtro por categoria sin tocar codigo",
              "CTA directo al catalogo o al dashboard",
            ],
            ctaPrimario: "Ver simuladores",
            ctaSecundario: "Ir al dashboard",
            primaryAction: { type: "page", href: "/simulador" },
            secondaryAction: { type: "page", href: "/dashboard/simuladores" },
            rightPanel: "stats",
            statsTitle: "Panel de simuladores",
            stats: [
              { icon: "target", value: "Live", label: "Catalogo conectado" },
              { icon: "bar-chart", value: "Uso", label: "Ranking por actividad" },
              { icon: "monitor", value: "UX", label: "Sistema visual coherente" },
            ],
          },
        },
        {
          id: "sim-feed",
          type: "simulatorsFeed",
          visible: true,
          data: {
            badge: "Simuladores",
            titulo: "Simuladores conectados al admin",
            descripcion: "Este bloque toma solo simuladores publicados para que el contenido salga ordenado y no dependa de HTML manual.",
            ctaLabel: "Explorar simuladores",
            ctaHref: "/simulador",
            ctaAction: { type: "page", href: "/simulador" },
          },
          settings: {
            source: {
              mode: "auto",
              order: "latest",
              limit: 6,
              display: "grid",
              columns: 3,
              showMeta: true,
              showButton: true,
              showBadge: true,
            },
          },
        },
        {
          id: "sim-rich",
          type: "richText",
          visible: true,
          style: { bg: "dark" },
          data: {
            eyebrow: "EDICION ESTRUCTURADA",
            titulo: "Edita esta pagina con bloques del sistema, no con HTML suelto",
            descripcion: "La pagina de simuladores ahora sigue el mismo flujo modular que otras vistas del sitio para mantener consistencia visual y de gestion.",
            body: "Usa el hero, el feed dinamico y los bloques editoriales para ajustar mensajes, llamadas a la accion y contexto sin depender de una landing importada o de codigo pegado manualmente.",
            bullets: [
              "Bloques visuales mas faciles de mantener",
              "Contenido conectado a simuladores publicados",
              "Misma logica de edicion que IA y Docentes EC",
            ],
            alignment: "left",
            primaryLabel: "Ir al catalogo",
            primaryHref: "/simulador",
            secondaryLabel: "Volver al inicio",
            secondaryHref: "/",
            primaryAction: { type: "page", href: "/simulador" },
            secondaryAction: { type: "page", href: "/" },
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

function normalizeCMSPage(page: Partial<CMSPage> | undefined, schemaVersion?: number): CMSPage | null {
  if (!page?.slug) return null

  const defaultPage = DEFAULT_CMS.pages.find((entry) => entry.slug === page.slug)
  const title = page.title ?? defaultPage?.title ?? "Nueva pagina"
  const containsLegacyCustomCode =
    page.slug === "simulador" &&
    Array.isArray(page.sections) &&
    page.sections.some((section) => section?.type === "customCode")
  const shouldRefreshBuiltInSections =
    Boolean(defaultPage?.builtin) &&
    (
      (REFRESHED_BUILTIN_PAGE_SLUGS.has(page.slug) && Number(schemaVersion || 0) < CURRENT_CMS_SCHEMA_VERSION) ||
      containsLegacyCustomCode
    )
  const baseSections = shouldRefreshBuiltInSections
    ? defaultPage?.sections
    : page.sections ?? defaultPage?.sections ?? []

  return {
    slug: page.slug,
    title,
    builtin: page.builtin ?? defaultPage?.builtin ?? false,
    showInNav: page.showInNav ?? defaultPage?.showInNav ?? true,
    navLabel: page.navLabel ?? defaultPage?.navLabel ?? title,
    sections: Array.isArray(baseSections) ? baseSections.map(cloneCMSSection) : [],
  }
}

function mergeDefaultNavItems(items?: CMSNavItem[]): CMSNavItem[] {
  const current = Array.isArray(items) && items.length > 0 ? [...items] : [...DEFAULT_CMS.nav.items]

  for (const defaultItem of DEFAULT_CMS.nav.items) {
    if (current.some((item) => item.href === defaultItem.href)) continue

    const docentesIndex = current.findIndex((item) => item.href === "/docentes-ec")
    if (defaultItem.href === "/cursos" && docentesIndex >= 0) {
      current.splice(docentesIndex + 1, 0, defaultItem)
      continue
    }

    current.push(defaultItem)
  }

  return current
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
          .map((page: Partial<CMSPage>) => normalizeCMSPage(page, p.schemaVersion))
          .filter((page: CMSPage | null): page is CMSPage => Boolean(page))
      : DEFAULT_CMS.pages
    return {
      schemaVersion: CURRENT_CMS_SCHEMA_VERSION,
      nav:          {
        ...DEFAULT_CMS.nav,
        ...(p.nav ?? {}),
        items: mergeDefaultNavItems(p.nav?.items),
      },
      sections:     normalizeHomeSections(p.sections, p.schemaVersion),
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
  const payload = JSON.stringify({ ...config, schemaVersion: CURRENT_CMS_SCHEMA_VERSION })
  localStorage.setItem(getCMSStorageKey(source), payload)
  window.dispatchEvent(new CustomEvent(getCMSEventName(source)))
}

export function publishCMSConfig(config: CMSConfig): void {
  if (typeof window === "undefined") return
  const payload = JSON.stringify({ ...config, schemaVersion: CURRENT_CMS_SCHEMA_VERSION })
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
