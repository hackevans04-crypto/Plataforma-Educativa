"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { Suspense, useEffect, useMemo, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Copy,
  CreditCard,
  FileText,
  Landmark,
  Lock,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  Star,
  Upload,
  Zap,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  clearCart,
  getCartEventName,
  getCartItems,
  getCartSavings,
  getCartSubtotal,
  type CartCourseItem,
} from "@/lib/shopping-cart"
import {
  createPayment,
  getBankConfig,
  getBankConfigEventName,
  type BankConfig,
} from "@/lib/payments"

type PaymentMethod = "card" | "transfer"

function formatCardNumber(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 19)
    .replace(/(\d{4})(?=\d)/g, "$1 ")
    .trim()
}

function formatExpiry(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length < 3) return digits
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

function detectBrand(number: string): "visa" | "mastercard" | "amex" | "diners" | "generic" {
  const n = number.replace(/\s+/g, "")
  if (/^4/.test(n)) return "visa"
  if (/^5[1-5]/.test(n) || /^2[2-7]/.test(n)) return "mastercard"
  if (/^3[47]/.test(n)) return "amex"
  if (/^3(0[0-5]|[68])/.test(n)) return "diners"
  return "generic"
}

function BrandLogo({ brand, active = false }: { brand: string; active?: boolean }) {
  const opacity = active ? "opacity-100" : "opacity-50"
  const baseClass = `flex h-7 w-11 items-center justify-center rounded-md border border-white/10 bg-white text-[9px] font-black uppercase tracking-[0.04em] transition-opacity ${opacity}`
  if (brand === "visa") {
    return (
      <div className={baseClass} style={{ color: "#1a1f71" }}>
        VISA
      </div>
    )
  }
  if (brand === "mastercard") {
    return (
      <div className={`${baseClass} relative`}>
        <span className="absolute left-1.5 h-3.5 w-3.5 rounded-full bg-[#eb001b]" />
        <span className="absolute right-1.5 h-3.5 w-3.5 rounded-full bg-[#f79e1b] mix-blend-multiply" />
      </div>
    )
  }
  if (brand === "amex") {
    return (
      <div className={baseClass} style={{ background: "#016fd0", color: "#fff" }}>
        AMEX
      </div>
    )
  }
  if (brand === "diners") {
    return (
      <div className={baseClass} style={{ color: "#0079be" }}>
        DINERS
      </div>
    )
  }
  return null
}

