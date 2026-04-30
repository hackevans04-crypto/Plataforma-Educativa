"use client"

export interface Subcategoria {
  id: string
  nombre: string
}

export interface Categoria {
  id: string
  nombre: string
  descripcion: string
  color: string
  icono: string
  orden: number
  activa: boolean
  subcategorias?: Subcategoria[]
  createdAt: string
  updatedAt: string
}

export const CATEGORIAS_KEY = "he_categorias"
export const CATEGORIAS_EVENT = "he-categorias-updated"

function parseSafe<T>(value: string | null, fallback: T): T {
  try {
    return value ? JSON.parse(value) ?? fallback : fallback
  } catch {
    return fallback
  }
}

export function getCategorias(): Categoria[] {
  if (typeof window === "undefined") return []
  return parseSafe<Categoria[]>(window.localStorage.getItem(CATEGORIAS_KEY), [])
}

export function saveCategorias(list: Categoria[]) {
  if (typeof window === "undefined") return
  window.localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(list))
  window.dispatchEvent(new CustomEvent(CATEGORIAS_EVENT))
}

export function parseSubcategoriasInput(input: string): Subcategoria[] {
  return input
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((nombre, index) => ({ id: `sub_${index}_${nombre.toLowerCase().replace(/\s+/g, "-")}`, nombre }))
}

export function formatSubcategoriasInput(list?: Subcategoria[]): string {
  return (list || []).map((sub) => sub.nombre).join(", ")
}
