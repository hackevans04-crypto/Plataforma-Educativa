"use client"

import React from "react"
import type { EditorElementInfo } from "@/components/admin/html-editor-bridge"

interface CustomCodeSectionProps {
  data: Record<string, unknown>
  /** When true, injects the editor runtime so elements become selectable */
  editMode?: boolean
  /** Called with the element info when user clicks inside the iframe */
  onElementSelect?: (info: EditorElementInfo) => void
  /** Expose the iframe ref so parent can send postMessage commands */
  iframeRef?: React.RefObject<HTMLIFrameElement>
}

export default function CustomCodeSection({
  data,
  editMode = false,
  onElementSelect,
  iframeRef: externalRef,
}: CustomCodeSectionProps) {
  const html = (data.html as string) ?? ""
  const internalRef = React.useRef<HTMLIFrameElement>(null)
  const iframeRef   = externalRef ?? internalRef
  const [height, setHeight] = React.useState(480)

  // Listen for messages from the iframe (resize + editor selection)
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return

      // Auto-height
      if (e.data.__hei_resize) {
        setHeight(Math.max(120, Number(e.data.__hei_resize)))
      }

      // Editor selection
      if (e.data.__editor_select && onElementSelect) {
        onElementSelect(e.data.info as EditorElementInfo)
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [onElementSelect])

  const handleLoad = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument
      if (!doc || !doc.body) return

      // Auto-height
      const report = () => {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight
        if (h > 0) window.postMessage({ __hei_resize: h }, "*")
      }
      report()
      const win = iframe.contentWindow as unknown as { ResizeObserver?: new (cb: () => void) => { observe: (el: Element) => void } }
      if (win?.ResizeObserver) {
        const ro = new win.ResizeObserver(report)
        ro.observe(doc.body)
      }

      // Inject editor runtime in edit mode
      if (editMode) {
        // Dynamic import to avoid pulling the bridge string into the public bundle
        import("@/components/admin/html-editor-bridge").then(({ buildEditorRuntime }) => {
          const script = doc.createElement("script")
          script.textContent = buildEditorRuntime()
          doc.body.appendChild(script)
        })
      }
    } catch {
      // sandboxed or cross-origin — silent
    }
  }

  if (!html.trim()) return null

  // Build full document if needed
  const isFullDoc = /<html[\s>]/i.test(html)
  const srcdoc = isFullDoc
    ? html
    : [
        "<!DOCTYPE html><html>",
        "<head>",
        "<meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<style>*,*::before,*::after{box-sizing:border-box} html,body{margin:0;padding:0;width:100%;}</style>",
        "</head>",
        "<body>",
        html,
        "</body></html>",
      ].join("\n")

  return (
    <section className="relative w-full">
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        onLoad={handleLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        style={{
          width: "100%",
          height,
          border: "none",
          display: "block",
          overflow: "hidden",
          cursor: editMode ? "crosshair" : undefined,
        }}
        title="custom-block"
      />
    </section>
  )
}
