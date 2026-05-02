"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Headphones,
  MessageCircle,
  Paperclip,
  Plus,
  Send,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/auth-context"
import { playNotificationSound } from "@/lib/notification-sound"
import {
  createTicket,
  getBankConfig,
  getMessages,
  getSupportEventName,
  getTicketsForUser,
  markTicketRead,
  postTicketMessage,
  type SupportAttachment,
  type SupportMessage,
  type SupportTicket,
} from "@/lib/payments"

const MAX_FILE_BYTES = 4 * 1024 * 1024

function formatTime(iso: string) {
  try {
    const d = new Date(iso)
    return d.toLocaleString("es-EC", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })
  } catch {
    return iso
  }
}

async function readAttachments(files: FileList | null): Promise<SupportAttachment[]> {
  if (!files || files.length === 0) return []
  const arr: SupportAttachment[] = []
  for (const file of Array.from(files)) {
    if (file.size > MAX_FILE_BYTES) {
      alert(`"${file.name}" supera 4MB y no se adjuntó.`)
      continue
    }
    const dataUrl: string = await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onloadend = () => resolve(typeof reader.result === "string" ? reader.result : "")
      reader.readAsDataURL(file)
    })
    if (!dataUrl) continue
    arr.push({ name: file.name, type: file.type, size: file.size, dataUrl })
  }
  return arr
}

function AttachmentPreview({ attachments, onRemove }: { attachments: SupportAttachment[]; onRemove?: (idx: number) => void }) {
  if (!attachments || attachments.length === 0) return null
  return (
    <div className="flex flex-wrap gap-2">
      {attachments.map((att, idx) => (
        <div key={idx} className="group relative flex items-center gap-2 rounded-lg border border-border bg-secondary/30 px-2 py-1 text-[11px]">
          {att.type.startsWith("image/") ? (
            <img src={att.dataUrl} alt={att.name} className="h-8 w-8 rounded object-cover" />
          ) : (
            <Paperclip className="h-3.5 w-3.5 text-primary" />
          )}
          <span className="max-w-[120px] truncate text-foreground">{att.name}</span>
          {onRemove ? (
            <button
              onClick={() => onRemove(idx)}
              className="ml-1 rounded-full text-muted-foreground hover:text-red-500"
            >
              <X className="h-3 w-3" />
            </button>
          ) : null}
        </div>
      ))}
    </div>
  )
}

