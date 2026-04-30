"use client"

import { Filter, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface CategoryFilterProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (category: string) => void
  courseCount: Record<string, number>
}

export function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  courseCount,
}: CategoryFilterProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold text-foreground">Filtrar por categoría</span>
        {selectedCategory && (
          <span className="ml-auto text-xs text-muted-foreground">
            {courseCount[selectedCategory] || 0} {(courseCount[selectedCategory] || 0) === 1 ? "curso" : "cursos"}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {/* "Todos" button */}
        <button
          onClick={() => onSelectCategory("")}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
            !selectedCategory
              ? "bg-primary text-primary-foreground"
              : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
          )}
        >
          Todos
          <span className="text-[11px] opacity-75">({courseCount["Todos"] || 0})</span>
        </button>

        {/* Category buttons */}
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all",
              selectedCategory === category
                ? "bg-primary text-primary-foreground"
                : "bg-secondary/50 text-muted-foreground hover:bg-secondary"
            )}
          >
            {category}
            <span className="text-[11px] opacity-75">({courseCount[category] || 0})</span>
            {selectedCategory === category && (
              <X className="h-3 w-3" />
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
