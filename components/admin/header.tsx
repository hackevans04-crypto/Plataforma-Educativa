"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import ThemeToggle from "@/components/theme-toggle"
import { Bell, Search, User, Settings, LogOut, ChevronDown, CheckCheck } from "lucide-react"
import {
  type AdminNotification,
  getAdminNotifications,
  getAdminNotificationsEventName,
  markAdminNotificationRead,
  markAllAdminNotificationsRead,
} from "@/lib/payments"

function formatRelative(iso: string) {
  try {
    const date = new Date(iso)
    const diff = Date.now() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    if (minutes < 1) return "Ahora"
    if (minutes < 60) return `Hace ${minutes} min`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `Hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `Hace ${days}d`
  } catch {
    return iso
  }
}

export default function AdminHeader() {
  const { user, logout } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchFocused, setSearchFocused] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<AdminNotification[]>([])

  useEffect(() => {
    const sync = () => setNotifications(getAdminNotifications())
    sync()
    window.addEventListener(getAdminNotificationsEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getAdminNotificationsEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [])

  const unreadCount = useMemo(() => notifications.filter((entry) => !entry.read).length, [notifications])

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
        <div className="relative">
          <button
            onClick={() => setNotifOpen((v) => !v)}
            className="relative w-10 h-10 rounded-xl bg-secondary/50 hover:bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-black text-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            ) : null}
          </button>
          {notifOpen ? (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
              <div className="absolute top-full right-0 mt-2 w-96 max-h-[28rem] flex flex-col overflow-hidden bg-card border border-border rounded-xl shadow-xl z-50">
                <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border">
                  <div>
                    <div className="text-sm font-bold text-foreground">Notificaciones</div>
                    <div className="text-[11px] text-muted-foreground">
                      {unreadCount === 0 ? "Sin novedades" : `${unreadCount} sin leer`}
                    </div>
                  </div>
                  {unreadCount > 0 ? (
                    <button
                      onClick={() => markAllAdminNotificationsRead()}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/40 px-2.5 py-1 text-[11px] font-bold text-foreground hover:border-primary/40"
                    >
                      <CheckCheck className="h-3 w-3" />
                      Marcar todas
                    </button>
                  ) : null}
                </div>
                <div className="flex-1 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                      Aun no tienes notificaciones.
                    </div>
                  ) : (
                    notifications.map((entry) => {
                      const Wrapper: React.ElementType = entry.href ? Link : "div"
                      const wrapperProps: Record<string, unknown> = entry.href
                        ? { href: entry.href, onClick: () => { markAdminNotificationRead(entry.id); setNotifOpen(false) } }
                        : { onClick: () => markAdminNotificationRead(entry.id) }
                      return (
                        <Wrapper
                          key={entry.id}
                          {...wrapperProps}
                          className={cn(
                            "block border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/40",
                            !entry.read && "bg-primary/5",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {!entry.read ? (
                              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                            ) : (
                              <span className="mt-1.5 h-2 w-2 shrink-0" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-bold text-foreground">{entry.title}</div>
                              <div className="text-xs text-muted-foreground line-clamp-2">{entry.body}</div>
                              <div className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                                {formatRelative(entry.createdAt)}
                              </div>
                            </div>
                          </div>
                        </Wrapper>
                      )
                    })
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>

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
