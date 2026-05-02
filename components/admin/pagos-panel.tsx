"use client"

import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  Filter,
  Landmark,
  RefreshCw,
  Save,
  Search,
  Settings2,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Undo2,
  User,
  X,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  type AuditEntry,
  type BankConfig,
  type PaymentRecord,
  type PaymentStatus,
  type RefundRequest,
  getAuditEventName,
  getAuditLog,
  getBankConfig,
  getBankConfigEventName,
  getPayments,
  getPaymentsEventName,
  getRefundRequests,
  getRefundRequestsEventName,
  refundPayment,
  rejectPayment,
  resolveRefundRequest,
  saveBankConfig,
  setPaymentNote,
  verifyPayment,
} from "@/lib/payments"
import { Calendar, Download, FileSpreadsheet } from "lucide-react"

type TabKey = "todas" | "pending" | "verified" | "rejected" | "refunds" | "audit" | "config"

const TAB_LABELS: Record<TabKey, string> = {
  todas: "Todos",
  pending: "Pendientes",
  verified: "Aprobados",
  rejected: "Rechazados",
  refunds: "Reembolsos",
  audit: "Contabilidad",
  config: "Configuración",
}

const STATUS_LABEL: Record<PaymentStatus, string> = {
  pending: "Pendiente",
  verified: "Aprobado",
  rejected: "Rechazado",
  refunded: "Reembolsado",
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return `${date.toLocaleDateString("es-EC", { day: "2-digit", month: "short", year: "numeric" })} - ${date.toLocaleTimeString("es-EC", { hour: "2-digit", minute: "2-digit" })}`
  } catch {
    return iso
  }
}

