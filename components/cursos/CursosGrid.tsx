"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { BookOpen, GraduationCap } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import BuscadorCursos from "./BuscadorCursos"
import CategoriasTabs from "./CategoriasTabs"
import CursoCard, { type CursoCardData } from "./CursoCard"
import FiltrosSidebar, { type CursosFilters } from "./FiltrosSidebar"
import type { CursosHeroStats } from "./CursosHero"

type CursoEstado = "borrador" | "en_revision" | "publicado" | "archivado"
type AccesoTipo = "libre" | "clave" | "pago"

interface CourseResource {
  id: string
  duracionMinutos?: number
}

interface CourseSection {
  id: string
  recursos: CourseResource[]
}

interface RawCourse {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  estado: CursoEstado
  acceso: AccesoTipo
  precio?: number
  colorPortada?: string
  colorPortada2?: string
  portadaImagen?: string
  iconoPortada?: string
  tags?: string[]
  secciones: CourseSection[]
  certificado?: boolean
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  publicarEnPaginaPrincipal?: boolean
  createdAt?: string
}

interface MatriculaData {
  id: string
  userId: string
  cursoId: string
  progreso: number
  completado: boolean
}

interface CursosGridProps {
  onStatsChange?: (stats: CursosHeroStats) => void
}

const COURSES_KEY = "he_cursos"
const COURSES_EVENT = "he-cursos-updated"
const ENROLLMENTS_KEY = "he_matriculas"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function slugifyCategory(value?: string) {
  return (value || "general")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "general"
}

