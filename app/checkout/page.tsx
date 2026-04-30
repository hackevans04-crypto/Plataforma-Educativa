"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function CheckoutPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window === "undefined") return
    const storedUser = window.localStorage.getItem("hackevans_user")
    if (storedUser) {
      router.replace("/dashboard/checkout")
      return
    }
    setIsLoading(false)
    router.replace("/login?returnTo=%2Fdashboard%2Fcheckout")
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        Redirigiendo a tu checkout seguro...
      </div>
    </div>
  )
}