function StatusBadge({ status }: { status: PaymentStatus }) {
  const styles: Record<PaymentStatus, string> = {
    pending: "border-amber-500/35 bg-amber-500/10 text-amber-400",
    verified: "border-emerald-500/35 bg-emerald-500/10 text-emerald-400",
    rejected: "border-red-500/35 bg-red-500/10 text-red-400",
    refunded: "border-purple-500/35 bg-purple-500/10 text-purple-300",
  }
  const icons: Record<PaymentStatus, React.ReactNode> = {
    pending: <Clock className="h-3 w-3" />,
    verified: <CheckCircle2 className="h-3 w-3" />,
    rejected: <XCircle className="h-3 w-3" />,
    refunded: <Undo2 className="h-3 w-3" />,
  }
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${styles[status]}`}
    >
      {icons[status]}
      {STATUS_LABEL[status]}
    </span>
  )
}

function PaymentDetailDialog({
  payment,
  onClose,
  onVerify,
  onReject,
  onRefund,
  onNote,
}: {
  payment: PaymentRecord | null
  onClose: () => void
  onVerify: () => void
  onReject: (reason: string) => void
  onRefund: (reason: string) => void
  onNote: (note: string) => void
}) {
  const [reason, setReason] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    setReason("")
    setNote(payment?.adminNote || "")
  }, [payment])

  if (!payment) return null

  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-[151] flex items-center justify-center p-4">
        <div
          onClick={(event) => event.stopPropagation()}
          className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-[0_30px_100px_rgba(0,0,0,0.45)]"
        >
          <div className="flex items-start justify-between gap-4 border-b border-border bg-gradient-to-r from-primary/8 to-transparent px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
                Detalle de pago - {payment.method === "card" ? "Tarjeta" : "Transferencia"}
              </p>
              <h2 className="mt-1 text-xl font-black text-foreground">{payment.id}</h2>
              <p className="mt-1 text-xs text-muted-foreground">Creado el {formatDate(payment.createdAt)}</p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full border border-border p-2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="grid max-h-[70vh] gap-5 overflow-y-auto px-6 py-5 lg:grid-cols-[1fr_0.85fr]">
            {/* Left: items + payment info */}
            <div className="space-y-5">
              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Cliente
                </h3>
                <div className="rounded-xl border border-border bg-secondary/20 p-4">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" />
                    <span className="font-bold text-foreground">{payment.userName || "Sin nombre"}</span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {payment.userEmail || "Sin email"} · ID {payment.userId}
                  </p>
                </div>
              </div>

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Items ({payment.items.length})
                </h3>
                <div className="space-y-2">
                  {payment.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between rounded-xl border border-border bg-secondary/15 px-3 py-2"
                    >
                      <div className="min-w-0">
                        <div className="truncate text-sm font-bold text-foreground">{item.titulo}</div>
                        <div className="text-[11px] text-muted-foreground">{item.instructor}</div>
                      </div>
                      <div className="text-sm font-bold text-foreground">${item.precio.toFixed(2)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {payment.method === "transfer" && payment.transfer ? (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Datos de transferencia
                  </h3>
                  <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titular envio</span>
                      <span className="font-semibold text-foreground">{payment.transfer.sender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Referencia</span>
                      <span className="font-mono font-semibold text-foreground">{payment.transfer.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Comprobante</span>
                      <span className="font-semibold text-foreground">
                        {payment.transfer.proofName || "No adjunto"}
                      </span>
                    </div>
                  </div>
                  {payment.transfer.proofDataUrl ? (
                    <div className="mt-3 overflow-hidden rounded-xl border border-border bg-secondary/10">
                      {payment.transfer.proofMimeType?.startsWith("image/") ? (
                        <a
                          href={payment.transfer.proofDataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="block"
                        >
                          <img
                            src={payment.transfer.proofDataUrl}
                            alt={payment.transfer.proofName}
                            className="max-h-80 w-full object-contain bg-black/40"
                          />
                          <div className="px-3 py-2 text-[11px] text-muted-foreground hover:text-primary">
                            Click para abrir en tamaño completo · {payment.transfer.proofName}
                          </div>
                        </a>
                      ) : (
                        <a
                          href={payment.transfer.proofDataUrl}
                          download={payment.transfer.proofName}
                          className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-foreground hover:bg-secondary/30"
                        >
                          <span className="truncate">{payment.transfer.proofName}</span>
                          <span className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
                            Descargar
                          </span>
                        </a>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {payment.method === "card" && payment.card ? (
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                    Datos de tarjeta
                  </h3>
                  <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Marca</span>
                      <span className="font-semibold uppercase text-foreground">{payment.card.brand}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Terminacion</span>
                      <span className="font-mono font-semibold text-foreground">**** {payment.card.last4}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Titular</span>
                      <span className="font-semibold text-foreground">{payment.card.holder}</span>
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground">
                  Notas internas
                </h3>
                <textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Notas para tu equipo o el usuario..."
                  className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
                />
                <button
                  onClick={() => onNote(note)}
                  className="mt-2 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/40"
                >
                  <Save className="h-3 w-3" /> Guardar nota
                </button>
              </div>
            </div>

            {/* Right: totals + actions */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-secondary/20 p-4">
                <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">Total</div>
                <div className="mt-1 text-3xl font-black text-foreground">${payment.amount.toFixed(2)}</div>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Estado</span>
                  <StatusBadge status={payment.status} />
                </div>
                {payment.verifiedAt ? (
                  <p className="mt-2 text-[11px] text-emerald-500">
                    Verificado el {formatDate(payment.verifiedAt)}
                  </p>
                ) : null}
                {payment.rejectedAt ? (
                  <p className="mt-2 text-[11px] text-red-400">
                    Rechazado el {formatDate(payment.rejectedAt)}
                    {payment.rejectedReason ? ` - ${payment.rejectedReason}` : ""}
                  </p>
                ) : null}
              </div>

              {payment.status === "pending" || payment.status === "rejected" ? (
                <button
                  onClick={onVerify}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-black text-white shadow-[0_12px_30px_rgba(34,197,94,0.3)] hover:bg-emerald-400"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  Aprobar y activar acceso
                </button>
              ) : null}

              {payment.status === "verified" ? (
                <>
                  <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300">
                    Acceso activo en la cuenta del usuario.
                  </div>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Motivo del reembolso (obligatorio)"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => reason.trim() && onRefund(reason.trim())}
                    disabled={!reason.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-purple-500/30 bg-purple-500/10 px-4 py-2.5 text-sm font-bold text-purple-300 hover:bg-purple-500/15 disabled:opacity-50"
                  >
                    <Undo2 className="h-4 w-4" />
                    Reembolsar y revocar acceso
                  </button>
                </>
              ) : null}

              {payment.status === "pending" ? (
                <>
                  <input
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    placeholder="Motivo del rechazo (visible al usuario)"
                    className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => reason.trim() && onReject(reason.trim())}
                    disabled={!reason.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-300 hover:bg-red-500/15 disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" />
                    Rechazar pago
                  </button>
                </>
              ) : null}

              <div className="rounded-xl border border-border bg-secondary/15 p-3 text-[11px] leading-relaxed text-muted-foreground">
                <ShieldCheck className="mb-1 h-4 w-4 text-primary" />
                Las acciones quedan registradas. Aprobar otorga acceso a los cursos automaticamente.
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

function BankConfigForm() {
  const [config, setConfig] = useState<BankConfig>(() => getBankConfig())
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const sync = () => setConfig(getBankConfig())
    window.addEventListener(getBankConfigEventName(), sync as EventListener)
    return () => window.removeEventListener(getBankConfigEventName(), sync as EventListener)
  }, [])

  const handleSave = () => {
    saveBankConfig(config)
    setSaved(true)
    setTimeout(() => setSaved(false), 1800)
  }

  const update = <K extends keyof BankConfig>(key: K, value: BankConfig[K]) => {
    setConfig((current) => ({ ...current, [key]: value }))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
      <div className="rounded-3xl border border-border bg-card p-6">
        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Landmark className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-foreground">Datos de transferencia</h2>
            <p className="text-xs text-muted-foreground">
              Estos datos se muestran al usuario en el checkout y se pueden copiar.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            { key: "bank", label: "Banco" },
            { key: "type", label: "Tipo de cuenta" },
            { key: "number", label: "Numero de cuenta" },
            { key: "holder", label: "Titular" },
            { key: "ruc", label: "RUC / Cedula" },
            { key: "email", label: "Email confirmacion" },
            { key: "swift", label: "SWIFT/BIC (opcional)" },
            { key: "whatsapp", label: "WhatsApp soporte" },
          ].map((field) => (
            <div key={field.key} className={field.key === "holder" ? "sm:col-span-2" : ""}>
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {field.label}
              </label>
              <input
                value={(config[field.key as keyof BankConfig] as string) || ""}
                onChange={(event) => update(field.key as keyof BankConfig, event.target.value as never)}
                className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </div>
          ))}
        </div>

        <div className="mt-3">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Notas adicionales
          </label>
          <textarea
            value={config.notes || ""}
            onChange={(event) => update("notes", event.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm text-foreground outline-none focus:border-primary"
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] hover:scale-[1.01]"
        >
          {saved ? (
            <>
              <Check className="h-4 w-4" /> Datos guardados
            </>
          ) : (
            <>
              <Save className="h-4 w-4" /> Guardar configuracion
            </>
          )}
        </button>
      </div>

      <div className="space-y-5">
        <div className="rounded-3xl border border-border bg-card p-6">
          <h2 className="mb-3 text-lg font-black text-foreground">Metodos habilitados</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <CreditCard className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Tarjeta</div>
                  <div className="text-[11px] text-muted-foreground">Pago inmediato y verificado</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enabledMethods.card}
                onChange={(event) =>
                  update("enabledMethods", { ...config.enabledMethods, card: event.target.checked })
                }
                className="h-5 w-5 cursor-pointer accent-[#E8392A]"
              />
            </label>
            <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Landmark className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">Transferencia</div>
                  <div className="text-[11px] text-muted-foreground">Validacion manual del equipo</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.enabledMethods.transfer}
                onChange={(event) =>
                  update("enabledMethods", { ...config.enabledMethods, transfer: event.target.checked })
                }
                className="h-5 w-5 cursor-pointer accent-[#E8392A]"
              />
            </label>
          </div>

          <div className="mt-5">
            <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Procesador de tarjetas
            </label>
            <input
              value={config.cardProvider || ""}
              onChange={(event) => update("cardProvider", event.target.value)}
              placeholder="Ej. Stripe, Datafast, Payphone"
              className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <label className="mt-3 flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              checked={config.cardAutoVerify ?? true}
              onChange={(event) => update("cardAutoVerify", event.target.checked)}
              className="mt-0.5 h-4 w-4 cursor-pointer accent-[#E8392A]"
            />
            <span className="text-xs text-muted-foreground">
              Activar acceso automatico cuando el procesador confirma el pago de tarjeta.
            </span>
          </label>
        </div>

        <div className="rounded-3xl border border-emerald-500/25 bg-emerald-500/5 p-6">
          <ShieldCheck className="mb-2 h-5 w-5 text-emerald-500" />
          <h3 className="text-sm font-black text-foreground">Datos cifrados localmente</h3>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            La configuracion bancaria se guarda en almacenamiento del navegador. Sustituye con tu API segura
            cuando integres un procesador real.
          </p>
        </div>
      </div>
    </div>
  )
}

function monthKey(iso: string) {
  const d = new Date(iso)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
}

function monthLabel(key: string) {
  const [y, m] = key.split("-")
  const date = new Date(Number(y), Number(m) - 1, 1)
  return date.toLocaleDateString("es-EC", { month: "long", year: "numeric" })
}

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value).replace(/"/g, '""')
  return /[",\n;]/.test(str) ? `"${str}"` : str
}

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = "﻿" + rows.map((row) => row.map(csvCell).join(";")).join("\r\n")
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

type ReportSection = {
  title: string
  headers?: string[]
  rows: (string | number)[][]
  highlight?: boolean
}

type ReportPayload = {
  title: string
  subtitle: string
  generatedAt: string
  brand: { name: string; tagline: string; logo: string; logoUrl?: string }
  summary: { label: string; value: string; accent?: string }[]
  sections: ReportSection[]
}

async function fetchLogoDataUrl(): Promise<string> {
  try {
    const res = await fetch("/images/logo.png")
    if (!res.ok) return ""
    const blob = await res.blob()
    return await new Promise<string>((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "")
      reader.readAsDataURL(blob)
    })
  } catch {
    return ""
  }
}

function escapeHtml(value: string | number) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function buildReportHtml(payload: ReportPayload, mode: "excel" | "pdf") {
  const sectionsHtml = payload.sections
    .map((section) => {
      const head = section.headers
        ? `<thead><tr>${section.headers.map((h) => `<th>${escapeHtml(h)}</th>`).join("")}</tr></thead>`
        : ""
      const body = section.rows
        .map((row) => `<tr>${row.map((cell) => `<td>${escapeHtml(cell)}</td>`).join("")}</tr>`)
        .join("")
      return `
        <h3 class="${section.highlight ? "section-h highlight" : "section-h"}">${escapeHtml(section.title)}</h3>
        <table class="report-table">${head}<tbody>${body || `<tr><td colspan="${section.headers?.length || 1}" class="empty">Sin registros.</td></tr>`}</tbody></table>
      `
    })
    .join("")

  const summaryHtml = payload.summary
    .map(
      (s) => `
        <div class="summary-card">
          <div class="summary-label">${escapeHtml(s.label)}</div>
          <div class="summary-value" style="color:${s.accent || "#0f172a"}">${escapeHtml(s.value)}</div>
        </div>`,
    )
    .join("")

  const toolbar =
    mode === "pdf"
      ? `<div class="toolbar no-print">
          <button onclick="window.print()" class="tb-btn primary">🖨️ Imprimir / Guardar PDF</button>
          <button onclick="window.close()" class="tb-btn">✕ Cerrar</button>
        </div>`
      : ""

  const printScript =
    mode === "pdf"
      ? `<script>window.addEventListener('load',function(){setTimeout(function(){window.print();},400);});</script>`
      : ""

  const logoNode =
    mode === "pdf" && payload.brand.logoUrl
      ? `<img src="${payload.brand.logoUrl}" alt="${escapeHtml(payload.brand.name)}" class="brand-logo-img" />`
      : `<div class="brand-logo">${escapeHtml(payload.brand.logo)}</div>`

  const sheetName = "Reporte"
  const excelHead = mode === "excel"
    ? `<!--[if gte mso 9]><xml>
<x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
<x:Name>${escapeHtml(sheetName)}</x:Name>
<x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
</x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook>
</xml><![endif]-->`
    : ""
  const htmlOpen = mode === "excel"
    ? `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`
    : `<html lang="es">`
  const metaContent = mode === "excel"
    ? `<meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8" />`
    : `<meta charset="utf-8" />`

  return `<!DOCTYPE html>
${htmlOpen}<head>
${metaContent}
<title>${escapeHtml(payload.title)}</title>
${excelHead}
<style>
  * { box-sizing:border-box; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color:#0f172a; margin:0; padding:32px; background:#f8fafc; }
  .page { max-width:1100px; margin:0 auto; background:#fff; border-radius:14px; padding:36px; box-shadow:0 12px 40px rgba(15,23,42,0.08); }
  .toolbar { position:sticky; top:12px; z-index:50; display:flex; justify-content:flex-end; gap:8px; max-width:1100px; margin:0 auto 16px; }
  .tb-btn { background:#fff; border:1px solid #e2e8f0; border-radius:999px; padding:8px 16px; font-weight:700; font-size:13px; cursor:pointer; box-shadow:0 4px 12px rgba(15,23,42,0.08); color:#0f172a; }
  .tb-btn.primary { background:#E8392A; color:#fff; border-color:#E8392A; }
  .tb-btn:hover { transform:translateY(-1px); }
  .header { display:flex; align-items:center; justify-content:space-between; gap:24px; border-bottom:3px solid #E8392A; padding-bottom:18px; margin-bottom:24px; }
  .brand { display:flex; align-items:center; gap:14px; }
  .brand-logo { width:60px; height:60px; border-radius:14px; background:#E8392A; color:#fff; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:24px; letter-spacing:0.05em; box-shadow:0 8px 20px rgba(232,57,42,0.3); }
  .brand-logo-img { width:60px; height:60px; border-radius:14px; object-fit:cover; box-shadow:0 8px 20px rgba(232,57,42,0.25); }
  .brand-name { font-size:22px; font-weight:900; color:#0f172a; letter-spacing:-0.02em; }
  .brand-tag { font-size:11px; color:#64748b; text-transform:uppercase; letter-spacing:0.18em; margin-top:2px; }
  .doc-meta { text-align:right; font-size:12px; color:#475569; line-height:1.6; }
  .doc-title { font-size:26px; font-weight:900; margin:0 0 6px; color:#0f172a; letter-spacing:-0.02em; }
  .doc-subtitle { font-size:13px; color:#475569; margin:0 0 22px; }
  .summary-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:14px; margin-bottom:26px; }
  .summary-card { border:1px solid #e2e8f0; border-radius:12px; padding:14px 16px; background:linear-gradient(180deg, #ffffff, #f8fafc); }
  .summary-label { font-size:10px; font-weight:700; color:#64748b; text-transform:uppercase; letter-spacing:0.14em; }
  .summary-value { font-size:22px; font-weight:900; margin-top:8px; }
  .section-h { font-size:13px; font-weight:800; color:#0f172a; text-transform:uppercase; letter-spacing:0.16em; margin:24px 0 10px; padding-bottom:6px; border-bottom:2px solid #f1f5f9; }
  .section-h.highlight { color:#E8392A; border-bottom-color:#E8392A; }
  .report-table { width:100%; border-collapse:collapse; font-size:12px; border-radius:10px; overflow:hidden; box-shadow:0 1px 3px rgba(15,23,42,0.05); }
  .report-table th { background:linear-gradient(180deg, #1e293b, #0f172a); color:#fff; text-align:left; padding:10px 12px; font-weight:700; font-size:11px; text-transform:uppercase; letter-spacing:0.1em; }
  .report-table td { border:1px solid #e2e8f0; padding:8px 12px; vertical-align:top; }
  .report-table tr:nth-child(even) td { background:#f8fafc; }
  .empty { text-align:center; color:#94a3b8; font-style:italic; }
  .footer { margin-top:34px; padding-top:16px; border-top:1px solid #e2e8f0; font-size:11px; color:#64748b; text-align:center; }
  @media print {
    body { padding:0; background:#fff; }
    .page { box-shadow:none; border-radius:0; padding:18px; max-width:none; }
    .no-print { display:none !important; }
    .summary-grid { grid-template-columns:repeat(4,1fr); }
    @page { size:A4; margin:14mm; }
  }
</style>
</head><body>
  ${toolbar}
  <div class="page">
    <div class="header">
      <div class="brand">
        ${logoNode}
        <div>
          <div class="brand-name">${escapeHtml(payload.brand.name)}</div>
          <div class="brand-tag">${escapeHtml(payload.brand.tagline)}</div>
        </div>
      </div>
      <div class="doc-meta">
        Generado: ${escapeHtml(payload.generatedAt)}<br/>
        Documento contable interno
      </div>
    </div>
    <h1 class="doc-title">${escapeHtml(payload.title)}</h1>
    <p class="doc-subtitle">${escapeHtml(payload.subtitle)}</p>
    <div class="summary-grid">${summaryHtml}</div>
    ${sectionsHtml}
    <div class="footer">© Hack Evans · Reporte contable confidencial · No distribuir.</div>
  </div>
${printScript}
</body></html>`
}

