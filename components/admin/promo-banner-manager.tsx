"use client"

import { useEffect, useState } from "react"
import { Sparkles, Trash2 } from "lucide-react"
import {
  PROMO_EVENT,
  deletePromoBanner,
  getPromoBanners,
  upsertPromoBanner,
  type PromoBanner,
} from "@/lib/promo-banner"

export default function PromoBannerManager({ compact = false }: { compact?: boolean }) {
  const [promos, setPromos] = useState<PromoBanner[]>([])
  const [message, setMessage] = useState("")
  const [ctaLabel, setCtaLabel] = useState("Ver oferta")
  const [ctaHref, setCtaHref] = useState("/cursos")
  const [bg, setBg] = useState("#5b21b6")
  const [text, setText] = useState("#ffffff")
  const [showLanding, setShowLanding] = useState(true)
  const [showDashboard, setShowDashboard] = useState(true)

  useEffect(() => {
    const sync = () => setPromos(getPromoBanners())
    sync()
    if (typeof window === "undefined") return
    window.addEventListener(PROMO_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(PROMO_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [])

  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-black text-foreground">Banner promocional / Oferta</h2>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">
          Aparece en la parte superior de la página principal (visitantes) y del panel del usuario al iniciar sesión. Cada usuario puede cerrarlo individualmente. Activa o pausa cuando quieras dejar de mostrar la oferta.
        </p>
        <div className="grid gap-2 md:grid-cols-2">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Mensaje del banner (ej: Oferta por tiempo limitado · Plan Anual con 2 meses gratis)"
            className="md:col-span-2 h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={ctaLabel}
            onChange={(e) => setCtaLabel(e.target.value)}
            placeholder="Texto del enlace (ej: Plan Anual)"
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <input
            value={ctaHref}
            onChange={(e) => setCtaHref(e.target.value)}
            placeholder="URL del enlace (ej: /cursos)"
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
          <label className="flex items-center gap-2 text-xs text-foreground">
            <span className="w-24">Color fondo</span>
            <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border border-border bg-background" />
            <input value={bg} onChange={(e) => setBg(e.target.value)} className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-xs outline-none" />
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <span className="w-24">Color texto</span>
            <input type="color" value={text} onChange={(e) => setText(e.target.value)} className="h-8 w-12 cursor-pointer rounded-lg border border-border bg-background" />
            <input value={text} onChange={(e) => setText(e.target.value)} className="h-8 flex-1 rounded-lg border border-border bg-background px-2 text-xs outline-none" />
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={showLanding} onChange={(e) => setShowLanding(e.target.checked)} className="h-4 w-4 cursor-pointer accent-primary" />
            Mostrar en página principal
          </label>
          <label className="flex items-center gap-2 text-xs text-foreground">
            <input type="checkbox" checked={showDashboard} onChange={(e) => setShowDashboard(e.target.checked)} className="h-4 w-4 cursor-pointer accent-primary" />
            Mostrar en dashboard del usuario
          </label>
        </div>
        <div className="mt-3 rounded-xl border border-border" style={{ background: bg, color: text }}>
          <p className="px-4 py-3 text-center text-sm font-medium">
            {message || "Vista previa del mensaje promocional aparecerá aquí"}
            {ctaLabel && ctaHref ? (
              <span className="ml-2 font-black underline underline-offset-4">{ctaLabel}</span>
            ) : null}
          </p>
        </div>
        <button
          onClick={() => {
            if (!message.trim()) return
            upsertPromoBanner({
              message: message.trim(),
              ctaLabel: ctaLabel.trim(),
              ctaHref: ctaHref.trim(),
              background: bg,
              textColor: text,
              active: true,
              showOnLanding: showLanding,
              showOnDashboard: showDashboard,
            })
            setMessage("")
          }}
          disabled={!message.trim()}
          className="mt-3 rounded-xl bg-primary px-4 py-2 text-xs font-black text-white disabled:opacity-50"
        >
          Publicar banner
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
          Ofertas existentes ({promos.length})
        </p>
        {promos.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-8 text-center text-xs text-muted-foreground">
            Aún no hay banners promocionales. Crea uno arriba.
          </div>
        ) : (
          <div className="space-y-2">
            {promos.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/15 p-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="h-6 w-6 shrink-0 rounded-md" style={{ background: p.background }} />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{p.message}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {p.active ? "Activo" : "Inactivo"} ·{" "}
                      {p.showOnLanding ? "Landing " : ""}
                      {p.showOnDashboard ? "Dashboard" : ""}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => upsertPromoBanner({ ...p, active: !p.active })}
                  className="rounded-full border border-border bg-secondary/30 px-3 py-1 text-[11px] font-bold text-foreground"
                >
                  {p.active ? "Desactivar" : "Activar"}
                </button>
                <button
                  onClick={() => deletePromoBanner(p.id)}
                  className="rounded-full p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
