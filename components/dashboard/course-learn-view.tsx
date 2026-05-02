"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import {
  Award,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  ClipboardCheck,
  FileText,
  Headphones,
  Link2,
  MessageSquare,
  PenLine,
  Play,
  Send,
  Share2,
  Star,
  Target,
  Trash2,
  Undo2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  COURSE_FEEDBACK_EVENT,
  addNote,
  createQAThread,
  deleteNote,
  getAnnouncementsForCourse,
  getNotesForCourse,
  getQAForCourse,
  getReviewsForCourse,
  getUserReview,
  replyQAThread,
  upsertReview,
  type Announcement,
  type CourseNote,
  type CourseReview,
  type QAThread,
} from "@/lib/course-feedback"

export type LearnResource = {
  id: string
  tipo: "video" | "documento" | "enlace" | "simulador" | "evaluacion" | "texto"
  titulo: string
  duracionMinutos?: number
}

export type LearnSection = {
  id: string
  titulo: string
  recursos: LearnResource[]
}

export type LearnCourseData = {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  nivel: string
  categoria: string
  portadaImagen?: string
  secciones: LearnSection[]
  totalLecciones: number
  totalHoras: string
  rating: number
  totalRatings: number
  estudiantes: number
  ultimaActualizacion: string
  progreso: number
  certificado: boolean
}

type Tab = "descripcion" | "preguntas" | "notas" | "anuncios" | "reseñas"

const TABS: { key: Tab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "descripcion", label: "Descripción general", icon: BookOpen },
  { key: "preguntas", label: "Preguntas y respuestas", icon: MessageSquare },
  { key: "notas", label: "Notas", icon: PenLine },
  { key: "anuncios", label: "Anuncios", icon: Headphones },
  { key: "reseñas", label: "Reseñas", icon: Star },
]

function resourceIcon(tipo: LearnResource["tipo"]) {
  switch (tipo) {
    case "video":
      return <Play className="h-3.5 w-3.5" />
    case "documento":
      return <FileText className="h-3.5 w-3.5" />
    case "enlace":
      return <Link2 className="h-3.5 w-3.5" />
    case "simulador":
      return <Target className="h-3.5 w-3.5" />
    case "evaluacion":
      return <ClipboardCheck className="h-3.5 w-3.5" />
    default:
      return <BookOpen className="h-3.5 w-3.5" />
  }
}

function formatMin(m?: number) {
  if (!m || m <= 0) return "—"
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  const min = m % 60
  return min === 0 ? `${h} h` : `${h} h ${min} min`
}

