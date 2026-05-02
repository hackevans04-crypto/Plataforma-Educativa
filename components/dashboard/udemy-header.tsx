"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Bell,
  BookOpen,
  ChevronDown,
  CreditCard,
  Headphones,
  Heart,
  LogOut,
  Receipt,
  Search,
  Settings,
  ShoppingCart,
  Shield,
  Sparkles,
  Target,
  User,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  clearCart,
  getCartEventName,
  getCartItems,
  getCartSavings,
  getCartSubtotal,
  removeCourseFromCart,
  type CartCourseItem,
} from "@/lib/shopping-cart"
import CartDrawer from "@/components/cart/CartDrawer"
import ThemeToggle from "@/components/theme-toggle"
import { CATEGORIAS_EVENT, getCategorias, type Categoria } from "@/lib/categorias"

export default function UdemyHeader() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [items, setItems] = useState<CartCourseItem[]>([])
  const [search, setSearch] = useState("")
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [openCat, setOpenCat] = useState<string | null>(null)
  const [activeCategoria, setActiveCategoria] = useState("")

  useEffect(() => {
    const sync = () => setItems(getCartItems())
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener(getCartEventName(), sync as EventListener)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener(getCartEventName(), sync as EventListener)
      window.removeEventListener("focus", sync)
    }
  }, [])

  useEffect(() => {
    const syncCats = () => setCategorias(getCategorias().filter((cat) => cat.activa !== false))
    syncCats()
    window.addEventListener(CATEGORIAS_EVENT, syncCats as EventListener)
    window.addEventListener("storage", syncCats)
    window.addEventListener("focus", syncCats)
    return () => {
      window.removeEventListener(CATEGORIAS_EVENT, syncCats as EventListener)
      window.removeEventListener("storage", syncCats)
      window.removeEventListener("focus", syncCats)
    }
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    setActiveCategoria(new URLSearchParams(window.location.search).get("categoria") || "")
  }, [pathname])

  const subtotal = useMemo(() => getCartSubtotal(items), [items])
  const savings = useMemo(() => getCartSavings(items), [items])

  const handleSearch = (event: React.FormEvent) => {
    event.preventDefault()
    if (!search.trim()) return
    window.location.href = `/dashboard/cursos?q=${encodeURIComponent(search.trim())}`
  }

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur-xl">
        {/* Main row */}
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-4 py-3 lg:gap-5 lg:px-6">
          {/* Logo */}
          <Link href="/dashboard" className="flex shrink-0 items-center gap-2">
            <Image src="/images/logo.png" alt="Hack Evans" width={36} height={36} />
            <span className="hidden font-display text-xl text-foreground md:block">Hack Evans</span>
          </Link>

          {/* Quick links */}
          <nav className="hidden items-center gap-1 text-sm font-bold lg:flex">
            <Link
              href="/dashboard/cursos"
              className={`rounded-lg px-3 py-2 transition-colors ${
                pathname?.startsWith("/dashboard/cursos")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Explorar
            </Link>
            <Link
              href="/dashboard/simuladores"
              className={`rounded-lg px-3 py-2 transition-colors ${
                pathname?.startsWith("/dashboard/simuladores")
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Simuladores
            </Link>
            <MiAprendizajeMenu />
          </nav>

          {/* Search */}
          <form onSubmit={handleSearch} className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar cursos, simuladores o categorias..."
              className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
            />
          </form>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1">
            <ThemeToggle scope="dashboard" />
            <Link
              href="/dashboard/cursos?favoritos=1"
              aria-label="Lista de deseos"
              className="hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:inline-flex"
            >
              <Heart className="h-5 w-5" />
            </Link>
            <button
              onClick={() => setCartOpen(true)}
              aria-label="Carrito"
              className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ShoppingCart className="h-5 w-5" />
              {items.length > 0 ? (
                <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                  {items.length}
                </span>
              ) : null}
            </button>
            <NotificationsBell />

            {/* Avatar / dropdown */}
            <div className="relative ml-1">
              <button
                onClick={() => setMenuOpen((current) => !current)}
                aria-label="Mi cuenta"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-sm font-black text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)] transition-transform hover:scale-105"
              >
                {user?.name?.charAt(0)?.toUpperCase() || "U"}
              </button>

              {menuOpen ? (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                  <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                    <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                        {user?.name?.charAt(0) || "U"}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{user?.name}</div>
                        <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                      </div>
                    </div>
                    <div className="py-1">
                      {[
                        { icon: BookOpen, label: "Mi aprendizaje", href: "/dashboard/cursos" },
                        { icon: Heart, label: "Lista de deseos", href: "/dashboard/cursos?favoritos=1" },
                      ].map((row) => (
                        <Link
                          key={row.label}
                          href={row.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                        >
                          <row.icon className="h-4 w-4 text-muted-foreground" />
                          {row.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => {
                          setMenuOpen(false)
                          setCartOpen(true)
                        }}
                        className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                      >
                        <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                        Mi cesta
                        {items.length > 0 ? (
                          <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                            {items.length}
                          </span>
                        ) : null}
                      </button>
                    </div>
                    <div className="h-px bg-border" />
                    <div className="py-1">
                      {[
                        { icon: User, label: "Editar perfil", href: "/dashboard/perfil?tab=perfil" },
                        { icon: Receipt, label: "Historial de compras", href: "/dashboard/perfil?tab=compras" },
                        { icon: CreditCard, label: "Metodos de pago", href: "/dashboard/perfil?tab=metodos" },
                        { icon: Settings, label: "Configuracion", href: "/dashboard/perfil?tab=configuracion" },
                      ].map((row) => (
                        <Link
                          key={row.label}
                          href={row.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                        >
                          <row.icon className="h-4 w-4 text-muted-foreground" />
                          {row.label}
                        </Link>
                      ))}
                    </div>
                    {user?.role === "admin" ? (
                      <>
                        <div className="h-px bg-border" />
                        <Link
                          href="/admin"
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                        >
                          <Shield className="h-4 w-4 text-primary" />
                          Panel admin
                        </Link>
                      </>
                    ) : null}
                    <div className="h-px bg-border" />
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        logout()
                      }}
                      className="flex w-full items-center gap-3 px-4 py-3 text-sm text-destructive transition-colors hover:bg-destructive/10"
                    >
                      <LogOut className="h-4 w-4" />
                      Cerrar sesion
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>

        {/* Categories bar — dynamic from admin */}
        {categorias.length > 0 ? (
          <div className="border-t border-border bg-card/40">
            <div className="mx-auto max-w-[1500px] px-2 lg:px-4">
              <div
                className="scrollbar-hide flex items-center gap-1 overflow-x-auto"
                onMouseLeave={() => setOpenCat(null)}
              >
                {categorias.map((cat) => {
                  const active = activeCategoria === cat.nombre
                  const hasSubs = (cat.subcategorias?.length ?? 0) > 0
                  return (
                    <div
                      key={cat.id}
                      className="relative shrink-0"
                      onMouseEnter={() => hasSubs && setOpenCat(cat.id)}
                    >
                      <Link
                        href={`/dashboard/cursos?categoria=${encodeURIComponent(cat.nombre)}`}
                        className={`relative inline-flex items-center gap-1.5 px-4 py-3 text-sm font-bold transition-colors ${
                          active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span style={{ color: cat.color }} className="inline-block h-1.5 w-1.5 rounded-full" />
                        {cat.nombre}
                        {hasSubs ? <ChevronDown className="h-3 w-3" /> : null}
                        {active ? (
                          <span className="absolute inset-x-3 bottom-0 h-[2px] rounded-full bg-primary" />
                        ) : null}
                      </Link>

                      {hasSubs && openCat === cat.id ? (
                        <div className="absolute left-0 top-full z-50 min-w-[240px] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                          <div className="border-b border-border bg-secondary/20 px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <span
                                className="inline-block h-2 w-2 rounded-full"
                                style={{ background: cat.color }}
                              />
                              <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                                {cat.nombre}
                              </span>
                            </div>
                            {cat.descripcion ? (
                              <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{cat.descripcion}</p>
                            ) : null}
                          </div>
                          <div className="max-h-[320px] overflow-y-auto py-1">
                            <Link
                              href={`/dashboard/cursos?categoria=${encodeURIComponent(cat.nombre)}`}
                              onClick={() => setOpenCat(null)}
                              className="block px-4 py-2 text-sm font-bold text-primary hover:bg-primary/10"
                            >
                              Ver toda la categoria
                            </Link>
                            <div className="my-1 h-px bg-border" />
                            {cat.subcategorias!.map((sub) => (
                              <Link
                                key={sub.id}
                                href={`/dashboard/cursos?categoria=${encodeURIComponent(cat.nombre)}&sub=${encodeURIComponent(sub.nombre)}`}
                                onClick={() => setOpenCat(null)}
                                className="block px-4 py-2 text-sm text-foreground transition-colors hover:bg-secondary/40 hover:text-primary"
                              >
                                {sub.nombre}
                              </Link>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )
                })}
                <Link
                  href="/dashboard/simuladores"
                  className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5 text-[11px] font-bold text-primary hover:bg-primary/15"
                >
                  <Target className="h-3 w-3" />
                  Simuladores
                </Link>
              </div>
            </div>
          </div>
        ) : null}
      </header>

      <CartDrawer
        isOpen={cartOpen}
        items={items}
        subtotal={subtotal}
        savings={savings}
        isAuthenticated
        onClose={() => setCartOpen(false)}
        onRemove={(courseId) => removeCourseFromCart(courseId)}
        onClear={() => clearCart()}
      />
    </>
  )
}

function NotificationsBell() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<{ id: string; kind: string; title: string; body: string; href?: string; createdAt: string; read: boolean }[]>([])

  useEffect(() => {
    if (!user) return
    const sync = async () => {
      const { getUserNotifications, USER_NOTIF_EVENT, PROMO_EVENT } = await import("@/lib/user-notifications")
      const enrolled = (() => {
        try {
          if (typeof window === "undefined") return new Set<string>()
          const list = JSON.parse(window.localStorage.getItem("he_matriculas") || "[]") as Array<{ userId: string; cursoId: string }>
          return new Set(list.filter((e) => e.userId === user.id).map((e) => e.cursoId))
        } catch {
          return new Set<string>()
        }
      })()
      setItems(getUserNotifications(user.id, enrolled))
      void USER_NOTIF_EVENT
      void PROMO_EVENT
    }
    sync()
    if (typeof window === "undefined") return
    const handler = () => sync()
    window.addEventListener("he-user-notifs-updated", handler)
    window.addEventListener("he-promo-updated", handler)
    window.addEventListener("he-support-updated", handler)
    window.addEventListener("he-course-feedback-updated", handler)
    window.addEventListener("storage", handler)
    return () => {
      window.removeEventListener("he-user-notifs-updated", handler)
      window.removeEventListener("he-promo-updated", handler)
      window.removeEventListener("he-support-updated", handler)
      window.removeEventListener("he-course-feedback-updated", handler)
      window.removeEventListener("storage", handler)
    }
  }, [user])

  if (!user) return null
  const unread = items.filter((i) => !i.read).length

  const handleOpen = () => setOpen((v) => !v)
  const handleClick = async (id: string, href?: string) => {
    if (!user) return
    const { markUserNotificationRead } = await import("@/lib/user-notifications")
    markUserNotificationRead(user.id, id)
    setOpen(false)
    if (href) window.location.href = href
  }
  const markAll = async () => {
    if (!user) return
    const { markAllUserNotificationsRead } = await import("@/lib/user-notifications")
    markAllUserNotificationsRead(
      user.id,
      items.map((i) => i.id),
    )
  }

  return (
    <div className="relative hidden md:inline-block">
      <button
        onClick={handleOpen}
        aria-label="Notificaciones"
        className="relative rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        <Bell className="h-5 w-5" />
        {unread > 0 ? (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-black text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-96 max-h-[28rem] overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <div>
                <p className="text-sm font-bold text-foreground">Notificaciones</p>
                <p className="text-[11px] text-muted-foreground">{unread === 0 ? "Sin novedades" : `${unread} sin leer`}</p>
              </div>
              {unread > 0 ? (
                <button
                  onClick={markAll}
                  className="rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-bold text-foreground hover:border-primary/40"
                >
                  Marcar todas
                </button>
              ) : null}
            </div>
            <div className="max-h-80 overflow-y-auto">
              {items.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  Aún no tienes notificaciones.
                </div>
              ) : (
                items.map((entry) => (
                  <button
                    key={entry.id}
                    onClick={() => handleClick(entry.id, entry.href)}
                    className={`block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/40 ${
                      !entry.read ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {!entry.read ? (
                        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                      ) : (
                        <span className="mt-1.5 h-2 w-2 shrink-0" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-foreground">{entry.title}</p>
                        <p className="line-clamp-2 text-xs text-muted-foreground">{entry.body}</p>
                        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                          {entry.kind === "support_reply" ? "Soporte" : entry.kind === "announcement" ? "Curso" : "Oferta"}
                          {" · "}
                          {new Date(entry.createdAt).toLocaleString("es-EC")}
                        </p>
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  )
}

type MiAprendizajeCourse = {
  id: string
  titulo: string
  imagen: string
  progreso: number
}

function MiAprendizajeMenu() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [courses, setCourses] = useState<MiAprendizajeCourse[]>([])
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const sync = () => {
      if (typeof window === "undefined" || !user) return setCourses([])
      try {
        const allCourses = JSON.parse(window.localStorage.getItem("he_cursos") || "[]") as Array<{
          id: string
          titulo: string
          portadaImagen?: string
        }>
        const enrollments = JSON.parse(window.localStorage.getItem("he_matriculas") || "[]") as Array<{
          userId: string
          cursoId: string
          progreso?: number
        }>
        const mine = enrollments
          .filter((entry) => entry.userId === user.id)
          .map((entry) => {
            const course = allCourses.find((c) => c.id === entry.cursoId)
            if (!course) return null
            return {
              id: course.id,
              titulo: course.titulo,
              imagen: course.portadaImagen || "/placeholder.jpg",
              progreso: Number(entry.progreso || 0),
            }
          })
          .filter(Boolean) as MiAprendizajeCourse[]
        setCourses(mine.slice(0, 6))
      } catch {
        setCourses([])
      }
    }
    sync()
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
    }
  }, [user])

  const handleEnter = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const handleLeave = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setOpen(false), 180)
  }

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <Link
        href="/dashboard/cursos?vista=mis-cursos"
        className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
      >
        Mi aprendizaje
      </Link>
      {open ? (
        <div className="absolute right-0 top-full z-50 w-80 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          {courses.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              Aun no tienes cursos en tu aprendizaje.
              <Link
                href="/dashboard/cursos"
                className="mt-3 block rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
              >
                Explorar cursos
              </Link>
            </div>
          ) : (
            <>
              <div className="max-h-80 overflow-y-auto py-1">
                {courses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/dashboard/cursos?course=${encodeURIComponent(course.id)}`}
                    className="flex items-start gap-3 px-3 py-2.5 transition-colors hover:bg-secondary/40"
                  >
                    <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-md bg-secondary">
                      <Image src={course.imagen} alt={course.titulo} fill className="object-cover" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-xs font-bold leading-snug text-foreground">{course.titulo}</p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                        {course.progreso > 0 ? `Continuar · ${course.progreso}%` : "Empieza a aprender"}
                      </p>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${Math.max(2, Math.min(course.progreso, 100))}%` }}
                        />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/dashboard/cursos?vista=mis-cursos"
                className="block border-t border-border bg-secondary/15 px-4 py-3 text-center text-xs font-black uppercase tracking-[0.14em] text-primary hover:bg-secondary/30"
              >
                Ir a mi aprendizaje
              </Link>
            </>
          )}
        </div>
      ) : null}
    </div>
  )
}
