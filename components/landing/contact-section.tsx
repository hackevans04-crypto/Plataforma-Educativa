"use client"

import { useEffect, useRef, useState } from "react"
import {
  ChevronDown,
  Clock3,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  Send,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const CONTACT_INFO = [
  { icon: Mail, label: "Email", value: "soporte@hackevans.com" },
  { icon: Phone, label: "Telefono", value: "+593 99 123 4567" },
  { icon: MapPin, label: "Ubicacion", value: "Quito, Ecuador" },
  { icon: Clock3, label: "Horario", value: "Lun - Vie: 8am - 6pm" },
]

const FAQ = [
  {
    question: "Como funcionan los simuladores?",
    answer:
      "Los simuladores replican estructura, tiempo y ritmo del examen real. Al terminar recibes un analisis claro para estudiar con prioridad.",
  },
  {
    question: "Puedo acceder desde cualquier dispositivo?",
    answer:
      "Si. La plataforma esta optimizada para escritorio, tablet y movil para que estudies desde cualquier lugar sin perder avance.",
  },
  {
    question: "Con que frecuencia se actualizan las preguntas?",
    answer:
      "El banco se actualiza de forma constante para reflejar cambios de normativa, curriculo y patrones recientes de evaluacion.",
  },
  {
    question: "Incluyen acompanamiento humano?",
    answer:
      "Si. Dependiendo del plan, puedes acceder a soporte prioritario, mentoria y asesoria especializada para un seguimiento mas cercano.",
  },
]

export default function ContactSection() {
  const [isVisible, setIsVisible] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(0)
  const sectionRef = useRef<HTMLElement>(null)

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
    <section ref={sectionRef} id="contacto" className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute right-[6%] top-14 h-72 w-72 rounded-full bg-[#38bdf8]/7 blur-3xl" />
      </div>

      <div className="landing-container relative">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div
            className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
            style={{ animationDelay: "60ms" }}
          >
            <div className="landing-kicker">Contacto y soporte</div>
            <h2 className="landing-title mt-4 text-4xl leading-[0.96] text-white md:text-5xl">
              Un equipo real para acompanarte antes, durante y despues de tu preparacion.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--he-landing-muted)]">
              Si necesitas ayuda con planes, simuladores o tu ruta de estudio, te respondemos con rapidez y contexto.
            </p>

            <div className="mt-8 space-y-4">
              <div className="landing-panel rounded-[30px] p-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-base font-semibold text-white">Mesa de ayuda prioritaria</div>
                    <div className="mt-1 text-sm text-white/50">
                      Respuestas claras sobre acceso, pagos y preparacion.
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Tiempo estimado
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">Menos de 24h</div>
                  </div>
                  <div className="rounded-[24px] border border-white/8 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-2 text-sm text-white/60">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      Canal seguro
                    </div>
                    <div className="mt-3 text-2xl font-semibold text-white">Atencion directa</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {CONTACT_INFO.map((item) => (
                  <div key={item.label} className="landing-panel-soft rounded-[26px] p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/[0.05] text-primary">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <div className="mt-4 text-sm text-white/48">{item.label}</div>
                    <div className="mt-1 text-base font-semibold text-white">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-5">
            <div
              className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
              style={{ animationDelay: "140ms" }}
            >
              <div className="landing-panel rounded-[32px] p-6 md:p-7">
                <div className="mb-6">
                  <div className="text-xl font-semibold text-white">Escribenos</div>
                  <div className="mt-1 text-sm text-white/52">
                    Cuentanos que necesitas y te guiaremos al mejor siguiente paso.
                  </div>
                </div>

                <form
                  className="space-y-4"
                  onSubmit={(event) => {
                    event.preventDefault()
                  }}
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white/72">Nombre</span>
                      <input
                        type="text"
                        placeholder="Tu nombre"
                        className="h-12 w-full rounded-[20px] border border-white/10 bg-[#09111f]/82 px-4 text-sm text-white placeholder:text-white/25 focus:border-primary/35 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-sm font-medium text-white/72">Email</span>
                      <input
                        type="email"
                        placeholder="tu@email.com"
                        className="h-12 w-full rounded-[20px] border border-white/10 bg-[#09111f]/82 px-4 text-sm text-white placeholder:text-white/25 focus:border-primary/35 focus:outline-none"
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Asunto</span>
                    <input
                      type="text"
                      placeholder="Plan, acceso, simuladores o asesoria"
                      className="h-12 w-full rounded-[20px] border border-white/10 bg-[#09111f]/82 px-4 text-sm text-white placeholder:text-white/25 focus:border-primary/35 focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-white/72">Mensaje</span>
                    <textarea
                      rows={5}
                      placeholder="Describe tu necesidad para responderte mejor..."
                      className="w-full rounded-[24px] border border-white/10 bg-[#09111f]/82 px-4 py-3 text-sm text-white placeholder:text-white/25 focus:border-primary/35 focus:outline-none"
                    />
                  </label>

                  <button
                    type="submit"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_36px_rgba(232,57,42,0.28)]"
                  >
                    <Send className="h-4 w-4" />
                    Enviar mensaje
                  </button>
                </form>
              </div>
            </div>

            <div
              className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
              style={{ animationDelay: "220ms" }}
            >
              <div className="landing-panel-soft rounded-[32px] p-6 md:p-7">
                <div className="mb-5">
                  <div className="text-xl font-semibold text-white">Preguntas frecuentes</div>
                  <div className="mt-1 text-sm text-white/52">
                    Respuestas rapidas para dudas comunes antes de contactar al equipo.
                  </div>
                </div>

                <div className="space-y-3">
                  {FAQ.map((item, index) => {
                    const open = openFaq === index
                    return (
                      <div
                        key={item.question}
                        className="overflow-hidden rounded-[24px] border border-white/8 bg-white/[0.03]"
                      >
                        <button
                          onClick={() => setOpenFaq(open ? null : index)}
                          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                        >
                          <span className="text-base font-semibold text-white">{item.question}</span>
                          <ChevronDown
                            className={open ? "h-5 w-5 shrink-0 rotate-180 text-primary transition-transform" : "h-5 w-5 shrink-0 text-white/35 transition-transform"}
                          />
                        </button>
                        {open ? (
                          <div className="px-5 pb-5 text-sm leading-7 text-white/58">
                            {item.answer}
                          </div>
                        ) : null}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
