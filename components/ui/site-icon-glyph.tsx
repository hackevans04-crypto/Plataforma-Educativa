"use client"

import type { SiteIconName } from "@/lib/site-icon-registry"
import { renderSiteIconSvg, resolveSiteIconName } from "@/lib/site-icon-registry"

interface SiteIconGlyphProps {
  name?: string | null
  fallback?: SiteIconName
  size?: number
  className?: string
  color?: string
  strokeWidth?: number
}

export function SiteIconGlyph({
  name,
  fallback = "sparkles",
  size = 18,
  className,
  color,
  strokeWidth,
}: SiteIconGlyphProps) {
  const resolved = resolveSiteIconName(name, fallback)

  return (
    <span
      className={className}
      aria-hidden="true"
      dangerouslySetInnerHTML={{
        __html: renderSiteIconSvg(resolved, { size, color, strokeWidth }),
      }}
    />
  )
}
