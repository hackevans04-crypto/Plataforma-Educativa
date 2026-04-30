"use client"

import { useState, type MouseEvent, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { BarChart2, Clock, Star } from "lucide-react"

export interface CatalogCourseCardData {
  id: string
  titulo: string
  descripcion: string
  instructor: string
  imagen: string
  precio: number
  precioOriginal: number
  rating: number
  totalRatings: number
  totalHoras: string
  totalClases: number
  nivel: string
  categoria: string
  bestseller: boolean
  nuevo: boolean
  gratis: boolean
}

interface CatalogCourseCardProps {
  curso: CatalogCourseCardData
  href?: string
  onCardClick?: () => void
  metaBadges?: ReactNode
  afterMetaContent?: ReactNode
  footerRight?: ReactNode
}

export default function CatalogCourseCard({
  curso,
  href,
  onCardClick,
  metaBadges,
  afterMetaContent,
  footerRight,
}: CatalogCourseCardProps) {
  const [imageSrc, setImageSrc] = useState(curso.imagen || "/placeholder.jpg")

  const content = (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#0d0e13]/80 backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-[rgba(232,57,42,0.45)] hover:shadow-[0_24px_60px_rgba(232,57,42,0.18)]">
      <div className="relative aspect-video w-full overflow-hidden bg-[#0a0b10]">
        <Image
          src={imageSrc}
          alt={curso.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageSrc("/placeholder.jpg")}
        />

        {curso.bestseller ? (
          <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
            Mas vendido
          </div>
        ) : null}

        {curso.nuevo ? (
          <div className="absolute left-2 top-2 rounded-full bg-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-[#E8392A]">
            Nuevo
          </div>
        ) : null}

        {curso.gratis ? (
          <div className="absolute right-2 top-2 rounded-full bg-[#16a34a] px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
            Gratis
          </div>
        ) : null}
      </div>

      <div className="p-3">
        {metaBadges ? <div className="mb-2 flex flex-wrap gap-1.5">{metaBadges}</div> : null}

        <h3 className="mb-1 line-clamp-2 text-sm font-bold leading-snug text-white transition-colors group-hover:text-[#ff8c7d]">
          {curso.titulo}
        </h3>

        <p className="mb-2 line-clamp-2 text-xs leading-relaxed text-white/55">{curso.descripcion}</p>

        <p className="mb-2 text-xs text-white/45">{curso.instructor}</p>

        <div className="mb-2 flex items-center gap-1.5">
          <span className="text-sm font-bold text-[#fbbf24]">{curso.rating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={12}
                className={
                  i <= Math.round(curso.rating)
                    ? "fill-[#fbbf24] text-[#fbbf24]"
                    : "fill-white/15 text-white/15"
                }
              />
            ))}
          </div>
          <span className="text-xs text-white/45">({curso.totalRatings.toLocaleString()})</span>
        </div>

        <div className="mb-3 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
            <Clock size={10} /> {curso.totalHoras} horas
          </span>
          <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
            {curso.totalClases} clases
          </span>
          <span className="flex items-center gap-1 rounded-md border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[11px] text-white/55">
            <BarChart2 size={10} /> {curso.nivel}
          </span>
        </div>

        {afterMetaContent}

        <div className="flex items-center justify-between border-t border-white/8 pt-2">
          <div className="flex items-baseline gap-2">
            {curso.gratis ? (
              <span className="text-lg font-bold text-[#22c55e]">Gratis</span>
            ) : (
              <>
                <span className="text-lg font-bold text-white">{curso.precio.toFixed(2)} US$</span>
                <span className="text-sm text-white/30 line-through">
                  {curso.precioOriginal.toFixed(2)} US$
                </span>
              </>
            )}
          </div>
          {footerRight ? <div className="shrink-0">{footerRight}</div> : null}
        </div>
      </div>
    </div>
  )

  if (!href) {
    return <div className="group block">{content}</div>
  }

  return (
    <Link href={href} className="group block" onClick={onCardClick}>
      {content}
    </Link>
  )
}
