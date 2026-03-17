"use client"

import React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSSectionType } from "@/hooks/use-cms"

// ============================================================
// PHASE 1 — PARSER
// ============================================================

interface ParsedHtml {
  styles: string[]
  scripts: string[]
  body: string
  title: string
  raw: string
}

function parseHtml(raw: string): ParsedHtml {
  const styles = (raw.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) ?? [])
    .map((s) => s.replace(/<\/?style[^>]*>/gi, ""))

  const scripts = (raw.match(/<script(?![^>]*\bsrc\b)[^>]*>([\s\S]*?)<\/script>/gi) ?? [])
    .map((s) => s.replace(/<\/?script[^>]*>/gi, ""))

  const bMatch = raw.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  const body = bMatch
    ? bMatch[1]
    : raw
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<\/?html[^>]*>/gi, "")
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")

  const h1Match =
    raw.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i) ??
    raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const title = h1Match
    ? h1Match[1].replace(/<[^>]*>/g, "").trim().slice(0, 60)
    : "Sin titulo"

  return { styles, scripts, body, title, raw }
}

// ============================================================
// PHASE 2 — CLASSIFIER
// ============================================================

type HtmlType = "simulator" | "form" | "landing" | "widget" | "content"
type ImportMode = "sandbox" | "hybrid" | "adapted"

interface HtmlElements {
  buttons: number
  inputs: number
  cards: number
  steps: number
  scripts: number
  styles: number
  hasTimer: boolean
  hasScore: boolean
  hasForms: boolean
  hasVideo: boolean
}

interface Detection {
  label: string
  type: HtmlType
  title: string
  elements: HtmlElements
  recommendation: ImportMode
}

function classify(raw: string, parsed: ParsedHtml): Detection {
  const lower = raw.toLowerCase()

  const buttons = (raw.match(/<button/gi) ?? []).length
  const inputs  = (raw.match(/<input/gi) ?? []).length + (raw.match(/<select/gi) ?? []).length
  const forms   = (raw.match(/<form/gi) ?? []).length
  const cards   = (raw.match(/class="[^"]*card[^"]*"/g) ?? []).length
  const screens = (raw.match(/class="[^"]*screen[^"]*"/g) ?? []).length
  const steps   = (raw.match(/class="[^"]*step[^"]*"/g) ?? []).length

  const hasTimer = lower.includes("timer") || lower.includes("countdown") || lower.includes("tiempo")
  const hasScore = lower.includes("score") || lower.includes("resultado") || lower.includes("puntaje")
  const hasForms = forms > 0 || inputs > 2
  const hasSteps = screens > 1 || steps > 1
  const hasVideo = lower.includes("<video") || lower.includes("youtube") || lower.includes("vimeo")

  let type: HtmlType = "content"
  let label = "Contenido libre"

  if (hasSteps && (hasScore || hasTimer)) { type = "simulator"; label = "Simulador / Quiz" }
  else if (hasSteps)                       { type = "simulator"; label = "Flujo multi-paso" }
  else if (hasForms)                       { type = "form";      label = "Formulario" }
  else if (cards > 2)                      { type = "landing";   label = "Landing / Tarjetas" }

  // Complex HTML with scripts → sandbox (don't touch); forms/buttons → hybrid; simple → adapted
  const recommendation: ImportMode =
    parsed.scripts.length > 0 || hasSteps || hasTimer ? "sandbox" :
    hasForms || buttons > 0                            ? "hybrid"  : "adapted"

  return {
    label, type, title: parsed.title,
    elements: {
      buttons, inputs, cards,
      steps: screens + steps,
      scripts: parsed.scripts.length,
      styles: parsed.styles.length,
      hasTimer, hasScore, hasForms, hasVideo,
    },
    recommendation,
  }
}

// ============================================================
// PHASE 3 — CSS SCOPER (used only in adapted mode)
// ============================================================

