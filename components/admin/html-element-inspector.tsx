"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { EditorCommand, EditorElementInfo } from "./html-editor-bridge"
import { IconPicker } from "./icon-picker"
import {
  EMOJI_ICON_MAP,
  escapeHtml,
  findKnownEmojis,
  findSiteIconsInHtml,
  replaceFirstIconInHtmlFragment,
  replaceKnownEmojisInHtmlFragment,
  renderSiteIconHtml,
  type SiteIconName,
} from "@/lib/site-icon-registry"

type InspectorTab = "style" | "content" | "layers"
type NodeKind = "image" | "button" | "field" | "icon" | "text" | "container"
type InsertPlacement = "beforebegin" | "afterbegin" | "beforeend" | "afterend"
type InspectorView = "full" | "style" | "content"
type QuickInsertTemplate = {
  group: string
  key: string
  label: string
  hint: string
  html: string
}
const INSPECTOR_TABS = [
  { key: "content", label: "Contenido" },
  { key: "style", label: "Estilo" },
  { key: "layers", label: "Capas" },
] as const

const CONTAINER_TAGS = new Set(["div", "section", "article", "main", "header", "footer", "aside", "nav", "form", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th"])
const FONT_OPTIONS = [
  { value: "var(--he-font-sans, 'Barlow', system-ui, sans-serif)", label: "Sitio" },
  { value: "'Barlow', system-ui, sans-serif", label: "Barlow" },
  { value: "'Space Grotesk', system-ui, sans-serif", label: "Space" },
  { value: "'Merriweather', Georgia, serif", label: "Serif" },
  { value: "'IBM Plex Mono', monospace", label: "Mono" },
]
const PRESET_BUTTON_CLS = "rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm leading-5 text-white transition-all hover:border-primary/35 hover:text-primary"

function toHex(css: string) {
  const match = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!match) return "#000000"
  return "#" + [match[1], match[2], match[3]].map((value) => parseInt(value, 10).toString(16).padStart(2, "0")).join("")
}

function normalizeHex(value: string) {
  const match = value.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i)
  if (!match) return null
  const hex = match[1]
  if (hex.length === 3) {
    return `#${hex[0]}${hex[0]}${hex[1]}${hex[1]}${hex[2]}${hex[2]}`.toLowerCase()
  }
  return `#${hex}`.toLowerCase()
}

function extractFirstPaintColor(backgroundImage: string) {
  if (!backgroundImage || backgroundImage === "none") return null
  const hexMatch = backgroundImage.match(/#([0-9a-f]{3}|[0-9a-f]{6})/i)
  if (hexMatch) {
    return normalizeHex(hexMatch[0])
  }
  const rgbMatch = backgroundImage.match(/rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+/i)
  if (rgbMatch) {
    return toHex(rgbMatch[0])
  }
  return null
}

function getVisiblePaintColor(color: string, backgroundImage?: string) {
  if (!isTransparent(color)) return toHex(color)
  return extractFirstPaintColor(backgroundImage || "") || "#000000"
}

function isTransparent(css: string) {
  return !css || css === "transparent" || css === "rgba(0, 0, 0, 0)"
}

function parsePx(css: string) {
  return parseFloat(css) || 0
}

function getFieldCurrentValue(element: EditorElementInfo | null) {
  if (!element) return ""
  if (element.tag === "textarea") {
    return String(element.text || "")
  }
  return String(element.attrs?.value || "")
}

function parseSelectOptions(html: string | null | undefined) {
  if (!html) return ""
  try {
    const doc = new DOMParser().parseFromString(`<select>${html}</select>`, "text/html")
    const options = Array.from(doc.querySelectorAll("option"))
    return options
      .map((option) => {
        const value = option.getAttribute("value") || option.textContent || ""
        const label = option.textContent || value
        return `${String(value).trim()}|${String(label).trim()}`
      })
      .join("\n")
  } catch {
    return ""
  }
}

function buildSelectOptionsMarkup(source: string) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...rest] = line.split("|")
      const value = rawValue.trim()
      const label = (rest.join("|").trim() || value)
      return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`
    })
    .join("")
}

function parseSelectOptionEntries(source: string) {
  return source
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [rawValue, ...rest] = line.split("|")
      const value = rawValue.trim()
      const label = (rest.join("|").trim() || value)
      return { value, label }
    })
    .filter((entry) => entry.value.length > 0)
}

function resolveSafeIconSize(element: EditorElementInfo | null, fallback = 24) {
  if (!element) return fallback

  const candidates = [
    parsePx(element.styles.fontSize),
    parsePx(element.styles.width),
    parsePx(element.styles.height),
    parsePx(element.styles.maxWidth),
    parsePx(element.styles.maxHeight),
  ].filter((value) => value > 0 && value <= 220)

  if (candidates.length === 0) return fallback

  const preferred = candidates[0] || fallback
  return Math.max(12, Math.min(220, Math.round(preferred)))
}

function resolveSafeIconStrokeWidth(element: EditorElementInfo | null, fallback = 1.9) {
  if (!element) return fallback
  return Math.max(0.75, Math.min(4, parseFloat(element.styles.strokeWidth || "") || fallback))
}

function looksLikeIconElement(element: EditorElementInfo | null) {
  if (!element) return false
  const tag = String(element.tag || "").toLowerCase()
  const classes = String(element.classes || "").toLowerCase()
  const html = String(element.html || "").toLowerCase()
  const text = String(element.text || "").trim()
  const childCount = element.children?.length ?? 0
  return (
    tag === "svg" ||
    ["path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "g", "use"].includes(tag) ||
    !!element.attrs?.dataIcon ||
    classes.includes("he-inline-icon") ||
    classes.includes("lucide") ||
    ((["span", "i", "em", "strong", "small", "button", "a"].includes(tag) || childCount <= 2) && html.includes("<svg") && text.length <= 2) ||
    (["span", "i", "em", "strong", "small"].includes(tag) && findKnownEmojis(text).length > 0 && text.length <= 6)
  )
}

function getElementTextValue(element: EditorElementInfo | null) {
  return String(element?.text || "").replace(/\s+/g, " ").trim()
}

function hasVisualChrome(element: EditorElementInfo | null) {
  if (!element) return false
  const background = element.styles.backgroundColor || ""
  const borderWidth = parsePx(element.styles.borderWidth)
  const borderRadius = parsePx(element.styles.borderRadius)
  return (
    (!!background && !isTransparent(background)) ||
    borderWidth > 0 ||
    borderRadius > 0 ||
    (!!element.styles.boxShadow && element.styles.boxShadow !== "none")
  )
}

function hasNestedComplexHtml(element: EditorElementInfo | null) {
  const html = String(element?.html || "").toLowerCase()
  return /<(input|textarea|select|button|a|img|video|iframe|table|ul|ol)\b/.test(html)
}

function looksLikeButtonContainer(element: EditorElementInfo | null) {
  if (!element || element.id === "he-import-root") return false
  const tag = String(element.tag || "").toLowerCase()
  if (["img", "input", "textarea", "select"].includes(tag)) return false
  if (element.isActionable || looksLikeIconElement(element)) return false
  if (!["div", "span", "label", "li", "p"].includes(tag)) return false
  if (hasNestedComplexHtml(element)) return false
  const text = getElementTextValue(element)
  const childCount = element.children?.length ?? 0
  if (!text || text.length > 90 || childCount > 4) return false
  const display = String(element.styles.display || "").toLowerCase()
  const inlineLike = display.includes("inline") || display.includes("flex") || display.includes("grid")
  const html = String(element.html || "").toLowerCase()
  const hasIcon = !!element.attrs?.dataIcon || html.includes("<svg") || html.includes("data-he-icon") || findKnownEmojis(text).length > 0
  return (hasVisualChrome(element) || hasIcon) && inlineLike
}

function looksLikeTextContainer(element: EditorElementInfo | null) {
  if (!element || element.id === "he-import-root") return false
  const tag = String(element.tag || "").toLowerCase()
  if (["img", "input", "textarea", "select"].includes(tag)) return false
  if (element.isActionable || looksLikeIconElement(element) || looksLikeButtonContainer(element)) return false
  if (!["div", "span", "label", "li", "p"].includes(tag)) return false
  if (hasNestedComplexHtml(element)) return false
  const text = getElementTextValue(element)
  const childCount = element.children?.length ?? 0
  if (!text || text.length > 180 || childCount > 3) return false
  return true
}

function detectNodeKind(element: EditorElementInfo | null) {
  const explicit = (element as { nodeType?: string | null } | null)?.nodeType
  if (explicit && ["image", "button", "field", "icon", "text", "container"].includes(explicit)) {
    return explicit as NodeKind
  }
  if (!element) return "container" as NodeKind
  const tag = String(element.tag || "").toLowerCase()
  if (tag === "img") return "image" as NodeKind
  if (["input", "textarea", "select"].includes(tag)) return "field" as NodeKind
  if (element.isActionable || looksLikeButtonContainer(element)) return "button" as NodeKind
  if (looksLikeIconElement(element)) {
    return "icon" as NodeKind
  }
  if (element.isText || looksLikeTextContainer(element)) return "text" as NodeKind
  return "container" as NodeKind
}

function getQuickInsertTemplates(): QuickInsertTemplate[] {
  return [
    {
      group: "Texto",
      key: "badge",
      label: "Badge",
      hint: "Etiqueta superior",
      html: `<span style="display:inline-flex;align-items:center;gap:.45rem;padding:.45rem .9rem;border-radius:999px;border:1px solid color-mix(in srgb, var(--he-primary,#E8392A) 38%, transparent);background:rgba(232,57,42,.08);color:var(--he-primary,#E8392A);font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Nuevo badge</span>`,
    },
    {
      group: "Texto",
      key: "title",
      label: "Titulo",
      hint: "Encabezado principal",
      html: `<h2 style="margin:0 0 14px;font-size:clamp(28px,4vw,42px);font-weight:800;line-height:1.08;color:var(--he-foreground,#E2EAF0)">Nuevo titulo</h2>`,
    },
    {
      group: "Texto",
      key: "subtitle",
      label: "Subtitulo",
      hint: "Apoyo del titulo",
      html: `<h3 style="margin:0 0 12px;font-size:clamp(18px,2.4vw,24px);font-weight:700;line-height:1.3;color:var(--he-foreground,#E2EAF0)">Nuevo subtitulo</h3>`,
    },
    {
      group: "Texto",
      key: "paragraph",
      label: "Parrafo",
      hint: "Texto descriptivo",
      html: `<p style="margin:0 0 16px;font-size:16px;line-height:1.7;color:var(--he-muted,rgba(226,234,240,.72))">Agrega aqui una descripcion, instrucciones o contenido libre.</p>`,
    },
    {
      group: "Accion",
      key: "button",
      label: "Boton",
      hint: "CTA editable",
      html: `<a href="#" role="button" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:44px;max-width:100%;padding:.8rem 1.2rem;border-radius:18px;background:var(--he-primary,#E8392A);color:#fff;font-weight:700;text-decoration:none;border:1px solid color-mix(in srgb, var(--he-primary,#E8392A) 70%, #ffffff 8%);box-shadow:0 10px 26px rgba(232,57,42,.18);white-space:normal;text-align:center;overflow-wrap:anywhere">Nuevo boton</a>`,
    },
    {
      group: "Accion",
      key: "secondary-button",
      label: "Boton ghost",
      hint: "Accion secundaria",
      html: `<a href="#" role="button" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:44px;max-width:100%;padding:.8rem 1.2rem;border-radius:18px;background:transparent;color:var(--he-foreground,#E2EAF0);font-weight:700;text-decoration:none;border:1px solid var(--he-border,rgba(120,144,171,.18));white-space:normal;text-align:center;overflow-wrap:anywhere">Accion secundaria</a>`,
    },
    {
      group: "Formulario",
      key: "input",
      label: "Campo input",
      hint: "Texto, correo o telefono",
      html: `<input type="text" name="campo" placeholder="Escribe aqui" style="display:block;width:100%;min-height:48px;padding:.85rem 1rem;border-radius:16px;border:1px solid var(--he-border,rgba(120,144,171,.18));background:var(--he-surface,rgba(13,24,38,.82));color:var(--he-foreground,#E2EAF0);font:500 15px/1.4 var(--he-font-sans,'Barlow',system-ui,sans-serif)" />`,
    },
    {
      group: "Formulario",
      key: "textarea",
      label: "Textarea",
      hint: "Mensaje o descripcion",
      html: `<textarea name="mensaje" placeholder="Escribe tu mensaje" rows="4" style="display:block;width:100%;min-height:120px;padding:.95rem 1rem;border-radius:16px;border:1px solid var(--he-border,rgba(120,144,171,.18));background:var(--he-surface,rgba(13,24,38,.82));color:var(--he-foreground,#E2EAF0);font:500 15px/1.6 var(--he-font-sans,'Barlow',system-ui,sans-serif);resize:vertical"></textarea>`,
    },
    {
      group: "Formulario",
      key: "select",
      label: "Selector",
      hint: "Lista desplegable",
      html: `<select name="selector" style="display:block;width:100%;min-height:48px;padding:.85rem 1rem;border-radius:16px;border:1px solid var(--he-border,rgba(120,144,171,.18));background:var(--he-surface,rgba(13,24,38,.82));color:var(--he-foreground,#E2EAF0);font:500 15px/1.4 var(--he-font-sans,'Barlow',system-ui,sans-serif)"><option value="opcion-1">Opcion 1</option><option value="opcion-2">Opcion 2</option><option value="opcion-3">Opcion 3</option></select>`,
    },
    {
      group: "Formulario",
      key: "checkbox",
      label: "Checkbox",
      hint: "Aceptacion o permiso",
      html: `<label style="display:flex;align-items:center;gap:.75rem;color:var(--he-foreground,#E2EAF0);font:500 14px/1.4 var(--he-font-sans,'Barlow',system-ui,sans-serif)"><input type="checkbox" name="acepto" style="width:18px;height:18px;accent-color:var(--he-primary,#E8392A)" />Acepto las condiciones</label>`,
    },
    {
      group: "Formulario",
      key: "radio",
      label: "Radio",
      hint: "Seleccion unica",
      html: `<label style="display:flex;align-items:center;gap:.75rem;color:var(--he-foreground,#E2EAF0);font:500 14px/1.4 var(--he-font-sans,'Barlow',system-ui,sans-serif)"><input type="radio" name="opcion" value="opcion-1" style="width:18px;height:18px;accent-color:var(--he-primary,#E8392A)" />Opcion unica</label>`,
    },
    {
      group: "Formulario",
      key: "submit",
      label: "Boton enviar",
      hint: "Envio del formulario",
      html: `<button type="submit" style="display:inline-flex;align-items:center;justify-content:center;gap:.55rem;min-height:44px;max-width:100%;padding:.8rem 1.2rem;border-radius:18px;background:var(--he-primary,#E8392A);color:#fff;font-weight:700;border:1px solid color-mix(in srgb, var(--he-primary,#E8392A) 70%, #ffffff 8%);box-shadow:0 10px 26px rgba(232,57,42,.18)">Enviar formulario</button>`,
    },
    {
      group: "Organizacion",
      key: "navbar",
      label: "Navbar",
      hint: "Cabecera simple",
      html: `<header style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:18px;padding:18px 22px;border-radius:22px;background:var(--he-nav-bg,rgba(7,15,24,.96));border:1px solid var(--he-nav-border,rgba(232,57,42,.12))"><div style="display:flex;align-items:center;gap:12px;font-size:14px;font-weight:800;color:var(--he-foreground,#E2EAF0);letter-spacing:.08em;text-transform:uppercase">Marca del sitio</div><nav style="display:flex;flex-wrap:wrap;gap:14px"><a href="#" style="color:var(--he-foreground,#E2EAF0);font-size:13px;font-weight:700;text-decoration:none">Inicio</a><a href="#" style="color:var(--he-foreground,#E2EAF0);font-size:13px;font-weight:700;text-decoration:none">Servicios</a><a href="#" style="color:var(--he-foreground,#E2EAF0);font-size:13px;font-weight:700;text-decoration:none">Contacto</a></nav></header>`,
    },
    {
      group: "Organizacion",
      key: "card",
      label: "Tarjeta",
      hint: "Bloque visual",
      html: `<div data-card="1" style="padding:24px;border-radius:18px;background:var(--he-surface,rgba(13,24,38,.82));border:1px solid var(--he-border,rgba(120,144,171,.18));box-shadow:0 10px 24px rgba(0,0,0,.16)"><h3 style="margin:0 0 10px;font-size:22px;font-weight:800;color:var(--he-foreground,#E2EAF0)">Nueva tarjeta</h3><p style="margin:0;color:var(--he-muted,rgba(226,234,240,.72));line-height:1.7">Contenido del bloque agregado desde el editor visual.</p></div>`,
    },
    {
      group: "Organizacion",
      key: "two-columns",
      label: "2 columnas",
      hint: "Bloque en dos columnas",
      html: `<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px"><div data-card="1" style="padding:20px;border-radius:18px;background:var(--he-surface,rgba(13,24,38,.82));border:1px solid var(--he-border,rgba(120,144,171,.18))"><h3 style="margin:0 0 10px;font-size:20px;font-weight:800;color:var(--he-foreground,#E2EAF0)">Columna 1</h3><p style="margin:0;color:var(--he-muted,rgba(226,234,240,.72));line-height:1.7">Edita este contenido desde el inspector.</p></div><div data-card="1" style="padding:20px;border-radius:18px;background:var(--he-surface,rgba(13,24,38,.82));border:1px solid var(--he-border,rgba(120,144,171,.18))"><h3 style="margin:0 0 10px;font-size:20px;font-weight:800;color:var(--he-foreground,#E2EAF0)">Columna 2</h3><p style="margin:0;color:var(--he-muted,rgba(226,234,240,.72));line-height:1.7">Ideal para bloques comparativos o features.</p></div></div>`,
    },
    {
      group: "Organizacion",
      key: "divider",
      label: "Separador",
      hint: "Linea visual",
      html: `<hr style="border:none;border-top:1px solid var(--he-border,rgba(120,144,171,.18));margin:0" />`,
    },
    {
      group: "Media",
      key: "image",
      label: "Imagen",
      hint: "Imagen editable",
      html: `<img src="https://placehold.co/960x420/0d1826/e2eaf0?text=Imagen" alt="Nueva imagen" style="display:block;width:100%;max-width:960px;height:auto;border-radius:18px;object-fit:cover" />`,
    },
    {
      group: "Media",
      key: "icon",
      label: "Icono",
      hint: "Icono del sistema",
      html: renderSiteIconHtml("sparkles", { size: 28, className: "he-inline-icon" }),
    },
    {
      group: "Organizacion",
      key: "spacer",
      label: "Espacio",
      hint: "Separacion visual",
      html: `<div aria-hidden="true" style="height:28px"></div>`,
    },
  ]
}

