"use client"

import { useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  ArrowRight,
  ShoppingCart,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Shield,
  User,
  X,
} from "lucide-react"
import { useCMS, type CMSConfig } from "@/hooks/use-cms"

interface NavbarProps {
  onLoginClick?: () => void
  onRegisterClick?: () => void
  onNavigate?: (section: string) => void
  onPreviewNavigate?: (href: string) => void
  previewMode?: boolean
  hideAuthenticatedUserMenu?: boolean
  navOverride?: CMSConfig["nav"]
  pageLinksOverride?: CMSConfig["pages"]
  generalOverride?: CMSConfig["general"]
  showCartButton?: boolean
  cartCount?: number
  cartSubtotal?: number
  onCartClick?: () => void
}

export default function Navbar({
  onLoginClick,
  onRegisterClick,
  onNavigate,
  onPreviewNavigate,
  previewMode = false,
  hideAuthenticatedUserMenu = false,
  navOverride,
  pageLinksOverride,
  generalOverride,
  showCartButton = false,
  cartCount = 0,
  cartSubtotal = 0,
  onCartClick,
}: NavbarProps) {
  const pathname = usePathname()
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
  const navFontFamily = navAppearance.fontFamily || "'Space Grotesk', var(--font-barlow), sans-serif"
  const navFontSize = navAppearance.fontSize || "12px"
  const navFontWeight = navAppearance.fontWeight || "600"
  const navLetterSpacing = navAppearance.letterSpacing || "0.02em"
  const navSurfaceColor = navAppearance.surfaceColor || "rgba(8, 12, 22, 0.78)"
  const navBorderColor = navAppearance.borderColor || "rgba(148, 163, 184, 0.14)"
  const brandColor = navAppearance.brandColor || "#f8fbff"
  const taglineColor = navAppearance.taglineColor || "#8ea3ba"
  const linkColor = navAppearance.linkColor || "#a8bdd2"
  const linkHoverColor = navAppearance.linkHoverColor || "#ffffff"
  const primaryButtonColor = navAppearance.primaryButtonColor || "#E8392A"
  const primaryButtonTextColor = navAppearance.primaryButtonTextColor || "#ffffff"
  const secondaryButtonColor = navAppearance.secondaryButtonColor || "rgba(255,255,255,0.04)"
  const secondaryButtonTextColor = navAppearance.secondaryButtonTextColor || "#f8fbff"
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
  const showAuthenticatedUser =
    !previewMode && !hideAuthenticatedUserMenu && isAuthenticated && user

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 24)
    handleScroll()
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : ""
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  const isActiveLink = (href: string) => {
    if (previewMode || href.startsWith("#")) return false
    if (href === "/") return pathname === "/"
    return pathname === href || pathname.startsWith(`${href}/`)
  }

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

  const frameStyle = {
    backgroundColor: navSurfaceColor,
    borderColor: navBorderColor,
    fontFamily: navFontFamily,
  }

  return (
    <>
      <div className="sticky top-0 z-[110] px-3 pt-2.5 md:px-4">
        <nav
          className={cn(
            "mx-auto flex max-w-[1380px] items-center gap-3 rounded-[24px] border px-3 py-2.5 backdrop-blur-2xl transition-all duration-300 md:px-4",
            scrolled
              ? "shadow-[0_24px_80px_rgba(0,0,0,0.42)]"
              : "shadow-[0_12px_38px_rgba(0,0,0,0.24)]"
          )}
          style={frameStyle}
        >
          <Link
            href="/"
            onClick={(event) => {
              if (previewMode && onPreviewNavigate) {
                event.preventDefault()
                setMobileOpen(false)
                onPreviewNavigate("/")
              }
            }}
            className="group flex min-w-0 items-center gap-2.5"
          >
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-[18px] border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="absolute inset-0 rounded-[18px] bg-[radial-gradient(circle_at_top,rgba(232,57,42,0.2),transparent_65%)] opacity-80 transition-opacity group-hover:opacity-100" />
              <Image
                src="/images/logo.png"
                alt={`${brandName} Logo`}
                width={28}
                height={28}
                className="relative transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div className="min-w-0 max-w-[280px]">
              <div
                className="truncate text-[1.05rem] font-semibold tracking-[-0.03em] transition-opacity group-hover:opacity-95"
                style={{ color: brandColor, fontFamily: "'Outfit', var(--font-barlow), sans-serif" }}
              >
                {brandName}
              </div>
              <div
                className="hidden truncate text-[0.56rem] font-medium uppercase tracking-[0.22em] xl:block"
                style={{ color: taglineColor }}
              >
                {brandTagline}
              </div>
            </div>
          </Link>

          <div className="hidden flex-1 items-center justify-center lg:flex">
            <div className="flex items-center gap-0.5 rounded-full border border-white/8 bg-[#09111f]/78 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
              {LINKS.map((link) => {
                const active = isActiveLink(link.href)
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(event) => {
                      if (link.href.startsWith("#") || link.href.startsWith("/") || /^https?:\/\//i.test(link.href)) {
                        event.preventDefault()
                        handleNavClick(link.href)
                      }
                    }}
                    className={cn(
                      "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-3 py-2 text-[12px] leading-none transition-all duration-300 xl:px-3.5",
                      active
                        ? "bg-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                        : "hover:bg-white/[0.05]"
                    )}
                    style={{
                      color: active ? linkHoverColor : linkColor,
                      fontSize: navFontSize,
                      fontWeight: navFontWeight,
                      letterSpacing: navLetterSpacing,
                    }}
                  >
                    <span>{link.label}</span>
                    {link.badge ? (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em]",
                          active ? "bg-white/10" : "bg-primary/15"
                        )}
                        style={{
                          color: active ? "#ffffff" : primaryButtonColor,
                        }}
                      >
                        {link.badge}
                      </span>
                    ) : null}
                  </a>
                )
              })}
            </div>
          </div>

          <div className="ml-auto hidden items-center gap-2.5 lg:flex">
            {showCartButton ? (
              <button
                onClick={onCartClick}
                className="group relative inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1523] px-3.5 py-2 text-[13px] font-semibold text-white transition-all hover:border-[#ff7b47]/40"
              >
                <ShoppingCart className="h-4 w-4 text-[#ff7b47]" />
                <span>Carrito</span>
                {cartCount > 0 ? (
                  <>
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-[#ffcfb8]">
                      ${cartSubtotal.toFixed(2)}
                    </span>
                    <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-[#ff6b3d] px-1 text-[11px] font-bold text-white">
                      {cartCount}
                    </span>
                  </>
                ) : null}
              </button>
            ) : null}

            {showAuthenticatedUser ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen((value) => !value)}
                  className="flex items-center gap-3 rounded-[22px] border border-white/8 bg-[#09111f]/75 px-3 py-2.5 transition-all hover:border-primary/30 hover:bg-[#0c1729]"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <div className="text-left">
                    <div className="text-sm font-semibold text-foreground">{user.name}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-white/45 transition-transform",
                      userMenuOpen && "rotate-180"
                    )}
                  />
                </button>

                {userMenuOpen ? (
                  <div className="absolute right-0 top-full z-40 mt-3 w-64 rounded-[24px] border border-white/10 bg-[#09111f]/96 p-2 shadow-[0_28px_70px_rgba(0,0,0,0.48)] backdrop-blur-2xl">
                    <Link
                      href="/dashboard"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:text-white"
                    >
                      <LayoutDashboard className="h-4 w-4 text-primary" />
                      Mi Dashboard
                    </Link>
                    {user.role === "admin" ? (
                      <Link
                        href="/admin"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:text-white"
                      >
                        <Shield className="h-4 w-4 text-primary" />
                        Panel Admin
                      </Link>
                    ) : null}
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-white/70 transition-all hover:bg-white/[0.05] hover:text-white"
                    >
                      <Settings className="h-4 w-4 text-primary" />
                      Configuracion
                    </Link>
                    <div className="my-2 h-px bg-white/8" />
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium text-[#ff9b90] transition-all hover:bg-primary/10 hover:text-white"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar Sesion
                    </button>
                  </div>
                ) : null}
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="rounded-full border px-4 py-2 text-[13px] font-semibold transition-all hover:border-primary/30 hover:bg-white/[0.04]"
                  style={{
                    backgroundColor: secondaryButtonColor,
                    borderColor: navBorderColor,
                    color: secondaryButtonTextColor,
                    fontFamily: navFontFamily,
                  }}
                >
                  {navConfig.loginLabel}
                </button>
                <button
                  onClick={onRegisterClick}
                  className="inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13px] font-semibold transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(232,57,42,0.35)]"
                  style={{
                    background: `linear-gradient(135deg, ${primaryButtonColor} 0%, #ff6b5e 100%)`,
                    color: primaryButtonTextColor,
                    fontFamily: navFontFamily,
                  }}
                >
                  {navConfig.registerLabel}
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>

          <button
            className="ml-auto inline-flex h-10 w-10 items-center justify-center rounded-[18px] border border-white/8 bg-[#09111f]/76 text-white lg:hidden"
            onClick={() => setMobileOpen((value) => !value)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </nav>
      </div>

      {mobileOpen ? (
        <div className="fixed inset-0 z-[105] bg-[linear-gradient(180deg,rgba(6,10,19,0.98),rgba(8,13,24,0.98))] px-5 pb-8 pt-24 backdrop-blur-2xl lg:hidden">
          <div className="mx-auto flex h-full max-w-xl flex-col">
            {showAuthenticatedUser ? (
              <div className="mb-6 rounded-[28px] border border-white/10 bg-[#09111f]/82 p-5">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-[20px] bg-primary/12 text-primary">
                    <User className="h-7 w-7" />
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-white">{user.name}</div>
                    <div className="text-xs uppercase tracking-[0.18em] text-white/45">Mi cuenta</div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
              {LINKS.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(event) => {
                    event.preventDefault()
                    handleNavClick(link.href)
                  }}
                  className={cn(
                    "flex items-center justify-between rounded-[24px] border px-5 py-4 transition-all",
                    isActiveLink(link.href)
                      ? "border-primary/30 bg-primary/12 text-white"
                      : "border-white/8 bg-[#09111f]/82 text-white/70"
                  )}
                >
                  <span className="text-base font-semibold">{link.label}</span>
                  {link.badge ? (
                    <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      {link.badge}
                    </span>
                  ) : (
                    <ArrowRight className="h-4 w-4 text-white/35" />
                  )}
                </a>
              ))}
            </div>

            <div className="mt-6 space-y-3">
              {showCartButton ? (
                <button
                  onClick={() => {
                    setMobileOpen(false)
                    onCartClick?.()
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[#0c1523] px-5 py-3.5 text-sm font-semibold text-white"
                >
                  <ShoppingCart className="h-4 w-4 text-[#ff7b47]" />
                  <span>Carrito</span>
                  {cartCount > 0 ? (
                    <span className="rounded-full bg-[#ff6b3d] px-2 py-0.5 text-[11px] font-bold text-white">
                      {cartCount}
                    </span>
                  ) : null}
                </button>
              ) : null}

              {showAuthenticatedUser ? (
                <>
                  <Link
                    href="/dashboard"
                    onClick={() => setMobileOpen(false)}
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-3.5 text-sm font-semibold text-white"
                  >
                    <LayoutDashboard className="h-4 w-4" />
                    Mi Dashboard
                  </Link>
                  {user.role === "admin" ? (
                    <Link
                      href="/admin"
                      onClick={() => setMobileOpen(false)}
                      className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[#09111f]/82 px-5 py-3.5 text-sm font-semibold text-white/80"
                    >
                      <Shield className="h-4 w-4 text-primary" />
                      Panel Admin
                    </Link>
                  ) : null}
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      handleLogout()
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-[#09111f]/82 px-5 py-3.5 text-sm font-semibold text-white/80"
                  >
                    <LogOut className="h-4 w-4 text-primary" />
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
                    className="w-full rounded-full border px-5 py-3.5 text-sm font-semibold"
                    style={{
                      backgroundColor: secondaryButtonColor,
                      borderColor: navBorderColor,
                      color: secondaryButtonTextColor,
                      fontFamily: navFontFamily,
                    }}
                  >
                    {navConfig.loginLabel}
                  </button>
                  <button
                    onClick={() => {
                      setMobileOpen(false)
                      onRegisterClick?.()
                    }}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5 text-sm font-semibold text-white"
                    style={{
                      background: `linear-gradient(135deg, ${primaryButtonColor} 0%, #ff6b5e 100%)`,
                      fontFamily: navFontFamily,
                    }}
                  >
                    {navConfig.registerLabel}
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
