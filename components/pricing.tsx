"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Crown, ShieldCheck, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanFeature {
  icon: "check" | "x"
  txt: string
  ok: boolean
}

interface Plan {
  name: string
  desc: string
  monthly: number
  yearly: number
  period: string
  featured: boolean
  popular: boolean
  origYearly?: number
  cta: string
  ctaCls: "primary" | "outline"
  href: string
  audience: string
  emphasis: string
  features: PlanFeature[]
}

const PLANS: Plan[] = [
  {
    name: "Gratuito",
    desc: "Para empezar tu preparacion sin friccion y validar tu nivel actual.",
    monthly: 0,
    yearly: 0,
    period: "/mes",
    featured: false,
    popular: false,
    cta: "Comenzar gratis",
    ctaCls: "outline",
    href: "/registro",
    audience: "Exploracion inicial",
    emphasis: "Diagnostico y practica base",
    features: [
      { icon: "check", txt: "10 preguntas de practica diarias", ok: true },
      { icon: "check", txt: "1 simulador de diagnostico", ok: true },
      { icon: "check", txt: "Resultados basicos sin explicacion", ok: true },
      { icon: "check", txt: "Acceso a blog educativo", ok: true },
      { icon: "x", txt: "Simuladores cronometrados Pro", ok: false },
      { icon: "x", txt: "Banco completo de preguntas", ok: false },
      { icon: "x", txt: "Explicaciones detalladas", ok: false },
      { icon: "x", txt: "Cursos de especialidad", ok: false },
    ],
  },
  {
    name: "Pro",
    desc: "El plan mas completo para preparar QSM con profundidad y consistencia.",
    monthly: 12,
    yearly: 8,
    period: "/mes",
    featured: true,
    popular: true,
    origYearly: 12,
    cta: "Activar Pro",
    ctaCls: "primary",
    href: "/registro",
    audience: "Preparacion intensiva",
    emphasis: "Simuladores ilimitados + analitica",
    features: [
      { icon: "check", txt: "Simuladores cronometrados ilimitados", ok: true },
      { icon: "check", txt: "Banco completo: 5,000+ preguntas", ok: true },
      { icon: "check", txt: "Explicaciones detalladas por respuesta", ok: true },
      { icon: "check", txt: "Estadisticas y progreso detallado", ok: true },
      { icon: "check", txt: "Cursos de especialidad (17 areas)", ok: true },
      { icon: "check", txt: "Modo examen oficial simulado", ok: true },
      { icon: "check", txt: "Acceso 24/7 desde cualquier dispositivo", ok: true },
      { icon: "x", txt: "Asesoria personalizada SIME", ok: false },
    ],
  },
  {
    name: "Magisterio",
    desc: "Preparacion premium con acompanamiento experto y soporte prioritario.",
    monthly: 24,
    yearly: 16,
    period: "/mes",
    featured: false,
    popular: false,
    origYearly: 24,
    cta: "Hablar con un asesor",
    ctaCls: "outline",
    href: "#contacto",
    audience: "Acompanamiento premium",
    emphasis: "Mentoria y asesoria personalizada",
    features: [
      { icon: "check", txt: "Todo lo del plan Pro", ok: true },
      { icon: "check", txt: "Asesoria personalizada SIME", ok: true },
      { icon: "check", txt: "Guia de ascenso de categoria", ok: true },
      { icon: "check", txt: "Mentoria grupal semanal en vivo", ok: true },
      { icon: "check", txt: "Acceso a material exclusivo", ok: true },
      { icon: "check", txt: "Soporte prioritario WhatsApp", ok: true },
      { icon: "check", txt: "Certificado de preparacion", ok: true },
      { icon: "check", txt: "Acceso extendido al material", ok: true },
    ],
  },
]

