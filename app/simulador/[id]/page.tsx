"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Play,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { SimuladorBuilder } from "@/simuladores/types"
import { getResultadosPorSimulador, getSimuladorById, guardarResultado } from "@/simuladores/storage"
import {
  getMineducOptions,
  loadMineducIndex,
  type MineducIndex,
  type MineducSelection,
} from "@/lib/mineduc"

type ResultadoSimulador = {
  id: string
  simuladorId: string
  fecha: string
  puntaje: number
  total: number
  porcentaje: number
  duracionSegundos: number
  formulario: Record<string, string>
}

type QuestionView = {
  id: string
  pregunta: string
  opciones: string[]
  respuestaCorrecta: number
}

function shuffleArray<T>(array: T[]) {
  const copy = [...array]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function SimuladorPage() {
  const params = useParams()
  const router = useRouter()
  const simuladorId = Array.isArray(params.id) ? params.id[0] : params.id
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [simulador, setSimulador] = useState<SimuladorBuilder | null>(null)
  const [loading, setLoading] = useState(true)
  const [started, setStarted] = useState(false)
  const [finished, setFinished] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [questionSet, setQuestionSet] = useState<QuestionView[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [startAt, setStartAt] = useState<number | null>(null)
  const [resultado, setResultado] = useState<ResultadoSimulador | null>(null)
  const [formValues, setFormValues] = useState<Record<string, string>>({})
  const [mineducIndex, setMineducIndex] = useState<MineducIndex | null>(null)
  const [mineducLoading, setMineducLoading] = useState(false)
  const [intentos, setIntentos] = useState<ResultadoSimulador[]>([])
  const [now, setNow] = useState(() => Date.now())
  const [iframeHeight, setIframeHeight] = useState(980)

  useEffect(() => {
    if (!simuladorId || typeof window === "undefined") return
    const found = getSimuladorById(String(simuladorId))
    setSimulador(found || null)
    setLoading(false)
    if (found) {
      setAnswers(Array(found.preguntas.length).fill(null))
      const initial: Record<string, string> = {}
      found.formulario.forEach((campo: SimuladorBuilder["formulario"][number]) => {
        initial[campo.name] = ""
      })
      setFormValues(initial)
      setTimeLeft(found.config?.tiempoPregunta || 60)
      setIntentos(getResultadosPorSimulador(found.id))
    }
  }, [simuladorId])

  useEffect(() => {
    if (!simulador) return
    const necesitaMineduc = simulador.formulario.some((campo) => campo.optionsSource === "mineduc")
    if (!necesitaMineduc) return
    let activo = true
    setMineducLoading(true)
    loadMineducIndex()
      .then((index) => {
        if (activo) {
          setMineducIndex(index)
        }
      })
      .finally(() => {
        if (activo) {
          setMineducLoading(false)
        }
      })
    return () => {
      activo = false
    }
  }, [simulador])

  useEffect(() => {
    if (!simulador) return
    const interval = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(interval)
  }, [simulador?.id, intentos.length])

  const recalcIframeHeight = useCallback(() => {
    const frame = iframeRef.current
    if (!frame) return

    try {
      const doc = frame.contentDocument || frame.contentWindow?.document
      if (!doc) return
      const bodyHeight = doc.body?.scrollHeight || 0
      const docHeight = doc.documentElement?.scrollHeight || 0
      const viewportHeight = typeof window !== "undefined" ? window.innerHeight : 900
      // Use the larger of the content height or viewport so page scrolls naturally
      // without producing a second scroll inside the iframe.
      setIframeHeight(Math.max(bodyHeight, docHeight, viewportHeight))
    } catch {
      if (typeof window !== "undefined") {
        setIframeHeight(window.innerHeight)
      }
    }
  }, [])

  useEffect(() => {
    if (simulador?.contentMode !== "html") return
    window.addEventListener("resize", recalcIframeHeight)
    return () => window.removeEventListener("resize", recalcIframeHeight)
  }, [recalcIframeHeight, simulador?.contentMode])

  const intentosMax = simulador?.config?.intentosMax ?? 3
  const cooldownMinutos = simulador?.config?.cooldownMinutos ?? 30
  const intentosUsados = intentos.length
  const intentosRestantes = Math.max(intentosMax - intentosUsados, 0)
  const ultimoIntento = intentos[intentos.length - 1]
  const cooldownRestanteSeg = ultimoIntento
    ? Math.max(
        0,
        Math.ceil((cooldownMinutos * 60 * 1000 - (now - new Date(ultimoIntento.fecha).getTime())) / 1000)
      )
    : 0
  const puedeIniciar = intentosRestantes > 0 && cooldownRestanteSeg === 0

  const currentQuestion = questionSet[currentIndex]
  const totalQuestions = questionSet.length

  const mineducSelection = useMemo<MineducSelection>(() => {
    if (!simulador) return {}
    const selection: MineducSelection = {}
    simulador.formulario.forEach((campo) => {
      if (campo.optionsSource !== "mineduc") return
      const value = formValues[campo.name]
      if (!value) return
      if (campo.optionsKey === "provincias") {
        selection.provincia = value
      }
      if (campo.optionsKey === "cantones") {
        selection.canton = value
      }
      if (campo.optionsKey === "parroquias") {
        selection.parroquia = value
      }
    })
    return selection
  }, [simulador, formValues])

  const getCampoOptions = useCallback(
    (campo: SimuladorBuilder["formulario"][number]) => {
      if (campo.optionsSource === "mineduc") {
        if (!mineducIndex) return []
        return getMineducOptions(mineducIndex, campo.optionsKey, mineducSelection)
      }
      return campo.options || []
    },
    [mineducIndex, mineducSelection]
  )

  const finalizar = useCallback(() => {
    if (!simulador || finished) return
    const correctas = questionSet.reduce((acc, pregunta, index) => {
      return acc + (answers[index] === pregunta.respuestaCorrecta ? 1 : 0)
    }, 0)
    const total = questionSet.length
    const duracion = startAt ? Math.round((Date.now() - startAt) / 1000) : 0
    const result: ResultadoSimulador = {
      id: `res_${Date.now()}`,
      simuladorId: simulador.id,
      fecha: new Date().toISOString(),
      puntaje: correctas,
      total,
      porcentaje: total ? Math.round((correctas / total) * 100) : 0,
      duracionSegundos: duracion,
      formulario: formValues,
    }
    guardarResultado(result)
    setResultado(result)
    setIntentos((prev) => [...prev, result])
    setFinished(true)
    setStarted(false)
  }, [answers, finished, formValues, simulador, startAt, questionSet])

  const handleNext = useCallback(() => {
    if (!simulador) return
    if (currentIndex >= questionSet.length - 1) {
      finalizar()
      return
    }
    setCurrentIndex((prev) => prev + 1)
  }, [currentIndex, finalizar, simulador, questionSet.length])

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => Math.max(prev - 1, 0))
  }, [])

  useEffect(() => {
    if (!started || finished || !simulador) return
    setTimeLeft(simulador.config?.tiempoPregunta || 60)
    const interval = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1)
    }, 1000)
    return () => window.clearInterval(interval)
  }, [started, finished, currentIndex, simulador])

  useEffect(() => {
    if (!started || finished) return
    if (timeLeft <= 0) {
      handleNext()
    }
  }, [timeLeft, started, finished, handleNext])

  const iniciarSimulador = () => {
    if (!simulador || !puedeIniciar) return
    const maxPreguntas = simulador.config?.preguntasMax ?? simulador.preguntas.length
    const preguntasBase = shuffleArray(simulador.preguntas).slice(0, maxPreguntas)
    const preguntasRandom = preguntasBase.map((pregunta) => {
      const opcionesConIndex = pregunta.opciones.map((texto, index) => ({ texto, index }))
      const opcionesShuffle = shuffleArray(opcionesConIndex)
      const respuestaCorrecta = opcionesShuffle.findIndex((op) => op.index === pregunta.respuesta)
      return {
        id: pregunta.id,
        pregunta: pregunta.pregunta,
        opciones: opcionesShuffle.map((op) => op.texto),
        respuestaCorrecta,
      }
    })
    setStarted(true)
    setFinished(false)
    setCurrentIndex(0)
    setQuestionSet(preguntasRandom)
    setAnswers(Array(preguntasRandom.length).fill(null))
    setTimeLeft(simulador.config?.tiempoPregunta || 60)
    setStartAt(Date.now())
    setResultado(null)
  }

  const handleAnswer = (index: number) => {
    setAnswers((prev) => {
      const next = [...prev]
      next[currentIndex] = index
      return next
    })
  }

  const progreso = useMemo(() => {
    if (!totalQuestions) return 0
    return Math.round(((currentIndex + 1) / totalQuestions) * 100)
  }, [currentIndex, totalQuestions])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Cargando simulador...</div>
  }

  if (!simulador) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center">
        <div className="text-2xl font-semibold text-foreground">Simulador no encontrado</div>
        <Link href="/dashboard" className="text-sm text-primary hover:underline">
          Volver al dashboard
        </Link>
      </div>
    )
  }

  const htmlImportado = simulador.contentMode === "html" ? String(simulador.htmlContent || "") : ""

  if (simulador.contentMode === "html") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <div className="sticky top-0 z-30 flex items-center justify-between gap-4 border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-md md:px-6">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => {
                if (window.history.length > 1) router.back()
                else router.push("/dashboard/simuladores")
              }}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:bg-secondary/40 hover:text-primary"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Volver
            </button>
            <div className="hidden h-5 w-px bg-border sm:block" />
            <div className="min-w-0">
              <div className="truncate text-sm font-bold text-foreground">{simulador.titulo}</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-primary">Hack Evans</div>
            </div>
          </div>
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground sm:flex">
            <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
            HTML completo
          </div>
        </div>

        {!htmlImportado.trim() ? (
          <div className="mx-auto max-w-3xl px-4 py-12">
            <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-sm text-muted-foreground">
              Este simulador aún no tiene HTML importado.
            </div>
          </div>
        ) : (
          <iframe
            ref={iframeRef}
            title={simulador.titulo || simulador.id}
            srcDoc={htmlImportado}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
            onLoad={() => {
              recalcIframeHeight()
              window.setTimeout(recalcIframeHeight, 120)
              window.setTimeout(recalcIframeHeight, 500)
              window.setTimeout(recalcIframeHeight, 1200)
            }}
            style={{ height: `${iframeHeight}px`, display: "block" }}
            className="w-full border-0"
            scrolling="no"
          />
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-5xl px-4 py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Hack Evans</div>
            <h1 className="font-display text-3xl">{simulador.titulo}</h1>
            <p className="text-sm text-muted-foreground">{simulador.descripcion}</p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
              <Clock className="h-4 w-4 text-primary" />
              {simulador.config?.tiempoPregunta || 60}s / pregunta
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border px-3 py-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              {simulador.preguntas.length} preguntas
            </div>
          </div>
        </div>

        {!started && !finished && (
          <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="text-sm font-semibold text-foreground">Formulario inicial</div>
              {simulador.formMode === "perfil" ? (
                <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                  Este simulador usara tu perfil guardado. Puedes iniciar directamente.
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {simulador.formulario.map((campo) => {
                    const esMineduc = campo.optionsSource === "mineduc"
                    const opciones = getCampoOptions(campo)
                    const cargando = esMineduc && (mineducLoading || !mineducIndex)
                    return (
                      <div key={campo.id} className="flex flex-col gap-1">
                        <label className="text-xs text-muted-foreground">{campo.label}</label>
                        {campo.type === "select" ? (
                          <select
                            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                            value={formValues[campo.name] || ""}
                            disabled={cargando}
                            onChange={(event) =>
                              setFormValues((prev) => ({ ...prev, [campo.name]: event.target.value }))
                            }
                          >
                            <option value="">
                              {cargando ? "Cargando opciones..." : "Selecciona una opcion"}
                            </option>
                            {opciones.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        ) : campo.type === "radio" ? (
                          <div className="space-y-2 rounded-md border border-border bg-secondary/30 px-3 py-2">
                            {opciones.length === 0 ? (
                              <div className="text-xs text-muted-foreground">
                                {cargando ? "Cargando opciones..." : "Sin opciones disponibles."}
                              </div>
                            ) : (
                              opciones.map((option) => (
                                <label key={option} className="flex items-center gap-2 text-sm">
                                  <input
                                    type="radio"
                                    name={campo.name}
                                    value={option}
                                    checked={formValues[campo.name] === option}
                                    onChange={(event) =>
                                      setFormValues((prev) => ({ ...prev, [campo.name]: event.target.value }))
                                    }
                                  />
                                  {option}
                                </label>
                              ))
                            )}
                          </div>
                        ) : (
                          <input
                            className="h-10 rounded-md border border-border bg-card px-3 text-sm"
                            value={formValues[campo.name] || ""}
                            onChange={(event) =>
                              setFormValues((prev) => ({ ...prev, [campo.name]: event.target.value }))
                            }
                            placeholder={campo.label}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="text-sm font-semibold text-foreground">Listo para iniciar</div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground">
                Responde cada pregunta dentro del tiempo asignado. Podras revisar al final si el simulador lo permite.
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-sm text-muted-foreground space-y-2">
                <div className="flex items-center justify-between">
                  <span>Intentos restantes</span>
                  <span className="font-semibold text-foreground">{intentosRestantes}</span>
                </div>
                {cooldownRestanteSeg > 0 ? (
                  <div className="flex items-center justify-between">
                    <span>Cooldown activo</span>
                    <span className="font-semibold text-foreground">
                      {Math.ceil(cooldownRestanteSeg / 60)} min
                    </span>
                  </div>
                ) : null}
              </div>
              <button
                onClick={iniciarSimulador}
                disabled={!puedeIniciar}
                className={cn(
                  "inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-colors",
                  puedeIniciar
                    ? "bg-primary text-white hover:bg-[#ff4433]"
                    : "bg-secondary text-muted-foreground cursor-not-allowed"
                )}
              >
                <Play className="h-4 w-4" />
                {puedeIniciar ? "Iniciar simulador" : "Intento no disponible"}
              </button>
            </div>
          </div>
        )}

        {started && currentQuestion && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="text-sm text-muted-foreground">
                Pregunta {currentIndex + 1} de {totalQuestions}
              </div>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Clock className="h-4 w-4" />
                {timeLeft}s
              </div>
            </div>
            <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${progreso}%` }} />
            </div>
            <div className="text-lg font-semibold text-foreground">{currentQuestion.pregunta}</div>
            <div className="grid gap-3">
              {currentQuestion.opciones.map((opcion, index) => (
                <button
                  key={`${currentQuestion.id}-${index}`}
                  onClick={() => handleAnswer(index)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                    answers[currentIndex] === index
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-foreground hover:border-primary/40"
                  )}
                >
                  {opcion || `Opcion ${index + 1}`}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
                Anterior
              </button>
              <div className="flex gap-2">
                <button
                  onClick={finalizar}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
                >
                  <Flag className="h-4 w-4" />
                  Finalizar
                </button>
                <button
                  onClick={handleNext}
                  className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-[#ff4433]"
                >
                  Siguiente
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}

        {finished && resultado && (
          <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
            <div className="text-sm font-semibold text-foreground">Resultados del simulador</div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{resultado.puntaje}</div>
                <div className="text-xs text-muted-foreground">Respuestas correctas</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{resultado.porcentaje}%</div>
                <div className="text-xs text-muted-foreground">Promedio</div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/40 p-4 text-center">
                <div className="text-2xl font-bold text-foreground">{resultado.duracionSegundos}s</div>
                <div className="text-xs text-muted-foreground">Tiempo total</div>
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Link href="/dashboard" className="text-sm text-primary hover:underline">
                Volver al dashboard
              </Link>
              <button
                onClick={iniciarSimulador}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary"
              >
                Intentar de nuevo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
