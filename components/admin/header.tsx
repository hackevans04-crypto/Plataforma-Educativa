"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/theme-toggle"
import { Bell, Search, User, Settings, LogOut, ChevronDown } from "lucide-react"

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)

  return (
    <header className="sticky top-0 z-30 h-16 bg-background/95 backdrop-blur-sm border-b border-border px-6 flex items-center justify-between gap-4">
      {/* Search */}
      <div className={cn(
        "hidden md:flex items-center gap-2 flex-1 max-w-md px-4 py-2 rounded-xl bg-secondary/50 border transition-colors",
        searchFocused ? "border-primary" : "border-transparent"
      )}>
        <Search className="w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Buscar usuarios, cursos, simuladores..."
          className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3 ml-auto">
        <ThemeToggle scope="admin" />
        <button className="relative w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* User Menu */}
        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden sm:block text-left">
              <div className="text-sm font-semibold text-foreground">{user?.name || "Administrador"}</div>
            </div>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              userMenuOpen && "rotate-180"
            )} />
          </button>

          {userMenuOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setUserMenuOpen(false)}
              />
              <div className="absolute top-full right-0 mt-2 w-56 bg-card border border-border rounded-xl p-2 shadow-xl z-50 animate-slide-down">
                <div className="px-3 py-2 mb-2 border-b border-border">
                  <div className="font-semibold text-foreground">{user?.name || "Administrador"}</div>
                  <div className="text-xs text-muted-foreground">{user?.email || "admin@hackevans.com"}</div>
                </div>
                <Link
                  href="/admin"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-sm"
                >
                  <User className="w-4 h-4" />
                  Perfil Admin
                </Link>
                <Link
                  href="/admin/configuracion"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-all text-sm"
                >
                  <Settings className="w-4 h-4" />
                  Configuracion
                </Link>
                <div className="h-px bg-border my-2" />
                <button
                  onClick={() => {
                    setUserMenuOpen(false)
                    logout()
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-destructive hover:bg-destructive/10 transition-all text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  Cerrar Sesion
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
