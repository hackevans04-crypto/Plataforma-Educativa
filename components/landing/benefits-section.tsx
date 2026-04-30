"use client"

import { useEffect, useRef, useState } from "react"
import {
  ArrowUpRight,
  Award,
  BarChart3,
  BrainCircuit,
  Clock3,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react"
import { useCMS, type CMSBenefitsConfig } from "@/hooks/use-cms"

const BENEFIT_ICONS = [Target, BarChart3, Clock3, ShieldCheck, BrainCircuit, Users]
const STAT_ICONS = [Award, Users, Sparkles, ShieldCheck]

export default function BenefitsSection({ dataOverride }: { dataOverride?: CMSBenefitsConfig }) {
  const [isVisible, setIsVisible] = useState(false)
  const sectionRef = useRef<HTMLDivElement>(null)
  const { config } = useCMS()
  const benefits = dataOverride ?? config.benefits

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true)
      },
      { threshold: 0.12 }
    )

    if (sectionRef.current) observer.observe(sectionRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute left-0 top-12 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-0 top-28 h-80 w-80 rounded-full bg-[#38bdf8]/8 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />
      </div>

      <div className="landing-container relative">
        <div className="grid gap-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-end">
          <div className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}>
            <div className="landing-kicker">{benefits.sectionLabel}</div>
            <h2 className="landing-title mt-4 max-w-2xl text-4xl leading-[0.96] text-white md:text-5xl lg:text-6xl">
              {benefits.titulo}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--he-landing-muted)]">
              {benefits.descripcion}
            </p>
          </div>

          <div
            className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
            style={{ animationDelay: "120ms" }}
          >
            <div className="landing-panel rounded-[32px] p-6 md:p-7">
              <div className="grid gap-5 md:grid-cols-[1fr_0.9fr]">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm font-semibold text-white/75">
                    <Sparkles className="h-4 w-4 text-primary" />
                    Plataforma pensada para resultados
                  </div>
                  <div className="mt-5 text-2xl font-semibold tracking-[-0.04em] text-white">
                    Todo el flujo de preparacion en un solo lugar.
                  </div>
                  <div className="mt-3 text-sm leading-7 text-white/55">
                    Desde diagnostico y practica realista hasta reportes accionables para tomar decisiones de estudio con criterio.
                  </div>
                </div>

                <div className="rounded-[26px] border border-white/8 bg-white/[0.03] p-5">
                  <div className="landing-kicker">Radar de valor</div>
                  <div className="mt-5 space-y-4">
                    {[
                      { label: "Simulacion real", value: "95%" },
                      { label: "Claridad del progreso", value: "89%" },
                      { label: "Actualizacion continua", value: "93%" },
                    ].map((item, index) => (
                      <div key={item.label}>
                        <div className="mb-2 flex items-center justify-between text-sm">
                          <span className="text-white/55">{item.label}</span>
                          <span className="font-semibold text-white">{item.value}</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-white/[0.06]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: item.value,
                              background:
                                index === 0
                                  ? "#34d399"
                                  : index === 1
                                    ? "#38bdf8"
                                    : "linear-gradient(90deg, #E8392A 0%, #ff6b5e 100%)",
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {benefits.items.map((benefit, index) => {
            const Icon = BENEFIT_ICONS[index] ?? Target
            const featured = index === 0
            return (
              <article
                key={index}
                className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
                style={{ animationDelay: `${160 + index * 80}ms` }}
              >
                <div
                  className={featured
                    ? "landing-panel rounded-[30px] p-6 md:p-7"
                    : "landing-panel-soft rounded-[30px] p-6 md:p-7"
                  }
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-white/[0.06] text-primary">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-right">
                      <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/35">
                        {String(index + 1).padStart(2, "0")}
                      </div>
                      <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary/90">
                        <ArrowUpRight className="h-3 w-3" />
                        {benefit.highlight}
                      </div>
                    </div>
                  </div>

                  <h3 className="mt-6 text-2xl font-semibold tracking-[-0.03em] text-white">
                    {benefit.title}
                  </h3>
                  <p className="mt-4 text-sm leading-7 text-white/58">
                    {benefit.description}
                  </p>
                </div>
              </article>
            )
          })}
        </div>

        <div
          className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
          style={{ animationDelay: "420ms" }}
        >
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {benefits.stats.map((stat, index) => {
              const Icon = STAT_ICONS[index] ?? Award
              return (
                <div key={index} className="landing-panel-soft rounded-[28px] p-5">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.05] text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-white">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-white/52">{stat.label}</div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
