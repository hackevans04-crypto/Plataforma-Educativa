"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Search,
  SlidersHorizontal,
  Star,
  Clock,
  BarChart2,
  X,
  ChevronDown,
  ChevronUp,
  ShoppingCart,
  Check,
  ArrowRight,
} from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BrandBackdrop from "@/components/brand-backdrop"
import CatalogCourseCard from "@/components/cursos/CatalogCourseCard"
import { trackEntityClick, trackSearchTerm } from "@/lib/discovery-popularity"
import { useAuth } from "@/contexts/auth-context"
import CartDrawer from "@/components/cart/CartDrawer"
import {
  addCourseToCart,
  getCartEventName,
  getCartItems,
  getCartSavings,
  getCartSubtotal,
  isCourseInCart,
  removeCourseFromCart,
  clearCart,
  type CartCourseItem,
} from "@/lib/shopping-cart"

interface Curso {
  id: string
  titulo: string
  descripcion: string
  instructor: string
  imagen: string
  precio: number
  precioOriginal: number
  rating: number
  totalRatings: number
  totalHoras: string
  totalClases: number
  nivel: string
  categoria: string
  bestseller: boolean
  nuevo: boolean
  gratis: boolean
  tags: string[]
}

interface RecursoCurso {
  id: string
  duracionMinutos?: number
}

interface SeccionCurso {
  id: string
  recursos: RecursoCurso[]
}

interface CursoFuente {
  id: string
  titulo: string
  subtitulo?: string
  descripcion: string
  instructor: string
  categoria: string
  nivel: string
  estado: "borrador" | "en_revision" | "publicado" | "archivado"
  acceso: "libre" | "clave" | "pago"
  precio?: number
  precioOriginal?: number
  portadaImagen?: string
  tags?: string[]
  secciones: SeccionCurso[]
  destacado?: boolean
  popular?: boolean
  nuevo?: boolean
  publicarEnPaginaPrincipal?: boolean
  createdAt?: string
}

const CURSOS_KEY = "he_cursos"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

function totalMinutos(secciones: SeccionCurso[]) {
  return secciones.reduce(
    (total, section) =>
      total + section.recursos.reduce((sum, recurso) => sum + (recurso.duracionMinutos || 0), 0),
    0
  )
}

function totalClases(secciones: SeccionCurso[]) {
  return secciones.reduce((total, section) => total + section.recursos.length, 0)
}

function formatHoras(minutes: number) {
  if (!minutes) return "1.0"
  return (minutes / 60).toFixed(1)
}

function buildImage(src?: string) {
  if (!src || !src.trim()) return "/placeholder.jpg"
  return src
}

function buildCatalogoPublico(): Curso[] {
  if (typeof window === "undefined") return []

  const cursosFuente = parseSafe<CursoFuente[]>(window.localStorage.getItem(CURSOS_KEY), [])

  return cursosFuente
    .filter((curso) => curso.estado === "publicado" && curso.publicarEnPaginaPrincipal !== false)
    .sort((a, b) => {
      const scoreA =
        (a.destacado ? 30 : 0) +
        (a.popular ? 20 : 0) +
        (a.nuevo ? 10 : 0) +
        new Date(a.createdAt || 0).getTime() / 1_000_000_000_000
      const scoreB =
        (b.destacado ? 30 : 0) +
        (b.popular ? 20 : 0) +
        (b.nuevo ? 10 : 0) +
        new Date(b.createdAt || 0).getTime() / 1_000_000_000_000
      return scoreB - scoreA
    })
    .map((curso, index) => {
      const minutos = totalMinutos(curso.secciones || [])
      const clases = totalClases(curso.secciones || [])
      const gratis = curso.acceso !== "pago" || (curso.precio || 0) <= 0
      const baseRating = curso.destacado ? 4.9 : curso.popular ? 4.8 : curso.nuevo ? 4.7 : 4.6
      const totalRatings = 180 + index * 67 + clases * 9

      return {
        id: curso.id,
        titulo: curso.titulo,
        descripcion: curso.subtitulo?.trim() || curso.descripcion,
        instructor: curso.instructor || "Hack Evans Academy",
        imagen: buildImage(curso.portadaImagen),
        precio: gratis ? 0 : Number(curso.precio || 0),
        precioOriginal: gratis
          ? 0
          : Number(curso.precioOriginal || Math.max(Number(curso.precio || 0) * 1.7, Number(curso.precio || 0))),
        rating: Number(baseRating.toFixed(1)),
        totalRatings,
        totalHoras: formatHoras(minutos),
        totalClases: clases || 1,
        nivel: curso.nivel || "Todos los niveles",
        categoria: curso.categoria || "General",
        bestseller: Boolean(curso.destacado || curso.popular),
        nuevo: Boolean(curso.nuevo),
        gratis,
        tags: curso.tags || [],
      }
    })
}

