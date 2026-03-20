"use client"

import React from "react"
import { EDITOR_RUNTIME_VERSION, type EditorElementInfo } from "@/components/admin/html-editor-bridge"
import type { CMSActionConfig, CMSCustomCodeActionBinding } from "@/hooks/use-cms"

const EDITOR_BASE_CSS = `
html, body {
  margin: 0;
  padding: 0;
  min-height: 100%;
  height: auto;
  width: 100%;
  max-width: 100%;
  overflow-x: hidden;
  overflow-y: visible;
}

body {
  background: transparent;
}

[data-he-import-root="1"] {
  position: relative;
  min-height: 100%;
  height: auto;
  width: 100%;
  max-width: 100%;
  overflow: visible;
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

function getIframeDocumentHeight(doc: Document) {
  const importRoot = doc.querySelector<HTMLElement>("[data-he-import-root='1']")
  const importRootRect = Math.ceil(importRoot?.getBoundingClientRect().height || 0)
  const importRootScrollHeight = importRoot?.scrollHeight || 0
  const bodyRect = Math.ceil(doc.body?.getBoundingClientRect().height || 0)
  const bodyScrollHeight = doc.body?.scrollHeight || 0
  const docRect = Math.ceil(doc.documentElement?.getBoundingClientRect().height || 0)
  const docScrollHeight = doc.documentElement?.scrollHeight || 0

  return Math.max(
    importRootRect,
    importRootScrollHeight,
    bodyRect,
    bodyScrollHeight,
    docRect,
    docScrollHeight,
    doc.body?.offsetHeight || 0,
    doc.documentElement?.offsetHeight || 0,
    240
  )
}

export default function CustomCodeSection({
  data,
  editMode = false,
  onElementSelect,
  onEditingChange,
  onEditorSnapshot,
  onActivate,
  iframeRef: externalRef,
  onAction,
  onInteractionLockChange,
}: CustomCodeSectionProps) {
  const html = (data.html as string) ?? ""
  const actionBindings = React.useMemo(
    () => (((data.actionBindings as CMSCustomCodeActionBinding[] | undefined) ?? []).filter((binding) => binding?.eid)),
    [data.actionBindings]
  )
  const internalRef = React.useRef<HTMLIFrameElement>(null)
  const iframeRef   = externalRef ?? internalRef
  const [height, setHeight] = React.useState(480)
  const [interactionLocked, setInteractionLocked] = React.useState(false)
  const [iframeSrcDoc, setIframeSrcDoc] = React.useState(() => buildFrameDocument(html))
  const lastLiveSnapshotRef = React.useRef("")
  const lastAppliedHtmlRef = React.useRef(html)
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
      setHeight(Math.max(160, nextHeight))
    }
  }, [isIframeDocumentReady])

  const handleEditorBridgeMessage = React.useCallback((data: any) => {
    if (!data || typeof data !== "object") return

    if (data.__hei_resize) {
      const nextHeight = Number(data.__hei_resize)
      if (Number.isFinite(nextHeight) && nextHeight > 0) {
        setHeight(Math.max(160, nextHeight))
      }
      syncHeightFromDocument(iframeRef.current?.contentDocument)
    }

    if (data.__editor_select && onElementSelect) {
      onElementSelect((data.info ?? null) as EditorElementInfo | null)
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
      setInteractionLocked(nextLocked)
      onInteractionLockChange?.(nextLocked)
    }
  }, [iframeRef, onEditorSnapshot, onEditingChange, onElementSelect, syncHeightFromDocument])
  const injectEditorRuntime = React.useCallback((doc: Document) => {
    if (!editMode || !doc.documentElement || !doc.head || !doc.body) return

    const root = doc.documentElement
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

  const wireEditorWheelBridge = React.useCallback((doc: Document) => {
    try {
      if (!doc.documentElement || !doc.body) return
      const wheelDoc = doc as Document & { __heWheelHandler?: EventListener }
      const previousHandler = wheelDoc.__heWheelHandler
      if (previousHandler) {
        doc.removeEventListener("wheel", previousHandler, true)
      }

      if (!editMode) {
        wheelDoc.__heWheelHandler = undefined
        return
      }

      const handleWheel = (event: Event) => {
        try {
          const wheelEvent = event as WheelEvent
          if (!wheelEvent.deltaX && !wheelEvent.deltaY) return

          const iframe = iframeRef.current
          if (!iframe) return

          const scrollRoot =
            (iframe.closest?.("[data-he-studio-scroll-root='1']") as HTMLElement | null) ??
            (iframe.parentElement?.closest?.("[data-he-studio-scroll-root='1']") as HTMLElement | null) ??
            (document.querySelector("[data-he-studio-scroll-root='1']") as HTMLElement | null)

          if (!scrollRoot) return

          wheelEvent.preventDefault()
          wheelEvent.stopPropagation()

          if (typeof scrollRoot.scrollBy === "function") {
            scrollRoot.scrollBy({
              top: wheelEvent.deltaY,
              left: wheelEvent.deltaX,
              behavior: "auto",
            })
          } else {
            scrollRoot.scrollTop += wheelEvent.deltaY
            scrollRoot.scrollLeft += wheelEvent.deltaX
          }
        } catch {
          // keep Studio usable even if the iframe wheel bridge fails
        }
      }

      doc.addEventListener("wheel", handleWheel, { passive: false, capture: true })
      wheelDoc.__heWheelHandler = handleWheel
    } catch {
      // ignore bridge setup errors; scrolling should not crash the editor
    }
  }, [editMode, iframeRef])

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
      const target = event.target instanceof Element ? event.target : null
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
      wireHtmlActions(doc)
      wireEditorWheelBridge(doc)
      syncHeightFromDocument(doc)
      injectEditorRuntime(doc)
    } catch {
      // Avoid breaking the Studio while the iframe document is still mounting.
    }
  }, [actionBindings, editMode, forceRuntimeReload, html, iframeRef, injectEditorRuntime, isIframeDocumentReady, syncHeightFromDocument, syncIframeTheme, wireEditorWheelBridge, wireHtmlActions])

  React.useEffect(() => {
    if (!editMode) {
      onElementSelect?.(null)
      onEditingChange?.(false)
      setInteractionLocked(false)
      onInteractionLockChange?.(false)
    }
  }, [editMode, onEditingChange, onElementSelect, onInteractionLockChange])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const syncIframeSize = () => {
      syncHeightFromDocument(iframeRef.current?.contentDocument)
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
    document.addEventListener("visibilitychange", handleVisibilitySync)

    return () => {
      window.removeEventListener("resize", syncIframeSize)
      window.removeEventListener("orientationchange", syncIframeSize)
      window.removeEventListener("focus", syncIframeSize)
      window.removeEventListener("pageshow", syncIframeSize)
      document.removeEventListener("visibilitychange", handleVisibilitySync)
    }
  }, [iframeRef, syncHeightFromDocument])

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
      wireHtmlActions(doc)
      wireEditorWheelBridge(doc)
      lastAppliedHtmlRef.current = html
      if (!lastLiveSnapshotRef.current) {
        lastLiveSnapshotRef.current = html
      }

      // Auto-height
      const report = () => syncHeightFromDocument(doc)
      report()
      const win = iframe.contentWindow as unknown as { ResizeObserver?: new (cb: () => void) => { observe: (el: Element) => void; disconnect: () => void } }
      let ro: { observe: (el: Element) => void; disconnect: () => void } | null = null
      if (win?.ResizeObserver) {
        ro = new win.ResizeObserver(report)
        ro.observe(doc.body)
        ro.observe(doc.documentElement)
      }
      const mo = new MutationObserver(report)
      mo.observe(doc.documentElement, { childList: true, subtree: true, characterData: true, attributes: true })
      window.setTimeout(report, 0)
      window.setTimeout(report, 120)
      window.setTimeout(report, 360)

      injectEditorRuntime(doc)
      ;(iframe as HTMLIFrameElement & { __heCleanupObservers?: () => void }).__heCleanupObservers?.()
      ;(iframe as HTMLIFrameElement & { __heCleanupObservers?: () => void }).__heCleanupObservers = () => {
        ro?.disconnect()
        mo.disconnect()
      }
    } catch {
      // sandboxed or cross-origin — silent
    }
  }

  React.useEffect(() => {
    return () => {
      const iframe = iframeRef.current as (HTMLIFrameElement & { __heCleanupObservers?: () => void }) | null
      iframe?.__heCleanupObservers?.()
      if (iframe) delete iframe.__heCleanupObservers
      onInteractionLockChange?.(false)
    }
  }, [iframeRef, onInteractionLockChange])

  if (!html.trim()) return null

  return (
    <section
      className={editMode ? "relative min-h-0 w-full overflow-visible" : "relative w-full"}
      data-he-html-interaction-locked={interactionLocked ? "1" : undefined}
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
        scrolling="auto"
        style={{
          width: "100%",
          height,
          border: "none",
          display: "block",
          overflow: "auto",
          touchAction: interactionLocked ? "none" : "auto",
          cursor: editMode ? "crosshair" : undefined,
        }}
        title="custom-block"
      />
    </section>
  )
}
