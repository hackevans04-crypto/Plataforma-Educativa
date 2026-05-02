"use client"

import type { CartCourseItem } from "@/lib/shopping-cart"

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type PaymentMethod = "card" | "transfer"

export type PaymentStatus =
  | "pending" // transfer awaiting verification
  | "verified" // approved by admin or auto-verified card
  | "rejected" // rejected by admin
  | "refunded" // refunded after verified

export type CardDetails = {
  last4: string
  brand: string
  holder: string
}

export type TransferDetails = {
  sender: string
  reference: string
  proofName: string
  proofUploadedAt: string
  proofDataUrl?: string
  proofMimeType?: string
}

export type PaymentRecord = {
  id: string
  userId: string
  userName?: string
  userEmail?: string
  createdAt: string
  updatedAt: string
  verifiedAt?: string
  verifiedBy?: string
  rejectedAt?: string
  rejectedReason?: string
  method: PaymentMethod
  status: PaymentStatus
  amount: number
  subtotal: number
  savings: number
  items: CartCourseItem[]
  card?: CardDetails
  transfer?: TransferDetails
  adminNote?: string
}

export type BankConfig = {
  bank: string
  type: string
  number: string
  holder: string
  ruc: string
  email: string
  swift?: string
  notes?: string
  whatsapp?: string
  enabledMethods: { card: boolean; transfer: boolean }
  cardProvider?: string
  cardAutoVerify?: boolean
}

export type SupportTicketStatus = "open" | "in_progress" | "resolved" | "closed"

export type SupportPriority = "low" | "normal" | "high" | "urgent"

export type SupportAttachment = {
  name: string
  type: string
  size: number
  dataUrl: string
}

export type SupportMessage = {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
  createdAt: string
  attachments?: SupportAttachment[]
}

export type SupportTicket = {
  id: string
  userId: string
  userName: string
  userEmail?: string
  subject: string
  category: "pago" | "acceso" | "tecnico" | "general"
  priority: SupportPriority
  status: SupportTicketStatus
  createdAt: string
  updatedAt: string
  paymentId?: string
  assignedAdminId?: string
  assignedAdminName?: string
  unreadByAdmin?: boolean
  unreadByUser?: boolean
  lastMessage?: string
}

/* ------------------------------------------------------------------ */
/* Storage keys                                                        */
/* ------------------------------------------------------------------ */

const PAYMENTS_KEY = "he_payments"
const PAYMENTS_EVENT = "he-payments-updated"
const BANK_CONFIG_KEY = "he_bank_config"
const BANK_CONFIG_EVENT = "he-bank-config-updated"
const ENROLLMENTS_KEY = "he_matriculas"
const TICKETS_KEY = "he_support_tickets"
const TICKET_MESSAGES_KEY = "he_support_messages"
const TICKETS_EVENT = "he-support-updated"
const ADMIN_NOTIFICATIONS_KEY = "he_admin_notifications"
const ADMIN_NOTIFICATIONS_EVENT = "he-admin-notifications-updated"
const WALLETS_KEY = "he_wallets"
const WALLETS_EVENT = "he-wallets-updated"
const REFUND_REQUESTS_KEY = "he_refund_requests"
const REFUND_REQUESTS_EVENT = "he-refund-requests-updated"
const AUDIT_KEY = "he_audit_log"
const AUDIT_EVENT = "he-audit-updated"

/* ------------------------------------------------------------------ */
/* Utilities                                                           */
/* ------------------------------------------------------------------ */

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function emit(event: string) {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(event))
}

function nowIso() {
  return new Date().toISOString()
}

/* ------------------------------------------------------------------ */
/* Bank config                                                         */
/* ------------------------------------------------------------------ */

const DEFAULT_BANK: BankConfig = {
  bank: "Banco Pichincha",
  type: "Cuenta corriente",
  number: "2200457789",
  holder: "Hack Evans Consultoria Educativa",
  ruc: "1791234567001",
  email: "pagos@hackevans.com",
  whatsapp: "+593 99 999 9999",
  notes: "Envia el comprobante por aqui o por WhatsApp despues de transferir.",
  enabledMethods: { card: true, transfer: true },
  cardProvider: "Stripe (sandbox)",
  cardAutoVerify: true,
}

export function getBankConfigEventName() {
  return BANK_CONFIG_EVENT
}

