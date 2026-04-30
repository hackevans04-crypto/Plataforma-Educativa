"use client"

import { cn } from "@/lib/utils"

interface CategoriasTabsProps {
  categorias: Array<{ id: string; label: string; count: number }>
  activeCategory: string
  onCategoryChange: (value: string) => void
}

export default function CategoriasTabs({
  categorias,
  activeCategory,
  onCategoryChange,
}: CategoriasTabsProps) {
  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex min-w-max items-center gap-2">
        {categorias.map((categoria) => {
          const active = categoria.id === activeCategory

          return (
            <button
              key={categoria.id}
              type="button"
              onClick={() => onCategoryChange(categoria.id)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition-all",
                active
                  ? "border-primary/40 bg-primary/12 text-white"
                  : "border-white/10 bg-white/[0.035] text-white/68 hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
              )}
            >
              <span>{categoria.label}</span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[11px] font-semibold",
                  active ? "bg-primary text-white" : "bg-white/8 text-white/55"
                )}
              >
                {categoria.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
