"use client"

import React from "react"
import { EDITOR_RUNTIME_VERSION, type EditorElementInfo } from "@/components/admin/html-editor-bridge"
import type { CMSActionConfig, CMSCustomCodeActionBinding } from "@/hooks/use-cms"
import { TYPOGRAPHY_GOOGLE_FONTS_HREF } from "@/lib/typography-fonts"

const EDITOR_BASE_CSS = `
html, body {
  margin: 0;
  padding: 0;
  min-height: 100% !important;
  height: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow-x: hidden !important;
  overflow-y: visible !important;
}

body {
  background: transparent;
}

html[data-he-iframe-scroll-mode="internal"] {
  scrollbar-width: none !important;
}

html[data-he-iframe-scroll-mode="internal"]::-webkit-scrollbar,
html[data-he-iframe-scroll-mode="internal"] body::-webkit-scrollbar {
  width: 0 !important;
  height: 0 !important;
  display: none !important;
}

[data-he-import-root="1"] {
  position: relative;
  min-height: 100% !important;
  height: auto !important;
  width: 100% !important;
  max-width: 100% !important;
  overflow: visible !important;
}

[data-he-visual-bounds-comp="1"] {
  box-sizing: border-box !important;
  padding-top: calc(var(--he-editor-base-pad-top, 0px) + var(--he-editor-bleed-top, 0px)) !important;
  padding-bottom: calc(var(--he-editor-base-pad-bottom, 0px) + var(--he-editor-bleed-bottom, 0px)) !important;
}

[data-he-node-type="icon"] {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  line-height: 0;
}

[data-he-node-type="icon"] svg {
  display: block;
  width: 100%;
  height: 100%;
  stroke: currentColor !important;
  fill: none !important;
}

[data-he-icon-root="1"] svg,
[data-he-icon-root="1"] path,
[data-he-icon-root="1"] g,
[data-he-icon-root="1"] rect,
[data-he-icon-root="1"] circle,
[data-he-icon-root="1"] line,
[data-he-icon-root="1"] polyline,
[data-he-icon-root="1"] polygon,
[data-he-icon-root="1"] ellipse,
[data-he-icon-root="1"] use {
  pointer-events: none !important;
}

[data-he-node-type="icon"] svg,
[data-he-node-type="icon"] path,
[data-he-node-type="icon"] g,
[data-he-node-type="icon"] rect,
[data-he-node-type="icon"] circle,
[data-he-node-type="icon"] line,
[data-he-node-type="icon"] polyline,
[data-he-node-type="icon"] polygon,
[data-he-node-type="icon"] ellipse,
[data-he-node-type="icon"] use,
[data-he-icon-root="1"] svg,
[data-he-icon-root="1"] path,
[data-he-icon-root="1"] g,
[data-he-icon-root="1"] rect,
[data-he-icon-root="1"] circle,
[data-he-icon-root="1"] line,
[data-he-icon-root="1"] polyline,
[data-he-icon-root="1"] polygon,
[data-he-icon-root="1"] ellipse,
[data-he-icon-root="1"] use {
  fill: none !important;
  stroke: currentColor !important;
  vector-effect: non-scaling-stroke;
  stroke-linecap: round !important;
  stroke-linejoin: round !important;
  shape-rendering: geometricPrecision;
}

*[contenteditable="true"] {
  outline: none;
}
`

interface CustomCodeSectionProps {
  data: Record<string, unknown>
  viewportMode?: "desktop" | "tablet" | "mobile"
  /** When true, injects the editor runtime so elements become selectable */
  editMode?: boolean
  /** Called with the element info when user clicks inside the iframe */
  onElementSelect?: (info: EditorElementInfo | null) => void
  /** Called when inline editing starts or ends */
  onEditingChange?: (editing: boolean) => void
  /** Called whenever the iframe emits a fresh HTML snapshot */
  onEditorSnapshot?: (html: string) => void
  /** Lets the Studio select the whole block before enabling internal editing */
  onActivate?: () => void
  /** Expose the iframe ref so parent can send postMessage commands */
  iframeRef?: React.RefObject<HTMLIFrameElement>
  /** Execute CMS actions bound to buttons/links inside the imported HTML */
  onAction?: (action?: CMSActionConfig, fallbackHref?: string) => void
  /** Notify parent when touch/move interactions should lock outer scrolling */
  onInteractionLockChange?: (locked: boolean) => void
  /** Called when the iframe toolbar "Editar" is tapped on a non-text element */
  onOpenInspector?: () => void
}

type SelectionRectLike = { top: number; bottom: number }

function getSelectionVisibilityAdjustment(
  rect: SelectionRectLike | null | undefined,
  viewportHeight: number,
  topSafe: number,
  bottomSafe: number,
) {
  if (!rect) return 0
  const top = Number(rect.top)
  const bottom = Number(rect.bottom)
  if (!Number.isFinite(top) || !Number.isFinite(bottom)) return 0

  const safeTop = Number.isFinite(topSafe) ? topSafe : 0
  const safeBottom = Number.isFinite(bottomSafe) ? bottomSafe : viewportHeight
  const height = Math.max(0, bottom - top)
  const safeHeight = Math.max(0, safeBottom - safeTop)
  const tallThreshold = Math.max(180, safeHeight + 56)
  const isTallSelection = height >= tallThreshold

  if (isTallSelection) {
    if (top < safeTop) {
      return top - safeTop
    }
    if (top > safeBottom - 32) {
      return top - Math.min(safeTop + 24, Math.max(safeTop, safeBottom - 56))
    }
    return 0
  }

  if (top < safeTop) {
    return top - safeTop
  }
  if (bottom > safeBottom) {
    return bottom - safeBottom
  }
  return 0
}

function buildFrameDocument(html: string, revision?: string | number) {
  const runtimeComment = revision == null ? "" : `\n<!--he-editor-runtime:${revision}-->`
  const isFullDoc = /<html[\s>]/i.test(html)
  return isFullDoc
    ? `${html}${runtimeComment}`
    : [
        "<!DOCTYPE html><html>",
        "<head>",
        "<meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<style>*,*::before,*::after{box-sizing:border-box} html,body{margin:0;padding:0;width:100%;}</style>",
        "</head>",
        "<body>",
        html,
        runtimeComment,
        "</body></html>",
      ].join("\n")
}

function ensureTypographyFonts(doc: Document) {
  if (!doc.head) return
  let preconnectGoogle = doc.head.querySelector<HTMLLinkElement>("link[data-he-fonts-preconnect='google']")
  if (!preconnectGoogle) {
    preconnectGoogle = doc.createElement("link")
    preconnectGoogle.rel = "preconnect"
    preconnectGoogle.href = "https://fonts.googleapis.com"
    preconnectGoogle.setAttribute("data-he-fonts-preconnect", "google")
    doc.head.appendChild(preconnectGoogle)
  }

  let preconnectStatic = doc.head.querySelector<HTMLLinkElement>("link[data-he-fonts-preconnect='gstatic']")
  if (!preconnectStatic) {
    preconnectStatic = doc.createElement("link")
    preconnectStatic.rel = "preconnect"
    preconnectStatic.href = "https://fonts.gstatic.com"
    preconnectStatic.crossOrigin = "anonymous"
    preconnectStatic.setAttribute("data-he-fonts-preconnect", "gstatic")
    doc.head.appendChild(preconnectStatic)
  }

  let fontStylesheet = doc.head.querySelector<HTMLLinkElement>("link[data-he-fonts-stylesheet='typography']")
  if (!fontStylesheet) {
    fontStylesheet = doc.createElement("link")
    fontStylesheet.rel = "stylesheet"
    fontStylesheet.href = TYPOGRAPHY_GOOGLE_FONTS_HREF
    fontStylesheet.setAttribute("data-he-fonts-stylesheet", "typography")
    doc.head.appendChild(fontStylesheet)
  }
}

function getIframeDocumentHeight(doc: Document) {
  const importRoot = doc.querySelector<HTMLElement>("[data-he-import-root='1']")
  const contentRoot = importRoot ?? doc.body
  const importRootRect = Math.ceil(contentRoot?.getBoundingClientRect().height || 0)
  const importRootScrollHeight = contentRoot?.scrollHeight || 0
  const bodyRect = Math.ceil(doc.body?.getBoundingClientRect().height || 0)
  const bodyScrollHeight = doc.body?.scrollHeight || 0
  const docRect = Math.ceil(doc.documentElement?.getBoundingClientRect().height || 0)
  const docScrollHeight = doc.documentElement?.scrollHeight || 0
  const scrollTop =
    doc.scrollingElement?.scrollTop ||
    doc.documentElement?.scrollTop ||
    doc.body?.scrollTop ||
    0
  const currentTopBleed = Number.parseFloat(contentRoot?.dataset.heEditorBleedTop || "0") || 0
  const rootDocTop =
    (contentRoot?.getBoundingClientRect().top ?? doc.body?.getBoundingClientRect().top ?? 0) + scrollTop
  let minTop = rootDocTop + currentTopBleed
  let maxBottom = 0
  const viewportHeight = doc.documentElement?.clientHeight || 0
  try {
    const scope = contentRoot ?? doc.body
    const nodes = scope?.querySelectorAll?.("*") ?? []
    const limit = Math.min(nodes.length, 4000)
    for (let i = 0; i < limit; i += 1) {
      const node = nodes[i]
      if (!isHTMLElementLike(node)) continue
      if (node.closest?.("[data-he-runtime],[data-he-editor-overlay]")) continue
      const style = doc.defaultView?.getComputedStyle(node)
      const position = style?.position || ""
      if (position === "fixed") continue
      const rect = node.getBoundingClientRect()
      if (!Number.isFinite(rect.top) || !Number.isFinite(rect.bottom)) continue
      minTop = Math.min(minTop, rect.top + scrollTop)
      maxBottom = Math.max(maxBottom, rect.bottom + scrollTop)
    }
  } catch {
    // ignore measurement errors
  }

  const originalMinTop = minTop - currentTopBleed
  const originalMaxBottom = Math.max(0, maxBottom - currentTopBleed)
  const measuredContentHeight = Math.max(0, Math.ceil(originalMaxBottom - originalMinTop))
  // Element-measured content height (actual content, not inflated by min-height:100vh)
  const elementContent = Math.max(
    importRootRect,
    importRootScrollHeight,
    measuredContentHeight,
    240
  )
  if (contentRoot) {
    return elementContent + 20
  }
  // Document/body dimensions (may be inflated by min-height/height:100vh constraints)
  const documentDims = Math.max(
    bodyRect, bodyScrollHeight, docRect, docScrollHeight,
    doc.body?.offsetHeight || 0, doc.documentElement?.offsetHeight || 0, 240
  )
  // If element positions show content is much shorter than the document dimensions,
  // the body likely has a min-height:100vh inflation — use element positions instead.
  const baseMax = (elementContent > 200 && elementContent < documentDims * 0.88)
    ? elementContent
    : documentDims
  const cap = Math.max(baseMax, bodyScrollHeight, importRootScrollHeight, docScrollHeight) + Math.max(viewportHeight, 320)
  return Math.min(baseMax + 20, cap)
}

