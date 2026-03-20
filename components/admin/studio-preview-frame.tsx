"use client"

import React from "react"
import { createPortal } from "react-dom"

const FRAME_DOCUMENT = [
  "<!DOCTYPE html>",
  "<html lang=\"es\">",
  "<head>",
  "<meta charset=\"utf-8\" />",
  "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\" />",
  "</head>",
  "<body>",
  "<div id=\"he-studio-preview-root\"></div>",
  "</body>",
  "</html>",
].join("")

interface StudioPreviewFrameProps {
  children: React.ReactNode
  title?: string
  className?: string
  viewportHeight?: number | null
  editorMode?: "edit" | "preview" | "review"
}

function copyParentStyles(targetDocument: Document, simulateViewport: boolean) {
  const styleMountId = "he-studio-preview-styles"
  const parentDocument = window.document
  let styleMount = targetDocument.getElementById(styleMountId)

  if (!styleMount) {
    styleMount = targetDocument.createElement("div")
    styleMount.id = styleMountId
    targetDocument.head.appendChild(styleMount)
  }

  const nodes = Array.from(parentDocument.head.querySelectorAll("style, link[rel='stylesheet']"))
  styleMount.replaceChildren(...nodes.map((node) => node.cloneNode(true)))

  targetDocument.documentElement.className = parentDocument.documentElement.className
  targetDocument.body.className = parentDocument.body.className
  targetDocument.body.style.margin = "0"
  targetDocument.body.style.background = "transparent"

  targetDocument.body.style.setProperty("overflow-x", "hidden", "important")
  targetDocument.documentElement.style.setProperty("overflow-x", "hidden", "important")
  targetDocument.documentElement.style.setProperty("width", "100%", "important")
  targetDocument.body.style.setProperty("width", "100%", "important")
  targetDocument.body.style.setProperty("box-sizing", "border-box", "important")
  targetDocument.documentElement.style.setProperty("box-sizing", "border-box", "important")

  if (simulateViewport) {
    targetDocument.documentElement.style.setProperty("height", "100%", "important")
    targetDocument.body.style.setProperty("height", "100%", "important")
    targetDocument.documentElement.style.setProperty("min-height", "100%", "important")
    targetDocument.body.style.setProperty("min-height", "100%", "important")
    targetDocument.documentElement.style.setProperty("overflow-y", "auto", "important")
    targetDocument.body.style.setProperty("overflow-y", "auto", "important")
    targetDocument.body.style.setProperty("overscroll-behavior-y", "contain", "important")
    targetDocument.body.style.setProperty("-webkit-overflow-scrolling", "touch", "important")
  } else {
    // Prevent horizontal scrollbar inside the preview iframe.
    // Some embedded pages may still set overflow-x/width via their own styles.
    // Using !important ensures our editor frame stays constrained.
    targetDocument.body.style.setProperty("overflow-y", "visible", "important")
    targetDocument.body.style.setProperty("min-height", "0", "important")
    targetDocument.documentElement.style.setProperty("overflow-y", "visible", "important")
  }

  // Ensure preview root and all descendants cannot trigger horizontal scroll.
  const previewOverrideStyleId = "he-studio-preview-overrides"
  let overrideStyle = targetDocument.getElementById(previewOverrideStyleId) as HTMLStyleElement | null
  if (!overrideStyle) {
    overrideStyle = targetDocument.createElement("style")
    overrideStyle.id = previewOverrideStyleId
    targetDocument.head.appendChild(overrideStyle)
  }

  overrideStyle.textContent = `
    html, body, #he-studio-preview-root {
      width: 100% !important;
      overflow-x: hidden !important;
      box-sizing: border-box !important;
      min-height: ${simulateViewport ? "100%" : "0"} !important;
    }

    html, body {
      height: ${simulateViewport ? "100%" : "auto"} !important;
      overflow-y: ${simulateViewport ? "auto" : "visible"} !important;
    }

    /* Hide any horizontal scrollbar that might appear inside the iframe */
    html::-webkit-scrollbar, body::-webkit-scrollbar, *::-webkit-scrollbar {
      width: 0 !important;
      height: 0 !important;
    }

    html, body, * {
      scrollbar-width: none !important;
      -ms-overflow-style: none !important;
    }
  `
}

function getDocumentHeight(doc: Document) {
  const previewRoot = doc.getElementById("he-studio-preview-root")
  const rootRect = previewRoot ? Math.ceil(previewRoot.getBoundingClientRect().height || 0) : 0
  const rootScrollHeight = previewRoot?.scrollHeight || 0
  const bodyRect = Math.ceil(doc.body?.getBoundingClientRect().height || 0)
  const bodyScrollHeight = doc.body?.scrollHeight || 0

  return Math.max(
    rootRect,
    rootScrollHeight,
    bodyRect,
    bodyScrollHeight,
    doc.body?.offsetHeight || 0,
    320
  )
}

