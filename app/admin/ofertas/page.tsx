"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Sparkles } from "lucide-react"
import PromoBannerManager from "@/components/admin/promo-banner-manager"

export default function AdminOfertasPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Ofertas
        </p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">Ofertas y banners promocionales</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea banners de oferta que aparecen en la página principal y en el dashboard del usuario al iniciar sesión. Activa o desactiva cuando termina la promoción.
        </p>
      </div>
      <PromoBannerManager />
    </div>
  )
}
