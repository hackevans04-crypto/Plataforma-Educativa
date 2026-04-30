"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import {
  LayoutDashboard, Users, BookOpen,
  BarChart3, ChevronLeft, Menu, Shield, LayoutTemplate, Layers, Target,
  CreditCard, Headphones,
} from "lucide-react"

const NAV_ITEMS = [
  { icon: LayoutDashboard, label: "Resumen", href: "/admin" },
  { icon: Users, label: "Usuarios", href: "/admin/usuarios" },
  { icon: BookOpen, label: "Cursos", href: "/admin/cursos" },
  { icon: Target, label: "Simuladores", href: "/admin/simuladores" },
  { icon: Layers, label: "Categorías", href: "/admin/categorias" },
  { icon: CreditCard, label: "Pagos", href: "/admin/pagos" },
  { icon: Headphones, label: "Soporte", href: "/admin/soporte" },
  { icon: BarChart3, label: "Reportes", href: "/admin/reportes" },
  { icon: LayoutTemplate, label: "Landing Page", href: "/studio", external: true },
]

export default function AdminSidebar() {
  const pathname = usePathname()
  const { user } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-4 left-4 z-50 w-10 h-10 rounded-lg bg-card border border-border flex items-center justify-center text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/60 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full bg-card border-r border-border z-50 transition-all duration-300 flex flex-col",
          collapsed ? "w-20" : "w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div className={cn(
          "flex items-center gap-3 h-16 px-4 border-b border-border",
          collapsed && "justify-center"
        )}>
          <Link href="/admin" className="flex items-center gap-3 h-full">
            <Image src="/images/logo.png" alt="Hack Evans" width={40} height={40} />
            {!collapsed && (
              <div>
                <div className="font-display text-xl text-foreground">Hack Evans</div>
                <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Admin</div>
              </div>
            )}
          </Link>
        </div>

        {/* Admin Info */}
        <div className={cn(
          "p-4 border-b border-border",
          collapsed && "flex justify-center"
        )}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
              {user?.name?.charAt(0) || "A"}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-foreground truncate">{user?.name || "Administrador"}</div>
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-xs text-muted-foreground">Panel Administrativo</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = !item.external && (pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href)))
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                  isActive
                    ? "bg-primary/15 text-primary"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground",
                  collapsed && "justify-center"
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Bottom Items removed to avoid duplication */}

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-card border border-border items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </aside>
    </>
  )
}
