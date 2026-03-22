"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import Navbar from "@/components/navbar"
import HeroSection from "@/components/landing/hero-section"
import BenefitsSection from "@/components/landing/benefits-section"
import TestimonialsSection from "@/components/landing/testimonials-section"
import Pricing from "@/components/pricing"
import ContactSection from "@/components/landing/contact-section"
import Footer from "@/components/footer"
import CTASection from "@/components/landing/cta-section"
import ImageTextSection from "@/components/landing/image-text-section"
import VideoSection from "@/components/landing/video-section"
import FAQSection from "@/components/landing/faq-section"
import TextBannerSection from "@/components/landing/text-banner-section"
import GallerySection from "@/components/landing/gallery-section"
import StatsSection from "@/components/landing/stats-section"
import CustomCodeSection from "@/components/landing/custom-code-section"
import PageHeroSection from "@/components/landing/page-hero-section"
import FeatureCardsSection from "@/components/landing/feature-cards-section"
import { useAuth } from "@/contexts/auth-context"
import AnimatedBackground from "@/components/animated-background"
import { useCMS, type CMSSection } from "@/hooks/use-cms"
import DynamicFeedSection from "@/components/landing/dynamic-feed-section"
import FormBuilderSection from "@/components/landing/form-builder-section"
import LandingPopupHost from "@/components/landing/landing-popup-host"
import {
  getSectionVisibilityClass,
  resolveLandingBuilderItems,
  shouldHideSectionWhenEmpty,
  shouldRenderSectionForAudience,
  useLandingBuilderData,
} from "@/hooks/use-landing-builder-data"
import { getLandingSectionDomId, useLandingActions } from "@/hooks/use-landing-actions"

// ─── Section style wrapper ────────────────────────────────────────────────────

const BG_CLASSES: Record<string, string> = {
  transparent: "",
  dark:        "bg-card/30",
  darkDeep:    "bg-card",
  accent:      "bg-primary/5 border-y border-primary/10",
}

const PAD_CLASSES: Record<string, string> = {
  none: "[&>section]:!py-0",
  sm:   "[&>section]:!py-8",
  md:   "[&>section]:!py-16",
  lg:   "[&>section]:!py-28",
}

