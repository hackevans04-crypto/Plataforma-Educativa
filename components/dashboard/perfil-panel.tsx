"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams, useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  Bell,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  Landmark,
  Lock,
  Mail,
  Moon,
  Pencil,
  Receipt,
  Save,
  Shield,
  Sparkles,
  Trash2,
  Undo2,
  User,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  type PaymentRecord,
  type PaymentStatus,
  getPaymentsEventName,
  getPaymentsForUser,
} from "@/lib/payments"

type TabKey = "perfil" | "pagos" | "metodos" | "configuracion"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "perfil", label: "Mi perfil", icon: User },
  { key: "pagos", label: "Mis pagos", icon: Receipt },
  { key: "metodos", label: "Metodos de pago", icon: CreditCard },
  { key: "configuracion", label: "Configuracion", icon: Shield },
]

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente de validacion",
  verified: "Aprobado · acceso activo",
  rejected: "Rechazado",
  refunded: "Reembolsado",
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "border-amber-500/35 bg-amber-500/10 text-amber-400",
  verified: "border-emerald-500/35 bg-emerald-500/10 text-emerald-400",
  rejected: "border-red-500/35 bg-red-500/10 text-red-400",
  refunded: "border-purple-500/35 bg-purple-500/10 text-purple-300",
}

