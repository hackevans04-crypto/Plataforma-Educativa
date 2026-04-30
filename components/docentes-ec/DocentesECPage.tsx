"use client"

import { motion, useInView, useScroll, useTransform } from "framer-motion"
import { useRef } from "react"
import {
  ArrowRight,
  Award,
  BarChart2,
  Brain,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Compass,
  FileText,
  Flame,
  GraduationCap,
  Layers,
  Map,
  Send,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Trophy,
  Users,
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
              { icon: <Flame size={12} />, text: "QSM 2026 alineado" },
              { icon: <ShieldCheck size={12} />, text: "Proceso oficial" },
              { icon: <Brain size={12} />, text: "Reportes por competencia" },
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
            Preparacion clara para{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              docentes en Ecuador
            </span>
          </motion.h1>

          <motion.p
            className="mt-6 max-w-2xl text-lg leading-8 text-white/60"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            Organiza tu avance con simuladores alineados al proceso oficial, reportes por competencia y una ruta de estudio pensada para convocatorias reales.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="mt-8 max-w-2xl"
          >
            <PromptDock
              icon={<Sparkles size={16} />}
              text="Necesito una ruta para QSM con foco en normativa y pedagogia aplicada..."
              action="Preparar ruta"
              chips={["QSM 2026", "Pedagogia", "Normativa", "Plan semanal"]}
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
              Empezar ahora
              <ArrowRight size={16} />
            </button>
            <Link
              href="/simulador"
              className="inline-flex items-center gap-3 rounded-2xl border border-white/14 bg-white/[0.04] px-7 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.07]"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.15)] text-[#ff8c7d]">
                <Target size={13} />
              </div>
              Ver simuladores
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
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">Mapa de avance</p>
                <p className="mt-0.5 text-base font-bold text-white">Indicadores del ecosistema</p>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#ff8c7d]">
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-[#ff6b4d]" />
                en vivo
              </div>
            </div>

            <div className="mb-5 grid gap-3 sm:grid-cols-3">
              {[
                { value: "15K+", label: "docentes activos", icon: <Users size={14} /> },
                { value: "98%", label: "aprobacion", icon: <Trophy size={14} /> },
                { value: "4", label: "ejes clave", icon: <Layers size={14} /> },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3">
                  <div className="mb-1.5 flex h-8 w-8 items-center justify-center rounded-xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.1)] text-[#ff8c7d]">
                    {item.icon}
                  </div>
                  <div className="text-xl font-black text-white">{item.value}</div>
                  <div className="mt-0.5 text-[10px] uppercase tracking-[0.16em] text-white/40">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-white/8 bg-white/[0.035] p-5">
              {[
                ["Pedagogia", 92],
                ["Curriculo", 87],
                ["Normativa", 85],
                ["Evaluacion", 78],
              ].map(([label, value], index) => (
                <div key={label as string} className={cn(index !== 3 && "mb-4")}>
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

          <motion.div
            className="absolute -right-4 -top-4 rounded-2xl bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-3 py-2 text-xs font-black text-[#0a0a0a] shadow-[0_16px_40px_rgba(250,204,21,0.28)]"
            animate={{ y: [0, -6, 0], rotate: [0, 2, 0] }}
            transition={{ duration: 3.2, repeat: Infinity }}
          >
            Promedio 86%
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

function StatsBar() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const items = [
    { icon: <Users size={20} />, value: "15K+", label: "Docentes activos" },
    { icon: <Trophy size={20} />, value: "98%", label: "Tasa de aprobacion" },
    { icon: <ClipboardList size={20} />, value: "120+", label: "Simulacros disponibles" },
    { icon: <Star size={20} />, value: "4.9/5", label: "Valoracion promedio" },
  ]

  return (
    <div ref={ref} className="relative border-y border-white/6 bg-black/35 py-14 backdrop-blur-md">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,57,42,0.6)] to-transparent" />
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-6 lg:grid-cols-4">
        {items.map((item, index) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{ delay: index * 0.1 }}
            className="rounded-[26px] border border-white/8 bg-white/[0.025] p-5 text-center backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]"
          >
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.1)] text-[#ff8c7d]">
              {item.icon}
            </div>
            <div className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-4xl font-black text-transparent">
              {item.value}
            </div>
            <p className="mt-1 text-sm text-white/50">{item.label}</p>
          </motion.div>
        ))}
      </div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[rgba(232,57,42,0.4)] to-transparent" />
    </div>
  )
}

function FlujoSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const pasos = [
    {
      n: "01",
      icon: <Compass size={20} />,
      title: "Diagnostico inicial",
      desc: "Detecta en que competencia estas perdiendo puntos antes de estudiar a ciegas.",
    },
    {
      n: "02",
      icon: <Map size={20} />,
      title: "Ruta de estudio",
      desc: "Convierte el diagnostico en un plan semanal con prioridades concretas.",
    },
    {
      n: "03",
      icon: <Target size={20} />,
      title: "Practica medible",
      desc: "Simulacros por eje con retroalimentacion inmediata y reportes claros.",
    },
    {
      n: "04",
      icon: <Award size={20} />,
      title: "Evidencia de avance",
      desc: "Visualiza tu progreso por pedagogia, curriculo, normativa y evaluacion.",
    },
  ]

  return (
    <section className="relative py-24 md:py-28">
      <div ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-14 text-center"
        >
          <Eyebrow icon={<Layers size={13} />} label="Flujo docente" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            Un solo flujo, de la{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              duda al avance medible
            </span>
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/55">
            No es un sitio de recursos sueltos. Es un sistema que te lleva paso a paso, con evidencias y siguiente accion clara.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {pasos.map((paso, index) => (
            <motion.div
              key={paso.n}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group rounded-[26px] border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] transition-transform group-hover:scale-105">
                  {paso.icon}
                </div>
                <span className="text-3xl font-black text-white/8 transition-colors group-hover:text-[rgba(232,57,42,0.55)]">
                  {paso.n}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white">{paso.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{paso.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function CompetenciasSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const ejes = [
    { name: "Pedagogia", value: 92, desc: "Didactica, planificacion y evaluacion del aprendizaje." },
    { name: "Curriculo", value: 87, desc: "Curriculo nacional aterrizado al aula ecuatoriana." },
    { name: "Normativa", value: 85, desc: "LOEI, reglamento, instructivos y guias oficiales." },
    { name: "Evaluacion", value: 78, desc: "Instrumentos, rubricas y reporte de evidencias." },
  ]

  return (
    <section className="relative py-24 md:py-28">
      <div ref={ref} className="relative z-10 mx-auto w-full max-w-7xl px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-[0.95fr_1.05fr]">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={inView ? { opacity: 1, x: 0 } : {}}>
            <Eyebrow icon={<Target size={13} />} label="Ejes clave" />
            <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
              Cobertura completa de los{" "}
              <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
                4 ejes oficiales
              </span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg leading-8 text-white/55">
              Cada eje con simuladores, materiales y reportes especificos. Sabes exactamente donde reforzar.
            </p>

            <div className="mt-8 grid gap-3">
              {[
                "Banco de preguntas alineado a convocatoria",
                "Reportes individuales por competencia",
                "Material descargable y actualizado",
                "Soporte pedagogico continuo",
              ].map((item, index) => (
                <motion.div
                  key={item}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: 0.2 + index * 0.08 }}
                  className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] p-4 backdrop-blur-sm"
                >
                  <CheckCircle2 size={18} className="shrink-0 text-[#ff8c7d]" />
                  <span className="text-sm text-white/75">{item}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={inView ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.7, delay: 0.25 }}
            className="rounded-[34px] border border-white/8 bg-[linear-gradient(180deg,rgba(15,17,22,0.95),rgba(7,8,12,0.95))] p-8 shadow-[0_28px_90px_rgba(0,0,0,0.4)] backdrop-blur-xl"
          >
            <div className="mb-7 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-white/40">Mapa de competencias</p>
                <p className="mt-1 text-xl font-bold text-white">Avance personal</p>
              </div>
              <div className="rounded-full border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[#ff8c7d]">
                Live
              </div>
            </div>

            <div className="space-y-5">
              {ejes.map(({ name, value, desc }, index) => (
                <div key={name}>
                  <div className="mb-2 flex items-start justify-between gap-3">
                    <div>
                      <span className="text-sm font-semibold text-white">{name}</span>
                      <p className="mt-0.5 text-xs text-white/45">{desc}</p>
                    </div>
                    <span className="text-sm font-black text-white">{value}%</span>
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
            </div>

            <div className="mt-7 flex items-center justify-between border-t border-white/6 pt-5">
              <div>
                <p className="text-xs text-white/40">Promedio general</p>
                <p className="bg-gradient-to-r from-[#ff8c7d] to-[#E8392A] bg-clip-text text-3xl font-black text-transparent">
                  86%
                </p>
              </div>
              <Link
                href="/simulador"
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.02]"
              >
                Practicar
                <ChevronRight size={14} />
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

function MaterialesSection() {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: "-80px" })

  const materiales = [
    {
      icon: <FileText size={20} />,
      title: "Guias actualizadas",
      desc: "Resumenes ejecutivos por eje listos para repasar antes del simulacro.",
    },
    {
      icon: <ClipboardList size={20} />,
      title: "Bancos de preguntas",
      desc: "Miles de preguntas categorizadas con explicaciones claras.",
    },
    {
      icon: <BarChart2 size={20} />,
      title: "Reportes accionables",
      desc: "No solo numeros: el reporte te dice que estudiar despues.",
    },
    {
      icon: <GraduationCap size={20} />,
      title: "Acompanamiento docente",
      desc: "Soporte pedagogico para resolver dudas y desbloquear avance.",
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
          <Eyebrow icon={<GraduationCap size={13} />} label="Material docente" />
          <h2 className="mt-5 text-4xl font-black leading-tight text-white lg:text-6xl">
            Recursos que{" "}
            <span className="bg-gradient-to-r from-[#ff8c7d] via-[#E8392A] to-[#ff6b4d] bg-clip-text text-transparent">
              ayudan a decidir
            </span>{" "}
            que hacer despues
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-lg leading-8 text-white/55">
            Menos secciones de relleno y mas material util de verdad para una preparacion seria.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
          {materiales.map((mat, index) => (
            <motion.div
              key={mat.title}
              initial={{ opacity: 0, y: 28 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="group rounded-[26px] border border-white/8 bg-white/[0.025] p-6 backdrop-blur-sm transition-all hover:border-[rgba(232,57,42,0.4)] hover:bg-white/[0.04]"
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[rgba(232,57,42,0.35)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] transition-transform group-hover:scale-105">
                {mat.icon}
              </div>
              <h3 className="text-lg font-bold text-white">{mat.title}</h3>
              <p className="mt-2 text-sm leading-6 text-white/55">{mat.desc}</p>
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
              <Eyebrow icon={<Zap size={13} />} label="Empieza hoy" />
              <h2 className="mt-5 max-w-3xl text-4xl font-black leading-tight text-white lg:text-5xl">
                Tu siguiente convocatoria empieza en como te preparas hoy.
              </h2>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-white/60">
                Activa tu diagnostico, recibe tu ruta personalizada y empieza a practicar con simuladores reales.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 lg:justify-end">
              <button
                onClick={onPrimary}
                className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-6 py-4 text-sm font-bold text-white shadow-[0_18px_42px_rgba(232,57,42,0.4)] transition-transform hover:scale-[1.02]"
              >
                Crear cuenta gratis
                <ArrowRight size={16} />
              </button>
              <Link
                href="/simulador"
                className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/[0.05] px-6 py-4 text-sm font-semibold text-white backdrop-blur-md transition-all hover:border-[rgba(232,57,42,0.45)] hover:bg-white/[0.08]"
              >
                Ver simuladores
                <ChevronRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function DocentesECPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const openLogin = () => router.push("/login")
  const openRegister = () => router.push("/registro")
  const handlePrimary = () => {
    if (isAuthenticated) {
      router.push("/dashboard/simuladores")
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
        <StatsBar />
        <FlujoSection />
        <CompetenciasSection />
        <MaterialesSection />
        <FinalCta onPrimary={handlePrimary} />
        <Footer />
      </div>
    </main>
  )
}
