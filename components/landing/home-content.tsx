"use client"

import { useRouter } from "next/navigation"
import Navbar from "@/components/navbar"
import BenefitsSection from "@/components/landing/benefits-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import ContactSection from "@/components/landing/contact-section"
import FeatureCardsSection from "@/components/landing/feature-cards-section"
import HeroSection from "@/components/landing/hero-section"
import Footer from "@/components/footer"
import { useAuth } from "@/contexts/auth-context"
import AnimatedBackground from "@/components/animated-background"
import LandingPopupHost from "@/components/landing/landing-popup-host"
import { useCMS } from "@/hooks/use-cms"
import { useLandingActions } from "@/hooks/use-landing-actions"

const HOME_FEATURE_CARDS_DATA = {
  eyebrow: "METODO HACK EVANS",
  titulo: "Un sistema de preparacion mas claro, medible y profesional",
  descripcion:
    "La portada ahora presenta mejor el valor principal de Hack Evans: prepararte con orden, foco y seguimiento real, sin mezclar pantallas de otros modulos.",
  columns: 3,
  items: [
    {
      id: "hf-1",
      icon: "target",
      title: "Diagnostica tu punto de partida",
      description:
        "Empieza con simuladores y practicas que muestran tu nivel actual para que sepas exactamente donde enfocar tu energia.",
      accentColor: "#E8392A",
    },
    {
      id: "hf-2",
      icon: "file-text",
      title: "Practica con criterio",
      description:
        "No se trata solo de responder preguntas: estudias con contexto, seguimiento y señales claras para mejorar por competencia.",
      accentColor: "#38bdf8",
    },
    {
      id: "hf-3",
      icon: "bar-chart",
      title: "Convierte esfuerzo en progreso",
      description:
        "Visualiza avances, fortalezas y puntos de mejora en una experiencia más intuitiva, sobria y enfocada en resultado real.",
      accentColor: "#34d399",
    },
  ],
}

export function HomeContent() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { config } = useCMS()
  const { activePopup, closePopup, executeAction, pendingPopupSubmitAction } = useLandingActions(config)

  const openLogin = () => router.push("/login")
  const openRegister = () => router.push("/registro")

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-transparent">
      <AnimatedBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar
          onLoginClick={openLogin}
          onRegisterClick={openRegister}
          hideAuthenticatedUserMenu
        />

        <HeroSection
          onGetStarted={() => executeAction(config.hero.primaryAction, "/registro")}
          onWatchDemo={() =>
            executeAction(
              config.hero.secondaryAction,
              isAuthenticated ? "/dashboard/simuladores" : "/simulador"
            )
          }
        />

        <FeatureCardsSection data={HOME_FEATURE_CARDS_DATA} />
        <BenefitsSection />
        <TestimonialsSection />
        <ContactSection />

        <Footer />
      </div>

      <LandingPopupHost
        popup={activePopup}
        onClose={closePopup}
        onAction={executeAction}
        fallbackSubmitAction={pendingPopupSubmitAction}
      />
    </main>
  )
}
