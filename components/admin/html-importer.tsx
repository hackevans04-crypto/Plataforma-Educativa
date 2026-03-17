"use client"

import React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

function detectHtmlContent(html: string) {
  const lower = html.toLowerCase()
  const screenCount = (html.match(/class="[^"]*screen[^"]*"/g) ?? []).length
  const stepCount   = (html.match(/class="[^"]*step[^"]*"/g)   ?? []).length
  const hasTimer    = lower.indexOf("timer") !== -1 || lower.indexOf("countdown") !== -1 || lower.indexOf("tiempo") !== -1
  const hasScore    = lower.indexOf("score") !== -1 || lower.indexOf("resultado") !== -1 || lower.indexOf("puntaje") !== -1
  const hasForm     = (html.match(/<form/gi) ?? []).length > 0 || (html.match(/<input/gi) ?? []).length > 2
  const hasCards    = (html.match(/class="[^"]*card[^"]*"/g) ?? []).length > 2
  const scriptCount = (html.match(/<script/gi) ?? []).length
  const styleCount  = (html.match(/<style/gi) ?? []).length
  const h1Match     = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ?? html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title       = h1Match ? h1Match[1].replace(/<[^>]*>/g, "").trim().slice(0, 60) : "Sin titulo"
  const hasSteps    = screenCount > 1 || stepCount > 1
  let label = "Contenido libre"
  let emoji = "D"
  if (hasSteps && (hasScore || hasTimer)) { label = "Simulador / Quiz";    emoji = "S" }
  else if (hasSteps)                      { label = "Flujo multi-paso";     emoji = "F" }
  else if (hasForm)                       { label = "Formulario";           emoji = "R" }
  else if (hasCards)                      { label = "Landing / Tarjetas";   emoji = "L" }
  return { label, emoji, title, hasForm, hasSteps, hasTimer, hasScore, scriptCount, styleCount }
}

function scopeHtml(raw: string, id: string): string {
  const styles  = (raw.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? []).map(s => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
  const bMatch  = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body    = bMatch ? bMatch[1] : raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  const scripts = (raw.match(/<script(?![^>]*src)[^>]*>([\s\S]*?)<\/script>/gi) ?? []).map(s => s.replace(/<\/?script[^>]*>/gi, "")).join("\n")
  const css = styles.split("}").map((rule) => {
    if (!rule.trim()) return ""
    return rule.replace(/([^{,]+)(,?)(?=[^{]*\{)/g, (_m: string, sel: string, comma: string) => {
      const t = sel.trim()
      if (!t || t[0] === "@") return sel
      return "#" + id + " " + t + comma
    }) + "}"
  }).join("\n")
  return "<style>\n#" + id + "{all:initial;display:block;}\n" + css + "\n</style>\n<div id=\"" + id + "\">" + body + "</div>\n<script>(function(){\n" + scripts + "\n})();<\/script>"
}

export function HtmlImporter({ onCreateSection }: {
  onCreateSection: (type: string, data: Record<string, unknown>) => void
}) {
  const [mode, setMode]             = React.useState("idle")
  const [detection, setDetection]   = React.useState<Record<string, unknown> | null>(null)
  const [rawHtml, setRawHtml]       = React.useState("")
  const [fileName, setFileName]     = React.useState("")
  const [importMode, setImportMode] = React.useState("sandbox")
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const html = (e.target?.result ?? "") as string
      setRawHtml(html)
      setDetection(detectHtmlContent(html))
      setMode("detected")
    }
    reader.readAsText(file)
  }

  const handleConfirm = () => {
    if (!detection || !rawHtml) return
    const id      = "hi_" + Date.now()
    const html    = importMode === "sandbox" ? scopeHtml(rawHtml, id) : rawHtml
    const nota    = "Importado: " + fileName + " - " + String(detection.label)
    onCreateSection("customCode", { html, nota })
    setMode("done")
    setTimeout(() => { setMode("idle"); setDetection(null); setRawHtml(""); setFileName("") }, 2500)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (mode === "done") return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-center">
      <div className="text-sm font-semibold text-emerald-400 mt-2">Bloque creado correctamente</div>
      <div className="text-xs text-white/45 mt-1">{fileName}</div>
    </div>
  )

  if (mode === "detected" && detection) return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4">
        <div className="mb-2">
          <div className="text-sm font-semibold text-white truncate">{String(detection.title)}</div>
          <div className="text-xs text-primary font-semibold">{String(detection.label)}</div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {detection.hasSteps    && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">Multi-paso</span>}
          {detection.hasTimer    && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">Temporizador</span>}
          {detection.hasScore    && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">Resultados</span>}
          {detection.hasForm     && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">Formulario</span>}
          {Number(detection.scriptCount) > 0 && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">{String(detection.scriptCount)} scripts</span>}
          {Number(detection.styleCount)  > 0 && <span className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-white/60">{String(detection.styleCount)} estilos</span>}
        </div>
      </div>
      <div className="space-y-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Modo de importacion</div>
        {[
          { val: "sandbox", lbl: "Sandbox aislado",  desc: "CSS y JS protegidos. Recomendado para simuladores." },
          { val: "adapt",   lbl: "Codigo directo",   desc: "Inserta el HTML sin aislamiento." },
        ].map(({ val, lbl, desc }) => (
          <button key={val} onClick={() => setImportMode(val)}
            className={cn("w-full text-left rounded-xl border p-3 transition-all",
              importMode === val ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/18")}>
            <div className={cn("text-sm font-medium", importMode === val ? "text-primary" : "text-white")}>{lbl}</div>
            <div className="text-[11px] text-white/40 mt-0.5 leading-4">{desc}</div>
          </button>
        ))}
      </div>
      <div className="flex gap-2 pt-1">
        <button onClick={() => setMode("idle")}
          className="flex-1 h-10 rounded-xl border border-white/10 text-sm text-white/60 hover:text-white hover:border-white/25 transition-all">
          Cancelar
        </button>
        <button onClick={handleConfirm}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-10 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" />Crear bloque
        </button>
      </div>
    </div>
  )

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
      className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all p-6 text-center cursor-pointer group">
      <input ref={fileRef} type="file" accept=".html,text/html" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="text-4xl mb-2 group-hover:scale-110 transition-transform select-none">&#128194;</div>
      <div className="text-sm font-semibold text-white mb-1">Importar HTML</div>
      <div className="text-[11px] text-white/40 leading-4">Clic o arrastra un archivo .html</div>
    </div>
  )
}
