"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import { ArrowLeft } from "lucide-react"
import { useRouter } from "next/navigation"
import AuthForm from "@/components/auth-form"
import AnimatedBackground from "@/components/animated-background"

export default function LoginPage() {
  const router = useRouter()

  return (
    <main className="relative min-h-[100dvh] h-[100dvh] overflow-hidden bg-background flex items-center justify-center px-4 sm:px-6 py-4 sm:py-6">
      <AnimatedBackground className="absolute inset-0" />
      <div className="absolute left-4 top-4 z-20 sm:left-6 sm:top-6">
        <button
          type="button"
          onClick={() => {
            if (window.history.length > 1) router.back()
            else router.push("/")
          }}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-card/75 px-4 py-2 text-sm font-semibold text-white/80 shadow-[0_10px_30px_rgba(0,0,0,0.18)] backdrop-blur-xl transition-all hover:border-primary/35 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver atras
        </button>
      </div>
      <div className="relative z-10 w-full flex justify-center h-full">
        <AuthForm initialTab="login" />
      </div>
    </main>
  )
}
