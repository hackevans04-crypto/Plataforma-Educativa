"use client"

import type { ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const EMPTY_OPTION_VALUE = "__he-empty-option__"

export interface SystemSelectOption {
  value: string
  label: ReactNode
  disabled?: boolean
}

interface SystemSelectProps {
  value: string
  onValueChange: (value: string) => void
  options: SystemSelectOption[]
  placeholder?: string
  disabled?: boolean
  size?: "sm" | "default"
  triggerClassName?: string
  contentClassName?: string
}

function normalizeValue(value: string) {
  return value === "" ? EMPTY_OPTION_VALUE : value
}

function denormalizeValue(value: string) {
  return value === EMPTY_OPTION_VALUE ? "" : value
}

export function SystemSelect({
  value,
  onValueChange,
  options,
  placeholder = "Selecciona una opcion",
  disabled = false,
  size = "default",
  triggerClassName,
  contentClassName,
}: SystemSelectProps) {
  return (
    <Select
      value={normalizeValue(value)}
      onValueChange={(nextValue) => onValueChange(denormalizeValue(nextValue))}
      disabled={disabled}
    >
      <SelectTrigger size={size} className={cn("w-full", triggerClassName)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className={contentClassName}>
        {options.map((option) => (
          <SelectItem
            key={`${option.value || "__empty__"}-${String(option.label)}`}
            value={normalizeValue(option.value)}
            disabled={option.disabled}
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