function formatLayerTitle(tag: string, label?: string, isRoot?: boolean) {
  if (isRoot) return "Bloque HTML"
  const normalized = (label || "").replace(/\s+/g, " ").trim()
  if (normalized) return normalized.slice(0, 42)
  const map: Record<string, string> = {
    h1: "Titulo",
    h2: "Titulo",
    h3: "Subtitulo",
    p: "Parrafo",
    img: "Imagen",
    svg: "Icono",
    input: "Campo",
    select: "Selector",
    textarea: "Campo de texto",
    a: "Boton / Link",
    button: "Boton",
    div: "Contenedor",
    section: "Seccion",
    span: "Texto breve",
  }
  return map[tag] || tag.toUpperCase()
}

function formatNodeKindLabel(kind: NodeKind) {
  const map: Record<NodeKind, string> = {
    text: "Texto",
    button: "Boton",
    field: "Campo",
    image: "Imagen",
    icon: "Icono",
    container: "Bloque",
  }
  return map[kind] || "Elemento"
}

function SectionCard({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div>
        <div className="text-[11px] font-semibold text-white">{title}</div>
        {hint ? <div className="mt-0.5 text-[10px] leading-4 text-white/35">{hint}</div> : null}
      </div>
      {children}
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5 py-1.5">
      <span className="block text-[10px] uppercase tracking-wide text-white/30">{label}</span>
      <div className="min-w-0">{children}</div>
    </div>
  )
}

function FieldInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "h-9 w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none",
        props.className
      )}
    />
  )
}

function FieldArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-[84px] w-full min-w-0 resize-none rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-white placeholder:text-white/25 focus:border-primary/50 focus:outline-none",
        props.className
      )}
    />
  )
}

function ColorPicker({
  value,
  onChange,
  displayValue,
}: {
  value: string
  onChange: (value: string) => void
  displayValue?: string
}) {
  const hex = displayValue || (isTransparent(value) ? "#000000" : toHex(value))
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <input
        type="color"
        className="h-7 w-7 cursor-pointer rounded border border-white/10 bg-transparent"
        value={hex}
        onInput={(event) => onChange((event.target as HTMLInputElement).value)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldInput value={hex} onChange={(event) => onChange(event.target.value)} className="h-8 min-w-[120px] flex-1 px-2 text-[11px]" />
      {isTransparent(value) ? <span className="text-[9px] text-white/25">auto</span> : null}
    </div>
  )
}

