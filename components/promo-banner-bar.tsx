"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { X } from "lucide-react"
import {
  PROMO_EVENT,
  dismissBanner,
  getActiveBannerForScope,
  type PromoBanner,
} from "@/lib/promo-banner"

export default function PromoBannerBar({ scope }: { scope: "landing" | "dashboard" }) {
  const [banner, setBanner] = useState<PromoBanner | null>(null)

  useEffect(() => {
    const sync = () => setBanner(getActiveBannerForScope(scope))
    sync()
    if (typeof window === "undefined") return
    window.addEventListener(PROMO_EVENT, sync)
    window.addEventListener("storage", sync)
    return () => {
      window.removeEventListener(PROMO_EVENT, sync)
      window.removeEventListener("storage", sync)
    }
  }, [scope])

  if (!banner) return null

  return (
    <div
      className="flex w-full items-center justify-center gap-3 px-4 py-3 text-sm"
      style={{ background: banner.background, color: banner.textColor }}
    >
      <span className="text-center font-medium">
        {banner.message}
        {banner.ctaHref && banner.ctaLabel ? (
          <Link
            href={banner.ctaHref}
            className="ml-2 font-black underline underline-offset-4"
            style={{ color: banner.textColor }}
          >
            {banner.ctaLabel}
          </Link>
        ) : null}
      </span>
      <button
        onClick={() => dismissBanner(banner.id)}
        aria-label="Cerrar"
        className="rounded-full p-1 transition-opacity hover:opacity-70"
        style={{ color: banner.textColor }}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}