const ELEMENT_RE = /^(html|body|\*|:root|button|input|select|textarea|h[1-6]|p|a\b|ul|ol|li|table|th|td|form|label)([\s,{:]|$)/i

function scopeStylesheet(css: string, id: string): string {
  const chunks = css.split(/(?<=\})/)
  return chunks.map((chunk) => {
    const trimmed = chunk.trim()
    if (!trimmed) return ""
    if (trimmed.startsWith("@keyframes") || trimmed.startsWith("@font-face")) return chunk
    if (trimmed.startsWith("@")) return chunk

    const braceIdx = trimmed.indexOf("{")
    if (braceIdx === -1) return ""

    const selPart  = trimmed.slice(0, braceIdx)
    const declPart = trimmed.slice(braceIdx + 1).replace(/\}$/, "")

    const scopedSels = selPart
      .split(",")
      .map((s) => {
        const t = s.trim()
        if (!t) return ""
        if (/^(html|body|:root|\*)(\s|,|$)/i.test(t)) return "#" + id
        if (ELEMENT_RE.test(t)) return "#" + id + " " + t
        return "#" + id + " " + t
      })
      .filter(Boolean)
      .join(", ")

    return scopedSels + " {" + declPart + "}"
  }).join("\n")
}

// ============================================================
// PHASE 4 — VISUAL ADAPTER tokens (adapted mode only)
// ============================================================

function buildSystemStyles(id: string): string {
  const s = "#" + id
  return [
    s + "{--p:var(--primary,#E8392A);--sf:rgba(255,255,255,.04);--sb:rgba(255,255,255,.10);--st:var(--foreground,#fff);--sm:rgba(255,255,255,.5);--sr:.75rem;--ff:var(--font-sans,system-ui,-apple-system,sans-serif);all:initial;display:block;box-sizing:border-box;font-family:var(--ff)!important;color:var(--st);}",
    s + " *{box-sizing:border-box;font-family:var(--ff)!important;}",
    s + " h1," + s + " h2," + s + " h3," + s + " h4," + s + " h5," + s + " h6{color:var(--st)!important;font-weight:700!important;line-height:1.2!important;}",
    s + " p," + s + " span," + s + " li," + s + " label{color:var(--st)!important;}",
    s + " button," + s + " [type=button]," + s + " [type=submit]{background:var(--p)!important;color:#fff!important;border:none!important;border-radius:var(--sr)!important;padding:.5rem 1.25rem!important;font-weight:600!important;font-size:.875rem!important;cursor:pointer!important;transition:opacity .15s!important;}",
    s + " button:hover{opacity:.85!important;}",
    s + " input," + s + " select," + s + " textarea{background:var(--sf)!important;border:1px solid var(--sb)!important;border-radius:var(--sr)!important;color:var(--st)!important;padding:.5rem .875rem!important;font-size:.875rem!important;width:100%!important;outline:none!important;}",
    s + " input:focus," + s + " select:focus," + s + " textarea:focus{border-color:var(--p)!important;box-shadow:0 0 0 2px rgba(232,57,42,.2)!important;}",
    s + " input::placeholder," + s + " textarea::placeholder{color:var(--sm)!important;}",
    s + " [class*=card]{background:var(--sf)!important;border:1px solid var(--sb)!important;border-radius:var(--sr)!important;}",
    s + " a{color:var(--p)!important;text-decoration:none!important;}",
  ].join("\n")
}

// ============================================================
// PHASE 5 — BUILDER
// Sandbox: raw HTML untouched (iframe handles isolation)
// Hybrid:  raw HTML + system override <style> injected at end
// Adapted: strip original CSS, inject system tokens
// ============================================================

