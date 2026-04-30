"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  CreditCard,
  Headphones,
  Landmark,
  Receipt,
  ShieldCheck,
  Undo2,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  type PaymentRecord,
  type PaymentStatus,
  getPayments,
  getPaymentsEventName,
  getPaymentsForUser,
} from "@/lib/payments"

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
  switch (status) {
    case "pending":
      return <Clock className="h-3.5 w-3.5" />
    case "verified":
      return <CheckCircle2 className="h-3.5 w-3.5" />
    case "rejected":
      return <XCircle className="h-3.5 w-3.5" />
    case "refunded":
      return <Undo2 className="h-3.5 w-3.5" />
  }
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return `${date.toLocaleDateString("es-EC", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })} - ${date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`
  } catch {
    return iso
  }
}

export default function DashboardPagosPanel() {
  const { user } = useAuth()
  const [payments, setPayments] = useState<PaymentRecord[]>([])

  useEffect(() => {
    const sync = () => {
      if (!user) return
      setPayments(getPaymentsForUser(user.id))
    }
    sync()
    window.addEventListener(getPaymentsEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getPaymentsEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [user])

  const sorted = useMemo(
    () => [...payments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [payments]
  )
  const pending = sorted.filter((payment) => payment.status === "pending")
  const totalPaid = sorted
    .filter((payment) => payment.status === "verified")
    .reduce((sum, payment) => sum + payment.amount, 0)

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">Mis pagos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Historial de transacciones, comprobantes y estado de validacion.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Total invertido
          </p>
          <div className="mt-2 text-3xl font-black text-foreground">${totalPaid.toFixed(2)}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {sorted.filter((payment) => payment.status === "verified").length} pagos aprobados
          </p>
        </div>
        <div className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-amber-400">En validacion</p>
          <div className="mt-2 text-3xl font-black text-foreground">{pending.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Transferencias esperando confirmacion del equipo
          </p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Operaciones</p>
          <div className="mt-2 text-3xl font-black text-foreground">{sorted.length}</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Total registradas en tu cuenta</p>
        </div>
      </div>

      {sorted.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
            <Receipt className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-lg font-black text-foreground">Aun no tienes pagos</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Cuando completes tu primera compra, podras ver el estado y los comprobantes aqui.
          </p>
          <Link
            href="/cursos"
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
          >
            Explorar cursos
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
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

                  {payment.method === "transfer" && payment.transfer ? (
                    <div className="rounded-xl border border-border bg-secondary/15 p-3 text-xs text-muted-foreground">
                      <p>
                        <span className="text-foreground">Referencia:</span>{" "}
                        <span className="font-mono">{payment.transfer.reference}</span>
                      </p>
                      {payment.transfer.proofName ? (
                        <p className="mt-1">Comprobante: {payment.transfer.proofName}</p>
                      ) : null}
                    </div>
                  ) : null}

                  {payment.status === "pending" ? (
                    <div className="rounded-xl border border-amber-500/30 bg-amber-500/8 p-3 text-[11px] leading-relaxed text-amber-200/90">
                      <ShieldCheck className="mb-1 h-4 w-4 text-amber-400" />
                      Estamos validando tu transferencia. Te activamos los cursos en cuanto aprobemos.
                    </div>
                  ) : null}

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
      )}
    </div>
  )
}