function statusIcon(status: PaymentStatus) {
  if (status === "pending") return <Clock className="h-3.5 w-3.5" />
  if (status === "verified") return <CheckCircle2 className="h-3.5 w-3.5" />
  if (status === "rejected") return <XCircle className="h-3.5 w-3.5" />
  return <Undo2 className="h-3.5 w-3.5" />
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

/* ------------------------------------------------------------------ */
/* Mi perfil                                                          */
/* ------------------------------------------------------------------ */

function PerfilTab({ payments }: { payments: PaymentRecord[] }) {
  const { user } = useAuth()
  const verified = payments.filter((p) => p.status === "verified")
  const totalSpent = verified.reduce((sum, p) => sum + p.amount, 0)

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-primary/10 via-card to-card p-6 lg:p-8">
        <div className="flex flex-wrap items-center gap-5">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-3xl font-black text-white shadow-[0_18px_40px_rgba(232,57,42,0.35)]">
            {user?.name?.charAt(0) || "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Hola de nuevo</p>
            <h1 className="mt-1 truncate font-display text-3xl text-foreground md:text-4xl">{user?.name}</h1>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5" />
              {user?.email}
            </p>
          </div>
          <button className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-primary/40">
            <Pencil className="h-3.5 w-3.5" />
            Editar perfil
          </button>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Cursos activos", value: verified.reduce((sum, p) => sum + p.items.length, 0), icon: BadgeCheck },
          { label: "Total invertido", value: `$${totalSpent.toFixed(2)}`, icon: Receipt },
          { label: "Pagos pendientes", value: payments.filter((p) => p.status === "pending").length, icon: Clock },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
            <card.icon className="mb-2 h-4 w-4 text-primary" />
            <div className="text-2xl font-black text-foreground">{card.value}</div>
            <div className="mt-1 text-xs text-muted-foreground">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/dashboard/cursos"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-foreground">Explorar mas cursos</div>
            <div className="text-xs text-muted-foreground">Sigue avanzando con nuevos contenidos.</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
        <Link
          href="/dashboard/soporte"
          className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-primary/5"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Headphones className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-foreground">Necesitas ayuda?</div>
            <div className="text-xs text-muted-foreground">Abre un ticket y respondemos rapido.</div>
          </div>
          <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Mis pagos                                                          */
/* ------------------------------------------------------------------ */

function PagosTab({ payments }: { payments: PaymentRecord[] }) {
  const sorted = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments]
  )

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
          <Receipt className="h-7 w-7 text-primary" />
        </div>
        <h2 className="text-lg font-black text-foreground">Aun no tienes pagos</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
          Cuando completes tu primera compra veras el historial y los comprobantes aqui.
        </p>
        <Link
          href="/cursos"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          Explorar cursos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {sorted.map((payment) => (
        <div
          key={payment.id}
          className="overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_50px_rgba(0,0,0,0.08)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border bg-secondary/15 px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {payment.method === "card" ? (
                  <CreditCard className="h-5 w-5" />
                ) : (
                  <Landmark className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {payment.method === "card" ? "Pago con tarjeta" : "Transferencia bancaria"}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {formatDate(payment.createdAt)} · {payment.id}
                </p>
              </div>
            </div>
            <span
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[payment.status]}`}
            >
              {statusIcon(payment.status)}
              {STATUS_LABEL[payment.status]}
            </span>
          </div>

          <div className="grid gap-4 px-5 py-5 lg:grid-cols-[1.5fr_1fr]">
            <div className="space-y-2">
              {payment.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/15 px-3 py-2"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-foreground">{item.titulo}</p>
                    <p className="text-[11px] text-muted-foreground">{item.instructor}</p>
                  </div>
                  <div className="text-sm font-bold text-foreground">${item.precio.toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-secondary/20 p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Total pagado
                </p>
                <div className="mt-1 text-2xl font-black text-foreground">${payment.amount.toFixed(2)}</div>
              </div>

              {payment.status === "verified" ? (
                <Link
                  href="/dashboard/cursos"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-3 py-2.5 text-sm font-bold text-white hover:bg-emerald-400"
                >
                  Ir a mis cursos
                  <ArrowRight className="h-4 w-4" />
                </Link>
              ) : null}
              {payment.status === "rejected" && payment.rejectedReason ? (
                <div className="rounded-xl border border-red-500/30 bg-red-500/8 p-3 text-[11px] leading-relaxed text-red-300">
                  <strong>Motivo:</strong> {payment.rejectedReason}
                </div>
              ) : null}
              <Link
                href={`/dashboard/soporte?payment=${payment.id}`}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-secondary/15 px-3 py-2.5 text-sm font-bold text-foreground hover:border-primary/40 hover:bg-primary/5"
              >
                <Headphones className="h-4 w-4 text-primary" />
                Contactar soporte
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Metodos de pago                                                    */
/* ------------------------------------------------------------------ */

function MetodosTab({ payments }: { payments: PaymentRecord[] }) {
  const cardPayments = payments.filter((p) => p.method === "card" && p.card)
  const uniqueCards = new Map<string, { last4: string; brand: string; holder: string; lastUsed: string }>()
  cardPayments.forEach((payment) => {
    if (!payment.card) return
    const key = `${payment.card.brand}-${payment.card.last4}`
    const existing = uniqueCards.get(key)
    if (!existing || new Date(payment.createdAt) > new Date(existing.lastUsed)) {
      uniqueCards.set(key, {
        last4: payment.card.last4,
        brand: payment.card.brand,
        holder: payment.card.holder,
        lastUsed: payment.createdAt,
      })
    }
  })
  const cards = Array.from(uniqueCards.values())
  const [showSaved, setShowSaved] = useState(true)

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="text-lg font-black text-foreground">Metodos de pago</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Administra las tarjetas que has usado en tus compras y los datos de transferencia.
        </p>
      </div>

      <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-card p-4">
        <input
          type="checkbox"
          checked={showSaved}
          onChange={(event) => setShowSaved(event.target.checked)}
          className="mt-0.5 h-4 w-4 cursor-pointer accent-[#E8392A]"
        />
        <div>
          <div className="text-sm font-bold text-foreground">
            Mostrar mis metodos de pago guardados en el paso de pago.
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            Se sugieren al pagar para acelerar tu compra. Tus datos completos no se almacenan.
          </div>
        </div>
      </label>

      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-bold text-foreground">Tus metodos de pago guardados</h3>
        {cards.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-secondary/15 p-8 text-center">
            <CreditCard className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-bold text-foreground">Sin tarjetas guardadas</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Cuando completes una compra con tarjeta, aparecera aqui para reusarla.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {cards.map((card) => (
              <div
                key={`${card.brand}-${card.last4}`}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-secondary/15 px-4 py-3"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-9 w-12 items-center justify-center rounded-md border border-border bg-white text-[10px] font-black uppercase text-[#1a1f71]">
                    {card.brand !== "generic" ? card.brand.toUpperCase() : "CARD"}
                  </div>
                  <div>
                    <div className="font-mono text-sm font-bold text-foreground">
                      **** **** **** {card.last4}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {card.holder} · ultima uso {formatDate(card.lastUsed)}
                    </div>
                  </div>
                </div>
                <button className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80">
                  <Trash2 className="h-3 w-3" />
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Landmark className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-foreground">Pago por transferencia</h3>
            <p className="text-xs text-muted-foreground">
              Disponible en el checkout. El acceso se activa al validar la transferencia.
            </p>
          </div>
        </div>
        <Link
          href="/dashboard/checkout"
          className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/15"
        >
          Ver datos bancarios
          <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Configuracion                                                      */
/* ------------------------------------------------------------------ */

function ConfiguracionTab() {
  const { user } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [email, setEmail] = useState(user?.email || "")
  const [notifEmails, setNotifEmails] = useState(true)
  const [notifPromos, setNotifPromos] = useState(false)
  const [language, setLanguage] = useState("es")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-black text-foreground">Datos personales</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Nombre completo
            </label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Email
            </label>
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-black text-foreground">Notificaciones</h2>
        <div className="space-y-3">
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
            <div className="flex items-center gap-3">
              <Bell className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-bold text-foreground">Correos del aprendizaje</div>
                <div className="text-xs text-muted-foreground">Recordatorios de tus cursos.</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifEmails}
              onChange={(event) => setNotifEmails(event.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[#E8392A]"
            />
          </label>
          <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
            <div className="flex items-center gap-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <div>
                <div className="text-sm font-bold text-foreground">Ofertas y novedades</div>
                <div className="text-xs text-muted-foreground">Promociones y descuentos puntuales.</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={notifPromos}
              onChange={(event) => setNotifPromos(event.target.checked)}
              className="h-5 w-5 cursor-pointer accent-[#E8392A]"
            />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-black text-foreground">Idioma e interfaz</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Idioma
            </label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <select
                value={language}
                onChange={(event) => setLanguage(event.target.value)}
                className="h-11 w-full appearance-none rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-primary"
              >
                <option value="es">Espanol</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Tema
            </label>
            <div className="flex h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm text-muted-foreground">
              <Moon className="h-3.5 w-3.5" />
              Cambia el tema desde el switch en el header.
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-6">
        <h2 className="mb-4 text-lg font-black text-foreground">Seguridad</h2>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/15 px-4 py-2.5 text-sm font-bold text-foreground hover:border-primary/40 hover:bg-primary/5">
          <Lock className="h-4 w-4 text-primary" />
          Cambiar contrasena
        </button>
      </div>

      <button
        onClick={handleSave}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] hover:scale-[1.01]"
      >
        {saved ? (
          <>
            <CheckCircle2 className="h-4 w-4" /> Guardado
          </>
        ) : (
          <>
            <Save className="h-4 w-4" /> Guardar cambios
          </>
        )}
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

function PerfilContent() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useSearchParams()
  const initialTab = (params.get("tab") as TabKey) || "perfil"
  const [tab, setTab] = useState<TabKey>(
    TABS.some((t) => t.key === initialTab) ? initialTab : "perfil"
  )
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    if (!user) return
    const sync = () => setPayments(getPaymentsForUser(user.id))
    sync()
    window.addEventListener(getPaymentsEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getPaymentsEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [user])

  const handleTab = (next: TabKey) => {
    setTab(next)
    const url = new URL(window.location.href)
    url.searchParams.set("tab", next)
    router.replace(`/dashboard/perfil?${url.searchParams.toString()}`)
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto">
        <div className="inline-flex min-w-full items-center gap-1 rounded-2xl border border-border bg-card p-1.5">
          {TABS.map((entry) => (
            <button
              key={entry.key}
              onClick={() => handleTab(entry.key)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                tab === entry.key
                  ? "bg-primary text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <entry.icon className="h-4 w-4" />
              {entry.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "perfil" ? <PerfilTab payments={payments} /> : null}
      {tab === "pagos" ? <PagosTab payments={payments} /> : null}
      {tab === "metodos" ? <MetodosTab payments={payments} /> : null}
      {tab === "configuracion" ? <ConfiguracionTab /> : null}
    </div>
  )
}

export default function DashboardPerfilPanel() {
  return (
    <Suspense fallback={null}>
      <PerfilContent />
    </Suspense>
  )
}
