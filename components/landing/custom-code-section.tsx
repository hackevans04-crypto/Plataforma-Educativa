"use client"

import React from "react"

interface CustomCodeSectionProps {
  data: Record<string, unknown>
}

export default function CustomCodeSection({ data }: CustomCodeSectionProps) {
  const html = (data.html as string) ?? ""
  const iframeRef = React.useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = React.useState(480)

  // Wrap partial HTML in a full document so CSS + JS work correctly
  const isFullDoc = /<html[\s>]/i.test(html)
  const srcdoc = isFullDoc
    ? html
    : [
        "<!DOCTYPE html>",
        "<html>",
        "<head>",
        "<meta charset=\"utf-8\">",
        "<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">",
        "<style>*, *::before, *::after{box-sizing:border-box} html,body{margin:0;padding:0;width:100%;}</style>",
        "</head>",
        "<body>",
        html,
        "</body>",
        "</html>",
      ].join("\n")

  // Listen for resize messages from the iframe
  React.useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object" && e.data.__hei_resize) {
        setHeight(Math.max(120, Number(e.data.__hei_resize)))
      }
    }
    window.addEventListener("message", onMsg)
    return () => window.removeEventListener("message", onMsg)
  }, [])

  const handleLoad = () => {
    const iframe = iframeRef.current
    if (!iframe) return
    try {
      const doc = iframe.contentDocument
      if (!doc || !doc.body) return
      const report = () => {
        const h = doc.documentElement.scrollHeight || doc.body.scrollHeight
        if (h > 0) window.postMessage({ __hei_resize: h }, "*")
      }
      report()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const win = iframe.contentWindow as any
      if (win && win.ResizeObserver) {
        const ro = new win.ResizeObserver(report)
        ro.observe(doc.body)
      }
    } catch {
      // sandboxed or cross-origin — use default height
    }
  }

  if (!html.trim()) return null

  return (
    <section className="relative w-full">
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        onLoad={handleLoad}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
        style={{ width: "100%", height, border: "none", display: "block", overflow: "hidden" }}
        title="custom-block"
      />
    </section>
  )
}
