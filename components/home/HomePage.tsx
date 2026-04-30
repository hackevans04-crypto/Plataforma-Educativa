"use client"

import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useEffect, useRef, useState } from "react"
import {
  ArrowRight,
  Award,
  BarChart2,
  BookOpen,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Clock,
  FileText,
  Flame,
  GraduationCap,
  MessageSquare,
  Play,
  Quote,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BrandBackdrop from "@/components/brand-backdrop"
import { getEntityClickScore, getSearchRelevanceScore, trackEntityClick } from "@/lib/discovery-popularity"

type PublicCourse = {
  id: string
  titulo: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  imagen?: string
  precio: number
  precioOriginal: number
  rating: number
  totalRatings: number
  totalHoras: string
  totalClases: number
  gratis: boolean
  bestseller?: boolean
  nuevo?: boolean
  popularity: number
}

type PublicSimulator = {
  id: string
  titulo: string
  descripcion: string
  categoria: string
  preguntas: number
  modo: string
  dificultad: string
  destacado?: boolean
  popularity: number
}

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
  tags?: string[]
  secciones?: Array<{ recursos: Array<{ duracionMinutos?: number }> }>
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  publicarEnPaginaPrincipal?: boolean
  createdAt?: string
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
  createdAt?: string
  updatedAt?: string
}

const COURSES_KEY = "he_cursos"
const SIMULATORS_KEY = "simuladores"
const ENROLLMENTS_KEY = "he_matriculas"
const SIMULATOR_RESULTS_KEY = "simuladores_resultados"

const FALLBACK_COURSES: PublicCourse[] = [
  {
    id: "qsm-2026",
    titulo: "Preparacion QSM 2026 - Guia completa para docentes",
    descripcion: "Domina pedagogia, curriculo, normativa y evaluacion con una ruta clara y medible.",
    instructor: "Hack Evans Academy",
    categoria: "Evaluacion Docente",
    nivel: "Todos los niveles",
    precio: 0,
    precioOriginal: 0,
    rating: 4.9,
    totalRatings: 1240,
    totalHoras: "12.5",
    totalClases: 48,
    gratis: true,
    bestseller: true,
    popularity: 100,
  },
  {
    id: "ia-docentes",
    titulo: "IA para docentes: prompts, planificaciones y automatizacion",
    descripcion: "Aprende a usar IA aplicada al aula con resultados practicos y materiales listos.",
    instructor: "Cristopher Andino",
    categoria: "Herramientas IA",
    nivel: "Principiante",
    precio: 19.99,
    precioOriginal: 49.99,
    rating: 4.7,
    totalRatings: 580,
    totalHoras: "8.5",
    totalClases: 32,
    gratis: false,
    nuevo: true,
    popularity: 90,
  },
  {
    id: "curriculo-ecuador",
    titulo: "Curriculo nacional aplicado al aula ecuatoriana",
    descripcion: "Planifica con seguridad pedagogica y aterriza el curriculo a tu realidad institucional.",
    instructor: "Hack Evans Academy",
    categoria: "Pedagogia",
    nivel: "Intermedio",
    precio: 0,
    precioOriginal: 0,
    rating: 4.8,
    totalRatings: 920,
    totalHoras: "6.5",
    totalClases: 28,
    gratis: true,
    bestseller: true,
    popularity: 80,
  },
]

const FALLBACK_SIMULATORS: PublicSimulator[] = [
  {
    id: "sim-qsm",
    titulo: "Simulador oficial QSM",
    descripcion: "Practica por competencias con avance por eje y retroalimentacion inmediata.",
    categoria: "QSM 2026",
    preguntas: 120,
    modo: "Adaptativo",
    dificultad: "Intermedio",
    destacado: true,
    popularity: 100,
  },
  {
    id: "sim-pedagogia",
    titulo: "Sprint de pedagogia aplicada",
    descripcion: "Bloques cortos para elevar tu precision en pedagogia y didactica.",
    categoria: "Pedagogia",
    preguntas: 60,
    modo: "Cronometrado",
    dificultad: "Basico",
    popularity: 80,
  },
  {
    id: "sim-normativa",
    titulo: "Laboratorio de normativa docente",
    descripcion: "Entrena casos frecuentes y mide tus decisiones con reportes claros.",
    categoria: "Normativa",
    preguntas: 80,
    modo: "Mixto",
    dificultad: "Avanzado",
    popularity: 70,
  },
]

const TESTIMONIALS = [
  {
    name: "Andrea M.",
    role: "Docente de Lengua",
    text: "Por fin una plataforma que no se siente improvisada. El avance por areas y los simuladores realmente orientan que estudiar.",
  },
  {
    name: "Kevin P.",
    role: "Aspirante QSM",
    text: "La combinacion de cursos, IA y simuladores me dio una ruta mucho mas clara. Se siente profesional de verdad.",
  },
  {
    name: "Marisol R.",
    role: "Coordinadora academica",
    text: "Hack Evans ya no parece solo un sitio de recursos. Ahora transmite una marca premium y confiable para docentes.",
  },
]

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function useCountUp(end: number, inView: boolean) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!inView) return

    const startTime = performance.now()

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / 1800, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [end, inView])

  return count
}

