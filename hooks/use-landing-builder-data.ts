"use client"

import { useEffect, useMemo, useState } from "react"
import type { CMSSection, CMSSectionSettings } from "@/hooks/use-cms"
import { getSimuladores } from "@/simuladores/storage"

type RawCourseEstado = "borrador" | "en_revision" | "publicado" | "archivado"

interface RawCourseResource {
  duracionMinutos?: number
}

interface RawCourseSection {
  recursos?: RawCourseResource[]
}

interface RawCourse {
  id: string
  titulo: string
  subtitulo?: string
  descripcion?: string
  instructor?: string
  categoria?: string
  nivel?: string
  estado?: RawCourseEstado
  colorPortada?: string
  iconoPortada?: string
  createdAt?: string
  popular?: boolean
  nuevo?: boolean
  destacado?: boolean
  secciones?: RawCourseSection[]
}

interface RawSimulator {
  id: string
  titulo: string
  descripcion?: string
  subtitulo?: string
  categoria?: string
  cursoTitulo?: string
  tags?: string[]
  estado?: string
  createdAt?: string
  icono?: string
  preguntas?: { id: string }[]
  config?: {
    preguntasMax?: number
    tiempoPregunta?: number
  }
}

export type LandingBuilderCollection = "simulators" | "courses" | "evaluations"

export interface LandingBuilderItem {
  id: string
  title: string
  subtitle?: string
  description: string
  category?: string
  badge?: string
  href: string
  emoji?: string
  accentColor?: string
  metrics: Array<{
    key: string
    label: string
    value: string
  }>
  createdAt?: string
}

export interface LandingBuilderDataSets {
  simulators: LandingBuilderItem[]
  courses: LandingBuilderItem[]
  evaluations: LandingBuilderItem[]
}

const COURSES_KEY = "he_cursos"
const COURSES_EVENT = "he-cursos-updated"
const SIMULATORS_EVENT = "simuladores-updated"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function formatMinutes(totalMinutes: number) {
  if (!totalMinutes || totalMinutes <= 0) return "Flexible"
  if (totalMinutes < 60) return `${totalMinutes} min`
  const hours = Math.round((totalMinutes / 60) * 10) / 10
  return `${hours} h`
}

function emojiFromCategory(value?: string, fallback = "✨") {
  const normalized = (value || "").toLowerCase()
  if (normalized.includes("mat")) return "🧮"
  if (normalized.includes("ped")) return "🧠"
  if (normalized.includes("cien")) return "🧪"
  if (normalized.includes("leng") || normalized.includes("idio")) return "🗣️"
  if (normalized.includes("eval")) return "📋"
  if (normalized.includes("sim")) return "🎯"
  if (normalized.includes("curso")) return "🎓"
  return fallback
}

function getCourses(): RawCourse[] {
  if (typeof window === "undefined") return []
  const courses = parseSafe<RawCourse[]>(localStorage.getItem(COURSES_KEY), [])
  return courses.filter((course) => course?.estado === "publicado")
}

function getPublishedSimulators(): RawSimulator[] {
  const simulators = (getSimuladores() as RawSimulator[]) || []
  return simulators.filter((item) => item?.estado === "publicado" && item?.categoria !== "evaluacion")
}

function getPublishedEvaluations(): RawSimulator[] {
  const simulators = (getSimuladores() as RawSimulator[]) || []
  return simulators.filter((item) => item?.estado === "publicado" && item?.categoria === "evaluacion")
}

function mapSimulator(item: RawSimulator, evaluation = false): LandingBuilderItem {
  const questionCount = item.config?.preguntasMax || item.preguntas?.length || 0
  const totalMinutes = Math.max(
    0,
    Math.round(((item.config?.tiempoPregunta || 0) * Math.max(questionCount, 1)) / 60)
  )

  return {
    id: item.id,
    title: item.titulo || (evaluation ? "Evaluacion" : "Simulador"),
    subtitle: item.subtitulo || item.cursoTitulo || item.categoria || undefined,
    description: item.descripcion || "Contenido configurado desde el panel admin.",
    category: item.categoria || (evaluation ? "evaluacion" : "simulador"),
    badge: item.tags?.[0] || (evaluation ? "Evaluacion" : "Publicado"),
    href: `/simulador/${item.id}`,
    emoji: item.icono || emojiFromCategory(item.categoria, evaluation ? "📋" : "🎯"),
    accentColor: evaluation ? "#f59e0b" : "#E8392A",
    metrics: [
      { key: "questions", label: "Preguntas", value: questionCount ? `${questionCount}` : "Lista variable" },
      { key: "time", label: "Tiempo", value: formatMinutes(totalMinutes) },
      { key: "mode", label: "Tipo", value: evaluation ? "Evaluacion" : "Simulador" },
    ],
    createdAt: item.createdAt,
  }
}