function SectionWrapper({
  section,
  className,
  children,
}: {
  section: CMSSection
  className?: string
  children: React.ReactNode
}) {
  const bg  = BG_CLASSES[section.style?.bg ?? "transparent"] ?? (section.style?.bg ? "" : "")
  const pad = section.style?.padding ? PAD_CLASSES[section.style.padding] ?? "" : ""
  const customBg = section.style?.bg && !BG_CLASSES[section.style.bg]
    ? { backgroundColor: section.style.bg }
    : undefined
  return (
    <div className={cn(bg, pad, className)} style={customBg}>
      {children}
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()
  const { isAuthenticated } = useAuth()
  const { config } = useCMS()
  const datasets = useLandingBuilderData()
  const { activePopup, closePopup, executeAction, pendingPopupSubmitAction, scrollToSection } = useLandingActions(config)

  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const handleNavigate = (section: string) => {
    const navbarOffset = 82
    const scrollToElement = (element: HTMLElement) => {
      const rect = element.getBoundingClientRect()
      const y = window.pageYOffset + rect.top - navbarOffset
      window.scrollTo({ top: Math.max(0, y), behavior: "smooth" })
    }

    const ref = sectionRefs.current[section]
    if (ref) { scrollToElement(ref); return }
    const target = document.getElementById(section)
    if (target) { scrollToElement(target); return }
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const openLogin    = () => router.push("/login")
  const openRegister = () => router.push("/registro")
  const handleDemo   = () => {
    if (isAuthenticated) { router.push("/dashboard/simuladores"); return }
    openLogin()
  }

  const runSectionAction = (action?: Record<string, any>, fallbackHref?: string) => {
    executeAction(action, fallbackHref)
  }

  const renderSection = (section: CMSSection) => {
    if (!section.visible || !shouldRenderSectionForAudience(section, isAuthenticated)) return null

    const visibilityClass = getSectionVisibilityClass(section)
    const wrap = (content: React.ReactNode) => (
      <SectionWrapper key={section.id} section={section} className={visibilityClass}>
        <div id={getLandingSectionDomId(section.id)}>{content}</div>
      </SectionWrapper>
    )

    if (section.type === "simulatorsFeed" || section.type === "coursesFeed" || section.type === "evaluationsFeed") {
      const items = resolveLandingBuilderItems(section, datasets)
      if (!items.length && shouldHideSectionWhenEmpty(section)) return null
      return wrap(
        <DynamicFeedSection
          section={section}
          items={items}
          onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)}
        />
      )
    }

    switch (section.type) {
      case "hero":
        return wrap(
          <div ref={el => { sectionRefs.current["hero"] = el }} id="hero">
            <HeroSection
              onGetStarted={() => runSectionAction(config.hero.primaryAction, "/registro")}
              onWatchDemo={() => runSectionAction(config.hero.secondaryAction, isAuthenticated ? "/dashboard/simuladores" : "/simulador")}
            />
          </div>
        )
      case "benefits":
        return wrap(
          <div ref={el => { sectionRefs.current["beneficios"] = el }} id="beneficios">
            <BenefitsSection />
          </div>
        )
      case "testimonials":
        return wrap(
          <div ref={el => { sectionRefs.current["testimonios"] = el }} id="testimonios">
            <TestimonialsSection />
          </div>
        )
      case "pricing":
        return wrap(
          <div ref={el => { sectionRefs.current["precios"] = el }} id="precios">
            <Pricing />
          </div>
        )
      case "contact":
        return wrap(
          <div ref={el => { sectionRefs.current["contacto"] = el }} id="contacto">
            <ContactSection />
          </div>
        )
      case "cta":        return wrap(<CTASection       data={section.data} onPrimaryAction={() => runSectionAction(section.data?.primaryAction, section.data?.ctaPrimarioHref)} onSecondaryAction={() => runSectionAction(section.data?.secondaryAction, section.data?.ctaSecundarioHref)} />)
      case "imageText":  return wrap(<ImageTextSection  data={section.data} onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)} />)
      case "video":      return wrap(<VideoSection      data={section.data} />)
      case "faq":        return wrap(<FAQSection        data={section.data} />)
      case "textBanner": return wrap(<TextBannerSection data={section.data} onCtaAction={() => runSectionAction(section.data?.ctaAction, section.data?.ctaHref)} />)
      case "gallery":    return wrap(<GallerySection    data={section.data} />)
      case "stats":      return wrap(<StatsSection      data={section.data} />)
      case "customCode":   return wrap(<CustomCodeSection data={section.data} />)
      case "formBuilder":  return wrap(<FormBuilderSection data={section.data} onSubmitAction={() => runSectionAction(section.data?.submitAction)} />)
      case "pageHero":     return wrap(<PageHeroSection data={section.data} onGetStarted={() => runSectionAction(section.data?.primaryAction, section.data?.ctaHref || "/registro")} onWatchDemo={() => runSectionAction(section.data?.secondaryAction, section.data?.ctaSecHref || "/simulador")} />)
      case "featureCards": return wrap(<FeatureCardsSection data={section.data} />)
      default:             return null
    }
  }

  return (
    <main className="relative min-h-screen bg-transparent overflow-x-hidden">
      <AnimatedBackground className="fixed inset-0 z-0" />
      <div className="relative z-10">
        <Navbar
          onLoginClick={openLogin}
          onRegisterClick={openRegister}
          onNavigate={(section) => {
            if (scrollToSection(section)) return
            handleNavigate(section)
          }}
        />
        {config.sections.map(renderSection)}
        <Footer />
      </div>
      <LandingPopupHost popup={activePopup} onClose={closePopup} onAction={executeAction} fallbackSubmitAction={pendingPopupSubmitAction} />
    </main>
  )
}
