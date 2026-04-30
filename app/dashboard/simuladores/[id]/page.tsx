"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, Clock, Target, ChevronRight, ChevronLeft,
  CheckCircle2, XCircle, Flag, Pause, Play, RotateCcw,
  Award, Star, TrendingUp, Home
} from "lucide-react"
import { cn } from "@/lib/utils"

const QUESTIONS = [
  {
    id: 1,
    text: "Segun el curriculo nacional, cual es el enfoque pedagogico principal que guia la educacion basica en Ecuador?",
    options: [
      "Constructivismo social",
      "Conductismo",
      "Cognitivismo",
      "Conectivismo"
    ],
    correct: 0,
    explanation: "El curriculo nacional ecuatoriano se basa en el constructivismo social, donde el estudiante construye su conocimiento a traves de la interaccion con su entorno y comunidad."
  },
  {
    id: 2,
    text: "La evaluacion formativa tiene como objetivo principal:",
    options: [
      "Asignar calificaciones finales",
      "Identificar necesidades de aprendizaje durante el proceso",
      "Comparar estudiantes entre si",
      "Promover o reprobar estudiantes"
    ],
    correct: 1,
    explanation: "La evaluacion formativa es un proceso continuo que permite identificar las necesidades de aprendizaje durante el proceso educativo para realizar ajustes oportunos."
  },
  {
    id: 3,
    text: "El Modelo Pedagogico del Ministerio de Educacion de Ecuador promueve principalmente:",
    options: [
      "La memorizacion de contenidos",
      "El aprendizaje significativo y por competencias",
      "La evaluacion estandarizada unicamente",
      "La ensenanza tradicional magistral"
    ],
    correct: 1,
    explanation: "El modelo pedagogico ecuatoriano promueve el aprendizaje significativo basado en competencias, donde el estudiante desarrolla habilidades aplicables a situaciones reales."
  },
  {
    id: 4,
    text: "Los estandares de calidad educativa en Ecuador se organizan en:",
    options: [
      "Estandares de contenido unicamente",
      "Estandares de gestion, desempeno profesional y aprendizaje",
      "Estandares de infraestructura",
      "Estandares de evaluacion"
    ],
    correct: 1,
    explanation: "Los estandares de calidad educativa en Ecuador abarcan: gestion escolar, desempeno profesional docente y directivo, y aprendizaje de los estudiantes."
  },
  {
    id: 5,
    text: "La inclusion educativa implica principalmente:",
    options: [
      "Separar a estudiantes con necesidades especiales",
      "Garantizar el acceso y participacion de todos los estudiantes",
      "Crear escuelas especiales",
      "Reducir el curriculo para algunos estudiantes"
    ],
    correct: 1,
    explanation: "La inclusion educativa busca garantizar que todos los estudiantes, independientemente de sus caracteristicas, tengan acceso, participacion y aprendizaje en igualdad de condiciones."
  },
]

type QuizState = "intro" | "quiz" | "paused" | "review" | "results"

