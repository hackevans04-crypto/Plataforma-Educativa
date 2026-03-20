export function withAlpha(color: string | undefined, alpha: number): string | undefined {
  if (!color) return undefined

  const raw = color.trim()
  const hex = raw.replace("#", "")

  if (![3, 4, 6, 8].includes(hex.length)) {
    return raw
  }

  const normalized =
    hex.length === 3 || hex.length === 4
      ? hex
          .slice(0, 3)
          .split("")
          .map((char) => char + char)
          .join("")
      : hex.slice(0, 6)

  const r = parseInt(normalized.slice(0, 2), 16)
  const g = parseInt(normalized.slice(2, 4), 16)
  const b = parseInt(normalized.slice(4, 6), 16)

  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