function formatDuration(minutes: number) {
  if (!minutes) return "1.0"
  return (minutes / 60).toFixed(1)
}

function totalMinutes(sections?: Array<{ recursos: Array<{ duracionMinutos?: number }> }>) {
  return (sections || []).reduce(
    (total, section) =>
      total + section.recursos.reduce((sum, resource) => sum + (resource.duracionMinutos || 0), 0),
    0
  )
}

function getPublicCourses(): PublicCourse[] {
  if (typeof window === "undefined") return FALLBACK_COURSES

  const records = parseSafe<CourseRecord[]>(window.localStorage.getItem(COURSES_KEY), [])
  const enrollments = parseSafe<Array<{ cursoId: string }>>(window.localStorage.getItem(ENROLLMENTS_KEY), [])
  const enrollmentCounts = enrollments.reduce<Record<string, number>>((acc, item) => {
    acc[item.cursoId] = (acc[item.cursoId] || 0) + 1
    return acc
  }, {})

  const published = records
    .filter((course) => course.estado === "publicado" && course.publicarEnPaginaPrincipal !== false)
    .sort((a, b) => {
      const scoreA =
        (a.destacado ? 30 : 0) +
        (a.popular ? 20 : 0) +
        (a.nuevo ? 10 : 0) +
        new Date(a.createdAt || 0).getTime() / 1_000_000_000_000
      const scoreB =
        (b.destacado ? 30 : 0) +
        (b.popular ? 20 : 0) +
        (b.nuevo ? 10 : 0) +
        new Date(b.createdAt || 0).getTime() / 1_000_000_000_000
      return scoreB - scoreA
    })

  if (published.length === 0) return FALLBACK_COURSES

  const mapped = published.map((course, index) => {
    const minutes = totalMinutes(course.secciones)
    const gratis = course.acceso !== "pago" || (course.precio || 0) <= 0
    const baseRating = course.destacado ? 4.9 : course.popular ? 4.8 : course.nuevo ? 4.7 : 4.6
    const lessons = (course.secciones || []).reduce((sum, section) => sum + section.recursos.length, 0) || 12
    const enrollCount = enrollmentCounts[course.id] || 0
    const clickScore = getEntityClickScore("course", course.id)
    const searchScore = getSearchRelevanceScore("course", [
      course.titulo,
      course.descripcion,
      course.categoria,
      course.instructor,
      ...(course.tags || []),
    ])
    const popularity =
      (course.destacado ? 40 : 0) +
      (course.popular ? 26 : 0) +
      (course.nuevo ? 10 : 0) +
      enrollCount * 8 +
      clickScore * 5 +
      searchScore * 3 +
      lessons

    return {
      id: course.id,
      titulo: course.titulo,
      descripcion: course.subtitulo?.trim() || course.descripcion,
      instructor: course.instructor || "Hack Evans Academy",
      categoria: course.categoria || "General",
      nivel: course.nivel || "Todos los niveles",
      imagen: (course as CourseRecord & { portadaImagen?: string }).portadaImagen,
      precio: gratis ? 0 : Number(course.precio || 0),
      precioOriginal: gratis
        ? 0
        : Number(course.precioOriginal || Math.max(Number(course.precio || 0) * 1.7, Number(course.precio || 0))),
      rating: Number(baseRating.toFixed(1)),
      totalRatings: Math.max(24, 80 + enrollCount * 14 + clickScore * 5 + searchScore * 4 + index * 12),
      totalHoras: formatDuration(minutes),
      totalClases: lessons,
      gratis,
      bestseller: Boolean(course.destacado || course.popular),
      nuevo: Boolean(course.nuevo),
      popularity,
    }
  })

  return mapped.sort((a, b) => b.popularity - a.popularity).slice(0, 3)
}

function getPublicSimulators(): PublicSimulator[] {
  if (typeof window === "undefined") return FALLBACK_SIMULATORS

  const records = parseSafe<SimulatorRecord[]>(window.localStorage.getItem(SIMULATORS_KEY), [])
  const results = parseSafe<Array<{ simuladorId?: string }>>(window.localStorage.getItem(SIMULATOR_RESULTS_KEY), [])
  const resultCounts = results.reduce<Record<string, number>>((acc, item) => {
    if (!item.simuladorId) return acc
    acc[item.simuladorId] = (acc[item.simuladorId] || 0) + 1
    return acc
  }, {})
  const published = records.filter(
    (sim) =>
      sim.estado === "publicado" &&
      sim.publicarEnPaginaPrincipal !== false &&
      sim.categoria !== "evaluacion"
  )

  if (published.length === 0) return FALLBACK_SIMULATORS

  const mapped = published.map((sim) => {
    const questions = Array.isArray(sim.preguntas) ? sim.preguntas.length : 40
    const attempts = resultCounts[sim.id] || 0
    const clickScore = getEntityClickScore("simulator", sim.id)
    const searchScore = getSearchRelevanceScore("simulator", [sim.titulo, sim.descripcion, sim.categoria || ""])
    const popularity = attempts * 8 + clickScore * 5 + searchScore * 3 + questions / 4

    return {
      id: sim.id,
      titulo: sim.titulo,
      descripcion: sim.descripcion || "Entrena con un simulador premium y reportes por competencia.",
      categoria: sim.categoria || "Simulador",
      preguntas: questions,
      modo: sim.config?.modoIA ? "Asistido por IA" : "Cronometrado",
      dificultad: questions <= 40 ? "Basico" : questions <= 80 ? "Intermedio" : "Avanzado",
      destacado: false,
      popularity,
    }
  })

  return mapped
    .sort((a, b) => b.popularity - a.popularity)
    .map((item, index) => ({ ...item, destacado: index === 0 }))
    .slice(0, 3)
}