function Slider({
  value,
  onChange,
  min = 0,
  max = 120,
  step = 1,
  unit = "px",
}: {
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  unit?: string
}) {
  const number = parsePx(value)
  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className="h-1 flex-1 accent-primary"
        value={number}
        onInput={(event) => onChange(`${(event.target as HTMLInputElement).value}${unit}`)}
        onChange={(event) => onChange(`${event.target.value}${unit}`)}
      />
      <span className="w-12 text-right text-[10px] tabular-nums text-white/45">
        {number}
        {unit}
      </span>
    </div>
  )
}

function OptionGroup({
  value,
  options,
  onChange,
  small = false,
}: {
  value: string
  options: Array<{ value: string; label: string }>
  onChange: (value: string) => void
  small?: boolean
}) {
  const columns = options.length <= 1 ? 1 : options.length === 2 ? 2 : options.length === 4 ? 2 : 3
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "min-w-0 rounded-xl border text-center leading-4 transition-all whitespace-normal break-words",
            small ? "px-2 py-1 text-[10px]" : "px-2 py-1.5 text-[11px]",
            value === option.value
              ? "border-primary bg-primary/10 text-primary"
              : "border-white/8 text-white/40 hover:border-primary/35 hover:text-white"
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function InspectorTabButton({
  active,
  children,
  onClick,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "bg-transparent text-white/35 hover:bg-white/5 hover:text-white"
      )}
    >
      {children}
    </button>
  )
}

interface Props {
  element: EditorElementInfo | null
  isEditing: boolean
  iframeRef: React.RefObject<HTMLIFrameElement>
  onClose: () => void
  view?: InspectorView
}

