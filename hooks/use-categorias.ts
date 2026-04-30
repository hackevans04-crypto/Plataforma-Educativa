import { useEffect, useState } from "react"

interface Categoria {
  id: string
  nombre: string
  descripcion: string
  color: string
  icono: string
  orden: number
  activa: boolean
  createdAt: string
  updatedAt: string
}

const CATEGORIAS_KEY = "he_categorias"
const CATEGORIAS_EVENT = "he-categorias-updated"

export function useCategorias() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCategorias = () => {
      try {
        const data = localStorage.getItem(CATEGORIAS_KEY)
        setCategorias(data ? JSON.parse(data) : [])
      } catch {
        setCategorias([])
      }
      setLoading(false)
    }

    loadCategorias()

    const handleUpdate = () => {
      loadCategorias()
    }

    window.addEventListener(CATEGORIAS_EVENT, handleUpdate)
    return () => window.removeEventListener(CATEGORIAS_EVENT, handleUpdate)
  }, [])

  const categoriasActivas = categorias.filter(c => c.activa)

  return {
    categorias,
    categoriasActivas,
    loading
  }
}
