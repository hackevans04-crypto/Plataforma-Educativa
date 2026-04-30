"use client"

type DiscoveryType = "course" | "simulator"

const CLICK_KEYS: Record<DiscoveryType, string> = {
  course: "he_course_click_popularity",
  simulator: "he_simulator_click_popularity",
}

const SEARCH_KEYS: Record<DiscoveryType, string> = {
  course: "he_course_search_popularity",
  simulator: "he_simulator_search_popularity",
}

function parseMap(value: string | null): Record<string, number> {
  try {
    const parsed = value ? JSON.parse(value) : {}
    return parsed && typeof parsed === "object" ? (parsed as Record<string, number>) : {}
  } catch {
    return {}
  }
}

function readMap(key: string) {
  if (typeof window === "undefined") return {}
  return parseMap(window.localStorage.getItem(key))
}

function writeMap(key: string, value: Record<string, number>) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(key, JSON.stringify(value))
}

export function trackEntityClick(type: DiscoveryType, id: string) {
  if (!id || typeof window === "undefined") return
  const key = CLICK_KEYS[type]
  const current = readMap(key)
  current[id] = (current[id] || 0) + 1
  writeMap(key, current)
}

export function trackSearchTerm(type: DiscoveryType, term: string) {
  const normalized = term.trim().toLowerCase()
  if (normalized.length < 2 || typeof window === "undefined") return
  const key = SEARCH_KEYS[type]
  const current = readMap(key)
  current[normalized] = (current[normalized] || 0) + 1
  writeMap(key, current)
}

export function getEntityClickScore(type: DiscoveryType, id: string) {
  if (!id) return 0
  return readMap(CLICK_KEYS[type])[id] || 0
}

export function getSearchRelevanceScore(type: DiscoveryType, values: string[]) {
  const current = readMap(SEARCH_KEYS[type])
  const haystack = values.join(" ").toLowerCase()
  return Object.entries(current).reduce((score, [term, count]) => {
    return haystack.includes(term) ? score + count : score
  }, 0)
}
