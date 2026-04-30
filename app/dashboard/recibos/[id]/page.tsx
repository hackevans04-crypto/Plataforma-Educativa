"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useEffect, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, CheckCircle2, Clock, CreditCard, Landmark, Printer, ShieldCheck, XCircle } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import { getPaymentById, type PaymentRecord, type PaymentStatus } from "@/lib/payments"

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente de validacion",
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

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString("es-EC", { day: "numeric", month: "long", year: "numeric" })
  } catch {
    return iso
  }
}

function formatShortDate(iso: string) {
  try {
    const date = new Date(iso)
    return date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })
  } catch {
    return iso
  }
}

function statusIcon(status: PaymentStatus) {
  if (status === "pending") return <Clock className="h-3 w-3" />
  if (status === "verified") return <CheckCircle2 className="h-3 w-3" />
  if (status === "rejected") return <XCircle className="h-3 w-3" />
  return <CheckCircle2 className="h-3 w-3" />
}

export default function ReciboPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const [payment, setPayment] = useState<PaymentRecord | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    const found = getPaymentById(String(id))
    setPayment(found)
    setLoading(false)
  }, [id])

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
      </div>
    )
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-2xl rounded-3xl border border-border bg-card p-10 text-center">
        <h1 className="font-display text-2xl text-foreground">Recibo no encontrado</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Es posible que este recibo haya sido eliminado o no exista.
        </p>
        <Link
          href="/dashboard/perfil?tab=compras"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial
        </Link>
      </div>
    )
  }

  const orderNumber = `HE-${payment.id.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, 18)}`
  const isCard = payment.method === "card"
  const subtotalOriginal = payment.subtotal + payment.savings

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12">
      {/* Top actions — hidden on print */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <button
          onClick={() => {
            if (window.history.length > 1) router.back()
            else router.push("/dashboard/perfil?tab=compras")
          }}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm font-bold text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver al historial
        </button>
        <button
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2 text-sm font-bold text-white shadow-[0_10px_24px_rgba(232,57,42,0.3)]"
        >
          <Printer className="h-4 w-4" />
          Imprimir o guardar PDF
        </button>
      </div>

      {/* Receipt body */}
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-[0_28px_90px_rgba(0,0,0,0.12)] print:rounded-none print:border-0 print:shadow-none">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-border bg-gradient-to-br from-primary/8 to-transparent px-8 py-7 print:bg-white">
          <div>
            <h1 className="font-display text-3xl text-foreground md:text-4xl">Recibo</h1>
            <p className="mt-1 text-sm text-muted-foreground">Recibo - {formatDate(payment.createdAt)}</p>
          </div>
          <div className="flex items-center gap-3">
            <Image src="/images/logo.png" alt="Hack Evans" width={48} height={48} />
            <div>
              <p className="font-display text-xl text-foreground">Hack Evans</p>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                Consultoria educativa
              </p>
            </div>
          </div>
        </div>

        {/* Vendor + meta */}
        <div className="grid gap-6 border-b border-border px-8 py-6 md:grid-cols-2">
          <div>
            <h2 className="text-base font-black text-foreground">Hack Evans, Inc.</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Consultoria Educativa
              <br />
              Quito, Ecuador
              <br />
              <Link href="/" className="text-primary hover:underline">
                hackevans.com
              </Link>
            </p>
          </div>
          <div className="text-sm text-muted-foreground md:text-right">
            <p>
              <span className="font-bold text-foreground">Fecha:</span> {formatDate(payment.createdAt)}
            </p>
            <p className="mt-1 break-all">
              <span className="font-bold text-foreground">N.° de pedido:</span> {orderNumber}
            </p>
            <p className="mt-2">
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${STATUS_STYLES[payment.status]}`}
              >
                {statusIcon(payment.status)}
                {STATUS_LABEL[payment.status]}
              </span>
            </p>
          </div>
        </div>

        {/* Sold to */}
        <div className="border-b border-border px-8 py-5">
          <p className="text-sm">
            <span className="font-bold text-foreground">Vendido a:</span>{" "}
            <span className="text-muted-foreground">
              {payment.userName || user?.name || "Cliente"} · {payment.userEmail || user?.email}
            </span>
          </p>
        </div>

        {/* Items table */}
        <div className="px-8 py-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  <th className="py-3 text-left font-bold">Articulo</th>
                  <th className="py-3 text-left font-bold">Pedido</th>
                  <th className="py-3 text-left font-bold">Codigo</th>
                  <th className="py-3 text-center font-bold">Cantidad</th>
                  <th className="py-3 text-right font-bold">Precio</th>
                  <th className="py-3 text-right font-bold">Importe</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {payment.items.map((item) => (
                  <tr key={item.id}>
                    <td className="py-4 align-top">
                      <div className="text-sm font-bold text-foreground">{item.titulo}</div>
                      <div className="text-xs text-muted-foreground">{item.instructor}</div>
                    </td>
                    <td className="py-4 align-top text-sm text-muted-foreground">
                      {formatShortDate(payment.createdAt)}
                    </td>
                    <td className="py-4 align-top text-xs font-mono text-muted-foreground">—</td>
                    <td className="py-4 align-top text-center text-sm text-foreground">1</td>
                    <td className="py-4 align-top text-right text-sm text-foreground">
                      ${item.precio.toFixed(2)} US$
                    </td>
                    <td className="py-4 align-top text-right text-sm font-bold text-foreground">
                      ${item.precio.toFixed(2)} US$
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                {payment.savings > 0 ? (
                  <>
                    <tr className="text-sm">
                      <td colSpan={5} className="pt-4 text-right text-muted-foreground">
                        Subtotal
                      </td>
                      <td className="pt-4 text-right text-muted-foreground">
                        ${subtotalOriginal.toFixed(2)} US$
                      </td>
                    </tr>
                    <tr className="text-sm">
                      <td colSpan={5} className="py-1 text-right text-emerald-500">
                        Descuento
                      </td>
                      <td className="py-1 text-right text-emerald-500">
                        −${payment.savings.toFixed(2)} US$
                      </td>
                    </tr>
                  </>
                ) : null}
                <tr>
                  <td colSpan={5} className="border-t border-border pt-3 text-right text-sm font-bold text-foreground">
                    Total pagado
                  </td>
                  <td className="border-t border-border pt-3 text-right text-lg font-black text-foreground">
                    ${payment.amount.toFixed(2)} US$
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Payment method */}
        <div className="grid gap-4 border-t border-border bg-secondary/15 px-8 py-6 md:grid-cols-2 print:bg-white">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Metodo de pago
            </p>
            <div className="mt-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                {isCard ? <CreditCard className="h-5 w-5" /> : <Landmark className="h-5 w-5" />}
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {isCard ? "Tarjeta" : "Transferencia bancaria"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {isCard && payment.card
                    ? `${payment.card.brand?.toUpperCase()} ····${payment.card.last4}`
                    : payment.transfer?.reference
                      ? `Referencia ${payment.transfer.reference}`
                      : "—"}
                </p>
              </div>
            </div>
          </div>
          <div className="md:text-right">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Importe pagado
            </p>
            <p className="mt-2 text-2xl font-black text-foreground">${payment.amount.toFixed(2)} US$</p>
            {payment.verifiedAt ? (
              <p className="text-xs text-muted-foreground">Confirmado {formatDate(payment.verifiedAt)}</p>
            ) : null}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border px-8 py-5 text-xs leading-relaxed text-muted-foreground">
          <div className="flex items-start gap-2">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
            <div>
              Este recibo es generado automaticamente cuando completas una compra. Conservalo para cualquier
              consulta o reembolso. Para soporte:{" "}
              <Link href="/dashboard/soporte" className="text-primary hover:underline">
                centro de ayuda
              </Link>
              .
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
