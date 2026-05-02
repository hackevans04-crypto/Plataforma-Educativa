"use client"

const QA_KEY = "he_course_qa"
const NOTES_KEY = "he_course_notes"
const REVIEWS_KEY = "he_course_reviews"
const ANNOUNCEMENTS_KEY = "he_course_announcements"

export const COURSE_FEEDBACK_EVENT = "he-course-feedback-updated"

function emit() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(COURSE_FEEDBACK_EVENT))
}

function parse<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) ?? fallback) : fallback
  } catch {
    return fallback
  }
}

function nowIso() {
  return new Date().toISOString()
}

function uid(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

/* ----------------- Q&A ----------------- */
export type QAReply = {
  id: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
  createdAt: string
}
export type QAThread = {
  id: string
  courseId: string
  userId: string
  userName: string
  title: string
  body: string
  createdAt: string
  replies: QAReply[]
}

export function getQAThreads(): QAThread[] {
  if (typeof window === "undefined") return []
  return parse<QAThread[]>(window.localStorage.getItem(QA_KEY), [])
}
function saveQA(items: QAThread[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(QA_KEY, JSON.stringify(items))
  emit()
}
export function getQAForCourse(courseId: string) {
  return getQAThreads()
    .filter((t) => t.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export function createQAThread(input: {
  courseId: string
  userId: string
  userName: string
  title: string
  body: string
}): QAThread {
  const thread: QAThread = {
    id: uid("qa"),
    courseId: input.courseId,
    userId: input.userId,
    userName: input.userName,
    title: input.title,
    body: input.body,
    createdAt: nowIso(),
    replies: [],
  }
  saveQA([thread, ...getQAThreads()])
  return thread
}
export function replyQAThread(input: {
  threadId: string
  authorId: string
  authorName: string
  authorRole: "user" | "admin"
  body: string
}) {
  const all = getQAThreads()
  const target = all.find((t) => t.id === input.threadId)
  if (!target) return null
  target.replies.push({
    id: uid("qar"),
    authorId: input.authorId,
    authorName: input.authorName,
    authorRole: input.authorRole,
    body: input.body,
    createdAt: nowIso(),
  })
  saveQA(all)
  return target
}

/* ----------------- Notes (per user per course) ----------------- */
export type CourseNote = {
  id: string
  courseId: string
  userId: string
  body: string
  lessonId?: string
  createdAt: string
  updatedAt: string
}
export function getNotesForCourse(courseId: string, userId: string): CourseNote[] {
  if (typeof window === "undefined") return []
  return parse<CourseNote[]>(window.localStorage.getItem(NOTES_KEY), [])
    .filter((n) => n.courseId === courseId && n.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export function addNote(input: { courseId: string; userId: string; body: string; lessonId?: string }) {
  if (typeof window === "undefined") return
  const all = parse<CourseNote[]>(window.localStorage.getItem(NOTES_KEY), [])
  const note: CourseNote = {
    id: uid("note"),
    courseId: input.courseId,
    userId: input.userId,
    body: input.body,
    lessonId: input.lessonId,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  }
  window.localStorage.setItem(NOTES_KEY, JSON.stringify([note, ...all]))
  emit()
  return note
}
export function deleteNote(noteId: string) {
  if (typeof window === "undefined") return
  const all = parse<CourseNote[]>(window.localStorage.getItem(NOTES_KEY), []).filter((n) => n.id !== noteId)
  window.localStorage.setItem(NOTES_KEY, JSON.stringify(all))
  emit()
}

/* ----------------- Reviews ----------------- */
export type CourseReview = {
  id: string
  courseId: string
  userId: string
  userName: string
  rating: number
  body: string
  createdAt: string
}
export function getReviewsForCourse(courseId: string): CourseReview[] {
  if (typeof window === "undefined") return []
  return parse<CourseReview[]>(window.localStorage.getItem(REVIEWS_KEY), [])
    .filter((r) => r.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export function getUserReview(courseId: string, userId: string): CourseReview | null {
  return getReviewsForCourse(courseId).find((r) => r.userId === userId) || null
}
export function upsertReview(input: {
  courseId: string
  userId: string
  userName: string
  rating: number
  body: string
}): CourseReview {
  if (typeof window === "undefined") {
    return { ...input, id: "", createdAt: nowIso() } as CourseReview
  }
  const all = parse<CourseReview[]>(window.localStorage.getItem(REVIEWS_KEY), [])
  const existing = all.find((r) => r.courseId === input.courseId && r.userId === input.userId)
  if (existing) {
    existing.rating = input.rating
    existing.body = input.body
    existing.createdAt = nowIso()
    window.localStorage.setItem(REVIEWS_KEY, JSON.stringify(all))
    emit()
    return existing
  }
  const review: CourseReview = {
    id: uid("rev"),
    courseId: input.courseId,
    userId: input.userId,
    userName: input.userName,
    rating: input.rating,
    body: input.body,
    createdAt: nowIso(),
  }
  window.localStorage.setItem(REVIEWS_KEY, JSON.stringify([review, ...all]))
  emit()
  return review
}

/* ----------------- Announcements (admin → users) ----------------- */
export type Announcement = {
  id: string
  courseId: string
  authorName: string
  title: string
  body: string
  createdAt: string
}
export function getAnnouncementsForCourse(courseId: string): Announcement[] {
  if (typeof window === "undefined") return []
  return parse<Announcement[]>(window.localStorage.getItem(ANNOUNCEMENTS_KEY), [])
    .filter((a) => a.courseId === courseId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}
export function getAllAnnouncements(): Announcement[] {
  if (typeof window === "undefined") return []
  return parse<Announcement[]>(window.localStorage.getItem(ANNOUNCEMENTS_KEY), [])
}
export function postAnnouncement(input: {
  courseId: string
  authorName: string
  title: string
  body: string
}): Announcement {
  const announcement: Announcement = {
    id: uid("ann"),
    courseId: input.courseId,
    authorName: input.authorName,
    title: input.title,
    body: input.body,
    createdAt: nowIso(),
  }
  if (typeof window === "undefined") return announcement
  const all = getAllAnnouncements()
  window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify([announcement, ...all]))
  emit()
  return announcement
}
export function deleteAnnouncement(id: string) {
  if (typeof window === "undefined") return
  const all = getAllAnnouncements().filter((a) => a.id !== id)
  window.localStorage.setItem(ANNOUNCEMENTS_KEY, JSON.stringify(all))
  emit()
}
