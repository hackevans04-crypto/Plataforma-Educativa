"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import AnimatedBackground from "@/components/animated-background"
import CmsPageRenderer from "@/components/landing/cms-page-renderer"
import { useAuth } from "@/contexts/auth-context"
import { useCMS } from "@/hooks/use-cms"

export default function DynamicCMSPage({ params }: { params: { slug: string } }) {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { config, isLoading } = useCMS()
  const slug = params.slug
  const page = config.pages?.find((item) => item.slug === slug)

  const openLogin = () => router.push("/login")
  const openRegister = () => router.push("/registro")
  const handleDemo = () => {
    if (isAuthenticated) {
      router.push("/dashboard/simuladores")
      return
    }
    openLogin()
  }

  if (isLoading) {
    return (
      <main className="relative min-h-screen flex flex-col bg-transparent overflow-x-hidden">
        <AnimatedBackground className="fixed inset-0 z-0" />
        <div className="relative z-10 flex min-h-screen items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-b-2 border-primary" />
        </div>
      </main>
    )
  }

  if (!page) {
    return (
      <main className="relative min-h-screen flex flex-col bg-transparent overflow-x-hidden">
        <AnimatedBackground className="fixed inset-0 z-0" />
        <div className="relative z-10 flex-1">
          <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />
          <section className="px-6 py-24 lg:px-12">
            <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card/80 p-10 text-center backdrop-blur-xl">
              <div className="text-xs font-bold uppercase tracking-[0.3em] text-primary">CMS</div>
              <h1 className="mt-3 text-3xl font-bold text-foreground">Pagina no encontrada</h1>
              <p className="mt-3 text-sm text-muted-foreground">
                La ruta `/{slug}` no existe en el editor visual o aun no fue creada.
              </p>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="mt-6 inline-flex items-center justify-center rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
              >
                Volver al inicio
              </button>
            </div>
          </section>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="relative min-h-screen bg-transparent overflow-x-hidden">
      <AnimatedBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar onLoginClick={openLogin} onRegisterClick={openRegister} />
        <CmsPageRenderer
          slug={slug}
          onGetStarted={openRegister}
          onWatchDemo={handleDemo}
          isAuthenticated={isAuthenticated}
        />
        <Footer />
      </div>
    </main>
  )
}
