"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Image from "next/image"
import Link from "next/link"
import { BarChart2, Check, Clock, Star } from "lucide-react"

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
  previewBullets?: string[]
  previewAction?: ReactNode
}

export default function CatalogCourseCard({
  curso,
  href,
  onCardClick,
  metaBadges,
  afterMetaContent,
  footerRight,
  previewBullets,
  previewAction,
}: CatalogCourseCardProps) {
  const [imageSrc, setImageSrc] = useState(curso.imagen || "/placeholder.jpg")
  const [hovered, setHovered] = useState(false)
  const [side, setSide] = useState<"right" | "left">("right")
  const cardRef = useRef<HTMLDivElement>(null)
  const enterTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const enterHover = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
    if (enterTimer.current) clearTimeout(enterTimer.current)
    enterTimer.current = setTimeout(() => {
      const node = cardRef.current
      if (node) {
        const rect = node.getBoundingClientRect()
        const space = window.innerWidth - rect.right
        setSide(space < 360 ? "left" : "right")
      }
      setHovered(true)
    }, 280)
  }
  const scheduleClose = () => {
    if (enterTimer.current) {
      clearTimeout(enterTimer.current)
      enterTimer.current = null
    }
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    leaveTimer.current = setTimeout(() => setHovered(false), 180)
  }
  const cancelClose = () => {
    if (leaveTimer.current) {
      clearTimeout(leaveTimer.current)
      leaveTimer.current = null
    }
  }

  useEffect(
    () => () => {
      if (enterTimer.current) clearTimeout(enterTimer.current)
      if (leaveTimer.current) clearTimeout(leaveTimer.current)
    },
    [],
  )

  const bullets =
    previewBullets && previewBullets.length > 0
      ? previewBullets
      : [
          `${curso.totalClases} clases · ${curso.totalHoras} horas en total`,
          `Nivel ${curso.nivel.toLowerCase()}`,
          curso.gratis ? "Acceso gratuito al contenido completo" : "Acceso de por vida tras la compra",
          "Certificado al finalizar y soporte del instructor",
        ]

  const content = (
    <div className="overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:border-primary/45 hover:shadow-[0_18px_40px_rgba(232,57,42,0.18)]">
      <div className="relative aspect-video w-full overflow-hidden bg-secondary/30">
        <Image
          src={imageSrc}
          alt={curso.titulo}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          onError={() => setImageSrc("/placeholder.jpg")}
        />

        {curso.bestseller ? (
          <div className="absolute left-2 top-2 rounded-full bg-gradient-to-r from-[#fbbf24] to-[#facc15] px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-[#0a0a0a]">
            Mas vendido
          </div>
        ) : null}

        {curso.nuevo ? (
          <div className="absolute left-2 top-2 rounded-full bg-card px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-primary border border-primary/30">
            Nuevo
          </div>
        ) : null}

        {curso.gratis ? (
          <div className="absolute right-2 top-2 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-black uppercase tracking-[0.14em] text-white">
            Gratis
          </div>
        ) : null}
      </div>

      <div className="p-2.5">
        {metaBadges ? <div className="mb-1.5 flex flex-wrap gap-1">{metaBadges}</div> : null}

        <h3 className="mb-1 line-clamp-2 text-[13px] font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
          {curso.titulo}
        </h3>

        <p className="mb-1.5 truncate text-[11px] text-muted-foreground">{curso.instructor}</p>

        <div className="mb-1.5 flex items-center gap-1">
          <span className="text-xs font-bold text-amber-500">{curso.rating.toFixed(1)}</span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star
                key={i}
                size={10}
                className={
                  i <= Math.round(curso.rating)
                    ? "fill-amber-500 text-amber-500"
                    : "fill-muted text-muted"
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground">({curso.totalRatings.toLocaleString()})</span>
        </div>

        <div className="mb-2 flex flex-wrap gap-1">
          <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <Clock size={9} /> {curso.totalHoras}h
          </span>
          <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            {curso.totalClases} clases
          </span>
          <span className="flex items-center gap-1 rounded-md border border-border bg-secondary/40 px-1.5 py-0.5 text-[10px] text-muted-foreground">
            <BarChart2 size={9} /> {curso.nivel}
          </span>
        </div>

        {afterMetaContent}

        <div className="flex items-center justify-between border-t border-border pt-2">
          <div className="flex items-baseline gap-1.5">
            {curso.gratis ? (
              <span className="text-sm font-bold text-emerald-500">Gratis</span>
            ) : (
              <>
                <span className="text-sm font-bold text-foreground">${curso.precio.toFixed(2)}</span>
                <span className="text-[10px] text-muted-foreground line-through">
                  ${curso.precioOriginal.toFixed(2)}
                </span>
              </>
            )}
          </div>
          {footerRight ? <div className="shrink-0">{footerRight}</div> : null}
        </div>
      </div>
    </div>
  )

  const preview = hovered ? (
    <div
      onMouseEnter={cancelClose}
      onMouseLeave={scheduleClose}
      className={`pointer-events-auto absolute top-0 z-50 hidden w-80 rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-[0_24px_60px_rgba(0,0,0,0.35)] md:block ${
        side === "right" ? "left-full ml-3" : "right-full mr-3"
      }`}
    >
      <h4 className="text-sm font-black leading-snug text-foreground">{curso.titulo}</h4>
      <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-emerald-500">
        {curso.bestseller ? "Mas vendido · " : ""}
        {curso.totalHoras} horas · {curso.totalClases} clases
      </p>
      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{curso.descripcion}</p>
      <ul className="mt-3 space-y-1.5">
        {bullets.slice(0, 4).map((b) => (
          <li key={b} className="flex items-start gap-2 text-[12px] leading-snug text-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
            {b}
          </li>
        ))}
      </ul>
      {previewAction ? <div className="mt-4">{previewAction}</div> : null}
    </div>
  ) : null

  return (
    <div
      ref={cardRef}
      className="group relative block"
      onMouseEnter={enterHover}
      onMouseLeave={scheduleClose}
    >
      {href ? (
        <Link href={href} className="block" onClick={onCardClick}>
          {content}
        </Link>
      ) : (
        content
      )}
      {preview}
    </div>
  )
}