function getCategorias(cursos: Curso[]) {
  const base = ["Todos"]
  const dynamic = Array.from(new Set(cursos.map((curso) => curso.categoria).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b)
  )
  return [...base, ...dynamic]
}

function toCartItem(curso: Curso): CartCourseItem {
  return {
    id: curso.id,
    titulo: curso.titulo,
    instructor: curso.instructor,
    imagen: curso.imagen,
    precio: curso.precio,
    precioOriginal: curso.precioOriginal,
    categoria: curso.categoria,
    nivel: curso.nivel,
    gratis: curso.gratis,
  }
}

function FiltroSeccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(true)

  return (
    <div className="border-b border-white/8 py-4">
      <button
        onClick={() => setAbierto(!abierto)}
        className="mb-0 flex w-full items-center justify-between text-sm font-bold text-white transition-colors hover:text-gray-300"
      >
        {titulo}
        {abierto ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>
      {abierto ? <div className="mt-3">{children}</div> : null}
    </div>
  )
}

export default function CursosPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const [cursos, setCursos] = useState<Curso[]>([])
  const [cartItems, setCartItems] = useState<CartCourseItem[]>([])
  const [busqueda, setBusqueda] = useState("")
  const [categoriaActiva, setCategoriaActiva] = useState("Todos")
  const [nivelFiltro, setNivelFiltro] = useState<string[]>([])
  const [ratingFiltro, setRatingFiltro] = useState<number | null>(null)
  const [precioFiltro, setPrecioFiltro] = useState<"todos" | "gratis" | "pago">("todos")
  const [ordenarPor, setOrdenarPor] = useState("relevancia")
  const [drawerAbierto, setDrawerAbierto] = useState(false)
  const [cartAbierto, setCartAbierto] = useState(false)

  useEffect(() => {
    const syncCursos = () => setCursos(buildCatalogoPublico())

    syncCursos()
    window.addEventListener("storage", syncCursos)
    window.addEventListener("he-cursos-updated", syncCursos as EventListener)
    window.addEventListener("focus", syncCursos)

    return () => {
      window.removeEventListener("storage", syncCursos)
      window.removeEventListener("he-cursos-updated", syncCursos as EventListener)
      window.removeEventListener("focus", syncCursos)
    }
  }, [])

  useEffect(() => {
    if (!busqueda.trim()) return
    const timeout = window.setTimeout(() => {
      trackSearchTerm("course", busqueda)
    }, 500)

    return () => window.clearTimeout(timeout)
  }, [busqueda])

  useEffect(() => {
    const syncCart = () => setCartItems(getCartItems())

    syncCart()
    window.addEventListener("storage", syncCart)
    window.addEventListener(getCartEventName(), syncCart as EventListener)
    window.addEventListener("focus", syncCart)

    return () => {
      window.removeEventListener("storage", syncCart)
      window.removeEventListener(getCartEventName(), syncCart as EventListener)
      window.removeEventListener("focus", syncCart)
    }
  }, [])

  const categorias = useMemo(() => getCategorias(cursos), [cursos])
  const cartSubtotal = useMemo(() => getCartSubtotal(cartItems), [cartItems])
  const cartSavings = useMemo(() => getCartSavings(cartItems), [cartItems])

  useEffect(() => {
    if (!categorias.includes(categoriaActiva)) {
      setCategoriaActiva("Todos")
    }
  }, [categoriaActiva, categorias])

  const toggleNivel = (nivel: string) => {
    setNivelFiltro((prev) => (prev.includes(nivel) ? prev.filter((n) => n !== nivel) : [...prev, nivel]))
  }

  const cursosFiltrados = useMemo(() => {
    return cursos
      .filter((c) => {
        const term = busqueda.toLowerCase()
        const matchBusqueda =
          !busqueda ||
          c.titulo.toLowerCase().includes(term) ||
          c.descripcion.toLowerCase().includes(term) ||
          c.instructor.toLowerCase().includes(term) ||
          c.tags.some((tag) => tag.toLowerCase().includes(term))
        const matchCategoria = categoriaActiva === "Todos" || c.categoria === categoriaActiva
        const matchNivel = nivelFiltro.length === 0 || nivelFiltro.includes(c.nivel)
        const matchRating = !ratingFiltro || c.rating >= ratingFiltro
        const matchPrecio =
          precioFiltro === "todos" ||
          (precioFiltro === "gratis" && c.gratis) ||
          (precioFiltro === "pago" && !c.gratis)

        return matchBusqueda && matchCategoria && matchNivel && matchRating && matchPrecio
      })
      .sort((a, b) => {
        if (ordenarPor === "rating") return b.rating - a.rating
        if (ordenarPor === "precio_asc") return a.precio - b.precio
        if (ordenarPor === "precio_desc") return b.precio - a.precio
        return 0
      })
  }, [busqueda, categoriaActiva, cursos, nivelFiltro, ordenarPor, precioFiltro, ratingFiltro])

  const filtrosActivos = nivelFiltro.length > 0 || ratingFiltro !== null || precioFiltro !== "todos"

  const handleToggleCart = (curso: Curso) => {
    if (isCourseInCart(curso.id)) {
      removeCourseFromCart(curso.id)
      return
    }
    addCourseToCart(toCartItem(curso))
    setCartAbierto(true)
  }

  const handleFreeAction = (curso: Curso) => {
    if (isAuthenticated) {
      router.push(`/dashboard/cursos?course=${encodeURIComponent(curso.id)}`)
      return
    }
    router.push(`/login?returnTo=${encodeURIComponent(`/dashboard/cursos?course=${curso.id}`)}`)
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent">
      <BrandBackdrop />

      <div className="relative z-10">
        <Navbar
          onLoginClick={() => router.push("/login")}
          onRegisterClick={() => router.push("/registro")}
          hideAuthenticatedUserMenu
          showCartButton
          cartCount={cartItems.length}
          cartSubtotal={cartSubtotal}
          onCartClick={() => setCartAbierto(true)}
        />

        <div className="min-h-screen text-white">
          <div className="border-b border-white/8 bg-[#0a0b10]/40 backdrop-blur-xl">
            <div className="mx-auto max-w-7xl px-6 pt-5">
              <div className="relative max-w-3xl">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35" />
                <input
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar cursos, instructores o categorías..."
                  className="h-11 w-full rounded-full border border-white/12 bg-white/[0.04] pl-11 pr-10 text-sm text-white placeholder:text-white/35 transition-all focus:border-[rgba(232,57,42,0.55)] focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-[rgba(232,57,42,0.18)]"
                />
                {busqueda ? (
                  <button
                    onClick={() => setBusqueda("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                ) : null}
              </div>
            </div>

            <div className="scrollbar-hide mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-6 py-3">
              <button
                onClick={() => setDrawerAbierto(true)}
                className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-1.5 text-sm transition-all ${
                  filtrosActivos
                    ? "border-[#E8392A] bg-[#E8392A] font-semibold text-white"
                    : "border-white/12 bg-white/[0.03] text-white/75 hover:border-[rgba(232,57,42,0.45)] hover:text-white"
                }`}
              >
                <SlidersHorizontal size={14} />
                Todos los filtros
                {filtrosActivos ? (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/30 text-xs text-white">
                    {nivelFiltro.length + (ratingFiltro ? 1 : 0) + (precioFiltro !== "todos" ? 1 : 0)}
                  </span>
                ) : null}
              </button>

              <div className="h-6 w-px shrink-0 bg-white/10" />

              {categorias.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoriaActiva(cat)}
                  className={`shrink-0 rounded-full px-3 py-1.5 text-sm transition-all ${
                    categoriaActiva === cat
                      ? "bg-white text-black font-semibold"
                      : "text-white/55 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}

              <div className="ml-auto relative shrink-0">
                <select
                  value={ordenarPor}
                  onChange={(e) => setOrdenarPor(e.target.value)}
                  className="appearance-none rounded-full border border-white/12 bg-white/[0.03] py-1.5 pl-4 pr-9 text-sm text-white/75 cursor-pointer transition-colors focus:outline-none hover:border-[rgba(232,57,42,0.45)]"
                >
                  <option value="relevancia" className="bg-[#1c1c1c]">Mas relevante</option>
                  <option value="rating" className="bg-[#1c1c1c]">Mejor valorado</option>
                  <option value="precio_asc" className="bg-[#1c1c1c]">Precio: menor a mayor</option>
                  <option value="precio_desc" className="bg-[#1c1c1c]">Precio: mayor a menor</option>
                </select>
                <ChevronDown size={12} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-white/45" />
              </div>
            </div>
          </div>

          <section className="mx-auto max-w-7xl px-6 pb-16 pt-8">
              <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  {busqueda ? (
                    <p className="text-xl font-bold text-white">
                      {cursosFiltrados.length} resultados para <span className="italic">"{busqueda}"</span>
                    </p>
                  ) : (
                    <p className="text-sm text-white/55">
                      Mostrando <span className="font-semibold text-white">{cursosFiltrados.length}</span> cursos
                      {categoriaActiva !== "Todos" ? <> en <span className="font-semibold text-white">{categoriaActiva}</span></> : null}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                {precioFiltro !== "todos" ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {precioFiltro === "gratis" ? "Gratis" : "De pago"}
                    <button onClick={() => setPrecioFiltro("todos")}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null}

                {ratingFiltro ? (
                  <span className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {ratingFiltro}★ o mas
                    <button onClick={() => setRatingFiltro(null)}>
                      <X size={12} />
                    </button>
                  </span>
                ) : null}

                {nivelFiltro.map((n) => (
                  <span key={n} className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs text-white">
                    {n}
                    <button onClick={() => toggleNivel(n)}>
                      <X size={12} />
                    </button>
                  </span>
                ))}

                {cartItems.length > 0 ? (
                  <button
                    onClick={() => setCartAbierto(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-[#ff7b47]/25 bg-[#ff7b47]/10 px-4 py-2 text-xs font-semibold text-[#ffb38c]"
                  >
                    <span>{cartItems.length} en carrito</span>
                    <ArrowRight size={13} />
                  </button>
                ) : null}
              </div>
              </div>

              {cursosFiltrados.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {cursosFiltrados.map((curso) => {
                  const enCarrito = isCourseInCart(curso.id)

                  return (
                    <CatalogCourseCard
                      key={curso.id}
                      curso={curso}
                      href={`/dashboard/cursos?course=${encodeURIComponent(curso.id)}`}
                      onCardClick={() => trackEntityClick("course", curso.id)}
                      footerRight={
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            if (curso.gratis) {
                              handleFreeAction(curso)
                              return
                            }
                            handleToggleCart(curso)
                          }}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-bold transition-all ${
                            enCarrito
                              ? "border-[#E8392A] bg-[#E8392A] text-white"
                              : curso.gratis
                                ? "border-[#22c55e] bg-transparent text-[#22c55e] hover:bg-[#22c55e] hover:text-black"
                                : "border-[rgba(232,57,42,0.55)] bg-[rgba(232,57,42,0.12)] text-[#ff8c7d] hover:bg-[#E8392A] hover:text-white"
                          }`}
                        >
                          {enCarrito ? (
                            <>
                              <Check size={12} /> Anadido
                            </>
                          ) : curso.gratis ? (
                            "Inscribirse"
                          ) : (
                            <>
                              <ShoppingCart size={12} /> Al carrito
                            </>
                          )}
                        </button>
                      }
                    />
                  )
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <Search size={48} className="mb-4 text-white/18" />
                  <h3 className="mb-2 text-2xl font-bold text-white">Lo sentimos, no encontramos resultados</h3>
                  <p className="mb-6 text-sm text-white/45">
                    Intenta ajustar los filtros o busca con otros terminos.
                  </p>
                  <button
                    onClick={() => {
                      setBusqueda("")
                      setCategoriaActiva("Todos")
                      setNivelFiltro([])
                      setRatingFiltro(null)
                      setPrecioFiltro("todos")
                    }}
                    className="rounded-full border border-[rgba(232,57,42,0.45)] bg-[rgba(232,57,42,0.12)] px-6 py-2 text-sm font-semibold text-[#ff8c7d] transition-all hover:bg-[#E8392A] hover:text-white"
                  >
                    Limpiar todos los filtros
                  </button>
                </div>
              )}
          </section>

          {drawerAbierto ? (
            <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setDrawerAbierto(false)} />
          ) : null}

          <div
            className={`fixed left-0 top-0 z-50 h-full w-80 overflow-y-auto border-r border-white/8 bg-[#0a0b10]/95 backdrop-blur-xl transition-transform duration-300 ${
              drawerAbierto ? "translate-x-0" : "-translate-x-full"
            }`}
          >
            <div className="flex items-center justify-between border-b border-white/8 p-4">
              <h2 className="text-lg font-bold text-white">Filtros</h2>
              <button onClick={() => setDrawerAbierto(false)} className="p-1 text-white/55 hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="px-4">
              <FiltroSeccion titulo="Precio">
                <div className="space-y-2.5">
                  {[
                    { val: "todos" as const, label: "Todos" },
                    { val: "gratis" as const, label: "Gratis" },
                    { val: "pago" as const, label: "De pago" },
                  ].map(({ val, label }) => (
                    <label key={val} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => setPrecioFiltro(val)}
                        className={`flex h-4 w-4 items-center justify-center border-2 transition-all ${
                          precioFiltro === val
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {precioFiltro === val ? <Check size={10} className="text-white" /> : null}
                      </div>
                      <span
                        className={`text-sm ${
                          precioFiltro === val ? "text-white" : "text-white/55 group-hover:text-white"
                        }`}
                      >
                        {label}
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>

              <FiltroSeccion titulo="Valoraciones">
                <div className="space-y-2.5">
                  {[4.5, 4.0, 3.5, 3.0].map((r) => (
                    <label key={r} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => setRatingFiltro(ratingFiltro === r ? null : r)}
                        className={`flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all ${
                          ratingFiltro === r
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {ratingFiltro === r ? <div className="h-1.5 w-1.5 rounded-full bg-white" /> : null}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={12}
                              className={s <= r ? "fill-[#fbbf24] text-[#fbbf24]" : "fill-white/15 text-white/15"}
                            />
                          ))}
                        </div>
                        <span
                          className={`text-sm ${
                            ratingFiltro === r ? "text-white" : "text-white/55 group-hover:text-white"
                          }`}
                        >
                          {r} o mas
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>

              <FiltroSeccion titulo="Nivel">
                <div className="space-y-2.5">
                  {["Todos los niveles", "Principiante", "Intermedio", "Experto"].map((nv) => (
                    <label key={nv} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => toggleNivel(nv)}
                        className={`flex h-4 w-4 items-center justify-center border-2 transition-all ${
                          nivelFiltro.includes(nv)
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {nivelFiltro.includes(nv) ? <Check size={10} className="text-white" /> : null}
                      </div>
                      <span
                        className={`text-sm ${
                          nivelFiltro.includes(nv) ? "text-white" : "text-white/55 group-hover:text-white"
                        }`}
                      >
                        {nv}
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>

              <FiltroSeccion titulo="Categoria">
                <div className="space-y-2.5">
                  {categorias.map((cat) => (
                    <label key={cat} className="group flex cursor-pointer items-center gap-3">
                      <div
                        onClick={() => setCategoriaActiva(cat)}
                        className={`flex h-4 w-4 items-center justify-center border-2 transition-all ${
                          categoriaActiva === cat
                            ? "border-[#E8392A] bg-[#E8392A]"
                            : "border-white/20 group-hover:border-white"
                        }`}
                      >
                        {categoriaActiva === cat ? <Check size={10} className="text-white" /> : null}
                      </div>
                      <span
                        className={`text-sm ${
                          categoriaActiva === cat ? "text-white" : "text-white/55 group-hover:text-white"
                        }`}
                      >
                        {cat}
                      </span>
                    </label>
                  ))}
                </div>
              </FiltroSeccion>
            </div>

            <div className="sticky bottom-0 flex gap-3 border-t border-white/8 bg-[#0a0b10]/95 p-4 backdrop-blur-xl">
              <button
                onClick={() => {
                  setNivelFiltro([])
                  setRatingFiltro(null)
                  setPrecioFiltro("todos")
                  setCategoriaActiva("Todos")
                }}
                className="flex-1 rounded-full border border-white/15 py-2.5 text-sm font-semibold text-white/65 transition-all hover:border-white hover:text-white"
              >
                Limpiar
              </button>
              <button
                onClick={() => setDrawerAbierto(false)}
                className="flex-1 rounded-full bg-gradient-to-r from-[#E8392A] to-[#ff6b4d] py-2.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(232,57,42,0.35)] transition-transform hover:scale-[1.02]"
              >
                Ver {cursosFiltrados.length} cursos
              </button>
            </div>
          </div>
        </div>

        <CartDrawer
          isOpen={cartAbierto}
          items={cartItems}
          subtotal={cartSubtotal}
          savings={cartSavings}
          isAuthenticated={isAuthenticated}
          onClose={() => setCartAbierto(false)}
          onRemove={(courseId) => removeCourseFromCart(courseId)}
          onClear={() => clearCart()}
        />

        <Footer />
      </div>
    </main>
  )
}