/* ------------------------------------------------------------------ */
/* Shared shells                                                       */
/* ------------------------------------------------------------------ */

function SectionShell({
  id,
  children,
  className,
}: {
  id?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <section id={id} className={cn("relative py-24 md:py-28", className)}>
      <div className="relative z-10 mx-auto w-full max-w-7xl px-6">{children}</div>
    </section>
  )
}

function Eyebrow({
  icon,
  label,
  tone = "red",
  className,
}: {
  icon: React.ReactNode
  label: string
  tone?: "red" | "white"
  className?: string
}) {
  const toneClass =
    tone === "white"
      ? "border-white/14 bg-white/[0.04] text-white/80"
      : "border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]"
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] backdrop-blur-sm",
        toneClass,
        className
      )}
    >
      <span className={tone === "white" ? "text-white/70" : "text-[#ff6b5e]"}>{icon}</span>
      {label}
    </span>
  )
}

function PromptDock({
  icon,
  text,
  action,
  chips,
}: {
  icon: React.ReactNode
  text: string
  action: string
  chips: string[]
}) {
  return (
    <div className="rounded-[28px] border border-white/8 bg-white/[0.025] p-4 backdrop-blur-md">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 items-center gap-3 rounded-[22px] border border-white/8 bg-[#0c0d12] px-4 py-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.1)] text-[#ff8c7d]">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-white/60">{text}</div>
          </div>
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.02]">
          {action}
          <Send size={14} />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {chips.map((chip, index) => (
          <span
            key={chip}
            className={cn(
              "rounded-full border px-3 py-1.5 text-xs",
              index === 0
                ? "border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]"
                : "border-white/8 bg-white/[0.04] text-white/55"
            )}
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  )
}

function StatCard({
  icon,
  end,
  suffix,
  label,
  inView,
  displayValue,
  accent = "red",
}: {
  icon: React.ReactNode
  end: number
  suffix: string
  label: string
  inView: boolean
  displayValue?: string
  accent?: "red" | "white"
}) {
  const count = useCountUp(end, inView)
  const numberClass =
    accent === "white"
      ? "text-white"
      : "bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent"
  return (
    <div className="group rounded-[26px] border border-white/8 bg-white/[0.025] p-5 text-center backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.1)] text-[#ff8c7d]">
        {icon}
      </div>
      <div className={cn("text-4xl font-black", numberClass)}>
        {displayValue ?? `${count.toLocaleString()}${suffix}`}
      </div>
      <p className="mt-1 text-sm text-white/50">{label}</p>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Hero (Inicio)                                                       */
/* ------------------------------------------------------------------ */

function HeroSection({
  courseCount,
  simulatorCount,
}: {
  courseCount: number
  simulatorCount: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section id="inicio" ref={ref} className="relative flex min-h-screen items-center pt-24 lg:pt-28">
      <motion.div
        style={{ y, opacity }}
        className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 gap-14 px-6 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:items-center"
      >
        <div>
          <motion.div
            className="mb-7 flex flex-wrap gap-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {[
              { icon: <Flame size={12} />, text: "QSM 2026 actualizado" },
              { icon: <BookOpen size={12} />, text: "Cursos premium" },
              { icon: <Brain size={12} />, text: "IA integrada" },
            ].map((badge, index) => (
              <motion.span
                key={badge.text}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/75 backdrop-blur-md"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ scale: 1.04, borderColor: "rgba(232,57,42,0.5)" }}
              >
                <span className="text-[#ff6b4d]">{badge.icon}</span>
                {badge.text}
              </motion.span>
            ))}
          </motion.div>

          <motion.h1
            className="max-w-4xl text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 34 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            La plataforma{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              docente
            </span>{" "}
            que mezcla cursos, IA y simuladores en una experiencia de otro nivel.
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            Cursos, IA, simuladores y rutas de estudio en una sola experiencia. Pensada para que un docente entienda rapido por donde empezar, que practicar y como mejorar.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 max-w-2xl rounded-[28px] border border-white/10 bg-white/[0.04] p-4 backdrop-blur-xl"
          >
            <div className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-[#0c0d12] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]">
                <Sparkles size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs uppercase tracking-[0.18em] text-white/40">Asistente de ruta</div>
                <div className="truncate text-sm text-white/75">
                  Quiero prepararme para QSM y reforzar normativa en 14 dias
                </div>
              </div>
              <button className="rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-4 py-2 text-xs font-bold text-white shadow-[0_8px_22px_rgba(232,57,42,0.4)]">
                Generar plan
              </button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {["Ruta de estudio", "Curso sugerido", "Simulador recomendado", "Diagnostico inicial"].map((item, index) => (
                <span
                  key={item}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs",
                    index === 0
                      ? "border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]"
                      : "border-white/8 bg-white/[0.04] text-white/55"
                  )}
                >
                  {item}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="mt-9 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Link href="/registro">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(232,57,42,0.42)]"
              >
                <span className="relative z-10">Empezar gratis</span>
                <motion.span
                  className="relative z-10"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight size={16} />
                </motion.span>
                <motion.div
                  className="absolute inset-0 -skew-x-12 bg-white/25"
                  initial={{ x: "-180%" }}
                  whileHover={{ x: "180%" }}
                  transition={{ duration: 0.55 }}
                />
              </motion.button>
            </Link>

            <Link href="#simulador">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.07]"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.15)] text-[#ff8c7d]">
                  <Play size={13} className="ml-0.5" fill="currentColor" />
                </div>
                Ver simuladores
              </motion.button>
            </Link>
          </motion.div>

          <motion.div
            className="mt-10 flex items-center gap-5 border-t border-white/6 pt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex -space-x-2.5">
              {["#E8392A", "#ff6b4d", "#ff8c7d", "#ffaaa0", "#ffffff"].map((color, index) => (
                <div
                  key={index}
                  className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#06070a] text-xs font-bold"
                  style={{ background: color, color: index === 4 ? "#0a0a0a" : "#fff" }}
                >
                  {String.fromCharCode(65 + index)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-white">+5,000 docentes activos</p>
              <div className="mt-0.5 flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} size={11} className="fill-[#fbbf24] text-[#fbbf24]" />
                ))}
                <span className="ml-1.5 text-xs text-white/45">4.9/5 valoracion</span>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="relative hidden lg:block"
          initial={{ opacity: 0, x: 56 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.9, delay: 0.35 }}
        >
          <div className="overflow-hidden rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(15,17,22,0.9),rgba(7,8,12,0.95))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)] backdrop-blur-xl">
            <div className="mb-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-white/10 bg-white/5">
                  <Image src="/icon.svg" alt="Hack Evans" fill className="object-contain p-1" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/40">Control central</p>
                  <p className="mt-0.5 text-base font-bold text-white">Hack Evans Experience</p>
                </div>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8c7d]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6b4d]" />
                en vivo
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-white/45">Centro de accion</p>
                    <h3 className="mt-2 text-2xl font-bold text-white">
                      Empieza con una ruta, no con pantallas sueltas
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-6 text-white/55">
                      Diagnostico, plan y siguiente paso claro. Sin dispersarse en pestanas.
                    </p>
                  </div>
                  <div className="rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] p-3 text-[#ff8c7d]">
                    <Sparkles size={20} />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Cursos</div>
                  <div className="mt-3 text-4xl font-black text-white">{String(courseCount).padStart(2, "0")}</div>
                  <p className="mt-2 text-sm text-white/52">Catalogo aterrizado al docente.</p>
                </div>
                <div className="rounded-[26px] border border-white/8 bg-white/[0.035] p-5">
                  <div className="text-xs uppercase tracking-[0.18em] text-white/45">Simuladores</div>
                  <div className="mt-3 text-4xl font-black text-white">{String(simulatorCount).padStart(2, "0")}</div>
                  <p className="mt-2 text-sm text-white/52">Practica medible por competencia.</p>
                </div>
              </div>

              <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5">
                {[
                  ["Pedagogia", 92],
                  ["Curriculo", 87],
                  ["Normativa", 79],
                ].map(([label, value], index) => (
                  <div key={label as string} className={cn(index !== 2 && "mb-4")}>
                    <div className="mb-1.5 flex items-center justify-between text-sm">
                      <span className="text-white/65">{label}</span>
                      <span className="font-semibold text-white">{value}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/8">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d]"
                        initial={{ width: 0 }}
                        animate={{ width: `${value}%` }}
                        transition={{ duration: 1.2, delay: 1 + index * 0.12 }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div
            className="absolute -right-4 -top-4 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-3 py-2 text-xs font-black text-[#0a0a0a] shadow-[0_16px_40px_rgba(250,204,21,0.28)]"
            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            Experiencia premium
          </motion.div>

          <motion.div
            className="absolute -bottom-4 -left-4 rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-4 py-3 text-xs text-white backdrop-blur-xl"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, delay: 0.8 }}
          >
            <span className="font-bold text-[#ff8c7d]">+127 puntos</span>
            <span className="text-white/55"> esta semana</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/* Stats bar                                                           */
/* ------------------------------------------------------------------ */

function StatsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <div ref={ref} className="relative border-y border-white/6 bg-black/35 py-14 backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,57,42,0.6)] to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 lg:grid-cols-4">
        <StatCard icon={<Users size={22} />} end={5000} suffix="+" label="Docentes activos" inView={inView} />
        <StatCard icon={<BookOpen size={22} />} end={50} suffix="+" label="Cursos disponibles" inView={inView} />
        <StatCard icon={<Trophy size={22} />} end={98} suffix="%" label="Tasa de aprobacion" inView={inView} />
        <StatCard
          icon={<Star size={22} />}
          end={49}
          suffix="/5"
          label="Valoracion promedio"
          inView={inView}
          displayValue="4.9/5"
        />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,57,42,0.4)] to-transparent" />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Docentes EC                                                         */
/* ------------------------------------------------------------------ */

function DocentesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const workflows = [
    {
      icon: <Target size={18} />,
      title: "Diagnostico por convocatoria",
      desc: "Detecta rapido en que competencia estas perdiendo puntos antes de estudiar a ciegas.",
    },
    {
      icon: <FileText size={18} />,
      title: "Ruta de estudio aterrizada",
      desc: "Convierte resultados y metas en un plan concreto con prioridades semanales.",
    },
    {
      icon: <Award size={18} />,
      title: "Evidencia de avance",
      desc: "Visualiza tu progreso por pedagogia, curriculo, normativa y evaluacion sin perder contexto.",
    },
    {
      icon: <GraduationCap size={18} />,
      title: "Material docente util",
      desc: "Menos secciones de relleno y mas recursos que ayudan a decidir que hacer despues.",
    },
  ]

  return (
    <SectionShell id="docentes-ec">
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <Eyebrow icon={<ShieldCheck size={13} />} label="Docentes EC" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            Preparacion clara para{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              docentes en Ecuador
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/55">
            Organiza tu avance con simuladores alineados al proceso oficial, reportes por competencia y una ruta de estudio pensada para convocatorias reales.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5">
            <PromptDock
              icon={<Sparkles size={16} />}
              text="Necesito una ruta para QSM con foco en normativa y pedagogia aplicada..."
              action="Preparar ruta"
              chips={["QSM 2026", "Pedagogia", "Normativa", "Plan semanal"]}
            />

            {workflows.map((benefit, index) => (
              <motion.div
                key={benefit.title}
                initial={{ opacity: 0, x: -28 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.28 + index * 0.08 }}
                whileHover={{ x: 4 }}
                className="group flex gap-4 rounded-[26px] border border-white/8 bg-white/[0.025] p-5 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.35)] hover:bg-white/[0.045]"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] transition-transform group-hover:scale-105">
                  {benefit.icon}
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{benefit.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/52">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}

            <motion.div
              initial={{ opacity: 0 }}
              animate={inView ? { opacity: 1 } : {}}
              transition={{ delay: 0.72 }}
            >
              <Link
                href="/docentes-ec"
                className="inline-flex items-center gap-2 text-sm font-bold text-[#ff8c7d] transition-colors hover:text-white"
              >
                Ver todo el flujo Docentes EC
                <ArrowRight size={15} />
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,17,22,0.95),rgba(7,8,12,0.95))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Panel docente</p>
                <p className="mt-1 text-xl font-bold text-white">Mapa de avance y decisiones</p>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[#ff8c7d]">
                Activo
              </div>
            </div>

            <div className="mb-6 grid gap-3 sm:grid-cols-3">
              {[
                { value: "15K+", label: "docentes activos" },
                { value: "4", label: "ejes clave" },
                { value: "Live", label: "seguimiento" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4">
                  <div className="text-2xl font-black text-white">{item.value}</div>
                  <div className="mt-1 text-[11px] uppercase tracking-[0.16em] text-white/40">{item.label}</div>
                </div>
              ))}
            </div>

            {[
              ["Pedagogia", 92],
              ["Curriculo", 87],
              ["Normativa", 85],
              ["Evaluacion", 78],
            ].map(([label, value], index) => (
              <div key={label as string} className={cn(index !== 3 && "mb-4")}>
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-sm text-white/60">{label}</span>
                  <span className="text-sm font-semibold text-white">{value}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/7">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d]"
                    initial={{ width: 0 }}
                    animate={inView ? { width: `${value}%` } : {}}
                    transition={{ duration: 1.2, delay: 0.45 + index * 0.12 }}
                  />
                </div>
              </div>
            ))}

            <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-5">
              <div>
                <p className="text-xs text-white/40">Promedio general</p>
                <p className="bg-gradient-to-r from-[#ff8c7d] to-[#E8392A] bg-clip-text text-3xl font-black text-transparent">
                  86%
                </p>
              </div>
              <Link
                href="/docentes-ec"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.02]"
              >
                Ver detalle
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Cursos                                                              */
/* ------------------------------------------------------------------ */

function CourseCard({ course, index, inView }: { course: PublicCourse; index: number; inView: boolean }) {
  const [inCart, setInCart] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12 }}
    >
      <Link href="/cursos" className="block" onClick={() => trackEntityClick("course", course.id)}>
        <div className="group overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0e13]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(232,57,42,0.45)] hover:shadow-[0_28px_80px_rgba(232,57,42,0.18)]">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0b10]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A] opacity-95" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            {course.imagen ? (
              <img
                src={course.imagen}
                alt={course.titulo}
                className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen"
              />
            ) : null}
            <div className="absolute left-5 right-5 top-5">
              <div className="flex items-start justify-between gap-3">
                <div className="max-w-[72%]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{course.categoria}</div>
                  <div className="mt-3 text-2xl font-black leading-tight text-white">{course.titulo}</div>
                </div>
                <div className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                  {course.nivel}
                </div>
              </div>
            </div>
            <div className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
              <Play size={18} className="ml-0.5" fill="currentColor" />
            </div>

            {course.bestseller ? (
              <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
                Mas vendido
              </span>
            ) : null}
            {course.nuevo ? (
              <span className="absolute left-4 top-4 rounded-full bg-white px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#E8392A]">
                Nuevo
              </span>
            ) : null}
            {course.gratis ? (
              <span className="absolute right-4 top-4 rounded-full bg-[#16a34a] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                Gratis
              </span>
            ) : null}
          </div>

          <div className="p-5">
            <p className="text-xs font-medium text-white/45">{course.instructor}</p>
            <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/60">{course.descripcion}</p>

            <div className="mt-3 flex items-center gap-1.5">
              <span className="text-sm font-bold text-[#fbbf24]">{course.rating.toFixed(1)}</span>
              <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={11}
                    className={
                      star <= Math.round(course.rating)
                        ? "fill-[#fbbf24] text-[#fbbf24]"
                        : "fill-white/15 text-white/15"
                    }
                  />
                ))}
              </div>
              <span className="text-xs text-white/40">({course.totalRatings.toLocaleString()})</span>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                <Clock size={10} />
                {course.totalHoras} horas
              </span>
              <span className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                {course.totalClases} clases
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                <BarChart2 size={10} />
                {course.nivel}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
              <div className="flex items-baseline gap-2">
                {course.gratis ? (
                  <span className="text-2xl font-black text-[#22c55e]">Gratis</span>
                ) : (
                  <>
                    <span className="text-2xl font-black text-white">${course.precio.toFixed(2)}</span>
                    <span className="text-sm text-white/30 line-through">${course.precioOriginal.toFixed(2)}</span>
                  </>
                )}
              </div>

              <button
                onClick={(event) => {
                  event.preventDefault()
                  setInCart((value) => !value)
                }}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-bold transition-all",
                  inCart
                    ? "border-[#E8392A] bg-[#E8392A] text-white"
                    : "border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] hover:bg-[#E8392A] hover:text-white"
                )}
              >
                <BookOpen size={12} />
                {inCart ? "Anadido" : course.gratis ? "Inscribirse" : "Al carrito"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function CoursesSection({ courses }: { courses: PublicCourse[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <SectionShell id="cursos">
      <div ref={ref}>
        <div className="mb-14 flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
            <Eyebrow icon={<BookOpen size={13} />} label="Cursos" />
            <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
              Cursos para descubrir, filtrar y comparar{" "}
              <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
                con claridad
              </span>
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/55">
              Catalogo aterrizado al docente: filtra por categoria, nivel y formato. Compara cursos con tarjetas claras.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : {}}
            transition={{ delay: 0.35 }}
          >
            <Link
              href="/cursos"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.04] px-5 py-3 text-sm font-bold text-white/85 backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.07]"
            >
              Ver todos los cursos
              <ArrowRight size={15} />
            </Link>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <PromptDock
            icon={<BookOpen size={16} />}
            text="Buscar cursos, instructor, categoria o tipo de preparacion..."
            action="Explorar catalogo"
            chips={["Todos", "QSM", "IA", "Pedagogia", "Gratis"]}
          />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course, index) => (
            <CourseCard key={course.id} course={course} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* IA                                                                  */
/* ------------------------------------------------------------------ */

function IASection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const tools = [
    {
      icon: <FileText size={18} />,
      title: "Planificaciones con contexto",
      desc: "Genera borradores iniciales mas utiles para el aula ecuatoriana.",
    },
    {
      icon: <Brain size={18} />,
      title: "Banco de preguntas asistido",
      desc: "Convierte temas clave en practicas con mejor estructura y ritmo.",
    },
    {
      icon: <Bot size={18} />,
      title: "Asistente pedagogico",
      desc: "Resuelve dudas y propone siguientes pasos sin romper el flujo de estudio.",
    },
    {
      icon: <BarChart2 size={18} />,
      title: "Analisis accionable",
      desc: "Reportes que no solo muestran datos, sino decisiones sugeridas.",
    },
  ]

  return (
    <SectionShell id="ia">
      <div ref={ref}>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[1fr_1fr]">
          <motion.div initial={{ opacity: 0, x: -32 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
            <Eyebrow icon={<Sparkles size={13} />} label="IA aplicada" />
            <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
              Inteligencia artificial para una{" "}
              <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
                preparacion mas precisa
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/55">
              Activa asistentes que detectan tus brechas, recomiendan el siguiente paso y aterrizan la IA al aula docente.
            </p>

            <div className="mt-8">
              <PromptDock
                icon={<Bot size={16} />}
                text="Necesito una ruta para reforzar normativa y crear preguntas parecidas al QSM..."
                action="Usar IA"
                chips={["Diagnostico", "Prompts", "Banco de preguntas", "Ruta sugerida"]}
              />
            </div>

            <div className="mt-5 grid gap-4">
              {tools.map((tool, index) => (
                <motion.div
                  key={tool.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.1 }}
                  whileHover={{ x: 4 }}
                  className="group flex gap-4 rounded-[24px] border border-white/8 bg-white/[0.025] p-4 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.35)] hover:bg-white/[0.045]"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]">
                    {tool.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">{tool.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-white/52">{tool.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,17,22,0.95),rgba(7,8,12,0.95))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.45)] backdrop-blur-xl"
          >
            <div className="mb-6 flex items-center gap-3 border-b border-white/6 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]">
                <Bot size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Hack Evans IA</p>
                <p className="text-xs text-white/45">Asistente pedagogico para docentes en Ecuador</p>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.1)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8c7d]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6b4d]" />
                online
              </div>
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.04] p-5">
              <div className="mb-3 text-xs uppercase tracking-[0.18em] text-white/45">Caja de accion</div>
              <div className="rounded-2xl border border-white/8 bg-[#0c0d12] px-4 py-3 text-sm text-white/65">
                Necesito una ruta personalizada para mejorar normativa y evaluacion en 14 dias.
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  "Diagnostico inicial",
                  "Ruta de estudio",
                  "Preguntas asistidas",
                  "Resumen para repasar",
                ].map((item, index) => (
                  <span
                    key={item}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs",
                      index === 0
                        ? "border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]"
                        : "border-white/8 bg-white/[0.04] text-white/55"
                    )}
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  <Zap size={11} className="text-[#ff8c7d]" />
                  Asistencia
                </div>
                <div className="mt-3 text-4xl font-black text-white">24/7</div>
                <p className="mt-2 text-sm text-white/50">Soporte contextual sin friccion.</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-5">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-white/45">
                  <CheckCircle2 size={11} className="text-[#ff8c7d]" />
                  Acciones
                </div>
                <div className="mt-3 text-4xl font-black text-white">1 click</div>
                <p className="mt-2 text-sm text-white/50">Diagnostico y siguiente paso claro.</p>
              </div>
            </div>

            <div className="mt-6 border-t border-white/6 pt-5">
              <Link
                href="/ia"
                className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-3 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.01]"
              >
                Probar IA aplicada
                <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Simulador                                                           */