function buildHtml(parsed: ParsedHtml, mode: ImportMode): string {
  const { raw, styles, scripts, body } = parsed

  // ── SANDBOX: don't touch anything ──
  if (mode === "sandbox") {
    return raw
  }

  // ── HYBRID: inject override CSS into the original document ──
  if (mode === "hybrid") {
    const overrides = [
      "<style>",
      "  *, *::before, *::after { font-family: var(--font-sans, system-ui, -apple-system, sans-serif) !important; }",
      "  button, [type=button], [type=submit] { background:var(--primary,#E8392A)!important; color:#fff!important; border:none!important; border-radius:.75rem!important; font-weight:600!important; cursor:pointer!important; }",
      "  button:hover { opacity:.85!important; }",
      "  input, select, textarea { background:rgba(255,255,255,.05)!important; border:1px solid rgba(255,255,255,.12)!important; border-radius:.75rem!important; color:inherit!important; }",
      "  input:focus, select:focus, textarea:focus { border-color:var(--primary,#E8392A)!important; outline:none!important; }",
      "</style>",
    ].join("\n")

    // If it's a full document, insert overrides before </head> or </body>
    if (/<\/head>/i.test(raw)) {
      return raw.replace(/<\/head>/i, overrides + "\n</head>")
    }
    if (/<\/body>/i.test(raw)) {
      return raw.replace(/<\/body>/i, overrides + "\n</body>")
    }
    return overrides + "\n" + raw
  }

  // ── ADAPTED: strip original CSS, inject system tokens ──
  const id = "hi_" + Date.now()

  const strippedBody = body
  const scopedCss    = styles.map((s) => scopeStylesheet(s, id)).join("\n")
  const systemCss    = buildSystemStyles(id)
  const scriptBlock  = scripts.join("\n").trim()
    ? "<script>(function(){\n" + scripts.join("\n") + "\n})();<\/script>"
    : ""

  return (
    "<style>\n" + systemCss + "\n/* scoped originals */\n" + scopedCss + "\n</style>\n" +
    "<div id=\"" + id + "\">" + strippedBody + "</div>\n" +
    scriptBlock
  )
}

// ============================================================
// COMPONENT
// ============================================================

const MODES: Array<{ val: ImportMode; lbl: string; badge?: string; desc: string }> = [
  {
    val: "sandbox", lbl: "Sandbox", badge: "Recomendado",
    desc: "HTML original sin modificar. CSS y JS funcionan exactamente como en el archivo. Maximo nivel de fidelidad.",
  },
  {
    val: "hybrid", lbl: "Hibrido",
    desc: "Conserva el HTML y JS originales. Sobreescribe solo botones, inputs y tipografia con el estilo del sistema.",
  },
  {
    val: "adapted", lbl: "Adaptado al sistema",
    desc: "Elimina el CSS original. Aplica completamente el design system. Solo para HTML simples sin mucho JS.",
  },
]

const TYPE_ICON: Record<HtmlType, string> = {
  simulator: "🎮",
  form:      "📋",
  landing:   "🏠",
  widget:    "🔧",
  content:   "📄",
}

const MODE_COLOR: Record<ImportMode, string> = {
  sandbox: "border-emerald-500/20 bg-emerald-500/5 text-emerald-400/80",
  hybrid:  "border-amber-500/20 bg-amber-500/5 text-amber-400/80",
  adapted: "border-white/8 bg-white/3 text-white/40",
}

const MODE_INFO: Record<ImportMode, string> = {
  sandbox: "HTML original intacto · CSS vivo · JS ejecuta · Scripts funcionan · Iframe aislado",
  hybrid:  "HTML original intacto · JS ejecuta · Botones e inputs del sistema sobreescritos",
  adapted: "CSS original eliminado · Tokens del sistema aplicados · Solo para HTML simples",
}

