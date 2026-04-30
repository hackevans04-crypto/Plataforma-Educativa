"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import AuthForm from "@/components/auth-form"
import AnimatedBackground from "@/components/animated-background"

export default function RegistroPage() {
  return (
    <main className="relative min-h-[100dvh] h-[100dvh] overflow-hidden bg-background flex items-center justify-center px-4 sm:px-6 py-4 sm:py-6">
      <AnimatedBackground className="absolute inset-0" />
      <div className="relative z-10 w-full flex justify-center h-full">
        <AuthForm initialTab="register" />
      </div>
    </main>
  )
}
