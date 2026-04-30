"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BarChart2,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Compass,
  Flame,
  Headphones,
  Pencil,
  Play,
  Sparkles,
  Star,
  Target,
  Trophy,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { CATEGORIAS_EVENT, getCategorias, type Categoria } from "@/lib/categorias"

type CourseRecord = {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  estado: "borrador" | "en_revision" | "publicado" | "archivado"
  acceso: "libre" | "clave" | "pago"
  precio?: number
  precioOriginal?: number
  portadaImagen?: string
  publicarEnPaginaPrincipal?: boolean
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  secciones?: Array<{ recursos: Array<{ duracionMinutos?: number }> }>
}

type Enrollment = {
  id: string
  userId: string
  cursoId: string
  fechaMatricula: string
  progreso?: number
  completado?: boolean
}

type CardCourse = {
  id: string
  titulo: string
  instructor: string
  imagen: string
  categoria: string
  nivel: string
  precio: number
  precioOriginal: number
  rating: number
  totalRatings: number
  totalHoras: string
  totalClases: number
  gratis: boolean
  nuevo?: boolean
  popular?: boolean
  destacado?: boolean
  progreso: number
  enrolled: boolean
}

type SimulatorRecord = {
  id: string
  titulo: string
  descripcion: string
  categoria?: string
  estado: "borrador" | "en_revision" | "publicado" | "archivado"
  publicarEnPaginaPrincipal?: boolean
  preguntas?: unknown[]
  config?: { modoIA?: boolean; tiempoPregunta?: number; preguntasMax?: number }
}

const COURSES_KEY = "he_cursos"
const ENROLLMENTS_KEY = "he_matriculas"
const SIMULATORS_KEY = "simuladores"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function formatHoras(minutes: number) {
  if (!minutes) return "1.0"
  return (minutes / 60).toFixed(1)
}

function totalMinutes(secciones?: CourseRecord["secciones"]) {
  return (secciones || []).reduce(
    (total, section) => total + section.recursos.reduce((sum, r) => sum + (r.duracionMinutos || 0), 0),
    0
  )
}

function totalLessons(secciones?: CourseRecord["secciones"]) {
  return (secciones || []).reduce((total, section) => total + section.recursos.length, 0) || 12
}

function buildCourseCards(userId: string | undefined): { mine: CardCourse[]; explore: CardCourse[] } {
  if (typeof window === "undefined") return { mine: [], explore: [] }
  const raw = parseSafe<CourseRecord[]>(window.localStorage.getItem(COURSES_KEY), [])
  const enrollments = parseSafe<Enrollment[]>(window.localStorage.getItem(ENROLLMENTS_KEY), [])
  const myEnrollmentMap = new Map<string, Enrollment>()
  enrollments.forEach((entry) => {
    if (entry.userId === userId) myEnrollmentMap.set(entry.cursoId, entry)
  })

  const mapped: CardCourse[] = raw
    .filter((course) => course.estado === "publicado")
    .map((course, index) => {
      const minutes = totalMinutes(course.secciones)
      const gratis = course.acceso !== "pago" || (course.precio || 0) <= 0
      const baseRating = course.destacado ? 4.9 : course.popular ? 4.8 : course.nuevo ? 4.7 : 4.6
      const lessons = totalLessons(course.secciones)
      const enrollment = myEnrollmentMap.get(course.id)
      return {
        id: course.id,
        titulo: course.titulo,
        instructor: course.instructor || "Hack Evans Academy",
        imagen: course.portadaImagen || "/placeholder.jpg",
        categoria: course.categoria || "General",
        nivel: course.nivel || "Todos los niveles",
        precio: gratis ? 0 : Number(course.precio || 0),
        precioOriginal: gratis
          ? 0
          : Number(course.precioOriginal || Math.max(Number(course.precio || 0) * 1.7, Number(course.precio || 0))),
        rating: Number(baseRating.toFixed(1)),
        totalRatings: Math.max(24, 80 + index * 12 + lessons * 6),
        totalHoras: formatHoras(minutes),
        totalClases: lessons,
        gratis,
        nuevo: Boolean(course.nuevo),
        popular: Boolean(course.popular),
        destacado: Boolean(course.destacado),
        progreso: enrollment?.progreso ?? 0,
        enrolled: Boolean(enrollment),
      }
    })

  const mine = mapped.filter((card) => card.enrolled)
  const explore = mapped
    .filter((card) => !card.enrolled)
    .sort((a, b) => {
      const score = (c: CardCourse) =>
        (c.destacado ? 30 : 0) + (c.popular ? 22 : 0) + (c.nuevo ? 14 : 0) + (c.gratis ? 6 : 0)
      return score(b) - score(a)
    })
    .slice(0, 12)

  return { mine, explore }
}

function buildSimulators() {
  if (typeof window === "undefined") return [] as SimulatorRecord[]
  return parseSafe<SimulatorRecord[]>(window.localStorage.getItem(SIMULATORS_KEY), [])
    .filter((sim) => sim.estado === "publicado" && sim.publicarEnPaginaPrincipal !== false)
    .slice(0, 6)
}