export function getBankConfig(): BankConfig {
  if (typeof window === "undefined") return DEFAULT_BANK
  const stored = parseSafe<Partial<BankConfig> | null>(window.localStorage.getItem(BANK_CONFIG_KEY), null)
  if (!stored) return DEFAULT_BANK
  return {
    ...DEFAULT_BANK,
    ...stored,
    enabledMethods: { ...DEFAULT_BANK.enabledMethods, ...(stored.enabledMethods || {}) },
  }
}

export function saveBankConfig(config: BankConfig) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(BANK_CONFIG_KEY, JSON.stringify(config))
  emit(BANK_CONFIG_EVENT)
}

/* ------------------------------------------------------------------ */
/* Enrollments helpers                                                 */
/* ------------------------------------------------------------------ */

type Enrollment = {
  id: string
  userId: string
  cursoId: string
  fechaMatricula: string
  progreso: number
  completado: boolean
  tipoAcceso: string
  montoPagado: number
  paymentId?: string
}

function getEnrollments(): Enrollment[] {
  if (typeof window === "undefined") return []
  return parseSafe<Enrollment[]>(window.localStorage.getItem(ENROLLMENTS_KEY), [])
}

function saveEnrollments(value: Enrollment[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(value))
}

function grantAccessForPayment(payment: PaymentRecord) {
  const enrollments = getEnrollments()
  let changed = false
  for (const item of payment.items) {
    if (enrollments.some((entry) => entry.userId === payment.userId && entry.cursoId === item.id)) continue
    enrollments.push({
      id: `mat_${Date.now()}_${item.id}`,
      userId: payment.userId,
      cursoId: item.id,
      fechaMatricula: nowIso(),
      progreso: 0,
      completado: false,
      tipoAcceso: item.gratis ? "libre" : "pago",
      montoPagado: Number(item.precio || 0),
      paymentId: payment.id,
    })
    changed = true
  }
  if (changed) saveEnrollments(enrollments)
}

function revokeAccessForPayment(paymentId: string) {
  const enrollments = getEnrollments().filter((entry) => entry.paymentId !== paymentId)
  saveEnrollments(enrollments)
}

/* ------------------------------------------------------------------ */
/* Audit log                                                           */
/* ------------------------------------------------------------------ */

export type AuditAction =
  | "payment_created"
  | "payment_verified"
  | "payment_rejected"
  | "payment_refunded"
  | "refund_requested"
  | "refund_resolved"
  | "support_created"

export type AuditEntry = {
  id: string
  action: AuditAction
  createdAt: string
  actorId: string
  actorName?: string
  amount?: number
  paymentId?: string
  description: string
}

export function getAuditEventName() {
  return AUDIT_EVENT
}

export function getAuditLog(): AuditEntry[] {
  if (typeof window === "undefined") return []
  return parseSafe<AuditEntry[]>(window.localStorage.getItem(AUDIT_KEY), [])
}

function saveAuditLog(items: AuditEntry[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(AUDIT_KEY, JSON.stringify(items.slice(0, 1000)))
  emit(AUDIT_EVENT)
}

function logAudit(input: Omit<AuditEntry, "id" | "createdAt">) {
  const entry: AuditEntry = {
    id: `aud_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: nowIso(),
    ...input,
  }
  saveAuditLog([entry, ...getAuditLog()])
}

/* ------------------------------------------------------------------ */
/* Admin notifications                                                 */
/* ------------------------------------------------------------------ */

export type AdminNotificationKind =
  | "payment_pending"
  | "payment_verified"
  | "payment_rejected"
  | "payment_refunded"
  | "support_new"
  | "support_reply"

export type AdminNotification = {
  id: string
  kind: AdminNotificationKind
  title: string
  body: string
  createdAt: string
  read: boolean
  href?: string
  refId?: string
}

export function getAdminNotificationsEventName() {
  return ADMIN_NOTIFICATIONS_EVENT
}

export function getAdminNotifications(): AdminNotification[] {
  if (typeof window === "undefined") return []
  return parseSafe<AdminNotification[]>(window.localStorage.getItem(ADMIN_NOTIFICATIONS_KEY), [])
}

function saveAdminNotifications(items: AdminNotification[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(ADMIN_NOTIFICATIONS_KEY, JSON.stringify(items.slice(0, 200)))
  emit(ADMIN_NOTIFICATIONS_EVENT)
}

function pushAdminNotification(input: Omit<AdminNotification, "id" | "createdAt" | "read">) {
  const item: AdminNotification = {
    id: `not_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: nowIso(),
    read: false,
    ...input,
  }
  saveAdminNotifications([item, ...getAdminNotifications()])
  return item
}

export function markAdminNotificationRead(id: string) {
  const items = getAdminNotifications()
  const target = items.find((entry) => entry.id === id)
  if (!target) return
  target.read = true
  saveAdminNotifications(items)
}

export function markAllAdminNotificationsRead() {
  const items = getAdminNotifications().map((entry) => ({ ...entry, read: true }))
  saveAdminNotifications(items)
}

export function clearAdminNotifications() {
  saveAdminNotifications([])
}

/* ------------------------------------------------------------------ */
/* Wallet (user balance for refunds)                                   */
/* ------------------------------------------------------------------ */

export type WalletTransaction = {
  id: string
  userId: string
  type: "refund" | "spend" | "adjustment"
  amount: number
  balance: number
  description: string
  createdAt: string
  paymentId?: string
}

type WalletState = {
  balances: Record<string, number>
  history: WalletTransaction[]
}

export function getWalletEventName() {
  return WALLETS_EVENT
}

function getWalletState(): WalletState {
  if (typeof window === "undefined") return { balances: {}, history: [] }
  return parseSafe<WalletState>(window.localStorage.getItem(WALLETS_KEY), { balances: {}, history: [] })
}

function saveWalletState(state: WalletState) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(WALLETS_KEY, JSON.stringify(state))
  emit(WALLETS_EVENT)
}

