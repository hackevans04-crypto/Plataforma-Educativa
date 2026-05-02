"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useCallback, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Award, BookOpen, CheckCircle, Clock, Key, Search, Target, Undo2 } from "lucide-react"
import CourseLearnView from "@/components/dashboard/course-learn-view"
import {
  REFUND_WINDOW_DAYS,
  createRefundRequest,
  getPaymentsForUser,
  getRefundEligibility,
  getRefundRequestsForUser,
  type PaymentRecord,
  type RefundRequest,
} from "@/lib/payments"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { CategoryFilter } from "@/components/courses"
import CatalogCourseCard from "@/components/cursos/CatalogCourseCard"
import { getSimuladores as getSimuladoresStorage } from "@/simuladores/storage"
import type { SimuladorBuilder } from "@/simuladores/types"

type CursoEstado = "borrador" | "en_revision" | "publicado" | "archivado"
type RecursoTipo = "video" | "documento" | "enlace" | "simulador" | "evaluacion" | "texto"
type AccesoTipo = "libre" | "clave" | "pago"

interface RecursoCurso {
  id: string
  tipo: RecursoTipo
  titulo: string
  duracionMinutos?: number
}

interface SeccionCurso {
  id: string
  titulo: string
  recursos: RecursoCurso[]
}

interface CursoData {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  estado: CursoEstado
  acceso: AccesoTipo
  clavematricula?: string
  precio?: number
  precioOriginal?: number
  colorPortada?: string
  colorPortada2?: string
  portadaImagen?: string
  secciones: SeccionCurso[]
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  publicarEnPaginaPrincipal?: boolean
  createdAt: string
}

interface MatriculaData {
  id: string
  userId: string
  cursoId: string
  fechaMatricula: string
  progreso: number
  completado: boolean
  tipoAcceso?: AccesoTipo
  montoPagado?: number
}

function parseSafe<T>(v: string | null, fb: T): T {
  try {
    return v ? JSON.parse(v) ?? fb : fb
  } catch {
    return fb
  }
}

const CURSOS_KEY = "he_cursos"
const MATRICULAS_KEY = "he_matriculas"

function getCursos(): CursoData[] {
  if (typeof window === "undefined") return []
  return parseSafe(localStorage.getItem(CURSOS_KEY), [])
}

function getMatriculas(): MatriculaData[] {
  if (typeof window === "undefined") return []
  return parseSafe(localStorage.getItem(MATRICULAS_KEY), [])
}

function getCursosPublicados(userId?: string) {
  const cursos = getCursos()
  if (!userId) {
    return cursos.filter((curso) => curso.estado === "publicado" && curso.publicarEnPaginaPrincipal !== false)
  }
  const matriculados = new Set(getMatriculas().filter((m) => m.userId === userId).map((m) => m.cursoId))
  return cursos.filter(
    (curso) => curso.estado === "publicado" && (curso.publicarEnPaginaPrincipal !== false || matriculados.has(curso.id))
  )
}

function matricular(m: MatriculaData) {
  const list = getMatriculas()
  if (list.some((x) => x.userId === m.userId && x.cursoId === m.cursoId)) return
  list.push(m)
  localStorage.setItem(MATRICULAS_KEY, JSON.stringify(list))
}

function getProgreso(userId: string, cursoId: string) {
  return getMatriculas().find((m) => m.userId === userId && m.cursoId === cursoId)?.progreso ?? 0
}

function totalLecciones(curso: CursoData) {
  return curso.secciones.reduce((acc, sec) => acc + sec.recursos.length, 0)
}

function totalMinutos(curso: CursoData) {
  return curso.secciones.reduce(
    (acc, sec) => acc + sec.recursos.reduce((sum, recurso) => sum + (recurso.duracionMinutos || 0), 0),
    0
  )
}

function totalSimuladores(curso: CursoData) {
  return curso.secciones.reduce(
    (acc, sec) => acc + sec.recursos.filter((recurso) => recurso.tipo === "simulador").length,
    0
  )
}

function totalEvaluaciones(curso: CursoData) {
  return curso.secciones.reduce(
    (acc, sec) => acc + sec.recursos.filter((recurso) => recurso.tipo === "evaluacion").length,
    0
  )
}

function formatHoras(minutes: number) {
  if (!minutes) return "1.0"
  return (minutes / 60).toFixed(1)
}

