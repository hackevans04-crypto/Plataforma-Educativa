"use client"

import Link from "next/link"
import {
  Users, Target, ClipboardCheck, BookOpen,
  BarChart3, TrendingUp, AlertTriangle, ArrowRight,
  CheckCircle2, Clock
} from "lucide-react"

const STATS = [
  { label: "Usuarios activos", value: "1,284", change: "+8% este mes", icon: Users },
  { label: "Simuladores", value: "42", change: "+3 nuevos", icon: Target },
  { label: "Evaluaciones", value: "18", change: "+2 publicadas", icon: ClipboardCheck },
  { label: "Cursos", value: "36", change: "+5 actualizados", icon: BookOpen },
]

const ACTIVITY = [
  { title: "Se publico el simulador QSM 10 - 2026", time: "Hace 2 horas", status: "ok" },
  { title: "Actualizacion de acceso de usuario aplicada", time: "Hace 5 horas", status: "ok" },
  { title: "Pendiente revision de curso: Curriculo Nacional", time: "Ayer", status: "warn" },
]

const RECENT_USERS = [
  { name: "Maria Fernanda", status: "Activa", progress: 68 },
  { name: "Carlos Andres", status: "En progreso", progress: 22 },
  { name: "Ana Patricia", status: "Destacada", progress: 81 },
]

const QUICK_ACTIONS = [
  { label: "Gestionar usuarios", href: "/admin/usuarios" },
  { label: "Administrar cursos", href: "/admin/cursos" },
  { label: "Clases y actividades", href: "/admin/cursos" },
  { label: "Revisar simuladores", href: "/admin/simuladores" },
]

export function AdminPanel() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl md:text-4xl text-foreground mb-1">
            Panel Administrativo
          </h1>
          <p className="text-muted-foreground">
            Controla el dashboard y el contenido para todos los usuarios.
          </p>
        </div>
        <Link
          href="/admin/reportes"
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white font-semibold rounded-xl hover:bg-[#ff4433] hover:-translate-y-0.5 transition-all"
        >
          <BarChart3 className="w-4 h-4" />
          Ver Reportes
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {STATS.map((stat, i) => (
          <div
            key={i}
            className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
            </div>
            <div className="font-display text-3xl text-foreground mb-1">{stat.value}</div>
            <div className="text-sm text-muted-foreground">{stat.label}</div>
            <div className="text-xs text-green-500 mt-2">{stat.change}</div>
          </div>
        ))}
      </div>

      {/* Main Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-foreground">Actividad Reciente</h2>
            <Link href="/admin/reportes" className="text-sm text-primary font-semibold hover:text-[#ff6b5e] transition-colors flex items-center gap-1">
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="space-y-3">
            {ACTIVITY.map((item, i) => (
              <div
                key={i}
                className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                    item.status === "ok" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                  }`}>
                    {item.status === "ok" ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div className="flex-1">
                    <div className="text-foreground font-semibold">{item.title}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {item.time}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-bold text-foreground mb-4">Acciones Rapidas</h3>
            <div className="flex flex-col gap-2">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="px-4 py-2.5 rounded-lg bg-secondary/50 text-sm font-semibold text-foreground hover:bg-primary hover:text-white transition-colors"
                >
                  {action.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Estado de accesos */}
          <div className="p-5 rounded-xl bg-card border border-border">
            <h3 className="font-bold text-foreground mb-4">Distribucion de accesos</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: "Activos", value: 52, color: "bg-secondary" },
                { label: "En progreso", value: 34, color: "bg-primary" },
                { label: "Completados", value: 14, color: "bg-[#F5C842]" },
              ].map((p) => (
                <div key={p.label}>
                  <div className="flex justify-between text-muted-foreground mb-1">
                    <span>{p.label}</span>
                    <span>{p.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-secondary/40 overflow-hidden">
                    <div className={`h-full ${p.color}`} style={{ width: `${p.value}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Users Snapshot */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 p-5 rounded-xl bg-card border border-border">
          <h3 className="font-bold text-foreground mb-4">Usuarios Recientes</h3>
          <div className="space-y-3">
            {RECENT_USERS.map((u) => (
              <div key={u.name} className="flex items-center justify-between p-3 rounded-lg bg-secondary/40">
                <div>
                  <div className="text-foreground font-semibold">{u.name}</div>
                  <div className="text-xs text-muted-foreground">{u.status}</div>
                </div>
                <div className="w-40">
                  <div className="flex justify-between text-xs text-muted-foreground mb-1">
                    <span>Progreso</span>
                    <span>{u.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${u.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-5 rounded-xl bg-card border border-border">
          <h3 className="font-bold text-foreground mb-4">Estado del Contenido</h3>
          <div className="space-y-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <Target className="w-4 h-4 text-primary" />
              <span>Simuladores activos: 36</span>
            </div>
            <div className="flex items-center gap-3">
              <ClipboardCheck className="w-4 h-4 text-primary" />
              <span>Evaluaciones activas: 18</span>
            </div>
            <div className="flex items-center gap-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <span>Cursos activos: 29</span>
            </div>
            <div className="flex items-center gap-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span>Crecimiento mensual: +8%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