/* ------------------------------------------------------------------ */

function SimulatorCard({
  simulator,
  index,
  inView,
}: {
  simulator: PublicSimulator
  index: number
  inView: boolean
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 34 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.12 }}
    >
      <Link href="/simulador" className="block" onClick={() => trackEntityClick("simulator", simulator.id)}>
        <div className="group overflow-hidden rounded-[28px] border border-white/8 bg-[#0d0e13]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1.5 hover:border-[rgba(232,57,42,0.45)] hover:shadow-[0_28px_80px_rgba(232,57,42,0.18)]">
          <div className="relative aspect-[16/9] overflow-hidden bg-[#0a0b10]">
            <div className="absolute inset-0 bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A] opacity-95" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%)]" />
            <div
              className="absolute inset-0 opacity-25"
              style={{
                backgroundImage:
                  "linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="absolute left-5 right-5 top-5">
              <div className="flex items-start justify-between gap-3">
                <div className="max-w-[72%]">
                  <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80">{simulator.categoria}</div>
                  <div className="mt-3 text-2xl font-black leading-tight text-white">{simulator.titulo}</div>
                </div>
                <div className="rounded-full border border-white/30 bg-black/30 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur-md">
                  {simulator.dificultad}
                </div>
              </div>
            </div>
            {simulator.destacado ? (
              <span className="absolute left-4 top-4 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
                Top
              </span>
            ) : null}
            <div className="absolute bottom-5 right-5 flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/30 text-white opacity-0 backdrop-blur-md transition-opacity group-hover:opacity-100">
              <Play size={18} className="ml-0.5" fill="currentColor" />
            </div>
          </div>

          <div className="p-5">
            <p className="line-clamp-2 text-sm leading-6 text-white/60">{simulator.descripcion}</p>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                <Clock size={10} />
                {simulator.preguntas} preguntas
              </span>
              <span className="rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                {simulator.modo}
              </span>
              <span className="inline-flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-1 text-[11px] text-white/55">
                <BarChart2 size={10} />
                {simulator.dificultad}
              </span>
            </div>

            <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-4">
              <div className="text-lg font-black text-white">Practicar</div>
              <span className="inline-flex items-center gap-1.5 rounded-xl border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.12)] px-3 py-2 text-xs font-bold text-[#ff8c7d] transition-all group-hover:bg-[#E8392A] group-hover:text-white">
                Abrir simulador
                <ChevronRight size={13} />
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

function SimulatorSection({ simulators }: { simulators: PublicSimulator[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <SectionShell id="simulador">
      <div ref={ref}>
        <div className="mb-14 grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}}>
            <Eyebrow icon={<Target size={13} />} label="Simuladores" />
            <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
              Simuladores con el{" "}
              <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
                mismo nivel visual
              </span>{" "}
              que un curso premium
            </h2>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-white/55">
              Aqui se exploran como un catalogo: enfoque, modo y dificultad claros desde la tarjeta. Sin bloques secundarios.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 22 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.25 }}
            className="rounded-[28px] border border-white/8 bg-white/[0.025] p-5 backdrop-blur-md"
          >
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                { value: "75%", label: "avance promedio" },
                { value: "3", label: "modos de practica" },
                { value: "Live", label: "feedback" },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-[#0c0d12] px-4 py-4">
                  <div className="text-2xl font-black text-white">{item.value}</div>
                  <div className="mt-1 text-xs uppercase tracking-[0.16em] text-white/40">{item.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.22 }}
          className="mb-8"
        >
          <PromptDock
            icon={<Sparkles size={16} />}
            text="Quiero practicar pedagogia con modo cronometrado y feedback por competencia..."
            action="Recomendar"
            chips={["Todos", "Cronometrado", "Adaptativo", "Basico", "Avanzado"]}
          />
        </motion.div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {simulators.map((simulator, index) => (
            <SimulatorCard key={simulator.id} simulator={simulator} index={index} inView={inView} />
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Testimonios                                                         */
/* ------------------------------------------------------------------ */

function TestimonialsSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <SectionShell>
      <div ref={ref}>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 text-center"
        >
          <Eyebrow icon={<MessageSquare size={13} />} label="Testimonios" tone="white" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            La nueva portada transmite{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              confianza y valor
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((item, index) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 26 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.12 }}
              whileHover={{ y: -4 }}
              className="group rounded-[30px] border border-white/8 bg-white/[0.025] p-7 backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.35)] hover:bg-white/[0.04]"
            >
              <Quote className="h-7 w-7 text-[#ff8c7d]" />
              <p className="mt-5 text-base leading-8 text-white/70">{item.text}</p>
              <div className="mt-6 flex items-center gap-3 border-t border-white/6 pt-5">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{
                    background:
                      index % 2 === 0
                        ? "linear-gradient(135deg,#E8392A,#ff6b4d)"
                        : "linear-gradient(135deg,#ff8c7d,#E8392A)",
                  }}
                >
                  {item.name.charAt(0)}
                </div>
                <div>
                  <div className="font-semibold text-white">{item.name}</div>
                  <div className="mt-0.5 text-sm text-white/45">{item.role}</div>
                </div>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Final CTA                                                           */
/* ------------------------------------------------------------------ */

function FinalCtaSection() {
  return (
    <SectionShell className="pb-32 pt-10">
      <div className="relative overflow-hidden rounded-[36px] border border-[rgba(232,57,42,0.3)] bg-[linear-gradient(135deg,#0e1015_0%,#1a0f10_50%,#2c1411_100%)] px-8 py-12 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:px-10 lg:px-14 lg:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,57,42,0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,107,77,0.22),transparent_42%)]" />
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(ellipse at center, black 50%, transparent 90%)",
            WebkitMaskImage:
              "radial-gradient(ellipse at center, black 50%, transparent 90%)",
          }}
        />

        <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <Eyebrow icon={<Zap size={13} />} label="Hack Evans 2.0" />
            <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white lg:text-5xl">
              Una experiencia docente premium, conectada y lista para acompanarte hasta tu evaluacion.
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
              Inicio, Docentes EC, Cursos, IA y Simulador en un mismo universo visual. Diseno de marca, sin distracciones.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_42px_rgba(232,57,42,0.4)] transition-transform hover:scale-[1.02]"
            >
              Empezar ahora
              <ArrowRight size={16} />
            </Link>
            <Link
              href="#simulador"
              className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.08]"
            >
              Ver simulador
              <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </div>
    </SectionShell>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function HomePage() {
  const router = useRouter()
  const [courses, setCourses] = useState<PublicCourse[]>(FALLBACK_COURSES)
  const [simulators, setSimulators] = useState<PublicSimulator[]>(FALLBACK_SIMULATORS)

  useEffect(() => {
    const sync = () => {
      setCourses(getPublicCourses())
      setSimulators(getPublicSimulators())
    }

    sync()
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
  }, [])

  const handleSectionNavigate = (section: string) => {
    const target = document.getElementById(section)
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <BrandBackdrop />
      <div className="relative z-10">
        <Navbar
          onLoginClick={() => router.push("/login")}
          onRegisterClick={() => router.push("/registro")}
          onNavigate={handleSectionNavigate}
          hideAuthenticatedUserMenu
        />

        <HeroSection courseCount={courses.length} simulatorCount={simulators.length} />
        <StatsSection />
        <DocentesSection />
        <CoursesSection courses={courses} />
        <IASection />
        <SimulatorSection simulators={simulators} />
        <TestimonialsSection />
        <FinalCtaSection />

        <Footer />
      </div>
    </main>
  )
}
