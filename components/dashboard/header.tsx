"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/theme-toggle"
import CartDrawer from "@/components/cart/CartDrawer"
import { clearCart, getCartEventName, getCartItems, getCartSavings, getCartSubtotal, removeCourseFromCart, type CartCourseItem } from "@/lib/shopping-cart"
import {
  Bell, Search, User, Settings, LogOut, ChevronDown, ShoppingCart,
  BookOpen, CreditCard, Headphones, Heart, Receipt,
} from "lucide-react"

export default function DashboardHeader() {
  const { user, logout, isAuthenticated } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [cartItems, setCartItems] = useState<CartCourseItem[]>([])

  useEffect(() => {
    const syncCart = () => setCartItems(getCartItems())
    syncCart()
    const eventName = getCartEventName()
    window.addEventListener("storage", syncCart)
    window.addEventListener(eventName, syncCart as EventListener)
    window.addEventListener("focus", syncCart)
    return () => {
      window.removeEventListener("storage", syncCart)
      window.removeEventListener(eventName, syncCart as EventListener)
      window.removeEventListener("focus", syncCart)
    }
  }, [])

  const cartSubtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems])
  const cartSavings = useMemo(() => getCartSavings(cartItems), [cartItems])

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-border bg-background/95 px-6 backdrop-blur-sm">
        <div
          className={cn(
            "hidden max-w-md flex-1 items-center gap-2 rounded-xl border px-4 py-2 transition-colors md:flex",
            searchFocused ? "border-primary bg-secondary/60" : "border-transparent bg-secondary/50"
          )}
        >
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar simuladores, cursos..."
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
          <kbd className="hidden rounded border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground lg:inline-flex">
            Ctrl+K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <ThemeToggle scope="dashboard" />

          <button
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-foreground transition-colors hover:border-primary/30 hover:text-primary"
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">Carrito</span>
            {cartItems.length > 0 ? (
              <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {cartItems.length}
              </span>
            ) : null}
          </button>

          <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/50 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground">
            <Bell className="h-5 w-5" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-primary" />
          </button>

          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 rounded-xl py-1.5 pl-2 pr-3 transition-colors hover:bg-secondary/50"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20 text-sm font-bold text-primary">
                {user?.name?.charAt(0) || "U"}
              </div>
              <div className="hidden text-left sm:block">
                <div className="text-sm font-semibold text-foreground">{user?.name}</div>
              </div>
              <ChevronDown
                className={cn("h-4 w-4 text-muted-foreground transition-transform", userMenuOpen && "rotate-180")}
              />
            </button>

            {userMenuOpen ? (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                <div className="animate-slide-down absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
                  {/* Header */}
                  <div className="flex items-center gap-3 border-b border-border px-4 py-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-sm font-black text-primary">
                      {user?.name?.charAt(0) || "U"}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-bold text-foreground">{user?.name}</div>
                      <div className="truncate text-xs text-muted-foreground">{user?.email}</div>
                    </div>
                  </div>
                  {/* Section 1 */}
                  <div className="py-1">
                    {[
                      { icon: BookOpen, label: "Mi aprendizaje", href: "/dashboard/cursos" },
                      { icon: ShoppingCart, label: "Mi cesta", action: () => setCartOpen(true) },
                      { icon: Heart, label: "Lista de deseos", href: "/dashboard/cursos?favoritos=1" },
                    ].map((row) =>
                      row.href ? (
                        <Link
                          key={row.label}
                          href={row.href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                        >
                          <row.icon className="h-4 w-4 text-muted-foreground" />
                          {row.label}
                        </Link>
                      ) : (
                        <button
                          key={row.label}
                          onClick={() => {
                            setUserMenuOpen(false)
                            row.action?.()
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                        >
                          <row.icon className="h-4 w-4 text-muted-foreground" />
                          {row.label}
                          {row.label === "Mi cesta" && cartItems.length > 0 ? (
                            <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white">
                              {cartItems.length}
                            </span>
                          ) : null}
                        </button>
                      )
                    )}
                  </div>
                  <div className="h-px bg-border" />
                  {/* Section 2 - Account */}
                  <div className="py-1">
                    {[
                      { icon: User, label: "Mi perfil", href: "/dashboard/perfil" },
                      { icon: Receipt, label: "Mis pagos", href: "/dashboard/perfil?tab=pagos" },
                      { icon: CreditCard, label: "Metodos de pago", href: "/dashboard/perfil?tab=metodos" },
                      { icon: Headphones, label: "Soporte", href: "/dashboard/soporte" },
                      { icon: Settings, label: "Configuracion", href: "/dashboard/perfil?tab=configuracion" },
                    ].map((row) => (
                      <Link
                        key={row.label}
                        href={row.href}
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary/40"
                      >
                        <row.icon className="h-4 w-4 text-muted-foreground" />
                        {row.label}
                      </Link>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <button
                    onClick={() => {
                      setUserMenuOpen(false)
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
      </header>

      <CartDrawer
        isOpen={cartOpen}
        items={cartItems}
        subtotal={cartSubtotal}
        savings={cartSavings}
        isAuthenticated={isAuthenticated}
        onClose={() => setCartOpen(false)}
        onRemove={(courseId) => removeCourseFromCart(courseId)}
        onClear={() => clearCart()}
      />
    </>
  )
}
