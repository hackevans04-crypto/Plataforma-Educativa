"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import AnimatedBackground from "@/components/animated-background"
import CmsPageRenderer from "@/components/landing/cms-page-renderer"

export default function SimuladorPage() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()

  const openLogin    = () => router.push("/login")
  const openRegister = () => router.push("/registro")
  const handleDemo   = () => {
    if (isAuthenticated) { router.push("/dashboard/simuladores"); return }
    openLogin()
  }

  return (
    <main className="relative min-h-screen bg-transparent overflow-x-hidden">
      <AnimatedBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />
        <CmsPageRenderer slug="simulador" onGetStarted={openRegister} onWatchDemo={handleDemo} />
        <Footer />
      </div>
    </main>
  )
}