function mapCourse(course: RawCourse): LandingBuilderItem {
  const lessonCount = (course.secciones || []).reduce(
    (total, section) => total + (section.recursos?.length || 0),
    0
  )
  const totalMinutes = (course.secciones || []).reduce(
    (total, section) =>
      total + (section.recursos || []).reduce((sum, resource) => sum + (resource.duracionMinutos || 0), 0),
    0
  )

  return {
    id: course.id,
    title: course.titulo || "Curso",
    subtitle: course.subtitulo || course.instructor || "Curso publicado",
    description: course.descripcion || "Ruta de aprendizaje configurada desde el panel admin.",
    category: course.categoria || "curso",
    badge: course.destacado ? "Destacado" : course.popular ? "Popular" : course.nuevo ? "Nuevo" : "Publicado",
    href: "/dashboard/cursos",
    emoji: course.iconoPortada || emojiFromCategory(course.categoria, "🎓"),
    accentColor: course.colorPortada || "#3b82f6",
    metrics: [
      { key: "lessons", label: "Lecciones", value: `${lessonCount}` },
      { key: "duration", label: "Duracion", value: formatMinutes(totalMinutes) },
      { key: "level", label: "Nivel", value: course.nivel || "General" },
    ],
    createdAt: course.createdAt,
  }
}

function sortItems(items: LandingBuilderItem[], order: string) {
  const sorted = [...items]
  if (order === "alphabetical") {
    sorted.sort((a, b) => a.title.localeCompare(b.title, "es"))
    return sorted
  }
  sorted.sort((a, b) => {
    const left = new Date(a.createdAt || 0).getTime()
    const right = new Date(b.createdAt || 0).getTime()
    return right - left
  })
  return sorted
}

export function getCollectionKeyFromSection(sectionType: CMSSection["type"]): LandingBuilderCollection | null {
  if (sectionType === "simulatorsFeed") return "simulators"
  if (sectionType === "coursesFeed") return "courses"
  if (sectionType === "evaluationsFeed") return "evaluations"
  return null
}

export function resolveLandingBuilderItems(
  section: CMSSection,
  datasets: LandingBuilderDataSets
): LandingBuilderItem[] {
  const collection = getCollectionKeyFromSection(section.type)
  if (!collection) return []

  const source = section.settings?.source
  const mode = source?.mode || "auto"
  const order = source?.order || "latest"
  const limit = Math.max(1, Number(source?.limit || 3))
  const baseItems = sortItems(datasets[collection], order)

  const selected =
    mode === "manual" && source?.manualIds?.length
      ? source.manualIds
          .map((id) => baseItems.find((item) => item.id === id))
          .filter((item): item is LandingBuilderItem => Boolean(item))
      : baseItems

  return selected.slice(0, limit)
}

export function getSectionVisibilityClass(section: CMSSection) {
  const device = section.settings?.visibility?.device || "all"
  if (device === "desktop") return "hidden md:block"
  if (device === "mobile") return "md:hidden"
  return ""
}

export function shouldRenderSectionForAudience(section: CMSSection, isAuthenticated: boolean) {
  const audience = section.settings?.visibility?.audience || "all"
  if (audience === "authenticated") return isAuthenticated
  if (audience === "guest") return !isAuthenticated
  return true
}

export function shouldHideSectionWhenEmpty(section: CMSSection) {
  if (section.type === "simulatorsFeed" || section.type === "coursesFeed" || section.type === "evaluationsFeed") {
    return false
  }
  return section.settings?.visibility?.hideIfEmpty === true
}

export function getDefaultSectionSettings(
  type: CMSSection["type"]
): CMSSectionSettings | undefined {
  if (type === "simulatorsFeed") {
    return {
      source: { mode: "auto", limit: 3, order: "latest", display: "grid", columns: 3, showMeta: true, showButton: true, showBadge: true },
      visibility: { audience: "all", device: "all", hideIfEmpty: false },
    }
  }
  if (type === "coursesFeed") {
    return {
      source: { mode: "auto", limit: 4, order: "latest", display: "grid", columns: 4, showMeta: true, showButton: true, showBadge: true },
      visibility: { audience: "all", device: "all", hideIfEmpty: false },
    }
  }
  if (type === "evaluationsFeed") {
    return {
      source: { mode: "auto", limit: 3, order: "latest", display: "grid", columns: 3, showMeta: true, showButton: true, showBadge: true },
      visibility: { audience: "all", device: "all", hideIfEmpty: false },
    }
  }
  return undefined
}

export function useLandingBuilderData(): LandingBuilderDataSets {
  const [datasets, setDatasets] = useState<LandingBuilderDataSets>({
    simulators: [],
    courses: [],
    evaluations: [],
  })

  useEffect(() => {
    const sync = () => {
      setDatasets({
        simulators: getPublishedSimulators().map((item) => mapSimulator(item, false)),
        courses: getCourses().map(mapCourse),
        evaluations: getPublishedEvaluations().map((item) => mapSimulator(item, true)),
      })
    }

    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    window.addEventListener(COURSES_EVENT, sync)
    window.addEventListener(SIMULATORS_EVENT, sync)

    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
      window.removeEventListener(COURSES_EVENT, sync)
      window.removeEventListener(SIMULATORS_EVENT, sync)
    }
  }, [])

  return useMemo(() => datasets, [datasets])
}
