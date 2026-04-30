"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Play, Check } from "lucide-react"

const ACTIVITIES = [
  { icon: "🎯", cls: "red", title: "Simulador Saberes Pedagogicos", sub: "40 preguntas completadas", score: "+875", sclr: "green", time: "Hace 2h" },
  { icon: "📊", cls: "green", title: "Razonamiento Numerico", sub: "25 preguntas completadas", score: "+650", sclr: "green", time: "Hace 5h" },
  { icon: "📖", cls: "gold", title: "Curso Pedagogia Digital", sub: "Modulo 3 completado", score: "+200", sclr: "gold", time: "Ayer" },
  { icon: "🔬", cls: "blue", title: "Simulador Ciencias Naturales", sub: "60 preguntas completadas", score: "+720", sclr: "green", time: "Hace 2d" },
]

const SUBJECTS = [
  { lbl: "Saberes Pedagogicos", pct: 88 },
  { lbl: "Saberes Disciplinares", pct: 74 },
  { lbl: "Razonamiento", pct: 66 },
  { lbl: "Pensamiento Computacional", pct: 81 },
  { lbl: "Cultura General", pct: 55 },
]

const GOALS = [
  { txt: "Completar simulador Pedagogia General", pts: "+125 pts", done: true },
  { txt: "Practicar 20 preguntas de Razonamiento Numerico", pts: "+80 pts", done: true },
  { txt: "Ver video: Tipos de evaluacion segun el Mineduc", pts: "+50 pts", done: false },
  { txt: "Simulador completo de Ciencias Naturales", pts: "+150 pts", done: false },
]

const BAR_DATA = [
  { lbl: "Lun", h: 45 },
  { lbl: "Mar", h: 72 },
  { lbl: "Mie", h: 58 },
  { lbl: "Jue", h: 88 },
  { lbl: "Vie", h: 65 },
  { lbl: "Sab", h: 30 },
  { lbl: "Dom", h: 10 },
]

