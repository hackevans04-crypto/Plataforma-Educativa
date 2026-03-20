"use client"

import { useState, useEffect, useMemo } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  ChevronDown, Menu, X, LogOut, LayoutDashboard, Settings,
  User, Shield
} from "lucide-react"
import { useCMS, type CMSConfig } from "@/hooks/use-cms"

interface NavbarProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onNavigate?: (section: string) => void
  onPreviewNavigate?: (href: string) => void
  previewMode?: boolean
  navOverride?: CMSConfig["nav"]
  pageLinksOverride?: CMSConfig["pages"]
  generalOverride?: CMSConfig["general"]
}

export default function Navbar({
  onLoginClick,
  onRegisterClick,
  onNavigate,
  onPreviewNavigate,
  previewMode = false,
  navOverride,
  pageLinksOverride,
  generalOverride,
}: NavbarProps) {
  const router = useRouter()
  const { user, isAuthenticated, logout } = useAuth()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const { config } = useCMS()
  const navConfig = navOverride ?? config.nav
  const pageLinks = pageLinksOverride ?? config.pages
  const generalConfig = generalOverride ?? config.general
  const brandName = generalConfig.nombrePlataforma?.trim() || "Hack Evans"
  const brandTagline = generalConfig.tagline?.trim() || "Consultoria Educativa"
  const navAppearance = generalConfig.navAppearance ?? {}
  const navFontFamily = navAppearance.fontFamily || "var(--font-barlow), system-ui, sans-serif"
  const navSurfaceColor = navAppearance.surfaceColor || "rgba(10, 15, 28, 0.92)"
  const navBorderColor = navAppearance.borderColor || "rgba(51, 65, 85, 0.7)"
  const brandColor = navAppearance.brandColor || "#ffffff"
  const taglineColor = navAppearance.taglineColor || "#94a3b8"
  const linkColor = navAppearance.linkColor || "#cbd5e1"
  const linkHoverColor = navAppearance.linkHoverColor || "#ffffff"
  const primaryButtonColor = navAppearance.primaryButtonColor || "#E8392A"
  const primaryButtonTextColor = navAppearance.primaryButtonTextColor || "#ffffff"
  const secondaryButtonColor = navAppearance.secondaryButtonColor || "transparent"
  const secondaryButtonTextColor = navAppearance.secondaryButtonTextColor || "#ffffff"
  const LINKS = useMemo(() => {
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
        id: `page-${page.slug}`,
        label: page.navLabel?.trim() || page.title,
        href,
      })
    }

    return merged
  }, [navConfig.items, pageLinks])
  const showAuthenticatedUser = !previewMode && isAuthenticated && user

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const handleNavClick = (href: string) => {
    setMobileOpen(false)
    if (previewMode) {
      onPreviewNavigate?.(href)
      return
    }
    if (/^https?:\/\//i.test(href)) {
      window.location.href = href
      return
    }
    if (href.startsWith("#") && onNavigate) {
      onNavigate(href.replace("#", ""))
      return
    }
    if (href === "/") {
      router.push("/")
      return
    }
    router.push(href)
  }

  const handleLogout = () => {
    logout()
    setUserMenuOpen(false)
    router.push("/")
  }

  return (
    <>
      {/* Navbar */}
      <nav
        className={cn(
          "sticky top-0 z-[100] flex items-center justify-between px-6 lg:px-12 h-[68px] bg-background/92 backdrop-blur-xl border-b border-border transition-all duration-300",
          scrolled && "bg-background/98 shadow-[0_4px_40px_rgba(0,0,0,0.65)]"
        )}
        style={{
          backgroundColor: scrolled ? navSurfaceColor : navSurfaceColor,
          borderColor: navBorderColor,
          fontFamily: navFontFamily,
        }}
      >
        {/* Logo */}
        <Link
          href="/"
          onClick={(event) => {
            if (previewMode && onPreviewNavigate) {
              event.preventDefault()
              setMobileOpen(false)
              onPreviewNavigate("/")
            }
          }}
          className="flex items-center gap-3 group"
        >
          <Image
            src="/images/logo.png"
            alt="Hack Evans Logo"
            width={44}
            height={44}
            className="transition-transform group-hover:scale-105"
          />
          <div>
            <div
              className="font-display text-2xl tracking-wide transition-colors group-hover:opacity-90"
              style={{ color: brandColor }}
            >
              {brandName}
            </div>
            <div className="text-[10px] tracking-[2px] uppercase" style={{ color: taglineColor }}>
              {brandTagline}
            </div>
          </div>
        </Link>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center gap-1">
          {LINKS.map((link, i) => {
            const isPill = false
            return (
            <a
              key={i}
              href={link.href}
              onClick={(e) => {
                if (link.href.startsWith("#") || link.href.startsWith("/")) {
                  e.preventDefault()
                  handleNavClick(link.href)
                }
              }}
              className={cn(
                isPill
                  ? "mx-1 flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] transition-all hover:opacity-95"
                  : "relative flex items-center gap-1.5 px-4 py-2 text-[13px] font-semibold uppercase tracking-wide transition-colors",
                !isPill && "after:absolute after:bottom-0 after:left-4 after:right-4 after:h-0.5 after:bg-primary after:scale-x-0 after:origin-left after:transition-transform hover:after:scale-x-100"
              )}
              style={
                isPill
                  ? {
                      color: primaryButtonTextColor,
                      backgroundColor: primaryButtonColor,
                      borderColor: primaryButtonColor,
                    }
                  : { color: linkColor }
              }
              onMouseEnter={(event) => {
                if (isPill) return
                event.currentTarget.style.color = linkHoverColor
              }}
              onMouseLeave={(event) => {
                if (isPill) return
                event.currentTarget.style.color = linkColor
              }}
            >
              {link.label}
              {link.badge && (
                <span
                  className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                  style={{ backgroundColor: primaryButtonColor, color: primaryButtonTextColor }}
                >
                  {link.badge}
                </span>
              )}
            </a>
          )})}
        </div>

        {/* CTA Buttons / User Menu */}
        <div className="hidden lg:flex items-center gap-2.5">
          {showAuthenticatedUser ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                  <User className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold text-foreground">{user.name}</div>
                  <div className="text-[11px] text-muted-foreground capitalize">{user.plan}</div>
                </div>
                <ChevronDown className={cn(
                  "w-4 h-4 text-muted-foreground transition-transform",
                  userMenuOpen && "rotate-180"
                )} />
              </button>

              {userMenuOpen && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-[#111820] border border-border rounded-xl p-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] animate-slide-down">
                  <Link
                    href="/dashboard"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-white transition-all"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span className="text-sm font-medium">Mi Dashboard</span>
                  </Link>
                  {user.role === "admin" && (
                    <Link
                      href="/admin"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-white transition-all"
                    >
                      <Shield className="w-4 h-4" />
                      <span className="text-sm font-medium">Panel Admin</span>
                    </Link>
                  )}
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-white transition-all"
                  >
                    <Settings className="w-4 h-4" />
                    <span className="text-sm font-medium">Configuracion</span>
                  </Link>
                  <div className="h-px bg-border my-2" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span className="text-sm font-medium">Cerrar Sesion</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              <button
                onClick={onLoginClick}
                className="rounded-lg border px-4 py-2 text-[13px] font-semibold transition-all hover:opacity-90"
                style={{
                  backgroundColor: secondaryButtonColor,
                  borderColor: navBorderColor,
                  color: secondaryButtonTextColor,
                }}
              >
                {navConfig.loginLabel}
              </button>
              <button
                onClick={onRegisterClick}
                className="rounded-lg px-5 py-2 text-[13px] font-bold transition-all hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(232,57,42,0.45)]"
                style={{ backgroundColor: primaryButtonColor, color: primaryButtonTextColor }}
              >
                {navConfig.registerLabel}
              </button>
            </>
          )}
        </div>

        {/* Hamburger */}
        <button
          className="lg:hidden flex flex-col gap-1.5 p-2"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <X className="w-6 h-6 text-foreground" />
          ) : (
            <Menu className="w-6 h-6 text-foreground" />
          )}
        </button>
      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="fixed inset-0 z-[99] bg-background/98 backdrop-blur-xl flex flex-col pt-24 px-7 pb-10 animate-fade-in overflow-y-auto">
          {showAuthenticatedUser && (
            <div className="flex items-center gap-3 pb-5 mb-3 border-b border-border">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <User className="w-6 h-6" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">{user.name}</div>
                <div className="text-sm text-muted-foreground capitalize">{user.plan} Plan</div>
              </div>
            </div>
          )}

          {LINKS.map((link, i) => {
            const isPill = false
            return (
            <a
              key={i}
              href={link.href}
              onClick={(e) => {
                e.preventDefault()
                handleNavClick(link.href)
              }}
              className={cn(
                "flex items-center justify-between border-b py-4 text-lg font-semibold transition-colors",
                isPill ? "my-1 rounded-xl px-4" : ""
              )}
              style={{
                color: isPill ? primaryButtonTextColor : linkColor,
                borderColor: navBorderColor,
                backgroundColor: isPill ? primaryButtonColor : "transparent",
              }}
            >
              <span className="flex items-center gap-2">
                {link.label}
                {link.badge && (
                  <span
                    className="rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase"
                    style={{ backgroundColor: primaryButtonColor, color: primaryButtonTextColor }}
                  >
                    {link.badge}
                  </span>
                )}
              </span>
            </a>
          )})}

          <div className="flex flex-col gap-3 mt-7">
            {showAuthenticatedUser ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="w-full py-3.5 bg-primary rounded-xl text-[15px] font-bold text-white text-center hover:bg-[#ff4433] transition-colors flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  Mi Dashboard
                </Link>
                {user.role === "admin" && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="w-full py-3.5 border border-primary rounded-xl text-[15px] font-semibold text-primary text-center hover:bg-primary/10 transition-colors flex items-center justify-center gap-2"
                  >
                    <Shield className="w-5 h-5" />
                    Panel Admin
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    handleLogout()
                  }}
                  className="w-full py-3.5 border border-border rounded-xl text-[15px] font-semibold text-foreground hover:border-destructive hover:text-destructive transition-colors flex items-center justify-center gap-2"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesion
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    onLoginClick?.()
                  }}
                  className="w-full rounded-xl border py-3.5 text-[15px] font-semibold transition-colors"
                  style={{
                    backgroundColor: secondaryButtonColor,
                    borderColor: navBorderColor,
                    color: secondaryButtonTextColor,
                  }}
                >
                  {navConfig.loginLabel}
                </button>
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    onRegisterClick?.()
                  }}
                  className="w-full rounded-xl py-3.5 text-[15px] font-bold transition-colors"
                  style={{ backgroundColor: primaryButtonColor, color: primaryButtonTextColor }}
                >
                  {navConfig.registerLabel}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
