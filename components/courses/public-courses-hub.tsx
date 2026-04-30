"use client"

import { useEffect, useMemo, useState, type ElementType } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight, BookOpen, Brain, Calculator, CheckCircle2,
  Filter, Globe, GraduationCap, Languages, Monitor, Search,
  Sparkles, Star, Tag, Trophy, Users, Beaker,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import AnimatedShaderSurface from "@/components/ui/animated-shader-surface"
import { SiteIconGlyph } from "@/components/ui/site-icon-glyph"
import {
  mergePublicCoursesHubContent,
  type CoursesHubVariant,
  type PublicCoursesHubContent,
} from "@/lib/courses/public-courses-hub-config"

type CursoEstado = "borrador" | "en_revision" | "publicado" | "archivado"
type AccesoTipo = "libre" | "clave" | "pago"

interface RecursoCurso {
  id: string
  duracionMinutos?: number
}

interface SeccionCurso {
  id: string
  recursos: RecursoCurso[]
}

interface CursoPublico {
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
  precioOriginal?: number
  colorPortada?: string
  colorPortada2?: string
  portadaImagen?: string
  iconoPortada?: string
  idioma?: string
  tags?: string[]
  objetivos?: string[]
  secciones: SeccionCurso[]
  certificado?: boolean
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  publicarEnPaginaPrincipal?: boolean
  createdAt: string
}

type PriceFilter = "todos" | "gratis" | "pago"

interface PublicCoursesHubProps {
  variant?: CoursesHubVariant
  content?: Partial<PublicCoursesHubContent> | null
  onCatalogAction?: () => void
}

const COURSES_KEY = "he_cursos"
const COURSES_EVENT = "he-cursos-updated"

const CATEGORY_META: Record<
  string,
  { label: string; icon: ElementType; accent: string; surface: string }
> = {
  pedagogia: {
    label: "Pedagogia",
    icon: Brain,
    accent: "text-[#ff7b54]",
    surface: "bg-[#ff7b54]/12",
  },
  matematicas: {
    label: "Matematicas",
    icon: Calculator,
    accent: "text-[#60a5fa]",
    surface: "bg-[#60a5fa]/12",
  },
  razonamiento: {
    label: "Razonamiento",
    icon: Sparkles,
    accent: "text-[#f59e0b]",
    surface: "bg-[#f59e0b]/12",
  },
  ciencias: {
    label: "Ciencias",
    icon: Beaker,
    accent: "text-[#22c55e]",
    surface: "bg-[#22c55e]/12",
  },
  idiomas: {
    label: "Idiomas",
    icon: Languages,
    accent: "text-[#a78bfa]",
    surface: "bg-[#a78bfa]/12",
  },
  digital: {
    label: "Digital",
    icon: Monitor,
    accent: "text-[#38bdf8]",
    surface: "bg-[#38bdf8]/12",
  },
  humanidades: {
    label: "Humanidades",
    icon: Globe,
    accent: "text-[#fb7185]",
    surface: "bg-[#fb7185]/12",
  },
  "educacion-inicial": {
    label: "Educacion Inicial",
    icon: GraduationCap,
    accent: "text-[#34d399]",
    surface: "bg-[#34d399]/12",
  },
}

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
  const known = CATEGORY_META[slug]
  if (known) return known.label

  return slug
    .split("-")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ")
}

function getCategoryMeta(value?: string) {
  return CATEGORY_META[slugifyCategory(value)] || {
    label: formatCategoryLabel(value),
    icon: BookOpen,
    accent: "text-primary",
    surface: "bg-primary/12",
  }
}

function getPublishedCourses(): CursoPublico[] {
  if (typeof window === "undefined") return []
  const courses = parseSafe<CursoPublico[]>(localStorage.getItem(COURSES_KEY), [])
  return courses.filter((course) => course.estado === "publicado" && course.publicarEnPaginaPrincipal !== false)
}

