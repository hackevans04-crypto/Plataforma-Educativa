"use client"

import { useMemo } from "react"
import {
  ArrowUpRight, ExternalLink, Globe, LayoutTemplate, Link2, Monitor, PencilRuler, Smartphone, Sparkles,
} from "lucide-react"
import { useCMS } from "@/hooks/use-cms"
import { cn } from "@/lib/utils"

function StatCard({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card px-5 py-4">
      <div className={cn("text-2xl font-display text-foreground mb-0.5", accent)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

export default function AdminCMSLauncherPage() {
  const { config } = useCMS("draft")

  const stats = useMemo(() => {
    const pageBlocks = (config.pages ?? []).reduce((acc, page) => acc + (page.sections?.length ?? 0), 0)
    return {
      homeBlocks: config.sections.length,
      pageCount: (config.pages ?? []).length,
      pageBlocks,
      navItems: config.nav.items.length,
    }
  }, [config])

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[28px] border border-border bg-[radial-gradient(circle_at_top_left,rgba(232,57,42,0.18),transparent_34%),linear-gradient(135deg,#111722,#090c12)] p-8">
        <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Landing Studio
            </div>
            <div className="max-w-2xl">
              <h1 className="font-display text-4xl text-foreground">Editor visual en pantalla completa</h1>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Abre el Studio en una pestaña nueva para editar inicio y páginas internas con canvas visual, capas, preview responsive y panel de propiedades.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href="/studio"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90 hover:shadow-[0_10px_30px_rgba(232,57,42,0.35)]"
              >
                <PencilRuler className="h-4 w-4" />
                Abrir Editor Studio
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-2xl border border-border bg-card/70 px-5 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
              >
                <ExternalLink className="h-4 w-4" />
                Ver sitio publicado
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:max-w-2xl">
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Monitor className="h-4 w-4 text-primary" />
                  Desktop
                </div>
                <div className="text-xs leading-6 text-muted-foreground">
                  Lienzo amplio para estructurar la página y seleccionar bloques.
                </div>
              </div>
              <div className="rounded-2xl border border-border/80 bg-card/60 p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Smartphone className="h-4 w-4 text-primary" />
                  Mobile
                </div>
                <div className="text-xs leading-6 text-muted-foreground">
                  Revisión rápida del layout móvil desde el mismo editor.
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[26px] border border-border/80 bg-[#0a0f16] p-4 shadow-[0_24px_60px_rgba(0,0,0,0.35)]">
            <div className="rounded-[22px] border border-border/80 bg-card/80">
              <div className="flex items-center gap-2 border-b border-border px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
                <div className="ml-3 rounded-full border border-border bg-secondary/20 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
                  /studio
                </div>
              </div>
              <div className="space-y-4 p-4">
                <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-xs font-bold uppercase tracking-[0.22em] text-primary">Canvas</div>
                    <div className="rounded-full border border-border bg-card px-2 py-1 text-[10px] text-muted-foreground">Responsive</div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-5 w-32 rounded bg-primary/25" />
                    <div className="h-10 w-2/3 rounded bg-foreground/10" />
                    <div className="h-3 w-full rounded bg-foreground/10" />
                    <div className="h-3 w-4/5 rounded bg-foreground/10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                      <LayoutTemplate className="h-3.5 w-3.5 text-primary" />
                      Capas
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-10 rounded-xl bg-card/80" />
                      ))}
                    </div>
                  </div>
                  <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                      <Globe className="h-3.5 w-3.5 text-primary" />
                      Paginas
                    </div>
                    <div className="space-y-2">
                      {[1, 2, 3].map((item) => (
                        <div key={item} className="h-10 rounded-xl bg-card/80" />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-border bg-secondary/10 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-foreground">
                    <Link2 className="h-3.5 w-3.5 text-primary" />
                    Inspector
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((item) => (
                      <div key={item} className="h-9 rounded-xl bg-card/80" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-4">
        <StatCard value={String(stats.homeBlocks)} label="Bloques en inicio" accent="text-primary" />
        <StatCard value={String(stats.pageCount)} label="Páginas del sitio" />
        <StatCard value={String(stats.pageBlocks)} label="Bloques en páginas internas" />
        <StatCard value={String(stats.navItems)} label="Links de navegación" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Páginas configuradas</h2>
          </div>
          <div className="space-y-3">
            {(config.pages ?? []).map((page) => (
              <div key={page.slug} className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-secondary/10 px-4 py-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-foreground">{page.title}</div>
                  <div className="text-xs text-muted-foreground">/{page.slug}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded-full border border-border bg-card px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    {page.sections.length} bloques
                  </span>
                  <a
                    href={`/${page.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground transition-all hover:border-primary/40 hover:text-primary"
                  >
                    Ver
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">Flujo recomendado</h2>
          </div>
          <div className="space-y-4">
            {[
              "Abre el Studio en una pestaña nueva para editar sin el layout del admin.",
              "Selecciona la página, luego el bloque desde el canvas central o desde capas.",
              "Ajusta contenido y estilo en el inspector derecho.",
              "Guarda y revisa la página publicada en otra pestaña.",
            ].map((step, index) => (
              <div key={index} className="flex items-start gap-3 rounded-2xl border border-border bg-secondary/10 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div className="text-sm leading-7 text-muted-foreground">{step}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
