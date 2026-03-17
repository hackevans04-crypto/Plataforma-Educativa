"use client"

import React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSSectionType } from "@/hooks/use-cms"

// ---- Detection ----

function detectHtmlContent(html: string) {
  const lower       = html.toLowerCase()
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
  if (hasSteps && (hasScore || hasTimer)) label = "Simulador / Quiz"
  else if (hasSteps)                      label = "Flujo multi-paso"
  else if (hasForm)                       label = "Formulario"
  else if (hasCards)                      label = "Landing / Tarjetas"
  return { label, title, hasForm, hasSteps, hasTimer, hasScore, scriptCount, styleCount }
}

// ---- CSS Scoping ----

// These global selectors must never escape the sandbox
const GLOBAL_RE = /^(html|body|\*|:root)(\s*[,{]|$)/i

function scopeStylesheet(rawCss: string, id: string, stripBg: boolean): string {
  // Split on closing braces, preserving @-rule blocks
  const chunks = rawCss.split(/(?<=\})/)
  return chunks.map((chunk) => {
    const trimmed = chunk.trim()
    if (!trimmed) return ""

    // Pass @keyframes, @media etc. through but scope nested selectors for @media
    if (trimmed.startsWith("@")) return chunk

    const braceIdx = trimmed.indexOf("{")
    if (braceIdx === -1) return ""
    const selPart  = trimmed.slice(0, braceIdx)
    let   declPart = trimmed.slice(braceIdx + 1).replace(/\}$/, "")

    const selectors = selPart.split(",").map((s) => s.trim()).filter(Boolean)

    const scopedSels = selectors.map((s) => {
      if (GLOBAL_RE.test(s)) {
        // Strip background/color declarations from global rules
        if (stripBg) {
          declPart = declPart
            .replace(/background(-color|-image|-gradient)?\s*:[^;]+;/gi, "")
            .replace(/(?<![a-z-])color\s*:[^;]+;/gi, "")
        }
        return "#" + id
      }
      return "#" + id + " " + s
    }).join(", ")

    return scopedSels + " {" + declPart + "}"
  }).join("\n")
}

function buildOverrides(id: string, opts: { systemFonts: boolean; systemButtons: boolean; systemInputs: boolean; stripBg: boolean }): string {
  const rules: string[] = []
  if (opts.stripBg) {
    rules.push("#" + id + " { background: transparent !important; }")
  }
  if (opts.systemFonts) {
    rules.push("#" + id + ", #" + id + " * { font-family: inherit !important; }")
  }
  if (opts.systemButtons) {
    rules.push(
      "#" + id + " button, #" + id + " [type=button], #" + id + " [type=submit] {" +
      "background:var(--primary,#E8392A)!important;color:#fff!important;border:none!important;" +
      "border-radius:.75rem!important;padding:.5rem 1.25rem!important;font-weight:600!important;cursor:pointer!important;transition:opacity .15s!important;}"
    )
    rules.push("#" + id + " button:hover{opacity:.85!important;}")
  }
  if (opts.systemInputs) {
    rules.push(
      "#" + id + " input, #" + id + " select, #" + id + " textarea {" +
      "background:rgba(255,255,255,.05)!important;border:1px solid rgba(255,255,255,.12)!important;" +
      "border-radius:.75rem!important;color:inherit!important;padding:.5rem .875rem!important;" +
      "font-size:.875rem!important;width:100%!important;box-sizing:border-box!important;}"
    )
    rules.push(
      "#" + id + " input:focus, #" + id + " select:focus, #" + id + " textarea:focus {" +
      "outline:none!important;border-color:var(--primary,#E8392A)!important;}"
    )
  }
  return rules.join("\n")
}

function buildHtml(raw: string, id: string, mode: string, opts: { stripBg: boolean; systemFonts: boolean; systemButtons: boolean; systemInputs: boolean }): string {
  if (mode === "direct") return raw

  const rawStyles = (raw.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [])
    .map((s) => s.replace(/<\/?style[^>]*>/gi, "")).join("\n")
  const bMatch  = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body    = bMatch
    ? bMatch[1]
    : raw.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "").replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
  const scripts = (raw.match(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi) ?? [])
    .map((s) => s.replace(/<\/?script[^>]*>/gi, "")).join("\n")

  const stripBg     = mode === "hybrid" ? true : opts.stripBg
  const scopedCss   = scopeStylesheet(rawStyles, id, stripBg)
  const overrideCss = mode === "hybrid" ? buildOverrides(id, { stripBg: true, systemFonts: true, systemButtons: true, systemInputs: true }) : buildOverrides(id, opts)

  return (
    "<style>\n#" + id + "{all:initial;display:block;box-sizing:border-box;}\n" +
    scopedCss + "\n" + overrideCss + "\n</style>\n" +
    "<div id=\"" + id + "\">" + body + "</div>\n" +
    "<script>(function(){\n" + scripts + "\n})();<\/script>"
  )
}

// ---- Component ----

