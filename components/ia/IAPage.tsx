"use client"

import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import {
  ArrowRight,
  BarChart2,
  Bot,
  Brain,
  CheckCircle2,
  ChevronRight,
  Cpu,
  FileText,
  Flame,
  Lightbulb,
  Send,
  Sparkles,
  Star,
  Wand2,
  Zap,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BrandBackdrop from "@/components/brand-backdrop"
import { useAuth } from "@/contexts/auth-context"

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ")
}

function Eyebrow({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-4 py-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ff8c7d] backdrop-blur-sm">
      <span className="text-[#ff6b5e]">{icon}</span>
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

function HeroSection({ onPrimary }: { onPrimary: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 120])
  const opacity = useTransform(scrollYProgress, [0, 0.85], [1, 0])

  return (
    <section ref={ref} className="relative flex min-h-screen items-center pt-24 lg:pt-28">
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
              { icon: <Flame size={12} />, text: "IA aplicada al aula" },
              { icon: <Bot size={12} />, text: "Asistencia 24/7" },
              { icon: <Wand2 size={12} />, text: "Prompts listos" },
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
            Inteligencia artificial para una{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              preparacion mas precisa
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            Activa asistentes que detectan tus brechas, recomiendan el siguiente paso y aterrizan la IA al aula docente.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 max-w-2xl"
          >
            <PromptDock
              icon={<Bot size={16} />}
              text="Necesito una ruta para reforzar normativa y crear preguntas tipo QSM..."
              action="Usar IA"
              chips={["Diagnostico", "Prompts", "Banco de preguntas", "Ruta sugerida"]}
            />
          </motion.div>

          <motion.div
            className="mt-9 flex flex-wrap gap-4"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <button
              onClick={onPrimary}
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-7 py-4 text-sm font-bold text-white shadow-[0_18px_45px_rgba(232,57,42,0.42)] transition-transform hover:scale-[1.02]"
            >
              Probar IA gratis
              <ArrowRight size={16} />
            </button>
            <Link
              href="/cursos"
              className="inline-flex items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.07]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.15)] text-[#ff8c7d]">
                <Lightbulb size={13} />
              </div>
              Ver curso de IA
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
            <div className="mb-5 flex items-center gap-3 border-b border-white/6 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]">
                <Bot size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-white">Hack Evans IA</p>
                <p className="text-xs text-white/45">Asistente pedagogico</p>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.1)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8c7d]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6b4d]" />
                online
              </div>
            </div>

            <div className="space-y-3">
              <div className="rounded-[22px] border border-white/8 bg-white/[0.04] p-4">
                <p className="text-xs uppercase tracking-[0.16em] text-white/40">Tu</p>
                <p className="mt-1.5 text-sm text-white/80">
                  Necesito 10 preguntas tipo QSM sobre evaluacion formativa.
                </p>
              </div>

              <div className="rounded-[22px] border border-[rgba(232,57,42,0.25)] bg-[rgba(232,57,42,0.06)] p-4">
                <p className="flex items-center gap-1.5 text-xs uppercase tracking-[0.16em] text-[#ff8c7d]">
                  <Sparkles size={11} /> Hack Evans IA
                </p>
                <p className="mt-1.5 text-sm leading-6 text-white/85">
                  Listo. Generé 10 preguntas alineadas al banco oficial. ¿Quieres que las añada a un simulador?
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button className="rounded-full border border-[rgba(232,57,42,0.5)] bg-[rgba(232,57,42,0.15)] px-3 py-1 text-[11px] font-semibold text-[#ff8c7d]">
                    Crear simulador
                  </button>
                  <button className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[11px] text-white/65">
                    Ver preguntas
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <Zap size={14} className="text-[#ff8c7d]" />
                <p className="mt-2 text-2xl font-black text-white">24/7</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-white/45">Asistencia</p>
              </div>
              <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-4">
                <CheckCircle2 size={14} className="text-[#ff8c7d]" />
                <p className="mt-2 text-2xl font-black text-white">1 click</p>
                <p className="mt-0.5 text-[11px] uppercase tracking-[0.16em] text-white/45">Acciones</p>
              </div>
            </div>
          </div>

          <motion.div
            className="absolute -right-4 -top-4 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-3 py-2 text-xs font-black text-[#0a0a0a] shadow-[0_16px_40px_rgba(250,204,21,0.28)]"
            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            IA premium
          </motion.div>

          <motion.div
            className="absolute -bottom-4 -left-4 rounded-2xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-4 py-3 text-xs text-white backdrop-blur-xl"
            animate={{ y: [0, 7, 0] }}
            transition={{ duration: 4.2, repeat: Infinity, delay: 0.8 }}
          >
            <span className="font-bold text-[#ff8c7d]">+1.2K</span>
            <span className="text-white/55"> respuestas hoy</span>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

function CapacidadesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const tools = [
    {
      icon: <FileText size={20} />,
      title: "Planificaciones con contexto",
      desc: "Genera borradores iniciales utiles para el aula ecuatoriana, alineados al curriculo nacional.",
    },
    {
      icon: <Brain size={20} />,
      title: "Banco de preguntas asistido",
      desc: "Convierte temas clave en practicas con la estructura y ritmo correctos.",
    },
    {
      icon: <Bot size={20} />,
      title: "Asistente pedagogico",
      desc: "Resuelve dudas y propone siguientes pasos sin romper tu flujo de estudio.",
    },
    {
      icon: <BarChart2 size={20} />,
      title: "Analisis accionable",
      desc: "Reportes que no solo muestran datos, sino decisiones sugeridas.",
    },
    {
      icon: <Wand2 size={20} />,
      title: "Prompts listos",
      desc: "Plantillas probadas para tareas docentes: planes, rubricas, comunicados.",
    },
    {
      icon: <Cpu size={20} />,
      title: "Integracion con simuladores",
      desc: "La IA usa tus resultados para personalizar tu siguiente practica.",
    },
  ]

  return (
    <section className="relative py-24 md:py-28">
      <div ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 text-center"
        >
          <Eyebrow icon={<Sparkles size={13} />} label="Capacidades" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            IA que ayuda a{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              decidir el siguiente paso
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/55">
            No es chat por chat. Es asistencia aterrizada con casos reales para docentes y futuros docentes.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tools.map((tool, index) => (
            <motion.div
              key={tool.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="group rounded-[26px] border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] transition-transform group-hover:scale-105">
                {tool.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{tool.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{tool.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FlujoIASection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const pasos = [
    { n: "01", title: "Describe tu meta", desc: "Cuéntale a la IA donde estas y que quieres lograr." },
    { n: "02", title: "Recibe diagnostico", desc: "La IA analiza tus resultados y detecta brechas." },
    { n: "03", title: "Acepta la ruta", desc: "Plan semanal con prioridades concretas listo en segundos." },
    { n: "04", title: "Practica y mide", desc: "Simulacros, banco de preguntas y reportes accionables." },
  ]

  return (
    <section className="relative py-24 md:py-28">
      <div ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 items-start gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
            <Eyebrow icon={<Lightbulb size={13} />} label="Flujo IA" />
            <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
              De la pregunta al{" "}
              <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
                plan personalizado
              </span>{" "}
              en minutos
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/55">
              No tienes que ser experto en prompts. La interfaz te guia con casos reales y te entrega resultados aterrizados.
            </p>

            <div className="mt-8">
              <PromptDock
                icon={<Wand2 size={16} />}
                text="Crear 5 preguntas tipo QSM sobre evaluacion formativa..."
                action="Generar"
                chips={["QSM", "Pedagogia", "Normativa", "Aula real"]}
              />
            </div>
          </motion.div>

          <div className="grid gap-4">
            {pasos.map((paso, index) => (
              <motion.div
                key={paso.n}
                initial={{ opacity: 0, x: 28 }}
                animate={inView ? { opacity: 1, x: 0 } : {}}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ x: -4 }}
                className="group flex gap-5 rounded-[26px] border border-white/8 bg-white/[0.025] p-5 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]"
              >
                <div className="relative">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-base font-black text-[#ff8c7d]">
                    {paso.n}
                  </div>
                  {index !== pasos.length - 1 ? (
                    <div className="absolute left-1/2 top-[3.25rem] h-[calc(100%+0.5rem)] w-px -translate-x-1/2 bg-gradient-to-b from-[rgba(232,57,42,0.4)] to-transparent" />
                  ) : null}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{paso.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-white/55">{paso.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function CasosUsoSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const casos = [
    {
      title: "Aspirantes QSM",
      desc: "Diagnostico, ruta personalizada y simuladores adaptativos.",
      tags: ["QSM 2026", "Diagnostico", "Adaptativo"],
    },
    {
      title: "Docentes en aula",
      desc: "Planificaciones, rubricas y comunicados a familias en minutos.",
      tags: ["Planificacion", "Rubricas", "Comunicados"],
    },
    {
      title: "Coordinadores",
      desc: "Tableros de avance institucional y reportes por docente.",
      tags: ["Reportes", "Equipos", "Avance"],
    },
  ]

  return (
    <section className="relative py-24 md:py-28">
      <div ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          className="mb-14 text-center"
        >
          <Eyebrow icon={<Cpu size={13} />} label="Casos de uso" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            IA aterrizada al{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              dia a dia docente
            </span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {casos.map((caso, index) => (
            <motion.div
              key={caso.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group rounded-[28px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,17,22,0.95),rgba(7,8,12,0.95))] p-6 backdrop-blur-xl transition-all hover:border-[rgba(232,57,42,0.4)]"
            >
              <h3 className="text-2xl font-black text-white">{caso.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{caso.desc}</p>
              <div className="mt-5 flex flex-wrap gap-2">
                {caso.tags.map((tag, i) => (
                  <span
                    key={tag}
                    className={cn(
                      "rounded-full border px-3 py-1 text-[11px] font-semibold",
                      i === 0
                        ? "border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]"
                        : "border-white/10 bg-white/[0.04] text-white/55"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <div className="mt-6 flex items-center justify-between border-t border-white/6 pt-4">
                <span className="text-xs uppercase tracking-[0.18em] text-white/40">Empieza ahora</span>
                <ArrowRight size={16} className="text-[#ff8c7d] transition-transform group-hover:translate-x-1" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function FinalCta({ onPrimary }: { onPrimary: () => void }) {
  return (
    <section className="relative pb-32 pt-10">
      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <div className="relative overflow-hidden rounded-[36px] border border-[rgba(232,57,42,0.3)] bg-[linear-gradient(135deg,#0e1015_0%,#1a0f10_50%,#2c1411_100%)] px-8 py-12 shadow-[0_30px_90px_rgba(0,0,0,0.5)] sm:px-10 lg:px-14 lg:py-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(232,57,42,0.32),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(255,107,77,0.22),transparent_42%)]" />
          <div
            className="absolute inset-0 opacity-[0.18]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.08) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "radial-gradient(ellipse at center, black 50%, transparent 90%)",
              WebkitMaskImage: "radial-gradient(ellipse at center, black 50%, transparent 90%)",
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <Eyebrow icon={<Zap size={13} />} label="Activa la IA" />
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white lg:text-5xl">
                Deja que la IA decida con datos, no con corazonadas.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
                En segundos tienes diagnostico, ruta y siguiente accion. Sin construir prompts desde cero.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                onClick={onPrimary}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_42px_rgba(232,57,42,0.4)] transition-transform hover:scale-[1.02]"
              >
                Probar IA gratis
                <ArrowRight size={16} />
              </button>
              <Link
                href="/cursos"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.08]"
              >
                Ver curso de IA
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function IAPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const openLogin = () => router.push("/login")
  const openRegister = () => router.push("/registro")
  const handlePrimary = () => {
    if (isAuthenticated) {
      router.push("/dashboard")
      return
    }
    openRegister()
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <BrandBackdrop />
      <div className="relative z-10">
        <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} hideAuthenticatedUserMenu />
        <HeroSection onPrimary={handlePrimary} />
        <CapacidadesSection />
        <FlujoIASection />
        <CasosUsoSection />
        <FinalCta onPrimary={handlePrimary} />
        <Footer />
      </div>
    </main>
  )
}