function DashboardCheckoutContent() {
  const router = useRouter()
  const { user } = useAuth()
  const [items, setItems] = useState<CartCourseItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card")
  const [processing, setProcessing] = useState(false)
  const [success, setSuccess] = useState<"verified" | "pending" | false>(false)
  const [paymentError, setPaymentError] = useState("")
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [bank, setBank] = useState<BankConfig>(() => getBankConfig())
  const [cardData, setCardData] = useState({ holder: "", number: "", expiry: "", cvv: "", saveCard: true })
  const [transferData, setTransferData] = useState<{
    sender: string
    reference: string
    proofName: string
    proofDataUrl: string
    proofMimeType: string
  }>({
    sender: "",
    reference: "",
    proofName: "",
    proofDataUrl: "",
    proofMimeType: "",
  })

  useEffect(() => {
    setBank(getBankConfig())
    const sync = () => setBank(getBankConfig())
    window.addEventListener(getBankConfigEventName(), sync as EventListener)
    return () => window.removeEventListener(getBankConfigEventName(), sync as EventListener)
  }, [])

  useEffect(() => {
    if (paymentMethod === "card" && !bank.enabledMethods.card && bank.enabledMethods.transfer) {
      setPaymentMethod("transfer")
    }
    if (paymentMethod === "transfer" && !bank.enabledMethods.transfer && bank.enabledMethods.card) {
      setPaymentMethod("card")
    }
  }, [bank, paymentMethod])

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

  const subtotal = useMemo(() => getCartSubtotal(items), [items])
  const savings = useMemo(() => getCartSavings(items), [items])
  const paidItems = useMemo(() => items.filter((item) => !item.gratis), [items])
  const original = subtotal + savings
  const discountPercent = original > 0 ? Math.round((savings / original) * 100) : 0
  const cardBrand = detectBrand(cardData.number)

  const copyToClipboard = (label: string, value: string) => {
    if (typeof navigator === "undefined" || !navigator.clipboard) return
    navigator.clipboard.writeText(value).then(() => {
      setCopiedField(label)
      window.setTimeout(() => setCopiedField(null), 1600)
    })
  }

  const handleConfirm = async () => {
    if (!user || paidItems.length === 0) return
    if (paymentMethod === "card") {
      if (
        !cardData.holder.trim() ||
        cardData.number.replace(/\s+/g, "").length < 13 ||
        !cardData.expiry ||
        cardData.cvv.length < 3
      ) {
        setPaymentError("Completa correctamente los datos de la tarjeta para continuar.")
        return
      }
    }
    if (paymentMethod === "transfer") {
      if (!transferData.sender.trim() || !transferData.reference.trim()) {
        setPaymentError("Ingresa el titular que envio y la referencia de la transferencia.")
        return
      }
    }

    setPaymentError("")
    setProcessing(true)
    await new Promise((resolve) => setTimeout(resolve, 1200))
    const cardLast4 = cardData.number.replace(/\s+/g, "").slice(-4)
    const payment = createPayment({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      method: paymentMethod,
      items: paidItems,
      amount: subtotal,
      subtotal,
      savings,
      autoVerify: paymentMethod === "card" && (bank.cardAutoVerify ?? true),
      card:
        paymentMethod === "card"
          ? { last4: cardLast4 || "0000", brand: cardBrand, holder: cardData.holder }
          : undefined,
      transfer:
        paymentMethod === "transfer"
          ? {
              sender: transferData.sender,
              reference: transferData.reference,
              proofName: transferData.proofName,
              proofUploadedAt: new Date().toISOString(),
              proofDataUrl: transferData.proofDataUrl || undefined,
              proofMimeType: transferData.proofMimeType || undefined,
            }
          : undefined,
    })
    clearCart()
    setProcessing(false)
    setSuccess(payment.status === "verified" ? "verified" : "pending")
    setTimeout(
      () => router.push(payment.status === "verified" ? "/dashboard/cursos" : "/dashboard/pagos"),
      2200
    )
  }

  if (success === "verified") {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-emerald-500/25 bg-card p-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.16)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-10 w-10 text-emerald-400" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-foreground">Compra confirmada</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">
          Tus cursos ya quedaron asociados a tu cuenta y se estan habilitando en tu dashboard.
        </p>
      </div>
    )
  }

  if (success === "pending") {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-500/30 bg-card p-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.16)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-amber-500/15">
          <Receipt className="h-10 w-10 text-amber-400" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-foreground">Transferencia registrada</h1>
        <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
          Recibimos tus datos. Validamos la transferencia en menos de 30 minutos y activamos tus cursos
          automaticamente. Te llevaremos a "Mis Pagos" para que sigas el estado.
        </p>
      </div>
    )
  }

  if (items.length === 0 || paidItems.length === 0) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center shadow-[0_28px_90px_rgba(0,0,0,0.12)]">
        <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.08)]">
          <ShoppingBag className="h-9 w-9 text-primary" />
        </div>
        <h1 className="mb-3 text-3xl font-black text-foreground">Tu cesta esta vacia</h1>
        <p className="mx-auto max-w-lg text-sm leading-relaxed text-muted-foreground">
          Agrega cursos de pago al carrito desde la pagina de cursos para continuar con una compra completa.
        </p>
        <Link
          href="/cursos"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-bold text-white"
        >
          Volver a cursos
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">
          <Lock className="h-3.5 w-3.5" />
          Pago seguro y cifrado
        </div>
        <h1 className="text-3xl font-black text-foreground md:text-4xl">Finaliza tu compra</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Estas comprando como{" "}
          <span className="font-semibold text-foreground">{user?.name}</span>. El pago y el acceso se procesan dentro de tu cuenta.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* LEFT — items + payment forms */}
        <div className="space-y-6">
          {/* Items list — Udemy-style */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-black text-foreground">
                {paidItems.length} {paidItems.length === 1 ? "curso" : "cursos"} en tu compra
              </h2>
              <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold text-emerald-500">
                Garantia 30 dias
              </span>
            </div>

            <div className="space-y-3">
              {paidItems.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-2xl border border-border bg-secondary/20 p-3 transition-colors hover:border-primary/30"
                >
                  <div className="relative h-24 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A]">
                    <Image
                      src={item.imagen || "/placeholder.jpg"}
                      alt={item.titulo}
                      fill
                      className="object-cover mix-blend-screen opacity-90"
                    />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col justify-between">
                    <div>
                      <h3 className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{item.titulo}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">Por {item.instructor}</p>
                      <div className="mt-1.5 flex items-center gap-2">
                        {item.categoria ? (
                          <span className="rounded-full border border-primary/25 bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                            {item.categoria}
                          </span>
                        ) : null}
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star key={star} size={9} className="fill-[#fbbf24] text-[#fbbf24]" />
                          ))}
                          <span className="ml-1 text-[10px] text-muted-foreground">4.8</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between text-right">
                    <div>
                      <div className="text-lg font-black text-foreground">${item.precio.toFixed(2)}</div>
                      {item.precioOriginal > item.precio ? (
                        <div className="text-xs text-muted-foreground line-through">
                          ${item.precioOriginal.toFixed(2)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method picker — tabs */}
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_28px_90px_rgba(0,0,0,0.08)]">
            <div className="mb-5">
              <h2 className="text-lg font-black text-foreground">Metodo de pago</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Elige como pagar. Todos los metodos estan cifrados y protegidos.
              </p>
            </div>

            {/* Tab switch */}
            <div className="mb-5 flex gap-2 rounded-2xl border border-border bg-secondary/30 p-1">
              {[
                { id: "card" as const, label: "Tarjeta", icon: CreditCard, enabled: bank.enabledMethods.card },
                {
                  id: "transfer" as const,
                  label: "Transferencia",
                  icon: Landmark,
                  enabled: bank.enabledMethods.transfer,
                },
              ]
                .filter((tab) => tab.enabled)
                .map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setPaymentMethod(tab.id)
                      setPaymentError("")
                    }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
                      paymentMethod === tab.id
                        ? "bg-card text-foreground shadow-[0_8px_20px_rgba(0,0,0,0.12)]"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <tab.icon className="h-4 w-4" />
                    {tab.label}
                  </button>
                ))}
            </div>

            {paymentMethod === "card" ? (
              <div className="space-y-4">
                {/* Card brand row */}
                <div className="flex items-center justify-end gap-1.5">
                  <BrandLogo brand="visa" active={cardBrand === "visa" || cardBrand === "generic"} />
                  <BrandLogo
                    brand="mastercard"
                    active={cardBrand === "mastercard" || cardBrand === "generic"}
                  />
                  <BrandLogo brand="amex" active={cardBrand === "amex" || cardBrand === "generic"} />
                  <BrandLogo brand="diners" active={cardBrand === "diners" || cardBrand === "generic"} />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    Numero de tarjeta
                  </label>
                  <div className="relative">
                    <input
                      value={cardData.number}
                      onChange={(event) =>
                        setCardData((current) => ({
                          ...current,
                          number: formatCardNumber(event.target.value),
                        }))
                      }
                      inputMode="numeric"
                      placeholder="1234 5678 9012 3456"
                      className="h-12 w-full rounded-lg border border-border bg-background pl-4 pr-14 font-mono text-sm tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                    {cardBrand !== "generic" ? (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <BrandLogo brand={cardBrand} active />
                      </div>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">
                      Fecha de vencimiento
                    </label>
                    <input
                      value={cardData.expiry}
                      onChange={(event) =>
                        setCardData((current) => ({
                          ...current,
                          expiry: formatExpiry(event.target.value),
                        }))
                      }
                      inputMode="numeric"
                      placeholder="MM/AA"
                      className="h-12 w-full rounded-lg border border-border bg-background px-4 font-mono text-sm tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-foreground">CVC/CVV</label>
                    <div className="relative">
                      <input
                        value={cardData.cvv}
                        onChange={(event) =>
                          setCardData((current) => ({
                            ...current,
                            cvv: event.target.value.replace(/\D/g, "").slice(0, 4),
                          }))
                        }
                        inputMode="numeric"
                        placeholder="CVC"
                        type="password"
                        className="h-12 w-full rounded-lg border border-border bg-background pl-4 pr-10 font-mono text-sm tracking-wider text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                      />
                      <Lock className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-foreground">
                    Nombre en la tarjeta
                  </label>
                  <input
                    value={cardData.holder}
                    onChange={(event) => setCardData((current) => ({ ...current, holder: event.target.value }))}
                    placeholder="Nombre en la tarjeta"
                    className="h-12 w-full rounded-lg border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary focus:ring-2 focus:ring-primary/15"
                  />
                </div>

                <label className="flex cursor-pointer items-start gap-2.5 pt-1">
                  <input
                    type="checkbox"
                    checked={cardData.saveCard}
                    onChange={(event) =>
                      setCardData((current) => ({ ...current, saveCard: event.target.checked }))
                    }
                    className="mt-0.5 h-4 w-4 cursor-pointer accent-[#E8392A]"
                  />
                  <span className="text-sm text-foreground">
                    Guardar esta tarjeta de forma segura para comprar mas adelante
                  </span>
                </label>

                <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                  <Lock className="h-3.5 w-3.5 text-emerald-500" />
                  <span>Pago seguro y cifrado con TLS de extremo a extremo.</span>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bank info card */}
                <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/8 to-transparent p-5">
                  <div className="mb-3 flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
                      <Landmark className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                        Datos bancarios
                      </p>
                      <p className="text-base font-black text-foreground">{bank.bank}</p>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    {[
                      { label: "Tipo de cuenta", value: bank.type, copy: false },
                      { label: "Numero de cuenta", value: bank.number, copy: true },
                      { label: "Titular", value: bank.holder, copy: true },
                      { label: "RUC", value: bank.ruc, copy: true },
                      { label: "Email confirmacion", value: bank.email, copy: true },
                      {
                        label: "Total a transferir",
                        value: `$${subtotal.toFixed(2)}`,
                        copy: true,
                        accent: true,
                      },
                    ].map((row) => (
                      <div
                        key={row.label}
                        className={`group flex items-start justify-between gap-2 rounded-xl border px-3 py-2 transition-colors ${
                          row.accent
                            ? "border-primary/40 bg-primary/10"
                            : "border-border bg-card hover:border-primary/30"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                            {row.label}
                          </p>
                          <p
                            className={`mt-0.5 truncate text-sm font-bold ${
                              row.accent ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {row.value}
                          </p>
                        </div>
                        {row.copy ? (
                          <button
                            onClick={() => copyToClipboard(row.label, row.value)}
                            className="rounded-md border border-border p-1.5 text-muted-foreground transition-all hover:border-primary/40 hover:text-primary"
                          >
                            {copiedField === row.label ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sender info */}
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Titular que envio
                    </label>
                    <input
                      value={transferData.sender}
                      onChange={(event) =>
                        setTransferData((current) => ({ ...current, sender: event.target.value }))
                      }
                      placeholder="Nombre del titular de la cuenta origen"
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                      Numero de comprobante
                    </label>
                    <input
                      value={transferData.reference}
                      onChange={(event) =>
                        setTransferData((current) => ({ ...current, reference: event.target.value }))
                      }
                      placeholder="Referencia o numero de transaccion"
                      className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                    Comprobante (foto o PDF)
                  </label>
                  <label className="group flex cursor-pointer items-center justify-between gap-3 rounded-xl border-2 border-dashed border-border bg-secondary/20 px-4 py-3.5 text-sm transition-all hover:border-primary/40 hover:bg-primary/5">
                    <span className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        {transferData.proofName ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                      </div>
                      <span className="flex flex-col">
                        <span className="text-sm font-bold text-foreground">
                          {transferData.proofName || "Subir comprobante de transferencia"}
                        </span>
                        <span className="text-[11px] text-muted-foreground">JPG, PNG o PDF — max 10MB</span>
                      </span>
                    </span>
                    <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                      Seleccionar
                    </span>
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (!file) {
                          setTransferData((current) => ({ ...current, proofName: "", proofDataUrl: "", proofMimeType: "" }))
                          return
                        }
                        if (file.size > 6 * 1024 * 1024) {
                          alert("El archivo supera 6MB. Comprime la imagen y vuelve a intentarlo.")
                          return
                        }
                        const reader = new FileReader()
                        reader.onload = () => {
                          if (typeof reader.result !== "string") return
                          setTransferData((current) => ({
                            ...current,
                            proofName: file.name,
                            proofDataUrl: reader.result as string,
                            proofMimeType: file.type,
                          }))
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                </div>

                <div className="flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 px-3 py-2.5">
                  <Receipt className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                  <div className="text-[11px] leading-relaxed text-amber-200/90">
                    Tu acceso se activa automaticamente en menos de 30 minutos cuando validemos la
                    transferencia. Te notificaremos por email.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT — sticky order summary */}
        <div className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-3xl border border-border bg-card p-6 shadow-[0_28px_90px_rgba(0,0,0,0.1)]">
            <h2 className="mb-1 text-lg font-black text-foreground">Resumen del pedido</h2>
            <p className="mb-5 text-xs text-muted-foreground">
              {paidItems.length} {paidItems.length === 1 ? "curso" : "cursos"} en tu compra
            </p>

            <div className="space-y-2.5 text-sm">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Precio original</span>
                <span className={savings > 0 ? "line-through" : ""}>${original.toFixed(2)}</span>
              </div>
              {savings > 0 ? (
                <div className="flex items-center justify-between text-emerald-500">
                  <span>Descuento ({discountPercent}%)</span>
                  <span>−${savings.toFixed(2)}</span>
                </div>
              ) : null}
              <div className="border-t border-border pt-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-base font-bold text-foreground">Total</span>
                  <span className="text-3xl font-black text-foreground">${subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {paymentError ? (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2.5 text-xs leading-relaxed text-red-400">
                {paymentError}
              </div>
            ) : null}

            <button
              onClick={handleConfirm}
              disabled={processing}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
            >
              {processing ? (
                <>
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  Procesando...
                </>
              ) : paymentMethod === "card" ? (
                <>
                  <Lock className="h-4 w-4" />
                  Paga ${subtotal.toFixed(2)} ahora
                </>
              ) : (
                <>
                  <Landmark className="h-4 w-4" />
                  Registrar transferencia
                </>
              )}
            </button>

            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Al confirmar aceptas nuestras condiciones de uso
            </p>

            {/* Trust badges */}
            <div className="mt-5 grid grid-cols-3 gap-2 border-t border-border pt-5 text-center">
              <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
                <ShieldCheck className="mx-auto mb-1 h-4 w-4 text-primary" />
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Cifrado SSL
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
                <BadgeCheck className="mx-auto mb-1 h-4 w-4 text-primary" />
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  30 dias garantia
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
                <Zap className="mx-auto mb-1 h-4 w-4 text-primary" />
                <div className="text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Acceso inmediato
                </div>
              </div>
            </div>

            {/* Coupon */}
            <button className="mt-4 w-full rounded-xl border border-dashed border-border bg-secondary/10 px-4 py-2.5 text-sm font-semibold text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
              Aplicar cupon
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardCheckoutPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-6xl py-10 text-sm text-muted-foreground">Cargando checkout...</div>}>
      <DashboardCheckoutContent />
    </Suspense>
  )
}
