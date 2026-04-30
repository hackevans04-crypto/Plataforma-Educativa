"use client"

import Link from "next/link"
import { ArrowLeft, ArrowRight } from "lucide-react"
import { useMemo } from "react"
import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import Footer from "@/components/footer"
import BrandBackdrop from "@/components/brand-backdrop"
import CmsPageRenderer from "@/components/landing/cms-page-renderer"
import { useCMS } from "@/hooks/use-cms"
import { useAuth } from "@/contexts/auth-context"

export default function PublicCmsRoutePage({ slug }: { slug: string }) {
  const router = useRouter()
  const { config, isLoading } = useCMS("published")
  const { isAuthenticated } = useAuth()

  const page = useMemo(
    () => (config.pages ?? []).find((entry) => entry.slug === slug),
    [config.pages, slug]
  )

  if (isLoading) {
    return (
      <main className="relative min-h-screen overflow-x-hidden">
        <BrandBackdrop />
        <div className="relative z-10">
          <Navbar
            onLoginClick={() => router.push("/login")}
            onRegisterClick={() => router.push("/registro")}
            hideAuthenticatedUserMenu
          />
          <div className="landing-container relative px-6 py-24 lg:px-12">
            <div className="landing-panel-soft rounded-[34px] px-8 py-16 text-center">
              <div className="mx-auto h-10 w-10 animate-spin rounded-full border-2 border-white/10 border-t-primary" />
              <p className="mt-5 text-sm text-white/55">Cargando pagina publicada...</p>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    )
  }

  if (!page) {
    return (
      <main className="relative min-h-screen overflow-x-hidden">
        <BrandBackdrop />
        <div className="relative z-10">
          <Navbar
            onLoginClick={() => router.push("/login")}
            onRegisterClick={() => router.push("/registro")}
            hideAuthenticatedUserMenu
          />
          <div className="landing-container relative px-6 py-24 lg:px-12">
            <div className="landing-panel-soft rounded-[34px] px-8 py-16 text-center">
              <div className="text-[11px] font-bold uppercase tracking-[0.32em] text-primary/80">Pagina no encontrada</div>
              <h1 className="mt-5 text-4xl font-black text-white lg:text-5xl">No encontramos esta pagina publicada</h1>
              <p className="mx-auto mt-4 max-w-2xl text-base leading-8 text-white/58">
                Si la acabas de crear desde Studio, asegurate de guardarla y publicarla. Luego vuelve a intentarlo.
              </p>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => router.push("/")}
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/12 bg-white/[0.05] px-5 py-3 text-sm font-semibold text-white transition-all hover:border-primary/35 hover:bg-white/[0.08]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Volver al inicio
                </button>
                <Link
                  href={`/studio?page=${encodeURIComponent(slug)}`}
                  className="inline-flex items-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-all hover:bg-primary/90"
                >
                  Abrir en Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
          <Footer />
        </div>
      </main>
    )
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden">
      <BrandBackdrop />
      <div className="relative z-10">
        <Navbar
          onLoginClick={() => router.push("/login")}
          onRegisterClick={() => router.push("/registro")}
          hideAuthenticatedUserMenu
        />
        <CmsPageRenderer slug={slug} isAuthenticated={isAuthenticated} />
        <Footer />
      </div>
    </main>
  )
}