function formatCategoryLabel(value?: string) {
  const slug = slugifyCategory(value)

  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function totalLessons(course: RawCourse) {
  return course.secciones.reduce((total, section) => total + section.recursos.length, 0)
}

function totalMinutes(course: RawCourse) {
  return course.secciones.reduce(
    (total, section) =>
      total + section.recursos.reduce((sum, resource) => sum + (resource.duracionMinutos || 0), 0),
    0
  )
}

function formatDuration(minutes: number) {
  if (!minutes) return "Flexible"
  if (minutes < 60) return `${minutes} min`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest ? `${hours}h ${rest}m` : `${hours}h`
}

function isPaidCourse(course: RawCourse) {
  return course.acceso === "pago" && (course.precio || 0) > 0
}

function getPriceLabel(course: RawCourse) {
  if (!isPaidCourse(course)) return "Gratis"
  return `$${(course.precio || 0).toFixed(2)}`
}

function getGradient(course: RawCourse) {
  return `linear-gradient(135deg, ${course.colorPortada || "#0f172a"}, ${course.colorPortada2 || "#1d4ed8"})`
}

function getCoursesFromStorage() {
  if (typeof window === "undefined") return []
  const courses = parseSafe<RawCourse[]>(window.localStorage.getItem(COURSES_KEY), [])

  return courses
    .filter((course) => course.estado === "publicado" && course.publicarEnPaginaPrincipal !== false)
    .sort((left, right) => {
      const leftScore =
        (left.destacado ? 30 : 0) +
        (left.popular ? 20 : 0) +
        (left.nuevo ? 10 : 0) +
        new Date(left.createdAt || 0).getTime() / 1_000_000_000_000
      const rightScore =
        (right.destacado ? 30 : 0) +
        (right.popular ? 20 : 0) +
        (right.nuevo ? 10 : 0) +
        new Date(right.createdAt || 0).getTime() / 1_000_000_000_000
      return rightScore - leftScore
    })
}

function getEnrollmentsFromStorage() {
  if (typeof window === "undefined") return []
  return parseSafe<MatriculaData[]>(window.localStorage.getItem(ENROLLMENTS_KEY), [])
}

export default function CursosGrid({ onStatsChange }: CursosGridProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()

  const [courses, setCourses] = useState<RawCourse[]>([])
  const [enrollments, setEnrollments] = useState<MatriculaData[]>([])
  const [query, setQuery] = useState("")
  const [activeCategory, setActiveCategory] = useState("todos")
  const [filters, setFilters] = useState<CursosFilters>({
    access: "todos",
    level: "todos",
    featuredOnly: false,
    certificateOnly: false,
    withProgressOnly: false,
  })

  useEffect(() => {
    const syncData = () => {
      setCourses(getCoursesFromStorage())
      setEnrollments(getEnrollmentsFromStorage())
    }

    syncData()
    window.addEventListener(COURSES_EVENT, syncData as EventListener)
    window.addEventListener("storage", syncData)
    window.addEventListener("focus", syncData)

    return () => {
      window.removeEventListener(COURSES_EVENT, syncData as EventListener)
      window.removeEventListener("storage", syncData)
      window.removeEventListener("focus", syncData)
    }
  }, [])

  const enrollmentMap = useMemo(() => {
    const map = new Map<string, MatriculaData>()
    if (!user?.id) return map

    enrollments
      .filter((enrollment) => enrollment.userId === user.id)
      .forEach((enrollment) => map.set(enrollment.cursoId, enrollment))

    return map
  }, [enrollments, user?.id])

  const categoryOptions = useMemo(() => {
    const counts = new Map<string, { label: string; count: number }>()

    courses.forEach((course) => {
      const slug = slugifyCategory(course.categoria)
      const current = counts.get(slug)
      counts.set(slug, {
        label: formatCategoryLabel(course.categoria),
        count: (current?.count || 0) + 1,
      })
    })

    return [
      { id: "todos", label: "Todos", count: courses.length },
      ...Array.from(counts.entries())
        .map(([id, value]) => ({ id, label: value.label, count: value.count }))
        .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)),
    ]
  }, [courses])

  const levels = useMemo(
    () =>
      Array.from(
        new Set(courses.map((course) => course.nivel?.trim()).filter((value): value is string => Boolean(value)))
      ).sort((left, right) => left.localeCompare(right)),
    [courses]
  )

  const cardData = useMemo<CursoCardData[]>(() => {
    return courses.map((course) => {
      const enrollment = enrollmentMap.get(course.id)

      return {
        id: course.id,
        title: course.titulo,
        subtitle: course.subtitulo,
        description: course.descripcion,
        instructor: course.instructor,
        category: formatCategoryLabel(course.categoria),
        level: course.nivel || "General",
        access: course.acceso,
        priceLabel: getPriceLabel(course),
        lessons: totalLessons(course),
        durationLabel: formatDuration(totalMinutes(course)),
        progress: enrollment?.progreso ?? 0,
        enrolled: Boolean(enrollment),
        featured: Boolean(course.destacado),
        popular: Boolean(course.popular),
        isNew: Boolean(course.nuevo),
        certificate: Boolean(course.certificado),
        image: course.portadaImagen,
        icon: course.iconoPortada,
        gradient: getGradient(course),
        tags: course.tags || [],
      }
    })
  }, [courses, enrollmentMap])

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return cardData.filter((course) => {
      const categoryMatch =
        activeCategory === "todos" || slugifyCategory(course.category) === activeCategory

      const accessMatch = filters.access === "todos" || course.access === filters.access
      const levelMatch =
        filters.level === "todos" || course.level.toLowerCase() === filters.level.toLowerCase()
      const featuredMatch = !filters.featuredOnly || course.featured || course.popular
      const certificateMatch = !filters.certificateOnly || course.certificate
      const progressMatch = !filters.withProgressOnly || course.progress > 0

      const queryMatch =
        !normalizedQuery ||
        [
          course.title,
          course.subtitle,
          course.description,
          course.instructor,
          course.category,
          course.level,
          ...course.tags,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedQuery))

      return (
        categoryMatch &&
        accessMatch &&
        levelMatch &&
        featuredMatch &&
        certificateMatch &&
        progressMatch &&
        queryMatch
      )
    })
  }, [activeCategory, cardData, filters, query])

  useEffect(() => {
    const categoriesCount = categoryOptions.filter((item) => item.id !== "todos").length
    const freeCount = cardData.filter((course) => course.access === "libre").length
    const progressCount = cardData.filter((course) => course.progress > 0).length

    onStatsChange?.({
      totalCursos: cardData.length,
      totalCategorias: categoriesCount,
      gratuitos: freeCount,
      conProgreso: progressCount,
    })
  }, [cardData, categoryOptions, onStatsChange])

  const handleCourseAction = (courseId: string) => {
    const target = `/dashboard/cursos?course=${encodeURIComponent(courseId)}`

    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(target)}`)
      return
    }

    router.push(target)
  }

  const getActionLabel = (course: CursoCardData) => {
    if (course.progress > 0) return "Continuar"
    if (course.enrolled) return "Ir al curso"
    if (!isAuthenticated) return "Iniciar sesion"
    if (course.access === "pago") return "Ver acceso"
    if (course.access === "clave") return "Ingresar con clave"
    return "Matricularme"
  }

  const hasCourses = courses.length > 0

  return (
    <section className="px-4 pb-16 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <FiltrosSidebar filters={filters} levels={levels} onFiltersChange={setFilters} />
          </div>

          <div className="space-y-5">
            <BuscadorCursos value={query} onChange={setQuery} totalResultados={filteredCourses.length} />

            <CategoriasTabs
              categorias={categoryOptions}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />

            {!hasCourses ? (
              <div className="rounded-[30px] border border-white/10 bg-[#09111f]/84 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <BookOpen className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">Aun no hay cursos publicados</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55">
                  Cuando el equipo publique nuevos cursos desde el administrador, apareceran aqui
                  conectados con las matriculas y el progreso real del usuario.
                </p>
              </div>
            ) : filteredCourses.length === 0 ? (
              <div className="rounded-[30px] border border-white/10 bg-[#09111f]/84 p-10 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-sky-400/10 text-sky-300">
                  <GraduationCap className="h-7 w-7" />
                </div>
                <h2 className="mt-5 text-2xl font-semibold text-white">No encontramos cursos con ese filtro</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/55">
                  Prueba otra categoria, quita algun filtro o busca por instructor, tema o nivel.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {filteredCourses.map((course) => (
                  <CursoCard
                    key={course.id}
                    curso={course}
                    actionLabel={getActionLabel(course)}
                    onAction={handleCourseAction}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}
