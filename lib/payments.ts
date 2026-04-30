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

export type SupportMessage = {
  id: string
  ticketId: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
  createdAt: string
  attachments?: string[]
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
  }
  saveMessages([...getAllMessages(), message])
  return ticket
}

export function postTicketMessage(input: {
  ticketId: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
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