export default function SimuladorDetailPage() {
  const router = useRouter()
  const [state, setState] = useState<QuizState>("intro")
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(new Array(QUESTIONS.length).fill(null))
  const [flagged, setFlagged] = useState<boolean[]>(new Array(QUESTIONS.length).fill(false))
  const [timeLeft, setTimeLeft] = useState(30 * 60) // 30 minutes
  const [showExplanation, setShowExplanation] = useState(false)

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (state === "quiz" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setState("results")
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [state, timeLeft])

  const handleAnswer = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = optionIndex
    setSelectedAnswers(newAnswers)
  }

  const toggleFlag = () => {
    const newFlagged = [...flagged]
    newFlagged[currentQuestion] = !newFlagged[currentQuestion]
    setFlagged(newFlagged)
  }

  const goToNext = () => {
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
      setShowExplanation(false)
    }
  }

  const goToPrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
      setShowExplanation(false)
    }
  }

  const finishQuiz = () => {
    setState("results")
  }

  const restartQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswers(new Array(QUESTIONS.length).fill(null))
    setFlagged(new Array(QUESTIONS.length).fill(false))
    setTimeLeft(30 * 60)
    setShowExplanation(false)
    setState("quiz")
  }

  const calculateScore = () => {
    let correct = 0
    selectedAnswers.forEach((answer, i) => {
      if (answer === QUESTIONS[i].correct) correct++
    })
    return {
      correct,
      total: QUESTIONS.length,
      percentage: Math.round((correct / QUESTIONS.length) * 100)
    }
  }

  // Intro Screen
  if (state === "intro") {
    return (
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard/simuladores" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Volver a simuladores
        </Link>

        <div className="p-8 rounded-2xl bg-card border border-border text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary/15 flex items-center justify-center mx-auto mb-6">
            <Target className="w-10 h-10 text-primary" />
          </div>

          <h1 className="font-display text-3xl text-foreground mb-2">QSM 10 - 2026</h1>
          <p className="text-muted-foreground mb-6">Simulador basado en el formato oficial del concurso</p>

          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-secondary/50 rounded-xl">
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">{QUESTIONS.length}</div>
              <div className="text-xs text-muted-foreground">Preguntas</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">30</div>
              <div className="text-xs text-muted-foreground">Minutos</div>
            </div>
            <div className="text-center">
              <div className="font-display text-2xl text-foreground">70%</div>
              <div className="text-xs text-muted-foreground">Para aprobar</div>
            </div>
          </div>

          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-foreground mb-2">Instrucciones:</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>- Selecciona la respuesta correcta para cada pregunta</li>
              <li>- Puedes marcar preguntas para revisar despues</li>
              <li>- El temporizador comenzara al iniciar el simulador</li>
              <li>- Al finalizar veras tu puntuacion y retroalimentacion</li>
            </ul>
          </div>

          <button
            onClick={() => setState("quiz")}
            className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-white font-bold rounded-xl hover:bg-[#ff4433] transition-all"
          >
            <Play className="w-5 h-5" />
            Comenzar Simulador
          </button>
        </div>
      </div>
    )
  }

  // Results Screen
  if (state === "results") {
    const score = calculateScore()
    const passed = score.percentage >= 70

    return (
      <div className="max-w-2xl mx-auto">
        <div className="p-8 rounded-2xl bg-card border border-border text-center">
          <div className={cn(
            "w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6",
            passed ? "bg-green-500/15" : "bg-primary/15"
          )}>
            {passed ? (
              <Award className="w-12 h-12 text-green-500" />
            ) : (
              <Target className="w-12 h-12 text-primary" />
            )}
          </div>

          <h1 className="font-display text-4xl text-foreground mb-2">
            {passed ? "Felicidades!" : "Sigue practicando"}
          </h1>
          <p className="text-muted-foreground mb-8">
            {passed
              ? "Has completado el simulador exitosamente"
              : "Necesitas 70% para aprobar. Revisa las respuestas y vuelve a intentar"
            }
          </p>

          {/* Score Circle */}
          <div className="relative w-40 h-40 mx-auto mb-8">
            <svg className="w-full h-full -rotate-90">
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                className="text-secondary"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                fill="none"
                stroke="currentColor"
                strokeWidth="12"
                strokeLinecap="round"
                strokeDasharray={440}
                strokeDashoffset={440 - (440 * score.percentage) / 100}
                className={passed ? "text-green-500" : "text-primary"}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-display text-4xl text-foreground">{score.percentage}%</span>
              <span className="text-sm text-muted-foreground">{score.correct}/{score.total}</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-secondary/50 rounded-xl">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-green-500 mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span className="font-bold">{score.correct}</span>
              </div>
              <div className="text-xs text-muted-foreground">Correctas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-primary mb-1">
                <XCircle className="w-4 h-4" />
                <span className="font-bold">{score.total - score.correct}</span>
              </div>
              <div className="text-xs text-muted-foreground">Incorrectas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-foreground mb-1">
                <Clock className="w-4 h-4" />
                <span className="font-bold">{formatTime(30 * 60 - timeLeft)}</span>
              </div>
              <div className="text-xs text-muted-foreground">Tiempo usado</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setState("review")}
              className="flex-1 flex items-center justify-center gap-2 py-3 border border-border text-foreground font-semibold rounded-xl hover:border-primary hover:text-primary transition-all"
            >
              <TrendingUp className="w-4 h-4" />
              Revisar Respuestas
            </button>
            <button
              onClick={restartQuiz}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary text-white font-bold rounded-xl hover:bg-[#ff4433] transition-all"
            >
              <RotateCcw className="w-4 h-4" />
              Reintentar
            </button>
          </div>

          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 mt-6 text-muted-foreground hover:text-foreground transition-colors"
          >
            <Home className="w-4 h-4" />
            Volver al Dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Quiz / Review Screen
  const question = QUESTIONS[currentQuestion]
  const isReview = state === "review"
  const selected = selectedAnswers[currentQuestion]
  const isCorrect = selected === question.correct

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/simuladores" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-bold text-foreground">QSM 10 - 2026</h1>
            <p className="text-sm text-muted-foreground">Pregunta {currentQuestion + 1} de {QUESTIONS.length}</p>
          </div>
        </div>

        {!isReview && (
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg font-mono text-lg font-bold",
            timeLeft < 300 ? "bg-primary/15 text-primary animate-timer-warn" : "bg-secondary text-foreground"
          )}>
            <Clock className="w-5 h-5" />
            {formatTime(timeLeft)}
          </div>
        )}
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-secondary rounded-full mb-6 overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / QUESTIONS.length) * 100}%` }}
        />
      </div>

      {/* Question Navigation */}
      <div className="flex flex-wrap gap-2 mb-6">
        {QUESTIONS.map((_, i) => (
          <button
            key={i}
            onClick={() => {
              setCurrentQuestion(i)
              setShowExplanation(false)
            }}
            className={cn(
              "w-9 h-9 rounded-lg text-sm font-medium transition-all",
              i === currentQuestion
                ? "bg-primary text-white"
                : selectedAnswers[i] !== null
                  ? isReview
                    ? selectedAnswers[i] === QUESTIONS[i].correct
                      ? "bg-green-500/15 text-green-500 border border-green-500/30"
                      : "bg-primary/15 text-primary border border-primary/30"
                    : "bg-secondary text-foreground"
                  : "bg-card border border-border text-muted-foreground hover:border-primary/50",
              flagged[i] && "ring-2 ring-[#F5C842]"
            )}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question Card */}
      <div className="p-6 rounded-2xl bg-card border border-border mb-6">
        <div className="flex items-start justify-between gap-4 mb-6">
          <p className="text-lg text-foreground leading-relaxed">{question.text}</p>
          {!isReview && (
            <button
              onClick={toggleFlag}
              className={cn(
                "p-2 rounded-lg transition-colors flex-shrink-0",
                flagged[currentQuestion]
                  ? "bg-[#F5C842]/15 text-[#F5C842]"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              )}
            >
              <Flag className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {question.options.map((option, i) => {
            const isSelected = selected === i
            const isCorrectOption = i === question.correct

            let optionClass = "border-border text-foreground hover:border-primary/50"
            if (isReview) {
              if (isCorrectOption) {
                optionClass = "border-green-500 bg-green-500/10 text-green-500"
              } else if (isSelected && !isCorrectOption) {
                optionClass = "border-primary bg-primary/10 text-primary"
              }
            } else if (isSelected) {
              optionClass = "border-primary bg-primary/10 text-primary"
            }

            return (
              <button
                key={i}
                onClick={() => !isReview && handleAnswer(i)}
                disabled={isReview}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all",
                  optionClass
                )}
              >
                <span className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0",
                  isReview && isCorrectOption
                    ? "bg-green-500 text-white"
                    : isReview && isSelected && !isCorrectOption
                      ? "bg-primary text-white"
                      : isSelected
                        ? "bg-primary text-white"
                        : "bg-secondary text-muted-foreground"
                )}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="flex-1">{option}</span>
                {isReview && isCorrectOption && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                {isReview && isSelected && !isCorrectOption && <XCircle className="w-5 h-5 text-primary" />}
              </button>
            )
          })}
        </div>

        {/* Explanation */}
        {(isReview || showExplanation) && (
          <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
            <h4 className="font-semibold text-blue-400 mb-2">Explicacion:</h4>
            <p className="text-sm text-muted-foreground">{question.explanation}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goToPrev}
          disabled={currentQuestion === 0}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Anterior
        </button>

        <div className="flex items-center gap-3">
          {!isReview && selected !== null && (
            <button
              onClick={() => setShowExplanation(!showExplanation)}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {showExplanation ? "Ocultar" : "Ver"} explicacion
            </button>
          )}

          {currentQuestion === QUESTIONS.length - 1 ? (
            isReview ? (
              <Link
                href="/dashboard/simuladores"
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-[#ff4433] transition-all"
              >
                Finalizar Revision
              </Link>
            ) : (
              <button
                onClick={finishQuiz}
                className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-[#ff4433] transition-all"
              >
                Finalizar
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )
          ) : (
            <button
              onClick={goToNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white font-semibold rounded-lg hover:bg-[#ff4433] transition-all"
            >
              Siguiente
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