const MODES = [
  { val: "sandbox", lbl: "Sandbox",  desc: "CSS aislado en contenedor unico. Conserva el diseno original." },
  { val: "hybrid",  lbl: "Hibrido",  desc: "CSS aislado + botones, inputs y tipografia del sistema." },
  { val: "direct",  lbl: "Directo",  desc: "Inserta el HTML tal cual, sin aislamiento." },
]

export function HtmlImporter({ onCreateSection }: {
  onCreateSection: (type: CMSSectionType, data: Record<string, unknown>) => void
}) {
  const [mode, setMode]         = React.useState("idle")
  const [detection, setDetection] = React.useState<ReturnType<typeof detectHtmlContent> | null>(null)
  const [rawHtml, setRawHtml]   = React.useState("")
  const [fileName, setFileName] = React.useState("")
  const [importMode, setImportMode] = React.useState("sandbox")
  const [opts, setOpts]         = React.useState({ stripBg: true, systemFonts: true, systemButtons: false, systemInputs: false })
  const fileRef = React.useRef<HTMLInputElement>(null)

  const toggle = (key: keyof typeof opts) => setOpts((o) => ({ ...o, [key]: !o[key] }))

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
    const id   = "hi_" + Date.now()
    const html = buildHtml(rawHtml, id, importMode, opts)
    onCreateSection("customCode", { html, nota: "Importado: " + fileName + " [" + importMode + "] - " + detection.label })
    setMode("done")
    setTimeout(() => { setMode("idle"); setDetection(null); setRawHtml(""); setFileName("") }, 2500)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (mode === "done") return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
      <div className="text-sm font-semibold text-emerald-400">Bloque creado</div>
      <div className="text-xs text-white/45 mt-1">{fileName}</div>
    </div>
  )

  if (mode === "detected" && detection) return (
    <div className="space-y-3">

      {/* Detection card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
        <div className="text-sm font-semibold text-white truncate mb-0.5">{detection.title}</div>
        <div className="text-xs text-primary font-semibold mb-2">{detection.label}</div>
        <div className="flex flex-wrap gap-1">
          {detection.hasSteps  && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">Multi-paso</span>}
          {detection.hasTimer  && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">Temporizador</span>}
          {detection.hasScore  && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">Resultados</span>}
          {detection.hasForm   && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">Formulario</span>}
          {detection.scriptCount > 0 && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">{detection.scriptCount} scripts</span>}
          {detection.styleCount  > 0 && <span className="rounded-full bg-white/5 border border-white/8 px-2 py-0.5 text-[10px] text-white/55">{detection.styleCount} estilos</span>}
        </div>
      </div>

      {/* Mode selector */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-1.5">Modo de importacion</div>
        <div className="space-y-1.5">
          {MODES.map(({ val, lbl, desc }) => (
            <button key={val} onClick={() => setImportMode(val)}
              className={cn("w-full text-left rounded-xl border p-2.5 transition-all",
                importMode === val ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/15")}>
              <div className={cn("text-sm font-semibold", importMode === val ? "text-primary" : "text-white")}>{lbl}</div>
              <div className="text-[11px] text-white/40 leading-4">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Adaptation options — only for sandbox mode */}
      {importMode === "sandbox" && (
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-1.5">Adaptacion visual</div>
          <div className="rounded-xl border border-white/8 divide-y divide-white/5">
            {[
              { key: "stripBg"       as const, lbl: "Quitar fondo del importado",    desc: "Elimina background de body/:root" },
              { key: "systemFonts"   as const, lbl: "Tipografia del sistema",         desc: "Hereda font-family del editor" },
              { key: "systemButtons" as const, lbl: "Botones del sistema",            desc: "Aplica estilos del boton primario" },
              { key: "systemInputs"  as const, lbl: "Campos del sistema",             desc: "Estilo de inputs/select del editor" },
            ].map(({ key, lbl, desc }) => (
              <label key={key} className="flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-white/[0.03] transition-colors">
                <div
                  onClick={() => toggle(key)}
                  className={cn(
                    "w-8 h-4 rounded-full transition-all flex-shrink-0 relative",
                    opts[key] ? "bg-primary" : "bg-white/10"
                  )}>
                  <div className={cn(
                    "absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all",
                    opts[key] ? "left-4.5" : "left-0.5"
                  )} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-white">{lbl}</div>
                  <div className="text-[10px] text-white/35">{desc}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setMode("idle")}
          className="flex-1 h-9 rounded-xl border border-white/10 text-sm text-white/55 hover:text-white hover:border-white/20 transition-all">
          Cancelar
        </button>
        <button onClick={handleConfirm}
          className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all">
          <Plus className="w-3.5 h-3.5" />Crear bloque
        </button>
      </div>
    </div>
  )

  return (
    <div onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onClick={() => fileRef.current?.click()}
      className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all p-5 text-center cursor-pointer group">
      <input ref={fileRef} type="file" accept=".html,text/html" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform select-none">&#128194;</div>
      <div className="text-sm font-semibold text-white mb-1">Importar HTML</div>
      <div className="text-[11px] text-white/35 leading-4">Clic o arrastra un archivo .html<br/>Simuladores · Formularios · Landings</div>
    </div>
  )
}
