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
  const footerText = generalConfig.footerText?.trim() || `© ${new Date().getFullYear()} ${brandName}. Todos los derechos reservados.`
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
      } else {
        window.location.hash = href.slice(1)
      }
      return
    }

    router.push(href)
  }

  return (
    <footer className="bg-transparent border-t border-border pt-16 pb-8 px-6 lg:px-12">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-10 mb-12">
          <div className="md:col-span-1">
            <div className="flex items-center gap-3 mb-4">
              <Image src="/images/logo.png" alt={brandName} width={44} height={44} />
              <div>
                <div className="font-display text-2xl text-white">{brandName}</div>
                <div className="text-[9px] text-muted-foreground tracking-widest uppercase">
                  {brandTagline}
                </div>
              </div>
            </div>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-6">
              {brandTagline}
            </p>
            <div className="flex gap-3">
              <a
                href="https://www.facebook.com/HackrEvans"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/40 transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="https://www.tiktok.com/@planificacionecu"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/40 transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="mailto:contacto@hackevans.com"
                className="w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-white hover:border-primary/40 transition-all"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Navegacion</h4>
            <ul className="space-y-2.5">
              {navigationLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault()
                      handleNavigate(item.href)
                    }}
                    className="text-[13px] text-muted-foreground hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-wide">Legal</h4>
            <ul className="space-y-2.5">
              {legalLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(event) => {
                      event.preventDefault()
                      handleNavigate(item.href)
                    }}
                    className="text-[13px] text-muted-foreground hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">{footerText}</p>
        </div>
      </div>
    </footer>
  )
}
