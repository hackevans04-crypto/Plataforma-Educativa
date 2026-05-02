"use client"

const KEY = "he_promo_banners"
const DISMISS_PREFIX = "he_promo_dismissed_"
export const PROMO_EVENT = "he-promo-updated"

export type PromoBanner = {
  id: string
  message: string
  ctaLabel: string
  ctaHref: string
  background: string
  textColor: string
  active: boolean
  showOnLanding: boolean
  showOnDashboard: boolean
  createdAt: string
}

function emit() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(PROMO_EVENT))
}

function parse<T>(value: string | null, fallback: T): T {
  try {
    return value ? (JSON.parse(value) ?? fallback) : fallback
  } catch {
    return fallback
  }
}

export function getPromoBanners(): PromoBanner[] {
  if (typeof window === "undefined") return []
  return parse<PromoBanner[]>(window.localStorage.getItem(KEY), [])
}

export function savePromoBanners(items: PromoBanner[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(KEY, JSON.stringify(items))
  emit()
}

export function upsertPromoBanner(banner: Omit<PromoBanner, "id" | "createdAt"> & { id?: string }): PromoBanner {
  const all = getPromoBanners()
  if (banner.id) {
    const target = all.find((b) => b.id === banner.id)
    if (target) {
      Object.assign(target, banner)
      savePromoBanners(all)
      return target
    }
  }
  const created: PromoBanner = {
    id: `promo_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: new Date().toISOString(),
    ...banner,
  }
  savePromoBanners([created, ...all])
  return created
}

export function deletePromoBanner(id: string) {
  savePromoBanners(getPromoBanners().filter((b) => b.id !== id))
}

export function isBannerDismissed(id: string): boolean {
  if (typeof window === "undefined") return false
  return window.localStorage.getItem(DISMISS_PREFIX + id) === "1"
}

export function dismissBanner(id: string) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(DISMISS_PREFIX + id, "1")
  emit()
}

export function getActiveBannerForScope(scope: "landing" | "dashboard"): PromoBanner | null {
  const all = getPromoBanners()
  return (
    all.find((b) => {
      if (!b.active) return false
      if (scope === "landing" && !b.showOnLanding) return false
      if (scope === "dashboard" && !b.showOnDashboard) return false
      if (isBannerDismissed(b.id)) return false
      return true
    }) || null
  )
}