export default function Pricing() {
  const router = useRouter()
  const [annual, setAnnual] = useState(false)

  const price = (plan: Plan) => (annual ? plan.yearly : plan.monthly)

  const handlePlanClick = (plan: Plan) => {
    if (plan.href.startsWith("#")) {
      const target = document.querySelector(plan.href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
      }
      return
    }
    router.push(plan.href)
  }

  return (
    <section id="pricing" className="relative overflow-hidden px-6 py-24 lg:px-12">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-16 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[12%] top-28 h-80 w-80 rounded-full bg-[#38bdf8]/7 blur-3xl" />
      </div>

      <div className="landing-container relative">
        <div className="grid gap-8 lg:grid-cols-[0.82fr_1.18fr] lg:items-end">
          <div>
            <div className="landing-kicker">Accesos y precios</div>
            <h2 className="landing-title mt-4 text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl">
              Invierte en tu carrera con un acceso que acompane tu ritmo.
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--he-landing-muted)]">
              Estructuramos cada acceso para que puedas empezar rapido, escalar con claridad y tener mas acompanamiento cuando lo necesites.
            </p>
          </div>

          <div className="landing-panel rounded-[32px] p-5 md:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                  Facturacion
                </div>
                <div className="mt-2 text-xl font-semibold text-white">
                  Elige mensual o anual segun tu horizonte de estudio.
                </div>
              </div>

              <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-[#09111f]/85 px-4 py-2.5">
                <button
                  type="button"
                  onClick={() => setAnnual(false)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
                    !annual ? "bg-white/[0.08] text-white" : "text-white/50"
                  )}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setAnnual(true)}
                  className={cn(
                    "rounded-full px-3 py-1.5 text-sm font-semibold transition-all",
                    annual ? "bg-primary text-white" : "text-white/50"
                  )}
                >
                  Anual
                </button>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/12 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-emerald-300">
                <Sparkles className="h-3.5 w-3.5" />
                Hasta 33% de ahorro anual
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white/55">
                <ShieldCheck className="h-3.5 w-3.5 text-primary" />
                Sin permanencia obligatoria
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 xl:grid-cols-3">
          {PLANS.map((plan, index) => {
            const savings = annual && plan.origYearly ? (plan.origYearly - plan.yearly) * 12 : 0
            return (
              <article
                key={plan.name}
                className={cn(
                  "relative overflow-hidden rounded-[32px] p-6 md:p-7",
                  plan.featured ? "landing-panel" : "landing-panel-soft"
                )}
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/25 to-transparent" />
                {plan.popular ? (
                  <div className="absolute right-5 top-5 inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white">
                    <Crown className="h-3.5 w-3.5" />
                    Mas elegido
                  </div>
                ) : null}

                <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-white/40">
                  {plan.audience}
                </div>
                <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">
                  {plan.name}
                </div>
                <div className="mt-2 text-sm text-white/55">{plan.desc}</div>

                <div className="mt-5 rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                  <div className="text-sm font-semibold text-primary/85">{plan.emphasis}</div>
                  <div className="mt-4 flex items-end gap-2">
                    <span className="pb-2 text-xl font-semibold text-white/45">$</span>
                    <span className="text-6xl font-semibold tracking-[-0.06em] text-white">
                      {price(plan)}
                    </span>
                    <span className="pb-2 text-sm text-white/45">{plan.period}</span>
                  </div>
                  {annual && plan.origYearly ? (
                    <div className="mt-3 text-sm text-white/45">
                      Antes ${plan.origYearly}/mes
                      <span className="ml-2 font-semibold text-emerald-300">
                        Ahorras ${savings}/ano
                      </span>
                    </div>
                  ) : (
                    <div className="mt-3 text-sm text-white/45">
                      {index === 0 ? "Empieza sin costo y escala cuando quieras." : "Activa todo el sistema de preparacion sin fricciones."}
                    </div>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <div
                      key={`${plan.name}-${feature.txt}`}
                      className={cn(
                        "flex items-start gap-3 rounded-[20px] border px-4 py-3 text-sm leading-6",
                        feature.ok
                          ? "border-white/8 bg-white/[0.02] text-white/82"
                          : "border-white/6 bg-white/[0.015] text-white/35"
                      )}
                    >
                      {feature.icon === "check" ? (
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-400" />
                      ) : (
                        <X className="mt-1 h-4 w-4 shrink-0 text-white/25" />
                      )}
                      <span>{feature.txt}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => handlePlanClick(plan)}
                  className={cn(
                    "mt-7 inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold transition-all",
                    plan.ctaCls === "primary"
                      ? "bg-primary text-white hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(232,57,42,0.32)]"
                      : "border border-white/10 bg-white/[0.03] text-white hover:border-primary/30 hover:bg-white/[0.05]"
                  )}
                >
                  {plan.cta}
                </button>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