async function downloadExcel(filename: string, payload: ReportPayload) {
  if (!payload.brand.logoUrl) payload.brand.logoUrl = await fetchLogoDataUrl()
  const html = buildReportHtml(payload, "excel")
  const blob = new Blob(["﻿" + html], { type: "application/vnd.ms-excel;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename.endsWith(".xls") ? filename : `${filename}.xls`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function openPdf(payload: ReportPayload) {
  if (!payload.brand.logoUrl) payload.brand.logoUrl = await fetchLogoDataUrl()
  const html = buildReportHtml(payload, "pdf")
  const win = window.open("", "_blank")
  if (!win) {
    alert("Permite ventanas emergentes para descargar el PDF.")
    return
  }
  win.document.open()
  win.document.write(html)
  win.document.close()
}

export default function PagosPanel() {
  const { user } = useAuth()
  const [tab, setTab] = useState<TabKey>("pending")
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [search, setSearch] = useState("")
  const [methodFilter, setMethodFilter] = useState<"all" | "card" | "transfer">("all")
  const [openPayment, setOpenPayment] = useState<PaymentRecord | null>(null)
  const [refundReqs, setRefundReqs] = useState<RefundRequest[]>([])
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [auditMonth, setAuditMonth] = useState<string>("")

  useEffect(() => {
    const syncPayments = () => setPayments(getPayments())
    const syncRefunds = () => setRefundReqs(getRefundRequests())
    const syncAudit = () => setAudit(getAuditLog())
    syncPayments()
    syncRefunds()
    syncAudit()
    window.addEventListener(getPaymentsEventName(), syncPayments as EventListener)
    window.addEventListener(getRefundRequestsEventName(), syncRefunds as EventListener)
    window.addEventListener(getAuditEventName(), syncAudit as EventListener)
    window.addEventListener("storage", syncPayments)
    window.addEventListener("storage", syncRefunds)
    window.addEventListener("storage", syncAudit)
    return () => {
      window.removeEventListener(getPaymentsEventName(), syncPayments as EventListener)
      window.removeEventListener(getRefundRequestsEventName(), syncRefunds as EventListener)
      window.removeEventListener(getAuditEventName(), syncAudit as EventListener)
      window.removeEventListener("storage", syncPayments)
      window.removeEventListener("storage", syncRefunds)
      window.removeEventListener("storage", syncAudit)
    }
  }, [])

  const pendingRefundCount = refundReqs.filter((r) => r.status === "pending").length

  const auditMonths = useMemo(() => {
    const set = new Set<string>()
    audit.forEach((entry) => set.add(monthKey(entry.createdAt)))
    payments.forEach((entry) => set.add(monthKey(entry.createdAt)))
    return Array.from(set).sort().reverse()
  }, [audit, payments])

  const activeMonth = auditMonth || auditMonths[0] || monthKey(new Date().toISOString())

  const auditByMonth = useMemo(
    () => audit.filter((entry) => monthKey(entry.createdAt) === activeMonth),
    [audit, activeMonth],
  )

  const paymentsByMonth = useMemo(
    () => payments.filter((entry) => monthKey(entry.createdAt) === activeMonth),
    [payments, activeMonth],
  )

  const monthSummary = useMemo(() => {
    const verified = paymentsByMonth.filter((p) => p.status === "verified")
    const refunded = paymentsByMonth.filter((p) => p.status === "refunded")
    const pending = paymentsByMonth.filter((p) => p.status === "pending")
    return {
      total: paymentsByMonth.length,
      ingresos: verified.reduce((s, p) => s + p.amount, 0),
      reembolsado: refunded.reduce((s, p) => s + p.amount, 0),
      pendientes: pending.length,
    }
  }, [paymentsByMonth])

  const buildMonthPayload = (): ReportPayload => ({
    title: `Reporte contable · ${monthLabel(activeMonth)}`,
    subtitle: "Detalle de operaciones, reembolsos y bitácora del periodo seleccionado.",
    generatedAt: new Date().toLocaleString("es-EC"),
    brand: { name: "Hack Evans", tagline: "Consultoría educativa", logo: "HE" },
    summary: [
      { label: "Operaciones", value: String(monthSummary.total), accent: "#0f172a" },
      { label: "Ingresos verificados", value: `$${monthSummary.ingresos.toFixed(2)}`, accent: "#16a34a" },
      { label: "Reembolsado", value: `$${monthSummary.reembolsado.toFixed(2)}`, accent: "#9333ea" },
      { label: "Pendientes", value: String(monthSummary.pendientes), accent: "#d97706" },
    ],
    sections: [
      {
        title: "Pagos del mes",
        highlight: true,
        headers: ["ID", "Fecha", "Cliente", "Email", "Método", "Monto", "Estado", "Referencia", "Cursos"],
        rows: paymentsByMonth.map((p) => [
          p.id,
          new Date(p.createdAt).toLocaleString("es-EC"),
          p.userName || "",
          p.userEmail || "",
          p.method === "card" ? "Tarjeta" : "Transferencia",
          `$${p.amount.toFixed(2)}`,
          p.status === "verified" ? "Aprobado" : p.status === "pending" ? "Pendiente" : p.status === "refunded" ? "Reembolsado" : "Rechazado",
          p.method === "card" ? `**** ${p.card?.last4 || ""}` : p.transfer?.reference || "",
          p.items.map((i) => i.titulo).join(" | "),
        ]),
      },
      {
        title: "Bitácora contable del mes",
        headers: ["Fecha", "Acción", "Actor", "Monto", "Pago ID", "Descripción"],
        rows: auditByMonth.map((a) => [
          new Date(a.createdAt).toLocaleString("es-EC"),
          a.action.replace(/_/g, " "),
          a.actorName || a.actorId,
          a.amount ? `$${a.amount.toFixed(2)}` : "",
          a.paymentId || "",
          a.description,
        ]),
      },
    ],
  })

  const buildYearPayload = (): ReportPayload => {
    const year = activeMonth.slice(0, 4)
    const yearPayments = payments.filter((p) => monthKey(p.createdAt).startsWith(year))
    const yearAudit = audit.filter((a) => monthKey(a.createdAt).startsWith(year))
    const monthMap = new Map<string, { count: number; ingresos: number; reembolsos: number }>()
    yearPayments.forEach((p) => {
      const k = monthKey(p.createdAt)
      const cur = monthMap.get(k) || { count: 0, ingresos: 0, reembolsos: 0 }
      cur.count += 1
      if (p.status === "verified") cur.ingresos += p.amount
      if (p.status === "refunded") cur.reembolsos += p.amount
      monthMap.set(k, cur)
    })
    const totalIngresos = yearPayments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0)
    const totalReembolsado = yearPayments.filter((p) => p.status === "refunded").reduce((s, p) => s + p.amount, 0)

    return {
      title: `Reporte contable anual · ${year}`,
      subtitle: "Resumen mensual, detalle de pagos y bitácora consolidada del año fiscal.",
      generatedAt: new Date().toLocaleString("es-EC"),
      brand: { name: "Hack Evans", tagline: "Consultoría educativa", logo: "HE" },
      summary: [
        { label: "Operaciones del año", value: String(yearPayments.length), accent: "#0f172a" },
        { label: "Ingresos verificados", value: `$${totalIngresos.toFixed(2)}`, accent: "#16a34a" },
        { label: "Total reembolsado", value: `$${totalReembolsado.toFixed(2)}`, accent: "#9333ea" },
        { label: "Neto del año", value: `$${(totalIngresos - totalReembolsado).toFixed(2)}`, accent: "#E8392A" },
      ],
      sections: [
        {
          title: "Resumen mensual",
          highlight: true,
          headers: ["Mes", "Operaciones", "Ingresos USD", "Reembolsos USD", "Neto USD"],
          rows: Array.from(monthMap.entries())
            .sort()
            .map(([k, v]) => [
              monthLabel(k),
              v.count,
              `$${v.ingresos.toFixed(2)}`,
              `$${v.reembolsos.toFixed(2)}`,
              `$${(v.ingresos - v.reembolsos).toFixed(2)}`,
            ]),
        },
        {
          title: "Detalle de pagos",
          headers: ["ID", "Fecha", "Cliente", "Email", "Método", "Monto", "Estado", "Cursos"],
          rows: yearPayments.map((p) => [
            p.id,
            new Date(p.createdAt).toLocaleString("es-EC"),
            p.userName || "",
            p.userEmail || "",
            p.method === "card" ? "Tarjeta" : "Transferencia",
            `$${p.amount.toFixed(2)}`,
            p.status === "verified" ? "Aprobado" : p.status === "pending" ? "Pendiente" : p.status === "refunded" ? "Reembolsado" : "Rechazado",
            p.items.map((i) => i.titulo).join(" | "),
          ]),
        },
        {
          title: "Bitácora contable del año",
          headers: ["Fecha", "Acción", "Actor", "Monto", "Pago ID", "Descripción"],
          rows: yearAudit.map((a) => [
            new Date(a.createdAt).toLocaleString("es-EC"),
            a.action.replace(/_/g, " "),
            a.actorName || a.actorId,
            a.amount ? `$${a.amount.toFixed(2)}` : "",
            a.paymentId || "",
            a.description,
          ]),
        },
      ],
    }
  }

  const handleExportMonthExcel = () => downloadExcel(`hackevans-contabilidad-${activeMonth}.xls`, buildMonthPayload())
  const handleExportMonthPdf = () => openPdf(buildMonthPayload())
  const handleExportYearExcel = () => downloadExcel(`hackevans-contabilidad-${activeMonth.slice(0, 4)}.xls`, buildYearPayload())
  const handleExportYearPdf = () => openPdf(buildYearPayload())

  const stats = useMemo(() => {
    const pending = payments.filter((payment) => payment.status === "pending").length
    const verified = payments.filter((payment) => payment.status === "verified")
    const rejected = payments.filter((payment) => payment.status === "rejected").length
    const ingresos = verified.reduce((sum, payment) => sum + payment.amount, 0)
    return { pending, verified: verified.length, rejected, ingresos, total: payments.length }
  }, [payments])

  const filtered = useMemo(() => {
    return payments
      .filter((payment) => {
        if (tab !== "todas" && tab !== "config" && payment.status !== tab) return false
        if (methodFilter !== "all" && payment.method !== methodFilter) return false
        if (search.trim()) {
          const query = search.trim().toLowerCase()
          const haystack = `${payment.userName || ""} ${payment.userEmail || ""} ${payment.id} ${payment.transfer?.reference || ""}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  }, [payments, tab, methodFilter, search])

  const handleVerify = (payment: PaymentRecord) => {
    if (!user) return
    const updated = verifyPayment(payment.id, user.id, payment.adminNote)
    if (updated) setOpenPayment(updated)
  }

  const handleReject = (payment: PaymentRecord, reason: string) => {
    if (!user) return
    const updated = rejectPayment(payment.id, user.id, reason)
    if (updated) setOpenPayment(updated)
  }

  const handleRefund = (payment: PaymentRecord, reason: string) => {
    if (!user) return
    const updated = refundPayment(payment.id, user.id, reason)
    if (updated) setOpenPayment(updated)
  }

  const handleNote = (payment: PaymentRecord, note: string) => {
    const updated = setPaymentNote(payment.id, note)
    if (updated) setOpenPayment(updated)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <DollarSign className="h-3.5 w-3.5" />
            Centro de pagos
          </p>
          <h1 className="font-display text-3xl text-foreground md:text-4xl">Pagos y cobros</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Verifica transferencias, aprueba accesos y administra los datos bancarios y de tarjetas.
          </p>
        </div>
        <button
          onClick={() => setPayments(getPayments())}
          className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-xs font-bold text-foreground hover:border-primary/40"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refrescar
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total operaciones", value: stats.total, icon: TrendingUp, accent: "text-primary" },
          { label: "Pendientes", value: stats.pending, icon: Clock, accent: "text-amber-400" },
          { label: "Aprobados", value: stats.verified, icon: BadgeCheck, accent: "text-emerald-400" },
          {
            label: "Ingresos verificados",
            value: `$${stats.ingresos.toFixed(2)}`,
            icon: Banknote,
            accent: "text-foreground",
          },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                {card.label}
              </p>
              <card.icon className={`h-4 w-4 ${card.accent}`} />
            </div>
            <div className={`mt-3 text-3xl font-black ${card.accent}`}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-1.5">
        {(Object.keys(TAB_LABELS) as TabKey[]).map((key) => {
          const count =
            key === "pending"
              ? stats.pending
              : key === "verified"
                ? stats.verified
                : key === "rejected"
                  ? stats.rejected
                  : key === "todas"
                    ? stats.total
                    : key === "refunds"
                      ? pendingRefundCount
                      : null
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
                tab === key
                  ? "bg-primary text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)]"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              {key === "config" ? <Settings2 className="h-4 w-4" /> : key === "refunds" ? <Undo2 className="h-4 w-4" /> : key === "audit" ? <FileSpreadsheet className="h-4 w-4" /> : null}
              {TAB_LABELS[key]}
              {count !== null && count > 0 ? (
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-black ${tab === key ? "bg-white/20" : "bg-secondary text-foreground"}`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          )
        })}
      </div>

      {tab === "config" ? (
        <BankConfigForm />
      ) : tab === "refunds" ? (
        <RefundRequestsView
          requests={refundReqs}
          onResolve={(id, decision, note) => user && resolveRefundRequest(id, user.id, decision, note)}
        />
      ) : tab === "audit" ? (
        <AuditView
          months={auditMonths}
          activeMonth={activeMonth}
          onMonthChange={setAuditMonth}
          summary={monthSummary}
          activeLabel={monthLabel(activeMonth)}
          payments={paymentsByMonth}
          audit={auditByMonth}
          onExportMonthExcel={handleExportMonthExcel}
          onExportMonthPdf={handleExportMonthPdf}
          onExportYearExcel={handleExportYearExcel}
          onExportYearPdf={handleExportYearPdf}
        />
      ) : (
        <>
          {/* Filters */}
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar por usuario, email, ID o referencia..."
                className="h-11 w-full rounded-xl border border-border bg-background pl-11 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/20 p-1">
              {(["all", "card", "transfer"] as const).map((option) => (
                <button
                  key={option}
                  onClick={() => setMethodFilter(option)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                    methodFilter === option
                      ? "bg-card text-foreground shadow-[0_4px_12px_rgba(0,0,0,0.12)]"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {option === "all" ? "Todos" : option === "card" ? "Tarjeta" : "Transferencia"}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="hidden grid-cols-[1.5fr_1fr_1fr_0.8fr_0.6fr_auto] gap-4 border-b border-border bg-secondary/20 px-5 py-3 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground lg:grid">
              <span>Cliente</span>
              <span>Items</span>
              <span>Metodo</span>
              <span>Total</span>
              <span>Estado</span>
              <span></span>
            </div>

            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-secondary/30 text-muted-foreground">
                  <Filter className="h-6 w-6" />
                </div>
                <p className="font-bold text-foreground">No hay pagos en esta vista</p>
                <p className="text-xs text-muted-foreground">Ajusta los filtros o espera nuevos pagos.</p>
              </div>
            ) : (
              filtered.map((payment) => (
                <div
                  key={payment.id}
                  className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 transition-colors last:border-b-0 hover:bg-secondary/15 lg:grid-cols-[1.5fr_1fr_1fr_0.8fr_0.6fr_auto]"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-bold text-foreground">
                      {payment.userName || payment.userId}
                    </div>
                    <div className="truncate text-[11px] text-muted-foreground">
                      {payment.userEmail || payment.id}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{formatDate(payment.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-foreground">
                      {payment.items.length} {payment.items.length === 1 ? "curso" : "cursos"}
                    </div>
                    <div className="line-clamp-1 text-[11px] text-muted-foreground">
                      {payment.items.map((item) => item.titulo).join(", ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {payment.method === "card" ? (
                      <CreditCard className="h-4 w-4 text-primary" />
                    ) : (
                      <Landmark className="h-4 w-4 text-primary" />
                    )}
                    <div>
                      <div className="text-sm font-bold text-foreground">
                        {payment.method === "card" ? "Tarjeta" : "Transferencia"}
                      </div>
                      <div className="text-[11px] text-muted-foreground">
                        {payment.method === "card" && payment.card
                          ? `**** ${payment.card.last4}`
                          : payment.transfer?.reference
                            ? `Ref ${payment.transfer.reference}`
                            : "—"}
                      </div>
                    </div>
                  </div>
                  <div className="text-base font-black text-foreground">${payment.amount.toFixed(2)}</div>
                  <div>
                    <StatusBadge status={payment.status} />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setOpenPayment(payment)}
                      className="inline-flex items-center gap-1 rounded-full border border-border bg-secondary/20 px-3 py-1.5 text-[11px] font-bold text-foreground hover:border-primary/40 hover:bg-primary/10"
                    >
                      Ver
                      <ArrowRight className="h-3 w-3" />
                    </button>
                    {payment.status === "pending" ? (
                      <button
                        onClick={() => handleVerify(payment)}
                        className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-400"
                      >
                        <Check className="h-3 w-3" />
                        Aprobar
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>

          {tab === "pending" && stats.pending > 0 ? (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/8 p-4">
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-400" />
              <div className="text-xs leading-relaxed text-amber-200/90">
                <strong className="text-amber-300">{stats.pending} pagos esperan tu validacion.</strong>{" "}
                Una vez verificas la transferencia, el acceso al curso se activa automaticamente para el usuario.
              </div>
            </div>
          ) : null}
        </>
      )}

      <PaymentDetailDialog
        payment={openPayment}
        onClose={() => setOpenPayment(null)}
        onVerify={() => openPayment && handleVerify(openPayment)}
        onReject={(reason) => openPayment && handleReject(openPayment, reason)}
        onRefund={(reason) => openPayment && handleRefund(openPayment, reason)}
        onNote={(note) => openPayment && handleNote(openPayment, note)}
      />
    </div>
  )
}

function RefundRequestsView({
  requests,
  onResolve,
}: {
  requests: RefundRequest[]
  onResolve: (id: string, decision: "approved" | "rejected", note?: string) => void
}) {
  const [activeNote, setActiveNote] = useState<Record<string, string>>({})
  const sorted = [...requests].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (sorted.length === 0) {
    return (
      <div className="rounded-2xl border border-border bg-card p-12 text-center">
        <Undo2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
        <p className="text-base font-bold text-foreground">No hay solicitudes de reembolso</p>
        <p className="mt-1 text-sm text-muted-foreground">Cuando un usuario pida reembolso aparecera aqui.</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {sorted.map((req) => (
        <div key={req.id} className="rounded-2xl border border-border bg-card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {formatDate(req.createdAt)}
              </div>
              <h3 className="mt-1 text-base font-black text-foreground">
                ${req.amount.toFixed(2)} · {req.userName || req.userEmail}
              </h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Pago {req.paymentId} · Motivo: <span className="text-foreground">{req.reason}</span>
              </p>
              {req.details ? (
                <p className="mt-2 rounded-xl border border-border bg-secondary/15 p-3 text-xs text-muted-foreground">
                  {req.details}
                </p>
              ) : null}
              {req.status !== "pending" ? (
                <p
                  className={`mt-2 text-xs font-bold ${req.status === "approved" ? "text-emerald-500" : "text-red-400"}`}
                >
                  {req.status === "approved" ? "Aprobado" : "Rechazado"}
                  {req.resolvedAt ? ` · ${formatDate(req.resolvedAt)}` : ""}
                  {req.resolutionNote ? ` · ${req.resolutionNote}` : ""}
                </p>
              ) : null}
            </div>
            {req.status === "pending" ? (
              <div className="flex flex-col gap-2 sm:min-w-[260px]">
                <input
                  value={activeNote[req.id] || ""}
                  onChange={(event) => setActiveNote((cur) => ({ ...cur, [req.id]: event.target.value }))}
                  placeholder="Nota (opcional)"
                  className="h-10 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => onResolve(req.id, "rejected", activeNote[req.id])}
                    className="flex-1 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-bold text-red-300 hover:bg-red-500/15"
                  >
                    <XCircle className="mr-1 inline h-3.5 w-3.5" />
                    Rechazar
                  </button>
                  <button
                    onClick={() => onResolve(req.id, "approved", activeNote[req.id])}
                    className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-white hover:bg-emerald-400"
                  >
                    <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" />
                    Aprobar y reembolsar
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  )
}

function AuditView({
  months,
  activeMonth,
  onMonthChange,
  summary,
  activeLabel,
  payments,
  audit,
  onExportMonthExcel,
  onExportMonthPdf,
  onExportYearExcel,
  onExportYearPdf,
}: {
  months: string[]
  activeMonth: string
  onMonthChange: (key: string) => void
  summary: { total: number; ingresos: number; reembolsado: number; pendientes: number }
  activeLabel: string
  payments: PaymentRecord[]
  audit: AuditEntry[]
  onExportMonthExcel: () => void
  onExportMonthPdf: () => void
  onExportYearExcel: () => void
  onExportYearPdf: () => void
}) {
  const monthOptions = months.length > 0 ? months : [activeMonth]

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Periodo</p>
            <p className="text-lg font-black text-foreground capitalize">{activeLabel}</p>
          </div>
          <select
            value={activeMonth}
            onChange={(event) => onMonthChange(event.target.value)}
            className="h-10 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:border-primary"
          >
            {monthOptions.map((m) => (
              <option key={m} value={m}>
                {monthLabel(m)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="rounded-full border border-border bg-card p-1 flex items-center gap-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Mes</span>
            <button
              onClick={onExportMonthExcel}
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-emerald-400"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={onExportMonthPdf}
              className="inline-flex items-center gap-1.5 rounded-full bg-red-500 px-3 py-1.5 text-[11px] font-black text-white hover:bg-red-400"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
          <div className="rounded-full border border-border bg-card p-1 flex items-center gap-1">
            <span className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">Año</span>
            <button
              onClick={onExportYearExcel}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-[11px] font-black text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)]"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </button>
            <button
              onClick={onExportYearPdf}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-[11px] font-bold text-foreground hover:border-primary/40"
            >
              <Download className="h-3.5 w-3.5" />
              PDF
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Operaciones", value: summary.total, accent: "text-foreground" },
          { label: "Ingresos verificados", value: `$${summary.ingresos.toFixed(2)}`, accent: "text-emerald-500" },
          { label: "Reembolsado", value: `$${summary.reembolsado.toFixed(2)}`, accent: "text-purple-400" },
          { label: "Pendientes", value: summary.pendientes, accent: "text-amber-400" },
        ].map((card) => (
          <div key={card.label} className="rounded-2xl border border-border bg-card p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{card.label}</p>
            <div className={`mt-3 text-2xl font-black ${card.accent}`}>{card.value}</div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-secondary/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Pagos del periodo ({payments.length})
        </div>
        {payments.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Sin pagos registrados en este mes.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {payments.map((p) => (
              <div key={p.id} className="grid grid-cols-1 gap-2 px-5 py-3 sm:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold text-foreground">{p.userName || p.userId}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(p.createdAt)}</p>
                </div>
                <div className="text-xs text-muted-foreground">
                  {p.method === "card" ? "Tarjeta" : "Transferencia"}
                </div>
                <div className="text-sm font-bold text-foreground">${p.amount.toFixed(2)}</div>
                <StatusBadge status={p.status} />
                <div className="line-clamp-1 text-[11px] text-muted-foreground">
                  {p.items.map((i) => i.titulo).join(", ")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-secondary/15 px-5 py-3 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Bitacora de auditoria ({audit.length})
        </div>
        {audit.length === 0 ? (
          <div className="px-6 py-10 text-center text-sm text-muted-foreground">
            Sin actividad registrada.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {audit.map((entry) => (
              <div key={entry.id} className="px-5 py-3">
                <div className="flex items-center justify-between gap-3">
                  <span className="rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-primary">
                    {entry.action.replace(/_/g, " ")}
                  </span>
                  <span className="text-[10px] text-muted-foreground">{formatDate(entry.createdAt)}</span>
                </div>
                <p className="mt-1 text-sm text-foreground">{entry.description}</p>
                <p className="text-[11px] text-muted-foreground">
                  {entry.actorName || entry.actorId}
                  {entry.amount ? ` · $${entry.amount.toFixed(2)}` : ""}
                  {entry.paymentId ? ` · ${entry.paymentId}` : ""}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
