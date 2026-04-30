"use client"

import { useEffect, useMemo, useState } from "react"
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
            <Link
              href="/dashboard/cursos?vista=mis-cursos"
              className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              Mi aprendizaje
            </Link>
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
            <button
              aria-label="Notificaciones"
              className="relative hidden rounded-full p-2.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground md:inline-flex"
            >
              <Bell className="h-5 w-5" />
            </button>

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
                        { icon: Headphones, label: "Soporte", href: "/dashboard/soporte" },
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
