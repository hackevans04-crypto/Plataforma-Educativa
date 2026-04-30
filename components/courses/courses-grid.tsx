"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { BookOpen, Clock, Users, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { SiteIconGlyph } from "@/components/ui/site-icon-glyph"

interface CourseResource {
  id: string
  duracionMinutos?: number
}

interface CourseSection {
  id: string
  recursos: CourseResource[]
}

interface CourseItem {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  colorPortada?: string
  colorPortada2?: string
  portadaImagen?: string
  iconoPortada?: string
  secciones: CourseSection[]
  new?: boolean
  popular?: boolean
  featured?: boolean
}

interface CoursesGridProps {
  courses: CourseItem[]
  basePath: string
  itemsPerPage: number
}

export function CoursesGrid({ courses, basePath, itemsPerPage }: CoursesGridProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.ceil(courses.length / itemsPerPage)

  const paginatedCourses = useMemo(() => {
    const startIdx = (currentPage - 1) * itemsPerPage
    const endIdx = startIdx + itemsPerPage
    return courses.slice(startIdx, endIdx)
  }, [courses, currentPage, itemsPerPage])

  const getCourseDuration = (course: CourseItem) => {
    const totalMinutes = course.secciones.reduce(
      (acc, section) =>
        acc +
        section.recursos.reduce((sum, resource) => sum + (resource.duracionMinutos || 0), 0),
      0
    )
    if (totalMinutes === 0) return "No especificado"
    if (totalMinutes < 60) return `${totalMinutes}m`
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`
  }

  const getCoursePortadaGradient = (course: CourseItem) => {
    return `linear-gradient(135deg, ${course.colorPortada || "#10b981"}, ${course.colorPortada2 || "#059669"})`
  }

  const getTotalLecciones = (course: CourseItem) => {
    return course.secciones.reduce((acc, section) => acc + section.recursos.length, 0)
  }

  if (courses.length === 0) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedCourses.map((course) => (
          <Link
            key={course.id}
            href={`${basePath}/${course.id}`}
            className="group relative rounded-2xl border border-border overflow-hidden bg-card hover:border-primary/50 transition-all hover:shadow-lg"
          >
            {/* Portada */}
            <div
              className="relative h-40 overflow-hidden bg-cover bg-center"
              style={{ background: getCoursePortadaGradient(course) }}
            >
              {/* Badges */}
              <div className="absolute top-3 right-3 flex gap-2 z-10">
                {course.popular && (
                  <span className="rounded-full bg-primary px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-primary-foreground">
                    Popular
                  </span>
                )}
                {course.new && (
                  <span className="rounded-full bg-emerald-500 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
                    Nuevo
                  </span>
                )}
              </div>

              {/* Icon Container */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/20 bg-white/10 backdrop-blur-sm">
                  {course.portadaImagen ? (
                    <img
                      src={course.portadaImagen}
                      alt={course.titulo}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <SiteIconGlyph
                      name={course.iconoPortada}
                      fallback="book-open"
                      size={44}
                      className="text-white"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-3 p-4">
              {/* Title & Description */}
              <div>
                <h3 className="line-clamp-2 text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                  {course.titulo}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                  {course.subtitulo || course.descripcion}
                </p>
              </div>

              {/* Instructor */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span className="line-clamp-1">{course.instructor || "Equipo"}</span>
              </div>

              {/* Course Stats */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75">
                    Clases
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {getTotalLecciones(course)}
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75">
                    Duración
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground">
                    {getCourseDuration(course)}
                  </div>
                </div>
                <div className="rounded-lg border border-border/50 bg-secondary/30 px-2.5 py-2">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground/75">
                    Nivel
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-foreground line-clamp-1">
                    {course.nivel || "General"}
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-4 pt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              currentPage === 1
                ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            )}
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          <div className="flex items-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={cn(
                  "h-8 w-8 rounded-lg text-sm font-medium transition-all",
                  currentPage === page
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary/30 text-muted-foreground hover:bg-secondary"
                )}
              >
                {page}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all",
              currentPage === totalPages
                ? "bg-secondary/30 text-muted-foreground cursor-not-allowed"
                : "bg-secondary/50 text-foreground hover:bg-secondary"
            )}
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}
