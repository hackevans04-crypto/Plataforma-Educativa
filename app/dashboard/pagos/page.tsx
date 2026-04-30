"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function PagosRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace("/dashboard/perfil?tab=pagos")
  }, [router])
  return null
}
