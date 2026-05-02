"use client"

import { Suspense, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Bell,
  Camera,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Globe,
  Headphones,
  Image as ImageIcon,
  Landmark,
  Lock,
  Receipt,
  Save,
  Shield,
  ShoppingBag,
  Trash2,
  Undo2,
  User,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  REFUND_WINDOW_DAYS,
  type PaymentRecord,
  type PaymentStatus,
  type RefundRequest,
  type WalletTransaction,
  createRefundRequest,
  getPaymentsEventName,
  getPaymentsForUser,
  getRefundEligibility,
  getRefundRequestsEventName,
  getRefundRequestsForUser,
  getWalletBalance,
  getWalletEventName,
  getWalletHistory,
} from "@/lib/payments"
import { Wallet } from "lucide-react"

type TabKey = "perfil" | "compras" | "metodos" | "configuracion"

const TABS: { key: TabKey; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: "perfil", label: "Mi perfil", icon: User },
  { key: "compras", label: "Historial de compras", icon: Receipt },
  { key: "metodos", label: "Metodos de pago", icon: CreditCard },
  { key: "configuracion", label: "Configuracion", icon: Shield },
]

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  verified: "Pagado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
}

const STATUS_STYLES: Record<PaymentStatus, string> = {
  pending: "border-amber-500/35 bg-amber-500/10 text-amber-500",
  verified: "border-emerald-500/35 bg-emerald-500/10 text-emerald-500",
  rejected: "border-red-500/35 bg-red-500/10 text-red-500",
  refunded: "border-purple-500/35 bg-purple-500/10 text-purple-400",
}

