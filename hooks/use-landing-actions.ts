"use client"

import { useCallback, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import type { CMSActionConfig, CMSConfig } from "@/hooks/use-cms"

const POPUP_SUBMISSIONS_KEY = "he_landing_popup_submissions"
const FORM_SUBMISSIONS_KEY = "he_landing_form_submissions"

function isExternalHref(href: string) {
  return /^(https?:)?\/\//i.test(href) || href.startsWith("mailto:") || href.startsWith("tel:")
}

function hasSavedLandingLead() {
  if (typeof window === "undefined") return false

  return [POPUP_SUBMISSIONS_KEY, FORM_SUBMISSIONS_KEY].some((storageKey) => {
    try {
      const raw = window.localStorage.getItem(storageKey)
      const entries = raw ? JSON.parse(raw) : []
      return Array.isArray(entries) && entries.length > 0
    } catch {
      return false
    }
  })
}

function getSimulatorSubmitAction(action: CMSActionConfig): CMSActionConfig {
  return action.postSubmitAction?.type && action.postSubmitAction.type !== "none"
    ? action.postSubmitAction
    : {
        type: "simulator",
        href: action.href,
        openInNewTab: action.openInNewTab,
      }
}

export function getLandingSectionDomId(sectionId: string) {
  return `section-${sectionId}`
}

export function useLandingActions(config: CMSConfig) {
  const router = useRouter()
  const [activePopupId, setActivePopupId] = useState<string | null>(null)
  const [pendingPopupSubmitAction, setPendingPopupSubmitAction] = useState<CMSActionConfig | undefined>(undefined)

  const activePopup = useMemo(
    () => config.popups.find((popup) => popup.id === activePopupId) ?? null,
    [activePopupId, config.popups]
  )

  const closePopup = useCallback(() => {
    setActivePopupId(null)
    setPendingPopupSubmitAction(undefined)
  }, [])

  const scrollToSection = useCallback((sectionId?: string) => {
    if (!sectionId || typeof document === "undefined") return false
    const candidates = [sectionId, getLandingSectionDomId(sectionId)]
    const navbarOffset = 82 // extra offset for sticky navbar height + margin

    for (const candidate of candidates) {
      const target = document.getElementById(candidate)
      if (target) {
        const rect = target.getBoundingClientRect()
        const targetY = window.pageYOffset + rect.top - navbarOffset
        window.scrollTo({ top: Math.max(0, targetY), behavior: "smooth" })
        return true
      }
    }
    window.scrollTo({ top: 0, behavior: "smooth" })
    return false
  }, [])

  const navigateToHref = useCallback((href?: string, openInNewTab?: boolean) => {
    if (!href || typeof window === "undefined") return

    if (href.startsWith("#")) {
      scrollToSection(href.slice(1))
      return
    }

    if (isExternalHref(href)) {
      if (openInNewTab) {
        window.open(href, "_blank", "noopener,noreferrer")
      } else {
        window.location.href = href
      }
      return
    }

    if (openInNewTab) {
      window.open(href, "_blank", "noopener,noreferrer")
      return
    }

    router.push(href)
  }, [router, scrollToSection])

  const executeAction = useCallback((action?: CMSActionConfig, fallbackHref?: string) => {
    const nextAction = action?.type && action.type !== "none"
      ? action
      : fallbackHref
        ? { type: "page" as const, href: fallbackHref }
        : undefined

    if (!nextAction) return

    switch (nextAction.type) {
      case "section":
        if (scrollToSection(nextAction.sectionId)) {
          closePopup()
          return
        }
        if (nextAction.href) navigateToHref(nextAction.href, nextAction.openInNewTab)
        return
      case "popup":
        if (nextAction.popupId) {
          setPendingPopupSubmitAction(undefined)
          setActivePopupId(nextAction.popupId)
          return
        }
        if (nextAction.href) navigateToHref(nextAction.href, nextAction.openInNewTab)
        return
      case "external":
      case "page":
        closePopup()
        navigateToHref(nextAction.href, nextAction.openInNewTab)
        return
      case "simulator":
        if (nextAction.skipIfRegistered && hasSavedLandingLead()) {
          const submitAction = getSimulatorSubmitAction(nextAction)
          if (submitAction.type === "section") {
            closePopup()
            scrollToSection(submitAction.sectionId)
            return
          }
          closePopup()
          navigateToHref(submitAction.href, submitAction.openInNewTab)
          return
        }
        if (nextAction.popupId) {
          setPendingPopupSubmitAction(getSimulatorSubmitAction(nextAction))
          setActivePopupId(nextAction.popupId)
          return
        }
        if (nextAction.formMode === "section" && nextAction.sectionId) {
          closePopup()
          scrollToSection(nextAction.sectionId)
          return
        }
        if (nextAction.formMode === "page" && nextAction.formPageHref) {
          closePopup()
          navigateToHref(nextAction.formPageHref, nextAction.openInNewTab)
          return
        }
        closePopup()
        navigateToHref(nextAction.href, nextAction.openInNewTab)
        return
      case "none":
      default:
        if (nextAction.href) navigateToHref(nextAction.href, nextAction.openInNewTab)
    }
  }, [closePopup, navigateToHref, scrollToSection])

  return {
    activePopup,
    activePopupId,
    closePopup,
    executeAction,
    openPopup: setActivePopupId,
    pendingPopupSubmitAction,
    scrollToSection,
  }
}
