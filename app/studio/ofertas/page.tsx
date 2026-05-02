"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import Link from "next/link"
import { ArrowLeft, Sparkles } from "lucide-react"
import PromoBannerManager from "@/components/admin/promo-banner-manager"

export default function StudioOfertasPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-border bg-card/85 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href="/studio"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/40"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al editor
          </Link>
          <div className="hidden sm:block">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">Studio · Ofertas</p>
            <p className="text-base font-black text-foreground">Banners promocionales del sitio</p>
          </div>
        </div>
        <Link
          href="/admin"
          className="hidden rounded-full bg-primary px-4 py-1.5 text-xs font-black text-white sm:inline-flex"
        >
          Volver al admin
        </Link>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-6 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="font-display text-2xl text-foreground md:text-3xl">Ofertas del sitio</h1>
        </div>
        <p className="mb-6 text-sm text-muted-foreground">
          Crea, activa, pausa y elimina banners promocionales. Aparecen en la parte superior tanto de la landing como del panel del usuario.
        </p>
        <PromoBannerManager />
      </main>
    </div>
  )
}
