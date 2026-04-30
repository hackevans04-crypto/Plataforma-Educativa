"use client"

import Image from "next/image"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import { Facebook, Mail } from "lucide-react"
import { useCMS, type CMSConfig } from "@/hooks/use-cms"

interface FooterProps {
  previewMode?: boolean
  onPreviewNavigate?: (href: string) => void
  generalOverride?: CMSConfig["general"]
  navOverride?: CMSConfig["nav"]
  pageLinksOverride?: CMSConfig["pages"]
}

export default function Footer({
  previewMode = false,
  onPreviewNavigate,
  generalOverride,
  navOverride,
  pageLinksOverride,
}: FooterProps) {
  const router = useRouter()
  const { config } = useCMS()
  const generalConfig = generalOverride ?? config.general
  const navConfig = navOverride ?? config.nav
  const pageLinks = pageLinksOverride ?? config.pages
  const brandName = generalConfig.nombrePlataforma?.trim() || "Hack Evans"
  const brandTagline = generalConfig.tagline?.trim() || "Consultoria Educativa"
  const footerText =
    generalConfig.footerText?.trim() || `(c) ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.`
  const legalLinks = generalConfig.footerLinks ?? []

  const navigationLinks = useMemo(() => {
    const pageRouteMap = new Map(
      (pageLinks ?? []).map((page) => [
        `/${page.slug}`,
        page,
      ])
    )
    const merged: CMSConfig["nav"]["items"] = []

    for (const item of navConfig.items) {
      const linkedPage = pageRouteMap.get(item.href)
      if (linkedPage) {
        if (linkedPage.showInNav === false) continue
        merged.push({
          ...item,
          label: linkedPage.navLabel?.trim() || linkedPage.title || item.label,
        })
        continue
      }

      merged.push(item)
    }

    for (const page of pageLinks ?? []) {
      if (page.showInNav === false) continue

      const href = `/${page.slug}`
      if (merged.some((item) => item.href === href)) continue

      merged.push({
        id: `footer-page-${page.slug}`,
        label: page.navLabel?.trim() || page.title,
        href,
      })
    }

    return merged.slice(0, 6)
  }, [navConfig.items, pageLinks])

  const handleNavigate = (href: string) => {
    if (previewMode) {
      onPreviewNavigate?.(href)
      return
    }

    if (/^https?:\/\//i.test(href)) {
      window.location.href = href
      return
    }

    if (href.startsWith("#")) {
      const target = document.querySelector<HTMLElement>(href)
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" })
        return
      }

      if (href === "#contacto") {
        window.location.href = "mailto:contacto@hackevans.com"
      } else {
        window.location.hash = href.slice(1)
      }
      return
    }

    router.push(href)
  }

  return (
    <footer className="relative overflow-hidden px-6 pb-10 pt-8 lg:px-12">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(6,10,19,0.12),rgba(6,10,19,0.78)_32%,rgba(6,10,19,0.98))]" />

      <div className="landing-container relative">
        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr_0.85fr_0.85fr]">
          <div className="landing-panel-soft rounded-[32px] p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04]">
                <Image src="/images/logo.png" alt={brandName} width={32} height={32} />
              </div>
              <div>
                <div
                  className="text-xl font-semibold tracking-[-0.03em] text-white"
                  style={{ fontFamily: "'Outfit', var(--font-barlow), sans-serif" }}
                >
                  {brandName}
                </div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-white/35">
                  {brandTagline}
                </div>
              </div>
            </div>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/58">
              Plataforma enfocada en docentes que quieren estudiar con estructura, confianza y una experiencia digital a la altura.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="https://www.facebook.com/HackrEvans"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/65 transition-all hover:border-primary/30 hover:text-white"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="https://www.tiktok.com/@planificacionecu"
                target="_blank"
                rel="noopener noreferrer"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/65 transition-all hover:border-primary/30 hover:text-white"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="mailto:contacto@hackevans.com"
                className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white/65 transition-all hover:border-primary/30 hover:text-white"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="landing-panel-soft rounded-[32px] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/38">Navegacion</div>
            <ul className="mt-5 space-y-3">
              {navigationLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault()
                      handleNavigate(item.href)
                    }}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-panel-soft rounded-[32px] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/38">Legal</div>
            <ul className="mt-5 space-y-3">
              {legalLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault()
                      handleNavigate(item.href)
                    }}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-panel-soft rounded-[32px] p-6">
            <div className="text-sm font-semibold uppercase tracking-[0.2em] text-white/38">Contacto</div>
            <div className="mt-5 space-y-4 text-sm text-white/60">
              <div>
                <div className="text-white/35">Email</div>
                <div className="mt-1 font-medium text-white">contacto@hackevans.com</div>
              </div>
              <div>
                <div className="text-white/35">WhatsApp</div>
                <div className="mt-1 font-medium text-white">+593 99 123 4567</div>
              </div>
              <div>
                <div className="text-white/35">Ciudad</div>
                <div className="mt-1 font-medium text-white">Quito, Ecuador</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 rounded-[28px] border border-white/8 bg-white/[0.03] px-5 py-4 text-sm text-white/45 md:flex-row md:items-center md:justify-between">
          <div>{footerText}</div>
          <div className="text-white/32">Disenado para una experiencia mas clara, moderna y profesional.</div>
        </div>
      </div>
    </footer>
  )
}