function isElementNode(value: unknown): value is Element {
  return !!value && typeof value === "object" && (value as { nodeType?: number }).nodeType === 1
}

function isHTMLElementLike(value: unknown): value is HTMLElement {
  return (
    isElementNode(value) &&
    typeof (value as { scrollTop?: unknown }).scrollTop === "number" &&
    typeof (value as { clientHeight?: unknown }).clientHeight === "number"
  )
}

function hasViewportHeightHint(value: string | null | undefined) {
  return /(?:^|[^\w-])(?:-?\d*\.?\d+\s*(?:d|s|l)?vh|(?:d|s|l)?vb)(?:[^\w-]|$)/i.test(String(value || ""))
}

export default function CustomCodeSection({
  data,
  viewportMode,
  editMode = false,
  onElementSelect,
  onEditingChange,
  onEditorSnapshot,
  onActivate,
  iframeRef: externalRef,
  onAction,
  onInteractionLockChange,
  onOpenInspector,
}: CustomCodeSectionProps) {
  const html = (data.html as string) ?? ""
  const actionBindings = React.useMemo(
    () => (((data.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? []).filter((binding) => binding?.eid)),
    [data.actionBindings]
  )
  const internalRef = React.useRef<HTMLIFrameElement>(null)
  const iframeRef   = externalRef ?? internalRef
  const [height, setHeight] = React.useState(480)
  const [mobileEditFrameHeight, setMobileEditFrameHeight] = React.useState<number | null>(null)
  const [interactionLocked, setInteractionLocked] = React.useState(false)
  const [iframeSrcDoc, setIframeSrcDoc] = React.useState(() => buildFrameDocument(html))
  const lastLiveSnapshotRef = React.useRef("")
  const lastAppliedHtmlRef = React.useRef(html)
  const interactionLockedRef = React.useRef(false)
  const activeInteractionKindRef = React.useRef<"move" | "resize" | "group" | null>(null)
  const lastInteractionReleaseRef = React.useRef<{ kind: "move" | "resize" | "group" | null; at: number }>({
    kind: null,
    at: 0,
  })
  const touchScrollRafRef = React.useRef<number | null>(null)
  const touchScrollPendingRef = React.useRef({ x: 0, y: 0 })
  const mobileEditViewportAlignedRef = React.useRef(false)
  const useMobileEditViewportFit = editMode && viewportMode === "mobile"
  const useInternalMobileEditScroll = useMobileEditViewportFit
  const useSingleMobileEditorScroll = false
  const isIframeDocumentReady = React.useCallback((doc: Document | null | undefined): doc is Document => {
    if (!doc) return false
    return !!(doc.documentElement && doc.head && doc.body)
  }, [])
  const forceRuntimeReload = React.useCallback(() => {
    setIframeSrcDoc(buildFrameDocument(lastAppliedHtmlRef.current || html, `${EDITOR_RUNTIME_VERSION}-${Date.now()}`))
  }, [html])
  const syncHeightFromDocument = React.useCallback((doc: Document | null | undefined) => {
    if (!isIframeDocumentReady(doc)) return
    const nextHeight = getIframeDocumentHeight(doc)
    if (nextHeight > 0) {
      // Only update when the change is >= 4px to break ResizeObserver oscillation loops
      // that cause "Maximum update depth exceeded" and footer bounce.
      setHeight(prev => {
        const next = Math.max(160, nextHeight)
        return Math.abs(next - prev) >= 4 ? next : prev
      })
    }
  }, [isIframeDocumentReady])
  const syncImportedVisualBounds = React.useCallback((doc: Document | null | undefined) => {
    if (!isIframeDocumentReady(doc)) return
    const root = doc.querySelector<HTMLElement>("[data-he-import-root='1']") ?? doc.body
    if (!root) return

    if (!editMode) {
      root.removeAttribute("data-he-visual-bounds-comp")
      root.style.removeProperty("--he-editor-base-pad-top")
      root.style.removeProperty("--he-editor-base-pad-bottom")
      root.style.removeProperty("--he-editor-bleed-top")
      root.style.removeProperty("--he-editor-bleed-bottom")
      delete root.dataset.heEditorBleedTop
      delete root.dataset.heEditorBleedBottom
      return
    }

    const computedStyle = doc.defaultView?.getComputedStyle(root)
    if (!computedStyle) return

    const scrollTop =
      doc.scrollingElement?.scrollTop ||
      doc.documentElement?.scrollTop ||
      doc.body?.scrollTop ||
      0
    const currentTopBleed = Number.parseFloat(root.dataset.heEditorBleedTop || "0") || 0
    const currentBottomBleed = Number.parseFloat(root.dataset.heEditorBleedBottom || "0") || 0
    const basePaddingTop = Math.max(0, (Number.parseFloat(computedStyle.paddingTop || "0") || 0) - currentTopBleed)
    const basePaddingBottom = Math.max(0, (Number.parseFloat(computedStyle.paddingBottom || "0") || 0) - currentBottomBleed)
    const rootRect = root.getBoundingClientRect()
    const bodyRect = doc.body.getBoundingClientRect()
    const rootDocTop = (Number.isFinite(rootRect.top) ? rootRect.top : 0) + scrollTop

    let minTop = rootDocTop + currentTopBleed
    let maxBottom = Number.isFinite(rootRect.bottom) ? rootRect.bottom + scrollTop : 0
    const scope = root.querySelectorAll("*")
    const limit = Math.min(scope.length, 4000)
    for (let index = 0; index < limit; index += 1) {
      const node = scope[index]
      if (!isHTMLElementLike(node)) continue
      if (node.closest?.("[data-he-runtime],[data-he-editor-overlay]")) continue
      const nodeStyle = doc.defaultView?.getComputedStyle(node)
      if (!nodeStyle || nodeStyle.display === "none" || nodeStyle.visibility === "hidden") continue
      if (nodeStyle.position === "fixed") continue
      const rect = node.getBoundingClientRect()
      if (!Number.isFinite(rect.top) || !Number.isFinite(rect.bottom) || rect.height <= 0) continue
      minTop = Math.min(minTop, rect.top + scrollTop)
      maxBottom = Math.max(maxBottom, rect.bottom + scrollTop)
    }

    const originalMinTop = minTop - currentTopBleed
    const originalMaxBottom = Math.max(0, maxBottom - currentTopBleed)
    const topBleed = Math.min(240, Math.max(0, Math.ceil(rootDocTop - originalMinTop) + 8))
    const baseBottom = Math.max(
      Number.isFinite(rootRect.bottom) ? rootRect.bottom + scrollTop : 0,
      Number.isFinite(bodyRect.bottom) ? bodyRect.bottom + scrollTop : 0
    )
    const originalBaseBottom = Math.max(0, baseBottom - currentTopBleed - currentBottomBleed)
    const bottomBleed = Math.min(280, Math.max(0, Math.ceil(originalMaxBottom - originalBaseBottom) + 16))

    root.dataset.heEditorBleedTop = String(topBleed)
    root.dataset.heEditorBleedBottom = String(bottomBleed)
    if (topBleed > 0 || bottomBleed > 0) {
      root.setAttribute("data-he-visual-bounds-comp", "1")
    } else {
      root.removeAttribute("data-he-visual-bounds-comp")
    }
    root.style.setProperty("--he-editor-base-pad-top", `${basePaddingTop}px`)
    root.style.setProperty("--he-editor-base-pad-bottom", `${basePaddingBottom}px`)
    root.style.setProperty("--he-editor-bleed-top", `${topBleed}px`)
    root.style.setProperty("--he-editor-bleed-bottom", `${bottomBleed}px`)
  }, [editMode, isIframeDocumentReady])
  const ensureSelectionVisible = React.useCallback((rect: { top: number; bottom: number } | null | undefined) => {
    if (!rect) return
    const iframe = iframeRef.current
    const frameDoc = iframe?.contentDocument
    if (useInternalMobileEditScroll && iframe && frameDoc) {
      const frameScrollRoot =
        frameDoc.scrollingElement ||
        frameDoc.documentElement ||
        frameDoc.body
      if (isHTMLElementLike(frameScrollRoot)) {
        const frameViewportHeight = iframe.clientHeight || iframe.getBoundingClientRect().height || mobileEditFrameHeight || 0
        const topSafe = Math.max(118, Math.round(frameViewportHeight * 0.3))
        const bottomSafeInset = Math.max(96, Math.round(frameViewportHeight * 0.22))
        const bottomSafe = Math.max(topSafe + 24, frameViewportHeight - bottomSafeInset)
        const delta = getSelectionVisibilityAdjustment(rect, frameViewportHeight, topSafe, bottomSafe)
        if (Math.abs(delta) > 0.5) {
          frameScrollRoot.scrollTop += delta
          return
        }
      }
    }
    const ownerDoc = iframe?.ownerDocument
    const scrollRoot = ownerDoc?.querySelector?.("[data-he-studio-scroll-root='1']") as HTMLElement | null
    const ownerWindow = ownerDoc?.defaultView
    if (!iframe || !scrollRoot || !ownerWindow) return
    const isCompactViewport =
      ownerWindow.matchMedia?.("(max-width: 820px)").matches ||
      ownerWindow.matchMedia?.("(pointer: coarse)").matches ||
      false
    if (!isCompactViewport) return

    const iframeRect = iframe.getBoundingClientRect()
    const rootRect = scrollRoot.getBoundingClientRect()
    const topSafe = rootRect.top + 16
    const bottomSafeInset = useMobileEditViewportFit
      ? Math.max(208, Math.round(rootRect.height * 0.34))
      : Math.max(180, Math.round(rootRect.height * 0.28))
    const bottomSafe = rootRect.bottom - bottomSafeInset
    const targetTop = iframeRect.top + rect.top
    const targetBottom = iframeRect.top + rect.bottom
    const delta = getSelectionVisibilityAdjustment(
      { top: targetTop, bottom: targetBottom },
      rootRect.height,
      topSafe,
      bottomSafe,
    )
    if (Math.abs(delta) > 0.5) {
      scrollRoot.scrollTop += delta
    }
  }, [iframeRef, mobileEditFrameHeight, useInternalMobileEditScroll, useMobileEditViewportFit])
  const scrollStudioCanvasBy = React.useCallback((deltaX: number, deltaY: number) => {
    const scrollElement = (element: Element | null | undefined, dx: number, dy: number) => {
      if (!isHTMLElementLike(element)) return { moved: false, consumedX: 0, consumedY: 0 }
      const canScroll =
        element.scrollHeight > element.clientHeight + 2 ||
        element.scrollWidth > element.clientWidth + 2
      if (!canScroll) return { moved: false, consumedX: 0, consumedY: 0 }
      const startLeft = element.scrollLeft
      const startTop = element.scrollTop
      element.scrollLeft += dx
      element.scrollTop += dy
      return {
        moved: element.scrollLeft !== startLeft || element.scrollTop !== startTop,
        consumedX: element.scrollLeft - startLeft,
        consumedY: element.scrollTop - startTop,
      }
    }

    const scrollDocument = (doc: Document | null | undefined, dx: number, dy: number) => {
      if (!doc) return { moved: false, consumedX: 0, consumedY: 0 }
      const candidates = [
        doc.body,
        doc.scrollingElement,
        doc.documentElement,
      ]
      for (const candidate of candidates) {
        const result = scrollElement(candidate, dx, dy)
        if (result.moved) return result
      }
      return { moved: false, consumedX: 0, consumedY: 0 }
    }

    const getStudioScrollRoot = (doc: Document | null | undefined) =>
      (doc?.querySelector?.("[data-he-studio-scroll-root='1']") as HTMLElement | null) ?? null

    const iframe = iframeRef.current
    const ownerDoc = iframe?.ownerDocument
    const ownerScrollRoot = getStudioScrollRoot(ownerDoc)
    if (ownerScrollRoot && scrollElement(ownerScrollRoot, deltaX, deltaY).moved) {
      return
    }
    if (ownerDoc && scrollDocument(ownerDoc, deltaX, deltaY).moved) return
    if (scrollDocument(document, deltaX, deltaY).moved) return

    if (iframe) {
      let current = iframe.parentElement
      let depth = 0
      while (current && depth < 8) {
        if (current !== ownerScrollRoot && scrollElement(current, deltaX, deltaY).moved) return
        current = current.parentElement
        depth += 1
      }
    }
    if (!iframe) return

    try {
      const parentDoc = window.parent?.document
      const parentScrollRoot = getStudioScrollRoot(parentDoc)
      if (parentScrollRoot && scrollElement(parentScrollRoot, deltaX, deltaY).moved) return
      if (scrollDocument(parentDoc, deltaX, deltaY).moved) return
    } catch {
      // fall back to the local preview only
    }
  }, [iframeRef])
  const getIframeScrollMetrics = React.useCallback((element: Element | null | undefined) => {
    const doc = iframeRef.current?.contentDocument
    if (!doc || !isHTMLElementLike(element)) return null
    const importRoot = doc.querySelector<HTMLElement>("[data-he-import-root='1']") ?? doc.body
    const rootBleedTop = Number.parseFloat(importRoot?.dataset.heEditorBleedTop || "0") || 0
    const rootBleedBottom = Number.parseFloat(importRoot?.dataset.heEditorBleedBottom || "0") || 0
    const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
    const rawMaxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
    const isRootScrollNode =
      element === doc.scrollingElement ||
      element === doc.documentElement ||
      element === doc.body
    const maxScrollTop = isRootScrollNode
      ? Math.max(0, rawMaxScrollTop - rootBleedTop - rootBleedBottom)
      : rawMaxScrollTop
    return {
      maxScrollLeft,
      maxScrollTop,
      isRootScrollNode,
    }
  }, [iframeRef])
  const getPrimaryIframeScrollState = React.useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return null

    const candidates = [
      doc.scrollingElement,
      doc.documentElement,
      doc.body,
      doc.querySelector("[data-he-import-root='1']"),
    ]

    for (const candidate of candidates) {
      if (!isHTMLElementLike(candidate)) continue
      const metrics = getIframeScrollMetrics(candidate)
      if (!metrics) continue
      const maxScrollX = metrics.maxScrollLeft
      const maxScrollY = metrics.maxScrollTop
      if (maxScrollX > 2 || maxScrollY > 2) {
        return {
          element: candidate,
          scrollLeft: candidate.scrollLeft,
          scrollTop: Math.min(candidate.scrollTop, maxScrollY),
          maxScrollLeft: maxScrollX,
          maxScrollTop: maxScrollY,
        }
      }
    }

    return null
  }, [getIframeScrollMetrics, iframeRef])
  const scrollIframeCanvasBy = React.useCallback((deltaX: number, deltaY: number) => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc) return { moved: false, consumedX: 0, consumedY: 0 }

    const scrollElement = (element: Element | null | undefined, dx: number, dy: number) => {
      if (!isHTMLElementLike(element)) return { moved: false, consumedX: 0, consumedY: 0 }
      const startLeft = element.scrollLeft
      const startTop = element.scrollTop
      const metrics = getIframeScrollMetrics(element)
      if (!metrics) return { moved: false, consumedX: 0, consumedY: 0 }
      const canScroll =
        metrics.maxScrollTop > 2 ||
        metrics.maxScrollLeft > 2
      if (!canScroll) return { moved: false, consumedX: 0, consumedY: 0 }
      const nextLeft = metrics.maxScrollLeft > 0
        ? Math.min(metrics.maxScrollLeft, Math.max(0, startLeft + dx))
        : startLeft
      const nextTop = metrics.maxScrollTop > 0
        ? Math.min(metrics.maxScrollTop, Math.max(0, startTop + dy))
        : startTop
      element.scrollLeft = nextLeft
      element.scrollTop = nextTop
      return {
        moved: element.scrollLeft !== startLeft || element.scrollTop !== startTop,
        consumedX: element.scrollLeft - startLeft,
        consumedY: element.scrollTop - startTop,
      }
    }

    const candidates = [
      doc.scrollingElement,
      doc.documentElement,
      doc.body,
      doc.querySelector("[data-he-import-root='1']"),
    ]

    for (const candidate of candidates) {
      const result = scrollElement(candidate, deltaX, deltaY)
      if (result.moved) return result
    }
    return { moved: false, consumedX: 0, consumedY: 0 }
  }, [getIframeScrollMetrics, iframeRef])
  const scrollEditingCanvasBy = React.useCallback((deltaX: number, deltaY: number) => {
    if (useInternalMobileEditScroll) {
      const handoffThreshold = 64
      const frameState = getPrimaryIframeScrollState()
      let studioDx = 0
      let studioDy = 0
      let frameDx = deltaX
      let frameDy = deltaY

      if (frameState) {
        if (deltaY > 0) {
          const remainingBottom = Math.max(0, frameState.maxScrollTop - frameState.scrollTop)
          if (remainingBottom <= handoffThreshold) {
            const earlyHandoff = Math.min(deltaY, Math.max(0, handoffThreshold - remainingBottom))
            frameDy -= earlyHandoff
            studioDy += earlyHandoff
          }
        } else if (deltaY < 0) {
          const remainingTop = Math.max(0, frameState.scrollTop)
          if (remainingTop <= handoffThreshold) {
            const earlyHandoff = Math.min(-deltaY, Math.max(0, handoffThreshold - remainingTop))
            frameDy += earlyHandoff
            studioDy -= earlyHandoff
          }
        }
      }

      const frameResult = scrollIframeCanvasBy(frameDx, frameDy)
      const leftoverX = deltaX - frameResult.consumedX - studioDx
      const leftoverY = deltaY - frameResult.consumedY - studioDy
      if (Math.abs(studioDx) > 0.5 || Math.abs(studioDy) > 0.5) {
        scrollStudioCanvasBy(studioDx, studioDy)
      }
      if (Math.abs(leftoverX) > 0.5 || Math.abs(leftoverY) > 0.5) {
        scrollStudioCanvasBy(leftoverX, leftoverY)
        return true
      }
      return frameResult.moved || Math.abs(studioDx) > 0.5 || Math.abs(studioDy) > 0.5
    }
    if (!useSingleMobileEditorScroll && scrollIframeCanvasBy(deltaX, deltaY).moved) {
      return true
    }
    scrollStudioCanvasBy(deltaX, deltaY)
    return true
  }, [getPrimaryIframeScrollState, scrollIframeCanvasBy, scrollStudioCanvasBy, useInternalMobileEditScroll, useSingleMobileEditorScroll])
  const flushScheduledTouchScroll = React.useCallback(() => {
    touchScrollRafRef.current = null
    const pendingX = touchScrollPendingRef.current.x
    const pendingY = touchScrollPendingRef.current.y
    touchScrollPendingRef.current.x = 0
    touchScrollPendingRef.current.y = 0
    if (!pendingX && !pendingY) return
    scrollEditingCanvasBy(pendingX, pendingY)
  }, [scrollEditingCanvasBy])
  const scheduleTouchScrollBy = React.useCallback((deltaX: number, deltaY: number) => {
    if (!deltaX && !deltaY) return
    touchScrollPendingRef.current.x += deltaX
    touchScrollPendingRef.current.y += deltaY
    if (touchScrollRafRef.current != null) return
    touchScrollRafRef.current = window.requestAnimationFrame(() => {
      flushScheduledTouchScroll()
    })
  }, [flushScheduledTouchScroll])
  const resetScheduledTouchScroll = React.useCallback((flush: boolean) => {
    if (touchScrollRafRef.current != null) {
      window.cancelAnimationFrame(touchScrollRafRef.current)
      touchScrollRafRef.current = null
    }
    if (flush && (touchScrollPendingRef.current.x || touchScrollPendingRef.current.y)) {
      const pendingX = touchScrollPendingRef.current.x
      const pendingY = touchScrollPendingRef.current.y
      touchScrollPendingRef.current.x = 0
      touchScrollPendingRef.current.y = 0
      scrollEditingCanvasBy(pendingX, pendingY)
      return
    }
    touchScrollPendingRef.current.x = 0
    touchScrollPendingRef.current.y = 0
  }, [scrollEditingCanvasBy])

  const handleEditorBridgeMessage = React.useCallback((data: any) => {
    if (!data || typeof data !== "object") return

    if (data.__hei_resize) {
      const nextHeight = Number(data.__hei_resize)
      const currentDoc = iframeRef.current?.contentDocument
      const canMeasureLocally = isIframeDocumentReady(currentDoc)
      if (!canMeasureLocally && !useSingleMobileEditorScroll && Number.isFinite(nextHeight) && nextHeight > 0) {
        setHeight(prev => {
          const next = Math.max(160, nextHeight)
          return Math.abs(next - prev) >= 4 ? next : prev
        })
      }
      syncHeightFromDocument(currentDoc)
    }

    if (data.__editor_select) {
      onElementSelect?.((data.info ?? null) as EditorElementInfo | null)
      const releasedRecently =
        lastInteractionReleaseRef.current.kind != null &&
        Date.now() - lastInteractionReleaseRef.current.at < 260
      if (!releasedRecently) {
        ensureSelectionVisible(data.rect ?? null)
      }
    }

    if (data.__editor_editing) {
      onEditingChange?.(true)
    }

    if (data.__editor_text_change) {
      onEditingChange?.(false)
    }

    if (data.__editor_snapshot) {
      const snapshotHtml = String(data.html || "")
      if (snapshotHtml) {
        lastLiveSnapshotRef.current = snapshotHtml
        lastAppliedHtmlRef.current = snapshotHtml
        onEditorSnapshot?.(snapshotHtml)
      }
    }
    if (data.__editor_interaction_lock) {
      const nextLocked = Boolean(data.active)
      if (nextLocked) {
        const nextKind =
          data.kind === "move" || data.kind === "resize" || data.kind === "group"
            ? data.kind
            : null
        activeInteractionKindRef.current = nextKind
      } else {
        lastInteractionReleaseRef.current = {
          kind: activeInteractionKindRef.current,
          at: Date.now(),
        }
        activeInteractionKindRef.current = null
      }
      interactionLockedRef.current = nextLocked
      setInteractionLocked(nextLocked)
      onInteractionLockChange?.(nextLocked)
    }

    if (data.__editor_autoscroll) {
      const deltaX = Number(data.deltaX || 0)
      const deltaY = Number(data.deltaY || 0)
      if (deltaX || deltaY) {
        scrollEditingCanvasBy(deltaX, deltaY)
      }
    }

    if (data.__editor_open_inspector) {
      onOpenInspector?.()
    }
  }, [ensureSelectionVisible, iframeRef, isIframeDocumentReady, onEditorSnapshot, onEditingChange, onElementSelect, onOpenInspector, scrollEditingCanvasBy, syncHeightFromDocument, syncImportedVisualBounds, useSingleMobileEditorScroll])
  const injectEditorRuntime = React.useCallback((doc: Document) => {
    if (!editMode || !doc.documentElement || !doc.head || !doc.body) return

    const root = doc.documentElement
    root.setAttribute("data-he-editor-mode", "edit")
    doc.body.setAttribute("data-he-editor-mode", "edit")
    let baseStyle = doc.head?.querySelector<HTMLStyleElement>("style[data-he-editor-base='1']")
    if (!baseStyle) {
      baseStyle = doc.createElement("style")
      baseStyle.setAttribute("data-he-editor-base", "1")
      baseStyle.textContent = EDITOR_BASE_CSS
      doc.head.appendChild(baseStyle)
    }
    doc.querySelectorAll("input, textarea, select").forEach((node) => {
      if (!node.hasAttribute("autocomplete")) node.setAttribute("autocomplete", "off")
      if (!node.hasAttribute("spellcheck")) node.setAttribute("spellcheck", "false")
      if (!node.hasAttribute("autocorrect")) node.setAttribute("autocorrect", "off")
      if (!node.hasAttribute("autocapitalize")) node.setAttribute("autocapitalize", "off")
    })
    const runtimeState = root.getAttribute("data-he-editor-runtime")
    const runtimeVersion = root.getAttribute("data-he-editor-runtime-version")
    if (doc.querySelector("script[data-he-runtime='editor']") && runtimeVersion === EDITOR_RUNTIME_VERSION) {
      root.setAttribute("data-he-editor-runtime", "ready")
      return
    }
    if (runtimeState === "loading") return
    if (doc.querySelector("script[data-he-runtime='editor']")) {
      doc.querySelectorAll("[data-he-runtime],[data-he-editor-overlay]").forEach((node) => node.remove())
      root.removeAttribute("data-he-editor-runtime")
      root.removeAttribute("data-he-editor-runtime-version")
    }
    if (runtimeState === "ready") {
      root.removeAttribute("data-he-editor-runtime")
    }

    root.setAttribute("data-he-editor-runtime", "loading")

    import("@/components/admin/html-editor-bridge")
      .then(({ buildEditorRuntime }) => {
        if (!doc.body) {
          root.removeAttribute("data-he-editor-runtime")
          return
        }
        if (doc.querySelector("script[data-he-runtime='editor']")) {
          root.setAttribute("data-he-editor-runtime", "ready")
          return
        }
        const script = doc.createElement("script")
        script.setAttribute("data-he-runtime", "editor")
        script.textContent = buildEditorRuntime()
        doc.body.appendChild(script)
        root.setAttribute("data-he-editor-runtime", "ready")
        root.setAttribute("data-he-editor-runtime-version", EDITOR_RUNTIME_VERSION)
      })
      .catch(() => {
        root.removeAttribute("data-he-editor-runtime")
      })
  }, [editMode])

  // Listen for messages from the iframe (resize + editor selection)
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return
      const currentWindow = iframeRef.current?.contentWindow
      if (!currentWindow || e.source !== currentWindow) return
      handleEditorBridgeMessage(e.data)
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [handleEditorBridgeMessage, iframeRef])

  React.useEffect(() => {
    const iframe = iframeRef.current as (HTMLIFrameElement & { __heEditorBridge?: (data: any) => void }) | null
    if (!iframe) return
    iframe.__heEditorBridge = handleEditorBridgeMessage
    return () => {
      if (iframe.__heEditorBridge === handleEditorBridgeMessage) {
        delete iframe.__heEditorBridge
      }
    }
  }, [handleEditorBridgeMessage, iframeRef])

  React.useEffect(() => {
    if (!html.trim()) return
    if (editMode && lastLiveSnapshotRef.current && html === lastLiveSnapshotRef.current) {
      lastAppliedHtmlRef.current = html
      return
    }
    if (html === lastAppliedHtmlRef.current) return
    lastAppliedHtmlRef.current = html
    setIframeSrcDoc(buildFrameDocument(html))
  }, [editMode, html])

  const syncIframeTheme = React.useCallback((doc: Document) => {
    if (typeof window === "undefined") return
    if (!doc.documentElement || !doc.head || !doc.body) return

    const rootStyle = window.getComputedStyle(document.documentElement)
    const bodyStyle = window.getComputedStyle(document.body)
    const htmlStyle = doc.documentElement.style

    const setVar = (name: string, value: string | null | undefined, fallback: string) => {
      const nextValue = value?.trim() || fallback
      htmlStyle.setProperty(name, nextValue)
    }

    setVar("--he-primary", rootStyle.getPropertyValue("--primary"), "#E8392A")
    setVar("--he-foreground", rootStyle.getPropertyValue("--foreground"), "#E2EAF0")
    setVar("--he-border", rootStyle.getPropertyValue("--border"), "rgba(120,144,171,.18)")
    setVar("--he-background", rootStyle.getPropertyValue("--background"), "transparent")
    setVar("--he-muted", bodyStyle.color || rootStyle.getPropertyValue("--muted-foreground"), "rgba(226,234,240,.68)")
    setVar("--he-font-sans", bodyStyle.fontFamily, "'Barlow', system-ui, sans-serif")
    setVar("--he-surface", "rgba(13,24,38,.82)", "rgba(13,24,38,.82)")
    setVar("--he-nav-bg", "rgba(7,15,24,.96)", "rgba(7,15,24,.96)")
    setVar("--he-nav-border", "rgba(232,57,42,.12)", "rgba(232,57,42,.12)")
  }, [])
  const syncIframeScrollMode = React.useCallback((doc: Document) => {
    if (!doc.documentElement || !doc.body) return
    const htmlStyle = doc.documentElement.style
    const bodyStyle = doc.body.style
    if (useInternalMobileEditScroll) {
      doc.documentElement.setAttribute("data-he-iframe-scroll-mode", "internal")
      doc.documentElement.setAttribute("data-he-external-mobile-toolbar", "1")
      htmlStyle.setProperty("height", "100%", "important")
      htmlStyle.setProperty("min-height", "100%", "important")
      htmlStyle.setProperty("overflow-x", "hidden", "important")
      htmlStyle.setProperty("overflow-y", "auto", "important")
      htmlStyle.setProperty("overflow-anchor", "none", "important")
      htmlStyle.setProperty("overscroll-behavior", "contain", "important")
      htmlStyle.setProperty("touch-action", interactionLocked ? "none" : "pan-x pan-y", "important")
      htmlStyle.setProperty("-webkit-overflow-scrolling", "touch")
      bodyStyle.setProperty("min-height", "100%", "important")
      bodyStyle.setProperty("height", "auto", "important")
      bodyStyle.setProperty("overflow-x", "hidden", "important")
      bodyStyle.setProperty("overflow-y", "visible", "important")
      bodyStyle.setProperty("overflow-anchor", "none", "important")
      bodyStyle.setProperty("overscroll-behavior", "contain", "important")
      bodyStyle.setProperty("touch-action", interactionLocked ? "none" : "pan-x pan-y", "important")
      bodyStyle.setProperty("-webkit-overflow-scrolling", "touch")
      return
    }
    doc.documentElement.removeAttribute("data-he-iframe-scroll-mode")
    doc.documentElement.removeAttribute("data-he-external-mobile-toolbar")
    htmlStyle.removeProperty("height")
    htmlStyle.removeProperty("min-height")
    htmlStyle.removeProperty("overflow-x")
    htmlStyle.removeProperty("overflow-y")
    htmlStyle.removeProperty("overflow-anchor")
    htmlStyle.removeProperty("overscroll-behavior")
    htmlStyle.removeProperty("touch-action")
    htmlStyle.removeProperty("-webkit-overflow-scrolling")
    bodyStyle.removeProperty("min-height")
    bodyStyle.removeProperty("height")
    bodyStyle.removeProperty("overflow-x")
    bodyStyle.removeProperty("overflow-y")
    bodyStyle.removeProperty("overflow-anchor")
    bodyStyle.removeProperty("overscroll-behavior")
    bodyStyle.removeProperty("touch-action")
    bodyStyle.removeProperty("-webkit-overflow-scrolling")
  }, [interactionLocked, useInternalMobileEditScroll])
  const syncMobileEditViewportHeight = React.useCallback(() => {
    if (!useMobileEditViewportFit) {
      mobileEditViewportAlignedRef.current = false
      setMobileEditFrameHeight(null)
      return
    }
    const iframe = iframeRef.current
    const ownerDoc = iframe?.ownerDocument
    const ownerWindow = ownerDoc?.defaultView ?? window
    const scrollRoot = ownerDoc?.querySelector?.("[data-he-studio-scroll-root='1']") as HTMLElement | null
    const dockNode = ownerDoc?.querySelector?.("[data-he-mobile-dock='1']") as HTMLElement | null
    const iframeRect = iframe?.getBoundingClientRect()
    const rootRect = scrollRoot?.getBoundingClientRect()
    const dockRect = dockNode?.getBoundingClientRect()
    const visibleBottom = Math.min(
      dockRect?.top ?? Number.POSITIVE_INFINITY,
      rootRect?.bottom ?? Number.POSITIVE_INFINITY,
      ownerWindow.innerHeight || Number.POSITIVE_INFINITY,
    )
    const safeTop = Math.max(iframeRect?.top || 0, (rootRect?.top || 0) + 6)
    const resolvedBottom = Number.isFinite(visibleBottom)
      ? visibleBottom
      : (dockRect?.top || rootRect?.bottom || ownerWindow.innerHeight || 0)
    const nextHeight = Math.max(280, Math.floor(resolvedBottom - safeTop - 8))
    setMobileEditFrameHeight((current) => (current === nextHeight ? current : nextHeight))
  }, [iframeRef, useMobileEditViewportFit])
  const alignMobileEditViewport = React.useCallback(() => {
    if (!useMobileEditViewportFit || mobileEditViewportAlignedRef.current) return
    const iframe = iframeRef.current
    const ownerDoc = iframe?.ownerDocument
    const scrollRoot = ownerDoc?.querySelector?.("[data-he-studio-scroll-root='1']") as HTMLElement | null
    const iframeRect = iframe?.getBoundingClientRect()
    const rootRect = scrollRoot?.getBoundingClientRect()
    if (!iframe || !scrollRoot || !iframeRect || !rootRect) return
    const desiredTop = rootRect.top + 12
    const delta = iframeRect.top - desiredTop
    if (Math.abs(delta) > 10) {
      scrollRoot.scrollTop += delta
    }
    mobileEditViewportAlignedRef.current = true
    window.requestAnimationFrame(() => syncMobileEditViewportHeight())
  }, [iframeRef, syncMobileEditViewportHeight, useMobileEditViewportFit])

  const normalizeImportLayout = React.useCallback((doc: Document) => {
    if (!doc.documentElement || !doc.body) return
    const root = doc.querySelector<HTMLElement>("[data-he-import-root='1']") ?? doc.body
    if (!root) return
    const viewportHeight = doc.documentElement.clientHeight || 0
    // Process deepest elements first so that when we check a parent's trailing
    // gap, its children have already been relaxed — making the gap visible.
    const descendants = Array.from(root.querySelectorAll("*")).filter(
      (node) => isHTMLElementLike(node) && !node.closest?.("[data-he-runtime],[data-he-editor-overlay]")
    ) as HTMLElement[]
    const candidates = [...descendants.reverse(), root]

    const relax = (el: HTMLElement) => {
      if (el.dataset.heLayoutRelaxed === "1") return
      const style = doc.defaultView?.getComputedStyle(el)
      const position = style?.position || ""
      el.style.setProperty("height", "auto", "important")
      el.style.setProperty("min-height", "0", "important")
      el.style.setProperty("max-height", "none", "important")
      el.style.setProperty("overflow", "visible", "important")
      el.style.setProperty("overflow-y", "visible", "important")
      el.style.setProperty("overflow-x", "visible", "important")
      if (position === "fixed" || position === "absolute") {
        el.style.setProperty("position", "relative", "important")
      }
      el.dataset.heLayoutRelaxed = "1"
    }

    const measureTrailingGap = (el: HTMLElement) => {
      const containerRect = el.getBoundingClientRect()
      if (!Number.isFinite(containerRect.bottom) || containerRect.height <= 0) return 0
      let contentBottom = containerRect.top
      for (const child of Array.from(el.children)) {
        if (!isHTMLElementLike(child)) continue
        if (child.closest?.("[data-he-runtime],[data-he-editor-overlay]")) continue
        const childStyle = doc.defaultView?.getComputedStyle(child)
        if (childStyle?.display === "none" || childStyle?.visibility === "hidden") continue
        if (childStyle?.position === "fixed") continue
        const rect = child.getBoundingClientRect()
        if (!Number.isFinite(rect.bottom) || rect.height <= 0) continue
        contentBottom = Math.max(contentBottom, rect.bottom)
      }
      return Math.max(0, Math.round(containerRect.bottom - contentBottom))
    }

    for (const el of candidates) {
      const style = doc.defaultView?.getComputedStyle(el)
      const overflow = style?.overflow || ""
      const overflowY = style?.overflowY || ""
      const position = style?.position || ""
      const clientHeight = el.clientHeight || 0
      const scrollHeight = el.scrollHeight || 0
      const contentOverflow = scrollHeight > clientHeight + 6
      const hidesOverflow =
        overflow === "hidden" ||
        overflow === "clip" ||
        overflowY === "hidden" ||
        overflowY === "clip"
      const heightValue = Number.parseFloat(style?.height || "")
      const minHeightValue = Number.parseFloat(style?.minHeight || "")
      const inlineStyle = el.getAttribute("style") || ""
      const hasViewportHeightStyle =
        hasViewportHeightHint(inlineStyle) ||
        hasViewportHeightHint(style?.height) ||
        hasViewportHeightHint(style?.minHeight)
      const viewportShellTolerance =
        viewportHeight > 0
          ? Math.max(24, Math.round(viewportHeight * 0.18))
          : 24
      const looksViewportShell =
        (Number.isFinite(heightValue) && viewportHeight > 0 && Math.abs(heightValue - viewportHeight) <= viewportShellTolerance) ||
        (Number.isFinite(minHeightValue) && viewportHeight > 0 && Math.abs(minHeightValue - viewportHeight) <= viewportShellTolerance) ||
        (viewportHeight > 0 && Math.abs(clientHeight - viewportHeight) <= viewportShellTolerance)
      const trailingGap = measureTrailingGap(el)
      const hasTrailingViewportGap =
        viewportHeight > 0 &&
        trailingGap > Math.max(96, Math.round(viewportHeight * 0.18)) &&
        (hasViewportHeightStyle || looksViewportShell)

      if (editMode && contentOverflow && (hidesOverflow || looksViewportShell || position === "fixed")) {
        relax(el)
        continue
      }

      if ((useSingleMobileEditorScroll || !editMode) && hasTrailingViewportGap) {
        relax(el)
      }
    }
  }, [editMode, useSingleMobileEditorScroll])

  const wireEditorWheelBridge = React.useCallback((doc: Document) => {
    try {
      if (!doc.documentElement || !doc.body) return
      const wheelDoc = doc as Document & {
        __heWheelHandler?: EventListener
        __heTouchStartHandler?: EventListener
        __heTouchMoveHandler?: EventListener
        __heTouchEndHandler?: EventListener
      }
      const previousHandler = wheelDoc.__heWheelHandler
      const previousTouchStart = wheelDoc.__heTouchStartHandler
      const previousTouchMove = wheelDoc.__heTouchMoveHandler
      const previousTouchEnd = wheelDoc.__heTouchEndHandler
      if (previousHandler) {
        doc.removeEventListener("wheel", previousHandler, true)
      }
      if (previousTouchStart) doc.removeEventListener("touchstart", previousTouchStart, true)
      if (previousTouchMove) doc.removeEventListener("touchmove", previousTouchMove, true)
      if (previousTouchEnd) {
        doc.removeEventListener("touchend", previousTouchEnd, true)
        doc.removeEventListener("touchcancel", previousTouchEnd, true)
      }

      if (!editMode) {
        // View mode: keep a single page scroll even when the pointer is over the iframe.
        const canUseOverflowAxis = (v: string | null | undefined) => {
          const n = String(v || "").trim().toLowerCase()
          return n === "auto" || n === "scroll" || n === "overlay"
        }
        let rafId: number | null = null
        let accDeltaY = 0
        let accDeltaX = 0
        const frameWin = doc.defaultView ?? window
        const flush = () => {
          try { ;(window.parent ?? window).scrollBy({ top: accDeltaY, left: accDeltaX }) } catch { /* cross-origin */ }
          accDeltaY = 0
          accDeltaX = 0
          rafId = null
        }
        const handleViewWheel = (event: Event) => {
          try {
            const wheelEvent = event as WheelEvent
            if (!wheelEvent.deltaY && !wheelEvent.deltaX) return
            // If an internal element can still scroll in the requested direction, leave it alone.
            if (isElementNode(wheelEvent.target)) {
              let node: Element | null = wheelEvent.target as Element
              while (node && node !== doc.documentElement) {
                if (isHTMLElementLike(node)) {
                  const s = doc.defaultView?.getComputedStyle(node)
                  if (s) {
                    const oy = s.overflowY || ""
                    const ox = s.overflowX || ""
                    const maxY = node.scrollHeight - node.clientHeight
                    const maxX = node.scrollWidth - node.clientWidth
                    if (wheelEvent.deltaY && canUseOverflowAxis(oy) && maxY > 2) {
                      if (wheelEvent.deltaY < 0 && node.scrollTop > 1) return
                      if (wheelEvent.deltaY > 0 && node.scrollTop < maxY - 1) return
                    }
                    if (wheelEvent.deltaX && canUseOverflowAxis(ox) && maxX > 2) {
                      if (wheelEvent.deltaX < 0 && node.scrollLeft > 1) return
                      if (wheelEvent.deltaX > 0 && node.scrollLeft < maxX - 1) return
                    }
                  }
                }
                node = node.parentElement
              }
            }
            // Prevent the iframe from swallowing the event, then batch-forward to the page.
            event.preventDefault()
            accDeltaY += wheelEvent.deltaY
            accDeltaX += wheelEvent.deltaX
            if (rafId === null) {
              rafId = frameWin.requestAnimationFrame(flush)
            }
          } catch { /* keep page usable */ }
        }
        let viewTouchState: {
          id: number | null
          x: number
          y: number
        } | null = null
        const findScrollableAncestor = (target: EventTarget | null, deltaX: number, deltaY: number) => {
          let node = isElementNode(target) ? target : null
          while (node && node !== doc.documentElement) {
            if (isHTMLElementLike(node)) {
              const s = doc.defaultView?.getComputedStyle(node)
              if (s) {
                const oy = s.overflowY || s.overflow || ""
                const ox = s.overflowX || s.overflow || ""
                const maxY = node.scrollHeight - node.clientHeight
                const maxX = node.scrollWidth - node.clientWidth
                if (deltaY && canUseOverflowAxis(oy) && maxY > 2) {
                  if (deltaY < 0 && node.scrollTop > 1) return node
                  if (deltaY > 0 && node.scrollTop < maxY - 1) return node
                }
                if (deltaX && canUseOverflowAxis(ox) && maxX > 2) {
                  if (deltaX < 0 && node.scrollLeft > 1) return node
                  if (deltaX > 0 && node.scrollLeft < maxX - 1) return node
                }
              }
            }
            node = node.parentElement
          }
          return null
        }
        const handleViewTouchStart = (event: Event) => {
          const touchEvent = event as TouchEvent
          const touch = touchEvent.touches?.[0]
          if (!touch) return
          viewTouchState = {
            id: touch.identifier,
            x: touch.clientX,
            y: touch.clientY,
          }
        }
        const handleViewTouchMove = (event: Event) => {
          const touchEvent = event as TouchEvent
          const touch = Array.from(touchEvent.touches || []).find((entry) => entry.identifier === viewTouchState?.id)
          if (!viewTouchState || !touch) return
          const deltaX = viewTouchState.x - touch.clientX
          const deltaY = viewTouchState.y - touch.clientY
          if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
          viewTouchState.x = touch.clientX
          viewTouchState.y = touch.clientY
          if (findScrollableAncestor(touchEvent.target, deltaX, deltaY)) return
          if (touchEvent.cancelable) {
            touchEvent.preventDefault()
          }
          touchEvent.stopPropagation()
          accDeltaX += deltaX
          accDeltaY += deltaY
          if (rafId === null) {
            rafId = frameWin.requestAnimationFrame(flush)
          }
        }
        const handleViewTouchEnd = () => {
          viewTouchState = null
          if (rafId !== null) {
            frameWin.cancelAnimationFrame(rafId)
            flush()
          }
        }
        doc.addEventListener("wheel", handleViewWheel, { passive: false, capture: true })
        doc.addEventListener("touchstart", handleViewTouchStart, { passive: true, capture: true })
        doc.addEventListener("touchmove", handleViewTouchMove, { passive: false, capture: true })
        doc.addEventListener("touchend", handleViewTouchEnd, true)
        doc.addEventListener("touchcancel", handleViewTouchEnd, true)
        wheelDoc.__heWheelHandler = handleViewWheel
        wheelDoc.__heTouchStartHandler = handleViewTouchStart
        wheelDoc.__heTouchMoveHandler = handleViewTouchMove
        wheelDoc.__heTouchEndHandler = handleViewTouchEnd
        return
      }

      const canUseAxisOverflow = (value: string | null | undefined) => {
        const normalized = String(value || "").trim().toLowerCase()
        return normalized === "auto" || normalized === "scroll" || normalized === "overlay"
      }
      const importRoot = doc.querySelector<HTMLElement>("[data-he-import-root='1']") ?? doc.body
      const isPrimaryScrollContainer = (el: Element | null | undefined) =>
        !!el &&
        (el === importRoot || el === doc.scrollingElement || el === doc.body || el === doc.documentElement)

      const canScrollInDirection = (el: Element | null, deltaX: number, deltaY: number) => {
        if (!isHTMLElementLike(el)) return false
        const style = doc.defaultView?.getComputedStyle(el)
        const overflowX = style?.overflowX ?? style?.overflow ?? ""
        const overflowY = style?.overflowY ?? style?.overflow ?? ""
        const maxScrollX = el.scrollWidth - el.clientWidth
        const rawMaxScrollY = el.scrollHeight - el.clientHeight
        const isRootScrollNode = el === doc.scrollingElement || el === doc.body || el === doc.documentElement
        const rootBleedTop = Number.parseFloat(importRoot?.dataset.heEditorBleedTop || "0") || 0
        const rootBleedBottom = Number.parseFloat(importRoot?.dataset.heEditorBleedBottom || "0") || 0
        const maxScrollY = isRootScrollNode
          ? Math.max(0, rawMaxScrollY - rootBleedTop - rootBleedBottom)
          : rawMaxScrollY
        const allowsScrollY = isRootScrollNode
          ? overflowY !== "hidden" && overflowY !== "clip"
          : canUseAxisOverflow(overflowY)
        const allowsScrollX = isRootScrollNode
          ? overflowX !== "hidden" && overflowX !== "clip"
          : canUseAxisOverflow(overflowX)
        if (deltaY && maxScrollY > 2 && allowsScrollY) {
          if (deltaY > 0 && el.scrollTop < maxScrollY - 1) return true
          if (deltaY < 0 && el.scrollTop > 1) return true
        }
        if (deltaX && maxScrollX > 2 && allowsScrollX) {
          if (deltaX > 0 && el.scrollLeft < maxScrollX - 1) return true
          if (deltaX < 0 && el.scrollLeft > 1) return true
        }
        return false
      }

      const findScrollableAncestor = (target: EventTarget | null, deltaX: number, deltaY: number) => {
        let node = isElementNode(target) ? target : null
        while (node && node !== doc.body && node !== doc.documentElement) {
          if (canScrollInDirection(node, deltaX, deltaY)) {
            if (useInternalMobileEditScroll && isPrimaryScrollContainer(node)) {
              node = node.parentElement
              continue
            }
            return node
          }
          node = node.parentElement
        }
        if (useSingleMobileEditorScroll || useInternalMobileEditScroll) return null
        const root = doc.scrollingElement
        if (root && canScrollInDirection(root, deltaX, deltaY)) return root as HTMLElement
        if (doc.body && canScrollInDirection(doc.body, deltaX, deltaY)) return doc.body
        if (doc.documentElement && canScrollInDirection(doc.documentElement, deltaX, deltaY)) return doc.documentElement
        return null
      }

      const handleWheel = (event: Event) => {
        try {
          const wheelEvent = event as WheelEvent
          if (!wheelEvent.deltaX && !wheelEvent.deltaY) return
          if (findScrollableAncestor(wheelEvent.target, wheelEvent.deltaX, wheelEvent.deltaY)) return

          wheelEvent.preventDefault()
          wheelEvent.stopPropagation()
          scrollEditingCanvasBy(wheelEvent.deltaX, wheelEvent.deltaY)
        } catch {
          // keep Studio usable even if the iframe wheel bridge fails
        }
      }

      doc.addEventListener("wheel", handleWheel, { passive: false, capture: true })
      wheelDoc.__heWheelHandler = handleWheel
    } catch {
      // ignore bridge setup errors; scrolling should not crash the editor
    }
  }, [editMode, scrollEditingCanvasBy, scrollStudioCanvasBy, useInternalMobileEditScroll, useSingleMobileEditorScroll])

  const wireEditorTouchBridge = React.useCallback((doc: Document) => {
    try {
      if (!doc.documentElement || !doc.body) return
      const touchDoc = doc as Document & {
        __heMouseDownHandler?: EventListener
        __heMouseMoveHandler?: EventListener
        __heMouseUpHandler?: EventListener
        __hePointerDownHandler?: EventListener
        __hePointerMoveHandler?: EventListener
        __hePointerUpHandler?: EventListener
        __heTouchStartHandler?: EventListener
        __heTouchMoveHandler?: EventListener
        __heTouchEndHandler?: EventListener
        __heTouchState?: {
          pointerType: "touch"
          id: number | null
          x: number
          y: number
          startX: number
          startY: number
          moved: boolean
        } | null
        __heMouseState?: {
          pointerType: "mouse"
          id: number | null
          x: number
          y: number
          startX: number
          startY: number
          moved: boolean
        } | null
        __hePointerState?: {
          pointerType: "pointer"
          id: number | null
          x: number
          y: number
          startX: number
          startY: number
          moved: boolean
        } | null
        __heLastTouchSignalTs?: number
      }
      const previousMouseDown = touchDoc.__heMouseDownHandler
      const previousMouseMove = touchDoc.__heMouseMoveHandler
      const previousMouseUp = touchDoc.__heMouseUpHandler
      const previousPointerDown = touchDoc.__hePointerDownHandler
      const previousPointerMove = touchDoc.__hePointerMoveHandler
      const previousPointerUp = touchDoc.__hePointerUpHandler
      const previousStart = touchDoc.__heTouchStartHandler
      const previousMove = touchDoc.__heTouchMoveHandler
      const previousEnd = touchDoc.__heTouchEndHandler
      if (previousMouseDown) doc.removeEventListener("mousedown", previousMouseDown, true)
      if (previousMouseMove) doc.removeEventListener("mousemove", previousMouseMove, true)
      if (previousMouseUp) {
        doc.removeEventListener("mouseup", previousMouseUp, true)
        doc.removeEventListener("mouseleave", previousMouseUp, true)
      }
      if (previousPointerDown) doc.removeEventListener("pointerdown", previousPointerDown, true)
      if (previousPointerMove) doc.removeEventListener("pointermove", previousPointerMove, true)
      if (previousPointerUp) {
        doc.removeEventListener("pointerup", previousPointerUp, true)
        doc.removeEventListener("pointercancel", previousPointerUp, true)
      }
      if (previousStart) doc.removeEventListener("touchstart", previousStart, true)
      if (previousMove) doc.removeEventListener("touchmove", previousMove, true)
      if (previousEnd) {
        doc.removeEventListener("touchend", previousEnd, true)
        doc.removeEventListener("touchcancel", previousEnd, true)
      }

      touchDoc.__heMouseState = null
      touchDoc.__hePointerState = null
      touchDoc.__heTouchState = null

      if (!editMode) {
        touchDoc.__heMouseDownHandler = undefined
        touchDoc.__heMouseMoveHandler = undefined
        touchDoc.__heMouseUpHandler = undefined
        touchDoc.__hePointerDownHandler = undefined
        touchDoc.__hePointerMoveHandler = undefined
        touchDoc.__hePointerUpHandler = undefined
        touchDoc.__heTouchStartHandler = undefined
        touchDoc.__heTouchMoveHandler = undefined
        touchDoc.__heTouchEndHandler = undefined
        return
      }

      const isRuntimeTarget = (target: EventTarget | null) => {
        if (!isElementNode(target)) return false
        if (target.closest("[data-he-runtime],[data-he-editor-overlay]")) return true
        const moveArmed = doc.documentElement?.getAttribute("data-he-free-move-active") === "1"
        return moveArmed && Boolean(target.closest("[data-he-free-move='1']"))
      }
      const markTouchSignal = () => {
        touchDoc.__heLastTouchSignalTs = Date.now()
      }
      const hasRecentTouchSignal = () => {
        const lastTouchSignalTs = touchDoc.__heLastTouchSignalTs ?? 0
        return lastTouchSignalTs > 0 && Date.now() - lastTouchSignalTs < 260
      }
      const setScrollBridgeActive = (active: boolean) => {
        if (!doc.documentElement) return
        if (active) {
          doc.documentElement.setAttribute("data-he-scroll-bridge-active", "1")
        } else {
          doc.documentElement.removeAttribute("data-he-scroll-bridge-active")
        }
      }
      const stopBridgeEvent = (event: Event) => {
        if ("cancelable" in event && event.cancelable) {
          event.preventDefault()
        }
        event.stopPropagation()
        if ("stopImmediatePropagation" in event && typeof event.stopImmediatePropagation === "function") {
          event.stopImmediatePropagation()
        }
      }
      const isMobileSizedCanvas = () => {
        const iframe = iframeRef.current
        const width = iframe?.getBoundingClientRect().width ?? 0
        if (width > 0) return width <= 480
        return typeof window !== "undefined" ? window.innerWidth <= 480 : false
      }
      const clearGestureState = (kind: "touch" | "pointer" | "mouse") => {
        if (kind === "touch") touchDoc.__heTouchState = null
        if (kind === "pointer") touchDoc.__hePointerState = null
        if (kind === "mouse") touchDoc.__heMouseState = null
      }
      const scrollGestureTargetBy = (element: Element | null | undefined, deltaX: number, deltaY: number) => {
        if (!isHTMLElementLike(element)) return { moved: false, consumedX: 0, consumedY: 0 }
        const maxScrollLeft = Math.max(0, element.scrollWidth - element.clientWidth)
        const maxScrollTop = Math.max(0, element.scrollHeight - element.clientHeight)
        const startLeft = element.scrollLeft
        const startTop = element.scrollTop
        const nextLeft = maxScrollLeft > 0
          ? Math.min(maxScrollLeft, Math.max(0, startLeft + deltaX))
          : startLeft
        const nextTop = maxScrollTop > 0
          ? Math.min(maxScrollTop, Math.max(0, startTop + deltaY))
          : startTop
        element.scrollLeft = nextLeft
        element.scrollTop = nextTop
        return {
          moved: nextLeft !== startLeft || nextTop !== startTop,
          consumedX: nextLeft - startLeft,
          consumedY: nextTop - startTop,
        }
      }
      const applyGestureScroll = (event: Event, deltaX: number, deltaY: number) => {
        setScrollBridgeActive(true)
        stopBridgeEvent(event)
        scheduleTouchScrollBy(deltaX, deltaY)
      }

      const canUseAxisOverflow = (value: string | null | undefined) => {
        const normalized = String(value || "").trim().toLowerCase()
        return normalized === "auto" || normalized === "scroll" || normalized === "overlay"
      }
      const importRoot = doc.querySelector<HTMLElement>("[data-he-import-root='1']") ?? doc.body
      const isPrimaryScrollContainer = (el: Element | null | undefined) =>
        !!el &&
        (el === importRoot || el === doc.scrollingElement || el === doc.body || el === doc.documentElement)

      const canScrollInDirection = (el: Element | null, deltaX: number, deltaY: number) => {
        if (!isHTMLElementLike(el)) return false
        const style = doc.defaultView?.getComputedStyle(el)
        const overflowX = style?.overflowX ?? style?.overflow ?? ""
        const overflowY = style?.overflowY ?? style?.overflow ?? ""
        const maxScrollX = el.scrollWidth - el.clientWidth
        const rawMaxScrollY = el.scrollHeight - el.clientHeight
        const isRootScrollNode = el === doc.scrollingElement || el === doc.body || el === doc.documentElement
        const rootBleedTop = Number.parseFloat(importRoot?.dataset.heEditorBleedTop || "0") || 0
        const rootBleedBottom = Number.parseFloat(importRoot?.dataset.heEditorBleedBottom || "0") || 0
        const maxScrollY = isRootScrollNode
          ? Math.max(0, rawMaxScrollY - rootBleedTop - rootBleedBottom)
          : rawMaxScrollY
        const allowsScrollY = isRootScrollNode
          ? overflowY !== "hidden" && overflowY !== "clip"
          : canUseAxisOverflow(overflowY)
        const allowsScrollX = isRootScrollNode
          ? overflowX !== "hidden" && overflowX !== "clip"
          : canUseAxisOverflow(overflowX)
        if (deltaY && maxScrollY > 2 && allowsScrollY) {
          if (deltaY > 0 && el.scrollTop < maxScrollY - 1) return true
          if (deltaY < 0 && el.scrollTop > 1) return true
        }
        if (deltaX && maxScrollX > 2 && allowsScrollX) {
          if (deltaX > 0 && el.scrollLeft < maxScrollX - 1) return true
          if (deltaX < 0 && el.scrollLeft > 1) return true
        }
        return false
      }

      const findScrollableAncestor = (target: EventTarget | null, deltaX: number, deltaY: number) => {
        let node = isElementNode(target) ? target : null
        while (node && node !== doc.body && node !== doc.documentElement) {
          if (canScrollInDirection(node, deltaX, deltaY)) {
            if (useInternalMobileEditScroll && isPrimaryScrollContainer(node)) {
              node = node.parentElement
              continue
            }
            return node
          }
          node = node.parentElement
        }
        if (useSingleMobileEditorScroll) return null
        return null
      }
      const beginGestureState = (
        kind: "touch" | "pointer" | "mouse",
        id: number | null,
        clientX: number,
        clientY: number,
        target: EventTarget | null
      ) => {
        if (interactionLockedRef.current) return
        setScrollBridgeActive(false)
        resetScheduledTouchScroll(false)
        if (isRuntimeTarget(target)) {
          clearGestureState(kind)
          return
        }
        if (kind === "touch") {
          touchDoc.__heTouchState = {
            pointerType: "touch",
            id,
            x: clientX,
            y: clientY,
            startX: clientX,
            startY: clientY,
            moved: false,
          }
          return
        }
        if (kind === "pointer") {
          touchDoc.__hePointerState = {
            pointerType: "pointer",
            id,
            x: clientX,
            y: clientY,
            startX: clientX,
            startY: clientY,
            moved: false,
          }
          return
        }
        touchDoc.__heMouseState = {
          pointerType: "mouse",
          id,
          x: clientX,
          y: clientY,
          startX: clientX,
          startY: clientY,
          moved: false,
        }
      }
      const moveGestureState = (
        kind: "touch" | "pointer" | "mouse",
        event: Event,
        id: number | null,
        clientX: number,
        clientY: number,
        target: EventTarget | null
      ) => {
        if (interactionLockedRef.current) return
        const state =
          kind === "touch"
            ? touchDoc.__heTouchState
            : kind === "pointer"
              ? touchDoc.__hePointerState
              : touchDoc.__heMouseState
        if (!state) return
        if (state.id != null && id != null && state.id !== id) return
        if (kind !== "touch" && touchDoc.__heTouchState?.moved) return
        if (isRuntimeTarget(target)) return
        const deltaX = state.x - clientX
        const deltaY = state.y - clientY
        if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return
        const totalDx = state.startX - clientX
        const totalDy = state.startY - clientY
        const moved = state.moved || Math.abs(totalDx) > 5 || Math.abs(totalDy) > 5
        const nextState = {
          ...state,
          id,
          x: clientX,
          y: clientY,
          moved,
        }
        if (kind === "touch") {
          touchDoc.__heTouchState = { ...nextState, pointerType: "touch" }
        }
        if (kind === "pointer") {
          touchDoc.__hePointerState = { ...nextState, pointerType: "pointer" }
        }
        if (kind === "mouse") {
          touchDoc.__heMouseState = { ...nextState, pointerType: "mouse" }
        }
        if (!moved) return
        const nestedScrollable = findScrollableAncestor(target, deltaX, deltaY)
        if (nestedScrollable) {
          const result = scrollGestureTargetBy(nestedScrollable, deltaX, deltaY)
          if (result.moved) {
            setScrollBridgeActive(true)
            stopBridgeEvent(event)
            return
          }
        }
        applyGestureScroll(event, deltaX, deltaY)
      }
      const endGestureState = (kind: "touch" | "pointer" | "mouse") => {
        resetScheduledTouchScroll(true)
        clearGestureState(kind)
        if (kind === "touch") {
          touchDoc.__hePointerState = null
          touchDoc.__heMouseState = null
        }
        window.setTimeout(() => setScrollBridgeActive(false), 0)
      }

      const handleTouchStart = (event: Event) => {
        const touchEvent = event as TouchEvent
        const touch = touchEvent.touches[0]
        markTouchSignal()
        if (!touch) {
          touchDoc.__heTouchState = null
          return
        }
        beginGestureState("touch", touch.identifier, touch.clientX, touch.clientY, touchEvent.target)
      }

      const handleTouchMove = (event: Event) => {
        const touchEvent = event as TouchEvent
        const state = touchDoc.__heTouchState
        if (!state) return
        markTouchSignal()
        const touch = Array.from(touchEvent.touches).find((entry) => entry.identifier === state.id) ?? touchEvent.touches[0]
        if (!touch) return
        moveGestureState("touch", touchEvent, touch.identifier, touch.clientX, touch.clientY, touchEvent.target)
      }

      const handleTouchEnd = () => {
        markTouchSignal()
        endGestureState("touch")
      }

      const handlePointerDown = (event: Event) => {
        const pointerEvent = event as PointerEvent
        if (pointerEvent.pointerType === "mouse") return
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        beginGestureState("pointer", pointerEvent.pointerId, pointerEvent.clientX, pointerEvent.clientY, pointerEvent.target)
      }

      const handlePointerMove = (event: Event) => {
        const pointerEvent = event as PointerEvent
        if (pointerEvent.pointerType === "mouse") return
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        moveGestureState("pointer", pointerEvent, pointerEvent.pointerId, pointerEvent.clientX, pointerEvent.clientY, pointerEvent.target)
      }

      const handlePointerEnd = () => {
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        endGestureState("pointer")
      }

      const handleMouseDown = (event: Event) => {
        const mouseEvent = event as MouseEvent
        if (mouseEvent.button !== 0 || !isMobileSizedCanvas()) return
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        beginGestureState("mouse", 0, mouseEvent.clientX, mouseEvent.clientY, mouseEvent.target)
      }

      const handleMouseMove = (event: Event) => {
        if (!isMobileSizedCanvas()) return
        const mouseEvent = event as MouseEvent
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        moveGestureState("mouse", mouseEvent, 0, mouseEvent.clientX, mouseEvent.clientY, mouseEvent.target)
      }

      const handleMouseUp = () => {
        if (touchDoc.__heTouchState || hasRecentTouchSignal()) return
        endGestureState("mouse")
      }

      doc.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true })
      doc.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true })
      doc.addEventListener("touchend", handleTouchEnd, { passive: true, capture: true })
      doc.addEventListener("touchcancel", handleTouchEnd, { passive: true, capture: true })
      doc.addEventListener("pointerdown", handlePointerDown, { passive: true, capture: true })
      doc.addEventListener("pointermove", handlePointerMove, { passive: false, capture: true })
      doc.addEventListener("pointerup", handlePointerEnd, { passive: true, capture: true })
      doc.addEventListener("pointercancel", handlePointerEnd, { passive: true, capture: true })
      doc.addEventListener("mousedown", handleMouseDown, { passive: true, capture: true })
      doc.addEventListener("mousemove", handleMouseMove, { passive: false, capture: true })
      doc.addEventListener("mouseup", handleMouseUp, { passive: true, capture: true })
      doc.addEventListener("mouseleave", handleMouseUp, { passive: true, capture: true })
      touchDoc.__heMouseDownHandler = handleMouseDown
      touchDoc.__heMouseMoveHandler = handleMouseMove
      touchDoc.__heMouseUpHandler = handleMouseUp
      touchDoc.__hePointerDownHandler = handlePointerDown
      touchDoc.__hePointerMoveHandler = handlePointerMove
      touchDoc.__hePointerUpHandler = handlePointerEnd
      touchDoc.__heTouchStartHandler = handleTouchStart
      touchDoc.__heTouchMoveHandler = handleTouchMove
      touchDoc.__heTouchEndHandler = handleTouchEnd
    } catch {
      // keep the Studio usable if touch bridge setup fails
    }
  }, [editMode, iframeRef, resetScheduledTouchScroll, scheduleTouchScrollBy, useInternalMobileEditScroll, useSingleMobileEditorScroll])

  const wireHtmlActions = React.useCallback((doc: Document) => {
    if (!doc.documentElement || !doc.body) return
    const previousHandler = (doc as Document & { __heActionHandler?: EventListener }).__heActionHandler
    if (previousHandler) {
      doc.removeEventListener("click", previousHandler, true)
    }

    if (editMode || !onAction) {
      ;(doc as Document & { __heActionHandler?: EventListener }).__heActionHandler = undefined
      return
    }

    const actionMap = new Map(actionBindings.map((binding) => [binding.eid, binding]))

    actionMap.forEach((binding, eid) => {
      const element = doc.querySelector<HTMLElement>(`[data-eid='${eid}']`)
      if (!element) return
      element.style.cursor = "pointer"
      if (binding.href && element.tagName.toLowerCase() === "a") {
        element.setAttribute("href", binding.href)
      }
    })

    const handleClick = (event: Event) => {
      const target = isElementNode(event.target) ? event.target : null
      if (!target) return

      const actionable = target.closest<HTMLElement>("[data-eid], a[href]")
      if (!actionable) return

      const eid = actionable.dataset.eid
      const binding = eid ? actionMap.get(eid) : undefined
      const href = binding?.href || actionable.getAttribute("href") || undefined
      const targetBlank = actionable.getAttribute("target") === "_blank"

      if (binding?.action?.type && binding.action.type !== "none") {
        event.preventDefault()
        event.stopPropagation()
        onAction(binding.action, binding.href || href)
        return
      }

      if (binding?.href) {
        event.preventDefault()
        event.stopPropagation()
        onAction(undefined, binding.href)
        return
      }

      if (actionable.tagName.toLowerCase() === "a" && href) {
        event.preventDefault()
        event.stopPropagation()
        if (href.startsWith("#")) {
          onAction({ type: "section", sectionId: href.slice(1), href })
          return
        }
        onAction(
          {
            type: /^(https?:)?\/\//i.test(href) ? "external" : "page",
            href,
            openInNewTab: targetBlank,
          },
          href
        )
      }
    }

    doc.addEventListener("click", handleClick, true)
    ;(doc as Document & { __heActionHandler?: EventListener }).__heActionHandler = handleClick
  }, [actionBindings, editMode, onAction])

  React.useEffect(() => {
    try {
      const maybeDoc = iframeRef.current?.contentDocument
      if (!isIframeDocumentReady(maybeDoc)) return
      const doc = maybeDoc
      const runtimeVersion = doc.documentElement.getAttribute("data-he-editor-runtime-version")
      const hasRuntimeScript = !!doc.querySelector("script[data-he-runtime='editor']")
      if (editMode && hasRuntimeScript && runtimeVersion !== EDITOR_RUNTIME_VERSION) {
        forceRuntimeReload()
        return
      }
      syncIframeTheme(doc)
      ensureTypographyFonts(doc)
      syncIframeScrollMode(doc)
      normalizeImportLayout(doc)
      wireHtmlActions(doc)
      wireEditorWheelBridge(doc)
      wireEditorTouchBridge(doc)
      syncImportedVisualBounds(doc)
      syncHeightFromDocument(doc)
      syncMobileEditViewportHeight()
      alignMobileEditViewport()
      injectEditorRuntime(doc)
    } catch {
      // Avoid breaking the Studio while the iframe document is still mounting.
    }
  }, [actionBindings, alignMobileEditViewport, editMode, forceRuntimeReload, html, iframeRef, injectEditorRuntime, isIframeDocumentReady, normalizeImportLayout, syncHeightFromDocument, syncIframeScrollMode, syncIframeTheme, syncImportedVisualBounds, syncMobileEditViewportHeight, wireEditorTouchBridge, wireEditorWheelBridge, wireHtmlActions])

  React.useEffect(() => {
    if (!editMode) {
      interactionLockedRef.current = false
      onElementSelect?.(null)
      onEditingChange?.(false)
      setInteractionLocked(false)
      onInteractionLockChange?.(false)
      try {
        const doc = iframeRef.current?.contentDocument
        if (doc) {
          // Deselect via bridge command
          iframeRef.current?.contentWindow?.postMessage({ __editor_cmd: true, cmd: "deselect" }, "*")
          // Hide all runtime overlay elements (toolbar, selection box, etc.)
          doc.querySelectorAll<HTMLElement>("[data-he-runtime]").forEach((el) => {
            el.style.display = "none"
          })
          // Mark the root so bridge's canEdit() returns false for all elements,
          // stopping preventDefault/stopPropagation on page clicks → restores full interactivity
          doc.documentElement.setAttribute("data-he-preview-mode", "1")
        }
      } catch {
        // iframe may not be accessible
      }
    } else {
      // Restore editability when switching back to edit mode
      try {
        const doc = iframeRef.current?.contentDocument
        if (doc) {
          doc.documentElement.removeAttribute("data-he-preview-mode")
          doc.querySelectorAll<HTMLElement>("[data-he-runtime]").forEach((el) => {
            el.style.display = ""
          })
        }
      } catch {
        // iframe may not be accessible
      }
    }
  }, [editMode, iframeRef, onEditingChange, onElementSelect, onInteractionLockChange])

  React.useEffect(() => {
    const maybeDoc = iframeRef.current?.contentDocument
    if (!isIframeDocumentReady(maybeDoc)) return
    syncIframeScrollMode(maybeDoc)
  }, [iframeRef, interactionLocked, isIframeDocumentReady, syncIframeScrollMode])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const syncIframeSize = () => {
      syncImportedVisualBounds(iframeRef.current?.contentDocument)
      syncHeightFromDocument(iframeRef.current?.contentDocument)
      syncMobileEditViewportHeight()
    }

    const handleVisibilitySync = () => {
      if (document.visibilityState === "visible") {
        window.requestAnimationFrame(syncIframeSize)
        window.setTimeout(syncIframeSize, 120)
      }
    }

    window.addEventListener("resize", syncIframeSize)
    window.addEventListener("orientationchange", syncIframeSize)
    window.addEventListener("focus", syncIframeSize)
    window.addEventListener("pageshow", syncIframeSize)
    window.visualViewport?.addEventListener("resize", syncIframeSize)
    document.addEventListener("visibilitychange", handleVisibilitySync)

    return () => {
      window.removeEventListener("resize", syncIframeSize)
      window.removeEventListener("orientationchange", syncIframeSize)
      window.removeEventListener("focus", syncIframeSize)
      window.removeEventListener("pageshow", syncIframeSize)
      window.visualViewport?.removeEventListener("resize", syncIframeSize)
      document.removeEventListener("visibilitychange", handleVisibilitySync)
    }
  }, [editMode, iframeRef, syncHeightFromDocument, syncImportedVisualBounds, syncMobileEditViewportHeight])

  React.useEffect(() => {
    syncMobileEditViewportHeight()
    alignMobileEditViewport()
  }, [alignMobileEditViewport, height, syncMobileEditViewportHeight, useMobileEditViewportFit])

  React.useEffect(() => {
    if (typeof document === "undefined") return
    if (!interactionLocked) return

    const { body, documentElement } = document
    const prevBodyOverflow = body.style.overflow
    const prevBodyTouchAction = body.style.touchAction
    const prevBodyOverscroll = body.style.overscrollBehavior
    const prevDocOverflow = documentElement.style.overflow
    const prevDocTouchAction = documentElement.style.touchAction
    const prevDocOverscroll = documentElement.style.overscrollBehavior

    body.style.overflow = "hidden"
    body.style.touchAction = "none"
    body.style.overscrollBehavior = "none"
    documentElement.style.overflow = "hidden"
    documentElement.style.touchAction = "none"
    documentElement.style.overscrollBehavior = "none"

    return () => {
      body.style.overflow = prevBodyOverflow
      body.style.touchAction = prevBodyTouchAction
      body.style.overscrollBehavior = prevBodyOverscroll
      documentElement.style.overflow = prevDocOverflow
      documentElement.style.touchAction = prevDocTouchAction
      documentElement.style.overscrollBehavior = prevDocOverscroll
    }
  }, [interactionLocked])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const releaseInteractionLock = () => {
      interactionLockedRef.current = false
      setInteractionLocked(false)
      onInteractionLockChange?.(false)
    }

    const handleVisibilityLockReset = () => {
      if (document.visibilityState !== "visible") {
        releaseInteractionLock()
      }
    }

    window.addEventListener("blur", releaseInteractionLock)
    window.addEventListener("pagehide", releaseInteractionLock)
    document.addEventListener("visibilitychange", handleVisibilityLockReset)

    return () => {
      window.removeEventListener("blur", releaseInteractionLock)
      window.removeEventListener("pagehide", releaseInteractionLock)
      document.removeEventListener("visibilitychange", handleVisibilityLockReset)
    }
  }, [onInteractionLockChange])

  const handleLoad = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      ;(iframe as HTMLIFrameElement & { __heEditorBridge?: (data: any) => void }).__heEditorBridge = handleEditorBridgeMessage
      const maybeDoc = iframe.contentDocument
      if (!isIframeDocumentReady(maybeDoc)) return
      const doc = maybeDoc
      const runtimeVersion = doc.documentElement.getAttribute("data-he-editor-runtime-version")
      const hasRuntimeScript = !!doc.querySelector("script[data-he-runtime='editor']")
      if (editMode && hasRuntimeScript && runtimeVersion !== EDITOR_RUNTIME_VERSION) {
        forceRuntimeReload()
        return
      }

      syncIframeTheme(doc)
      ensureTypographyFonts(doc)
      syncIframeScrollMode(doc)
      normalizeImportLayout(doc)
      wireHtmlActions(doc)
      wireEditorWheelBridge(doc)
      wireEditorTouchBridge(doc)
      lastAppliedHtmlRef.current = html
      if (!lastLiveSnapshotRef.current) {
        lastLiveSnapshotRef.current = html
      }

      // Auto-height
      let reportRaf: number | null = null
      const report = () => {
        syncHeightFromDocument(doc)
        syncMobileEditViewportHeight()
        alignMobileEditViewport()
      }
      const scheduleReport = () => {
        if (reportRaf != null) return
        reportRaf = window.requestAnimationFrame(() => {
          reportRaf = null
          report()
        })
      }
      report()
      const win = iframe.contentWindow as unknown as { ResizeObserver?: new (cb: () => void) => { observe: (el: Element) => void; disconnect: () => void } }
      let ro: { observe: (el: Element) => void; disconnect: () => void } | null = null
      if (win?.ResizeObserver) {
        ro = new win.ResizeObserver(scheduleReport)
        ro.observe(doc.body)
        ro.observe(doc.documentElement)
      }
      const mo = new MutationObserver(scheduleReport)
      // Do NOT observe attributes — normalizeImportLayout sets data-he-* attributes on every
      // element, which would trigger this observer and cause an infinite re-render loop.
      mo.observe(doc.documentElement, { childList: true, subtree: true, characterData: true })
      window.setTimeout(scheduleReport, 0)
      window.setTimeout(scheduleReport, 120)
      window.setTimeout(scheduleReport, 360)

      injectEditorRuntime(doc)
      ;(iframe as HTMLIFrameElement & { __heCleanupObservers?: () => void }).__heCleanupObservers?.()
      ;(iframe as HTMLIFrameElement & { __heCleanupObservers?: () => void }).__heCleanupObservers = () => {
        if (reportRaf != null) {
          window.cancelAnimationFrame(reportRaf)
          reportRaf = null
        }
        ro?.disconnect()
        mo.disconnect()
      }
    } catch {
      // sandboxed or cross-origin — silent
    }
  }

  React.useEffect(() => {
    return () => {
      resetScheduledTouchScroll(false)
      const iframe = iframeRef.current as (HTMLIFrameElement & { __heCleanupObservers?: () => void }) | null
      iframe?.__heCleanupObservers?.()
      if (iframe) delete iframe.__heCleanupObservers
      onInteractionLockChange?.(false)
    }
  }, [iframeRef, onInteractionLockChange, resetScheduledTouchScroll])

  if (!html.trim()) return null
  const resolvedIframeHeight =
    useMobileEditViewportFit
      ? Math.max(280, mobileEditFrameHeight || Math.min(height, 460))
      : height

  return (
    <section
      className={editMode ? "relative min-h-0 w-full overflow-visible" : "relative w-full"}
      data-he-html-interaction-locked={interactionLocked ? "1" : undefined}
      style={editMode ? { overflowAnchor: "none" } : undefined}
    >
      {!editMode && onActivate ? (
        <button
          type="button"
          onClick={onActivate}
          className="absolute inset-0 z-10 cursor-pointer rounded-[inherit] bg-transparent"
          aria-label="Activar edicion del bloque HTML"
          title="Haz clic para activar la edicion de este bloque HTML"
        />
      ) : null}
      <iframe
        ref={iframeRef}
        srcDoc={iframeSrcDoc}
        onLoad={handleLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        scrolling={useMobileEditViewportFit ? "yes" : editMode ? "auto" : "no"}
        style={{
          width: "100%",
          height: resolvedIframeHeight,
          border: "none",
          display: "block",
          overflow: useMobileEditViewportFit ? "auto" : editMode ? "auto" : "hidden",
          touchAction: interactionLocked ? "none" : useMobileEditViewportFit ? "pan-x pan-y" : "auto",
          overscrollBehavior: editMode ? "contain" : undefined,
          cursor: editMode ? "crosshair" : undefined,
        }}
        title="custom-block"
      />
    </section>
  )
}