function CourseCard({ course }: { course: CardCourse }) {
  const inProgress = course.enrolled && course.progreso > 0 && course.progreso < 100
  return (
    <Link
      href={`/dashboard/cursos?course=${encodeURIComponent(course.id)}`}
      className="group block w-72 shrink-0"
    >
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A]">
        <Image
          src={course.imagen}
          alt={course.titulo}
          fill
          className="object-cover opacity-80 mix-blend-screen transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
        {course.nuevo ? (
          <span className="absolute left-2 top-2 rounded-full bg-white px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#E8392A]">
            Nuevo
          </span>
        ) : course.destacado || course.popular ? (
          <span className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
            Mas vendido
          </span>
        ) : null}
        {course.gratis ? (
          <span className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Gratis
          </span>
        ) : null}
        {inProgress ? (
          <div className="absolute inset-x-0 bottom-0 h-1.5 bg-black/30">
            <div
              className="h-full bg-gradient-to-r from-[#ff8c7d] to-[#E8392A]"
              style={{ width: `${course.progreso}%` }}
            />
          </div>
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white backdrop-blur">
            <Play className="ml-0.5 h-5 w-5" fill="currentColor" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-1.5">
        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {course.titulo}
        </h3>
        <p className="text-xs text-muted-foreground">{course.instructor}</p>
        <div className="flex items-center gap-1">
          <span className="text-xs font-bold text-[#fbbf24]">{course.rating.toFixed(1)}</span>
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={9}
                className={
                  star <= Math.round(course.rating)
                    ? "fill-[#fbbf24] text-[#fbbf24]"
                    : "fill-muted text-muted"
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({course.totalRatings.toLocaleString()})</span>
        </div>
        {course.gratis ? (
          <div className="text-base font-black text-emerald-500">Gratis</div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="text-base font-black text-foreground">${course.precio.toFixed(2)}</span>
            {course.precioOriginal > course.precio ? (
              <span className="text-xs text-muted-foreground line-through">${course.precioOriginal.toFixed(2)}</span>
            ) : null}
          </div>
        )}
        {inProgress ? (
          <div className="text-[10px] font-bold text-primary">{course.progreso}% completado</div>
        ) : null}
      </div>
    </Link>
  )
}

function CarouselRow({
  title,
  subtitle,
  href,
  children,
  hrefLabel,
}: {
  title: string
  subtitle?: string
  href?: string
  hrefLabel?: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl text-foreground md:text-3xl">{title}</h2>
          {subtitle ? <p className="mt-0.5 text-sm text-muted-foreground">{subtitle}</p> : null}
        </div>
        {href ? (
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80"
          >
            {hrefLabel || "Ver todo"}
            <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>
      <div className="-mx-4 px-4 lg:-mx-6 lg:px-6">
        <div className="scrollbar-hide flex gap-4 overflow-x-auto pb-2">{children}</div>
      </div>
    </section>
  )
}

export default function DashboardHome() {
  const { user } = useAuth()
  const [courses, setCourses] = useState<{ mine: CardCourse[]; explore: CardCourse[] }>({
    mine: [],
    explore: [],
  })
  const [simulators, setSimulators] = useState<SimulatorRecord[]>([])
  const [profession, setProfession] = useState("Docente en formacion")
  const [adminCategorias, setAdminCategorias] = useState<Categoria[]>([])

  useEffect(() => {
    const sync = () => setAdminCategorias(getCategorias().filter((cat) => cat.activa !== false))
    sync()
    window.addEventListener(CATEGORIAS_EVENT, sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(CATEGORIAS_EVENT, sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [])

  useEffect(() => {
    const sync = () => {
      setCourses(buildCourseCards(user?.id))
      setSimulators(buildSimulators())
    }
    sync()
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(`he_profession_${user?.id}`)
      if (stored) setProfession(stored)
    }
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    window.addEventListener("he-cursos-updated", sync as EventListener)
    window.addEventListener("simuladores-updated", sync as EventListener)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
      window.removeEventListener("he-cursos-updated", sync as EventListener)
      window.removeEventListener("simuladores-updated", sync as EventListener)
    }
  }, [user?.id])

  const enrolledCount = courses.mine.length
  const inProgress = useMemo(
    () => courses.mine.filter((card) => card.progreso > 0 && card.progreso < 100).length,
    [courses.mine]
  )
  const featured = courses.explore[0]

  return (
    <div className="space-y-12">
      {/* Hello block — Udemy-style */}
      <section className="flex flex-wrap items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-xl font-black text-white shadow-[0_12px_28px_rgba(232,57,42,0.32)]">
          {user?.name?.charAt(0)?.toUpperCase() || "U"}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl text-foreground md:text-3xl">
            Hola de nuevo, {user?.name?.split(" ")[0] || "Estudiante"}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-sm">
            <span className="text-muted-foreground">{profession}</span>
            <Link
              href="/dashboard/perfil?tab=configuracion"
              className="inline-flex items-center gap-1 font-bold text-primary hover:text-primary/80"
            >
              <Pencil className="h-3 w-3" />
              Editar profesion e intereses
            </Link>
          </div>
        </div>
      </section>

      {/* Continue learning */}
      {courses.mine.length > 0 ? (
        <CarouselRow
          title="Continua aprendiendo"
          subtitle="Retomalo donde lo dejaste."
          href="/dashboard/cursos"
          hrefLabel="Mi aprendizaje"
        >
          {courses.mine.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </CarouselRow>
      ) : null}

      {/* Que aprender ahora */}
      <section className="space-y-6">
        <div>
          <h2 className="font-display text-3xl text-foreground md:text-4xl">Que aprender ahora</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recomendaciones segun tu actividad y los cursos mas valorados.
          </p>
        </div>

        {courses.explore.length > 0 ? (
          <CarouselRow title="Recomendaciones para ti">
            {courses.explore.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </CarouselRow>
        ) : (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Compass className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Pronto tendras recomendaciones personalizadas. Mientras tanto, explora el catalogo.
            </p>
            <Link
              href="/dashboard/cursos"
              className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
            >
              Explorar cursos
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </section>

      {/* Featured banner */}
      {featured ? (
        <section className="overflow-hidden rounded-3xl border border-border bg-card">
          <div className="grid gap-0 lg:grid-cols-[1fr_1.1fr]">
            <div className="relative aspect-video w-full overflow-hidden bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A] lg:aspect-auto">
              <Image
                src={featured.imagen}
                alt={featured.titulo}
                fill
                className="object-cover opacity-85 mix-blend-screen"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
              <div className="absolute left-4 top-4 inline-flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#E8392A]">
                <Flame className="h-3 w-3" />
                Recomendado
              </div>
            </div>
            <div className="flex flex-col justify-center gap-4 p-6 lg:p-10">
              <div className="inline-flex w-fit items-center gap-1 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                <Sparkles className="h-3 w-3" />
                {featured.categoria}
              </div>
              <h2 className="font-display text-3xl text-foreground md:text-4xl">{featured.titulo}</h2>
              <p className="text-sm leading-relaxed text-muted-foreground">Por {featured.instructor}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                  {featured.rating.toFixed(1)}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  {featured.totalHoras} horas
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {featured.totalClases} clases
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {featured.gratis ? (
                  <span className="text-2xl font-black text-emerald-500">Gratis</span>
                ) : (
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-foreground">${featured.precio.toFixed(2)}</span>
                    {featured.precioOriginal > featured.precio ? (
                      <span className="text-sm text-muted-foreground line-through">
                        ${featured.precioOriginal.toFixed(2)}
                      </span>
                    ) : null}
                  </div>
                )}
                <Link
                  href={`/dashboard/cursos?course=${encodeURIComponent(featured.id)}`}
                  className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)]"
                >
                  Ver curso
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Categories grid — dynamic from admin */}
      {adminCategorias.length > 0 ? (
        <section className="space-y-4">
          <div>
            <h2 className="font-display text-2xl text-foreground md:text-3xl">Explora por area</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Encuentra rapido lo que necesitas.</p>
          </div>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {adminCategorias.slice(0, 8).map((cat) => (
              <Link
                key={cat.id}
                href={`/dashboard/cursos?categoria=${encodeURIComponent(cat.nombre)}`}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40"
              >
                <div
                  className="absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-25 blur-2xl"
                  style={{ background: cat.color }}
                />
                <div className="relative">
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block h-2 w-2 rounded-full"
                      style={{ background: cat.color }}
                    />
                    <div className="text-sm font-bold text-foreground">{cat.nombre}</div>
                  </div>
                  {cat.descripcion ? (
                    <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{cat.descripcion}</div>
                  ) : null}
                  {cat.subcategorias && cat.subcategorias.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {cat.subcategorias.slice(0, 3).map((sub) => (
                        <span
                          key={sub.id}
                          className="rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground"
                        >
                          {sub.nombre}
                        </span>
                      ))}
                      {cat.subcategorias.length > 3 ? (
                        <span className="rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
                          +{cat.subcategorias.length - 3}
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="mt-3 inline-flex items-center gap-1 text-[11px] font-bold text-primary">
                    Explorar
                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* Quick stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: BookOpen, label: "Cursos activos", value: enrolledCount, href: "/dashboard/cursos" },
          { icon: Target, label: "Simuladores", value: simulators.length, href: "/dashboard/simuladores" },
          { icon: Trophy, label: "Logros", value: "Ver", href: "/dashboard/logros" },
          { icon: BarChart2, label: "En progreso", value: inProgress, href: "/dashboard/progreso" },
        ].map((item) => (
          <Link
            key={item.label}
            href={item.href}
            className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <item.icon className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-black text-foreground">{item.value}</div>
              <div className="text-[11px] text-muted-foreground">{item.label}</div>
            </div>
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </Link>
        ))}
      </section>

      {/* Help block */}
      <section className="rounded-3xl border border-border bg-card p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Headphones className="h-6 w-6" />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl text-foreground">Necesitas ayuda con un pago o un curso?</h2>
            <p className="text-sm text-muted-foreground">
              Abre un ticket y nuestro equipo te responde en menos de 24h habiles.
            </p>
          </div>
          <Link
            href="/dashboard/soporte"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Contactar soporte
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}
