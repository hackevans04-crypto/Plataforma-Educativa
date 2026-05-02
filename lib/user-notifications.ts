"use client"

import { getTicketsForUser, getMessages, type SupportTicket } from "@/lib/payments"
import { getAllAnnouncements, type Announcement } from "@/lib/course-feedback"
import { PROMO_EVENT, getPromoBanners } from "@/lib/promo-banner"

const READS_KEY = "he_user_notif_reads"

export type UserNotification = {
  id: string
  kind: "support_reply" | "announcement" | "promo"
  title: string
  body: string
  href?: string
  createdAt: string
  read: boolean
}

function getReads(userId: string): Record<string, boolean> {
  if (typeof window === "undefined") return {}
  try {
    const raw = window.localStorage.getItem(READS_KEY + "_" + userId)
    return raw ? (JSON.parse(raw) as Record<string, boolean>) : {}
  } catch {
    return {}
  }
}

function saveReads(userId: string, reads: Record<string, boolean>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(READS_KEY + "_" + userId, JSON.stringify(reads))
  window.dispatchEvent(new CustomEvent("he-user-notifs-updated"))
}

export function markUserNotificationRead(userId: string, id: string) {
  const reads = getReads(userId)
  reads[id] = true
  saveReads(userId, reads)
}

export function markAllUserNotificationsRead(userId: string, ids: string[]) {
  const reads = getReads(userId)
  ids.forEach((id) => (reads[id] = true))
  saveReads(userId, reads)
}

export function getUserNotifications(userId: string, enrolledCourseIds: Set<string>): UserNotification[] {
  if (!userId || typeof window === "undefined") return []
  const reads = getReads(userId)
  const items: UserNotification[] = []

  // Support replies
  const tickets: SupportTicket[] = getTicketsForUser(userId)
  tickets.forEach((t) => {
    const msgs = getMessages(t.id)
    const lastAdmin = [...msgs].reverse().find((m) => m.authorRole === "admin")
    if (!lastAdmin) return
    const id = `support_${t.id}_${lastAdmin.id}`
    items.push({
      id,
      kind: "support_reply",
      title: `Soporte respondió: ${t.subject}`,
      body: lastAdmin.body || "Te respondieron en tu ticket.",
      href: "/dashboard/soporte",
      createdAt: lastAdmin.createdAt,
      read: !!reads[id] || !t.unreadByUser,
    })
  })

  // Announcements (only for enrolled courses)
  const anns: Announcement[] = getAllAnnouncements()
  anns.forEach((a) => {
    if (!enrolledCourseIds.has(a.courseId)) return
    const id = `ann_${a.id}`
    items.push({
      id,
      kind: "announcement",
      title: a.title,
      body: a.body,
      href: `/dashboard/cursos?course=${encodeURIComponent(a.courseId)}`,
      createdAt: a.createdAt,
      read: !!reads[id],
    })
  })

  // Promotional banners (active)
  const promos = getPromoBanners().filter((p) => p.active && p.showOnDashboard)
  promos.forEach((p) => {
    const id = `promo_${p.id}`
    items.push({
      id,
      kind: "promo",
      title: "Oferta especial",
      body: p.message,
      href: p.ctaHref || undefined,
      createdAt: p.createdAt,
      read: !!reads[id],
    })
  })

  return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export const USER_NOTIF_EVENT = "he-user-notifs-updated"
export { PROMO_EVENT }