export function HtmlElementInspector({ element, isEditing, iframeRef, onClose, view = "full" }: Props) {
  const [tab, setTab] = useState<InspectorTab>("content")
  const [localText, setLocalText] = useState("")
  const [localHref, setLocalHref] = useState("")
  const [localTarget, setLocalTarget] = useState("")
  const [localPlaceholder, setLocalPlaceholder] = useState("")
  const [localId, setLocalId] = useState("")
  const [localName, setLocalName] = useState("")
  const [localAutocomplete, setLocalAutocomplete] = useState("")
  const [localMin, setLocalMin] = useState("")
  const [localMax, setLocalMax] = useState("")
  const [localStep, setLocalStep] = useState("")
  const [localRows, setLocalRows] = useState("")
  const [localValue, setLocalValue] = useState("")
  const [localFieldType, setLocalFieldType] = useState("")
  const [localSelectOptions, setLocalSelectOptions] = useState("")
  const [isRequired, setIsRequired] = useState(false)
  const [isDisabled, setIsDisabled] = useState(false)
  const [isChecked, setIsChecked] = useState(false)
  const [isMultiple, setIsMultiple] = useState(false)
  const [localSrc, setLocalSrc] = useState("")
  const [localAlt, setLocalAlt] = useState("")
  const [localTitle, setLocalTitle] = useState("")
  const [dragOn, setDragOn] = useState(false)
  const [iconMode, setIconMode] = useState<"replace" | "prepend">("replace")
  const [insertPlacement, setInsertPlacement] = useState<InsertPlacement>("beforeend")
  const [customInsertHtml, setCustomInsertHtml] = useState("")
  const [iconImageSrc, setIconImageSrc] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)
  const textSectionRef = useRef<HTMLDivElement>(null)
  const imageSectionRef = useRef<HTMLDivElement>(null)
  const fieldSectionRef = useRef<HTMLDivElement>(null)
  const actionSectionRef = useRef<HTMLDivElement>(null)
  const insertSectionRef = useRef<HTMLDivElement>(null)
  const layersSectionRef = useRef<HTMLDivElement>(null)
  const containerContentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iconImageInputRef = useRef<HTMLInputElement>(null)
  const insertImageInputRef = useRef<HTMLInputElement>(null)
  const iconSectionRef = useRef<HTMLDivElement>(null)

  const nodeKind = useMemo(() => detectNodeKind(element), [element])
  const isImportRoot = element?.id === "he-import-root"
  const treatsAsButton = !!element && (element.isActionable || nodeKind === "button")
  const treatsAsText = !!element && (element.isText || nodeKind === "text" || nodeKind === "button")
  const lockedTab =
    view === "style"
      ? "style"
      : view === "content"
        ? "content"
        : null
  const activeTab = lockedTab ?? tab
  const detectedEmojis = useMemo(() => findKnownEmojis(`${element?.text || ""} ${element?.html || ""}`), [element?.text, element?.html])
  const existingIcons = useMemo(() => findSiteIconsInHtml(element?.html || ""), [element?.html])
  const currentIcon = (element?.attrs?.dataIcon || existingIcons[0] || EMOJI_ICON_MAP[detectedEmojis[0]]) as SiteIconName | undefined
  const visibleIconRefs = useMemo(
    () => Array.from(new Set([...(currentIcon ? [currentIcon] : []), ...existingIcons])),
    [currentIcon, existingIcons]
  )
  const supportsIconTools = nodeKind === "button" || nodeKind === "text" || nodeKind === "icon"
  const canInsertInside = !!element && CONTAINER_TAGS.has(element.tag)
  const quickInsertTemplates = useMemo(() => getQuickInsertTemplates(), [])
  const selectOptionEntries = useMemo(() => parseSelectOptionEntries(localSelectOptions), [localSelectOptions])
  const activeFieldType = localFieldType || element?.attrs?.type || ""
  const isChoiceField = !!element && element.tag === "input" && ["checkbox", "radio"].includes(activeFieldType)
  const supportsPlaceholder = !!element && (element.tag === "textarea" || (element.tag === "input" && !isChoiceField))
  const supportsAutocomplete = !!element && (element.tag === "input" || element.tag === "textarea")
  const supportsNumericRange = !!element && element.tag === "input" && ["number", "date", "time", "month", "week"].includes(activeFieldType)
  const supportsRows = !!element && element.tag === "textarea"

  useEffect(() => {
    setLocalText(element?.text ?? "")
    setLocalHref(element?.attrs?.href ?? "")
    setLocalTarget(element?.attrs?.target ?? "")
    setLocalPlaceholder(element?.attrs?.placeholder ?? "")
    setLocalId(element?.attrs?.id ?? "")
    setLocalName(element?.attrs?.name ?? "")
    setLocalAutocomplete(element?.attrs?.autocomplete ?? "")
    setLocalMin(element?.attrs?.min ?? "")
    setLocalMax(element?.attrs?.max ?? "")
    setLocalStep(element?.attrs?.step ?? "")
    setLocalRows(element?.attrs?.rows ?? "")
    setLocalValue(getFieldCurrentValue(element))
    setLocalFieldType(element?.attrs?.type ?? "")
    setLocalSelectOptions(parseSelectOptions(element?.html))
    setIsRequired(!!element?.attrs?.required)
    setIsDisabled(!!element?.attrs?.disabled)
    setIsChecked(!!element?.attrs?.checked)
    setIsMultiple(!!element?.attrs?.multiple)
    setLocalSrc(element?.attrs?.src ?? "")
    setLocalAlt(element?.attrs?.alt ?? "")
    setLocalTitle(element?.attrs?.title ?? "")
    setIconImageSrc("")
    setIconMode(treatsAsButton && existingIcons.length === 0 && detectedEmojis.length === 0 ? "prepend" : "replace")
    setInsertPlacement(canInsertInside ? "beforeend" : "afterend")
  }, [
    element?.eid,
    element?.text,
    element?.attrs?.href,
    element?.attrs?.target,
    element?.attrs?.placeholder,
    element?.attrs?.id,
    element?.attrs?.name,
    element?.attrs?.autocomplete,
    element?.attrs?.min,
    element?.attrs?.max,
    element?.attrs?.step,
    element?.attrs?.rows,
    element?.attrs?.value,
    element?.attrs?.type,
    element?.attrs?.required,
    element?.attrs?.disabled,
    element?.attrs?.checked,
    element?.attrs?.multiple,
    element?.attrs?.src,
    element?.attrs?.alt,
    element?.attrs?.title,
    element?.html,
    existingIcons.length,
    detectedEmojis.length,
    canInsertInside,
    treatsAsButton,
  ])

  useEffect(() => {
    if (lockedTab) {
      setTab(lockedTab)
      return
    }
    if (view === "full" && element?.eid) {
      setTab("content")
    }
  }, [element?.eid, lockedTab, view])

  useEffect(() => {
    if (view !== "full") return
    const frame = window.requestAnimationFrame(() => {
      const target =
        activeTab === "layers"
          ? layersSectionRef.current
          : activeTab === "style"
            ? rootRef.current
            : nodeKind === "icon"
              ? iconSectionRef.current
              : nodeKind === "field"
                ? fieldSectionRef.current
                : nodeKind === "image"
                  ? imageSectionRef.current
                  : nodeKind === "button"
                    ? actionSectionRef.current || textSectionRef.current
                    : nodeKind === "text"
                      ? textSectionRef.current
                      : containerContentRef.current || insertSectionRef.current

      target?.scrollIntoView({ block: "start", behavior: "smooth" })
    })
    return () => window.cancelAnimationFrame(frame)
  }, [activeTab, element?.eid, nodeKind, view])

  const send = useCallback((command: EditorCommand) => {
    iframeRef.current?.contentWindow?.postMessage(command, "*")
  }, [iframeRef])

  const style = (prop: string, value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "style", eid: element.eid, prop, value })
  }

  const queryStyle = (selector: string, prop: string, value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "style_query", eid: element.eid, selector, prop, value })
  }

  const batchStyle = (updates: Array<{ selector?: string; prop: string; value: string }>) => {
    if (!element?.eid || !updates.length) return
    send({ __editor_cmd: true, cmd: "style_batch", eid: element.eid, updates })
  }

  const patchIcon = (patch: { color?: string; size?: string; strokeWidth?: string }) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "icon_patch", eid: element.eid, ...patch } as EditorCommand)
  }

  const getIconHostClassName = () => {
    const classTokens = String(element?.classes || "")
      .split(/\s+/)
      .map((token) => token.trim())
      .filter(Boolean)

    if (!classTokens.includes("he-inline-icon")) {
      classTokens.push("he-inline-icon")
    }

    return classTokens.join(" ")
  }

  const buildCurrentIconMarkup = (iconName: SiteIconName, overrides?: { color?: string; size?: number }) => {
    if (!element?.eid) return ""
    const iconSize = Math.max(12, Math.min(220, Math.round(overrides?.size ?? resolveSafeIconSize(element, treatsAsButton ? 18 : 24))))
    return renderSiteIconHtml(iconName, {
      eid: element.eid,
      size: iconSize,
      color: overrides?.color || element.styles.color || "currentColor",
      strokeWidth: resolveSafeIconStrokeWidth(element),
      className: getIconHostClassName(),
    })
  }

  const replaceCurrentIconMarkup = (overrides?: { color?: string; size?: string }) => {
    if (!element?.eid || !currentIcon) return false
    const resolvedSize = Math.max(12, Math.min(220, parsePx(overrides?.size || element.styles.width || element.styles.height || element.styles.fontSize || "20px") || 20))
    replaceElementHtml(buildCurrentIconMarkup(currentIcon, {
      color: overrides?.color,
      size: resolvedSize,
    }))
    return true
  }

  const applyBackgroundPaint = (value: string) => {
    if (!element?.eid) return
    if (element.styles.backgroundImage && element.styles.backgroundImage !== "none") {
      style("backgroundImage", "none")
    }
    style("backgroundColor", value)
  }

  const attr = (name: string, value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "attr", eid: element.eid, attr: name, value })
  }

  const toggleAttr = (name: string, enabled: boolean) => {
    attr(name, enabled ? name : "")
  }

  const setText = (value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "text", eid: element.eid, value })
  }

  const setHtml = (value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "html", eid: element.eid, value })
  }

  const replaceElementHtml = (value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "replace", eid: element.eid, value })
  }

  const enableDrag = () => {
    if (!dragOn) {
      send({ __editor_cmd: true, cmd: "enable_drag" })
      setDragOn(true)
    }
  }

  const insertHtml = (value: string, placement: InsertPlacement = insertPlacement) => {
    if (!element?.eid || !value.trim()) return
    send({ __editor_cmd: true, cmd: "insert", eid: element.eid, position: placement, value })
  }

  const moveNode = (direction: "up" | "down", eid?: string | null) => {
    if (!eid) return
    send({ __editor_cmd: true, cmd: direction === "up" ? "move_up" : "move_down", eid })
  }

  const deleteNode = (eid?: string | null) => {
    if (!eid) return
    send({ __editor_cmd: true, cmd: "delete", eid })
  }

  const cleanupLayout = (eid?: string | null) => {
    send(eid ? { __editor_cmd: true, cmd: "cleanup_layout", eid } : { __editor_cmd: true, cmd: "cleanup_layout" })
  }

  const selectNode = (eid: string | null | undefined) => {
    if (!eid) return
    send({ __editor_cmd: true, cmd: "highlight", eid })
  }

  const applySystemStyles = (styles: Array<[string, string]>) => {
    styles.forEach(([prop, value]) => style(prop, value))
  }

  const applyFieldPreset = (mode: "default" | "select") => {
    applySystemStyles([
      ["backgroundImage", "none"],
      ["backgroundColor", "var(--he-surface, rgba(13,24,38,.82))"],
      ["color", "var(--he-foreground, #E2EAF0)"],
      ["borderColor", "var(--he-border, rgba(120,144,171,.18))"],
      ["borderWidth", "1px"],
      ["borderRadius", "16px"],
      ["padding", ".85rem 1rem"],
      ["fontFamily", FONT_OPTIONS[0].value],
      ["fontWeight", "500"],
      ["boxShadow", "none"],
      ["outline", "none"],
    ])
    if (mode === "select") {
      applySystemStyles([
        ["appearance", "none"],
        ["cursor", "pointer"],
        ["paddingRight", "1rem"],
      ])
      queryStyle("option", "backgroundColor", "#0d1826")
      queryStyle("option", "color", "#E2EAF0")
      queryStyle("option", "fontFamily", FONT_OPTIONS[0].value)
    }
  }

  const applyButtonPreset = (mode: "primary" | "ghost" | "chip") => {
    applySystemStyles([
      ["backgroundImage", "none"],
      ["display", "inline-flex"],
      ["alignItems", "center"],
      ["justifyContent", "center"],
      ["gap", ".55rem"],
      ["fontFamily", FONT_OPTIONS[0].value],
      ["fontWeight", "700"],
      ["textAlign", "center"],
      ["whiteSpace", "normal"],
      ["overflowWrap", "anywhere"],
      ["maxWidth", "100%"],
      ["minWidth", "0"],
      ["padding", mode === "chip" ? ".55rem .9rem" : ".8rem 1.2rem"],
      ["borderRadius", mode === "chip" ? "999px" : "18px"],
      ["borderWidth", "1px"],
      ["boxShadow", mode === "primary" ? "0 10px 26px rgba(232,57,42,.18)" : "none"],
    ])

    if (mode === "primary") {
      applySystemStyles([
        ["backgroundColor", "var(--he-primary, #E8392A)"],
        ["color", "#ffffff"],
        ["borderColor", "color-mix(in srgb, var(--he-primary, #E8392A) 70%, #ffffff 8%)"],
      ])
      return
    }

    if (mode === "ghost") {
      applySystemStyles([
        ["backgroundColor", "transparent"],
        ["color", "var(--he-foreground, #E2EAF0)"],
        ["borderColor", "var(--he-border, rgba(120,144,171,.18))"],
      ])
      return
    }

    applySystemStyles([
      ["backgroundColor", "rgba(255,255,255,.04)"],
      ["color", "var(--he-foreground, #E2EAF0)"],
      ["borderColor", "var(--he-border, rgba(120,144,171,.18))"],
    ])
  }

  const applyTextPreset = (mode: "title" | "body" | "eyebrow") => {
    if (mode === "title") {
      applySystemStyles([
        ["fontFamily", FONT_OPTIONS[0].value],
        ["fontSize", "clamp(28px, 4vw, 42px)"],
        ["fontWeight", "800"],
        ["lineHeight", "1.08"],
        ["letterSpacing", "-0.02em"],
        ["color", "var(--he-foreground, #E2EAF0)"],
      ])
      return
    }

    if (mode === "eyebrow") {
      applySystemStyles([
        ["fontFamily", FONT_OPTIONS[0].value],
        ["fontSize", "12px"],
        ["fontWeight", "700"],
        ["letterSpacing", ".08em"],
        ["textTransform", "uppercase"],
        ["color", "var(--he-primary, #E8392A)"],
      ])
      return
    }

    applySystemStyles([
      ["fontFamily", FONT_OPTIONS[0].value],
      ["fontSize", "16px"],
      ["fontWeight", "500"],
      ["lineHeight", "1.7"],
      ["letterSpacing", "0"],
      ["color", "var(--he-muted, rgba(226,234,240,.72))"],
    ])
  }

  const applyPanelPreset = () => {
    applySystemStyles([
      ["backgroundImage", "none"],
      ["backgroundColor", "var(--he-surface, rgba(13,24,38,.82))"],
      ["color", "var(--he-foreground, #E2EAF0)"],
      ["borderColor", "var(--he-border, rgba(120,144,171,.18))"],
      ["borderWidth", "1px"],
      ["borderRadius", "20px"],
      ["boxShadow", "0 10px 24px rgba(0,0,0,.16)"],
      ["padding", "24px"],
    ])
  }

  const applyIconColor = (value: string) => {
    patchIcon({ color: value })
  }

  const applyIconSize = (value: string) => {
    const safeSize = `${Math.max(12, Math.min(220, parsePx(value) || 20))}px`
    patchIcon({ size: safeSize })
  }

  const applyIconStrokeWidth = (value: string) => {
    const safeStroke = String(Math.max(0.75, Math.min(4, parseFloat(value) || 1.9)))
    patchIcon({ strokeWidth: safeStroke })
  }

  const applyDetectedEmojiReplacement = (forceIcon?: SiteIconName) => {
    if (!element?.eid) return
    if (nodeKind === "icon") {
      const forcedIcon = forceIcon || currentIcon || "sparkles"
      replaceElementHtml(buildCurrentIconMarkup(forcedIcon))
      return
    }
    const sourceHtml = (element.html && element.html.trim()) || escapeHtml(element.text || "")
    if (!sourceHtml) return
    const nextHtml = replaceKnownEmojisInHtmlFragment(sourceHtml, forceIcon ? { forceIcon } : undefined)
    if (nextHtml && nextHtml !== sourceHtml) {
      setHtml(nextHtml)
    }
  }

  const applyIcon = (iconName: SiteIconName) => {
    if (!element?.eid) return
    const strokeWidth = resolveSafeIconStrokeWidth(element)
    if (nodeKind === "icon") {
      replaceElementHtml(buildCurrentIconMarkup(iconName))
      return
    }
    const sourceHtml = (element.html && element.html.trim()) || escapeHtml(element.text || "")
    let nextHtml = sourceHtml

    if (iconMode === "prepend") {
      const iconMarkup = renderSiteIconHtml(iconName, {
        size: treatsAsButton ? 18 : 20,
        strokeWidth,
        className: "he-inline-icon",
      })
      nextHtml = `${iconMarkup}<span data-he-icon-label="1">${sourceHtml}</span>`
    } else if (existingIcons.length > 0 || detectedEmojis.length > 0) {
      nextHtml = replaceFirstIconInHtmlFragment(sourceHtml, iconName, {
        size: treatsAsButton ? 18 : 20,
        strokeWidth,
        className: "he-inline-icon",
      })
    } else {
      nextHtml = renderSiteIconHtml(iconName, { size: treatsAsButton ? 18 : 20, strokeWidth })
    }

    setHtml(nextHtml)
  }

  const replaceIconWithImage = (src: string) => {
    if (!element?.eid || !src.trim()) return
    const size = `${resolveSafeIconSize(element, 24)}px`
    replaceElementHtml(
      `<img src="${escapeHtml(src.trim())}" alt="Icono" title="${escapeHtml(element.attrs?.title || "Icono")}" style="display:inline-block;width:${size};height:${size};object-fit:contain;vertical-align:middle;border-radius:0;max-width:none" />`
    )
  }

  const handleIconImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return
      setIconImageSrc(result)
      replaceIconWithImage(result)
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return
      setLocalSrc(result)
      attr("src", result)
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const handleInsertImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : ""
      if (!result) return
      insertHtml(
        `<img src="${escapeHtml(result)}" alt="Nueva imagen" style="display:block;width:100%;max-width:960px;height:auto;border-radius:18px;object-fit:cover" />`
      )
    }
    reader.readAsDataURL(file)
    event.target.value = ""
  }

  const applyFieldValue = (value: string) => {
    if (!element) return
    if (element.tag === "textarea") {
      setText(value)
      return
    }
    attr("value", value)
  }

  const applySelectOptions = () => {
    if (!element || element.tag !== "select") return
    setHtml(buildSelectOptionsMarkup(localSelectOptions))
  }

  const renderTypographySection = () => {
    if (!element) return null
    if (nodeKind === "icon") {
      return (
        <SectionCard title="Iconografia" hint="Controla color, tamano y grosor del trazo del icono como en una libreria SVG moderna.">
          <Row label="Color del icono">
            <ColorPicker value={element.styles.color} onChange={applyIconColor} />
          </Row>
          <Row label="Tamano del icono">
            <Slider value={element.styles.width || element.styles.fontSize || "18px"} min={12} max={220} onChange={applyIconSize} />
          </Row>
          <Row label="Trazo del icono">
            <Slider value={element.styles.strokeWidth || "1.9"} min={0.8} max={4} step={0.1} unit="" onChange={applyIconStrokeWidth} />
          </Row>
        </SectionCard>
      )
    }
    return (
      <SectionCard title="Tipografia" hint="Controla tipo de letra, tamano, grosor, color y alineacion del texto.">
        <Row label="Color del texto">
          <ColorPicker value={element.styles.color} onChange={(value) => style("color", value)} />
        </Row>
        <Row label="Tipo de letra">
          <select
            className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
            value={element.styles.fontFamily || FONT_OPTIONS[0].value}
            onChange={(event) => style("fontFamily", event.target.value)}
          >
            {FONT_OPTIONS.map((option) => (
              <option key={option.label} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Tamano del texto">
          <Slider value={element.styles.fontSize} min={8} max={96} onChange={(value) => style("fontSize", value)} />
        </Row>
        <Row label="Grosor del texto">
          <OptionGroup
            small
            value={String(Math.round(parsePx(element.styles.fontWeight)) || 400)}
            options={["400", "500", "600", "700", "800"].map((value) => ({ value, label: value }))}
            onChange={(value) => style("fontWeight", value)}
          />
        </Row>
        <Row label="Estilo">
          <OptionGroup
            small
            value={element.styles.fontStyle || "normal"}
            options={[
              { value: "normal", label: "normal" },
              { value: "italic", label: "cursiva" },
            ]}
            onChange={(value) => style("fontStyle", value)}
          />
        </Row>
        <Row label="Decoracion">
          <OptionGroup
            small
            value={(element.styles.textDecoration || "none").includes("underline") ? "underline" : "none"}
            options={[
              { value: "none", label: "sin" },
              { value: "underline", label: "subrayado" },
            ]}
            onChange={(value) => style("textDecoration", value)}
          />
        </Row>
        <Row label="Transformacion">
          <OptionGroup
            small
            value={element.styles.textTransform || "none"}
            options={[
              { value: "none", label: "normal" },
              { value: "uppercase", label: "mayus" },
              { value: "capitalize", label: "titulo" },
              { value: "lowercase", label: "minus" },
            ]}
            onChange={(value) => style("textTransform", value)}
          />
        </Row>
        <Row label="Alineacion">
          <OptionGroup
            small
            value={element.styles.textAlign || "left"}
            options={[
              { value: "left", label: "izquierda" },
              { value: "center", label: "centro" },
              { value: "right", label: "derecha" },
              { value: "justify", label: "justificado" },
            ]}
            onChange={(value) => style("textAlign", value)}
          />
        </Row>
        <Row label="Altura entre lineas">
          <FieldInput
            value={element.styles.lineHeight || ""}
            placeholder="1.4 / 24px"
            onChange={(event) => style("lineHeight", event.target.value)}
            className="h-8 px-2 text-[11px]"
          />
        </Row>
        <Row label="Espaciado entre letras">
          <FieldInput
            value={element.styles.letterSpacing || ""}
            placeholder="0.02em"
            onChange={(event) => style("letterSpacing", event.target.value)}
            className="h-8 px-2 text-[11px]"
          />
        </Row>
      </SectionCard>
    )
  }

  const renderPresetSection = () => {
    if (!element) return null

    if (nodeKind === "field") {
      return (
        <SectionCard title="Acciones rapidas" hint="Aplica estilos listos para campos y selectores sin tocar codigo.">
          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => applyFieldPreset("default")} className={PRESET_BUTTON_CLS}>
              Campo del sitio
            </button>
            {element.tag === "select" ? (
              <button type="button" onClick={() => applyFieldPreset("select")} className={PRESET_BUTTON_CLS}>
                Selector del sitio
              </button>
            ) : null}
          </div>
        </SectionCard>
      )
    }

    if (nodeKind === "button") {
      return (
        <SectionCard title="Acciones rapidas" hint="Usa presets listos para botones principales, secundarios o chips.">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => applyButtonPreset("primary")} className={PRESET_BUTTON_CLS}>
              Primario
            </button>
            <button type="button" onClick={() => applyButtonPreset("ghost")} className={PRESET_BUTTON_CLS}>
              Ghost
            </button>
            <button type="button" onClick={() => applyButtonPreset("chip")} className={PRESET_BUTTON_CLS}>
              Chip
            </button>
          </div>
        </SectionCard>
      )
    }

    if (nodeKind === "text") {
      return (
        <SectionCard title="Acciones rapidas" hint="Aplica presets de titulo, cuerpo o etiqueta en un clic.">
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => applyTextPreset("title")} className={PRESET_BUTTON_CLS}>
              Titulo
            </button>
            <button type="button" onClick={() => applyTextPreset("body")} className={PRESET_BUTTON_CLS}>
              Cuerpo
            </button>
            <button type="button" onClick={() => applyTextPreset("eyebrow")} className={PRESET_BUTTON_CLS}>
              Eyebrow
            </button>
          </div>
        </SectionCard>
      )
    }

    if (nodeKind === "container") {
      return (
        <SectionCard title="Acciones rapidas" hint="Convierte este bloque en una tarjeta visual alineada al diseno del sitio.">
          <button type="button" onClick={applyPanelPreset} className={cn("w-full", PRESET_BUTTON_CLS)}>
            Tarjeta del sitio
          </button>
        </SectionCard>
      )
    }

    if (nodeKind === "icon") {
      return (
        <SectionCard title="Acciones rapidas" hint="Aplica colores base del sistema al icono seleccionado.">
          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => applyIconColor("var(--he-primary, #E8392A)")} className={PRESET_BUTTON_CLS}>
              Color de marca
            </button>
            <button type="button" onClick={() => applyIconColor("var(--he-foreground, #E2EAF0)")} className={PRESET_BUTTON_CLS}>
              Color claro
            </button>
          </div>
        </SectionCard>
      )
    }

    return null
  }

  const renderBoxSection = (title = "Superficie") => {
    if (!element) return null
    return (
      <SectionCard title={title} hint="Ajusta fondo, bordes, esquinas y sombra del elemento.">
        <Row label="Color de fondo">
          <div className="flex items-center gap-2">
            <ColorPicker
              value={element.styles.backgroundColor}
              displayValue={getVisiblePaintColor(element.styles.backgroundColor, element.styles.backgroundImage)}
              onChange={applyBackgroundPaint}
            />
            <button
              type="button"
              onClick={() => {
                style("backgroundImage", "none")
                style("backgroundColor", "transparent")
              }}
              className="rounded-xl border border-white/10 px-2 py-1 text-[10px] text-white/35 hover:text-white"
            >
              auto
            </button>
          </div>
        </Row>
        {element.styles.backgroundImage && element.styles.backgroundImage !== "none" ? (
          <div className="text-[10px] leading-5 text-white/30">
            Gradiente detectado. Al cambiar el color se convertira en un fondo solido editable.
          </div>
        ) : null}
        <Row label="Color del borde">
          <ColorPicker value={element.styles.borderColor || "#000000"} onChange={(value) => style("borderColor", value)} />
        </Row>
        {nodeKind === "field" ? (
          <Row label="Color de acento">
            <ColorPicker value={element.styles.accentColor || element.styles.color || "#000000"} onChange={(value) => style("accentColor", value)} />
          </Row>
        ) : null}
        <Row label="Grosor del borde">
          <Slider value={element.styles.borderWidth} min={0} max={12} onChange={(value) => style("borderWidth", value)} />
        </Row>
        <Row label="Redondeado">
          <Slider value={element.styles.borderRadius} min={0} max={48} onChange={(value) => style("borderRadius", value)} />
        </Row>
        <Row label="Sombra">
          <OptionGroup
            small
            value={element.styles.boxShadow ? "soft" : "none"}
            options={[
              { value: "none", label: "sin" },
              { value: "soft", label: "soft" },
              { value: "strong", label: "fuerte" },
            ]}
            onChange={(value) =>
              style(
                "boxShadow",
                value === "none"
                  ? "none"
                  : value === "strong"
                    ? "0 16px 38px rgba(0,0,0,.32)"
                    : "0 10px 24px rgba(0,0,0,.18)"
              )
            }
          />
        </Row>
      </SectionCard>
    )
  }

  const renderSpacingSection = () => {
    if (!element) return null
    return (
      <SectionCard title="Espaciado" hint="Controla espacio interno, externo y separacion entre elementos.">
        <Row label="Espacio interno">
          <Slider value={element.styles.padding} min={0} max={96} onChange={(value) => style("padding", value)} />
        </Row>
        <Row label="Espacio externo">
          <Slider value={element.styles.margin} min={0} max={96} onChange={(value) => style("margin", value)} />
        </Row>
        {nodeKind === "container" || nodeKind === "button" || nodeKind === "icon" ? (
          <Row label="Separacion entre elementos">
            <Slider value={element.styles.gap} min={0} max={40} onChange={(value) => style("gap", value)} />
          </Row>
        ) : null}
        <button
          type="button"
          onClick={() => {
            style("padding", "0px")
            style("margin", "0px")
            if (nodeKind === "container" || nodeKind === "button" || nodeKind === "icon") {
              style("gap", "0px")
            }
          }}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 transition-all hover:border-primary/35 hover:text-white"
        >
          Restablecer espaciado
        </button>
      </SectionCard>
    )
  }

  const renderDimensionSection = () => {
    if (!element) return null
    return (
      <SectionCard title="Tamano" hint="Controla ancho, alto y limites del elemento seleccionado.">
        <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-[10px] leading-5 text-white/35">
          Tambien puedes redimensionar directo en el canvas arrastrando la esquina inferior derecha del marco rojo.
        </div>
        <button
          type="button"
          onClick={() => {
            style("position", "")
            style("left", "")
            style("top", "")
            style("transform", "")
            style("width", "")
            style("height", "")
            style("maxWidth", "")
            style("maxHeight", "")
            style("fontSize", "")
            style("zIndex", "")
            style("margin", "0px")
            attr("data-he-free-move", "")
            attr("data-he-free-move-mode", "")
            attr("data-he-move-x", "")
            attr("data-he-move-y", "")
            attr("data-he-base-transform", "")
            attr("data-he-base-position", "")
          }}
          className="w-full rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-white/55 transition-all hover:border-primary/35 hover:text-white"
        >
          Restablecer posicion y tamano
        </button>
        <Row label="Ancho">
          <OptionGroup
            small
            value={element.styles.width || "auto"}
            options={[
              { value: "auto", label: "auto" },
              { value: "100%", label: "100%" },
              { value: "50%", label: "50%" },
              { value: "fit-content", label: "ajustado" },
            ]}
            onChange={(value) => style("width", value)}
          />
        </Row>
        <Row label="Ancho maximo">
          <FieldInput
            value={element.styles.maxWidth || ""}
            placeholder="ej. 640px"
            onChange={(event) => style("maxWidth", event.target.value)}
            className="h-8 px-2 text-[11px]"
          />
        </Row>
        {(nodeKind === "image" || nodeKind === "container") ? (
          <Row label="Alto">
            <FieldInput
              value={element.styles.height || ""}
              placeholder="auto"
              onChange={(event) => style("height", event.target.value)}
              className="h-8 px-2 text-[11px]"
            />
          </Row>
        ) : null}
      </SectionCard>
    )
  }

  const renderLayoutSection = () => {
    if (!element) return null
    return (
      <SectionCard title="Organizacion" hint="Decide como se acomodan y alinean los elementos dentro del bloque.">
        <Row label="Como se acomodan">
          <OptionGroup
            small
            value={element.styles.display || "block"}
            options={[
              { value: "block", label: "vertical" },
              { value: "flex", label: "horizontal" },
              { value: "grid", label: "cuadricula" },
              { value: "inline-block", label: "libre" },
            ]}
            onChange={(value) => style("display", value)}
          />
        </Row>
        <Row label="Alineacion horizontal">
          <OptionGroup
            small
            value={element.styles.justifyContent || "flex-start"}
            options={[
              { value: "flex-start", label: "izquierda" },
              { value: "center", label: "centro" },
              { value: "space-between", label: "separado" },
              { value: "flex-end", label: "derecha" },
            ]}
            onChange={(value) => style("justifyContent", value)}
          />
        </Row>
        <Row label="Alineacion vertical">
          <OptionGroup
            small
            value={element.styles.alignItems || "stretch"}
            options={[
              { value: "flex-start", label: "arriba" },
              { value: "center", label: "centro" },
              { value: "flex-end", label: "abajo" },
              { value: "stretch", label: "estirar" },
            ]}
            onChange={(value) => style("alignItems", value)}
          />
        </Row>
      </SectionCard>
    )
  }

  const renderImageContent = () => (
    <div ref={imageSectionRef} className="space-y-3">
      <SectionCard title="Contenido visual" hint="Cambia la imagen, el texto alternativo y el origen del recurso.">
        <div className="grid gap-2 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/15"
          >
            Subir desde PC
          </button>
          <button
            type="button"
            onClick={() => {
              setLocalSrc("")
              attr("src", "")
            }}
            className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/45 transition-all hover:border-white/20 hover:text-white"
          >
            Limpiar src
          </button>
        </div>
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
        <Row label="Archivo o URL">
          <FieldInput
            value={localSrc}
            placeholder="https://... o data:image/..."
            onChange={(event) => setLocalSrc(event.target.value)}
            onBlur={() => attr("src", localSrc)}
          />
        </Row>
        <Row label="Texto alternativo">
          <FieldInput
            value={localAlt}
            placeholder="Descripcion accesible"
            onChange={(event) => setLocalAlt(event.target.value)}
            onBlur={() => attr("alt", localAlt)}
          />
        </Row>
        <Row label="Texto emergente">
          <FieldInput
            value={localTitle}
            placeholder="Tooltip opcional"
            onChange={(event) => setLocalTitle(event.target.value)}
            onBlur={() => attr("title", localTitle)}
          />
        </Row>
      </SectionCard>
      <SectionCard title="Ajuste visual" hint="Controla recorte, esquinas y dimensiones de la imagen.">
        <Row label="Como se ajusta">
          <OptionGroup
            small
            value={element?.styles.objectFit || "cover"}
            options={[
              { value: "cover", label: "rellenar" },
              { value: "contain", label: "contener" },
              { value: "fill", label: "estirar" },
              { value: "none", label: "original" },
            ]}
            onChange={(value) => style("objectFit", value)}
          />
        </Row>
        <Row label="Redondeado">
          <Slider value={element?.styles.borderRadius || "0px"} min={0} max={40} onChange={(value) => style("borderRadius", value)} />
        </Row>
        <Row label="Ancho">
          <FieldInput
            value={element?.styles.width || ""}
            placeholder="auto / 180px / 100%"
            onChange={(event) => style("width", event.target.value)}
            className="h-8 px-2 text-[11px]"
          />
        </Row>
        <Row label="Alto">
          <FieldInput
            value={element?.styles.height || ""}
            placeholder="auto / 80px"
            onChange={(event) => style("height", event.target.value)}
            className="h-8 px-2 text-[11px]"
          />
        </Row>
      </SectionCard>
    </div>
  )

  const renderActionSection = () => {
    if (!treatsAsButton || !element) return null
    return (
      <div ref={actionSectionRef}>
      <SectionCard title="Destino del boton" hint="Define hacia donde lleva este boton o enlace.">
        {element.tag === "button" ? (
          <Row label="Tipo de boton">
            <select
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
              value={element.attrs?.type || "button"}
              onChange={(event) => attr("type", event.target.value)}
            >
              <option value="button">button</option>
              <option value="submit">submit</option>
              <option value="reset">reset</option>
            </select>
          </Row>
        ) : null}
        <Row label="Enlace">
          <FieldInput
            value={localHref}
            placeholder={element.isLink ? "/ruta o https://..." : "Opcional"}
            onChange={(event) => setLocalHref(event.target.value)}
            onBlur={() => attr("href", localHref)}
          />
        </Row>
        <Row label="Como se abre">
          <select
            className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
            value={localTarget}
            onChange={(event) => {
              setLocalTarget(event.target.value)
              attr("target", event.target.value)
            }}
          >
            <option value="">En esta pagina</option>
            <option value="_blank">En una pestana nueva</option>
          </select>
        </Row>
      </SectionCard>
      </div>
    )
  }

  const renderFieldContent = () => (
    <div ref={fieldSectionRef}>
    <SectionCard title="Contenido del campo" hint="Configura datos, estados, opciones y comportamiento del formulario sin tocar el HTML manualmente.">
      {element?.tag === "input" ? (
        <Row label="Tipo de input">
          <select
            className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
            value={localFieldType || "text"}
            onChange={(event) => {
              const nextType = event.target.value
              setLocalFieldType(nextType)
              attr("type", nextType)
            }}
          >
            {["text", "email", "tel", "number", "password", "date", "checkbox", "radio"].map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
        </Row>
      ) : (
        <Row label="Tipo de campo">
          <FieldInput value={element?.tag || ""} readOnly className="h-8 px-2 text-[11px] text-white/45" />
        </Row>
      )}

      <div className="grid gap-2 sm:grid-cols-2">
        <Row label="ID del campo">
          <FieldInput
            value={localId}
            placeholder="id-del-campo"
            onChange={(event) => setLocalId(event.target.value)}
            onBlur={() => attr("id", localId)}
          />
        </Row>
        <Row label="Nombre tecnico">
          <FieldInput
            value={localName}
            placeholder="name del campo"
            onChange={(event) => setLocalName(event.target.value)}
            onBlur={() => attr("name", localName)}
          />
        </Row>
      </div>

      {supportsAutocomplete ? (
        <Row label="Autocomplete">
          <FieldInput
            value={localAutocomplete}
            placeholder="on / off / name / email / tel"
            onChange={(event) => setLocalAutocomplete(event.target.value)}
            onBlur={() => attr("autocomplete", localAutocomplete)}
          />
        </Row>
      ) : null}

      {supportsPlaceholder ? (
        <Row label="Texto de ayuda">
          <FieldInput
            value={localPlaceholder}
            placeholder="Texto de ayuda"
            onChange={(event) => setLocalPlaceholder(event.target.value)}
            onBlur={() => attr("placeholder", localPlaceholder)}
          />
        </Row>
      ) : null}

      {element?.tag === "select" ? (
        <>
          <Row label="Valor seleccionado">
            <select
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
              value={localValue}
              onChange={(event) => {
                const nextValue = event.target.value
                setLocalValue(nextValue)
                applyFieldValue(nextValue)
              }}
            >
              <option value="">Sin valor inicial</option>
              {selectOptionEntries.map((option) => (
                <option key={`${option.value}-${option.label}`} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Opciones">
            <FieldArea
              value={localSelectOptions}
              onChange={(event) => setLocalSelectOptions(event.target.value)}
              onBlur={applySelectOptions}
              placeholder={"matematicas|Matematicas\nlengua|Lengua\nciencias|Ciencias"}
              className="min-h-[110px]"
            />
          </Row>
        </>
      ) : (
        <Row label={isChoiceField ? "Valor enviado" : "Valor por defecto"}>
          <FieldInput
            value={localValue}
            placeholder={isChoiceField ? "valor-opcion" : "Valor inicial"}
            onChange={(event) => setLocalValue(event.target.value)}
            onBlur={() => applyFieldValue(localValue)}
          />
        </Row>
      )}

      {supportsRows ? (
        <Row label="Filas visibles">
          <FieldInput
            type="number"
            min={1}
            value={localRows}
            placeholder="4"
            onChange={(event) => setLocalRows(event.target.value)}
            onBlur={() => attr("rows", localRows)}
          />
        </Row>
      ) : null}

      {supportsNumericRange ? (
        <div className="grid gap-2 sm:grid-cols-3">
          <Row label="Minimo">
            <FieldInput
              value={localMin}
              placeholder="0"
              onChange={(event) => setLocalMin(event.target.value)}
              onBlur={() => attr("min", localMin)}
            />
          </Row>
          <Row label="Maximo">
            <FieldInput
              value={localMax}
              placeholder="100"
              onChange={(event) => setLocalMax(event.target.value)}
              onBlur={() => attr("max", localMax)}
            />
          </Row>
          <Row label="Paso">
            <FieldInput
              value={localStep}
              placeholder="1"
              onChange={(event) => setLocalStep(event.target.value)}
              onBlur={() => attr("step", localStep)}
            />
          </Row>
        </div>
      ) : null}

      <div className={cn("grid gap-2", element?.tag === "select" || isChoiceField ? "sm:grid-cols-4" : "sm:grid-cols-2")}>
        <button
          type="button"
          onClick={() => {
            const next = !isRequired
            setIsRequired(next)
            toggleAttr("required", next)
          }}
          className={cn(
            PRESET_BUTTON_CLS,
            isRequired ? "border-primary/35 bg-primary/10 text-primary" : ""
          )}
        >
          Requerido
        </button>
        <button
          type="button"
          onClick={() => {
            const next = !isDisabled
            setIsDisabled(next)
            toggleAttr("disabled", next)
          }}
          className={cn(
            PRESET_BUTTON_CLS,
            isDisabled ? "border-primary/35 bg-primary/10 text-primary" : ""
          )}
        >
          Deshabilitado
        </button>
        {element?.tag === "select" ? (
          <button
            type="button"
            onClick={() => {
              const next = !isMultiple
              setIsMultiple(next)
              toggleAttr("multiple", next)
            }}
            className={cn(
              PRESET_BUTTON_CLS,
              isMultiple ? "border-primary/35 bg-primary/10 text-primary" : ""
            )}
          >
            Multiple
          </button>
        ) : null}
        {isChoiceField ? (
          <button
            type="button"
            onClick={() => {
              const next = !isChecked
              setIsChecked(next)
              toggleAttr("checked", next)
            }}
            className={cn(
              PRESET_BUTTON_CLS,
              isChecked ? "border-primary/35 bg-primary/10 text-primary" : ""
            )}
          >
            Marcado
          </button>
        ) : null}
      </div>

      <Row label="Texto emergente">
        <FieldInput
          value={localTitle}
          placeholder="Tooltip opcional"
          onChange={(event) => setLocalTitle(event.target.value)}
          onBlur={() => attr("title", localTitle)}
        />
      </Row>

      {element?.tag === "select" ? (
        <div className="text-[10px] leading-5 text-white/30">
          El selector ya permite editar opciones, valor inicial, modo multiple, color, borde y estado desde el panel visual.
        </div>
      ) : null}
    </SectionCard>
    </div>
  )

  const renderTextContent = () => {
    if (!element) return null
    return (
      <div ref={textSectionRef}>
      <SectionCard title="Contenido" hint="Edita el texto visible del elemento sin tocar el codigo fuente.">
        {isEditing ? (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3 text-[11px] text-emerald-400">
            Editando inline en el canvas. Pulsa Esc para salir y luego ajusta el contenido aqui.
          </div>
        ) : treatsAsText ? (
          <>
            <FieldArea
              value={localText}
              onChange={(event) => {
                setLocalText(event.target.value)
                setText(event.target.value)
              }}
              onBlur={() => setText(localText)}
              placeholder="Texto visible del elemento"
            />
            <div className="text-[10px] text-white/25">Tambien puedes hacer doble clic sobre el texto dentro del canvas.</div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] text-white/30">
            Este bloque no tiene contenido directo. Entra a sus elementos internos desde Capas o inserta contenido nuevo mas abajo.
          </div>
        )}
      </SectionCard>
      </div>
    )
  }

  const renderContainerContent = () => {
    if (!element) return null
    return (
      <div ref={containerContentRef}>
        <SectionCard title="Contenido del bloque" hint="Este bloque agrupa otros elementos editables dentro del HTML importado.">
          <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-3 py-3 text-[11px] leading-5 text-white/35">
            Este bloque no tiene contenido directo. Usa la pestana <span className="font-semibold text-white">Capas</span> para seleccionar un texto, boton, imagen o campo dentro del bloque, o agrega nuevos elementos mas abajo.
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={() => setTab("layers")} className={PRESET_BUTTON_CLS}>
              Ir a capas
            </button>
            <button type="button" onClick={() => cleanupLayout(element.eid)} className={PRESET_BUTTON_CLS}>
              Compactar bloque
            </button>
          </div>
        </SectionCard>
      </div>
    )
  }

  const renderIconSection = () => {
    if (!supportsIconTools || !element) return null
    return (
      <div ref={iconSectionRef}>
        <SectionCard title="Icono" hint="Cambia el icono, su color, su tamano o sustituyelo por una imagen.">
          <div className="flex flex-wrap gap-2">
            {detectedEmojis.map((emoji) => (
              <span key={emoji} className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/70">
                {emoji}
              </span>
            ))}
            {visibleIconRefs.map((icon) => (
              <span key={icon} className="rounded-full border border-primary/20 bg-primary/10 px-2 py-1 text-[10px] text-primary">
                {icon}
              </span>
            ))}
            {detectedEmojis.length === 0 && visibleIconRefs.length === 0 ? (
              <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-1 text-[10px] text-white/35">
                Sin iconos detectados
              </span>
            ) : null}
          </div>

          <Row label="Como quieres aplicarlo">
            <OptionGroup
              small
              value={iconMode}
              options={[
                { value: "replace", label: "reemplazar" },
                { value: "prepend", label: "anteponer" },
              ]}
              onChange={(value) => setIconMode(value as "replace" | "prepend")}
            />
          </Row>

          {nodeKind === "icon" ? (
            <>
              <Row label="Color del icono">
                <ColorPicker value={element.styles.color} onChange={applyIconColor} />
              </Row>
              <Row label="Tamano del icono">
                <Slider value={element.styles.width || element.styles.fontSize || "18px"} min={12} max={220} onChange={applyIconSize} />
              </Row>
              <Row label="Trazo del icono">
                <Slider value={element.styles.strokeWidth || "1.9"} min={0.8} max={4} step={0.1} unit="" onChange={applyIconStrokeWidth} />
              </Row>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => iconImageInputRef.current?.click()}
                  className="rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/15"
                >
                  Cambiar por imagen
                </button>
                <button
                  type="button"
                  onClick={() => currentIcon ? replaceElementHtml(buildCurrentIconMarkup(currentIcon)) : null}
                  className="rounded-xl border border-white/10 px-3 py-2 text-sm text-white/60 transition-all hover:border-white/20 hover:text-white"
                >
                  Restaurar icono
                </button>
              </div>
              <input ref={iconImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconImageUpload} />
              <Row label="Imagen o URL">
                <FieldInput
                  value={iconImageSrc}
                  placeholder="https://... o data:image/..."
                  onChange={(event) => setIconImageSrc(event.target.value)}
                  onBlur={() => replaceIconWithImage(iconImageSrc)}
                />
              </Row>
            </>
          ) : null}

          {detectedEmojis.length > 0 ? (
            <button
              type="button"
              onClick={() => applyDetectedEmojiReplacement()}
              className="w-full rounded-xl border border-primary/25 bg-primary/10 px-3 py-2 text-sm font-medium text-primary transition-all hover:bg-primary/15"
            >
              Convertir emojis detectados en iconos del sitio
            </button>
          ) : null}

          <IconPicker value={currentIcon} onSelect={applyIcon} />
        </SectionCard>
      </div>
    )
  }

  const renderInsertSection = () => {
    if (!element) return null

    const placementOptions = canInsertInside
      ? [
          { value: "afterbegin", label: "dentro arriba" },
          { value: "beforeend", label: "dentro abajo" },
          { value: "beforebegin", label: "antes" },
          { value: "afterend", label: "despues" },
        ]
      : [
          { value: "beforebegin", label: "antes" },
          { value: "afterend", label: "despues" },
        ]

    const templatesByGroup = quickInsertTemplates.reduce<Record<string, QuickInsertTemplate[]>>((accumulator, template) => {
      const group = template.group
      if (!accumulator[group]) accumulator[group] = []
      accumulator[group] = [...accumulator[group], template]
      return accumulator
    }, {})

    return (
      <div ref={insertSectionRef}>
      <SectionCard
        title="Agregar elemento"
        hint="Si eliminaste algo del HTML importado, desde aqui puedes insertar otro titulo, boton, tarjeta, imagen o tu propio HTML."
      >
        <input ref={insertImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImageUpload} />
        <Row label="Lugar">
          <OptionGroup
            small
            value={insertPlacement}
            options={placementOptions}
            onChange={(value) => setInsertPlacement(value as InsertPlacement)}
          />
        </Row>

        <div className="space-y-3">
          {Object.entries(templatesByGroup).map(([group, templates]) => (
            <div key={group} className="space-y-2">
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/30">{group}</div>
              <div className="grid grid-cols-2 gap-2">
                {templates.map((template) => (
                  <button
                    key={template.key}
                    type="button"
                    onClick={() => {
                      if (template.key === "image") {
                        insertImageInputRef.current?.click()
                        return
                      }
                      insertHtml(template.html)
                    }}
                    className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-left transition-all hover:border-primary/35 hover:bg-primary/5"
                  >
                    <div className="text-[11px] font-semibold text-white">{template.label}</div>
                    <div className="mt-1 text-[10px] leading-4 text-white/35">{template.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-2 rounded-xl border border-dashed border-white/10 bg-white/[0.02] p-3">
          <div className="text-[10px] uppercase tracking-wide text-white/30">HTML libre</div>
          <FieldArea
            value={customInsertHtml}
            onChange={(event) => setCustomInsertHtml(event.target.value)}
            placeholder={'<div class="mi-bloque">Nuevo contenido</div>'}
            className="min-h-[90px]"
          />
          <button
            type="button"
            onClick={() => {
              insertHtml(customInsertHtml)
              setCustomInsertHtml("")
            }}
            disabled={!customInsertHtml.trim()}
            className={cn(
              "w-full rounded-xl border py-2 text-sm font-semibold transition-all",
              customInsertHtml.trim()
                ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/15"
                : "border-white/10 text-white/25"
            )}
          >
            Insertar HTML libre
          </button>
        </div>
      </SectionCard>
      </div>
    )
  }

  const renderLayersSection = () => {
    if (!element) return null
    const isRootNode = element.id === "he-import-root"
    return (
      <div ref={layersSectionRef}>
      <SectionCard title="Capas" hint="Navega, selecciona y organiza elementos del HTML importado como en un panel visual.">
        <div className="space-y-2">
          <div className="rounded-xl border border-primary/20 bg-primary/10 px-3 py-2">
            <div className="text-[10px] uppercase tracking-wide text-primary/80">Seleccion actual</div>
            <div className="mt-1 text-sm font-semibold text-white">{formatLayerTitle(element.tag, element.text || "", isRootNode)}</div>
            <div className="mt-1 text-[10px] text-white/35">
              {formatNodeKindLabel(nodeKind)} · {element.tag}
              {element.eid ? ` [${element.eid}]` : ""}
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <button type="button" onClick={() => moveNode("up", element.eid)} className={PRESET_BUTTON_CLS}>Subir</button>
              <button type="button" onClick={() => moveNode("down", element.eid)} className={PRESET_BUTTON_CLS}>Bajar</button>
              <button type="button" onClick={() => cleanupLayout(element.eid)} className={PRESET_BUTTON_CLS}>Compactar</button>
            </div>
          </div>

          {element.parentEid ? (
            <button
              type="button"
              onClick={() => selectNode(element.parentEid)}
              className="w-full rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left transition-all hover:border-primary/35 hover:bg-primary/5"
            >
              <div className="text-[10px] uppercase tracking-wide text-white/30">Bloque padre</div>
              <div className="mt-1 text-xs font-semibold text-white">{formatLayerTitle(element.parentTag || "div")}</div>
              <div className="mt-1 text-[10px] text-white/35">{element.parentTag}{element.parentEid ? ` [${element.parentEid}]` : ""}</div>
            </button>
          ) : null}

          <div className="space-y-2 rounded-xl border border-white/8 bg-white/[0.03] p-3">
            <div className="text-[10px] uppercase tracking-wide text-white/30">Elementos internos</div>
            {element.children?.length ? (
              <div className="space-y-2">
                {element.children.slice(0, 16).map((child) => (
                  <div
                    key={`${child.eid}-${child.tag}`}
                    className="rounded-xl border border-white/8 bg-white/[0.02] px-3 py-2 transition-all hover:border-primary/35 hover:bg-primary/5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" onClick={() => selectNode(child.eid)} className="min-w-0 flex-1 text-left">
                        <div className="text-xs font-semibold text-white">{formatLayerTitle(child.tag, child.label)}</div>
                        <div className="mt-1 truncate text-[10px] text-white/35">
                          {formatLayerTitle(child.tag)}
                          {child.eid ? ` [${child.eid}]` : ""}
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button type="button" onClick={() => moveNode("up", child.eid)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/55 hover:border-primary/35 hover:text-white">↑</button>
                        <button type="button" onClick={() => moveNode("down", child.eid)} className="rounded-lg border border-white/10 px-2 py-1 text-[10px] text-white/55 hover:border-primary/35 hover:text-white">↓</button>
                        <button type="button" onClick={() => deleteNode(child.eid)} className="rounded-lg border border-red-400/20 px-2 py-1 text-[10px] text-red-300 hover:border-red-400/35 hover:text-red-200">Borrar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px] leading-5 text-white/35">
                Este elemento no tiene hijos directos. Selecciona otro nodo del canvas o cambia al bloque padre.
              </div>
            )}
          </div>

          <div className="rounded-xl border border-white/8 bg-white/[0.03] px-3 py-3 text-[10px] leading-5 text-white/35">
            Usa esta vista para moverte por el bloque sin perderte en el canvas. Desde aqui puedes seleccionar, subir, bajar, borrar y compactar partes del bloque.
          </div>
        </div>
      </SectionCard>
      </div>
    )
  }

  const renderDragSection = () => (
    <SectionCard title="Mover en el canvas" hint="Activa el reorden visual entre hermanos. Para mover libremente, usa el boton Mover del canvas: ahora el bloque mantiene mejor su sitio y hace snap al centro y bordes del contenedor.">
      <button
        type="button"
        onClick={enableDrag}
        className={cn(
          "w-full rounded-xl border py-2 text-sm font-semibold transition-all",
          dragOn ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-white/40 hover:border-primary/35 hover:text-white"
        )}
      >
        {dragOn ? "Reorden visual activo" : "Activar mover entre bloques"}
      </button>
      <div className="text-[10px] leading-5 text-white/30">
        Arrastra desde el canvas y suelta encima del bloque objetivo. Los cambios quedan solo en el borrador hasta que guardes o publiques.
      </div>
    </SectionCard>
  )

  const renderQuickTypographySection = () => {
    if (!element || (nodeKind !== "text" && nodeKind !== "button" && nodeKind !== "icon")) return null
    return (
      <SectionCard title="Tipografia rapida" hint="Ajusta texto, tamano, color, grosor y formato visual como una barra rapida de edicion.">
        {nodeKind !== "icon" ? (
          <Row label="Texto visible">
            <FieldInput
              value={localText}
              placeholder="Texto visible"
              onChange={(event) => {
                setLocalText(event.target.value)
                setText(event.target.value)
              }}
              onBlur={() => setText(localText)}
            />
          </Row>
        ) : null}
        {nodeKind !== "icon" ? (
          <Row label="Tipo de letra">
            <select
              className="h-9 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-xs text-white focus:border-primary/50 focus:outline-none"
              value={element.styles.fontFamily || FONT_OPTIONS[0].value}
              onChange={(event) => style("fontFamily", event.target.value)}
            >
              {FONT_OPTIONS.map((option) => (
                <option key={option.label} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </Row>
        ) : null}
        <Row label={nodeKind === "icon" ? "Tamano del icono" : "Tamano del texto"}>
          <Slider
            value={nodeKind === "icon" ? element.styles.width || element.styles.fontSize || "18px" : element.styles.fontSize || "16px"}
            min={nodeKind === "icon" ? 12 : 8}
            max={nodeKind === "icon" ? 220 : 96}
            onChange={(value) => (nodeKind === "icon" ? applyIconSize(value) : style("fontSize", value))}
          />
        </Row>
        {nodeKind !== "icon" ? (
          <Row label="Grosor">
            <OptionGroup
              small
              value={String(Math.round(parsePx(element.styles.fontWeight)) || 400)}
              options={["400", "500", "600", "700", "800"].map((value) => ({ value, label: value }))}
              onChange={(value) => style("fontWeight", value)}
            />
          </Row>
        ) : null}
        {nodeKind !== "icon" ? (
          <Row label="Formato">
            <OptionGroup
              small
              value={[
                (element.styles.fontStyle || "normal") === "italic" ? "italic" : "normal",
                (element.styles.textDecoration || "").includes("underline") ? "underline" : "none",
              ].join("|")}
              options={[
                { value: "normal|none", label: "normal" },
                { value: "italic|none", label: "cursiva" },
                { value: "normal|underline", label: "subrayado" },
              ]}
              onChange={(value) => {
                const [fontStyle, textDecoration] = value.split("|")
                style("fontStyle", fontStyle || "normal")
                style("textDecoration", textDecoration || "none")
              }}
            />
          </Row>
        ) : null}
        {nodeKind !== "icon" ? (
          <Row label="Mayusculas">
            <OptionGroup
              small
              value={element.styles.textTransform || "none"}
              options={[
                { value: "none", label: "normal" },
                { value: "uppercase", label: "mayus" },
                { value: "capitalize", label: "titulo" },
              ]}
              onChange={(value) => style("textTransform", value)}
            />
          </Row>
        ) : null}
        {nodeKind !== "icon" ? (
          <Row label="Alineacion">
            <OptionGroup
              small
              value={element.styles.textAlign || "left"}
              options={[
                { value: "left", label: "izq" },
                { value: "center", label: "centro" },
                { value: "right", label: "der" },
              ]}
              onChange={(value) => style("textAlign", value)}
            />
          </Row>
        ) : null}
        <Row label={nodeKind === "icon" ? "Color del icono" : "Color del texto"}>
          <ColorPicker
            value={element.styles.color}
            onChange={(value) => (nodeKind === "icon" ? applyIconColor(value) : style("color", value))}
          />
        </Row>
        {nodeKind === "icon" ? (
          <Row label="Trazo">
            <Slider value={element.styles.strokeWidth || "1.9"} min={0.8} max={4} step={0.1} unit="" onChange={applyIconStrokeWidth} />
          </Row>
        ) : null}
      </SectionCard>
    )
  }

  if (!element) {
    return (
      <div className="space-y-4 px-3 py-4 pb-8">
        <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center">
          <div className="text-sm font-semibold text-white">Selecciona un elemento del canvas</div>
          <div className="mt-1 text-[11px] leading-5 text-white/35">
            El inspector cambia segun el tipo de nodo: texto, boton, imagen, icono, campo o contenedor.
          </div>
        </div>
        {renderDragSection()}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="space-y-4 pb-8">
      <div className="flex items-center gap-2 rounded-2xl border border-primary/20 bg-primary/10 px-3 py-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-white">{formatLayerTitle(element.tag, element.text || "", isImportRoot)}</div>
          <div className="mt-0.5 truncate text-[10px] text-primary/80">
            {formatNodeKindLabel(nodeKind)} · {element.tag}
            {element.eid ? ` [${element.eid}]` : ""}
          </div>
        </div>
        <span className="rounded-full border border-white/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-white/45">
          {formatNodeKindLabel(nodeKind)}
        </span>
        {isEditing ? (
          <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">Editando</span>
        ) : null}
        <button onClick={onClose} className="text-sm leading-none text-white/25 transition-colors hover:text-white">
          x
        </button>
      </div>

      {view === "full" ? (
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#0b1220] p-1">
          {INSPECTOR_TABS.map((item) => (
            <InspectorTabButton key={item.key} active={activeTab === item.key} onClick={() => setTab(item.key)}>
              {item.label}
            </InspectorTabButton>
          ))}
        </div>
      ) : null}

      {activeTab === "style" ? (
        <div className="space-y-3">
          {renderPresetSection()}
          {(nodeKind === "text" || nodeKind === "button" || nodeKind === "field" || nodeKind === "icon") ? renderTypographySection() : null}
          {(nodeKind === "button" || nodeKind === "field" || nodeKind === "container" || nodeKind === "image" || nodeKind === "icon") ? renderBoxSection(nodeKind === "image" ? "Marco visual" : "Apariencia") : null}
          {nodeKind === "container" ? renderLayoutSection() : null}
          {renderSpacingSection()}
          {nodeKind === "button" || nodeKind === "image" || nodeKind === "container" || nodeKind === "field" || nodeKind === "icon" ? renderDimensionSection() : null}
          {nodeKind === "image" ? (
            <SectionCard title="Comportamiento visual" hint="Ajusta como se recorta o se adapta la imagen dentro del bloque.">
              <Row label="Como se ajusta">
                <OptionGroup
                  small
                  value={element.styles.objectFit || "contain"}
                  options={[
                    { value: "contain", label: "contener" },
                    { value: "cover", label: "rellenar" },
                    { value: "fill", label: "estirar" },
                    { value: "none", label: "original" },
                  ]}
                  onChange={(value) => style("objectFit", value)}
                />
              </Row>
            </SectionCard>
          ) : null}
        </div>
      ) : activeTab === "layers" ? (
        <div className="space-y-3">
          {renderLayersSection()}
          {renderDragSection()}
        </div>
      ) : (
        <div className="space-y-3">
          {nodeKind === "icon" ? (
            renderIconSection()
          ) : (
            <>
              {nodeKind === "container" ? renderContainerContent() : null}
              {nodeKind === "image" ? renderImageContent() : null}
              {nodeKind === "field" ? renderFieldContent() : null}
              {nodeKind === "text" || nodeKind === "button" ? renderTextContent() : null}
              {renderQuickTypographySection()}
              {renderActionSection()}
              {renderIconSection()}
              {renderInsertSection()}
              {renderDragSection()}
            </>
          )}
        </div>
      )}
    </div>
  )
}