export default function DashboardPreview() {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setIsVisible(true)
          obs.disconnect()
        }
      },
      { threshold: 0.2 }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const ringOffset = 283 - 283 * 0.68

  return (
    <section id="dashboard" className="py-12 lg:py-20 px-6 lg:px-12" ref={ref}>
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-primary mb-3">
            Panel de Control
          </div>
          <h2 className="font-display text-4xl lg:text-5xl text-white leading-[0.93]">
            Tu camino al <span className="text-primary">Exito</span>
          </h2>
        </div>

        {/* Header Row */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4 animate-fade-up">
          <div>
            <div className="font-display text-3xl lg:text-4xl tracking-wide text-white">
              Tu camino al <span className="text-primary">Exito</span>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              Docente en preparacion - QSM 10 - 2026
            </div>
          </div>
          <button className="flex items-center gap-2.5 px-6 py-3 bg-primary rounded-lg text-sm font-bold text-white hover:bg-[#ff4433] hover:-translate-y-0.5 hover:shadow-[0_10px_28px_rgba(232,57,42,0.5)] transition-all animate-glow-red">
            <Play className="w-4 h-4" />
            Continuar Ultimo Simulador
          </button>
        </div>

        {/* Stat Cards Row */}
        <div className="grid sm:grid-cols-3 gap-5 mb-5">
          {[
            { label: "Nivel General", val: "68%", cls: "text-primary", delta: "↑ +12% esta semana", icon: "📈" },
            { label: "Preguntas Hoy", val: "47", cls: "text-white", delta: "↑ +8 vs ayer", icon: "✅" },
            { label: "Racha Activa", val: "9 dias", cls: "text-[#F5C842]", delta: "🔥 Sigue asi!", icon: "🔥" },
          ].map((s, i) => (
            <div
              key={i}
              className="bg-card border border-border rounded-xl p-5 hover:border-primary/25 hover:-translate-y-0.5 transition-all animate-fade-up"
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-2">
                {s.icon} {s.label}
              </div>
              <div className={cn("font-display text-5xl leading-none", s.cls)}>{s.val}</div>
              <div className="text-xs text-green-500 mt-1.5">{s.delta}</div>
            </div>
          ))}
        </div>

        {/* Ring + Bar Chart Row */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-5 mb-5">
          {/* Ring Card */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.15s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              🎯 Preparacion General
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6">
              {/* Ring SVG */}
              <div className="relative">
                <svg className="transform -rotate-90" width="110" height="110" viewBox="0 0 100 100">
                  <circle
                    className="text-border"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                  />
                  <circle
                    className="text-primary"
                    cx="50"
                    cy="50"
                    r="45"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray="283"
                    strokeDashoffset={isVisible ? ringOffset : 283}
                    style={{ transition: "stroke-dashoffset 1.8s cubic-bezier(.4,0,.2,1)" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-display text-2xl text-white">68%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Listo</span>
                </div>
              </div>

              {/* Right side stats */}
              <div className="flex-1">
                <div className="font-display text-3xl text-white leading-none">68 / 100</div>
                <div className="text-[13px] text-muted-foreground mt-1 mb-4">Meta: 70% para aprobacion</div>

                <div className="flex flex-col gap-2">
                  {[
                    { lbl: "Pedagogico", v: 88 },
                    { lbl: "Disciplinar", v: 74 },
                    { lbl: "Razonamiento", v: 66 },
                  ].map((r, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-1">
                        <span className="text-xs text-muted-foreground">{r.lbl}</span>
                        <span className="text-xs font-bold text-foreground">{r.v}%</span>
                      </div>
                      <div className="bg-border rounded h-1 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded"
                          style={{
                            width: isVisible ? `${r.v}%` : "0%",
                            transition: `width 1.6s ease ${i * 0.15}s`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Bar Chart */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              📊 Preguntas por dia (semana actual)
            </div>
            <div className="flex items-end gap-3 h-[120px] pt-2">
              {BAR_DATA.map((b, i) => (
                <div key={i} className="flex flex-col items-center flex-1 gap-1.5 h-full">
                  <div className="flex-1 w-full bg-border rounded-t flex items-end overflow-hidden">
                    <div
                      className={cn(
                        "w-full rounded-t",
                        i === 3 ? "bg-gradient-to-t from-green-500 to-green-300" : "bg-gradient-to-t from-primary to-[#ff6b5e]"
                      )}
                      style={{
                        height: isVisible && b.h ? `${b.h}%` : "0%",
                        transition: `height 1.4s cubic-bezier(.4,0,.2,1) ${i * 0.1}s`,
                      }}
                    />
                  </div>
                  <div className="text-[10px] text-muted-foreground">{b.lbl}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Subjects + Goals Row */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-5 mb-5">
          {/* Subjects Progress */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.25s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              Progreso por Área
            </div>
            <div className="flex flex-col gap-4">
              {SUBJECTS.map((s, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-1.5">
                    <span className="text-[13px] font-semibold text-foreground">{s.lbl}</span>
                    <span
                      className={cn(
                        "text-[13px] font-bold",
                        s.pct >= 80 ? "text-green-500" : s.pct >= 60 ? "text-[#F5C842]" : "text-primary"
                      )}
                    >
                      {s.pct}%
                    </span>
                  </div>
                  <div className="bg-border rounded h-1.5 overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded",
                        s.pct >= 80 ? "bg-gradient-to-r from-green-500 to-green-300" : s.pct >= 60 ? "bg-gradient-to-r from-[#F5C842] to-yellow-200" : "bg-gradient-to-r from-primary to-[#ff6b5e]"
                      )}
                      style={{
                        width: isVisible ? `${s.pct}%` : "0%",
                        transition: `width 1.5s cubic-bezier(.4,0,.2,1) ${i * 0.12}s`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Goals */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.3s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              🎯 Metas de Hoy
            </div>
            <div className="flex flex-col gap-2.5">
              {GOALS.map((g, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border bg-white/[0.025] hover:border-primary/35 hover:bg-primary/6 hover:translate-x-1 transition-all cursor-pointer"
                >
                  <div
                    className={cn(
                      "w-5 h-5 rounded flex items-center justify-center flex-shrink-0 border-2",
                      g.done ? "bg-green-500 border-green-500 text-white" : "border-border"
                    )}
                  >
                    {g.done && <Check className="w-3 h-3" />}
                  </div>
                  <div
                    className={cn(
                      "flex-1 text-[13px] font-semibold text-foreground",
                      g.done && "line-through opacity-60"
                    )}
                  >
                    {g.txt}
                  </div>
                  <div className="text-xs text-muted-foreground">{g.pts}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Activity + Streak Row */}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
          {/* Activity */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.35s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              ⏱ Actividad Reciente
            </div>
            <div className="flex flex-col gap-3">
              {ACTIVITIES.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-4 p-3 rounded-lg bg-white/[0.03] border border-white/[0.04] hover:bg-primary/6 transition-colors animate-fade-up"
                  style={{ animationDelay: `${0.1 + i * 0.07}s` }}
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0",
                      a.cls === "red" && "bg-primary/15",
                      a.cls === "green" && "bg-green-500/15",
                      a.cls === "gold" && "bg-[#F5C842]/15",
                      a.cls === "blue" && "bg-blue-500/15"
                    )}
                  >
                    {a.icon}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-white">{a.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{a.sub}</div>
                  </div>
                  <div className="text-right">
                    <div
                      className={cn(
                        "text-base font-bold",
                        a.sclr === "green" && "text-green-500",
                        a.sclr === "gold" && "text-[#F5C842]",
                        a.sclr === "red" && "text-primary"
                      )}
                    >
                      {a.score}
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak */}
          <div className="bg-card border border-border rounded-xl p-6 animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <div className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground mb-4">
              🔥 Racha de Estudio — Ultimos 28 dias
            </div>
            <div className="mb-4">
              <div className="font-display text-5xl text-[#F5C842] leading-none">9</div>
              <div className="text-[13px] text-muted-foreground mt-1">dias consecutivos estudiando</div>
            </div>
            <div className="flex flex-wrap gap-1 mb-5">
              {Array.from({ length: 28 }).map((_, i) => {
                const isToday = i === 27
                const active = [0, 1, 2, 4, 5, 7, 8, 10, 12, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 25, 26, 27].includes(i)
                return (
                  <div
                    key={i}
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-[9px] text-muted-foreground transition-all",
                      isToday && "bg-primary text-white shadow-[0_0_10px_rgba(232,57,42,0.5)]",
                      !isToday && active && "bg-primary/70 text-white",
                      !isToday && !active && "bg-border"
                    )}
                  >
                    {isToday && "★"}
                  </div>
                )
              })}
            </div>
            <div className="p-4 bg-primary/10 border border-primary/25 rounded-xl">
              <div className="text-[13px] font-bold text-primary mb-1">💡 Proxima meta</div>
              <div className="text-[13px] text-foreground">
                Llega a <strong>14 dias</strong> de racha para desbloquear el paquete{" "}
                <strong>Simulador Intensivo</strong>.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
