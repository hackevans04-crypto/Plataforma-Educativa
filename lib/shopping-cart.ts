"use client"

export type CartCourseItem = {
  id: string
  titulo: string
  instructor: string
  imagen: string
  precio: number
  precioOriginal: number
  categoria: string
  nivel: string
  gratis: boolean
}

export type CartOrder = {
  id: string
  userId: string
  createdAt: string
  subtotal: number
  total: number
  items: CartCourseItem[]
  status: "paid"
}

const CART_KEY = "he_cart"
const CART_EVENT = "he-cart-updated"
const ORDERS_KEY = "he_orders"
const ENROLLMENTS_KEY = "he_matriculas"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function emitCartUpdated() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(CART_EVENT))
}

export function getCartEventName() {
  return CART_EVENT
}

export function getCartItems() {
  if (typeof window === "undefined") return [] as CartCourseItem[]
  return parseSafe<CartCourseItem[]>(window.localStorage.getItem(CART_KEY), [])
}

export function saveCartItems(items: CartCourseItem[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CART_KEY, JSON.stringify(items))
  emitCartUpdated()
}

export function addCourseToCart(item: CartCourseItem) {
  const current = getCartItems()
  if (current.some((entry) => entry.id === item.id)) return current
  const next = [...current, item]
  saveCartItems(next)
  return next
}

export function removeCourseFromCart(courseId: string) {
  const next = getCartItems().filter((item) => item.id !== courseId)
  saveCartItems(next)
  return next
}

export function clearCart() {
  saveCartItems([])
}

export function isCourseInCart(courseId: string) {
  return getCartItems().some((item) => item.id === courseId)
}

export function getCartSubtotal(items = getCartItems()) {
  return items.reduce((sum, item) => sum + Number(item.precio || 0), 0)
}

export function getCartSavings(items = getCartItems()) {
  return items.reduce((sum, item) => {
    const original = Number(item.precioOriginal || 0)
    const current = Number(item.precio || 0)
    return sum + Math.max(0, original - current)
  }, 0)
}

export function createPaidOrder(userId: string, items = getCartItems()) {
  if (typeof window === "undefined" || !userId || items.length === 0) return null

  const subtotal = getCartSubtotal(items)
  const order: CartOrder = {
    id: `order_${Date.now()}`,
    userId,
    createdAt: new Date().toISOString(),
    subtotal,
    total: subtotal,
    items,
    status: "paid",
  }

  const orders = parseSafe<CartOrder[]>(window.localStorage.getItem(ORDERS_KEY), [])
  window.localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...orders]))

  const enrollments = parseSafe<any[]>(window.localStorage.getItem(ENROLLMENTS_KEY), [])
  for (const item of items) {
    if (enrollments.some((entry) => entry.userId === userId && entry.cursoId === item.id)) continue
    enrollments.push({
      id: `mat_${Date.now()}_${item.id}`,
      userId,
      cursoId: item.id,
      fechaMatricula: new Date().toISOString(),
      progreso: 0,
      completado: false,
      tipoAcceso: item.gratis ? "libre" : "pago",
      montoPagado: Number(item.precio || 0),
    })
  }

  window.localStorage.setItem(ENROLLMENTS_KEY, JSON.stringify(enrollments))
  clearCart()
  return order
}