function getCursoPortadaGradient(curso: CursoData) {
  return `linear-gradient(135deg, ${curso.colorPortada || "#10b981"}, ${curso.colorPortada2 || "#059669"})`
}

function esCursoDePago(curso: CursoData) {
  return curso.acceso === "pago" && (curso.precio || 0) > 0
}

function ModalMatricula({
  curso,
  userId,
  onSuccess,
  onClose,
}: {
  curso: CursoData
  userId: string
  onSuccess: () => void
  onClose: () => void
}) {
  const [clave, setClave] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleMatricular = async () => {
    setError("")
    if (curso.acceso === "clave") {
      if (!clave.trim()) {
        setError("Ingresa la clave de matricula")
        return
      }
      if (clave.trim().toUpperCase() !== (curso.clavematricula || "").toUpperCase()) {
        setError("Clave incorrecta")
        return
      }
    }

    setLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 400))
    matricular({
      id: `mat_${Date.now()}`,
      userId,
      cursoId: curso.id,
      fechaMatricula: new Date().toISOString(),
      progreso: 0,
      completado: false,
      tipoAcceso: curso.acceso,
      montoPagado: esCursoDePago(curso) ? curso.precio || 0 : 0,
    })
    setLoading(false)
    onSuccess()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center gap-4">
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl"
            style={{ background: getCursoPortadaGradient(curso) }}
          >
            <BookOpen className="h-7 w-7 text-white" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
              {curso.acceso === "pago" ? "Compra del curso" : curso.acceso === "clave" ? "Acceso con clave" : "Matricula"}
            </div>
            <h3 className="line-clamp-2 text-lg font-bold text-foreground">{curso.titulo}</h3>
          </div>
        </div>

        <div className="mb-4 rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="mb-1 text-sm font-semibold text-foreground">
            {curso.acceso === "pago"
              ? `${Number(curso.precio || 0).toFixed(2)} US$`
              : curso.acceso === "clave"
                ? "Acceso protegido por clave"
                : "Acceso gratuito"}
          </div>
          <p className="text-sm text-muted-foreground">
            {curso.acceso === "pago"
              ? "Confirma la compra para agregar este curso a tu biblioteca."
              : curso.acceso === "clave"
                ? "Ingresa la clave para desbloquear el curso en tu dashboard."
                : "Este curso se agregara a tu dashboard inmediatamente."}
          </p>
        </div>

        {curso.acceso === "clave" ? (
          <div className="mb-4">
            <label className="mb-2 block text-sm font-semibold text-foreground">Clave de matricula</label>
            <div className="relative">
              <Key className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={clave}
                onChange={(event) => setClave(event.target.value)}
                placeholder="Ingresa la clave del curso"
                className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary/40"
              />
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="mb-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</div>
        ) : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border px-4 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary/30"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleMatricular}
            disabled={loading}
            className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 disabled:opacity-60"
          >
            {loading ? "Procesando..." : curso.acceso === "pago" ? "Comprar ahora" : "Confirmar acceso"}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function DashboardCursosPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [cursos, setCursos] = useState<CursoData[]>([])
  const [matriculados, setMatriculados] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState(() => searchParams.get("q") || "")
  const [selectedCategory, setSelectedCategory] = useState(() => searchParams.get("categoria") || "")
  const [modalCurso, setModalCurso] = useState<CursoData | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [refundOpen, setRefundOpen] = useState(false)
  const [refundReason, setRefundReason] = useState("")
  const [refundDetails, setRefundDetails] = useState("")
  const [refundSent, setRefundSent] = useState(false)
  const [userPayments, setUserPayments] = useState<PaymentRecord[]>([])
  const [userRefunds, setUserRefunds] = useState<RefundRequest[]>([])

  const userId = user?.id || ""

  useEffect(() => {
    if (!userId) return
    const sync = () => {
      setUserPayments(getPaymentsForUser(userId))
      setUserRefunds(getRefundRequestsForUser(userId))
    }
    sync()
    window.addEventListener("storage", sync)
    return () => window.removeEventListener("storage", sync)
  }, [userId])
  const requestedCourseId = searchParams.get("course") || ""

  useEffect(() => {
    const cat = searchParams.get("categoria")
    if (cat !== null) setSelectedCategory(cat)
    const q = searchParams.get("q")
    if (q !== null) setSearchQuery(q)
  }, [searchParams])

  const refreshData = useCallback(() => {
    setCursos(getCursosPublicados(userId))
    setMatriculados(getMatriculas().filter((m) => m.userId === userId).map((m) => m.cursoId))
  }, [userId])

  useEffect(() => {
    if (isLoading) return
    refreshData()
    window.addEventListener("storage", refreshData)
    window.addEventListener("focus", refreshData)
    return () => {
      window.removeEventListener("storage", refreshData)
      window.removeEventListener("focus", refreshData)
    }
  }, [isLoading, refreshData])

  const enrolledCourseIds = useMemo(() => new Set(matriculados), [matriculados])

  const categories = useMemo(() => {
    const cats = new Set(cursos.map((c) => c.categoria).filter(Boolean))
    return Array.from(cats).sort()
  }, [cursos])

  const courseCount = useMemo(() => {
    const count: Record<string, number> = { Todos: cursos.length }
    for (const course of cursos) {
      if (course.categoria) count[course.categoria] = (count[course.categoria] || 0) + 1
    }
    return count
  }, [cursos])

  const matchedCourses = useMemo(() => {
    let result = [...cursos]

    if (selectedCategory) {
      result = result.filter((c) => c.categoria === selectedCategory)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (c) =>
          c.titulo.toLowerCase().includes(query) ||
          c.descripcion.toLowerCase().includes(query) ||
          (c.subtitulo || "").toLowerCase().includes(query) ||
          c.instructor.toLowerCase().includes(query)
      )
    }

    return result
  }, [cursos, searchQuery, selectedCategory])

  const courseBuckets = useMemo(() => {
    const enrolled = matchedCourses.filter((c) => enrolledCourseIds.has(c.id))
    const discover = matchedCourses.filter((c) => !enrolledCourseIds.has(c.id))

    return {
      enrolled: enrolled.sort((a, b) => {
        const progA = getProgreso(userId, a.id)
        const progB = getProgreso(userId, b.id)
        if (progA !== progB) return progB - progA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
      discover: discover.sort((a, b) => {
        const scoreA =
          (a.destacado ? 6 : 0) +
          (a.popular ? 4 : 0) +
          (a.nuevo ? 2 : 0) +
          (a.publicarEnPaginaPrincipal !== false ? 1 : 0)
        const scoreB =
          (b.destacado ? 6 : 0) +
          (b.popular ? 4 : 0) +
          (b.nuevo ? 2 : 0) +
          (b.publicarEnPaginaPrincipal !== false ? 1 : 0)
        if (scoreA !== scoreB) return scoreB - scoreA
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }),
    }
  }, [enrolledCourseIds, matchedCourses, userId])

  const enrolledCourses = useMemo(() => {
    return courseBuckets.enrolled
  }, [courseBuckets])

  const discoverCourses = useMemo(() => {
    return courseBuckets.discover
  }, [courseBuckets])

  const visibleEnrolledCourses = enrolledCourses
  const visibleDiscoverCourses =
    discoverCourses.length === 0 && matchedCourses.length > 0 && enrolledCourses.length === 0
      ? matchedCourses
      : discoverCourses

  const selectedCourse = useMemo(
    () => cursos.find((course) => course.id === requestedCourseId) || null,
    [cursos, requestedCourseId]
  )

  const selectedCourseSimulatorCount = useMemo(() => {
    if (!selectedCourse) return 0
    const linkedInCourse = totalSimuladores(selectedCourse)
    const simuladores = getSimuladoresStorage() as SimuladorBuilder[]
    const linkedByAdmin = simuladores.filter((sim) => {
      const courseIds = Array.from(new Set([...(sim.cursoIds || []), sim.cursoId || ""])).filter(Boolean)
      return sim.estado === "publicado" && courseIds.includes(selectedCourse.id) && sim.categoria !== "evaluacion"
    }).length
    return Math.max(linkedInCourse, linkedByAdmin)
  }, [selectedCourse])

  const selectedCourseEvaluationCount = useMemo(() => {
    if (!selectedCourse) return 0
    return totalEvaluaciones(selectedCourse)
  }, [selectedCourse])

  const handleMatriculaSuccess = (cursoId: string) => {
    setModalCurso(null)
    setSuccessId(cursoId)
    refreshData()
    setTimeout(() => setSuccessId(null), 3000)
  }

  const renderCourseCard = (course: CursoData, mode: "enrolled" | "discover") => {
    const progress = getProgreso(userId, course.id)
    const lessons = totalLecciones(course)
    const gratis = course.acceso !== "pago" || (course.precio || 0) <= 0
    const totalRatings = 180 + lessons * 9
    const rating = course.destacado ? 4.9 : course.popular ? 4.8 : course.nuevo ? 4.7 : 4.6

    return (
      <CatalogCourseCard
        key={course.id}
        href={mode === "enrolled" ? `/dashboard/cursos?course=${encodeURIComponent(course.id)}` : undefined}
        curso={{
          id: course.id,
          titulo: course.titulo,
          descripcion: course.subtitulo?.trim() || course.descripcion || "Continua tu aprendizaje desde el dashboard.",
          instructor: course.instructor || "Hack Evans Academy",
          imagen: course.portadaImagen || "/placeholder.jpg",
          precio: gratis ? 0 : Number(course.precio || 0),
          precioOriginal: gratis
            ? 0
            : Number(course.precioOriginal || Math.max(Number(course.precio || 0) * 1.7, Number(course.precio || 0))),
          rating: Number(rating.toFixed(1)),
          totalRatings,
          totalHoras: formatHoras(totalMinutos(course)),
          totalClases: lessons || 1,
          nivel: course.nivel || "Todos los niveles",
          categoria: course.categoria || "General",
          bestseller: Boolean(course.destacado || course.popular),
          nuevo: Boolean(course.nuevo),
          gratis,
        }}
        metaBadges={
          mode === "discover" ? (
            <>
              {course.destacado ? (
                <span className="rounded-full border border-[#ff7b54]/25 bg-[#ff7b54]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff9d7f]">
                  Recomendado
                </span>
              ) : null}
              {course.popular ? (
                <span className="rounded-full border border-[#38bdf8]/25 bg-[#38bdf8]/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7dd3fc]">
                  Popular
                </span>
              ) : null}
            </>
          ) : null
        }
        afterMetaContent={
          mode === "enrolled" && progress > 0 ? (
            <div className="mb-3 rounded border border-[#0f5257] bg-[#06272d] px-3 py-2">
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#7cdfe4]">Tu progreso</span>
                <span className="font-bold text-[#35d6c0]">{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[#0d3d45]">
                <div className="h-full rounded-full bg-[#35d6c0]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          ) : null
        }
        footerRight={
          mode === "enrolled" ? (
            <button
              onClick={(event) => {
                event.preventDefault()
                router.push(`/dashboard/cursos?course=${encodeURIComponent(course.id)}`)
              }}
              className="flex items-center gap-1.5 border border-[#1db954] bg-transparent px-3 py-2 text-xs font-bold text-[#1db954] transition-all hover:bg-[#1db954] hover:text-black"
            >
              {progress > 0 ? "Continuar" : "Ver curso"}
            </button>
          ) : (
            <button
              onClick={(event) => {
                event.preventDefault()
                setModalCurso(course)
              }}
              className={cn(
                "flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-all",
                gratis
                  ? "border border-[#1db954] bg-transparent text-[#1db954] hover:bg-[#1db954] hover:text-black"
                  : "border border-[#a435f0] bg-transparent text-[#c084fc] hover:bg-[#a435f0] hover:text-white"
              )}
            >
              {gratis ? "Inscribirme" : course.acceso === "clave" ? "Usar clave" : "Comprar"}
            </button>
          )
        }
      />
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8 md:mb-12">
        <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">Mi aprendizaje</h1>
        <p className="text-lg text-muted-foreground">
          Continua con tus cursos activos y descubre nuevos contenidos sin salir del dashboard
        </p>
      </div>

      {selectedCourse && enrolledCourseIds.has(selectedCourse.id) ? (
        <div className="mb-8">
          <CourseLearnView
            course={{
              id: selectedCourse.id,
              titulo: selectedCourse.titulo,
              subtitulo: selectedCourse.subtitulo,
              descripcion: selectedCourse.descripcion || "",
              instructor: selectedCourse.instructor || "Hack Evans Academy",
              nivel: selectedCourse.nivel || "Todos los niveles",
              categoria: selectedCourse.categoria || "General",
              portadaImagen: selectedCourse.portadaImagen,
              secciones: (selectedCourse.secciones || []).map((s) => ({
                id: s.id,
                titulo: s.titulo,
                recursos: s.recursos.map((r) => ({
                  id: r.id,
                  tipo: r.tipo,
                  titulo: r.titulo,
                  duracionMinutos: r.duracionMinutos,
                })),
              })),
              totalLecciones: totalLecciones(selectedCourse),
              totalHoras: ((totalMinutos(selectedCourse) || 1) / 60).toFixed(1).replace(/\.0$/, ""),
              rating: selectedCourse.destacado ? 4.9 : selectedCourse.popular ? 4.8 : selectedCourse.nuevo ? 4.7 : 4.6,
              totalRatings: 180 + totalLecciones(selectedCourse) * 9,
              estudiantes: 320 + totalLecciones(selectedCourse) * 14,
              ultimaActualizacion: new Date(selectedCourse.createdAt).toLocaleDateString("es-EC", { month: "long", year: "numeric" }),
              progreso: getProgreso(userId, selectedCourse.id),
              certificado: true,
            }}
            simulatorCount={selectedCourseSimulatorCount}
            evaluationCount={selectedCourseEvaluationCount}
            onOpenSimuladores={() => router.push(`/dashboard/simuladores?cursoId=${encodeURIComponent(selectedCourse.id)}`)}
            onOpenEvaluaciones={() => router.push(`/dashboard/evaluaciones?cursoId=${encodeURIComponent(selectedCourse.id)}`)}
            refundSlot={(() => {
              const payment = userPayments.find(
                (p) => p.status === "verified" && p.items.some((item) => item.id === selectedCourse.id),
              )
              if (!payment) return null
              const reqStatus = userRefunds.find((r) => r.paymentId === payment.id)?.status
              if (reqStatus === "pending") {
                return (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-amber-500/35 bg-amber-500/10 px-4 py-2.5 text-sm font-bold text-amber-500">
                    <Clock className="h-4 w-4" />
                    Reembolso en revisión
                  </span>
                )
              }
              const elig = getRefundEligibility(payment)
              if (!elig.eligible) {
                return (
                  <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5 text-xs font-semibold text-muted-foreground">
                    Plazo de reembolso vencido ({REFUND_WINDOW_DAYS} días)
                  </span>
                )
              }
              return (
                <button
                  type="button"
                  onClick={() => setRefundOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm font-semibold text-foreground transition-all hover:border-primary/30 hover:text-primary"
                >
                  <Undo2 className="h-4 w-4" />
                  Solicitar reembolso · {elig.daysLeft} días restantes
                </button>
              )
            })()}
          />
        </div>
      ) : null}

      {refundOpen && selectedCourse ? (() => {
        const payment = userPayments.find(
          (p) => p.status === "verified" && p.items.some((item) => item.id === selectedCourse.id),
        )
        if (!payment) return null
        const elig = getRefundEligibility(payment)
        const close = () => {
          if (refundSent) return
          setRefundOpen(false)
          setRefundReason("")
          setRefundDetails("")
        }
        const submit = () => {
          if (!refundReason.trim()) return
          createRefundRequest({ paymentId: payment.id, reason: refundReason.trim(), details: refundDetails.trim() || undefined })
          setUserRefunds(getRefundRequestsForUser(userId))
          setRefundSent(true)
          setTimeout(() => {
            setRefundSent(false)
            setRefundOpen(false)
            setRefundReason("")
            setRefundDetails("")
          }, 1500)
        }
        return (
          <>
            <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={close} />
            <div className="fixed inset-0 z-[151] flex items-center justify-center p-4">
              <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
                <div className="border-b border-border bg-gradient-to-r from-primary/8 to-transparent px-6 py-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Solicitar reembolso</p>
                  <h2 className="mt-1 text-xl font-black text-foreground">{selectedCourse.titulo}</h2>
                  <p className="mt-1 text-xs text-muted-foreground">${payment.amount.toFixed(2)} · pagado el {new Date(payment.createdAt).toLocaleDateString("es-EC")}</p>
                </div>
                {refundSent ? (
                  <div className="px-6 py-10 text-center">
                    <CheckCircle className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                    <p className="text-base font-bold text-foreground">Solicitud enviada</p>
                    <p className="mt-1 text-sm text-muted-foreground">Te avisaremos por email en cuanto el equipo decida.</p>
                  </div>
                ) : (
                  <div className="space-y-4 px-6 py-5">
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs leading-relaxed text-amber-600">
                      Política: aprobamos reembolsos dentro de {REFUND_WINDOW_DAYS} días posteriores a la compra. Te quedan <strong>{elig.daysLeft} días</strong>. El monto se acreditará como saldo en tu cuenta.
                    </p>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Motivo principal</label>
                      <select
                        value={refundReason}
                        onChange={(event) => setRefundReason(event.target.value)}
                        className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                      >
                        <option value="">Selecciona un motivo</option>
                        <option value="No es lo que esperaba">No es lo que esperaba</option>
                        <option value="Compré por error">Compré por error</option>
                        <option value="Problema técnico">Problema técnico</option>
                        <option value="Calidad insuficiente">Calidad insuficiente</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Detalles (opcional)</label>
                      <textarea
                        value={refundDetails}
                        onChange={(event) => setRefundDetails(event.target.value)}
                        rows={3}
                        placeholder="Cuéntanos qué pasó para procesar más rápido..."
                        className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={close} className="flex-1 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40">Cancelar</button>
                      <button onClick={submit} disabled={!refundReason} className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)] disabled:opacity-50">Enviar solicitud</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )
      })() : null}

      {selectedCourse && enrolledCourseIds.has(selectedCourse.id) ? null : (
      <div className="mb-8 flex flex-col gap-4 md:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Busca por titulo, instructor o tema..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            className="w-full rounded-lg border border-border bg-card py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>
      )}

      {selectedCourse && enrolledCourseIds.has(selectedCourse.id) ? null : (<>
      {categories.length > 0 ? (
        <div className="mb-8">
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            courseCount={courseCount}
          />
        </div>
      ) : null}

      <div className="mb-6">
        <p className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{visibleEnrolledCourses.length}</span> en tu aprendizaje
          <span className="mx-2 text-muted-foreground/50">·</span>
          <span className="font-semibold text-foreground">{visibleDiscoverCourses.length}</span> para explorar
        </p>
      </div>

      {matchedCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Search className="mb-4 h-16 w-16 text-muted-foreground/40" />
          <h3 className="mb-2 text-xl font-bold text-foreground">No encontramos cursos</h3>
          <p className="text-muted-foreground">Prueba otra busqueda o cambia la categoria.</p>
        </div>
      ) : (
        <>
          <section className="mb-10">
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Tus cursos</h2>
                <p className="text-sm text-muted-foreground">
                {visibleEnrolledCourses.length > 0
                  ? "Aqui ves lo que ya compraste, desbloqueaste o matriculaste."
                  : "Todavia no tienes cursos activos. Debajo te dejamos opciones para empezar."}
              </p>
            </div>
            {visibleEnrolledCourses.length > 0 ? (
              <div className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
                {visibleEnrolledCourses.length} activos
              </div>
            ) : null}
          </div>

            {visibleEnrolledCourses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleEnrolledCourses.map((course) => renderCourseCard(course, "enrolled"))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
                <BookOpen className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="mb-2 text-lg font-bold text-foreground">Tu biblioteca todavia esta vacia</h3>
                <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                  Usa la seccion Explorar mas para inscribirte gratis, comprar cursos premium o entrar con clave.
                </p>
              </div>
            )}
          </section>

          <section>
            <div className="mb-5 flex items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Explorar mas</h2>
                <p className="text-sm text-muted-foreground">
                  Cursos publicados que puedes empezar ahora mismo desde el dashboard con una logica tipo biblioteca activa.
                </p>
              </div>
              {visibleDiscoverCourses.length > 0 ? (
                <Link
                  href="/cursos"
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-foreground"
                >
                  Ver catalogo completo
                </Link>
              ) : null}
            </div>

            {visibleDiscoverCourses.length > 0 ? (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {visibleDiscoverCourses.map((course) => renderCourseCard(course, "discover"))}
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-10 text-center">
                <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/40" />
                <h3 className="mb-2 text-lg font-bold text-foreground">No hay mas cursos por mostrar</h3>
                <p className="mx-auto max-w-xl text-sm text-muted-foreground">
                  Ya tienes todos los cursos visibles de esta categoria o tu busqueda es demasiado especifica.
                </p>
              </div>
            )}
          </section>
        </>
      )}
      </>)}

      {modalCurso ? (
        <ModalMatricula
          curso={modalCurso}
          userId={userId}
          onSuccess={() => handleMatriculaSuccess(modalCurso.id)}
          onClose={() => setModalCurso(null)}
        />
      ) : null}

      {successId ? (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-500/30 bg-card px-5 py-3 shadow-2xl">
          <CheckCircle className="h-5 w-5 shrink-0 text-emerald-400" />
          <span className="text-sm font-semibold text-foreground">Matriculado con exito</span>
        </div>
      ) : null}
    </div>
  )
}
