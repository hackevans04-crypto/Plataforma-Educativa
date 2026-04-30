"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { ChevronLeft, ChevronRight, Quote, Star, TrendingUp, Users } from "lucide-react"
import { useCMS, type CMSTestimonialsConfig } from "@/hooks/use-cms"

export default function TestimonialsSection({ dataOverride }: { dataOverride?: CMSTestimonialsConfig }) {
  const [isVisible, setIsVisible] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const sectionRef = useRef<HTMLElement>(null)
  const { config } = useCMS()
  const { titulo, descripcion, items } = dataOverride ?? config.testimonials
  const testimonials = items.map((testimonial) => ({
    name: testimonial.nombre,
    role: testimonial.cargo,
    location: testimonial.location,
    rating: testimonial.rating,
    text: testimonial.texto,
  }))

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

  useEffect(() => {
    if (testimonials.length <= 1) return
    const timer = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % testimonials.length)
    }, 6500)
    return () => window.clearInterval(timer)
  }, [testimonials.length])

  const featuredTestimonial = testimonials[currentIndex]
  const sideTestimonials = useMemo(() => {
    if (testimonials.length <= 1) return []
    return testimonials
      .map((item, index) => ({ item, index }))
      .filter(({ index }) => index !== currentIndex)
      .slice(0, 2)
  }, [currentIndex, testimonials])

  const nextSlide = () => {
    setCurrentIndex((previous) => (previous + 1) % testimonials.length)
  }

  const prevSlide = () => {
    setCurrentIndex((previous) => (previous - 1 + testimonials.length) % testimonials.length)
  }

  if (!featuredTestimonial) return null

  return (
    <section ref={sectionRef} className="relative overflow-hidden py-24">
      <div className="absolute inset-0">
        <div className="absolute left-[8%] top-10 h-72 w-72 rounded-full bg-[#38bdf8]/7 blur-3xl" />
        <div className="absolute right-[5%] top-24 h-80 w-80 rounded-full bg-primary/8 blur-3xl" />
      </div>

      <div className="landing-container relative">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr]">
          <div
            className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
            style={{ animationDelay: "40ms" }}
          >
            <div className="landing-kicker">Historias reales</div>
            <h2 className="landing-title mt-4 text-4xl leading-[0.96] text-white md:text-5xl">
              {titulo}
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-8 text-[var(--he-landing-muted)]">
              {descripcion}
            </p>

            <div className="mt-8 space-y-4">
              <div className="landing-panel rounded-[28px] p-5">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <Star className="h-5 w-5 fill-current" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">Calificacion promedio</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.18em] text-white/40">Comunidad activa</div>
                  </div>
                </div>
                <div className="mt-5 flex items-end gap-3">
                  <div className="text-5xl font-semibold tracking-[-0.05em] text-white">4.9/5</div>
                  <div className="pb-2 text-sm text-white/55">basado en docentes preparados</div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="landing-panel-soft rounded-[26px] p-5">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <Users className="h-4 w-4 text-primary" />
                    Comunidad
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">15,000+</div>
                  <div className="mt-1 text-sm text-white/45">docentes activos</div>
                </div>

                <div className="landing-panel-soft rounded-[26px] p-5">
                  <div className="flex items-center gap-2 text-sm text-white/60">
                    <TrendingUp className="h-4 w-4 text-emerald-400" />
                    Resultado
                  </div>
                  <div className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">98%</div>
                  <div className="mt-1 text-sm text-white/45">satisfaccion reportada</div>
                </div>
              </div>
            </div>
          </div>

          <div
            className={isVisible ? "animate-slide-up" : "opacity-0 translate-y-6"}
            style={{ animationDelay: "140ms" }}
          >
            <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
              <article className="landing-panel rounded-[32px] p-6 md:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/[0.06] text-primary">
                      <Quote className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold uppercase tracking-[0.18em] text-white/45">
                        Testimonio destacado
                      </div>
                      <div className="mt-1 flex gap-1">
                        {Array.from({ length: featuredTestimonial.rating }).map((_, index) => (
                          <Star key={index} className="h-4 w-4 fill-[#fbbf24] text-[#fbbf24]" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={prevSlide}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-primary/30 hover:text-white"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={nextSlide}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.03] text-white/60 transition-all hover:border-primary/30 hover:text-white"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <div className="mt-8 text-2xl font-medium leading-10 tracking-[-0.03em] text-white md:text-[2rem]">
                  "{featuredTestimonial.text}"
                </div>

                <div className="mt-10 flex items-center gap-4 border-t border-white/8 pt-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/12 text-lg font-semibold text-primary">
                    {featuredTestimonial.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{featuredTestimonial.name}</div>
                    <div className="text-sm text-white/55">{featuredTestimonial.role}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/35">
                      {featuredTestimonial.location}
                    </div>
                  </div>
                </div>
              </article>

              <div className="space-y-5">
                {sideTestimonials.map(({ item, index }) => (
                  <button
                    key={`${item.name}-${index}`}
                    type="button"
                    onClick={() => setCurrentIndex(index)}
                    className="landing-panel-soft block w-full rounded-[28px] p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/25"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="text-base font-semibold text-white">{item.name}</div>
                        <div className="mt-1 text-sm text-white/45">{item.role}</div>
                      </div>
                      <div className="flex gap-1">
                        {Array.from({ length: item.rating }).map((_, ratingIndex) => (
                          <Star key={ratingIndex} className="h-3.5 w-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                        ))}
                      </div>
                    </div>
                    <p className="mt-4 line-clamp-4 text-sm leading-7 text-white/58">
                      "{item.text}"
                    </p>
                    <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary/85">
                      Ver historia
                    </div>
                  </button>
                ))}

                <div className="flex justify-center gap-2 xl:justify-start">
                  {testimonials.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={index === currentIndex ? "h-2.5 w-8 rounded-full bg-primary" : "h-2.5 w-2.5 rounded-full bg-white/18"}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