function totalLessons(course: CursoPublico) {
  return course.secciones.reduce((total, section) => total + section.recursos.length, 0)
}

function totalMinutes(course: CursoPublico) {
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

function getCourseGradient(course: CursoPublico) {
  return `linear-gradient(135deg, ${course.colorPortada || "#0f172a"}, ${course.colorPortada2 || "#1d4ed8"})`
}

function isPaidCourse(course: CursoPublico) {
  return course.acceso === "pago" && (course.precio || 0) > 0
}

function getPriceLabel(course: CursoPublico) {
  if (!isPaidCourse(course)) return "Gratis"
  return `$${(course.precio || 0).toFixed(2)}`
}

function getActionLabel(course: CursoPublico, authenticated: boolean) {
  if (!authenticated) {
    return isPaidCourse(course) ? "Inicia sesion para comprar" : "Registrate para acceder"
  }
  if (course.acceso === "pago") return "Comprar en dashboard"
  if (course.acceso === "clave") return "Ingresar con clave"
  return "Entrar al dashboard"
}

function sortCourses(courses: CursoPublico[]) {
  return [...courses].sort((left, right) => {
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

function CourseCard({
  course,
  compact = false,
  onAccess,
  authenticated,
}: {
  course: CursoPublico
  compact?: boolean
  onAccess: (course: CursoPublico) => void
  authenticated: boolean
}) {
  const category = getCategoryMeta(course.categoria)
  const lessons = totalLessons(course)
  const minutes = totalMinutes(course)

  return (
    <article className="landing-panel-soft group overflow-hidden rounded-[30px] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/28">
      <div className="relative h-48 overflow-hidden" style={{ background: getCourseGradient(course) }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.16),transparent_55%)]" />
        <div className="absolute left-4 right-4 top-4 flex items-start justify-between gap-3">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-[#08111b]/55 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur">
            <category.icon className={cn("h-3.5 w-3.5", category.accent)} />
            {category.label}
          </div>
          <div className="flex flex-wrap justify-end gap-1.5">
            {course.destacado && (
              <span className="rounded-full bg-[#f59e0b] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08111b]">
                Destacado
              </span>
            )}
            {course.popular && (
              <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                Popular
              </span>
            )}
            {course.nuevo && (
              <span className="rounded-full bg-[#22c55e] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#08111b]">
                Nuevo
              </span>
            )}
          </div>
        </div>

        <div className="absolute inset-x-0 bottom-5 flex justify-center px-5">
          <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[28px] border border-white/20 bg-white/95 shadow-2xl shadow-black/25">
            {course.portadaImagen ? (
              <img src={course.portadaImagen} alt={course.titulo} className="h-full w-full object-cover" />
            ) : (
              <SiteIconGlyph
                name={course.iconoPortada}
                fallback="book-open"
                size={44}
                className="text-primary"
              />
            )}
          </div>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <h3 className="line-clamp-2 text-xl font-semibold text-foreground transition-colors group-hover:text-primary">
            {course.titulo}
          </h3>
          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">
            {course.subtitulo || course.descripcion}
          </p>
          <div className="mt-3 flex items-center gap-2 text-xs text-white/55">
            <Users className="h-3.5 w-3.5 text-primary/80" />
            {course.instructor || "Equipo Hack Evans"}
          </div>
        </div>

        <div className={cn("grid gap-2 text-sm text-white/65", compact ? "grid-cols-2" : "grid-cols-3")}>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Clases</div>
            <div className="mt-1 font-semibold text-white">{lessons}</div>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Duracion</div>
            <div className="mt-1 font-semibold text-white">{formatDuration(minutes)}</div>
          </div>
          {!compact && (
            <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-white/40">Nivel</div>
              <div className="mt-1 font-semibold text-white">{course.nivel || "General"}</div>
            </div>
          )}
        </div>

        {course.objetivos?.length ? (
          <div className="rounded-2xl border border-white/8 bg-[#08111b]/70 p-4">
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Lo que aprenderas
            </div>
            <div className="space-y-2 text-sm text-white/70">
              {course.objetivos.slice(0, 2).map((goal, index) => (
                <div key={`${course.id}-goal-${index}`} className="flex items-start gap-2">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                  <span className="line-clamp-2">{goal}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
          <div>
            <div className={cn("text-xl font-semibold", isPaidCourse(course) ? "text-white" : "text-emerald-400")}>
              {getPriceLabel(course)}
            </div>
            {(course.precioOriginal || 0) > (course.precio || 0) && isPaidCourse(course) ? (
              <div className="text-xs text-white/40 line-through">${course.precioOriginal?.toFixed(2)}</div>
            ) : (
              <div className="text-xs text-white/50">
                {course.certificado ? "Incluye certificado" : course.idioma || "Acceso inmediato"}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => onAccess(course)}
            className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90"
          >
            {getActionLabel(course, authenticated)}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </article>
  )
}

export default function PublicCoursesHub({
  variant = "page",
  content,
  onCatalogAction,
}: PublicCoursesHubProps) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [courses, setCourses] = useState<CursoPublico[]>([])
  const [query, setQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("todos")
  const [priceFilter, setPriceFilter] = useState<PriceFilter>("todos")
  const copy = mergePublicCoursesHubContent(variant, content)

  useEffect(() => {
    const sync = () => setCourses(sortCourses(getPublishedCourses()))
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    window.addEventListener(COURSES_EVENT, sync)

    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
      window.removeEventListener(COURSES_EVENT, sync)
    }
  }, [])

  const categories = useMemo(() => {
      const categoryMap = new Map<string, { id: string; label: string; count: number; icon: ElementType }>()

    for (const course of courses) {
      const id = slugifyCategory(course.categoria)
      const meta = getCategoryMeta(course.categoria)
      const existing = categoryMap.get(id)
      categoryMap.set(id, {
        id,
        label: meta.label,
        icon: meta.icon,
        count: (existing?.count || 0) + 1,
      })
    }

    return [{ id: "todos", label: "Todos", count: courses.length, icon: Sparkles }, ...categoryMap.values()]
  }, [courses])

  const filteredCourses = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    return courses.filter((course) => {
      const matchesCategory =
        selectedCategory === "todos" || slugifyCategory(course.categoria) === selectedCategory
      const matchesPrice =
        priceFilter === "todos" ||
        (priceFilter === "gratis" && !isPaidCourse(course)) ||
        (priceFilter === "pago" && isPaidCourse(course))
      const haystack = [
        course.titulo,
        course.subtitulo,
        course.descripcion,
        course.instructor,
        course.categoria,
        ...(course.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
      const matchesQuery = !normalizedQuery || haystack.includes(normalizedQuery)

      return matchesCategory && matchesPrice && matchesQuery
    })
  }, [courses, priceFilter, query, selectedCategory])

  const featuredCourses = useMemo(
    () => filteredCourses.filter((course) => course.destacado || course.popular).slice(0, variant === "page" ? 3 : 4),
    [filteredCourses, variant]
  )

  const groupedCourses = useMemo(() => {
    const groups = categories
      .filter((category) => category.id !== "todos")
      .map((category) => ({
        ...category,
        courses: filteredCourses.filter((course) => slugifyCategory(course.categoria) === category.id).slice(0, 4),
      }))
      .filter((group) => group.courses.length > 0)

    return groups
  }, [categories, filteredCourses])

  const showGroupedLayout =
    variant === "page" &&
    selectedCategory === "todos" &&
    priceFilter === "todos" &&
    query.trim().length === 0
  const paidCoursesCount = courses.filter((course) => isPaidCourse(course)).length
  const freeCoursesCount = courses.length - paidCoursesCount
  const featuredCoursesCount = courses.filter((course) => course.destacado || course.popular).length
  const visibleCategoryCount = Math.max(categories.length - 1, 0)

  const onAccess = (course: CursoPublico) => {
    const next = `/dashboard/cursos?course=${encodeURIComponent(course.id)}`
    if (!isAuthenticated) {
      router.push(`/login?returnTo=${encodeURIComponent(next)}`)
      return
    }
    router.push(next)
  }

  if (variant === "home" && courses.length === 0) return null

  if (variant === "home") {
    return (
      <section className="relative overflow-hidden py-24">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute left-[6%] top-10 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
          <div className="absolute bottom-0 right-[4%] h-[26rem] w-[26rem] rounded-full bg-[#38bdf8]/7 blur-3xl" />
        </div>

        <div className="landing-container relative">
          <div className="mb-10 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="landing-badge">
                <GraduationCap className="h-4 w-4" />
                {copy.badge}
              </div>
              <h2 className="landing-title mt-5 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl">
                {copy.title}
              </h2>
              <p className="mt-4 text-lg leading-8 text-[var(--he-landing-muted)]">
                {copy.description}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="landing-panel-soft rounded-[28px] px-4 py-4 text-center">
                <div className="text-3xl font-semibold tracking-[-0.04em] text-white">{courses.length}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Cursos</div>
              </div>
              <div className="landing-panel-soft rounded-[28px] px-4 py-4 text-center">
                <div className="text-3xl font-semibold tracking-[-0.04em] text-emerald-400">
                  {courses.filter((course) => !isPaidCourse(course)).length}
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">Gratis</div>
              </div>
              <div className="landing-panel-soft rounded-[28px] px-4 py-4 text-center">
                <div className="text-3xl font-semibold tracking-[-0.04em] text-white">{categories.length - 1}</div>
                <div className="text-xs uppercase tracking-[0.18em] text-white/45">{copy.categoriesStatLabel || "Categorias"}</div>
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const active = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-white/10 bg-white/[0.03] text-white/70 hover:border-primary/35 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/15" : "bg-white/5")}>
                    {category.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {filteredCourses.slice(0, 8).map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                compact
                onAccess={onAccess}
                authenticated={isAuthenticated}
              />
            ))}
          </div>

          <div className="landing-panel mt-10 flex flex-col items-center justify-between gap-4 rounded-[32px] px-6 py-5 text-center md:flex-row md:text-left">
            <div>
              <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/85">
                {copy.footerEyebrow}
              </div>
              <div className="mt-1 text-lg text-white">
                {copy.footerTitle}
              </div>
            </div>
            {onCatalogAction ? (
              <button
                type="button"
                onClick={onCatalogAction}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                {copy.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : (
              <Link
                href={copy.ctaHref || "/cursos"}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
              >
                {copy.ctaLabel}
                <ArrowRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="relative overflow-hidden px-6 py-16 lg:px-12 lg:py-20">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-0 top-0 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute right-0 top-20 h-[30rem] w-[30rem] rounded-full bg-[#2563eb]/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl space-y-10">
        <div className="landing-panel relative overflow-hidden rounded-[36px] border border-white/10 bg-[#09111d]/82 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.3)] lg:p-8">
          <AnimatedShaderSurface accentColor="#E8392A" secondaryColor="#f59e0b" className="opacity-[0.92]" />
          <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_top_left,rgba(232,57,42,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(59,130,246,0.12),transparent_36%)]" />
          <div className="absolute inset-x-8 top-8 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />
          <div className="relative grid gap-8 lg:grid-cols-[1.08fr_0.92fr] lg:items-start">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                <SiteIconGlyph name="graduation-cap" fallback="graduation-cap" size={16} className="text-current" />
                {copy.badge}
              </div>
              <h1 className="mt-5 font-display text-5xl leading-[0.95] text-foreground md:text-6xl">
                {copy.title}
              </h1>
              <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
                {copy.description}
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72">
                  <SiteIconGlyph name="books" fallback="books" size={15} className="text-primary" />
                  {visibleCategoryCount} {copy.heroChipOne || "categorias activas"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72">
                  <SiteIconGlyph name="monitor" fallback="monitor" size={15} className="text-sky-300" />
                  {copy.heroChipTwo || "Catalogo conectado al dashboard"}
                </div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/72">
                  <SiteIconGlyph name="shield" fallback="shield" size={15} className="text-emerald-300" />
                  {copy.heroChipThree || "Filtros y acceso mas intuitivos"}
                </div>
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[30px] border border-white/10 bg-white/[0.04] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary/85">{copy.highlightEyebrow || "Experiencia mejorada"}</div>
                    <div className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-white">
                      {copy.highlightTitle || "Explora, filtra y elige sin perder contexto"}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-white/58">
                      {copy.highlightDescription || "Organizamos el catalogo para que el contenido destacado, los cursos gratis y los cursos premium se entiendan desde el primer vistazo."}
                    </p>
                  </div>
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] border border-white/10 bg-primary/12">
                    <SiteIconGlyph name="rocket" fallback="rocket" size={20} className="text-primary" />
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-[26px] border border-white/10 bg-card/80 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    <BookOpen className="h-3.5 w-3.5 text-primary/80" />
                    {copy.totalStatLabel}
                  </div>
                  <div className="mt-3 font-display text-4xl text-foreground">{courses.length}</div>
                  <div className="mt-2 text-sm text-white/55">{copy.totalStatDescription}</div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-card/80 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    <Star className="h-3.5 w-3.5 text-[#f59e0b]" />
                    {copy.paidStatLabel}
                  </div>
                  <div className="mt-3 font-display text-4xl text-foreground">{paidCoursesCount}</div>
                  <div className="mt-2 text-sm text-white/55">{copy.paidStatDescription}</div>
                </div>
                <div className="rounded-[26px] border border-white/10 bg-card/80 p-5">
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                    <Trophy className="h-3.5 w-3.5 text-emerald-400" />
                    {copy.freeStatLabel}
                  </div>
                  <div className="mt-3 font-display text-4xl text-emerald-400">{freeCoursesCount}</div>
                  <div className="mt-2 text-sm text-white/55">{copy.freeStatDescription}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-white/10 bg-card/72 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-primary/12">
              <SiteIconGlyph name="book-open" fallback="book-open" size={18} className="text-primary" />
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{copy.benefitOneTitle || "Contenido mejor estructurado"}</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              {copy.benefitOneDescription || "El catalogo separa con claridad cursos destacados, cursos gratuitos y categorias activas."}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-card/72 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-sky-500/12">
              <SiteIconGlyph name="bar-chart" fallback="bar-chart" size={18} className="text-sky-300" />
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{copy.benefitTwoTitle || `${featuredCoursesCount} cursos con alta visibilidad`}</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              {copy.benefitTwoDescription || "Los cursos con mejor potencial aparecen primero para ayudar a convertir mejor desde portada."}
            </p>
          </div>
          <div className="rounded-[28px] border border-white/10 bg-card/72 p-5">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-emerald-500/12">
              <SiteIconGlyph name="check-circle" fallback="check-circle" size={18} className="text-emerald-300" />
            </div>
            <div className="mt-4 text-lg font-semibold text-white">{copy.benefitThreeTitle || "Acceso mas directo"}</div>
            <p className="mt-2 text-sm leading-7 text-white/58">
              {copy.benefitThreeDescription || "El usuario descubre el curso aqui y completa su acceso dentro del dashboard, sin pasos confusos."}
            </p>
          </div>
        </div>

        <div className="rounded-[34px] border border-white/10 bg-card/75 p-6 shadow-[0_24px_70px_rgba(0,0,0,0.26)]">
          <div className="grid gap-4 lg:grid-cols-[1.2fr_auto_auto]">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={copy.searchPlaceholder || "Buscar por categoria, instructor, nivel o tema..."}
                className="h-[52px] w-full rounded-[22px] border border-white/10 bg-[#08111b]/75 pl-11 pr-4 text-sm text-white placeholder:text-white/30 focus:border-primary/35 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 rounded-[22px] border border-white/10 bg-[#08111b]/75 px-4 py-3 text-sm text-white/70">
              <Filter className="h-4 w-4 text-primary/80" />
              <span>{filteredCourses.length} {copy.visibleCountLabel || "visibles"}</span>
            </div>

            <div className="flex gap-2">
              {([
                { id: "todos", label: "Todos" },
                { id: "gratis", label: "Gratis" },
                { id: "pago", label: "De pago" },
              ] as Array<{ id: PriceFilter; label: string }>).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setPriceFilter(item.id)}
                  className={cn(
                    "rounded-2xl border px-4 py-3 text-sm font-semibold transition-all",
                    priceFilter === item.id
                      ? "border-primary bg-primary text-white"
                      : "border-white/10 bg-[#08111b]/75 text-white/65 hover:border-primary/30 hover:text-white"
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {categories.map((category) => {
              const Icon = category.icon
              const active = selectedCategory === category.id
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={cn(
                    "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                    active
                      ? "border-primary bg-primary text-white"
                      : "border-white/10 bg-[#08111b]/75 text-white/70 hover:border-primary/35 hover:text-white"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {category.label}
                  <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-white/15" : "bg-white/5")}>
                    {category.count}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-card/60 px-8 py-20 text-center">
            <GraduationCap className="mx-auto h-12 w-12 text-white/30" />
            <h2 className="mt-5 text-2xl font-semibold text-foreground">{copy.emptyTitle}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {copy.emptyDescription}
            </p>
          </div>
        ) : showGroupedLayout ? (
          <div className="space-y-10">
            {featuredCourses.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold uppercase tracking-[0.18em] text-primary/85">
                      {copy.featuredEyebrow || "Destacados"}
                    </div>
                    <h2 className="mt-1 text-2xl font-semibold text-foreground">
                      {copy.featuredTitle || "Cursos que convierten mejor en portada"}
                    </h2>
                    {copy.featuredDescription ? (
                      <p className="mt-2 max-w-2xl text-sm leading-7 text-white/55">
                        {copy.featuredDescription}
                      </p>
                    ) : null}
                  </div>
                  <Tag className="h-5 w-5 text-primary/70" />
                </div>
                <div className="grid gap-6 lg:grid-cols-3">
                  {featuredCourses.map((course) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      onAccess={onAccess}
                      authenticated={isAuthenticated}
                    />
                  ))}
                </div>
              </div>
            ) : null}

            {groupedCourses.map((group) => {
              const Icon = group.icon
              return (
                <div key={group.id} className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", getCategoryMeta(group.id).surface)}>
                        <Icon className={cn("h-5 w-5", getCategoryMeta(group.id).accent)} />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground">{group.label}</h2>
                        <p className="text-sm text-white/55">{group.courses.length} {copy.categoryCountSuffix || "cursos sugeridos en esta categoria"}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedCategory(group.id)}
                      className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-card/75 px-4 py-2.5 text-sm font-semibold text-white/75 transition-all hover:border-primary/30 hover:text-white"
                    >
                      {copy.categoryCtaLabel || "Ver categoria"}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    {group.courses.map((course) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        compact
                        onAccess={onAccess}
                        authenticated={isAuthenticated}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="rounded-[32px] border border-dashed border-white/10 bg-card/60 px-8 py-20 text-center">
            <Search className="mx-auto h-12 w-12 text-white/30" />
            <h2 className="mt-5 text-2xl font-semibold text-foreground">{copy.noResultsTitle || "No encontramos cursos para ese filtro"}</h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-muted-foreground">
              {copy.noResultsDescription || "Prueba con otra categoria, cambia el filtro de precio o busca por una palabra distinta."}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                onAccess={onAccess}
                authenticated={isAuthenticated}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