export function HtmlImporter({ onCreateSection }: {
  onCreateSection: (type: CMSSectionType, data: Record<string, unknown>) => void
}) {
  const [uiMode, setUiMode]         = React.useState("idle")
  const [detection, setDetection]   = React.useState<Detection | null>(null)
  const [parsed, setParsed]         = React.useState<ParsedHtml | null>(null)
  const [fileName, setFileName]     = React.useState("")
  const [importMode, setImportMode] = React.useState<ImportMode>("sandbox")
  const fileRef = React.useRef<HTMLInputElement>(null)

  const handleFile = (file: File) => {
    if (!file) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      const html = (e.target?.result ?? "") as string
      const p = parseHtml(html)
      const d = classify(html, p)
      setParsed(p)
      setDetection(d)
      setImportMode(d.recommendation)
      setUiMode("detected")
    }
    reader.readAsText(file)
  }

  const handleConfirm = () => {
    if (!detection || !parsed) return
    const html = buildHtml(parsed, importMode)
    onCreateSection("customCode", {
      html,
      nota: "Importado: " + fileName + " [" + importMode + "] - " + detection.label,
    })
    setUiMode("done")
    setTimeout(() => {
      setUiMode("idle"); setDetection(null); setParsed(null); setFileName("")
    }, 2500)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  // ---- Done ----
  if (uiMode === "done") return (
    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
      <div className="text-sm font-semibold text-emerald-400">Bloque creado</div>
      <div className="text-xs text-white/45 mt-1">{fileName}</div>
    </div>
  )

  // ---- Detected ----
  if (uiMode === "detected" && detection && parsed) return (
    <div className="space-y-3">

      {/* Detection card */}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
        <div className="flex items-start gap-2 mb-2">
          <span className="text-2xl leading-none mt-0.5">{TYPE_ICON[detection.type]}</span>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">{detection.title}</div>
            <div className="text-xs text-primary font-semibold">{detection.label}</div>
          </div>
        </div>

        {(() => {
          const el = detection.elements
          const counts = [
            { v: el.buttons, l: "botones" },
            { v: el.inputs,  l: "campos" },
            { v: el.cards,   l: "cards" },
            { v: el.steps,   l: "pasos" },
            { v: el.scripts, l: "scripts" },
            { v: el.styles,  l: "estilos" },
          ].filter((x) => x.v > 0)
          return counts.length > 0 ? (
            <div className="grid grid-cols-3 gap-1 mb-2">
              {counts.map(({ v, l }) => (
                <div key={l} className="rounded-lg bg-white/5 px-2 py-1 text-center">
                  <div className="text-xs font-bold text-white">{v}</div>
                  <div className="text-[10px] text-white/40">{l}</div>
                </div>
              ))}
            </div>
          ) : null
        })()}

        <div className="flex flex-wrap gap-1">
          {detection.elements.hasTimer && <span className="rounded-full bg-amber-500/15 border border-amber-500/20 px-2 py-0.5 text-[10px] text-amber-400">Temporizador</span>}
          {detection.elements.hasScore && <span className="rounded-full bg-blue-500/15 border border-blue-500/20 px-2 py-0.5 text-[10px] text-blue-400">Resultados</span>}
          {detection.elements.hasForms && <span className="rounded-full bg-green-500/15 border border-green-500/20 px-2 py-0.5 text-[10px] text-green-400">Formulario</span>}
          {detection.elements.hasVideo && <span className="rounded-full bg-purple-500/15 border border-purple-500/20 px-2 py-0.5 text-[10px] text-purple-400">Video</span>}
        </div>
      </div>

      {/* Mode selector */}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30 mb-1.5">Motor de importacion</div>
        <div className="space-y-1.5">
          {MODES.map(({ val, lbl, badge, desc }) => (
            <button key={val} onClick={() => setImportMode(val)}
              className={cn("w-full text-left rounded-xl border p-2.5 transition-all",
                importMode === val ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/15")}>
              <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                <span className={cn("text-sm font-semibold", importMode === val ? "text-primary" : "text-white")}>
                  {lbl}
                </span>
                {badge && (
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                    val === detection.recommendation
                      ? "bg-primary/20 text-primary"
                      : "bg-white/8 text-white/30"
                  )}>{badge}</span>
                )}
                {val === detection.recommendation && !badge && importMode !== val && (
                  <span className="rounded-full bg-white/8 px-1.5 py-0.5 text-[9px] text-white/35 uppercase tracking-wide">
                    sugerido
                  </span>
                )}
              </div>
              <div className="text-[11px] text-white/40 leading-4">{desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mode info */}
      <div className={cn("rounded-xl border p-2.5 text-[11px] leading-5", MODE_COLOR[importMode])}>
        {MODE_INFO[importMode]}
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={() => setUiMode("idle")}
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

  // ---- Idle ----
  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      onClick={() => fileRef.current?.click()}
      className="rounded-2xl border-2 border-dashed border-white/10 hover:border-primary/40 transition-all p-5 text-center cursor-pointer group"
    >
      <input
        ref={fileRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />
      <div className="text-3xl mb-2 group-hover:scale-110 transition-transform select-none">&#128194;</div>
      <div className="text-sm font-semibold text-white mb-1">HTML Smart Import</div>
      <div className="text-[11px] text-white/35 leading-4">
        Clic o arrastra un archivo .html<br />
        Simuladores · Formularios · Landings · Widgets
      </div>
    </div>
  )
}
