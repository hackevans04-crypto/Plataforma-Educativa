"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Filter,
  Headphones,
  LifeBuoy,
  MessageSquare,
  Search,
  Send,
  Sparkles,
  Tag,
  User,
  Wrench,
} from "lucide-react"
import { useAuth } from "@/contexts/auth-context"
import {
  type SupportMessage,
  type SupportPriority,
  type SupportTicket,
  type SupportTicketStatus,
  getMessages,
  getSupportEventName,
  getTickets,
  markTicketRead,
  postTicketMessage,
  setTicketPriority,
  setTicketStatus,
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

const PRIORITY_LABEL: Record<SupportPriority, string> = {
  low: "Baja",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
}

const PRIORITY_STYLES: Record<SupportPriority, string> = {
  low: "border-muted-foreground/30 text-muted-foreground",
  normal: "border-primary/30 text-primary",
  high: "border-amber-500/35 text-amber-400",
  urgent: "border-red-500/40 bg-red-500/10 text-red-400",
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
    return `${date.toLocaleDateString("es-EC", { day: "2-digit", month: "short" })} - ${date.toLocaleTimeString(
      "es-EC",
      { hour: "2-digit", minute: "2-digit" }
    )}`
  } catch {
    return iso
  }
}

export default function SoportePanel() {
  const { user } = useAuth()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | SupportTicketStatus>("all")
  const [search, setSearch] = useState("")
  const [reply, setReply] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const sync = () => {
      const all = getTickets()
      setTickets(all)
      if (activeId) setMessages(getMessages(activeId))
    }
    sync()
    window.addEventListener(getSupportEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(getSupportEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
    }
  }, [activeId])

  useEffect(() => {
    if (!activeId) return
    setMessages(getMessages(activeId))
    markTicketRead(activeId, "admin")
  }, [activeId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, activeId])

  const filtered = useMemo(() => {
    return tickets
      .filter((ticket) => {
        if (filter !== "all" && ticket.status !== filter) return false
        if (search.trim()) {
          const query = search.trim().toLowerCase()
          const haystack = `${ticket.subject} ${ticket.userName} ${ticket.userEmail || ""} ${ticket.lastMessage || ""}`.toLowerCase()
          if (!haystack.includes(query)) return false
        }
        return true
      })
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [tickets, filter, search])

  const active = tickets.find((ticket) => ticket.id === activeId) || null

  const stats = useMemo(() => {
    return {
      total: tickets.length,
      open: tickets.filter((ticket) => ticket.status === "open").length,
      in_progress: tickets.filter((ticket) => ticket.status === "in_progress").length,
      resolved: tickets.filter((ticket) => ticket.status === "resolved").length,
      unread: tickets.filter((ticket) => ticket.unreadByAdmin).length,
    }
  }, [tickets])

  const handleSend = () => {
    if (!user || !active || !reply.trim()) return
    postTicketMessage({
      ticketId: active.id,
      authorId: user.id,
      authorName: user.name || "Soporte",
      authorRole: "admin",
      body: reply.trim(),
    })
    setReply("")
    setMessages(getMessages(active.id))
  }

  const handleStatus = (status: SupportTicketStatus) => {
    if (!active) return
    setTicketStatus(active.id, status, user?.name)
    setTickets(getTickets())
  }

  const handlePriority = (priority: SupportPriority) => {
    if (!active) return
    setTicketPriority(active.id, priority)
    setTickets(getTickets())
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
          <Headphones className="h-3.5 w-3.5" />
          Soporte
        </p>
        <h1 className="font-display text-3xl text-foreground md:text-4xl">Centro de soporte</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Resuelve consultas, problemas de pago y activaciones manuales.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Total tickets", value: stats.total, icon: MessageSquare, accent: "text-primary" },
          { label: "Sin leer", value: stats.unread, icon: Sparkles, accent: "text-amber-400" },
          { label: "En curso", value: stats.in_progress, icon: Wrench, accent: "text-blue-400" },
          { label: "Resueltos", value: stats.resolved, icon: CheckCircle2, accent: "text-emerald-400" },
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

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Tickets list */}
        <div className="flex flex-col rounded-2xl border border-border bg-card">
          <div className="space-y-3 border-b border-border p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar tickets..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-3 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["all", "open", "in_progress", "resolved", "closed"] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setFilter(value)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${
                    filter === value
                      ? "border-primary bg-primary text-white"
                      : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {value === "all" ? "Todos" : STATUS_LABEL[value]}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[60vh] flex-1 overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                <Filter className="mx-auto mb-2 h-6 w-6" />
                Sin tickets en esta vista.
              </div>
            ) : (
              filtered.map((ticket) => (
                <button
                  key={ticket.id}
                  onClick={() => setActiveId(ticket.id)}
                  className={`block w-full border-b border-border px-4 py-3 text-left transition-colors hover:bg-secondary/20 ${
                    activeId === ticket.id ? "bg-primary/5" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        {ticket.unreadByAdmin ? (
                          <span className="h-2 w-2 rounded-full bg-primary" />
                        ) : null}
                        <h3 className="line-clamp-1 text-sm font-bold text-foreground">{ticket.subject}</h3>
                      </div>
                      <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                        {ticket.userName} · {ticket.userEmail || "sin email"}
                      </p>
                      {ticket.lastMessage ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">{ticket.lastMessage}</p>
                      ) : null}
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${STATUS_STYLES[ticket.status]}`}
                      >
                        {STATUS_LABEL[ticket.status]}
                      </span>
                      <span
                        className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.14em] ${PRIORITY_STYLES[ticket.priority]}`}
                      >
                        {PRIORITY_LABEL[ticket.priority]}
                      </span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">{formatDate(ticket.updatedAt)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat panel */}
        <div className="flex flex-col rounded-2xl border border-border bg-card">
          {active ? (
            <>
              <div className="space-y-3 border-b border-border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
                      {CATEGORY_LABEL[active.category]}
                    </p>
                    <h2 className="mt-1 text-xl font-black text-foreground">{active.subject}</h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {active.userName} · {active.userEmail || "sin email"} · creado{" "}
                      {formatDate(active.createdAt)}
                    </p>
                    {active.paymentId ? (
                      <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1 text-[11px] font-bold text-primary">
                        <Tag className="h-3 w-3" />
                        Pago vinculado: {active.paymentId}
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    <select
                      value={active.status}
                      onChange={(event) => handleStatus(event.target.value as SupportTicketStatus)}
                      className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
                    >
                      {(Object.keys(STATUS_LABEL) as SupportTicketStatus[]).map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABEL[status]}
                        </option>
                      ))}
                    </select>
                    <select
                      value={active.priority}
                      onChange={(event) => handlePriority(event.target.value as SupportPriority)}
                      className="rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-bold outline-none focus:border-primary"
                    >
                      {(Object.keys(PRIORITY_LABEL) as SupportPriority[]).map((priority) => (
                        <option key={priority} value={priority}>
                          Prioridad: {PRIORITY_LABEL[priority]}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto p-5" style={{ maxHeight: "55vh" }}>
                {messages.map((message) => {
                  const isAdmin = message.authorRole === "admin"
                  return (
                    <div key={message.id} className={`flex ${isAdmin ? "justify-end" : "justify-start"}`}>
                      <div className="max-w-[80%]">
                        <div
                          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                            isAdmin
                              ? "bg-gradient-to-br from-[#E8392A] to-[#ff6b4d] text-white shadow-[0_8px_22px_rgba(232,57,42,0.25)]"
                              : "border border-border bg-secondary/30 text-foreground"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{message.body}</p>
                        </div>
                        <div
                          className={`mt-1 flex items-center gap-1 text-[10px] text-muted-foreground ${
                            isAdmin ? "justify-end" : "justify-start"
                          }`}
                        >
                          {isAdmin ? <Bot className="h-3 w-3" /> : <User className="h-3 w-3" />}
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
                    placeholder="Escribe tu respuesta... (Ctrl+Enter para enviar)"
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
                {active.status === "resolved" || active.status === "closed" ? (
                  <p className="mt-2 inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <AlertTriangle className="h-3 w-3" /> Al responder, el ticket vuelve a abrirse.
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-12 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary/30 text-primary">
                <LifeBuoy className="h-8 w-8" />
              </div>
              <p className="font-bold text-foreground">Selecciona un ticket</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Elige una conversacion de la lista para ver el historial completo y responder al usuario.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
