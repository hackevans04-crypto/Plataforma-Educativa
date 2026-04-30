"use client"

import { useCallback, useEffect, useState } from "react"
import {
  Trash2, Pencil, Plus, AlertCircle, Check, Search
} from "lucide-react"
import { cn } from "@/lib/utils"
import { renderSiteIconHtml } from "@/lib/site-icon-registry"
import { IconPickerModal } from "./icon-picker-modal"
import { CategoriaModal } from "./categoria-modal"

interface Subcategoria {
  id: string
  nombre: string
}

interface Categoria {
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

function parseSubsInput(input: string): Subcategoria[] {
  return input
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((nombre, index) => ({
      id: `sub_${Date.now()}_${index}_${nombre.toLowerCase().replace(/\s+/g, "-")}`,
      nombre,
    }))
}

function formatSubsInput(list?: Subcategoria[]) {
  return (list || []).map((sub) => sub.nombre).join(", ")
}

// Componente para renderizar iconos profesionales
function IconRenderer({ iconName, size = 24, color = "currentColor" }: { iconName: string; size?: number; color?: string }) {
  return (
    <span
      dangerouslySetInnerHTML={{ __html: renderSiteIconHtml(iconName as any, { size }) }}
      style={{ color, display: "inline-flex" }}
    />
  )
}

// Storage utilities
const CATEGORIAS_KEY = "he_categorias"
const CATEGORIAS_EVENT = "he-categorias-updated"

function getCategorias(): Categoria[] {
  if (typeof window === "undefined") return []
  try {
    const data = localStorage.getItem(CATEGORIAS_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function saveCategorias(list: Categoria[]) {
  localStorage.setItem(CATEGORIAS_KEY, JSON.stringify(list))
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(CATEGORIAS_EVENT))
  }
}

function uid() {
  return `cat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

export function AdminCategoriasUnificado() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [createForm, setCreateForm] = useState({
    nombre: "",
    descripcion: "",
    color: "#2196F3",
    icono: "graduation-cap",
    activa: true,
    subcategoriasInput: ""
  })
  const [editingCategoria, setEditingCategoria] = useState<Categoria | null>(null)
  const [editForm, setEditForm] = useState({
    nombre: "",
    descripcion: "",
    color: "#2196F3",
    icono: "graduation-cap",
    activa: true,
    subcategoriasInput: ""
  })
  const [loading, setLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [showIconPickerCreate, setShowIconPickerCreate] = useState(false)
  const [showIconPickerEdit, setShowIconPickerEdit] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [filterActive, setFilterActive] = useState<"todos" | "activas" | "inactivas">("todos")
  const itemsPerPage = 8

  useEffect(() => {
    setCategorias(getCategorias())
    const handleUpdate = () => setCategorias(getCategorias())
    window.addEventListener(CATEGORIAS_EVENT, handleUpdate)
    return () => window.removeEventListener(CATEGORIAS_EVENT, handleUpdate)
  }, [])

  const handleCreateSubmit = useCallback(() => {
    if (!createForm.nombre.trim()) {
      alert("El nombre de la categoría es requerido")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const list = getCategorias()
      const { subcategoriasInput, ...rest } = createForm
      list.push({
        id: uid(),
        ...rest,
        subcategorias: parseSubsInput(subcategoriasInput),
        orden: list.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      saveCategorias(list)
      setCategorias(list)

      setSuccessMessage("Categoría creada correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)

      setCreateForm({
        nombre: "",
        descripcion: "",
        color: "#2196F3",
        icono: "graduation-cap",
        activa: true,
        subcategoriasInput: ""
      })
      setLoading(false)
    }, 300)
  }, [createForm])

  const handleEditOpen = useCallback((cat: Categoria) => {
    setEditingCategoria(cat)
    setEditForm({
      nombre: cat.nombre,
      descripcion: cat.descripcion,
      color: cat.color,
      icono: cat.icono,
      activa: cat.activa,
      subcategoriasInput: formatSubsInput(cat.subcategorias)
    })
  }, [])

  const handleEditSave = useCallback(() => {
    if (!editForm.nombre.trim()) {
      alert("El nombre de la categoría es requerido")
      return
    }

    setLoading(true)
    setTimeout(() => {
      const list = getCategorias()
      const idx = list.findIndex(c => c.id === editingCategoria?.id)
      if (idx !== -1) {
        const { subcategoriasInput, ...rest } = editForm
        list[idx] = {
          ...list[idx],
          ...rest,
          subcategorias: parseSubsInput(subcategoriasInput),
          updatedAt: new Date().toISOString()
        }
      }
      saveCategorias(list)
      setCategorias(list)
      setSuccessMessage("Categoría actualizada correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
      setEditingCategoria(null)
      setLoading(false)
    }, 300)
  }, [editForm, editingCategoria])

  const handleDelete = useCallback((id: string) => {
    if (confirm("¿Estás seguro de que deseas eliminar esta categoría?")) {
      const list = getCategorias().filter(c => c.id !== id)
      saveCategorias(list)
      setCategorias(list)
      setSuccessMessage("Categoría eliminada correctamente")
      setTimeout(() => setSuccessMessage(null), 3000)
    }
  }, [])

  // Función para filtrar categorías
  function getFilteredCategories(): Categoria[] {
    return categorias.filter(cat => {
      const matchesSearch =
        cat.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.descripcion.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.icono.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        filterActive === "todos" ||
        (filterActive === "activas" && cat.activa) ||
        (filterActive === "inactivas" && !cat.activa)

      return matchesSearch && matchesFilter
    })
  }

  // Función para obtener categorías paginadas
  function getFilteredAndPaginatedCategories(): Categoria[] {
    const filtered = getFilteredCategories()
    const start = (currentPage - 1) * itemsPerPage
    return filtered.slice(start, start + itemsPerPage)
  }

  // Función para obtener el total de páginas
  function getTotalPages(): number {
    return Math.ceil(getFilteredCategories().length / itemsPerPage)
  }

  return (
    <div className="space-y-8">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-green-500/10 text-green-600 border border-green-500/20 flex items-center gap-3 animate-in slide-in-from-top">
          <Check className="w-5 h-5 flex-shrink-0" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="font-display text-3xl md:text-4xl text-foreground mb-1">
          Categorías
        </h1>
        <p className="text-muted-foreground">
          Crea y gestiona todas las categorías de cursos en un solo lugar
        </p>
      </div>

      {/* Formulario de creación */}
      <div className="p-6 rounded-2xl bg-card border border-border">
        <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
          <Plus className="w-5 h-5 text-primary" />
          Nueva Categoría
        </h2>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Nombre
            </label>
            <input
              type="text"
              value={createForm.nombre}
              onChange={(e) => setCreateForm({ ...createForm, nombre: e.target.value })}
              placeholder="Ej: Programación"
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Descripción */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Descripción
            </label>
            <input
              type="text"
              value={createForm.descripcion}
              onChange={(e) => setCreateForm({ ...createForm, descripcion: e.target.value })}
              placeholder="Breve descripción"
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Color */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Color
            </label>
            <div className="flex gap-2">
              <input
                type="color"
                value={createForm.color}
                onChange={(e) => setCreateForm({ ...createForm, color: e.target.value })}
                className="w-12 h-10 rounded-lg border-2 border-border cursor-pointer"
              />
              <input
                type="text"
                value={createForm.color.toUpperCase()}
                onChange={(e) => {
                  const val = e.target.value
                  if (/^#[0-9A-F]{6}$/i.test(val)) {
                    setCreateForm({ ...createForm, color: val })
                  }
                }}
                placeholder="#2196F3"
                className="flex-1 px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm font-mono"
              />
            </div>
          </div>

          {/* Icono - Selector Modal */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Ícono
            </label>
            <button
              type="button"
              onClick={() => setShowIconPickerCreate(true)}
              className="w-full p-3 rounded-lg bg-background border-2 border-border text-foreground flex items-center gap-2 hover:border-primary/50 transition-all"
            >
              <div className="w-5 h-5 flex items-center justify-center">
                <IconRenderer iconName={createForm.icono} size={20} color="currentColor" />
              </div>
              <span className="text-sm flex-1 text-left">{createForm.icono}</span>
              <span className="text-muted-foreground text-sm">▼</span>
            </button>
          </div>

          {/* Modal de selección de icono para creación */}
          <IconPickerModal
            isOpen={showIconPickerCreate}
            value={createForm.icono}
            onChange={(icon) => setCreateForm({ ...createForm, icono: icon })}
            onClose={() => setShowIconPickerCreate(false)}
          />

          {/* Activa */}
          <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
            <input
              type="checkbox"
              id="activa-create"
              checked={createForm.activa}
              onChange={(e) => setCreateForm({ ...createForm, activa: e.target.checked })}
              className="w-4 h-4 rounded cursor-pointer accent-primary"
            />
            <label htmlFor="activa-create" className="text-sm font-semibold text-foreground cursor-pointer">
              Activa
            </label>
          </div>

          {/* Subcategorias */}
          <div className="md:col-span-2 lg:col-span-3">
            <label className="block text-sm font-semibold text-foreground mb-2">
              Subcategorías
              <span className="ml-2 font-normal text-muted-foreground">
                (separadas por coma o nueva línea)
              </span>
            </label>
            <textarea
              value={createForm.subcategoriasInput}
              onChange={(e) => setCreateForm({ ...createForm, subcategoriasInput: e.target.value })}
              placeholder="Ej: Algebra, Geometría, Cálculo, Trigonometría"
              rows={2}
              className="w-full px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
            />
          </div>

          {/* Botón crear */}
          <div className="flex items-end md:col-span-2 lg:col-span-3">
            <button
              onClick={handleCreateSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white font-semibold rounded-lg hover:shadow-lg hover:shadow-primary/30 disabled:opacity-50 transition-all"
            >
              <Plus className="w-4 h-4" />
              Crear Categoría
            </button>
          </div>
        </div>
      </div>

      {/* Lista de categorías mejorada */}
      <div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <h2 className="text-xl font-bold text-foreground">
            Categorías ({categorias.length})
          </h2>
          
          {/* Filtros */}
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            {/* Búsqueda */}
            <div className="relative flex-1 sm:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar categoría..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setCurrentPage(1)
                }}
                className="w-full pl-10 pr-4 py-2 rounded-lg bg-background border-2 border-border text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
              />
            </div>

            {/* Filtro de estado */}
            <select
              value={filterActive}
              onChange={(e) => {
                setFilterActive(e.target.value as any)
                setCurrentPage(1)
              }}
              className="px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-sm"
            >
              <option value="todos">Todas</option>
              <option value="activas">Activas</option>
              <option value="inactivas">Inactivas</option>
            </select>
          </div>
        </div>

        {categorias.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-card border-2 border-dashed border-border">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground font-semibold">No hay categorías creadas</p>
            <p className="text-sm text-muted-foreground">Crea la primera categoría usando el formulario de arriba</p>
          </div>
        ) : (
          <>
            {/* Tabla de categorías */}
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-background border-b border-border">
                    <tr>
                      <th className="text-left px-6 py-4 font-bold text-sm text-foreground">Categoría</th>
                      <th className="text-left px-6 py-4 font-bold text-sm text-foreground">Descripción</th>
                      <th className="text-left px-6 py-4 font-bold text-sm text-foreground">Subcategorías</th>
                      <th className="text-center px-6 py-4 font-bold text-sm text-foreground">Estado</th>
                      <th className="text-right px-6 py-4 font-bold text-sm text-foreground">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {getFilteredAndPaginatedCategories().map((cat) => (
                      <tr
                        key={cat.id}
                        className="hover:bg-background/50 transition-colors"
                      >
                        {/* Nombre e ícono */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                              style={{
                                backgroundColor: cat.color + "20",
                                border: `2px solid ${cat.color}`
                              }}
                            >
                              <div className="w-5 h-5 flex items-center justify-center" style={{ color: cat.color }}>
                                <IconRenderer iconName={cat.icono} size={20} color={cat.color} />
                              </div>
                            </div>
                            <div>
                              <p className="font-bold text-foreground">{cat.nombre}</p>
                              <p className="text-xs text-muted-foreground">{cat.icono}</p>
                            </div>
                          </div>
                        </td>

                        {/* Descripción */}
                        <td className="px-6 py-4">
                          <p className="text-sm text-foreground line-clamp-2">{cat.descripcion || "-"}</p>
                        </td>

                        {/* Subcategorías */}
                        <td className="px-6 py-4">
                          {cat.subcategorias && cat.subcategorias.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {cat.subcategorias.slice(0, 4).map((sub) => (
                                <span
                                  key={sub.id}
                                  className="inline-flex items-center rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                                >
                                  {sub.nombre}
                                </span>
                              ))}
                              {cat.subcategorias.length > 4 ? (
                                <span className="inline-flex items-center rounded-full border border-border bg-secondary/20 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                                  +{cat.subcategorias.length - 4}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">Sin subcategorías</span>
                          )}
                        </td>

                        {/* Estado */}
                        <td className="px-6 py-4 text-center">
                          {cat.activa ? (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs font-semibold">
                              <Check className="w-3 h-3" /> Activa
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-muted text-muted-foreground text-xs font-semibold">
                              Inactiva
                            </span>
                          )}
                        </td>

                        {/* Acciones */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleEditOpen(cat)}
                              className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-all"
                              title="Editar"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat.id)}
                              className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
                              title="Eliminar"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Paginación */}
            {getTotalPages() > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Mostrando {(currentPage - 1) * itemsPerPage + 1} a {Math.min(currentPage * itemsPerPage, getFilteredCategories().length)} de {getFilteredCategories().length} categorías
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                  >
                    ← Anterior
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: getTotalPages() }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "w-10 h-10 rounded-lg font-semibold text-sm transition-all",
                          currentPage === page
                            ? "bg-primary text-white"
                            : "bg-background border-2 border-border text-foreground hover:border-primary/50"
                        )}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(getTotalPages(), p + 1))}
                    disabled={currentPage === getTotalPages()}
                    className="px-4 py-2 rounded-lg bg-background border-2 border-border text-foreground hover:border-primary/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-semibold"
                  >
                    Siguiente →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal de edición */}
      <CategoriaModal
        isOpen={editingCategoria !== null}
        categoria={editingCategoria}
        formData={editForm}
        onFormChange={setEditForm}
        onSave={handleEditSave}
        onCancel={() => setEditingCategoria(null)}
        loading={loading}
      />

      {/* Modal de selección de icono para edición */}
      <IconPickerModal
        isOpen={showIconPickerEdit}
        value={editForm.icono}
        onChange={(icon) => setEditForm({ ...editForm, icono: icon })}
        onClose={() => setShowIconPickerEdit(false)}
      />
    </div>
  )
}
