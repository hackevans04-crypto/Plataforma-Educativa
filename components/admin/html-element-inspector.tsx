"use client"

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import type { EditorCommand, EditorElementInfo, EditorTypographyTargetInfo } from "./html-editor-bridge"
import { IconPicker } from "./icon-picker"
import {
  EMOJI_ICON_MAP,
  escapeHtml,
  findKnownEmojis,
  findSiteIconsInHtml,
  replaceFirstIconInHtmlFragment,
  renderSiteIconHtml,
  type SiteIconName,
} from "@/lib/site-icon-registry"
import { TYPOGRAPHY_FONT_GROUPS, TYPOGRAPHY_FONT_OPTIONS, TYPOGRAPHY_SITE_FONT, type TypographyFontOption } from "@/lib/typography-fonts"

type InspectorTab = "style" | "content" | "typography" | "layers"
export type HtmlInspectorTab = InspectorTab
type NodeKind = "image" | "button" | "field" | "icon" | "text" | "container"
type InsertPlacement = "beforebegin" | "afterbegin" | "beforeend" | "afterend"
type InspectorView = "full" | "style" | "content" | "typography"
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
  { key: "typography", label: "Tipografia" },
  { key: "layers", label: "Capas" },
] as const

const CONTAINER_TAGS = new Set(["div", "section", "article", "main", "header", "footer", "aside", "nav", "form", "ul", "ol", "li", "table", "tbody", "thead", "tr", "td", "th"])
const FONT_OPTIONS = TYPOGRAPHY_FONT_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}))
const TYPOGRAPHY_SIZE_PRESETS = [12, 14, 16, 18, 22, 28, 36, 48, 64] as const
const TYPOGRAPHY_WEIGHT_PRESETS = [
  { value: "300", label: "Light" },
  { value: "400", label: "Regular" },
  { value: "500", label: "Medium" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "800", label: "Extra Bold" },
] as const
const TYPOGRAPHY_COLOR_SWATCHES = [
  "#111111",
  "#ffffff",
  "#e8392a",
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#7c3aed",
  "#ec4899",
] as const
const PRESET_BUTTON_CLS = "rounded-xl border border-white/8 bg-white/[0.03] px-3 py-2 text-left text-sm leading-5 text-white transition-all hover:border-primary/35 hover:text-primary"
const MOBILE_COLOR_SWATCHES = [
  "#ffffff",
  "#e8392a",
  "#2563eb",
  "#22c55e",
  "#f59e0b",
  "#a855f7",
  "#0f172a",
  "#000000",
] as const
const TYPOGRAPHY_RECENT_FONTS_STORAGE_KEY = "he-typography-recent-fonts"

function toHex(css: string) {
  const directHex = normalizeHex(css)
  if (directHex) return directHex
  const variableFallback = css.match(/var\([^,]+,\s*([^)]+)\)/i)
  if (variableFallback?.[1]) {
    return toHex(variableFallback[1].trim())
  }
  const namedColor = css.trim().toLowerCase()
  if (namedColor === "white") return "#ffffff"
  if (namedColor === "black") return "#000000"
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

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function parseLineHeightRatio(value: string, fontSize: number) {
  if (!value || value === "normal") return 1.4
  const raw = parseFloat(value)
  if (!Number.isFinite(raw) || raw <= 0) return 1.4
  if (String(value).trim().toLowerCase().endsWith("px") && fontSize > 0) {
    return raw / fontSize
  }
  return raw
}

function parseLetterSpacingPx(value: string, fontSize: number) {
  if (!value || value === "normal") return 0
  const raw = parseFloat(value)
  if (!Number.isFinite(raw)) return 0
  const normalized = String(value).trim().toLowerCase()
  if (normalized.endsWith("em")) return raw * fontSize
  if (normalized.endsWith("rem")) return raw * 16
  return raw
}

function formatTypographyValue(value: number, digits = 1) {
  const rounded = Number(value.toFixed(digits))
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(digits)
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

type TypographyEditableNode = EditorElementInfo | EditorTypographyTargetInfo

function detectTypographyNodeKind(element: TypographyEditableNode | null): NodeKind {
  if (!element) return "container"
  const explicit = (element as { nodeType?: string | null }).nodeType
  if (explicit && ["image", "button", "field", "icon", "text", "container"].includes(explicit)) {
    return explicit as NodeKind
  }
  const tag = String(element.tag || "").toLowerCase()
  if (tag === "img") return "image"
  if (["input", "textarea", "select"].includes(tag)) return "field"
  if ("isActionable" in element && element.isActionable) return "button"
  if (looksLikeIconElement(element as EditorElementInfo | null)) return "icon"
  if ("isText" in element && element.isText) return "text"
  return "container"
}

function getTypographyTargetTextValue(element: TypographyEditableNode | null) {
  if (!element) return ""
  if (element.tag === "textarea") return String(element.text || "")
  if (["input", "select"].includes(element.tag)) {
    return String(element.attrs?.value || element.attrs?.placeholder || "")
  }
  return String(element.text || "").replace(/\s+/g, " ").trim()
}

function buildSelfTypographyTarget(element: EditorElementInfo | null, nodeKind: NodeKind): EditorTypographyTargetInfo | null {
  if (!element || !element.eid) return null
  if (!["text", "button", "field", "icon"].includes(nodeKind)) return null
  return {
    eid: element.eid,
    nodeType: nodeKind as EditorTypographyTargetInfo["nodeType"],
    tag: element.tag,
    label: formatLayerTitle(element.tag, getTypographyTargetTextValue(element), element.id === "he-import-root"),
    text: element.text,
    classes: element.classes,
    attrs: { ...element.attrs },
    styles: { ...element.styles },
  }
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

function StyleCard({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ background: "#1a1a1a", border: "0.5px solid #242424", borderRadius: 12, padding: "13px 13px 12px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginBottom: 13, display: "flex", alignItems: "center", gap: 7 }}>
        <span style={{ width: 20, height: 20, borderRadius: 6, background: "#242424", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{icon}</span>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{children}</div>
    </div>
  )
}

function StyleLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".08em", color: "#555", textTransform: "uppercase" as const, marginBottom: 5, marginTop: 0, ...style }}>{children}</p>
}

function StyleSlider({ min, max, value, unit = "px", onChange }: { min: number; max: number; value: number; unit?: string; onChange: (n: number) => void }) {
  const clamped = Math.max(min, Math.min(max, value))
  const pct = max > min ? Math.round(((clamped - min) / (max - min)) * 100) : 0
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, position: "relative", height: 4, background: "#242424", borderRadius: 2 }}>
        <div style={{ position: "absolute", top: 0, left: 0, height: 4, width: `${pct}%`, background: "#E84040", borderRadius: 2, pointerEvents: "none" }} />
        <input
          type="range" min={min} max={max} value={clamped}
          onChange={e => onChange(Number(e.target.value))}
          style={{ position: "absolute", top: -4, left: 0, width: "100%", height: 12, background: "transparent", outline: "none", cursor: "pointer", WebkitAppearance: "none", appearance: "none" as React.CSSProperties["appearance"] }}
        />
      </div>
      <span style={{ fontSize: 11, fontWeight: 600, color: "#888", minWidth: 34, textAlign: "right" as const }}>{clamped}{unit}</span>
    </div>
  )
}

function StyleChips({ items, active, onPick }: { items: { label: string; val: string }[]; active: string; onPick: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 5 }}>
      {items.map(o => (
        <button key={o.val} type="button" onClick={() => onPick(o.val)} style={{
          flex: 1, border: `0.5px solid ${active === o.val ? "#E84040" : "#2a2a2a"}`,
          borderRadius: 7, padding: "6px 0", fontSize: 11, textAlign: "center" as const,
          cursor: "pointer", background: active === o.val ? "#E84040" : "#111",
          color: active === o.val ? "#fff" : "#666", transition: "all .12s", fontFamily: "inherit",
        }}>{o.label}</button>
      ))}
    </div>
  )
}

