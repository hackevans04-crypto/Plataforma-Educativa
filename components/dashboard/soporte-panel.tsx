"use client"

import { Suspense, useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import {
  ArrowLeft,
  Bot,
  CheckCircle2,
  Clock,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Plus,
  Send,
  Tag,
  User,
  XCircle,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  type SupportMessage,
  type SupportPriority,
  type SupportTicket,
  type SupportTicketStatus,
  createTicket,
  getMessages,
  getSupportEventName,
  getTicketsForUser,
  markTicketRead,
  postTicketMessage,
} from "@/lib/payments"

const STATUS_LABEL: Record<SupportTicketStatus, string> = {
  open: "Abierto",
  in_progress: "En curso",
  resolved: "Resuelto",
  closed: "Cerrado",
}

const STATUS_STYLES: Record<SupportTicketStatus, string> = {
  open: "border-amber-500/35 bg-amber-500/10 text-amber-400",
  in_progress: "border-blue-500/35 bg-blue-500/10 text-blue-400",
  resolved: "border-emerald-500/35 bg-emerald-500/10 text-emerald-400",
  closed: "border-muted-foreground/30 bg-secondary/40 text-muted-foreground",
}

const CATEGORY_LABEL: Record<SupportTicket["category"], string> = {
  pago: "Pago",
  acceso: "Acceso a curso",
  tecnico: "Tecnico",
  general: "General",
}

function formatDate(iso: string) {
  try {
    const date = new Date(iso)
    return `${date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" })} · ${date.toLocaleTimeString(
      "es-EC",
      { hour: "2-digit", minute: "2-digit" }
    )}`
  } catch {
    return iso
  }
}

function NewTicketForm({
  onCreated,
  paymentIdHint,
}: {
  onCreated: (ticket: SupportTicket) => void
  paymentIdHint?: string
}) {
  const { user } = useAuth()
  const [subject, setSubject] = useState("")
  const [category, setCategory] = useState<SupportTicket["category"]>(paymentIdHint ? "pago" : "general")
  const [priority, setPriority] = useState<SupportPriority>("normal")
  const [body, setBody] = useState("")
  const [error, setError] = useState("")

  const submit = () => {
    if (!user) return
    if (!subject.trim() || !body.trim()) {
      setError("Completa el asunto y el mensaje para enviar tu ticket.")
      return
    }
    const ticket = createTicket({
      userId: user.id,
      userName: user.name || "Usuario",
      userEmail: user.email,
      subject: subject.trim(),
      category,
      priority,
      paymentId: paymentIdHint,
      body: body.trim(),
    })
    setSubject("")
    setBody("")
    setError("")
    onCreated(ticket)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Plus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black text-foreground">Abrir nuevo ticket</h2>
          <p className="text-xs text-muted-foreground">Te respondemos en menos de 24h habiles.</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Asunto
          </label>
          <input
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            placeholder="Ej. Mi transferencia no se valido"
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Categoria
          </label>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value as SupportTicket["category"])}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            {Object.entries(CATEGORY_LABEL).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
            Prioridad
          </label>
          <select
            value={priority}
            onChange={(event) => setPriority(event.target.value as SupportPriority)}
            className="h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none focus:border-primary"
          >
            <option value="low">Baja</option>
            <option value="normal">Normal</option>
            <option value="high">Alta</option>
            <option value="urgent">Urgente</option>
          </select>
        </div>
      </div>

      <div className="mt-3">
        <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
          Mensaje
        </label>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={4}
          placeholder="Cuentanos lo que necesitas. Cuanto mas detalle, mas rapido podemos ayudarte."
          className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
        />
      </div>

      {paymentIdHint ? (
        <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
          <Tag className="h-3 w-3" />
          Pago vinculado: {paymentIdHint}
        </div>
      ) : null}

      {error ? (
        <div className="mt-3 rounded-xl border border-red-500/30 bg-red-500/8 px-3 py-2 text-xs text-red-400">
          {error}
        </div>
      ) : null}

      <button
        onClick={submit}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-4 py-3 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] hover:scale-[1.01]"
      >
        <Send className="h-4 w-4" />
        Enviar ticket
      </button>
    </div>
  )
}

