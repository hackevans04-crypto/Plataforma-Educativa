"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"

export default function CheckoutPage() {
  const router = useRouter()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) return
    if (isAuthenticated) {
      router.replace("/dashboard/checkout")
      return
    }
    router.replace("/login?returnTo=%2Fdashboard%2Fcheckout")
  }, [isAuthenticated, isLoading, router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
        Redirigiendo a tu checkout seguro...
      </div>
    </div>
  )
}
