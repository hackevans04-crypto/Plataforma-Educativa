"use client"

import { ReactNode, useEffect, useState } from "react"
import { AuthProvider } from "@/contexts/auth-context"
import ThemeGuard from "@/components/theme-guard"

export default function ClientProviders({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <AuthProvider>
      {mounted ? <ThemeGuard /> : null}
      {children}
    </AuthProvider>
  )
}