function statusIcon(status: PaymentStatus) {
  if (status === "pending") return <Clock className="h-3 w-3" />
  if (status === "verified") return <CheckCircle2 className="h-3 w-3" />
  if (status === "rejected") return <XCircle className="h-3 w-3" />
  return <Undo2 className="h-3 w-3" />
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString("es-EC", { day: "2-digit", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

function profileStorageKey(userId: string) {
  return `he_profile_${userId}`
}

type ProfileData = {
  firstName: string
  lastName: string
  title: string
  bio: string
  language: string
  website: string
  twitter: string
  facebook: string
  linkedin: string
  youtube: string
  avatar: string
}

function getProfile(userId: string): ProfileData {
  if (typeof window === "undefined") {
    return { firstName: "", lastName: "", title: "", bio: "", language: "es", website: "", twitter: "", facebook: "", linkedin: "", youtube: "", avatar: "" }
  }
  try {
    const raw = window.localStorage.getItem(profileStorageKey(userId))
    if (!raw) {
      return { firstName: "", lastName: "", title: "", bio: "", language: "es", website: "", twitter: "", facebook: "", linkedin: "", youtube: "", avatar: "" }
    }
    return JSON.parse(raw) as ProfileData
  } catch {
    return { firstName: "", lastName: "", title: "", bio: "", language: "es", website: "", twitter: "", facebook: "", linkedin: "", youtube: "", avatar: "" }
  }
}

function saveProfile(userId: string, data: ProfileData) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(profileStorageKey(userId), JSON.stringify(data))
}

/* ------------------------------------------------------------------ */
/* Mi perfil — Udemy-style edit form with side menu                   */
/* ------------------------------------------------------------------ */

type PerfilSubTab = "perfil" | "fotografia" | "seguridad" | "privacidad" | "notificaciones"

const PERFIL_SUBTABS: { key: PerfilSubTab; label: string }[] = [
  { key: "perfil", label: "Perfil" },
  { key: "fotografia", label: "Fotografia" },
  { key: "seguridad", label: "Seguridad de la cuenta" },
  { key: "privacidad", label: "Privacidad" },
  { key: "notificaciones", label: "Preferencias de notificaciones" },
]

function PerfilTab() {
  const { user } = useAuth()
  const userId = user?.id || ""
  const initialFromUser = useMemo(() => {
    const split = (user?.name || "").split(" ")
    return {
      firstName: split[0] || "",
      lastName: split.slice(1).join(" ") || "",
    }
  }, [user?.name])

  const [profile, setProfile] = useState<ProfileData>(() => {
    const stored = userId ? getProfile(userId) : null
    return {
      firstName: stored?.firstName || initialFromUser.firstName,
      lastName: stored?.lastName || initialFromUser.lastName,
      title: stored?.title || "",
      bio: stored?.bio || "",
      language: stored?.language || "es",
      website: stored?.website || "",
      twitter: stored?.twitter || "",
      facebook: stored?.facebook || "",
      linkedin: stored?.linkedin || "",
      youtube: stored?.youtube || "",
      avatar: stored?.avatar || "",
    }
  })
  const [subTab, setSubTab] = useState<PerfilSubTab>("perfil")
  const [saved, setSaved] = useState(false)
  const [password, setPassword] = useState({ current: "", next: "", confirm: "" })
  const [notif, setNotif] = useState({ correos: true, promos: false, mensajes: true })
  const [privacy, setPrivacy] = useState({ perfilPublico: true, mostrarCursos: true })

  useEffect(() => {
    if (!userId) return
    const stored = getProfile(userId)
    setProfile((current) => ({ ...current, ...stored }))
  }, [userId])

  const update = <K extends keyof ProfileData>(key: K, value: ProfileData[K]) => {
    setProfile((current) => ({ ...current, [key]: value }))
  }

  const handleSave = () => {
    if (!userId) return
    saveProfile(userId, profile)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const handleAvatar = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update("avatar", reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const fullName = `${profile.firstName} ${profile.lastName}`.trim() || user?.name || "Usuario"
  const initials = (profile.firstName.charAt(0) || user?.name?.charAt(0) || "U").toUpperCase()

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
      {/* Side menu */}
      <aside className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-5 flex flex-col items-center gap-3 border-b border-border pb-5 text-center">
          <div className="flex h-24 w-24 overflow-hidden rounded-full bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-3xl font-black text-white">
            {profile.avatar ? (
              <img src={profile.avatar} alt={fullName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">{initials}</div>
            )}
          </div>
          <div className="font-bold text-foreground">{fullName}</div>
        </div>

        <nav className="space-y-1">
          <Link
            href="#"
            onClick={(event) => event.preventDefault()}
            className="block rounded-lg px-3 py-2 text-sm text-primary hover:bg-primary/10"
          >
            Ver perfil publico
          </Link>
          {PERFIL_SUBTABS.map((entry) => (
            <button
              key={entry.key}
              onClick={() => setSubTab(entry.key)}
              className={`block w-full rounded-lg px-3 py-2 text-left text-sm font-semibold transition-colors ${
                subTab === entry.key
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
              }`}
            >
              {entry.label}
            </button>
          ))}
          <Link
            href="/dashboard/perfil?tab=metodos"
            className="block rounded-lg px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
          >
            Metodos de pago
          </Link>
        </nav>
      </aside>

      {/* Content */}
      <div className="rounded-2xl border border-border bg-card p-6 lg:p-8">
        {subTab === "perfil" ? (
          <>
            <header className="mb-8 border-b border-border pb-5 text-center">
              <h2 className="font-display text-2xl text-foreground">Perfil publico</h2>
              <p className="mt-1 text-sm text-muted-foreground">Anade informacion sobre ti</p>
            </header>

            <div className="space-y-5">
              <h3 className="text-sm font-bold text-foreground">Informacion basica:</h3>

              <div>
                <input
                  value={profile.firstName}
                  onChange={(event) => update("firstName", event.target.value)}
                  placeholder="Nombre"
                  className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <input
                  value={profile.lastName}
                  onChange={(event) => update("lastName", event.target.value)}
                  placeholder="Apellido"
                  className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </div>

              <div>
                <div className="relative">
                  <input
                    value={profile.title}
                    onChange={(event) => update("title", event.target.value.slice(0, 60))}
                    placeholder="Titulo"
                    className="h-12 w-full rounded-lg border border-border bg-background pl-4 pr-14 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {profile.title.length}/60
                  </span>
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Anade un titulo o descripcion profesional, como "Docente QSM" o "Coordinadora pedagogica".
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">Biografia</label>
                <div className="overflow-hidden rounded-lg border border-border bg-background">
                  <div className="flex items-center gap-2 border-b border-border bg-secondary/20 px-3 py-2 text-sm text-muted-foreground">
                    <button className="font-bold hover:text-foreground">B</button>
                    <button className="italic hover:text-foreground">I</button>
                  </div>
                  <textarea
                    value={profile.bio}
                    onChange={(event) => update("bio", event.target.value)}
                    rows={5}
                    placeholder="Biografia"
                    className="w-full resize-none bg-transparent px-4 py-3 text-sm text-foreground outline-none"
                  />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                  No se permiten enlaces ni codigos de cupon en esta seccion.
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">Idioma</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                  <select
                    value={profile.language}
                    onChange={(event) => update("language", event.target.value)}
                    className="h-12 w-full appearance-none rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:border-primary"
                  >
                    <option value="es">Espanol (Espana)</option>
                    <option value="en">English (US)</option>
                  </select>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-sm font-bold text-foreground">Enlaces:</h3>
                <div className="grid gap-3">
                  <input
                    value={profile.website}
                    onChange={(event) => update("website", event.target.value)}
                    placeholder="URL del sitio web (incluye http(s)://)"
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    value={profile.twitter}
                    onChange={(event) => update("twitter", event.target.value)}
                    placeholder="X (Twitter)"
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    value={profile.facebook}
                    onChange={(event) => update("facebook", event.target.value)}
                    placeholder="Facebook"
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    value={profile.linkedin}
                    onChange={(event) => update("linkedin", event.target.value)}
                    placeholder="LinkedIn"
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                  <input
                    value={profile.youtube}
                    onChange={(event) => update("youtube", event.target.value)}
                    placeholder="YouTube"
                    className="h-11 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                className="flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-6 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] hover:scale-[1.01]"
              >
                {saved ? (
                  <>
                    <Check className="h-4 w-4" /> Guardado
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" /> Guardar
                  </>
                )}
              </button>
            </div>
          </>
        ) : null}

        {subTab === "fotografia" ? (
          <>
            <header className="mb-6 border-b border-border pb-5">
              <h2 className="font-display text-2xl text-foreground">Fotografia</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sube una foto que represente tu cuenta.
              </p>
            </header>
            <div className="flex flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-border bg-secondary/15 p-10 text-center">
              <div className="flex h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-4xl font-black text-white">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">{initials}</div>
                )}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">{fullName}</p>
                <p className="text-xs text-muted-foreground">JPG, PNG o GIF — max 4MB</p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">
                <Camera className="h-4 w-4" />
                Subir nueva foto
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatar} />
              </label>
              {profile.avatar ? (
                <button
                  onClick={() => update("avatar", "")}
                  className="text-xs font-bold text-primary hover:text-primary/80"
                >
                  Eliminar foto
                </button>
              ) : null}
              <button
                onClick={handleSave}
                className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2 text-xs font-bold text-foreground hover:border-primary/40"
              >
                <Save className="h-3.5 w-3.5" />
                Guardar cambios
              </button>
            </div>
          </>
        ) : null}

        {subTab === "seguridad" ? (
          <>
            <header className="mb-6 border-b border-border pb-5">
              <h2 className="font-display text-2xl text-foreground">Seguridad de la cuenta</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Email y contrasena de tu cuenta.
              </p>
            </header>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-foreground">Email</label>
                <input
                  value={user?.email || ""}
                  disabled
                  className="h-11 w-full rounded-lg border border-border bg-secondary/30 px-3 text-sm text-muted-foreground"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-sm font-bold text-foreground">
                    Contrasena actual
                  </label>
                  <input
                    type="password"
                    value={password.current}
                    onChange={(event) => setPassword((p) => ({ ...p, current: event.target.value }))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-foreground">
                    Nueva contrasena
                  </label>
                  <input
                    type="password"
                    value={password.next}
                    onChange={(event) => setPassword((p) => ({ ...p, next: event.target.value }))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-foreground">Confirmar</label>
                  <input
                    type="password"
                    value={password.confirm}
                    onChange={(event) => setPassword((p) => ({ ...p, confirm: event.target.value }))}
                    className="h-11 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                </div>
              </div>
              <button className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white">
                <Lock className="h-4 w-4" /> Cambiar contrasena
              </button>
            </div>
          </>
        ) : null}

        {subTab === "privacidad" ? (
          <>
            <header className="mb-6 border-b border-border pb-5">
              <h2 className="font-display text-2xl text-foreground">Privacidad</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Decide que datos comparte tu cuenta.
              </p>
            </header>
            <div className="space-y-3">
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Perfil publico visible</div>
                  <div className="text-xs text-muted-foreground">
                    Otros usuarios pueden ver tu nombre y biografia.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.perfilPublico}
                  onChange={(event) =>
                    setPrivacy((p) => ({ ...p, perfilPublico: event.target.checked }))
                  }
                  className="h-5 w-5 cursor-pointer accent-[#E8392A]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
                <div>
                  <div className="text-sm font-bold text-foreground">Mostrar cursos en mi perfil</div>
                  <div className="text-xs text-muted-foreground">
                    Tus cursos inscritos seran visibles en tu perfil publico.
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={privacy.mostrarCursos}
                  onChange={(event) =>
                    setPrivacy((p) => ({ ...p, mostrarCursos: event.target.checked }))
                  }
                  className="h-5 w-5 cursor-pointer accent-[#E8392A]"
                />
              </label>
            </div>
          </>
        ) : null}

        {subTab === "notificaciones" ? (
          <>
            <header className="mb-6 border-b border-border pb-5">
              <h2 className="font-display text-2xl text-foreground">Preferencias de notificaciones</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Elige los correos que quieres recibir.
              </p>
            </header>
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
                  checked={notif.correos}
                  onChange={(event) => setNotif((n) => ({ ...n, correos: event.target.checked }))}
                  className="h-5 w-5 cursor-pointer accent-[#E8392A]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Promociones y ofertas</div>
                    <div className="text-xs text-muted-foreground">Descuentos puntuales.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notif.promos}
                  onChange={(event) => setNotif((n) => ({ ...n, promos: event.target.checked }))}
                  className="h-5 w-5 cursor-pointer accent-[#E8392A]"
                />
              </label>
              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/15 p-3">
                <div className="flex items-center gap-3">
                  <Bell className="h-4 w-4 text-primary" />
                  <div>
                    <div className="text-sm font-bold text-foreground">Mensajes de soporte</div>
                    <div className="text-xs text-muted-foreground">Respuestas a tus tickets.</div>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={notif.mensajes}
                  onChange={(event) => setNotif((n) => ({ ...n, mensajes: event.target.checked }))}
                  className="h-5 w-5 cursor-pointer accent-[#E8392A]"
                />
              </label>
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Historial de compras                                               */
/* ------------------------------------------------------------------ */

function ComprasTab({ payments }: { payments: PaymentRecord[] }) {
  const { user } = useAuth()
  const [tab, setTab] = useState<"compras" | "reembolsos">("compras")
  const [walletBalance, setWalletBalance] = useState(0)
  const [walletEntries, setWalletEntries] = useState<WalletTransaction[]>([])
  const [refundRequests, setRefundRequests] = useState<RefundRequest[]>([])
  const [refundTarget, setRefundTarget] = useState<PaymentRecord | null>(null)
  const [refundReason, setRefundReason] = useState("")
  const [refundDetails, setRefundDetails] = useState("")
  const [refundSent, setRefundSent] = useState(false)

  useEffect(() => {
    if (!user) return
    const sync = () => {
      setWalletBalance(getWalletBalance(user.id))
      setWalletEntries(getWalletHistory(user.id))
      setRefundRequests(getRefundRequestsForUser(user.id))
    }
    sync()
    window.addEventListener(getWalletEventName(), sync as EventListener)
    window.addEventListener(getRefundRequestsEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getWalletEventName(), sync as EventListener)
      window.removeEventListener(getRefundRequestsEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [user])

  const refundByPayment = useMemo(() => {
    const map: Record<string, RefundRequest> = {}
    refundRequests.forEach((entry) => {
      if (!map[entry.paymentId] || new Date(entry.createdAt) > new Date(map[entry.paymentId].createdAt)) {
        map[entry.paymentId] = entry
      }
    })
    return map
  }, [refundRequests])

  const submitRefund = () => {
    if (!refundTarget || !refundReason.trim()) return
    createRefundRequest({ paymentId: refundTarget.id, reason: refundReason.trim(), details: refundDetails.trim() || undefined })
    setRefundSent(true)
    setTimeout(() => {
      setRefundSent(false)
      setRefundTarget(null)
      setRefundReason("")
      setRefundDetails("")
    }, 1400)
  }

  const compras = useMemo(
    () =>
      [...payments]
        .filter((p) => p.status !== "refunded")
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments]
  )
  const reembolsos = useMemo(
    () => [...payments].filter((p) => p.status === "refunded"),
    [payments]
  )

  const rows = tab === "reembolsos" ? reembolsos : compras

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-foreground">Historial de compras</h2>
      </div>

      {/* Saldo disponible */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-500">
            <Wallet className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-500">Saldo disponible</p>
            <p className="text-2xl font-black text-foreground">${walletBalance.toFixed(2)} US$</p>
            <p className="text-xs text-muted-foreground">Acreditado por reembolsos aprobados.</p>
          </div>
        </div>
        <Link
          href="/dashboard/cursos"
          className="inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-500 hover:bg-emerald-500/15"
        >
          Usar saldo en cursos
        </Link>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-6 border-b border-border">
        {[
          { key: "compras", label: "Compras", count: compras.length },
          { key: "reembolsos", label: "Reembolsos", count: reembolsos.length },
        ].map((entry) => {
          const active = tab === entry.key
          return (
            <button
              key={entry.key}
              onClick={() => setTab(entry.key as typeof tab)}
              className={`relative pb-3 text-sm font-bold transition-colors ${
                active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {entry.label}
              {active ? (
                <span className="absolute inset-x-0 bottom-0 h-[2px] rounded-full bg-foreground" />
              ) : null}
            </button>
          )
        })}
      </div>

      {tab === "reembolsos" && walletEntries.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="border-b border-border bg-secondary/15 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Movimientos de saldo
          </div>
          {walletEntries.map((entry) => (
            <div
              key={entry.id}
              className="flex items-center justify-between gap-4 border-b border-border px-6 py-3 last:border-b-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-foreground">{entry.description}</p>
                <p className="text-[11px] text-muted-foreground">{formatDate(entry.createdAt)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-500">+${entry.amount.toFixed(2)}</p>
                <p className="text-[11px] text-muted-foreground">Saldo: ${entry.balance.toFixed(2)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <ShoppingBag className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-base font-bold text-foreground">
            {tab === "reembolsos"
              ? "Aun no tienes reembolsos."
              : "Aun no tienes compras registradas."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Cuando completes una compra, el recibo aparece automaticamente aqui.
          </p>
          <Link
            href="/dashboard/cursos"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr] gap-4 border-b border-border bg-secondary/15 px-6 py-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground md:grid">
            <span>Articulo</span>
            <span>Fecha</span>
            <span>Precio total</span>
            <span>Tipo de pago</span>
            <span></span>
          </div>
          {rows.map((payment) => (
            <div
              key={payment.id}
              className="grid grid-cols-1 gap-2 border-b border-border px-6 py-4 transition-colors last:border-b-0 hover:bg-secondary/15 md:grid-cols-[2fr_1fr_1fr_1.2fr_0.8fr] md:items-center md:gap-4"
            >
              <div className="min-w-0">
                {payment.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/cursos?course=${encodeURIComponent(item.id)}`}
                    className="block truncate text-sm font-bold text-primary hover:underline"
                  >
                    {item.titulo}
                  </Link>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">{formatDate(payment.createdAt)}</div>
              <div className="text-sm font-bold text-foreground">
                ${payment.amount.toFixed(2)} US$
              </div>
              <div className="flex items-center gap-2">
                {payment.method === "card" ? (
                  <CreditCard className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Landmark className="h-3.5 w-3.5 text-primary" />
                )}
                <span className="text-sm text-muted-foreground">
                  {payment.method === "card"
                    ? `${payment.amount.toFixed(2)} US$ Tarjeta${payment.card?.last4 ? ` ····${payment.card.last4}` : ""}`
                    : `${payment.amount.toFixed(2)} US$ Transferencia`}
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 md:justify-end">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[payment.status]}`}
                >
                  {statusIcon(payment.status)}
                  {STATUS_LABEL[payment.status]}
                </span>
                <Link
                  href={`/dashboard/recibos/${payment.id}`}
                  className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary hover:bg-primary/15"
                >
                  Ver recibo
                </Link>
                {payment.status === "verified" ? (() => {
                  const elig = getRefundEligibility(payment)
                  const reqStatus = refundByPayment[payment.id]?.status
                  if (reqStatus === "pending") {
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1 text-[10px] font-bold text-amber-500">
                        <Clock className="h-3 w-3" />
                        Reembolso en revisión
                      </span>
                    )
                  }
                  if (!elig.eligible) {
                    return (
                      <span className="inline-flex items-center gap-1 rounded-full border border-muted-foreground/30 bg-secondary/30 px-3 py-1 text-[10px] font-bold text-muted-foreground">
                        Plazo de reembolso vencido
                      </span>
                    )
                  }
                  if (reqStatus === "rejected") {
                    return (
                      <button
                        onClick={() => setRefundTarget(payment)}
                        className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-3 py-1 text-[11px] font-bold text-foreground hover:border-primary/40"
                      >
                        <Undo2 className="h-3 w-3" />
                        Reintentar ({elig.daysLeft}d)
                      </button>
                    )
                  }
                  return (
                    <button
                      onClick={() => setRefundTarget(payment)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/30 px-3 py-1 text-[11px] font-bold text-foreground hover:border-primary/40"
                    >
                      <Undo2 className="h-3 w-3" />
                      Reembolso ({elig.daysLeft}d)
                    </button>
                  )
                })() : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {refundTarget ? (
        <>
          <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={() => !refundSent && setRefundTarget(null)} />
          <div className="fixed inset-0 z-[151] flex items-center justify-center p-4">
            <div className="w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_100px_rgba(0,0,0,0.45)]">
              <div className="border-b border-border bg-gradient-to-r from-primary/8 to-transparent px-6 py-5">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">Solicitar reembolso</p>
                <h2 className="mt-1 text-xl font-black text-foreground">${refundTarget.amount.toFixed(2)} US$</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {refundTarget.items.map((item) => item.titulo).join(", ")}
                </p>
              </div>
              {refundSent ? (
                <div className="px-6 py-10 text-center">
                  <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" />
                  <p className="text-base font-bold text-foreground">Solicitud enviada</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Nuestro equipo revisa tu caso. Te avisamos por email cuando se resuelva.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 px-6 py-5">
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Política: aprobamos reembolsos solicitados dentro de los {REFUND_WINDOW_DAYS} días posteriores a la compra, si no completaste más del 30% del curso. El monto se acreditará como saldo en tu cuenta.
                  </p>
                  {refundTarget ? (
                    <p className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-2 text-[11px] text-amber-600">
                      Te quedan <strong>{getRefundEligibility(refundTarget).daysLeft} días</strong> para solicitar el reembolso de esta compra.
                    </p>
                  ) : null}
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Motivo principal
                    </label>
                    <select
                      value={refundReason}
                      onChange={(event) => setRefundReason(event.target.value)}
                      className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
                    >
                      <option value="">Selecciona un motivo</option>
                      <option value="No es lo que esperaba">No es lo que esperaba</option>
                      <option value="Compre por error">Compre por error</option>
                      <option value="Problema tecnico">Problema tecnico</option>
                      <option value="Calidad insuficiente">Calidad insuficiente</option>
                      <option value="Otro">Otro</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Detalles (opcional)
                    </label>
                    <textarea
                      value={refundDetails}
                      onChange={(event) => setRefundDetails(event.target.value)}
                      rows={3}
                      placeholder="Cuentanos que paso para procesar mas rapido..."
                      className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setRefundTarget(null)}
                      className="flex-1 rounded-xl border border-border bg-secondary/20 px-4 py-3 text-sm font-bold text-foreground hover:border-primary/40"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={submitRefund}
                      disabled={!refundReason}
                      className="flex-1 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)] disabled:opacity-50"
                    >
                      Enviar solicitud
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      ) : null}
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
      <div>
        <h2 className="font-display text-3xl text-foreground">Metodos de pago</h2>
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
            Muestra mis metodos de pago guardados en el paso de pago.
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
                      {card.holder} · ultimo uso {formatDate(card.lastUsed)}
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
        </Link>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Configuracion (basic)                                              */
/* ------------------------------------------------------------------ */

function ConfiguracionTab() {
  const { user } = useAuth()
  return (
    <div className="space-y-5">
      <div>
        <h2 className="font-display text-3xl text-foreground">Configuracion</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ajustes generales de tu cuenta.
        </p>
      </div>
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="space-y-3 text-sm">
          <p>
            <span className="font-bold text-foreground">Email:</span>{" "}
            <span className="text-muted-foreground">{user?.email}</span>
          </p>
          <p>
            <span className="font-bold text-foreground">Cuenta:</span>{" "}
            <span className="text-muted-foreground">{user?.name}</span>
          </p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            href="/dashboard/perfil?tab=perfil"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-bold text-white"
          >
            Editar perfil
          </Link>
          <Link
            href="/dashboard/soporte"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-primary/40"
          >
            <Headphones className="h-3.5 w-3.5" /> Contactar soporte
          </Link>
        </div>
      </div>
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
  const initialTab = params.get("tab") as TabKey | null
  // Backward-compat: legacy ?tab=pagos still maps to compras
  const startTab: TabKey =
    initialTab === "compras" || initialTab === "metodos" || initialTab === "configuracion" || initialTab === "perfil"
      ? initialTab
      : initialTab === ("pagos" as string)
        ? "compras"
        : "perfil"
  const [tab, setTab] = useState<TabKey>(startTab)
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

      {tab === "perfil" ? <PerfilTab /> : null}
      {tab === "compras" ? <ComprasTab payments={payments} /> : null}
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