function StyleReset({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} style={{ width: "100%", background: "transparent", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: 9, fontSize: 11, color: "#666", cursor: "pointer", fontFamily: "inherit", transition: "all .15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
      {children}
    </button>
  )
}

function StyleHAlignIcon({ type }: { type: string }) {
  if (type === "center") return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
      <rect x="0" y="0" width="13" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="2" y="4" width="9" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="8" width="11" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
  if (type === "flex-end") return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
      <rect x="3" y="0" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="5" y="4" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="8" width="12" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
  if (type === "space-between") return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
      <rect x="0" y="2" width="4" height="6" rx="1" fill="currentColor" />
      <rect x="9" y="2" width="4" height="6" rx="1" fill="currentColor" />
    </svg>
  )
  return (
    <svg width="13" height="10" viewBox="0 0 13 10" fill="none">
      <rect x="0" y="0" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="0" y="4" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="0" y="8" width="12" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
}

function StyleVAlignIcon({ type }: { type: string }) {
  if (type === "center") return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <rect x="0" y="0" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="4" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="0" y="8" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="11.5" width="8" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
  if (type === "flex-end") return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <rect x="1" y="0" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="2" y="4" width="6" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="0" y="11.5" width="10" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
  )
  if (type === "stretch") return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <rect x="0" y="0" width="10" height="13" rx="1.5" fill="currentColor" opacity="0.25" />
      <rect x="2" y="3" width="6" height="7" rx="1" fill="currentColor" />
    </svg>
  )
  return (
    <svg width="10" height="13" viewBox="0 0 10 13" fill="none">
      <rect x="0" y="0" width="10" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="1" y="4" width="8" height="1.5" rx="0.75" fill="currentColor" />
      <rect x="2" y="8" width="6" height="1.5" rx="0.75" fill="currentColor" />
    </svg>
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
  const [mobileFriendlyPicker, setMobileFriendlyPicker] = React.useState(false)

  React.useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const media = window.matchMedia("(pointer: coarse), (max-width: 820px)")
    const sync = () => setMobileFriendlyPicker(media.matches)
    sync()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync)
      return () => media.removeEventListener("change", sync)
    }
    media.addListener(sync)
    return () => media.removeListener(sync)
  }, [])

  if (mobileFriendlyPicker) {
    const swatches = Array.from(new Set([hex.toLowerCase(), ...MOBILE_COLOR_SWATCHES]))
    return (
      <div className="space-y-2" data-he-mobile-drawer-lock="1" data-he-mobile-drawer-interactive="1">
        <div className="grid grid-cols-4 gap-2">
          {swatches.map((swatch) => {
            const active = swatch.toLowerCase() === hex.toLowerCase()
            return (
              <button
                key={swatch}
                type="button"
                data-he-mobile-drawer-lock="1"
                data-he-mobile-drawer-interactive="1"
                onClick={() => onChange(swatch)}
                className={cn(
                  "h-9 rounded-xl border transition-all",
                  active ? "border-primary shadow-[0_0_0_1px_rgba(232,57,42,0.35)]" : "border-white/10 hover:border-primary/35"
                )}
                style={{ backgroundColor: swatch }}
                aria-label={`Color ${swatch}`}
              />
            )
          })}
        </div>
        <FieldInput
          value={hex}
          inputMode="text"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          data-he-mobile-drawer-lock="1"
          data-he-mobile-drawer-interactive="1"
          onChange={(event) => onChange(event.target.value)}
          className="h-9 px-3 text-[11px]"
        />
      </div>
    )
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5" data-he-mobile-drawer-lock="1" data-he-mobile-drawer-interactive="1">
      <input
        type="color"
        data-he-mobile-drawer-lock="1"
        data-he-mobile-drawer-interactive="1"
        className="h-7 w-7 cursor-pointer rounded border border-white/10 bg-transparent"
        value={hex}
        onInput={(event) => onChange((event.target as HTMLInputElement).value)}
        onChange={(event) => onChange(event.target.value)}
      />
      <FieldInput
        value={hex}
        data-he-mobile-drawer-lock="1"
        data-he-mobile-drawer-interactive="1"
        onChange={(event) => onChange(event.target.value)}
        className="h-8 min-w-[120px] flex-1 px-2 text-[11px]"
      />
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
  const externalNumber = parsePx(value)
  const [localValue, setLocalValue] = React.useState(externalNumber)
  const dragging = React.useRef(false)
  const rafId = React.useRef<number | null>(null)
  const pending = React.useRef<string | null>(null)
  // Always keep latest onChange in a ref to avoid stale-closure bugs
  const onChangeRef = React.useRef(onChange)
  React.useLayoutEffect(() => { onChangeRef.current = onChange })

  // Sync from parent only when not dragging
  React.useEffect(() => {
    if (!dragging.current) setLocalValue(externalNumber)
  }, [externalNumber])

  // Cleanup RAF on unmount
  React.useEffect(() => () => { if (rafId.current !== null) cancelAnimationFrame(rafId.current) }, [])

  const flush = () => {
    if (pending.current !== null) {
      onChangeRef.current(pending.current)
      pending.current = null
    }
    rafId.current = null
  }

  const handleInput = (e: React.FormEvent<HTMLInputElement>) => {
    const raw = (e.target as HTMLInputElement).value
    setLocalValue(parseFloat(raw))
    pending.current = `${raw}${unit}`
    if (rafId.current === null) rafId.current = requestAnimationFrame(flush)
  }

  const display = unit === "px" ? Math.round(localValue) : Math.round(localValue * 10) / 10

  return (
    <div className="flex items-center gap-2">
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        className="h-1 flex-1 accent-primary"
        value={localValue}
        onInput={handleInput}
        onChange={() => { /* controlled via onInput */ }}
        onPointerDown={() => { dragging.current = true }}
        onPointerUp={() => {
          dragging.current = false
          if (rafId.current !== null) { cancelAnimationFrame(rafId.current); rafId.current = null }
          flush()
        }}
      />
      <span className="w-12 text-right text-[10px] tabular-nums text-white/45">
        {display}{unit}
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

function TypographyMetricSlider({
  value,
  min,
  max,
  step,
  leftLabel,
  rightLabel,
  display,
  onChange,
}: {
  value: number
  min: number
  max: number
  step: number
  leftLabel: string
  rightLabel: string
  display: string
  onChange: (value: number) => void
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <span className="w-12 text-[10px] font-medium text-white/32">{leftLabel}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onInput={(event) => onChange(parseFloat((event.target as HTMLInputElement).value))}
          onChange={(event) => onChange(parseFloat(event.target.value))}
          className="h-1 flex-1 accent-primary"
        />
        <span className="w-12 text-right text-[10px] font-medium text-white/32">{rightLabel}</span>
      </div>
      <div className="text-right text-[11px] font-semibold tabular-nums text-white/62">{display}</div>
    </div>
  )
}

function TextAlignGlyph({ value }: { value: "left" | "center" | "right" | "justify" }) {
  const top = value === "left" ? [0, 16] : value === "center" ? [3, 13] : value === "right" ? [6, 16] : [0, 16]
  const middle = value === "left" ? [0, 16] : value === "center" ? [0, 16] : value === "right" ? [0, 16] : [0, 16]
  const bottom = value === "left" ? [0, 13] : value === "center" ? [1.5, 14.5] : value === "right" ? [3, 16] : [0, 16]
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d={`M${top[0]} 4h${top[1] - top[0]}`} />
      <path d={`M${middle[0]} 8h${middle[1] - middle[0]}`} />
      <path d={`M${bottom[0]} 12h${bottom[1] - bottom[0]}`} />
    </svg>
  )
}

function InspectorTabButton({
  active,
  children,
  onClick,
  onPointerDown,
  onTouchStart,
}: {
  active: boolean
  children: React.ReactNode
  onClick: () => void
  onPointerDown?: React.PointerEventHandler<HTMLButtonElement>
  onTouchStart?: React.TouchEventHandler<HTMLButtonElement>
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      onTouchStart={onTouchStart}
      className={cn(
        "touch-manipulation flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition-all",
        active
          ? "bg-white text-slate-950 shadow-sm"
          : "bg-transparent text-white/35 hover:bg-white/5 hover:text-white"
      )}
    >
      <span>{children}</span>
    </button>
  )
}

interface Props {
  element: EditorElementInfo | null
  isEditing: boolean
  iframeRef: React.RefObject<HTMLIFrameElement>
  onClose: () => void
  view?: InspectorView
  showCloseButton?: boolean
  onActiveTabChange?: (tab: InspectorTab) => void
}

export function HtmlElementInspector({
  element,
  isEditing,
  iframeRef,
  onClose,
  view = "full",
  showCloseButton = true,
  onActiveTabChange,
}: Props) {
  const [tab, setTab] = useState<InspectorTab>("content")
  const [isTouchInspectorLayout, setIsTouchInspectorLayout] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false
    return window.matchMedia("(pointer: coarse), (max-width: 820px)").matches
  })
  const [typographyDraft, setTypographyDraft] = useState<Record<string, string>>({})
  const [typographyTargetEid, setTypographyTargetEid] = useState("")
  const [fontSizeMode, setFontSizeMode] = useState<"preset" | "custom">("preset")
  const [customFontSize, setCustomFontSize] = useState("")
  const [fontSearchQuery, setFontSearchQuery] = useState("")
  const [fontSelectorOpen, setFontSelectorOpen] = useState(false)
  const [recentFontValues, setRecentFontValues] = useState<string[]>([])
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
  const typographySectionRef = useRef<HTMLDivElement>(null)
  const containerContentRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const iconImageInputRef = useRef<HTMLInputElement>(null)
  const insertImageInputRef = useRef<HTMLInputElement>(null)
  const iconSectionRef = useRef<HTMLDivElement>(null)
  const typographyColorInputRef = useRef<HTMLInputElement>(null)
  const lastAutoTabSelectionRef = useRef<string | null>(null)
  const manualTabSelectionRef = useRef<{ selectionKey: string | null; tab: InspectorTab | null }>({
    selectionKey: null,
    tab: null,
  })
  const lastTouchActionRef = useRef<{ key: string; at: number }>({ key: "", at: 0 })

  const nodeKind = useMemo(() => detectNodeKind(element), [element])
  const isImportRoot = element?.id === "he-import-root"
  const treatsAsButton = !!element && (element.isActionable || nodeKind === "button")
  const treatsAsText = !!element && (element.isText || nodeKind === "text" || nodeKind === "button")
  const lockedTab =
    view === "style"
      ? "style"
      : view === "content"
        ? "content"
        : view === "typography"
          ? "typography"
        : null
  const activeTab = lockedTab ?? tab
  const detectedEmojis = useMemo(() => findKnownEmojis(`${element?.text || ""} ${element?.html || ""}`), [element?.text, element?.html])
  const existingIcons = useMemo(() => findSiteIconsInHtml(element?.html || ""), [element?.html])
  const currentIcon = (element?.attrs?.dataIcon || existingIcons[0] || EMOJI_ICON_MAP[detectedEmojis[0]]) as SiteIconName | undefined
  const visibleIconRefs = useMemo(
    () => Array.from(new Set([...(currentIcon ? [currentIcon] : []), ...existingIcons])),
    [currentIcon, existingIcons]
  )
  const hasDetectedIconContext = nodeKind === "icon" || detectedEmojis.length > 0 || visibleIconRefs.length > 0
  const canInsertInside = !!element && CONTAINER_TAGS.has(element.tag)
  const quickInsertTemplates = useMemo(() => getQuickInsertTemplates(), [])
  const selectOptionEntries = useMemo(() => parseSelectOptionEntries(localSelectOptions), [localSelectOptions])
  const activeFieldType = localFieldType || element?.attrs?.type || ""
  const isChoiceField = !!element && element.tag === "input" && ["checkbox", "radio"].includes(activeFieldType)
  const supportsPlaceholder = !!element && (element.tag === "textarea" || (element.tag === "input" && !isChoiceField))
  const supportsAutocomplete = !!element && (element.tag === "input" || element.tag === "textarea")
  const supportsNumericRange = !!element && element.tag === "input" && ["number", "date", "time", "month", "week"].includes(activeFieldType)
  const supportsRows = !!element && element.tag === "textarea"
  const supportsTypography = nodeKind === "text" || nodeKind === "button" || nodeKind === "field" || nodeKind === "icon"
  const nestedTypographyTargets = useMemo(
    () => (!supportsTypography ? (element?.typographyTargets ?? []).filter((target) => !!target?.eid) : []),
    [element?.typographyTargets, supportsTypography]
  )
  const activeTypographyElement = useMemo<TypographyEditableNode | null>(() => {
    if (supportsTypography) {
      return buildSelfTypographyTarget(element, nodeKind)
    }
    if (!nestedTypographyTargets.length) return null
    return nestedTypographyTargets.find((target) => target.eid === typographyTargetEid) ?? nestedTypographyTargets[0] ?? null
  }, [element, nestedTypographyTargets, nodeKind, supportsTypography, typographyTargetEid])
  const activeTypographyKind = detectTypographyNodeKind(activeTypographyElement)
  const canRenderTypographyPanel = !!activeTypographyElement

  const currentSelectionKey = view === "full" && element?.eid ? element.eid : null

  const updateInspectorTab = useCallback(
    (nextTab: InspectorTab, options?: { manual?: boolean }) => {
      if (options?.manual && currentSelectionKey) {
        manualTabSelectionRef.current = { selectionKey: currentSelectionKey, tab: nextTab }
        lastAutoTabSelectionRef.current = currentSelectionKey
      }
      setTab(nextTab)
    },
    [currentSelectionKey]
  )

  const runTouchSafeAction = useCallback((key: string, action: () => void, source: "click" | "press") => {
    const now = Date.now()
    const lastAction = lastTouchActionRef.current
    if (source === "click" && lastAction.key === key && now - lastAction.at < 700) {
      return
    }
    if (source === "press") {
      if (lastAction.key === key && now - lastAction.at < 350) {
        return
      }
      lastTouchActionRef.current = { key, at: now }
    }
    action()
  }, [])

  const getTouchSafeButtonProps = useCallback(
    (key: string, action: () => void) => ({
      onClick: () => runTouchSafeAction(key, action, "click"),
      onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => {
        if (!isTouchInspectorLayout || event.pointerType !== "touch") return
        event.preventDefault()
        event.stopPropagation()
        runTouchSafeAction(key, action, "press")
      },
      onTouchStart: (event: React.TouchEvent<HTMLButtonElement>) => {
        if (!isTouchInspectorLayout) return
        event.preventDefault()
        event.stopPropagation()
        runTouchSafeAction(key, action, "press")
      },
    }),
    [isTouchInspectorLayout, runTouchSafeAction]
  )

  const rememberRecentFont = useCallback((fontValue: string) => {
    setRecentFontValues((current) => {
      const next = [fontValue, ...current.filter((value) => value !== fontValue)].slice(0, 3)
      if (typeof window !== "undefined") {
        window.localStorage.setItem(TYPOGRAPHY_RECENT_FONTS_STORAGE_KEY, JSON.stringify(next))
      }
      return next
    })
  }, [])

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return
    const media = window.matchMedia("(pointer: coarse), (max-width: 820px)")
    const sync = () => setIsTouchInspectorLayout(media.matches)
    sync()
    if (typeof media.addEventListener === "function") {
      media.addEventListener("change", sync)
      return () => media.removeEventListener("change", sync)
    }
    media.addListener(sync)
    return () => media.removeListener(sync)
  }, [])

  useEffect(() => {
    if (typeof window === "undefined") return
    try {
      const stored = window.localStorage.getItem(TYPOGRAPHY_RECENT_FONTS_STORAGE_KEY)
      if (!stored) return
      const parsed = JSON.parse(stored)
      if (!Array.isArray(parsed)) return
      setRecentFontValues(parsed.filter((value): value is string => typeof value === "string").slice(0, 3))
    } catch {
      // Ignore invalid persisted state.
    }
  }, [])

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
    setInsertPlacement(canInsertInside ? "beforeend" : "afterend")
    setTypographyTargetEid("")
    setTypographyDraft({})
    setFontSearchQuery("")
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
    element?.styles.fontSize,
    element?.styles.width,
    element?.html,
    existingIcons.length,
    detectedEmojis.length,
    canInsertInside,
  ])

  useEffect(() => {
    const targetStyles = activeTypographyElement?.styles
    const nextFontSize = Math.round(parsePx(targetStyles?.fontSize || targetStyles?.width || "16px") || 16)
    setTypographyDraft({})
    setCustomFontSize(String(nextFontSize))
    setFontSizeMode(TYPOGRAPHY_SIZE_PRESETS.includes(nextFontSize as (typeof TYPOGRAPHY_SIZE_PRESETS)[number]) ? "preset" : "custom")
  }, [activeTypographyElement?.eid, activeTypographyElement?.styles.fontSize, activeTypographyElement?.styles.width])

  useEffect(() => {
    if (lockedTab) {
      updateInspectorTab(lockedTab)
      lastAutoTabSelectionRef.current = null
      return
    }
    if (view !== "full" || !element?.eid) {
      lastAutoTabSelectionRef.current = null
      manualTabSelectionRef.current = { selectionKey: null, tab: null }
      return
    }
    const selectionKey = currentSelectionKey
    if (!selectionKey) return
    if (
      manualTabSelectionRef.current.selectionKey === selectionKey &&
      manualTabSelectionRef.current.tab
    ) {
      setTab((current) =>
        current === manualTabSelectionRef.current.tab ? current : manualTabSelectionRef.current.tab!
      )
      return
    }
    if (lastAutoTabSelectionRef.current === selectionKey) return
    lastAutoTabSelectionRef.current = selectionKey
    const canAutoOpenTypography = !isTouchInspectorLayout && (supportsTypography || nestedTypographyTargets.length > 0)
    setTab(canAutoOpenTypography ? "typography" : "content")
  }, [currentSelectionKey, element?.eid, isTouchInspectorLayout, lockedTab, nestedTypographyTargets.length, supportsTypography, updateInspectorTab, view])

  useEffect(() => {
    onActiveTabChange?.(activeTab)
  }, [activeTab, onActiveTabChange])

  useEffect(() => {
    if (view !== "full") return
    const frame = window.requestAnimationFrame(() => {
      const target =
        activeTab === "layers"
          ? layersSectionRef.current
          : activeTab === "typography"
            ? typographySectionRef.current
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

  const style = (prop: string, value: string, eid = element?.eid || null) => {
    if (!eid) return
    send({ __editor_cmd: true, cmd: "style", eid, prop, value })
  }

  const liveStyle = useCallback((prop: string, value: string, eid?: string | null) => {
    setTypographyDraft((current) => (current[prop] === value ? current : { ...current, [prop]: value }))
    style(prop, value, eid || undefined)
  }, [style])

  const applyTypographyFont = useCallback((fontOption: TypographyFontOption, typographyTargetId: string | null) => {
    rememberRecentFont(fontOption.value)
    liveStyle("fontFamily", fontOption.value, typographyTargetId)
  }, [liveStyle, rememberRecentFont])

  const queryStyle = (selector: string, prop: string, value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "style_query", eid: element.eid, selector, prop, value })
  }

  const batchStyle = (updates: Array<{ selector?: string; prop: string; value: string }>) => {
    if (!element?.eid || !updates.length) return
    send({ __editor_cmd: true, cmd: "style_batch", eid: element.eid, updates })
  }

  const patchIcon = (patch: { color?: string; size?: string; strokeWidth?: string }, eid = element?.eid || null) => {
    if (!eid) return
    send({ __editor_cmd: true, cmd: "icon_patch", eid, ...patch } as EditorCommand)
  }

  const livePatchIcon = useCallback((patch: { color?: string; size?: string; strokeWidth?: string }, eid?: string | null) => {
    setTypographyDraft((current) => {
      const next = { ...current }
      if (patch.color) next.color = patch.color
      if (patch.size) {
        next.width = patch.size
        next.height = patch.size
        next.fontSize = patch.size
      }
      if (patch.strokeWidth) next.strokeWidth = patch.strokeWidth
      return next
    })
    patchIcon(patch, eid || undefined)
  }, [patchIcon])

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

  const applyIcon = (iconName: SiteIconName) => {
    if (!element?.eid) return
    const strokeWidth = resolveSafeIconStrokeWidth(element)
    if (nodeKind === "icon") {
      replaceElementHtml(buildCurrentIconMarkup(iconName))
      return
    }
    const sourceHtml = (element.html && element.html.trim()) || escapeHtml(element.text || "")
    let nextHtml = sourceHtml

    if (existingIcons.length > 0 || detectedEmojis.length > 0) {
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
    const typographyElement = activeTypographyElement
    const typographyTargetId = typographyElement?.eid || null
    const usingNestedTypographyTarget = !supportsTypography && nestedTypographyTargets.length > 0
    const showTypographyTargetPicker = usingNestedTypographyTarget && nestedTypographyTargets.length > 1
    if (!typographyElement || !canRenderTypographyPanel) {
      return (
        <div ref={typographySectionRef} className="space-y-3">
          <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.02] px-4 py-5 text-center text-[11px] leading-5 text-white/45">
            Este elemento no expone propiedades tipograficas.
            <div className="mt-1">Selecciona un texto, boton, campo, selector o icono desde el canvas o desde Capas.</div>
          </div>
        </div>
      )
    }
    const mergedStyles = { ...typographyElement.styles, ...typographyDraft }
    const currentFontFamily = mergedStyles.fontFamily || FONT_OPTIONS[0].value
    const currentFontWeight = String(Math.round(parsePx(mergedStyles.fontWeight)) || 400)
    const currentFontStyle = mergedStyles.fontStyle || "normal"
    const currentTextTransform = mergedStyles.textTransform || "none"
    const currentTextAlign = (mergedStyles.textAlign || "left") as "left" | "center" | "right" | "justify"
    const currentFontSize = Math.max(
      activeTypographyKind === "icon" ? 12 : 8,
      Math.round(parsePx(mergedStyles.fontSize || mergedStyles.width || "16px") || (activeTypographyKind === "icon" ? 24 : 16))
    )
    const currentLineHeight = clampNumber(parseLineHeightRatio(mergedStyles.lineHeight || "", currentFontSize), 1, 3)
    const currentLetterSpacing = clampNumber(parseLetterSpacingPx(mergedStyles.letterSpacing || "", currentFontSize), -2, 10)
    const currentDecoration = String(mergedStyles.textDecoration || "none")
    const hasUnderline = currentDecoration.includes("underline")
    const hasStrike = currentDecoration.includes("line-through")
    const currentColor = getVisiblePaintColor(
      mergedStyles.color || typographyElement.styles.color || "#111111",
      mergedStyles.backgroundImage || typographyElement.styles.backgroundImage
    )
    const normalizedFontSearch = fontSearchQuery.trim().toLowerCase()
    const recentFontOptions = recentFontValues
      .map((fontValue) => TYPOGRAPHY_FONT_OPTIONS.find((option) => option.value === fontValue))
      .filter((option): option is TypographyFontOption => {
        if (!option) return false
        if (option.value === TYPOGRAPHY_SITE_FONT.value) return false
        if (!normalizedFontSearch) return true
        return `${option.label} ${option.preview} ${option.note}`.toLowerCase().includes(normalizedFontSearch)
      })
    const siteFontMatchesSearch =
      !normalizedFontSearch ||
      `${TYPOGRAPHY_SITE_FONT.label} ${TYPOGRAPHY_SITE_FONT.preview} ${TYPOGRAPHY_SITE_FONT.note}`.toLowerCase().includes(normalizedFontSearch)
    const filteredFontGroups = TYPOGRAPHY_FONT_GROUPS
      .map((group) => ({
        ...group,
        fonts: group.fonts.filter((fontOption) => {
          if (!normalizedFontSearch) return true
          const haystack = `${fontOption.label} ${fontOption.preview} ${fontOption.note}`.toLowerCase()
          return haystack.includes(normalizedFontSearch)
        }),
      }))
      .filter((group) => group.fonts.length > 0)
    const toggleDecoration = (token: "underline" | "line-through") => {
      const nextTokens = new Set(
        String((typographyDraft.textDecoration ?? typographyElement.styles.textDecoration) || "none")
          .split(/\s+/)
          .filter((part) => part && part !== "none")
      )
      if (nextTokens.has(token)) {
        nextTokens.delete(token)
      } else {
        nextTokens.add(token)
      }
      liveStyle("textDecoration", nextTokens.size ? Array.from(nextTokens).join(" ") : "none", typographyTargetId)
    }

    const typographyTargetControl = usingNestedTypographyTarget ? (
      <div className="space-y-2 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/35">Texto detectado dentro del bloque</div>
        <div className="text-[11px] leading-5 text-white/45">
          El bloque seleccionado es contenedor. La tipografia se aplicara al texto detectado automaticamente.
        </div>
        {showTypographyTargetPicker ? (
          <div className="flex flex-wrap gap-2">
            {nestedTypographyTargets.map((target) => (
              <button
                key={target.eid}
                type="button"
                {...getTouchSafeButtonProps(`typography-target:${target.eid}`, () => setTypographyTargetEid(target.eid))}
                className={cn(
                  "inline-flex min-h-[44px] items-center rounded-2xl border px-3 py-2 text-left text-[11px] font-medium transition-all",
                  (typographyTargetEid || nestedTypographyTargets[0]?.eid) === target.eid
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-white/10 bg-white/[0.03] text-white/60 hover:border-primary/30 hover:text-white"
                )}
              >
                {target.label}
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-white/8 bg-[#0b1220] px-3 py-2 text-[11px] text-white/70">
            Editando: <span className="font-semibold text-white">{nestedTypographyTargets[0]?.label || "Texto detectado"}</span>
          </div>
        )}
      </div>
    ) : null

    const renderFontRow = (fontOption: TypographyFontOption) => {
      const active = currentFontFamily === fontOption.value
      return (
        <button
          key={fontOption.id}
          type="button"
          onClick={() => applyTypographyFont(fontOption, typographyTargetId)}
          className={cn(
            "w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-3 text-left transition-all",
            active
              ? "border-primary bg-primary/8 shadow-[inset_3px_0_0_rgba(232,57,42,1)]"
              : "hover:border-primary/25 hover:bg-white/[0.045]"
          )}
        >
          <div className="flex items-start gap-3">
            <div className="min-w-[88px] pt-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/28">
              {fontOption.label}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[18px] leading-tight text-white" style={{ fontFamily: fontOption.value }}>
                {fontOption.label}
              </div>
              <div className="mt-1 truncate text-[22px] leading-tight text-white/92" style={{ fontFamily: fontOption.value }}>
                {fontOption.preview}
              </div>
              <div className="mt-1 text-[10px] text-white/35">{fontOption.note}</div>
            </div>
          </div>
        </button>
      )
    }

    const currentFontDisplayName = currentFontFamily.split(",")[0].replace(/['"]/g, "").trim()
    const typoIBtn = (active: boolean): React.CSSProperties => ({
      width: 34, height: 34, borderRadius: 7,
      border: `0.5px solid ${active ? "#E84040" : "#333"}`,
      background: active ? "#E84040" : "#1e1e1e",
      color: active ? "#fff" : "#777",
      cursor: "pointer", fontSize: 13,
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "all .12s", flexShrink: 0, fontFamily: "inherit",
    })
    const typoChip = (active: boolean): React.CSSProperties => ({
      flex: 1, border: `0.5px solid ${active ? "#E84040" : "#333"}`,
      borderRadius: 7, padding: "5px 0", fontSize: 11, textAlign: "center" as const,
      cursor: "pointer", background: active ? "#E84040" : "#1e1e1e",
      color: active ? "#fff" : "#888", transition: "all .12s", fontFamily: "inherit",
    })
    const typoSzChip = (active: boolean): React.CSSProperties => ({
      border: `0.5px solid ${active ? "#E84040" : "#333"}`,
      borderRadius: 7, padding: "4px 8px", fontSize: 11,
      cursor: "pointer", background: active ? "#E84040" : "#1e1e1e",
      color: active ? "#fff" : "#888", transition: "all .12s", fontFamily: "inherit",
    })
    const divider = <div style={{ height: 0.5, background: "#1e1e1e", margin: "2px 0" }} />

    return (
      <div ref={typographySectionRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {typographyTargetControl}

        {/* ── Vista previa ── */}
        {activeTypographyKind !== "icon" ? (
          <div style={{ background: "#181818", border: "0.5px solid #2a2a2a", borderRadius: 10, padding: "12px 14px", minHeight: 48, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{
              fontFamily: currentFontFamily,
              fontSize: Math.min(currentFontSize, 32),
              fontWeight: currentFontWeight as React.CSSProperties["fontWeight"],
              fontStyle: currentFontStyle === "italic" ? "italic" : "normal",
              textAlign: currentTextAlign,
              textTransform: currentTextTransform as React.CSSProperties["textTransform"],
              color: currentColor,
              lineHeight: currentLineHeight,
              letterSpacing: `${currentLetterSpacing}px`,
              display: "block", width: "100%", wordBreak: "break-word", transition: "all .15s",
            }}>
              HACKEVANS
            </span>
          </div>
        ) : null}

        {/* ── Icono: biblioteca ── */}
        {activeTypographyKind === "icon" ? (
          <StyleCard icon="◈" title="Biblioteca del icono">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {visibleIconRefs.length > 0
                  ? visibleIconRefs.map((icon) => (
                    <span key={icon} style={{ borderRadius: 20, border: "0.5px solid rgba(232,57,42,.25)", background: "rgba(232,57,42,.1)", padding: "3px 10px", fontSize: 10, color: "#E84040" }}>{icon}</span>
                  ))
                  : <span style={{ borderRadius: 20, border: "0.5px solid #2a2a2a", padding: "3px 10px", fontSize: 10, color: "#555" }}>Sin icono del sistema detectado</span>
                }
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                <button type="button" onClick={() => iconImageInputRef.current?.click()}
                  style={{ padding: "9px", borderRadius: 8, border: "0.5px solid rgba(232,57,42,.3)", background: "rgba(232,57,42,.1)", color: "#E84040", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>
                  Cambiar imagen
                </button>
                <button type="button"
                  onClick={() => currentIcon ? replaceElementHtml(buildCurrentIconMarkup(currentIcon, { color: currentColor, size: currentFontSize })) : null}
                  disabled={!currentIcon}
                  style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: currentIcon ? "#999" : "#444", fontSize: 12, cursor: currentIcon ? "pointer" : "not-allowed", fontFamily: "inherit" }}>
                  Restaurar icono
                </button>
              </div>
              <input ref={iconImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleIconImageUpload} />
              <div>
                <StyleLabel>Imagen o URL</StyleLabel>
                <FieldInput value={iconImageSrc} placeholder="https://... o data:image/..." onChange={(event) => setIconImageSrc(event.target.value)} onBlur={() => replaceIconWithImage(iconImageSrc)} />
              </div>
              <IconPicker value={currentIcon} onSelect={applyIcon} />
            </div>
          </StyleCard>
        ) : (
          /* ── Fuente ── */
          <div>
            <StyleLabel>Fuente</StyleLabel>
            <button type="button" onClick={() => setFontSelectorOpen(!fontSelectorOpen)} style={{
              width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
              background: "#1e1e1e", border: `0.5px solid ${fontSelectorOpen ? "#E84040" : "#333"}`,
              borderRadius: 9, padding: "9px 12px", cursor: "pointer", transition: "border-color .15s",
            }}>
              <span style={{ fontFamily: currentFontFamily, fontSize: 15, color: "#e0e0e0" }}>{currentFontDisplayName}</span>
              <span style={{ color: "#555", fontSize: 9, transform: fontSelectorOpen ? "rotate(180deg)" : "none", transition: "transform .2s", display: "inline-block" }}>▼</span>
            </button>
            {fontSelectorOpen && (
              <div style={{ marginTop: 4, background: "#141414", border: "0.5px solid #2a2a2a", borderRadius: 12, overflow: "hidden" }}>
                <div style={{ padding: "8px 10px", borderBottom: "0.5px solid #1e1e1e" }}>
                  <div style={{ display: "flex", alignItems: "center", background: "#1e1e1e", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "0 10px", gap: 6 }}>
                    <span style={{ color: "#444", fontSize: 11 }}>⌕</span>
                    <input value={fontSearchQuery} onChange={(e) => setFontSearchQuery(e.target.value)} placeholder="Buscar fuente..."
                      style={{ flex: 1, background: "transparent", border: "none", color: "#ccc", fontSize: 13, padding: "7px 0", outline: "none", fontFamily: "inherit" }} />
                  </div>
                </div>
                <div style={{ maxHeight: 300, overflowY: "auto" }}>
                  {recentFontOptions.length > 0 ? (
                    <div>
                      <div style={{ padding: "7px 14px 3px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#333", textTransform: "uppercase" as const, background: "#141414", position: "sticky" as const, top: 0 }}>Recientes</div>
                      {recentFontOptions.map((fontOption) => (
                        <button key={fontOption.id} type="button" onClick={() => { applyTypographyFont(fontOption, typographyTargetId); setFontSelectorOpen(false); setFontSearchQuery("") }} style={{
                          display: "flex", alignItems: "center", width: "100%", minHeight: 40, padding: "0 14px", cursor: "pointer",
                          background: currentFontFamily === fontOption.value ? "#1a0808" : "transparent",
                          border: "none", borderLeft: `3px solid ${currentFontFamily === fontOption.value ? "#E84040" : "transparent"}`,
                          textAlign: "left" as const,
                        }}>
                          <span style={{ width: 14, fontSize: 10, color: "#E84040", opacity: currentFontFamily === fontOption.value ? 1 : 0, marginRight: 8, flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: fontOption.value, fontSize: 16, color: currentFontFamily === fontOption.value ? "#E84040" : "#c8c8c8" }}>{fontOption.label}</span>
                        </button>
                      ))}
                    </div>
                  ) : null}
                  {siteFontMatchesSearch ? (
                    <div>
                      <div style={{ padding: "7px 14px 3px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#333", textTransform: "uppercase" as const, background: "#141414", position: "sticky" as const, top: 0 }}>Fuente del sitio</div>
                      <button type="button" onClick={() => { applyTypographyFont(TYPOGRAPHY_SITE_FONT, typographyTargetId); setFontSelectorOpen(false); setFontSearchQuery("") }} style={{
                        display: "flex", alignItems: "center", width: "100%", minHeight: 40, padding: "0 14px", cursor: "pointer",
                        background: currentFontFamily === TYPOGRAPHY_SITE_FONT.value ? "#1a0808" : "transparent",
                        border: "none", borderLeft: `3px solid ${currentFontFamily === TYPOGRAPHY_SITE_FONT.value ? "#E84040" : "transparent"}`,
                        textAlign: "left" as const,
                      }}>
                        <span style={{ width: 14, fontSize: 10, color: "#E84040", opacity: currentFontFamily === TYPOGRAPHY_SITE_FONT.value ? 1 : 0, marginRight: 8, flexShrink: 0 }}>✓</span>
                        <span style={{ fontFamily: TYPOGRAPHY_SITE_FONT.value, fontSize: 16, color: currentFontFamily === TYPOGRAPHY_SITE_FONT.value ? "#E84040" : "#c8c8c8" }}>{TYPOGRAPHY_SITE_FONT.label}</span>
                      </button>
                    </div>
                  ) : null}
                  {filteredFontGroups.map((group) => (
                    <div key={group.id}>
                      <div style={{ padding: "7px 14px 3px", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#333", textTransform: "uppercase" as const, background: "#141414", position: "sticky" as const, top: 0 }}>{group.label}</div>
                      {group.fonts.map((fontOption) => (
                        <button key={fontOption.id} type="button" onClick={() => { applyTypographyFont(fontOption, typographyTargetId); setFontSelectorOpen(false); setFontSearchQuery("") }} style={{
                          display: "flex", alignItems: "center", width: "100%", minHeight: 40, padding: "0 14px", cursor: "pointer",
                          background: currentFontFamily === fontOption.value ? "#1a0808" : "transparent",
                          border: "none", borderLeft: `3px solid ${currentFontFamily === fontOption.value ? "#E84040" : "transparent"}`,
                          textAlign: "left" as const,
                        }}>
                          <span style={{ width: 14, fontSize: 10, color: "#E84040", opacity: currentFontFamily === fontOption.value ? 1 : 0, marginRight: 8, flexShrink: 0 }}>✓</span>
                          <span style={{ fontFamily: fontOption.value, fontSize: 16, color: currentFontFamily === fontOption.value ? "#E84040" : "#c8c8c8" }}>{fontOption.label}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                  {!siteFontMatchesSearch && !filteredFontGroups.length ? (
                    <div style={{ padding: "18px 14px", textAlign: "center" as const, color: "#444", fontSize: 13 }}>Sin resultados</div>
                  ) : null}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Tamaño + Peso ── */}
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ flex: 1 }}>
            <StyleLabel>{activeTypographyKind === "icon" ? "Tamano icono" : "Tamano"}</StyleLabel>
            <div style={{ display: "flex", alignItems: "center", background: "#1e1e1e", border: "0.5px solid #333", borderRadius: 8, overflow: "hidden", height: 34 }}>
              <button type="button" onClick={() => {
                const next = Math.max(activeTypographyKind === "icon" ? 12 : 8, currentFontSize - 1)
                setCustomFontSize(String(next))
                activeTypographyKind === "icon" ? livePatchIcon({ size: `${next}px` }, typographyTargetId) : liveStyle("fontSize", `${next}px`, typographyTargetId)
              }} style={{ width: 30, height: "100%", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16 }}>−</button>
              <input type="number" min={activeTypographyKind === "icon" ? 12 : 8} max={220} value={customFontSize || currentFontSize}
                onChange={(e) => {
                  const nextValue = e.target.value.replace(/[^\d]/g, "").slice(0, 3)
                  setFontSizeMode("custom")
                  setCustomFontSize(nextValue)
                  if (!nextValue) return
                  const safeSize = clampNumber(parseInt(nextValue, 10) || currentFontSize, activeTypographyKind === "icon" ? 12 : 8, activeTypographyKind === "icon" ? 220 : 160)
                  activeTypographyKind === "icon" ? livePatchIcon({ size: `${safeSize}px` }, typographyTargetId) : liveStyle("fontSize", `${safeSize}px`, typographyTargetId)
                }}
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontSize: 14, fontWeight: 500, textAlign: "center" as const, outline: "none", fontFamily: "inherit" }} />
              <button type="button" onClick={() => {
                const next = Math.min(activeTypographyKind === "icon" ? 220 : 160, currentFontSize + 1)
                setCustomFontSize(String(next))
                activeTypographyKind === "icon" ? livePatchIcon({ size: `${next}px` }, typographyTargetId) : liveStyle("fontSize", `${next}px`, typographyTargetId)
              }} style={{ width: 30, height: "100%", background: "none", border: "none", color: "#666", cursor: "pointer", fontSize: 16 }}>+</button>
            </div>
          </div>
          {activeTypographyKind !== "icon" ? (
            <div style={{ flex: 1 }}>
              <StyleLabel>Peso</StyleLabel>
              <select value={currentFontWeight} onChange={(e) => liveStyle("fontWeight", e.target.value, typographyTargetId)}
                style={{ width: "100%", height: 34, background: "#1e1e1e", border: "0.5px solid #333", borderRadius: 8, padding: "0 10px", color: "#ddd", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}>
                {TYPOGRAPHY_WEIGHT_PRESETS.map((w) => (
                  <option key={w.value} value={w.value}>{w.label}</option>
                ))}
              </select>
            </div>
          ) : null}
        </div>

        {/* ── Chips tamaño rápido ── */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {(activeTypographyKind === "icon" ? [16, 20, 24, 32, 40, 56] : [...TYPOGRAPHY_SIZE_PRESETS]).map((size) => (
            <button key={size} type="button"
              onClick={() => {
                setFontSizeMode("preset")
                setCustomFontSize(String(size))
                activeTypographyKind === "icon" ? livePatchIcon({ size: `${size}px` }, typographyTargetId) : liveStyle("fontSize", `${size}px`, typographyTargetId)
              }}
              style={typoSzChip(currentFontSize === size)}>
              {size}
            </button>
          ))}
        </div>

        {activeTypographyKind !== "icon" ? (
          <>
            {divider}

            {/* ── Estilo + Alineacion en misma fila ── */}
            <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
              <div>
                <StyleLabel>Estilo</StyleLabel>
                <div style={{ display: "flex", gap: 4 }}>
                  <button type="button" onClick={() => liveStyle("fontStyle", currentFontStyle === "italic" ? "normal" : "italic", typographyTargetId)}
                    style={typoIBtn(currentFontStyle === "italic")} title="Cursiva">
                    <i style={{ fontStyle: "italic", fontFamily: "Georgia,serif" }}>I</i>
                  </button>
                  <button type="button" onClick={() => toggleDecoration("underline")}
                    style={typoIBtn(hasUnderline)} title="Subrayado">
                    <u>U</u>
                  </button>
                  <button type="button" onClick={() => toggleDecoration("line-through")}
                    style={typoIBtn(hasStrike)} title="Tachado">
                    <s>S</s>
                  </button>
                </div>
              </div>
              <div style={{ width: 0.5, height: 34, background: "#2a2a2a", flexShrink: 0, alignSelf: "flex-end" }} />
              <div style={{ flex: 1 }}>
                <StyleLabel>Alineacion</StyleLabel>
                <div style={{ display: "flex", gap: 4 }}>
                  {(["left", "center", "right", "justify"] as const).map((alignment) => (
                    <button key={alignment} type="button" onClick={() => liveStyle("textAlign", alignment, typographyTargetId)}
                      style={{ ...typoIBtn(currentTextAlign === alignment), flex: 1 }} title={alignment}>
                      <TextAlignGlyph value={alignment} />
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* ── Transformacion ── */}
            <div>
              <StyleLabel>Transformacion</StyleLabel>
              <div style={{ display: "flex", gap: 4 }}>
                {([
                  { value: "none", label: "Aa" },
                  { value: "uppercase", label: "AA" },
                  { value: "lowercase", label: "aa" },
                  { value: "capitalize", label: "Aa·" },
                ] as const).map((option) => (
                  <button key={option.value} type="button" onClick={() => liveStyle("textTransform", option.value, typographyTargetId)}
                    style={typoChip(currentTextTransform === option.value)}>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        {divider}

        {/* ── Color ── */}
        <div>
          <StyleLabel>{activeTypographyKind === "icon" ? "Color del icono" : "Color del texto"}</StyleLabel>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            {TYPOGRAPHY_COLOR_SWATCHES.map((swatch) => (
              <button key={swatch} type="button"
                onClick={() => activeTypographyKind === "icon" ? livePatchIcon({ color: swatch }, typographyTargetId) : liveStyle("color", swatch, typographyTargetId)}
                style={{
                  width: 26, height: 26, borderRadius: "50%", background: swatch,
                  cursor: "pointer", flexShrink: 0, transition: "all .12s",
                  border: currentColor.toLowerCase() === swatch.toLowerCase() ? "2.5px solid #E84040" : swatch === "#ffffff" ? "1px solid #444" : "2px solid transparent",
                  transform: currentColor.toLowerCase() === swatch.toLowerCase() ? "scale(1.18)" : "scale(1)",
                }} aria-label={`Color ${swatch}`} />
            ))}
            <label style={{ width: 26, height: 26, borderRadius: "50%", cursor: "pointer", flexShrink: 0, background: "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)", border: "0.5px solid #444", overflow: "hidden", display: "block" }}>
              <input ref={typographyColorInputRef} type="color" value={currentColor}
                onInput={(event) => activeTypographyKind === "icon" ? livePatchIcon({ color: (event.target as HTMLInputElement).value }, typographyTargetId) : liveStyle("color", (event.target as HTMLInputElement).value, typographyTargetId)}
                onChange={(event) => activeTypographyKind === "icon" ? livePatchIcon({ color: event.target.value }, typographyTargetId) : liveStyle("color", event.target.value, typographyTargetId)}
                style={{ opacity: 0, width: "100%", height: "100%", cursor: "pointer" }} />
            </label>
          </div>
        </div>

        {/* ── Trazo (icono) / Interlineado + Espaciado (texto) ── */}
        {activeTypographyKind === "icon" ? (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <StyleLabel style={{ margin: 0 }}>Trazo</StyleLabel>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{formatTypographyValue(clampNumber(parseFloat(mergedStyles.strokeWidth || "1.9") || 1.9, 0.8, 4), 1)}</span>
            </div>
            <input type="range" min={0.8} max={4} step={0.1}
              value={clampNumber(parseFloat(mergedStyles.strokeWidth || "1.9") || 1.9, 0.8, 4)}
              onChange={(e) => livePatchIcon({ strokeWidth: formatTypographyValue(parseFloat(e.target.value), 1) }, typographyTargetId)}
              style={{ width: "100%", accentColor: "#E84040" }} />
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
              <span style={{ fontSize: 10, color: "#444" }}>Fino</span>
              <span style={{ fontSize: 10, color: "#444" }}>Fuerte</span>
            </div>
          </div>
        ) : (
          <>
            {divider}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <StyleLabel style={{ margin: 0 }}>Interlineado</StyleLabel>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{formatTypographyValue(currentLineHeight, 1)}</span>
              </div>
              <input type="range" min={1} max={3} step={0.05} value={currentLineHeight}
                onChange={(e) => liveStyle("lineHeight", formatTypographyValue(parseFloat(e.target.value), 2), typographyTargetId)}
                style={{ width: "100%", accentColor: "#E84040" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "#444" }}>Compacto</span>
                <span style={{ fontSize: 10, color: "#444" }}>Amplio</span>
              </div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <StyleLabel style={{ margin: 0 }}>Espaciado de letras</StyleLabel>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{formatTypographyValue(currentLetterSpacing, 1)}px</span>
              </div>
              <input type="range" min={-2} max={10} step={0.25} value={currentLetterSpacing}
                onChange={(e) => liveStyle("letterSpacing", `${formatTypographyValue(parseFloat(e.target.value), 2)}px`, typographyTargetId)}
                style={{ width: "100%", accentColor: "#E84040" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                <span style={{ fontSize: 10, color: "#444" }}>−2px</span>
                <span style={{ fontSize: 10, color: "#444" }}>+10px</span>
              </div>
            </div>
          </>
        )}
      </div>
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

    return null
  }

  const renderBoxSection = (title = "Superficie") => {
    if (!element) return null
    const shadowActive = !element.styles.boxShadow || element.styles.boxShadow === "none" ? "none" : element.styles.boxShadow.includes("38") ? "strong" : "soft"
    return (
      <StyleCard icon="◈" title={title}>
        <div>
          <StyleLabel>Color de fondo</StyleLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
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
              style={{ background: "#242424", border: "0.5px solid #2e2e2e", borderRadius: 6, padding: "4px 9px", fontSize: 11, color: "#666", cursor: "pointer", whiteSpace: "nowrap" as const, fontFamily: "inherit" }}
            >
              auto
            </button>
          </div>
          {element.styles.backgroundImage && element.styles.backgroundImage !== "none" ? (
            <div style={{ fontSize: 10, color: "#555", marginTop: 5, lineHeight: 1.5 }}>Gradiente detectado. Al cambiar el color se convierte en fondo solido.</div>
          ) : null}
        </div>
        <div>
          <StyleLabel>Color del borde</StyleLabel>
          <ColorPicker value={element.styles.borderColor || "#000000"} onChange={(value) => style("borderColor", value)} />
        </div>
        {nodeKind === "field" ? (
          <div>
            <StyleLabel>Color de acento</StyleLabel>
            <ColorPicker value={element.styles.accentColor || element.styles.color || "#000000"} onChange={(value) => style("accentColor", value)} />
          </div>
        ) : null}
        <div>
          <StyleLabel>Grosor del borde</StyleLabel>
          <StyleSlider min={0} max={12} value={parseInt(element.styles.borderWidth || "0") || 0} onChange={(n) => style("borderWidth", `${n}px`)} />
        </div>
        <div>
          <StyleLabel>Redondeado</StyleLabel>
          <StyleSlider min={0} max={48} value={parseInt(element.styles.borderRadius || "0") || 0} onChange={(n) => style("borderRadius", `${n}px`)} />
        </div>
        <div>
          <StyleLabel>Sombra</StyleLabel>
          <StyleChips
            items={[
              { label: "Sin", val: "none" },
              { label: "Suave", val: "soft" },
              { label: "Fuerte", val: "strong" },
            ]}
            active={shadowActive}
            onPick={(val) =>
              style(
                "boxShadow",
                val === "none" ? "none" : val === "strong" ? "0 16px 38px rgba(0,0,0,.32)" : "0 10px 24px rgba(0,0,0,.18)"
              )
            }
          />
        </div>
      </StyleCard>
    )
  }

  const renderSpacingSection = () => {
    if (!element) return null
    return (
      <StyleCard icon="↔" title="Espaciado">
        <div>
          <StyleLabel>Espacio interno (padding)</StyleLabel>
          <StyleSlider min={0} max={96} value={parseInt(element.styles.padding || "0") || 0} onChange={(n) => style("padding", `${n}px`)} />
        </div>
        <div>
          <StyleLabel>Espacio externo (margin)</StyleLabel>
          <StyleSlider min={0} max={96} value={parseInt(element.styles.margin || "0") || 0} onChange={(n) => style("margin", `${n}px`)} />
        </div>
        {nodeKind === "container" || nodeKind === "button" || nodeKind === "icon" ? (
          <div>
            <StyleLabel>Separacion entre elementos (gap)</StyleLabel>
            <StyleSlider min={0} max={40} value={parseInt(element.styles.gap || "0") || 0} onChange={(n) => style("gap", `${n}px`)} />
          </div>
        ) : null}
        <StyleReset onClick={() => {
          style("padding", "0px")
          style("margin", "0px")
          if (nodeKind === "container" || nodeKind === "button" || nodeKind === "icon") {
            style("gap", "0px")
          }
        }}>
          ↺ Restablecer espaciado
        </StyleReset>
      </StyleCard>
    )
  }

  const renderDimensionSection = () => {
    if (!element) return null
    const currentWidth = element.styles.width || "auto"
    const widthOpts = [
      { label: "auto", val: "auto" },
      { label: "100%", val: "100%" },
      { label: "50%", val: "50%" },
      { label: "ajustado", val: "fit-content" },
    ]
    const textInputStyle: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "7px 10px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none" }
    return (
      <StyleCard icon="⤡" title="Tamano">
        <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
          Arrastra la esquina inferior derecha del marco rojo en el canvas para redimensionar.
        </div>
        <div>
          <StyleLabel>Ancho</StyleLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {widthOpts.map(o => (
              <button key={o.val} type="button" onClick={() => style("width", o.val)} style={{
                border: `0.5px solid ${currentWidth === o.val ? "#E84040" : "#2a2a2a"}`,
                borderRadius: 7, padding: "6px 0", fontSize: 11,
                textAlign: "center" as const, cursor: "pointer",
                background: currentWidth === o.val ? "#1a0808" : "#111",
                color: currentWidth === o.val ? "#E84040" : "#666",
                transition: "all .12s", fontFamily: "inherit",
              }}>{o.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <StyleLabel>Ancho maximo</StyleLabel>
            <input
              value={element.styles.maxWidth || ""}
              placeholder="ej. 640px"
              onChange={(event) => style("maxWidth", event.target.value)}
              style={textInputStyle}
            />
          </div>
          {(nodeKind === "image" || nodeKind === "container") ? (
            <div>
              <StyleLabel>Alto</StyleLabel>
              <input
                value={element.styles.height || ""}
                placeholder="auto"
                onChange={(event) => style("height", event.target.value)}
                style={textInputStyle}
              />
            </div>
          ) : null}
        </div>
        <StyleReset onClick={() => {
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
        }}>
          ↺ Restablecer posicion y tamano
        </StyleReset>
      </StyleCard>
    )
  }

  const renderLayoutSection = () => {
    if (!element) return null
    const currentDisplay = element.styles.display || "block"
    const currentJustify = element.styles.justifyContent || "flex-start"
    const currentAlign = element.styles.alignItems || "stretch"
    const layoutOpts = [
      { label: "Vertical", val: "block", icon: "⬍" },
      { label: "Horizontal", val: "flex", icon: "⬌" },
      { label: "Cuadricula", val: "grid", icon: "⊞" },
      { label: "Libre", val: "inline-block", icon: "⤢" },
    ] as const
    const hAlignOpts: { val: string; label: string }[] = [
      { val: "flex-start", label: "Izq" },
      { val: "center", label: "Centro" },
      { val: "space-between", label: "Sep" },
      { val: "flex-end", label: "Der" },
    ]
    const vAlignOpts: { val: string; label: string }[] = [
      { val: "flex-start", label: "Arriba" },
      { val: "center", label: "Centro" },
      { val: "flex-end", label: "Abajo" },
      { val: "stretch", label: "Estirar" },
    ]
    const alignBtnBase: React.CSSProperties = { flex: 1, height: 32, border: "0.5px solid", borderRadius: 7, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "all .12s", fontSize: 10, fontFamily: "inherit" }
    return (
      <StyleCard icon="⊞" title="Organizacion">
        <div>
          <StyleLabel>Distribucion</StyleLabel>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
            {layoutOpts.map(o => (
              <button key={o.val} type="button" onClick={() => style("display", o.val)} style={{
                border: `0.5px solid ${currentDisplay === o.val ? "#E84040" : "#2a2a2a"}`,
                borderRadius: 8, padding: "8px 0", fontSize: 11,
                textAlign: "center" as const, cursor: "pointer",
                background: currentDisplay === o.val ? "#1a0808" : "#111",
                color: currentDisplay === o.val ? "#E84040" : "#666",
                transition: "all .12s", display: "flex", flexDirection: "column" as const, alignItems: "center", gap: 3,
                fontFamily: "inherit",
              }}>
                <span style={{ fontSize: 14 }}>{o.icon}</span>
                {o.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <StyleLabel>Alineacion H</StyleLabel>
            <div style={{ display: "flex", gap: 3 }}>
              {hAlignOpts.map(o => (
                <button key={o.val} type="button" onClick={() => style("justifyContent", o.val)} title={o.label} style={{
                  ...alignBtnBase,
                  background: currentJustify === o.val ? "#E84040" : "#111",
                  color: currentJustify === o.val ? "#fff" : "#555",
                  borderColor: currentJustify === o.val ? "#E84040" : "#2a2a2a",
                }}>
                  <StyleHAlignIcon type={o.val} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <StyleLabel>Alineacion V</StyleLabel>
            <div style={{ display: "flex", gap: 3 }}>
              {vAlignOpts.map(o => (
                <button key={o.val} type="button" onClick={() => style("alignItems", o.val)} title={o.label} style={{
                  ...alignBtnBase,
                  background: currentAlign === o.val ? "#E84040" : "#111",
                  color: currentAlign === o.val ? "#fff" : "#555",
                  borderColor: currentAlign === o.val ? "#E84040" : "#2a2a2a",
                }}>
                  <StyleVAlignIcon type={o.val} />
                </button>
              ))}
            </div>
          </div>
        </div>
      </StyleCard>
    )
  }

  const renderImageContent = () => {
    const ci: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "8px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", display: "block" }
    return (
      <div ref={imageSectionRef} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <StyleCard icon="⊡" title="Contenido visual">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{ background: "#E84040", border: "none", borderRadius: 8, padding: "9px", fontSize: 12, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s" }}
            >
              Subir desde PC
            </button>
            <button
              type="button"
              onClick={() => {
                setLocalSrc("")
                attr("src", "")
              }}
              style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              Limpiar src
            </button>
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
          <div>
            <StyleLabel>Archivo o URL</StyleLabel>
            <input
              style={ci}
              value={localSrc}
              placeholder="https://... o data:image/..."
              onChange={(event) => setLocalSrc(event.target.value)}
              onBlur={() => attr("src", localSrc)}
            />
          </div>
          <div>
            <StyleLabel>Texto alternativo</StyleLabel>
            <input
              style={ci}
              value={localAlt}
              placeholder="Descripcion accesible"
              onChange={(event) => setLocalAlt(event.target.value)}
              onBlur={() => attr("alt", localAlt)}
            />
          </div>
          <div>
            <StyleLabel>Texto emergente</StyleLabel>
            <input
              style={ci}
              value={localTitle}
              placeholder="Tooltip opcional"
              onChange={(event) => setLocalTitle(event.target.value)}
              onBlur={() => attr("title", localTitle)}
            />
          </div>
        </StyleCard>
        <StyleCard icon="◑" title="Ajuste visual">
          <div>
            <StyleLabel>Como se ajusta</StyleLabel>
            <StyleChips
              items={[
                { label: "rellenar", val: "cover" },
                { label: "contener", val: "contain" },
                { label: "estirar", val: "fill" },
                { label: "original", val: "none" },
              ]}
              active={element?.styles.objectFit || "cover"}
              onPick={(v) => style("objectFit", v)}
            />
          </div>
          <div>
            <StyleLabel>Redondeado</StyleLabel>
            <StyleSlider min={0} max={40} value={parseInt(element?.styles.borderRadius || "0") || 0} onChange={(n) => style("borderRadius", `${n}px`)} />
          </div>
          <div>
            <StyleLabel>Ancho</StyleLabel>
            <input
              style={ci}
              value={element?.styles.width || ""}
              placeholder="auto / 180px / 100%"
              onChange={(event) => style("width", event.target.value)}
            />
          </div>
          <div>
            <StyleLabel>Alto</StyleLabel>
            <input
              style={ci}
              value={element?.styles.height || ""}
              placeholder="auto / 80px"
              onChange={(event) => style("height", event.target.value)}
            />
          </div>
        </StyleCard>
      </div>
    )
  }

  const renderActionSection = () => {
    if (!treatsAsButton || !element) return null
    const ci: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "8px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", display: "block" }
    const cs: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "8px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none" as React.CSSProperties["appearance"], backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center", paddingRight: 30 }
    return (
      <div ref={actionSectionRef}>
      <StyleCard icon="▶" title="Destino del boton">
        {element.tag === "button" ? (
          <div>
            <StyleLabel>Tipo de boton</StyleLabel>
            <select
              style={cs}
              value={element.attrs?.type || "button"}
              onChange={(event) => attr("type", event.target.value)}
            >
              <option value="button">button</option>
              <option value="submit">submit</option>
              <option value="reset">reset</option>
            </select>
          </div>
        ) : null}
        <div>
          <StyleLabel>Enlace</StyleLabel>
          <input
            style={ci}
            value={localHref}
            placeholder={element.isLink ? "/ruta o https://..." : "Opcional"}
            onChange={(event) => setLocalHref(event.target.value)}
            onBlur={() => attr("href", localHref)}
          />
        </div>
        <div>
          <StyleLabel>Como se abre</StyleLabel>
          <select
            style={cs}
            value={localTarget}
            onChange={(event) => {
              setLocalTarget(event.target.value)
              attr("target", event.target.value)
            }}
          >
            <option value="">En esta pagina</option>
            <option value="_blank">En una pestana nueva</option>
          </select>
        </div>
      </StyleCard>
      </div>
    )
  }

  const renderFieldContent = () => {
    const ci: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "8px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", display: "block" }
    const ca: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "10px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", minHeight: 84, lineHeight: 1.6, display: "block" }
    const cs: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "8px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", cursor: "pointer", appearance: "none" as React.CSSProperties["appearance"], backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23555' stroke-width='1.4' fill='none' stroke-linecap='round'/%3E%3C/svg%3E\")", backgroundRepeat: "no-repeat", backgroundPosition: "right 11px center", paddingRight: 30 }
    const toggleBtn = (active: boolean) => ({ border: `0.5px solid ${active ? "#E84040" : "#2a2a2a"}`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 500, textAlign: "center" as const, cursor: "pointer", background: active ? "#E84040" : "#111", color: active ? "#fff" : "#666", transition: "all .12s", fontFamily: "inherit", width: "100%" })
    return (
      <div ref={fieldSectionRef}>
      <StyleCard icon="⊟" title="Contenido del campo">
        {element?.tag === "input" ? (
          <div>
            <StyleLabel>Tipo de input</StyleLabel>
            <select
              style={cs}
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
          </div>
        ) : (
          <div>
            <StyleLabel>Tipo de campo</StyleLabel>
            <input style={ci} value={element?.tag || ""} readOnly />
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div>
            <StyleLabel>ID del campo</StyleLabel>
            <input
              style={ci}
              value={localId}
              placeholder="id-del-campo"
              onChange={(event) => setLocalId(event.target.value)}
              onBlur={() => attr("id", localId)}
            />
          </div>
          <div>
            <StyleLabel>Nombre tecnico</StyleLabel>
            <input
              style={ci}
              value={localName}
              placeholder="name del campo"
              onChange={(event) => setLocalName(event.target.value)}
              onBlur={() => attr("name", localName)}
            />
          </div>
        </div>

        {supportsAutocomplete ? (
          <div>
            <StyleLabel>Autocomplete</StyleLabel>
            <input
              style={ci}
              value={localAutocomplete}
              placeholder="on / off / name / email / tel"
              onChange={(event) => setLocalAutocomplete(event.target.value)}
              onBlur={() => attr("autocomplete", localAutocomplete)}
            />
          </div>
        ) : null}

        {supportsPlaceholder ? (
          <div>
            <StyleLabel>Texto de ayuda</StyleLabel>
            <input
              style={ci}
              value={localPlaceholder}
              placeholder="Texto de ayuda"
              onChange={(event) => setLocalPlaceholder(event.target.value)}
              onBlur={() => attr("placeholder", localPlaceholder)}
            />
          </div>
        ) : null}

        {element?.tag === "select" ? (
          <>
            <div>
              <StyleLabel>Valor seleccionado</StyleLabel>
              <select
                style={cs}
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
            </div>
            <div>
              <StyleLabel>Opciones</StyleLabel>
              <textarea
                style={ca}
                value={localSelectOptions}
                onChange={(event) => setLocalSelectOptions(event.target.value)}
                onBlur={applySelectOptions}
                placeholder={"matematicas|Matematicas\nlengua|Lengua\nciencias|Ciencias"}
              />
            </div>
          </>
        ) : (
          <div>
            <StyleLabel>{isChoiceField ? "Valor enviado" : "Valor por defecto"}</StyleLabel>
            <input
              style={ci}
              value={localValue}
              placeholder={isChoiceField ? "valor-opcion" : "Valor inicial"}
              onChange={(event) => setLocalValue(event.target.value)}
              onBlur={() => applyFieldValue(localValue)}
            />
          </div>
        )}

        {supportsRows ? (
          <div>
            <StyleLabel>Filas visibles</StyleLabel>
            <input
              style={ci}
              type="number"
              min={1}
              value={localRows}
              placeholder="4"
              onChange={(event) => setLocalRows(event.target.value)}
              onBlur={() => attr("rows", localRows)}
            />
          </div>
        ) : null}

        {supportsNumericRange ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            <div>
              <StyleLabel>Minimo</StyleLabel>
              <input
                style={ci}
                value={localMin}
                placeholder="0"
                onChange={(event) => setLocalMin(event.target.value)}
                onBlur={() => attr("min", localMin)}
              />
            </div>
            <div>
              <StyleLabel>Maximo</StyleLabel>
              <input
                style={ci}
                value={localMax}
                placeholder="100"
                onChange={(event) => setLocalMax(event.target.value)}
                onBlur={() => attr("max", localMax)}
              />
            </div>
            <div>
              <StyleLabel>Paso</StyleLabel>
              <input
                style={ci}
                value={localStep}
                placeholder="1"
                onChange={(event) => setLocalStep(event.target.value)}
                onBlur={() => attr("step", localStep)}
              />
            </div>
          </div>
        ) : null}

        <div style={{ display: "grid", gridTemplateColumns: element?.tag === "select" || isChoiceField ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: 8 }}>
          <button
            type="button"
            onClick={() => {
              const next = !isRequired
              setIsRequired(next)
              toggleAttr("required", next)
            }}
            style={toggleBtn(isRequired)}
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
            style={toggleBtn(isDisabled)}
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
              style={toggleBtn(isMultiple)}
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
              style={toggleBtn(isChecked)}
            >
              Marcado
            </button>
          ) : null}
        </div>

        <div>
          <StyleLabel>Texto emergente</StyleLabel>
          <input
            style={ci}
            value={localTitle}
            placeholder="Tooltip opcional"
            onChange={(event) => setLocalTitle(event.target.value)}
            onBlur={() => attr("title", localTitle)}
          />
        </div>

        {element?.tag === "select" ? (
          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            El selector ya permite editar opciones, valor inicial, modo multiple, color, borde y estado desde el panel visual.
          </div>
        ) : null}
      </StyleCard>
      </div>
    )
  }

  const renderTextContent = () => {
    if (!element) return null
    const ca: React.CSSProperties = { width: "100%", background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "10px 11px", color: "#ccc", fontSize: 12, fontFamily: "inherit", outline: "none", resize: "none", minHeight: 84, lineHeight: 1.6, display: "block" }
    return (
      <div ref={textSectionRef}>
      <StyleCard icon="¶" title="Contenido">
        {isEditing ? (
          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            Editando inline en el canvas. Pulsa Esc para salir y luego ajusta el contenido aqui.
          </div>
        ) : treatsAsText ? (
          <>
            <textarea
              style={ca}
              value={localText}
              onChange={(event) => {
                setLocalText(event.target.value)
                setText(event.target.value)
              }}
              onBlur={() => setText(localText)}
              placeholder="Texto visible del elemento"
            />
            <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>Tambien puedes hacer doble clic sobre el texto dentro del canvas.</div>
          </>
        ) : (
          <div style={{ background: "#111", border: "0.5px dashed #2a2a2a", borderRadius: 8, padding: "12px", fontSize: 11, color: "#555", lineHeight: 1.6 }}>
            Este bloque no tiene contenido directo. Entra a sus elementos internos desde Capas o inserta contenido nuevo mas abajo.
          </div>
        )}
      </StyleCard>
      </div>
    )
  }

  const renderContainerContent = () => {
    if (!element) return null
    return (
      <div ref={containerContentRef}>
        <StyleCard icon="▭" title="Contenido del bloque">
          <div style={{ background: "#111", border: "0.5px dashed #2a2a2a", borderRadius: 8, padding: "12px", fontSize: 11, color: "#555", lineHeight: 1.6 }}>
            Este bloque no tiene contenido directo. Usa la pestana <span style={{ fontWeight: 600, color: "#aaa" }}>Capas</span> para seleccionar un texto, boton, imagen o campo dentro del bloque, o agrega nuevos elementos mas abajo.
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <button
              type="button"
              {...getTouchSafeButtonProps("route:layers", () => updateInspectorTab("layers", { manual: true }))}
              style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              Ir a capas
            </button>
            <button
              type="button"
              onClick={() => cleanupLayout(element.eid)}
              style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}
            >
              Compactar bloque
            </button>
          </div>
        </StyleCard>
      </div>
    )
  }

  const renderIconSection = () => {
    if (!hasDetectedIconContext || !element) return null
    const isDirectIcon = nodeKind === "icon"
    return (
      <div ref={iconSectionRef}>
        <StyleCard icon="★" title={isDirectIcon ? "Ruta del icono" : "Iconos detectados"}>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {detectedEmojis.map((emoji) => (
              <span key={emoji} style={{ borderRadius: 20, border: "0.5px solid #2a2a2a", background: "#111", padding: "3px 9px", fontSize: 10, color: "#aaa" }}>
                {emoji}
              </span>
            ))}
            {visibleIconRefs.map((icon) => (
              <span key={icon} style={{ borderRadius: 20, border: "0.5px solid #E84040", background: "rgba(232,64,64,0.08)", padding: "3px 9px", fontSize: 10, color: "#E84040" }}>
                {icon}
              </span>
            ))}
            {detectedEmojis.length === 0 && visibleIconRefs.length === 0 ? (
              <span style={{ borderRadius: 20, border: "0.5px solid #2a2a2a", background: "#111", padding: "3px 9px", fontSize: 10, color: "#555" }}>
                Sin iconos detectados
              </span>
            ) : null}
          </div>
          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            {isDirectIcon
              ? "Abre Tipografia para cambiar libreria, color, tamano, trazo o reemplazar este icono por imagen."
              : "Este bloque contiene iconos o emojis. Para editarlos sin duplicar herramientas, selecciona el icono puntual en el canvas y usa Tipografia."}
          </div>
          <button
            type="button"
            {...getTouchSafeButtonProps("route:typography", () => updateInspectorTab("typography", { manual: true }))}
            style={{ width: "100%", background: "#E84040", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s" }}
          >
            Ir a Tipografia
          </button>
        </StyleCard>
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
      <StyleCard icon="＋" title="Agregar elemento">
        <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
          Si eliminaste algo del HTML importado, desde aqui puedes insertar otro titulo, boton, tarjeta, imagen o tu propio HTML.
        </div>
        <input ref={insertImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleInsertImageUpload} />
        <div>
          <StyleLabel>Lugar</StyleLabel>
          <div style={{ display: "grid", gridTemplateColumns: placementOptions.length === 4 ? "1fr 1fr 1fr 1fr" : "1fr 1fr", gap: 6 }}>
            {placementOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setInsertPlacement(opt.value as InsertPlacement)}
                style={{ border: `0.5px solid ${insertPlacement === opt.value ? "#E84040" : "#2a2a2a"}`, borderRadius: 8, padding: "8px 0", fontSize: 12, fontWeight: 500, textAlign: "center" as const, cursor: "pointer", background: insertPlacement === opt.value ? "#E84040" : "#111", color: insertPlacement === opt.value ? "#fff" : "#666", transition: "all .12s", fontFamily: "inherit", width: "100%" }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {Object.entries(templatesByGroup).map(([group, templates]) => (
            <div key={group}>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#3a3a3a", textTransform: "uppercase" as const, margin: "10px 0 7px" }}>{group}</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
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
                    style={{ background: "#111", border: "0.5px solid #242424", borderRadius: 9, padding: "10px 11px", cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit", width: "100%", display: "block" }}
                  >
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#ccc" }}>{template.label}</div>
                    <div style={{ marginTop: 4, fontSize: 10, lineHeight: 1.4, color: "#555" }}>{template.hint}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#3a3a3a", textTransform: "uppercase" as const, margin: "4px 0 3px" }}>HTML libre</p>
          <textarea
            style={{ width: "100%", background: "#111", border: "0.5px dashed #2a2a2a", borderRadius: 8, padding: "10px 11px", color: "#666", fontSize: 12, fontFamily: "'JetBrains Mono', monospace", outline: "none", resize: "none" as const, lineHeight: 1.6, minHeight: 72, display: "block" }}
            value={customInsertHtml}
            onChange={(event) => setCustomInsertHtml(event.target.value)}
            placeholder={'<div class="mi-bloque">Nuevo contenido</div>'}
          />
          <button
            type="button"
            onClick={() => {
              insertHtml(customInsertHtml)
              setCustomInsertHtml("")
            }}
            disabled={!customInsertHtml.trim()}
            style={customInsertHtml.trim()
              ? { width: "100%", background: "#E84040", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s", marginTop: 7 }
              : { width: "100%", background: "transparent", border: "0.5px solid #2a2a2a", borderRadius: 8, padding: "10px", fontSize: 12, color: "#444", cursor: "not-allowed", fontFamily: "inherit", fontWeight: 500, marginTop: 7 }
            }
          >
            Insertar HTML libre
          </button>
        </div>
      </StyleCard>
      </div>
    )
  }

  const renderLayersSection = () => {
    if (!element) return null
    const isRootNode = element.id === "he-import-root"
    return (
      <div ref={layersSectionRef}>
      <StyleCard icon="◫" title="Capas">
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ background: "#1a0808", border: "0.5px solid #E84040", borderRadius: 10, padding: "12px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#E84040", textTransform: "uppercase" as const }}>Seleccion actual</div>
            <div style={{ marginTop: 6, fontSize: 13, fontWeight: 600, color: "#ccc" }}>{formatLayerTitle(element.tag, element.text || "", isRootNode)}</div>
            <div style={{ marginTop: 4, fontSize: 10, color: "#666" }}>
              {formatNodeKindLabel(nodeKind)} · {element.tag}
              {element.eid ? ` [${element.eid}]` : ""}
            </div>
            <div style={{ marginTop: 10, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
              <button type="button" onClick={() => moveNode("up", element.eid)} style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Subir</button>
              <button type="button" onClick={() => moveNode("down", element.eid)} style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Bajar</button>
              <button type="button" onClick={() => cleanupLayout(element.eid)} style={{ padding: "9px", borderRadius: 8, border: "0.5px solid #2a2a2a", background: "transparent", color: "#999", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>Compactar</button>
            </div>
          </div>

          {element.parentEid ? (
            <button
              type="button"
              onClick={() => selectNode(element.parentEid)}
              style={{ background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 9, padding: "10px 12px", transition: "all .12s", textAlign: "left" as const, cursor: "pointer", fontFamily: "inherit", width: "100%" }}
            >
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#555", textTransform: "uppercase" as const }}>Bloque padre</div>
              <div style={{ marginTop: 4, fontSize: 12, fontWeight: 600, color: "#ccc" }}>{formatLayerTitle(element.parentTag || "div")}</div>
              <div style={{ marginTop: 3, fontSize: 10, color: "#555" }}>{element.parentTag}{element.parentEid ? ` [${element.parentEid}]` : ""}</div>
            </button>
          ) : null}

          <div style={{ display: "flex", flexDirection: "column", gap: 6, background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 9, padding: "10px 12px" }}>
            <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: ".1em", color: "#555", textTransform: "uppercase" as const }}>Elementos internos</div>
            {element.children?.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {element.children.slice(0, 16).map((child) => (
                  <div
                    key={`${child.eid}-${child.tag}`}
                    style={{ background: "#111", border: "0.5px solid #2a2a2a", borderRadius: 9, padding: "10px 12px", transition: "all .12s" }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 8 }}>
                      <button type="button" onClick={() => selectNode(child.eid)} style={{ minWidth: 0, flex: 1, textAlign: "left" as const, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc" }}>{formatLayerTitle(child.tag, child.label)}</div>
                        <div style={{ marginTop: 3, fontSize: 10, color: "#555", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {formatLayerTitle(child.tag)}
                          {child.eid ? ` [${child.eid}]` : ""}
                        </div>
                      </button>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <button type="button" onClick={() => moveNode("up", child.eid)} style={{ borderRadius: 6, border: "0.5px solid #2a2a2a", padding: "4px 8px", fontSize: 10, background: "transparent", color: "#666", cursor: "pointer" }}>↑</button>
                        <button type="button" onClick={() => moveNode("down", child.eid)} style={{ borderRadius: 6, border: "0.5px solid #2a2a2a", padding: "4px 8px", fontSize: 10, background: "transparent", color: "#666", cursor: "pointer" }}>↓</button>
                        <button type="button" onClick={() => deleteNode(child.eid)} style={{ borderRadius: 6, border: "0.5px solid rgba(248,113,113,.25)", padding: "4px 8px", fontSize: 10, background: "transparent", color: "#f87171", cursor: "pointer" }}>Borrar</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
                Este elemento no tiene hijos directos. Selecciona otro nodo del canvas o cambia al bloque padre.
              </div>
            )}
          </div>

          <div style={{ background: "#111", border: "0.5px solid #222", borderRadius: 8, padding: "9px 11px", fontSize: 11, color: "#555", lineHeight: 1.5 }}>
            Usa esta vista para moverte por el bloque sin perderte en el canvas. Desde aqui puedes seleccionar, subir, bajar, borrar y compactar partes del bloque.
          </div>
        </div>
      </StyleCard>
      </div>
    )
  }

  const renderDragSection = () => (
    <StyleCard icon="⇅" title="Mover en el canvas">
      <button
        type="button"
        onClick={enableDrag}
        style={dragOn
          ? { width: "100%", background: "#E84040", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s" }
          : { width: "100%", background: "#E84040", border: "none", borderRadius: 8, padding: "10px", fontSize: 12, color: "#fff", cursor: "pointer", fontFamily: "inherit", fontWeight: 500, transition: "all .15s" }
        }
      >
        {dragOn ? "Reorden visual activo" : "Activar mover entre bloques"}
      </button>
      <div style={{ fontSize: 11, color: "#555", lineHeight: 1.5 }}>
        Arrastra desde el canvas y suelta encima del bloque objetivo. Los cambios quedan solo en el borrador hasta que guardes o publiques.
      </div>
    </StyleCard>
  )

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
        {showCloseButton ? (
          <button onClick={onClose} className="text-sm leading-none text-white/25 transition-colors hover:text-white">
            x
          </button>
        ) : null}
      </div>

      {view === "full" ? (
        <div
          className={cn(
            "grid gap-2 rounded-2xl border border-white/10 bg-[#0b1220] p-1",
            INSPECTOR_TABS.length >= 4 ? "grid-cols-4" : "grid-cols-3"
          )}
        >
          {INSPECTOR_TABS.map((item) => (
            <InspectorTabButton
              key={item.key}
              active={activeTab === item.key}
              {...getTouchSafeButtonProps(`tab:${item.key}`, () => updateInspectorTab(item.key, { manual: true }))}
            >
              {item.label}
            </InspectorTabButton>
          ))}
        </div>
      ) : null}

      {activeTab === "style" ? (
        nodeKind === "icon" ? (
          <div className="space-y-3">
            {renderIconSection()}
          </div>
        ) : (
          <div className="space-y-3">
            {renderPresetSection()}
            {(nodeKind === "button" || nodeKind === "field" || nodeKind === "container" || nodeKind === "image") ? renderBoxSection(nodeKind === "image" ? "Marco visual" : "Apariencia") : null}
            {nodeKind === "container" ? renderLayoutSection() : null}
            {renderSpacingSection()}
            {nodeKind === "button" || nodeKind === "image" || nodeKind === "container" || nodeKind === "field" ? renderDimensionSection() : null}
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
        )
      ) : activeTab === "typography" ? (
        <div className="space-y-3">
          {renderTypographySection()}
        </div>
      ) : activeTab === "layers" ? (
        <div className="space-y-3">
          {renderLayersSection()}
          {renderDragSection()}
        </div>
      ) : (
        <div className="space-y-3">
          {nodeKind === "icon" ? (
            <>
              {renderIconSection()}
              {renderDragSection()}
            </>
          ) : (
            <>
              {nodeKind === "container" ? renderContainerContent() : null}
              {nodeKind === "image" ? renderImageContent() : null}
              {nodeKind === "field" ? renderFieldContent() : null}
              {nodeKind === "text" || nodeKind === "button" ? renderTextContent() : null}
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