export default function StudioPreviewFrame({
  children,
  title = "Vista previa responsive",
  className,
  viewportHeight = null,
  editorMode = "preview",
}: StudioPreviewFrameProps) {
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [mountNode, setMountNode] = React.useState<HTMLElement | null>(null)
  const [frameHeight, setFrameHeight] = React.useState(640)
  const simulateViewport = Boolean(viewportHeight && viewportHeight > 0)

  const syncFrameDocument = React.useCallback(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!doc?.head || !doc.body) return

    copyParentStyles(doc, simulateViewport)

    let root = doc.getElementById("he-studio-preview-root")
    if (!root) {
      root = doc.createElement("div")
      root.id = "he-studio-preview-root"
      doc.body.appendChild(root)
    }

    root.setAttribute("data-he-studio-preview-root", "1")
    root.setAttribute("data-he-editor-mode", editorMode)
    root.style.minHeight = simulateViewport ? "100%" : "0"
    root.style.width = "100%"
    root.style.position = "relative"
    doc.documentElement.setAttribute("data-he-editor-mode", editorMode)
    doc.body.setAttribute("data-he-editor-mode", editorMode)

    setMountNode(root)
    setFrameHeight(simulateViewport ? viewportHeight ?? 640 : getDocumentHeight(doc))
  }, [editorMode, simulateViewport, viewportHeight])

  React.useEffect(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const handleLoad = () => {
      syncFrameDocument()
    }

    iframe.addEventListener("load", handleLoad)
    syncFrameDocument()

    return () => {
      iframe.removeEventListener("load", handleLoad)
    }
  }, [syncFrameDocument])

  React.useEffect(() => {
    if (typeof window === "undefined") return

    const observer = new MutationObserver(() => {
      syncFrameDocument()
    })

    observer.observe(window.document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    })

    return () => observer.disconnect()
  }, [syncFrameDocument])

  React.useEffect(() => {
    const iframe = iframeRef.current
    const doc = iframe?.contentDocument
    if (!iframe || !doc?.body) return

    const report = () => {
      setFrameHeight(simulateViewport ? viewportHeight ?? 640 : getDocumentHeight(doc))
    }

    report()

    const frameWindow = iframe.contentWindow as (Window & { ResizeObserver?: typeof ResizeObserver }) | null
    const frameResizeObserver =
      frameWindow?.ResizeObserver ??
      (typeof ResizeObserver !== "undefined" ? ResizeObserver : null)
    const resizeObserver = frameResizeObserver ? new frameResizeObserver(report) : null
    resizeObserver?.observe(doc.documentElement)
    resizeObserver?.observe(doc.body)

    const handleWheel = (event: WheelEvent) => {
      if (simulateViewport) return
      if (!event.deltaX && !event.deltaY) return

      const scrollRoot =
        (iframe.closest?.("[data-he-studio-scroll-root='1']") as HTMLElement | null) ??
        (iframe.parentElement?.closest?.("[data-he-studio-scroll-root='1']") as HTMLElement | null) ??
        (document.querySelector("[data-he-studio-scroll-root='1']") as HTMLElement | null)

      if (!scrollRoot) return

      event.preventDefault()
      event.stopPropagation()

      if (typeof scrollRoot.scrollBy === "function") {
        scrollRoot.scrollBy({
          top: event.deltaY,
          left: event.deltaX,
          behavior: "auto",
        })
      } else {
        scrollRoot.scrollTop += event.deltaY
        scrollRoot.scrollLeft += event.deltaX
      }
    }

    if (!simulateViewport) {
      doc.addEventListener("wheel", handleWheel, { passive: false, capture: true })
    }

    return () => {
      resizeObserver?.disconnect()
      if (!simulateViewport) {
        doc.removeEventListener("wheel", handleWheel, true)
      }
    }
  }, [mountNode, simulateViewport, viewportHeight])

  return (
    <>
      <iframe
        ref={iframeRef}
        title={title}
        srcDoc={FRAME_DOCUMENT}
        className={className}
        scrolling={simulateViewport ? "yes" : "no"}
        style={{
          width: "100%",
          height: `${simulateViewport ? viewportHeight ?? frameHeight : frameHeight}px`,
          border: "none",
          display: "block",
          background: "transparent",
        }}
      />
      {mountNode ? createPortal(children, mountNode) : null}
    </>
  )
}