export default function SupportWidget() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<"home" | "new" | "chat">("home")
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [messages, setMessages] = useState<SupportMessage[]>([])
  const [whatsapp, setWhatsapp] = useState<string | undefined>(undefined)

  // new ticket draft
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [category, setCategory] = useState<"general" | "pago" | "acceso" | "tecnico">("general")
  const [draftAttach, setDraftAttach] = useState<SupportAttachment[]>([])

  // chat reply draft
  const [reply, setReply] = useState("")
  const [replyAttach, setReplyAttach] = useState<SupportAttachment[]>([])
  const [lightbox, setLightbox] = useState<SupportAttachment | null>(null)
  const messagesEnd = useRef<HTMLDivElement>(null)
  const lastSeenAdminMsgRef = useRef<string | null>(null)
  const lastTicketUpdateRef = useRef<Record<string, string>>({})

  useEffect(() => {
    if (typeof window === "undefined") return
    setWhatsapp(getBankConfig().whatsapp)
  }, [])

  useEffect(() => {
    if (!user) return
    const sync = () => {
      const next = getTicketsForUser(user.id)
      next.forEach((t) => {
        const prevUpdated = lastTicketUpdateRef.current[t.id]
        // play sound only if not currently viewing that ticket's chat
        if (
          prevUpdated &&
          prevUpdated !== t.updatedAt &&
          t.unreadByUser &&
          !(open && view === "chat" && activeId === t.id)
        ) {
          playNotificationSound()
        }
        lastTicketUpdateRef.current[t.id] = t.updatedAt
      })
      setTickets(next)
      if (activeId) {
        const msgs = getMessages(activeId)
        const lastAdmin = [...msgs].reverse().find((m) => m.authorRole === "admin")
        if (lastAdmin) lastSeenAdminMsgRef.current = lastAdmin.id
        setMessages(msgs)
      }
    }
    sync()
    if (typeof window === "undefined") return
    window.addEventListener(getSupportEventName(), sync as EventListener)
    window.addEventListener("storage", sync)
    window.addEventListener("focus", sync)
    return () => {
      window.removeEventListener(getSupportEventName(), sync as EventListener)
      window.removeEventListener("storage", sync)
      window.removeEventListener("focus", sync)
    }
  }, [user, activeId])

  useEffect(() => {
    if (view === "chat") messagesEnd.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length, view])

  useEffect(() => {
    if (activeId && user) markTicketRead(activeId, "user")
  }, [activeId, user, messages.length])

  const sortedTickets = useMemo(
    () => [...tickets].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [tickets],
  )

  if (!user || user.role === "admin") return null

  const whatsappLink = whatsapp
    ? `https://wa.me/${whatsapp.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
        `Hola Hack Evans, soy ${user.name}. Necesito ayuda con: `,
      )}`
    : null

  const submitNew = () => {
    if (!subject.trim() || !body.trim()) return
    const ticket = createTicket({
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      subject: subject.trim(),
      category,
      body: body.trim(),
      attachments: draftAttach.length > 0 ? draftAttach : undefined,
    })
    setSubject("")
    setBody("")
    setDraftAttach([])
    setActiveId(ticket.id)
    setView("chat")
  }

  const sendReply = () => {
    if (!activeId || (!reply.trim() && replyAttach.length === 0)) return
    postTicketMessage({
      ticketId: activeId,
      authorId: user.id,
      authorName: user.name,
      authorRole: "user",
      body: reply.trim(),
      attachments: replyAttach.length > 0 ? replyAttach : undefined,
    })
    setReply("")
    setReplyAttach([])
  }

  const activeTicket = tickets.find((t) => t.id === activeId) || null

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Soporte"
        className={cn(
          "fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-[0_18px_40px_rgba(232,57,42,0.45)] transition-transform hover:scale-110",
          open && "scale-95",
        )}
      >
        {open ? <X className="h-6 w-6" /> : <Headphones className="h-6 w-6" />}
        {sortedTickets.some((t) => t.unreadByUser) && !open ? (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
            !
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="fixed bottom-0 right-0 z-40 flex h-[620px] max-h-[100vh] w-[380px] max-w-full flex-col overflow-hidden rounded-tl-2xl border-l border-t border-border bg-card shadow-[0_30px_80px_rgba(0,0,0,0.35)]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 bg-gradient-to-br from-primary to-[#ff6b4d] px-5 py-4 text-white">
            <div className="flex items-center gap-2">
              {view === "chat" ? (
                <button
                  onClick={() => {
                    setView("home")
                    setActiveId(null)
                  }}
                  className="rounded-full bg-white/15 p-1.5 hover:bg-white/25"
                  aria-label="Atrás"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
              ) : null}
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">Centro de soporte</p>
                <h3 className="text-base font-black">
                  {view === "chat" && activeTicket ? activeTicket.subject : view === "new" ? "Nuevo ticket" : "¿Cómo te ayudamos?"}
                </h3>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="rounded-full bg-white/15 p-2 hover:bg-white/25"
              aria-label="Cerrar widget"
              title="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto">
            {view === "home" ? (
              <div className="space-y-3 p-4">
                {whatsappLink ? (
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-500/15"
                  >
                    <span className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4" />
                      Chatear por WhatsApp
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-[0.14em]">Más rápido</span>
                  </a>
                ) : null}

                <button
                  onClick={() => setView("new")}
                  className="flex w-full items-center justify-between rounded-xl bg-primary px-3 py-2.5 text-sm font-bold text-white shadow-[0_8px_22px_rgba(232,57,42,0.32)]"
                >
                  <span className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Crear nuevo ticket
                  </span>
                </button>

                <Link
                  href="/dashboard/soporte"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3 py-2.5 text-sm font-bold text-foreground hover:border-primary/40"
                >
                  <span className="flex items-center gap-2">
                    <Headphones className="h-4 w-4 text-primary" />
                    Centro completo de soporte
                  </span>
                </Link>

                <div className="pt-2">
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Tus conversaciones ({sortedTickets.length})
                  </p>
                  {sortedTickets.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-center text-xs text-muted-foreground">
                      Aún no tienes tickets abiertos.
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {sortedTickets.map((t) => (
                        <button
                          key={t.id}
                          onClick={() => {
                            setActiveId(t.id)
                            setView("chat")
                          }}
                          className="w-full rounded-xl border border-border bg-secondary/15 p-3 text-left transition-colors hover:border-primary/40"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-bold text-foreground">{t.subject}</p>
                            {t.unreadByUser ? (
                              <span className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                            ) : null}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{t.lastMessage || "Sin mensajes"}</p>
                          <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                            {formatTime(t.updatedAt)} · {t.status}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : view === "new" ? (
              <div className="space-y-3 p-4">
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as typeof category)}
                  className="h-10 w-full rounded-lg border border-border bg-background px-2 text-sm outline-none focus:border-primary"
                >
                  <option value="general">General</option>
                  <option value="pago">Pago / facturación</option>
                  <option value="acceso">Acceso a curso</option>
                  <option value="tecnico">Problema técnico</option>
                </select>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Asunto"
                  className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-primary"
                />
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={5}
                  placeholder="Cuéntanos qué necesitas..."
                  className="w-full resize-y rounded-lg border border-border bg-background p-3 text-sm outline-none focus:border-primary"
                />
                <AttachmentPreview attachments={draftAttach} onRemove={(idx) => setDraftAttach((cur) => cur.filter((_, i) => i !== idx))} />
                <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border bg-secondary/10 px-3 py-2 text-xs text-muted-foreground hover:border-primary/40">
                  <Paperclip className="h-3.5 w-3.5" />
                  Adjuntar archivos (máx 4MB c/u)
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={async (e) => {
                      const files = await readAttachments(e.target.files)
                      setDraftAttach((cur) => [...cur, ...files])
                      e.target.value = ""
                    }}
                  />
                </label>
                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setView("home")}
                    className="flex-1 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs font-bold text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={submitNew}
                    disabled={!subject.trim() || !body.trim()}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-black text-white disabled:opacity-50"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Enviar al equipo
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3 p-4">
                {messages.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-border bg-secondary/10 p-6 text-center text-xs text-muted-foreground">
                    Inicia la conversación.
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={cn(
                        "max-w-[88%] space-y-2 rounded-2xl px-3 py-2",
                        m.authorRole === "user"
                          ? "self-end rounded-br-sm bg-primary text-white"
                          : "self-start rounded-bl-sm bg-secondary text-foreground",
                      )}
                    >
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-80">
                        {m.authorRole === "user" ? "Tú" : "Soporte"} · {formatTime(m.createdAt)}
                      </p>
                      {m.body ? <p className="whitespace-pre-line text-sm leading-relaxed">{m.body}</p> : null}
                      {m.attachments && m.attachments.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {m.attachments.map((att, idx) =>
                            att.type.startsWith("image/") ? (
                              <button
                                key={idx}
                                onClick={() => setLightbox(att)}
                                className="block"
                              >
                                <img src={att.dataUrl} alt={att.name} className="max-h-32 rounded-lg border border-white/20 hover:opacity-90" />
                              </button>
                            ) : (
                              <a
                                key={idx}
                                href={att.dataUrl}
                                download={att.name}
                                className="flex items-center gap-1.5 rounded-lg bg-black/20 px-2 py-1 text-[11px] font-bold underline"
                              >
                                <Paperclip className="h-3 w-3" />
                                {att.name}
                              </a>
                            ),
                          )}
                        </div>
                      ) : null}
                    </div>
                  ))
                )}
                <div ref={messagesEnd} />
              </div>
            )}
          </div>

          {/* Composer (only in chat view) */}
          {view === "chat" && activeTicket ? (
            <div className="border-t border-border bg-card p-3">
              <AttachmentPreview attachments={replyAttach} onRemove={(idx) => setReplyAttach((cur) => cur.filter((_, i) => i !== idx))} />
              <div className="mt-2 flex items-end gap-2">
                <label className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border border-border bg-secondary/20 text-muted-foreground hover:border-primary/40 hover:text-primary">
                  <Paperclip className="h-4 w-4" />
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={async (e) => {
                      const files = await readAttachments(e.target.files)
                      setReplyAttach((cur) => [...cur, ...files])
                      e.target.value = ""
                    }}
                  />
                </label>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                      e.preventDefault()
                      sendReply()
                    }
                  }}
                  rows={1}
                  placeholder="Escribe tu mensaje..."
                  className="max-h-32 min-h-[36px] flex-1 resize-y rounded-2xl border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
                />
                <button
                  onClick={sendReply}
                  disabled={!reply.trim() && replyAttach.length === 0}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white disabled:opacity-50"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-1 text-[10px] text-muted-foreground">Ctrl + Enter para enviar</p>
            </div>
          ) : null}
        </div>
      ) : null}

      {lightbox ? (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" onClick={() => setLightbox(null)}>
          <button
            onClick={() => setLightbox(null)}
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white hover:bg-white/25"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="max-h-[90vh] max-w-[90vw]" onClick={(e) => e.stopPropagation()}>
            {lightbox.type.startsWith("image/") ? (
              <img src={lightbox.dataUrl} alt={lightbox.name} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
            ) : (
              <a href={lightbox.dataUrl} download={lightbox.name} className="block rounded-xl bg-white px-6 py-4 font-bold text-foreground">
                Descargar {lightbox.name}
              </a>
            )}
            <p className="mt-2 text-center text-xs text-white/70">{lightbox.name}</p>
          </div>
        </div>
      ) : null}
    </>
  )
}