export default function CourseLearnView({
  course,
  refundSlot,
  simulatorCount,
  evaluationCount,
  onOpenSimuladores,
  onOpenEvaluaciones,
}: {
  course: LearnCourseData
  refundSlot?: React.ReactNode
  simulatorCount: number
  evaluationCount: number
  onOpenSimuladores: () => void
  onOpenEvaluaciones: () => void
}) {
  const { user } = useAuth()
  const [tab, setTab] = useState<Tab>("descripcion")
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState<Set<string>>(new Set())
  const [activeLesson, setActiveLesson] = useState<LearnResource | null>(() => {
    return course.secciones[0]?.recursos[0] || null
  })

  const [qaThreads, setQaThreads] = useState<QAThread[]>([])
  const [notes, setNotes] = useState<CourseNote[]>([])
  const [reviews, setReviews] = useState<CourseReview[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [qaTitle, setQaTitle] = useState("")
  const [qaBody, setQaBody] = useState("")
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({})
  const [noteDraft, setNoteDraft] = useState("")
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewBody, setReviewBody] = useState("")

  useEffect(() => {
    const sync = () => {
      setQaThreads(getQAForCourse(course.id))
      setReviews(getReviewsForCourse(course.id))
      setAnnouncements(getAnnouncementsForCourse(course.id))
      if (user) setNotes(getNotesForCourse(course.id, user.id))
    }
    sync()
    if (typeof window !== "undefined") {
      window.addEventListener(COURSE_FEEDBACK_EVENT, sync)
      window.addEventListener("storage", sync)
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener(COURSE_FEEDBACK_EVENT, sync)
        window.removeEventListener("storage", sync)
      }
    }
  }, [course.id, user])

  useEffect(() => {
    if (!user) return
    const existing = getUserReview(course.id, user.id)
    if (existing) {
      setReviewRating(existing.rating)
      setReviewBody(existing.body)
    }
  }, [course.id, user])

  const totalCompleted = completed.size
  const completedRatio = course.totalLecciones > 0 ? Math.round((totalCompleted / course.totalLecciones) * 100) : 0

  const toggleSection = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))
  const toggleLesson = (id: string) =>
    setCompleted((cur) => {
      const next = new Set(cur)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })

  const computedRating = course.rating || 4.7

  const overview = useMemo(
    () => course.descripcion || course.subtitulo || "Sin descripción registrada para este curso.",
    [course.descripcion, course.subtitulo],
  )

  return (
    <div className="space-y-0 rounded-2xl border border-border bg-card overflow-hidden">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/20 px-5 py-3">
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Aprendiendo</p>
          <h1 className="mt-0.5 truncate text-base font-black text-foreground sm:text-lg">{course.titulo}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold text-muted-foreground hover:border-primary/40 hover:text-foreground">
            <Star className="h-3.5 w-3.5" />
            Deja una calificación
          </button>
          {course.certificado ? (
            <button className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-bold text-amber-500">
              <Award className="h-3.5 w-3.5" />
              Certificado
            </button>
          ) : null}
          <button className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-black text-white">
            <Share2 className="h-3.5 w-3.5" />
            Compartir
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px]">
        {/* Player + tabs + details */}
        <div className="border-r border-border">
          <div className="relative aspect-video bg-black">
            {course.portadaImagen ? (
              <Image src={course.portadaImagen} alt={course.titulo} fill className="object-cover opacity-70" />
            ) : null}
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="flex h-20 w-20 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition-transform hover:scale-105">
                <Play className="h-9 w-9 fill-white" />
              </button>
            </div>
            {activeLesson ? (
              <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-5 py-3 text-white">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{activeLesson.titulo}</p>
                  <p className="text-[11px] text-white/70">{formatMin(activeLesson.duracionMinutos)}</p>
                </div>
                <span className="rounded-full border border-white/20 bg-black/30 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white backdrop-blur">
                  {activeLesson.tipo}
                </span>
              </div>
            ) : null}
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1 border-b border-border bg-card px-3">
            {TABS.map((entry) => (
              <button
                key={entry.key}
                onClick={() => setTab(entry.key)}
                className={cn(
                  "relative flex items-center gap-2 px-4 py-3 text-sm font-bold transition-colors",
                  tab === entry.key ? "text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                <entry.icon className="h-4 w-4" />
                {entry.label}
                {tab === entry.key ? (
                  <span className="absolute inset-x-2 bottom-0 h-[2px] rounded-full bg-primary" />
                ) : null}
              </button>
            ))}
          </div>

          <div className="px-6 py-6">
            {tab === "descripcion" ? (
              <div className="space-y-6">
                <div>
                  <h2 className="text-2xl font-black text-foreground">{course.titulo}</h2>
                  {course.subtitulo ? (
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{course.subtitulo}</p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-border pb-5">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-amber-500">{computedRating.toFixed(1)}</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <Star
                          key={i}
                          size={14}
                          className={
                            i <= Math.round(computedRating)
                              ? "fill-amber-500 text-amber-500"
                              : "fill-muted text-muted"
                          }
                        />
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{course.totalRatings.toLocaleString()} calificaciones</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-black text-foreground">{course.estudiantes.toLocaleString()}</span>
                    <span className="ml-1 text-xs text-muted-foreground">Estudiantes</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-black text-foreground">{course.totalHoras} h</span>
                    <span className="ml-1 text-xs text-muted-foreground">Total</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Última actualización {course.ultimaActualizacion}
                  </div>
                </div>

                <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
                  <div className="flex items-start gap-3">
                    <Clock className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-foreground">Programa un tiempo de aprendizaje</p>
                      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                        Aprender un poco cada día marca la diferencia. Reserva un horario fijo y recibe recordatorios para mantener el ritmo de tus clases.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-full border border-primary bg-card px-4 py-1.5 text-xs font-black text-primary hover:bg-primary hover:text-white">
                          Empezar
                        </button>
                        <button className="rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground">
                          Descartar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-base font-black text-foreground">Por cifras</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                    <Stat label="Nivel" value={course.nivel || "Todos los niveles"} />
                    <Stat label="Estudiantes" value={course.estudiantes.toLocaleString()} />
                    <Stat label="Idioma" value="Español" />
                    <Stat label="Clases" value={String(course.totalLecciones)} />
                    <Stat label="Vídeo" value={`${course.totalHoras} h en total`} />
                    <Stat label="Subtítulos" value="Sí" />
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-black text-foreground">Certificados</p>
                      <p className="text-xs text-muted-foreground">
                        Consigue el certificado de Hack Evans al completar todo el curso.
                      </p>
                    </div>
                    <button className="rounded-full border border-primary bg-card px-5 py-2 text-xs font-black text-primary hover:bg-primary hover:text-white">
                      Certificado de Hack Evans
                    </button>
                  </div>
                </div>

                <div className="border-t border-border pt-5">
                  <h3 className="mb-3 text-base font-black text-foreground">Descripción</h3>
                  <p className="whitespace-pre-line text-sm leading-7 text-muted-foreground">{overview}</p>
                </div>

                <div className="flex flex-wrap gap-3 border-t border-border pt-5">
                  <button
                    onClick={onOpenSimuladores}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white"
                  >
                    <Target className="h-4 w-4" />
                    Ver simuladores ({simulatorCount})
                  </button>
                  <button
                    onClick={onOpenEvaluaciones}
                    className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/20 px-4 py-2.5 text-sm font-semibold text-foreground hover:border-primary/30 hover:text-primary"
                  >
                    <Award className="h-4 w-4" />
                    Ver evaluaciones ({evaluationCount})
                  </button>
                  {refundSlot}
                </div>
              </div>
            ) : null}

            {tab === "preguntas" ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-sm font-bold text-foreground">Hacer una pregunta nueva</p>
                  <input
                    value={qaTitle}
                    onChange={(e) => setQaTitle(e.target.value)}
                    placeholder="Título de la pregunta"
                    className="mb-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <textarea
                    value={qaBody}
                    onChange={(e) => setQaBody(e.target.value)}
                    rows={3}
                    placeholder="Describe tu duda con detalle..."
                    className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (!user || !qaTitle.trim() || !qaBody.trim()) return
                      createQAThread({
                        courseId: course.id,
                        userId: user.id,
                        userName: user.name,
                        title: qaTitle.trim(),
                        body: qaBody.trim(),
                      })
                      setQaTitle("")
                      setQaBody("")
                    }}
                    disabled={!qaTitle.trim() || !qaBody.trim()}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publicar pregunta
                  </button>
                </div>

                {qaThreads.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center text-sm text-muted-foreground">
                    Aún no hay preguntas. Sé el primero en preguntar.
                  </div>
                ) : (
                  qaThreads.map((thread) => (
                    <div key={thread.id} className="rounded-xl border border-border bg-card p-4">
                      <p className="text-xs text-muted-foreground">{thread.userName} · {new Date(thread.createdAt).toLocaleString("es-EC")}</p>
                      <h4 className="mt-1 text-sm font-black text-foreground">{thread.title}</h4>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{thread.body}</p>
                      {thread.replies.length > 0 ? (
                        <div className="mt-3 space-y-2 border-l-2 border-primary/30 pl-3">
                          {thread.replies.map((reply) => (
                            <div key={reply.id} className="rounded-lg bg-secondary/15 p-3">
                              <p className="text-[11px] text-muted-foreground">
                                <span className={cn("font-bold", reply.authorRole === "admin" ? "text-primary" : "text-foreground")}>
                                  {reply.authorName}
                                </span>
                                {reply.authorRole === "admin" ? <span className="ml-2 rounded-full bg-primary/15 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary">Instructor</span> : null}
                                <span className="ml-2">{new Date(reply.createdAt).toLocaleString("es-EC")}</span>
                              </p>
                              <p className="mt-1 text-sm text-foreground">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      ) : null}
                      <div className="mt-3 flex gap-2">
                        <input
                          value={replyDraft[thread.id] || ""}
                          onChange={(e) => setReplyDraft((cur) => ({ ...cur, [thread.id]: e.target.value }))}
                          placeholder="Escribe una respuesta..."
                          className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs outline-none focus:border-primary"
                        />
                        <button
                          onClick={() => {
                            const body = (replyDraft[thread.id] || "").trim()
                            if (!body || !user) return
                            replyQAThread({
                              threadId: thread.id,
                              authorId: user.id,
                              authorName: user.name,
                              authorRole: user.role === "admin" ? "admin" : "user",
                              body,
                            })
                            setReplyDraft((cur) => ({ ...cur, [thread.id]: "" }))
                          }}
                          className="rounded-lg bg-primary px-3 py-1.5 text-xs font-black text-white"
                        >
                          Responder
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === "notas" ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-sm font-bold text-foreground">
                    {activeLesson ? `Nota para "${activeLesson.titulo}"` : "Escribe una nota"}
                  </p>
                  <textarea
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    rows={5}
                    placeholder="Tus apuntes se guardan en tu cuenta y son privados."
                    className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (!user || !noteDraft.trim()) return
                      addNote({
                        courseId: course.id,
                        userId: user.id,
                        body: noteDraft.trim(),
                        lessonId: activeLesson?.id,
                      })
                      setNoteDraft("")
                    }}
                    disabled={!noteDraft.trim()}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    <PenLine className="h-3.5 w-3.5" />
                    Guardar nota
                  </button>
                </div>

                {notes.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center text-sm text-muted-foreground">
                    Aún no tienes notas en este curso.
                  </div>
                ) : (
                  notes.map((note) => {
                    const lesson = course.secciones
                      .flatMap((s) => s.recursos)
                      .find((r) => r.id === note.lessonId)
                    return (
                      <div key={note.id} className="rounded-xl border border-border bg-card p-3">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[11px] text-muted-foreground">
                            {new Date(note.createdAt).toLocaleString("es-EC")}
                            {lesson ? ` · ${lesson.titulo}` : ""}
                          </p>
                          <button
                            onClick={() => deleteNote(note.id)}
                            className="rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="mt-1.5 whitespace-pre-line text-sm text-foreground">{note.body}</p>
                      </div>
                    )
                  })
                )}
              </div>
            ) : null}

            {tab === "anuncios" ? (
              <div className="space-y-3">
                {announcements.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-10 text-center">
                    <Headphones className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                    <p className="text-base font-bold text-foreground">Sin anuncios recientes</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      El instructor publicará anuncios desde el panel administrativo.
                    </p>
                  </div>
                ) : (
                  announcements.map((a) => (
                    <div key={a.id} className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                      <p className="text-[11px] uppercase tracking-[0.16em] text-primary">{a.authorName} · {new Date(a.createdAt).toLocaleString("es-EC")}</p>
                      <h4 className="mt-1 text-base font-black text-foreground">{a.title}</h4>
                      <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{a.body}</p>
                    </div>
                  ))
                )}
              </div>
            ) : null}

            {tab === "reseñas" ? (
              <div className="space-y-5">
                <div className="rounded-xl border border-border bg-card p-4">
                  <p className="mb-2 text-sm font-bold text-foreground">Tu reseña</p>
                  <div className="mb-3 flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <button
                        key={i}
                        onClick={() => setReviewRating(i)}
                        className="p-1"
                      >
                        <Star
                          size={22}
                          className={i <= reviewRating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}
                        />
                      </button>
                    ))}
                    <span className="ml-2 text-sm font-bold text-foreground">{reviewRating}/5</span>
                  </div>
                  <textarea
                    value={reviewBody}
                    onChange={(e) => setReviewBody(e.target.value)}
                    rows={4}
                    placeholder="¿Qué te pareció el curso?"
                    className="w-full resize-y rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => {
                      if (!user || !reviewBody.trim()) return
                      upsertReview({
                        courseId: course.id,
                        userId: user.id,
                        userName: user.name,
                        rating: reviewRating,
                        body: reviewBody.trim(),
                      })
                    }}
                    disabled={!reviewBody.trim()}
                    className="mt-3 inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    <Star className="h-3.5 w-3.5" />
                    Publicar reseña
                  </button>
                </div>

                {reviews.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center text-sm text-muted-foreground">
                    Aún no hay reseñas públicas.
                  </div>
                ) : (
                  reviews.map((r) => (
                    <div key={r.id} className="rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-bold text-foreground">{r.userName}</p>
                        <p className="text-[11px] text-muted-foreground">{new Date(r.createdAt).toLocaleDateString("es-EC")}</p>
                      </div>
                      <div className="mt-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Star
                            key={i}
                            size={12}
                            className={i <= r.rating ? "fill-amber-500 text-amber-500" : "fill-muted text-muted"}
                          />
                        ))}
                      </div>
                      <p className="mt-2 text-sm leading-relaxed text-foreground">{r.body}</p>
                    </div>
                  ))
                )}
              </div>
            ) : null}
          </div>
        </div>

        {/* Curriculum sidebar */}
        <aside className="bg-card">
          <div className="sticky top-0 border-b border-border bg-card px-5 py-4">
            <h2 className="text-sm font-black text-foreground">Contenido del curso</h2>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                {totalCompleted} / {course.totalLecciones} clases
              </span>
              <span className="font-bold text-primary">{completedRatio}%</span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-secondary/40">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${completedRatio}%` }} />
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto">
            {course.secciones.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-muted-foreground">
                Este curso aún no tiene secciones publicadas.
              </div>
            ) : (
              course.secciones.map((section, idx) => {
                const isCollapsed = collapsed[section.id]
                const sectionCompleted = section.recursos.filter((r) => completed.has(r.id)).length
                const totalMin = section.recursos.reduce((s, r) => s + (r.duracionMinutos || 0), 0)
                return (
                  <div key={section.id} className="border-b border-border">
                    <button
                      onClick={() => toggleSection(section.id)}
                      className="flex w-full items-start justify-between gap-3 px-5 py-3 text-left hover:bg-secondary/20"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-black text-foreground">
                          Sección {idx + 1}: {section.titulo}
                        </p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {sectionCompleted} / {section.recursos.length} | {formatMin(totalMin)}
                        </p>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      ) : (
                        <ChevronUp className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                    </button>

                    {!isCollapsed ? (
                      <div className="bg-background/40">
                        {section.recursos.length === 0 ? (
                          <div className="px-5 py-3 text-xs text-muted-foreground italic">
                            Sin recursos en esta sección.
                          </div>
                        ) : (
                          section.recursos.map((res, ridx) => {
                            const done = completed.has(res.id)
                            const active = activeLesson?.id === res.id
                            return (
                              <button
                                key={res.id}
                                onClick={() => setActiveLesson(res)}
                                className={cn(
                                  "flex w-full items-start gap-3 px-5 py-2.5 text-left transition-colors hover:bg-secondary/30",
                                  active && "bg-primary/10",
                                )}
                              >
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    toggleLesson(res.id)
                                  }}
                                  className={cn(
                                    "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                                    done
                                      ? "border-primary bg-primary text-white"
                                      : "border-muted-foreground/40 bg-card",
                                  )}
                                >
                                  {done ? <Check className="h-3 w-3" /> : null}
                                </button>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={cn(
                                      "text-xs leading-snug",
                                      active ? "font-bold text-foreground" : "text-foreground/85",
                                    )}
                                  >
                                    {idx + 1}.{ridx + 1} · {res.titulo}
                                  </p>
                                  <div className="mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground">
                                    {resourceIcon(res.tipo)}
                                    <span>{formatMin(res.duracionMinutos)}</span>
                                  </div>
                                </div>
                              </button>
                            )
                          })
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })
            )}
          </div>

          <div className="border-t border-border px-5 py-3">
            <Link
              href="/dashboard/cursos"
              className="block text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary"
            >
              ← Volver a Mi aprendizaje
            </Link>
          </div>
        </aside>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-sm font-bold text-foreground">{value}</div>
    </div>
  )
}
