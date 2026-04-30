"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import UdemyHeader from "@/components/dashboard/udemy-header"
import { useAuth } from "@/contexts/auth-context"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { isAuthenticated, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || isAuthenticated) return

    const query = searchParams.toString()
    const returnTo = `${pathname}${query ? `?${query}` : ""}`
    router.replace(`/login?returnTo=${encodeURIComponent(returnTo)}`)
  }, [isAuthenticated, isLoading, pathname, router, searchParams])

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          Verificando acceso al dashboard...
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <UdemyHeader />
      <main className="mx-auto w-full max-w-[1500px] px-4 py-8 lg:px-6 lg:py-10">{children}</main>
    </div>
  )
}
