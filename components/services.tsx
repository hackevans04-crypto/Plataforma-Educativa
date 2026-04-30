"use client"

import { cn } from "@/lib/utils"

const SERVICES = [
  {
    icon: "target",
    title: "Simuladores QSM",
    description: "Practica con miles de preguntas actualizadas al formato INEVAL 2026.",
    tag: "Popular",
    num: "01"
  },
  {
    icon: "bar-chart",
    title: "Dashboard Progreso",
    description: "Estadisticas detalladas de tu avance y areas de mejora.",
    tag: null,
    num: "02"
  },
  {
    icon: "brain",
    title: "Cursos Especializados",
    description: "17 perfiles docentes con contenido actualizado por expertos.",
    tag: null,
    num: "03"
  },
  {
    icon: "graduation-cap",
    title: "Asesoria SIME",
    description: "Guia personalizada para tu proceso de nombramiento docente.",
    tag: "Premium",
    num: "04"
  }
]

export default function Services() {
  return (
    <section className="py-12 lg:py-20 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-up">
          <div className="text-[10px] font-bold uppercase tracking-[3px] text-primary mb-3">
            Nuestros Servicios
          </div>
          <h2 className="font-display text-4xl lg:text-5xl text-white leading-[0.93]">
            Todo para tu{" "}
            <span className="text-primary">Exito Docente</span>
          </h2>
        </div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {SERVICES.map((service, i) => (
            <div
              key={i}
              className={cn(
                "relative bg-card border border-border rounded-xl p-5 overflow-hidden group",
                "hover:border-primary/30 hover:-translate-y-1 transition-all duration-300",
                "animate-fade-up"
              )}
              style={{ animationDelay: `${0.1 + i * 0.1}s` }}
            >
              {/* Top gradient line */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
              
              {/* Background number */}
              <div className="absolute top-2.5 right-2.5 font-display text-4xl text-white/[0.04] leading-none">
                {service.num}
              </div>

              {/* Icon */}
              <div className="text-2xl mb-3">{service.icon}</div>

              {/* Title */}
              <h3 className="text-sm font-bold text-white mb-2">{service.title}</h3>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {service.description}
              </p>

              {/* Tag */}
              {service.tag && (
                <div className="inline-block mt-3 text-[9px] font-bold uppercase text-primary border border-primary/30 px-2 py-1 rounded">
                  {service.tag}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