function ConversationView({
  ticket,
  onBack,
  onChange,
}: {
  ticket: SupportTicket
  onBack: () => void
  onChange: () => void
}) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<SupportMessage[]>(() => getMessages(ticket.id))
  const [reply, setReply] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => setMessages(getMessages(ticket.id))
    sync()
    markTicketRead(ticket.id, "user")
    window.addEventListener(getSupportEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getSupportEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [ticket.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  const handleSend = () => {
    if (!user || !reply.trim()) return
    postTicketMessage({
      ticketId: ticket.id,
      authorId: user.id,
      authorName: user.name || "Usuario",
      authorRole: "user",
      body: reply.trim(),
    })
    setReply("")
    setMessages(getMessages(ticket.id))
    onChange()
  }

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border p-5">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/30 px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary/40"
        >
          <ArrowLeft className="h-3 w-3" />
          Mis tickets
        </button>
        <span
          className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-bold ${STATUS_STYLES[ticket.status]}`}
        >
          {ticket.status === "open" ? (
            <Clock className="h-3 w-3" />
          ) : ticket.status === "resolved" ? (
            <CheckCircle2 className="h-3 w-3" />
          ) : ticket.status === "closed" ? (
            <XCircle className="h-3 w-3" />
          ) : (
            <MessageSquare className="h-3 w-3" />
          )}
          {STATUS_LABEL[ticket.status]}
        </span>
      </div>

      <div className="border-b border-border px-5 py-4">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          {CATEGORY_LABEL[ticket.category]}
        </p>
        <h2 className="mt-1 text-xl font-black text-foreground">{ticket.subject}</h2>
        <p className="mt-1 text-xs text-muted-foreground">Creado {formatDate(ticket.createdAt)}</p>
        {ticket.paymentId ? (
          <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
            <Tag className="h-3 w-3" />
            Pago: {ticket.paymentId}
          </div>
        ) : null}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-5" style={{ maxHeight: "55vh" }}>
        {messages.map((message) => {
          const mine = message.authorRole === "user"
          return (
            <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className="max-w-[80%]">
                <div
                  className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    mine
                      ? "bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-white shadow-[0_8px_22px_rgba(232,57,42,0.25)]"
                      : "border border-border bg-secondary/30 text-foreground"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.body}</p>
                </div>
                <div
                  className={`mt-1 flex items-center gap-1 text-[10px] text-muted-foreground ${
                    mine ? "justify-end" : "justify-start"
                  }`}
                >
                  {mine ? <User className="h-3 w-3" /> : <Bot className="h-3 w-3" />}
                  <span>{message.authorName}</span>
                  <span>·</span>
                  <span>{formatDate(message.createdAt)}</span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="border-t border-border p-4">
        <div className="flex gap-2">
          <textarea
            value={reply}
            onChange={(event) => setReply(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
                event.preventDefault()
                handleSend()
              }
            }}
            rows={2}
            placeholder="Escribe tu mensaje... (Ctrl+Enter para enviar)"
            className="flex-1 resize-none rounded-xl border border-border bg-background p-3 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={handleSend}
            disabled={!reply.trim()}
            className="flex items-center justify-center rounded-xl bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 text-white shadow-[0_10px_24px_rgba(232,57,42,0.3)] disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}

function SoporteContent() {
  const { user } = useAuth()
  const params = useSearchParams()
  const paymentHint = params.get("payment") || undefined
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [showNew, setShowNew] = useState(Boolean(paymentHint))

  useEffect(() => {
    if (!user) return
    const sync = () => setTickets(getTicketsForUser(user.id))
    sync()
    window.addEventListener(getSupportEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getSupportEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [user])

  const sorted = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tickets]
  )

  const active = tickets.find((ticket) => ticket.id === activeId) || null

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
            <Headphones className="h-3.5 w-3.5" />
            Soporte
          </p>
          <h1 className="font-display text-3xl text-foreground md:text-4xl">Centro de soporte</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reporta problemas de pago, accesos o cualquier consulta. Te respondemos en menos de 24h.
          </p>
        </div>
        {!showNew ? (
          <button
            onClick={() => setShowNew(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(232,57,42,0.32)]"
          >
            <Plus className="h-4 w-4" />
            Nuevo ticket
          </button>
        ) : null}
      </div>

      {showNew ? (
        <NewTicketForm
          paymentIdHint={paymentHint}
          onCreated={(ticket) => {
            setShowNew(false)
            setActiveId(ticket.id)
            setTickets((current) => [ticket, ...current])
          }}
        />
      ) : null}

      {active ? (
        <ConversationView
          ticket={active}
          onBack={() => setActiveId(null)}
          onChange={() => user && setTickets(getTicketsForUser(user.id))}
        />
      ) : (
        <div className="rounded-2xl border border-border bg-card">
          {sorted.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-primary/30 bg-primary/10 text-primary">
                <LifeBuoy className="h-8 w-8" />
              </div>
              <h2 className="font-bold text-foreground">No tienes tickets abiertos</h2>
              <p className="max-w-sm text-xs text-muted-foreground">
                Si necesitas ayuda con un pago o un acceso, abre un ticket y nuestro equipo te respondera lo
                antes posible.
              </p>
              <button
                onClick={() => setShowNew(true)}
                className="mt-2 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-white"
              >
                <Plus className="h-4 w-4" />
                Crear primer ticket
              </button>
            </div>
          ) : (
            sorted.map((ticket) => (
              <button
                key={ticket.id}
                onClick={() => setActiveId(ticket.id)}
                className="block w-full border-b border-border px-5 py-4 text-left last:border-b-0 hover:bg-secondary/15"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      {ticket.unreadByUser ? (
                        <span className="h-2 w-2 rounded-full bg-primary" />
                      ) : null}
                      <h3 className="line-clamp-1 text-sm font-bold text-foreground">{ticket.subject}</h3>
                    </div>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {CATEGORY_LABEL[ticket.category]} · {formatDate(ticket.updatedAt)}
                    </p>
                    {ticket.lastMessage ? (
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                        {ticket.lastMessage}
                      </p>
                    ) : null}
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLES[ticket.status]}`}
                  >
                    {STATUS_LABEL[ticket.status]}
                  </span>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default function DashboardSoportePanel() {
  return (
    <Suspense fallback={null}>
      <SoporteContent />
    </Suspense>
  )
}
