"use client"

import Image from "next/image"
import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Star,
  Tag,
  Trash2,
  X,
} from "lucide-react"
import type { CartCourseItem } from "@/lib/shopping-cart"

interface CartDrawerProps {
  isOpen: boolean
  items: CartCourseItem[]
  subtotal: number
  savings: number
  isAuthenticated: boolean
  onClose: () => void
  onRemove: (courseId: string) => void
  onClear: () => void
}

export default function CartDrawer({
  isOpen,
  items,
  subtotal,
  savings,
  isAuthenticated,
  onClose,
  onRemove,
  onClear,
}: CartDrawerProps) {
  const paidItems = items.filter((item) => !item.gratis)
  const discountPercent = subtotal + savings > 0 ? Math.round((savings / (subtotal + savings)) * 100) : 0

  return (
    <>
      {isOpen ? (
        <div
          className="fixed inset-0 z-[120] bg-black/65 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
      ) : null}

      <aside
        className={`fixed right-0 top-0 z-[130] h-full w-full max-w-md border-l border-white/10 bg-[#0a0b10]/97 shadow-[0_24px_90px_rgba(0,0,0,0.55)] backdrop-blur-2xl transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-white/8 px-5 py-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-white">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d]">
                    <ShoppingBag className="h-4 w-4" />
                  </div>
                  <h2 className="text-lg font-black">Tu cesta</h2>
                </div>
                <p className="mt-1 text-xs text-white/55">
                  {items.length} {items.length === 1 ? "curso en la cesta" : "cursos en la cesta"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="rounded-full border border-white/12 bg-white/[0.04] p-2 text-white/55 transition-colors hover:border-white/30 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
              <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-[rgba(232,57,42,0.3)] bg-[rgba(232,57,42,0.1)]">
                <ShoppingBag className="h-9 w-9 text-[#ff8c7d]" />
              </div>
              <h3 className="mb-2 text-2xl font-black text-white">Tu cesta esta vacia</h3>
              <p className="max-w-sm text-sm leading-relaxed text-white/55">
                Agrega cursos para revisar precios y continuar a un pago seguro dentro de tu cuenta.
              </p>
              <Link
                href="/cursos"
                onClick={onClose}
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] px-5 py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)]"
              >
                Explorar cursos
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <>
              {/* Items list — Udemy-style rows */}
              <div className="flex-1 space-y-3 overflow-y-auto px-5 py-5">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="group rounded-2xl border border-white/8 bg-white/[0.025] p-3 transition-all hover:border-[rgba(232,57,42,0.35)] hover:bg-white/[0.04]"
                  >
                    <div className="flex gap-3">
                      <div className="relative h-24 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-[#3a0d09] via-[#7a1a0f] to-[#E8392A]">
                        <Image
                          src={item.imagen || "/placeholder.jpg"}
                          alt={item.titulo}
                          fill
                          className="object-cover mix-blend-screen opacity-90"
                        />
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_55%)]" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="line-clamp-2 text-sm font-bold leading-snug text-white">
                          {item.titulo}
                        </h3>
                        <p className="mt-0.5 text-xs text-white/45">Por {item.instructor}</p>

                        <div className="mt-1.5 flex items-center gap-2">
                          {item.categoria ? (
                            <span className="rounded-full border border-[rgba(232,57,42,0.4)] bg-[rgba(232,57,42,0.12)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-[#ff8c7d]">
                              {item.categoria}
                            </span>
                          ) : null}
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star key={star} size={9} className="fill-[#fbbf24] text-[#fbbf24]" />
                            ))}
                          </div>
                        </div>

                        <div className="mt-2.5 flex items-center justify-between">
                          {item.gratis ? (
                            <span className="text-base font-black text-[#22c55e]">Gratis</span>
                          ) : (
                            <div className="flex items-baseline gap-2">
                              <span className="text-base font-black text-white">
                                ${item.precio.toFixed(2)}
                              </span>
                              {item.precioOriginal > item.precio ? (
                                <span className="text-xs text-white/30 line-through">
                                  ${item.precioOriginal.toFixed(2)}
                                </span>
                              ) : null}
                            </div>
                          )}

                          <button
                            onClick={() => onRemove(item.id)}
                            className="inline-flex items-center gap-1 rounded-full border border-white/8 bg-white/[0.03] px-2.5 py-1 text-[11px] font-semibold text-white/55 transition-colors hover:border-red-400/40 hover:bg-red-500/10 hover:text-red-300"
                          >
                            <Trash2 className="h-3 w-3" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                {paidItems.length > 0 ? (
                  <button
                    onClick={onClear}
                    className="mt-2 w-full rounded-xl border border-white/8 px-4 py-2 text-xs font-semibold text-white/55 transition-colors hover:border-red-400/30 hover:text-red-300"
                  >
                    Vaciar cesta
                  </button>
                ) : null}
              </div>

              {/* Sticky bottom — totals + CTA */}
              <div className="border-t border-white/8 bg-[#06070a]/85 px-5 py-5 backdrop-blur-xl">
                <div className="mb-4">
                  <div className="flex items-baseline justify-between">
                    <span className="text-xs uppercase tracking-[0.18em] text-white/45">Total</span>
                    <div className="text-right">
                      <div className="text-3xl font-black text-white">${subtotal.toFixed(2)}</div>
                      {savings > 0 ? (
                        <div className="text-xs text-white/40 line-through">
                          ${(subtotal + savings).toFixed(2)}
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {savings > 0 ? (
                    <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.1)] px-2.5 py-1 text-[11px] font-bold text-[#4ade80]">
                      <Tag className="h-3 w-3" />
                      {discountPercent}% de descuento
                    </div>
                  ) : null}
                </div>

                {!isAuthenticated ? (
                  <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-500/25 bg-amber-500/8 p-3">
                    <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                    <div>
                      <p className="text-xs font-bold text-amber-200">Inicia sesion para pagar</p>
                      <p className="mt-0.5 text-[11px] leading-relaxed text-amber-100/65">
                        Te llevamos al pago apenas entres a tu cuenta.
                      </p>
                    </div>
                  </div>
                ) : null}

                <Link
                  href={isAuthenticated ? "/dashboard/checkout" : "/login?returnTo=%2Fdashboard%2Fcheckout"}
                  onClick={onClose}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#E8392A] via-[#ff6b4d] to-[#ff8c7d] px-4 py-3.5 text-sm font-black text-white shadow-[0_14px_36px_rgba(232,57,42,0.4)] transition-transform hover:scale-[1.01]"
                >
                  {isAuthenticated ? "Procede a pagar" : "Iniciar sesion"}
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <p className="mt-2 text-center text-[10px] text-white/40">Todavia no se te cobrara</p>

                <div className="mt-4 flex items-center justify-center gap-3 border-t border-white/6 pt-3 text-[10px] text-white/40">
                  <span className="inline-flex items-center gap-1">
                    <ShieldCheck className="h-3 w-3" /> Pago seguro
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <BadgeCheck className="h-3 w-3" /> Garantia 30 dias
                  </span>
                </div>
              </div>
            </>
          )}
        </div>
      </aside>
    </>
  )
}