export function getWalletBalance(userId: string): number {
  return getWalletState().balances[userId] || 0
}

export function getWalletHistory(userId: string): WalletTransaction[] {
  return getWalletState()
    .history.filter((entry) => entry.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

function creditWallet(userId: string, amount: number, description: string, paymentId?: string) {
  if (!userId || amount <= 0) return
  const state = getWalletState()
  const current = state.balances[userId] || 0
  const newBalance = Number((current + amount).toFixed(2))
  state.balances[userId] = newBalance
  state.history.unshift({
    id: `wal_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type: "refund",
    amount,
    balance: newBalance,
    description,
    createdAt: nowIso(),
    paymentId,
  })
  saveWalletState(state)
}

/* ------------------------------------------------------------------ */
/* Payments                                                            */
/* ------------------------------------------------------------------ */

export function getPaymentsEventName() {
  return PAYMENTS_EVENT
}

export function getPayments(): PaymentRecord[] {
  if (typeof window === "undefined") return []
  return parseSafe<PaymentRecord[]>(window.localStorage.getItem(PAYMENTS_KEY), [])
}

function savePayments(payments: PaymentRecord[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(PAYMENTS_KEY, JSON.stringify(payments))
  emit(PAYMENTS_EVENT)
}

export function getPaymentsForUser(userId: string) {
  return getPayments().filter((payment) => payment.userId === userId)
}

export function getPaymentById(paymentId: string) {
  return getPayments().find((payment) => payment.id === paymentId) || null
}

type CreatePaymentInput = {
  userId: string
  userName?: string
  userEmail?: string
  method: PaymentMethod
  items: CartCourseItem[]
  amount: number
  subtotal: number
  savings: number
  card?: CardDetails
  transfer?: TransferDetails
  autoVerify?: boolean
}

export function createPayment(input: CreatePaymentInput): PaymentRecord {
  const id = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const status: PaymentStatus = input.method === "card" && input.autoVerify ? "verified" : "pending"
  const created: PaymentRecord = {
    id,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    createdAt: nowIso(),
    updatedAt: nowIso(),
    verifiedAt: status === "verified" ? nowIso() : undefined,
    method: input.method,
    status,
    amount: input.amount,
    subtotal: input.subtotal,
    savings: input.savings,
    items: input.items,
    card: input.card,
    transfer: input.transfer,
  }
  const all = getPayments()
  savePayments([created, ...all])
  if (status === "verified") {
    grantAccessForPayment(created)
  }
  logAudit({
    action: "payment_created",
    actorId: created.userId,
    actorName: created.userName,
    amount: created.amount,
    paymentId: created.id,
    description: `${created.method === "card" ? "Pago tarjeta" : "Transferencia"} por $${created.amount.toFixed(2)} (${status})`,
  })
  if (status === "pending") {
    pushAdminNotification({
      kind: "payment_pending",
      title: "Nueva transferencia por verificar",
      body: `${created.userName || created.userEmail || "Un usuario"} envio $${created.amount.toFixed(2)} por transferencia.`,
      href: "/admin/pagos",
      refId: created.id,
    })
  } else {
    pushAdminNotification({
      kind: "payment_verified",
      title: "Pago con tarjeta aprobado",
      body: `${created.userName || created.userEmail || "Un usuario"} pago $${created.amount.toFixed(2)} con tarjeta.`,
      href: "/admin/pagos",
      refId: created.id,
    })
  }
  return created
}

export function verifyPayment(paymentId: string, adminId: string, note?: string) {
  const payments = getPayments()
  const target = payments.find((payment) => payment.id === paymentId)
  if (!target) return null
  target.status = "verified"
  target.verifiedAt = nowIso()
  target.verifiedBy = adminId
  target.adminNote = note ?? target.adminNote
  target.rejectedAt = undefined
  target.rejectedReason = undefined
  target.updatedAt = nowIso()
  savePayments(payments)
  grantAccessForPayment(target)
  logAudit({
    action: "payment_verified",
    actorId: adminId,
    amount: target.amount,
    paymentId: target.id,
    description: `Pago aprobado para ${target.userName || target.userEmail || target.userId}`,
  })
  pushAdminNotification({
    kind: "payment_verified",
    title: "Pago aprobado",
    body: `Se aprobo el pago de ${target.userName || target.userEmail || target.userId} por $${target.amount.toFixed(2)}.`,
    href: "/admin/pagos",
    refId: target.id,
  })
  return target
}

export function rejectPayment(paymentId: string, adminId: string, reason: string) {
  const payments = getPayments()
  const target = payments.find((payment) => payment.id === paymentId)
  if (!target) return null
  target.status = "rejected"
  target.rejectedAt = nowIso()
  target.verifiedBy = adminId
  target.rejectedReason = reason
  target.updatedAt = nowIso()
  savePayments(payments)
  revokeAccessForPayment(paymentId)
  logAudit({
    action: "payment_rejected",
    actorId: adminId,
    amount: target.amount,
    paymentId: target.id,
    description: `Pago rechazado: ${reason}`,
  })
  pushAdminNotification({
    kind: "payment_rejected",
    title: "Pago rechazado",
    body: `Se rechazo el pago de ${target.userName || target.userEmail || target.userId}: ${reason}`,
    href: "/admin/pagos",
    refId: target.id,
  })
  return target
}

export function refundPayment(paymentId: string, adminId: string, reason: string) {
  const payments = getPayments()
  const target = payments.find((payment) => payment.id === paymentId)
  if (!target) return null
  target.status = "refunded"
  target.verifiedBy = adminId
  target.rejectedReason = reason
  target.updatedAt = nowIso()
  savePayments(payments)
  revokeAccessForPayment(paymentId)
  creditWallet(
    target.userId,
    Number(target.amount.toFixed(2)),
    `Reembolso de pago ${target.id}: ${reason}`,
    target.id,
  )
  logAudit({
    action: "payment_refunded",
    actorId: adminId,
    amount: target.amount,
    paymentId: target.id,
    description: `Reembolso de $${target.amount.toFixed(2)} a ${target.userName || target.userId}: ${reason}`,
  })
  pushAdminNotification({
    kind: "payment_refunded",
    title: "Reembolso procesado",
    body: `Se reembolso $${target.amount.toFixed(2)} a ${target.userName || target.userEmail || target.userId}. Saldo acreditado.`,
    href: "/admin/pagos",
    refId: target.id,
  })
  return target
}

export function setPaymentNote(paymentId: string, note: string) {
  const payments = getPayments()
  const target = payments.find((payment) => payment.id === paymentId)
  if (!target) return null
  target.adminNote = note
  target.updatedAt = nowIso()
  savePayments(payments)
  return target
}

/* ------------------------------------------------------------------ */
/* Refund requests (initiated by user)                                 */
/* ------------------------------------------------------------------ */

export const REFUND_WINDOW_DAYS = 30

export function getRefundEligibility(payment: PaymentRecord): {
  eligible: boolean
  daysLeft: number
  expiresAt: string
  reason?: string
} {
  const created = new Date(payment.createdAt).getTime()
  const expires = created + REFUND_WINDOW_DAYS * 24 * 60 * 60 * 1000
  const now = Date.now()
  const daysLeft = Math.max(0, Math.ceil((expires - now) / (24 * 60 * 60 * 1000)))
  const expiresAt = new Date(expires).toISOString()
  if (payment.status !== "verified") {
    return { eligible: false, daysLeft, expiresAt, reason: "Solo pagos aprobados pueden reembolsarse." }
  }
  if (now > expires) {
    return { eligible: false, daysLeft: 0, expiresAt, reason: `Pasaron mas de ${REFUND_WINDOW_DAYS} días desde la compra.` }
  }
  return { eligible: true, daysLeft, expiresAt }
}

export type RefundRequestStatus = "pending" | "approved" | "rejected"

export type RefundRequest = {
  id: string
  paymentId: string
  userId: string
  userName?: string
  userEmail?: string
  reason: string
  details?: string
  amount: number
  status: RefundRequestStatus
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
  resolutionNote?: string
}

export function getRefundRequestsEventName() {
  return REFUND_REQUESTS_EVENT
}

export function getRefundRequests(): RefundRequest[] {
  if (typeof window === "undefined") return []
  return parseSafe<RefundRequest[]>(window.localStorage.getItem(REFUND_REQUESTS_KEY), [])
}

function saveRefundRequests(items: RefundRequest[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(REFUND_REQUESTS_KEY, JSON.stringify(items))
  emit(REFUND_REQUESTS_EVENT)
}

export function getRefundRequestsForUser(userId: string) {
  return getRefundRequests().filter((entry) => entry.userId === userId)
}

export function getRefundRequestForPayment(paymentId: string) {
  return getRefundRequests().find((entry) => entry.paymentId === paymentId && entry.status !== "rejected") || null
}

export function createRefundRequest(input: {
  paymentId: string
  reason: string
  details?: string
}): RefundRequest | null {
  const payment = getPaymentById(input.paymentId)
  if (!payment || payment.status !== "verified") return null
  const eligibility = getRefundEligibility(payment)
  if (!eligibility.eligible) return null
  const existing = getRefundRequests().find(
    (entry) => entry.paymentId === input.paymentId && entry.status === "pending",
  )
  if (existing) return existing
  const request: RefundRequest = {
    id: `rfq_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    paymentId: input.paymentId,
    userId: payment.userId,
    userName: payment.userName,
    userEmail: payment.userEmail,
    reason: input.reason,
    details: input.details,
    amount: payment.amount,
    status: "pending",
    createdAt: nowIso(),
  }
  saveRefundRequests([request, ...getRefundRequests()])
  logAudit({
    action: "refund_requested",
    actorId: payment.userId,
    actorName: payment.userName,
    amount: payment.amount,
    paymentId: payment.id,
    description: `Usuario solicito reembolso: ${input.reason}`,
  })
  pushAdminNotification({
    kind: "payment_refunded",
    title: "Solicitud de reembolso",
    body: `${payment.userName || payment.userEmail || "Un usuario"} pide reembolso de $${payment.amount.toFixed(2)}: ${input.reason}`,
    href: "/admin/pagos",
    refId: payment.id,
  })
  return request
}

export function resolveRefundRequest(
  requestId: string,
  adminId: string,
  decision: "approved" | "rejected",
  note?: string,
) {
  const requests = getRefundRequests()
  const target = requests.find((entry) => entry.id === requestId)
  if (!target || target.status !== "pending") return null
  target.status = decision
  target.resolvedAt = nowIso()
  target.resolvedBy = adminId
  target.resolutionNote = note
  saveRefundRequests(requests)
  if (decision === "approved") {
    refundPayment(target.paymentId, adminId, note || target.reason)
  }
  logAudit({
    action: "refund_resolved",
    actorId: adminId,
    amount: target.amount,
    paymentId: target.paymentId,
    description: `Solicitud de reembolso ${decision === "approved" ? "aprobada" : "rechazada"}${note ? `: ${note}` : ""}`,
  })
  return target
}

/* ------------------------------------------------------------------ */
/* Support tickets                                                     */
/* ------------------------------------------------------------------ */

export function getSupportEventName() {
  return TICKETS_EVENT
}

export function getTickets(): SupportTicket[] {
  if (typeof window === "undefined") return []
  return parseSafe<SupportTicket[]>(window.localStorage.getItem(TICKETS_KEY), [])
}

function saveTickets(tickets: SupportTicket[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets))
  emit(TICKETS_EVENT)
}

export function getTicketsForUser(userId: string) {
  return getTickets().filter((ticket) => ticket.userId === userId)
}

export function getMessages(ticketId: string): SupportMessage[] {
  if (typeof window === "undefined") return []
  const all = parseSafe<SupportMessage[]>(window.localStorage.getItem(TICKET_MESSAGES_KEY), [])
  return all.filter((message) => message.ticketId === ticketId)
}

function saveMessages(messages: SupportMessage[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(TICKET_MESSAGES_KEY, JSON.stringify(messages))
  emit(TICKETS_EVENT)
}

function getAllMessages(): SupportMessage[] {
  if (typeof window === "undefined") return []
  return parseSafe<SupportMessage[]>(window.localStorage.getItem(TICKET_MESSAGES_KEY), [])
}

export type CreateTicketInput = {
  userId: string
  userName: string
  userEmail?: string
  subject: string
  category: SupportTicket["category"]
  priority?: SupportPriority
  paymentId?: string
  body: string
  attachments?: SupportAttachment[]
}

export function createTicket(input: CreateTicketInput) {
  const id = `tkt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
  const ticket: SupportTicket = {
    id,
    userId: input.userId,
    userName: input.userName,
    userEmail: input.userEmail,
    subject: input.subject,
    category: input.category,
    priority: input.priority || "normal",
    status: "open",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    paymentId: input.paymentId,
    unreadByAdmin: true,
    unreadByUser: false,
    lastMessage: input.body.slice(0, 120),
  }
  saveTickets([ticket, ...getTickets()])

  const message: SupportMessage = {
    id: `msg_${Date.now()}`,
    ticketId: id,
    authorId: input.userId,
    authorName: input.userName,
    authorRole: "user",
    body: input.body,
    createdAt: nowIso(),
    attachments: input.attachments,
  }
  saveMessages([...getAllMessages(), message])
  logAudit({
    action: "support_created",
    actorId: input.userId,
    actorName: input.userName,
    description: `Ticket: ${input.subject}`,
  })
  pushAdminNotification({
    kind: "support_new",
    title: "Nuevo mensaje de soporte",
    body: `${input.userName}: ${input.subject}`,
    href: "/admin/soporte",
    refId: id,
  })
  return ticket
}

export function postTicketMessage(input: {
  ticketId: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
  attachments?: SupportAttachment[]
}) {
  const all = getAllMessages()
  const message: SupportMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 4)}`,
    ticketId: input.ticketId,
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    body: input.body,
    createdAt: nowIso(),
    attachments: input.attachments,
  }
  saveMessages([...all, message])

  const tickets = getTickets()
  const ticket = tickets.find((t) => t.id === input.ticketId)
  if (ticket) {
    ticket.updatedAt = nowIso()
    ticket.lastMessage = input.body.slice(0, 120)
    if (input.authorRole === "user") {
      ticket.unreadByAdmin = true
      ticket.unreadByUser = false
      if (ticket.status === "resolved" || ticket.status === "closed") ticket.status = "open"
    } else {
      ticket.unreadByUser = true
      ticket.unreadByAdmin = false
      if (ticket.status === "open") ticket.status = "in_progress"
    }
    saveTickets(tickets)
    if (input.authorRole === "user") {
      pushAdminNotification({
        kind: "support_reply",
        title: "Respuesta del usuario en soporte",
        body: `${input.authorName}: ${input.body.slice(0, 100)}`,
        href: "/admin/soporte",
        refId: input.ticketId,
      })
    }
  }
  return message
}

export function setTicketStatus(ticketId: string, status: SupportTicketStatus, adminName?: string) {
  const tickets = getTickets()
  const target = tickets.find((ticket) => ticket.id === ticketId)
  if (!target) return null
  target.status = status
  target.updatedAt = nowIso()
  if (adminName) target.assignedAdminName = adminName
  saveTickets(tickets)
  return target
}

export function markTicketRead(ticketId: string, role: "user" | "admin") {
  const tickets = getTickets()
  const target = tickets.find((ticket) => ticket.id === ticketId)
  if (!target) return null
  if (role === "user") target.unreadByUser = false
  else target.unreadByAdmin = false
  saveTickets(tickets)
  return target
}

export function setTicketPriority(ticketId: string, priority: SupportPriority) {
  const tickets = getTickets()
  const target = tickets.find((ticket) => ticket.id === ticketId)
  if (!target) return null
  target.priority = priority
  target.updatedAt = nowIso()
  saveTickets(tickets)
  return target
}
