"use client"

import type {
  CMSCustomCodeImportSettings,
  CMSCustomCodeThemeConfig,
  CMSHtmlImportMode,
} from "@/hooks/use-cms"
import { replaceKnownEmojisInDocument } from "@/lib/site-icon-registry"

export interface ParsedHtml {
  styles: string[]
  scripts: string[]
  body: string
  title: string
  raw: string
}

type HtmlType = "simulator" | "form" | "landing" | "widget" | "content"

export interface HtmlElements {
  buttons: number
  links: number
  inputs: number
  cards: number
  steps: number
  scripts: number
  styles: number
  hasTimer: boolean
  hasScore: boolean
  hasForms: boolean
  hasVideo: boolean
  hasNavigation: boolean
  hasFooter: boolean
}

export interface HtmlDetection {
  label: string
  type: HtmlType
  title: string
  elements: HtmlElements
  recommendation: CMSHtmlImportMode
}

export interface HtmlImportBuildOptions {
  mode: CMSHtmlImportMode
  stripNavigation?: boolean
  stripFooter?: boolean
  theme?: CMSCustomCodeThemeConfig
}

const IMPORT_STYLE_SELECTOR = "style[data-he-import-style]"
const IMPORT_ROOT_SELECTOR = "[data-he-import-root='1']"
const RUNTIME_SELECTOR = "[data-he-runtime], [data-he-editor-overlay]"
const SKIP_EID_TAGS = new Set(["html", "head", "body", "meta", "link", "style", "script", "iframe", "noscript"])

function isIconStructuralTag(tag: string) {
  return ["svg", "path", "rect", "circle", "line", "polyline", "polygon", "ellipse", "g", "use"].includes(tag)
}

function isInsideIconRoot(el: HTMLElement) {
  const host = el.closest("[data-he-icon-root='1']")
  return !!host && host !== el
}

function createEditorIdFactory(root: ParentNode) {
  let max = 0
  root.querySelectorAll("[data-eid]").forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    const match = node.dataset.eid?.match(/^he-(\d+)$/)
    if (match) {
      max = Math.max(max, Number(match[1]))
    }
  })
  return () => {
    max += 1
    return `he-${max}`
  }
}

function createHtmlDocument(raw: string) {
  const parser = new DOMParser()
  const explicitDocument = /<html[\s>]|<body[\s>]|<head[\s>]/i.test(raw)
  const doc = parser.parseFromString(explicitDocument ? raw : `<!DOCTYPE html><html><head></head><body>${raw}</body></html>`, "text/html")
  cleanImportArtifacts(doc)
  return doc
}

function cleanImportArtifacts(doc: Document) {
  doc.querySelectorAll(`${IMPORT_STYLE_SELECTOR}, ${RUNTIME_SELECTOR}`).forEach((node) => node.remove())

  const importRoot = doc.querySelector(IMPORT_ROOT_SELECTOR)
  if (importRoot && importRoot.parentElement === doc.body) {
    while (importRoot.firstChild) {
      doc.body.insertBefore(importRoot.firstChild, importRoot)
    }
    importRoot.remove()
  }
}

function getTitleFromDocument(doc: Document) {
  const heading = doc.querySelector("h1, title")
  return (heading?.textContent || "Sin titulo").replace(/\s+/g, " ").trim().slice(0, 60) || "Sin titulo"
}

function removeSelectors(doc: Document, selectors: string[]) {
  const unique = new Set<Element>()
  selectors.forEach((selector) => {
    doc.querySelectorAll(selector).forEach((element) => {
      if (element.closest(IMPORT_ROOT_SELECTOR)) return
      unique.add(element)
    })
  })
  unique.forEach((element) => element.remove())
}

function stripImportedChrome(doc: Document, options: HtmlImportBuildOptions) {
  if (options.stripNavigation !== false) {
    removeSelectors(doc, [
      "body > nav",
      "body > header",
      "body > [role='navigation']",
      "nav.navbar",
      "nav.nav-bar",
      "header.site-header",
      ".navbar",
      ".nav-bar",
      "#navbar",
      "#main-nav",
      "#site-nav",
      "[data-navbar]",
      "[data-nav]",
    ])
  }

  if (options.stripFooter !== false) {
    removeSelectors(doc, [
      "body > footer",
      "footer.site-footer",
      ".site-footer",
      ".footer",
      "#footer",
      "[data-footer]",
    ])
  }
}

function ensureEditorIds(root: ParentNode) {
  const createEditorId = createEditorIdFactory(root)
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    const tag = node.tagName.toLowerCase()
    if (SKIP_EID_TAGS.has(tag)) return
    if (isInsideIconRoot(node) && isIconStructuralTag(tag)) {
      node.removeAttribute("data-eid")
      node.removeAttribute("data-he-node-type")
      return
    }
    if (!node.dataset.eid) {
      node.dataset.eid = createEditorId()
    }
  })
}

function inferEditorNodeType(el: HTMLElement): "text" | "icon" | "button" | "field" | "image" | "container" {
  const tag = el.tagName.toLowerCase()
  const className = typeof el.className === "string" ? el.className.toLowerCase() : ""
  const text = (el.textContent || "").replace(/\s+/g, " ").trim()

  if (
    el.getAttribute("data-he-icon-root") === "1" ||
    !!el.getAttribute("data-he-icon") ||
    className.includes("he-inline-icon") ||
    className.includes("lucide")
  ) {
    return "icon"
  }

  if (tag === "svg" && !isInsideIconRoot(el)) return "icon"

  if (tag === "img") return "image"

  if (["input", "textarea", "select"].includes(tag)) {
    return "field"
  }

  if (
    tag === "button" ||
    tag === "a" ||
    el.getAttribute("role") === "button" ||
    el.hasAttribute("onclick")
  ) {
    return "button"
  }

  if (
    ["p", "h1", "h2", "h3", "h4", "h5", "h6", "span", "label", "small", "strong", "em", "blockquote", "li"].includes(tag) &&
    text.length > 0
  ) {
    return "text"
  }

  return "container"
}

function markEditableNodeTypes(root: ParentNode) {
  root.querySelectorAll("*").forEach((node) => {
    if (!(node instanceof HTMLElement)) return
    if (!node.dataset.eid) return
    const tag = node.tagName.toLowerCase()
    if (isInsideIconRoot(node) && isIconStructuralTag(tag)) {
      node.removeAttribute("data-he-node-type")
      return
    }
    node.setAttribute("data-he-node-type", inferEditorNodeType(node))
  })
}

function ensureImportRoot(doc: Document) {
  const existing = doc.body.querySelector(IMPORT_ROOT_SELECTOR)
  if (existing instanceof HTMLElement) return existing

  const root = doc.createElement("div")
  root.id = "he-import-root"
  root.setAttribute("data-he-import-root", "1")

  while (doc.body.firstChild) {
    root.appendChild(doc.body.firstChild)
  }

  doc.body.appendChild(root)
  return root
}

function buildThemeCss(mode: CMSHtmlImportMode, theme?: CMSCustomCodeThemeConfig) {
  const primary = theme?.accentColor || "var(--he-primary, #E8392A)"
  const text = theme?.textColor || "var(--he-foreground, #E2EAF0)"
  const muted = theme?.mutedColor || "var(--he-muted, rgba(226,234,240,.68))"
  const surface = theme?.surfaceColor || "var(--he-surface, rgba(13,24,38,.82))"
  const border = theme?.borderColor || "var(--he-border, rgba(120,144,171,.18))"
  const background = theme?.backgroundColor || "var(--he-background, transparent)"
  const navBackground = theme?.navBackground || "var(--he-nav-bg, rgba(7,15,24,.96))"
  const navBorder = theme?.navBorderColor || "var(--he-nav-border, rgba(232,57,42,.12))"
  const radius = `${Math.max(0, Number(theme?.radius ?? 18))}px`
  const fontFamily = theme?.fontFamily || "var(--he-font-sans, 'Barlow', system-ui, sans-serif)"

  const root = "#he-import-root"
  const aggressive = mode === "adapted"

  return [
    `:root{color-scheme:dark;}`,
    `html,body{margin:0;padding:0;background:transparent !important;}`,
    `${root}{color:${text};background:${background};font-family:${fontFamily};}`,
    `${root},${root} *{box-sizing:border-box;}`,
    `${root}{width:100%;max-width:100%;}`,
    `${root} > *{margin-left:auto;margin-right:auto;}`,
    aggressive ? `${root} *{font-family:${fontFamily} !important;}` : "",
    `${root} :where(h1,h2,h3,h4,h5,h6){color:${text}${aggressive ? " !important" : ""};line-height:1.1;font-weight:800;letter-spacing:-0.02em;text-wrap:balance;}`,
    `${root} :where(p,span,li,label,small,strong,em,blockquote){color:${text}${aggressive ? " !important" : ""};}`,
    `${root} :where(h1,h2,h3,h4,h5,h6,p,span,li,label,small,strong,em,blockquote,a,button){overflow-wrap:anywhere;word-break:break-word;}`,
    `${root} :where(h1,h2,h3,h4,h5,h6,p){margin-left:auto;margin-right:auto;}`,
    `${root} :where(label){display:block;max-width:100%;line-height:1.35;}`,
    `${root} :where(a){color:${primary}${aggressive ? " !important" : ""};text-decoration:none;}`,
    `${root} :where(button,[type='button'],[type='submit'],[role='button'],.btn,.button,a.button,a.btn){display:inline-flex;align-items:center;justify-content:center;gap:.55rem;flex-wrap:wrap;max-width:100%;min-width:0;min-height:44px;background:${primary}${aggressive ? " !important" : ""};color:#fff${aggressive ? " !important" : ""};border:1px solid color-mix(in srgb, ${primary} 70%, #ffffff 8%)${aggressive ? " !important" : ""};border-radius:${radius}${aggressive ? " !important" : ""};padding:0.8rem 1.25rem${aggressive ? " !important" : ""};font-weight:700${aggressive ? " !important" : ""};line-height:1.3;box-shadow:0 10px 26px rgba(232,57,42,.18);transition:transform .2s ease, opacity .2s ease, box-shadow .2s ease;white-space:normal;text-align:center;overflow-wrap:anywhere;}`,
    `${root} :where(button,[type='button'],[type='submit'],[role='button'],.btn,.button,a.button,a.btn) > *{min-width:0;}`,
    `${root} :where(button,[type='button'],[type='submit'],[role='button'],.btn,.button,a.button,a.btn):hover{opacity:.94;transform:translateY(-1px);}`,
    `${root} :where(input,select,textarea){width:100%;max-width:100%;min-width:0;background:color-mix(in srgb, ${surface} 88%, #ffffff 4%)${aggressive ? " !important" : ""};border:1px solid ${border}${aggressive ? " !important" : ""};border-radius:${radius}${aggressive ? " !important" : ""};color:${text}${aggressive ? " !important" : ""};padding:.8rem .95rem${aggressive ? " !important" : ""};line-height:1.35;outline:none;}`,
    `${root} :where(select option){background:color-mix(in srgb, ${surface} 96%, #000000 4%);color:${text};}`,
    `${root} :where(input,select,textarea)::placeholder{color:${muted};}`,
    `${root} :where(input,select,textarea):focus{border-color:${primary}${aggressive ? " !important" : ""};box-shadow:0 0 0 3px color-mix(in srgb, ${primary} 20%, transparent);}`,
    `${root} :where(.card,[class*='card'],.panel,.box,.widget,.surface,[data-card]){background:${surface}${aggressive ? " !important" : ""};border:1px solid ${border}${aggressive ? " !important" : ""};border-radius:${radius}${aggressive ? " !important" : ""};backdrop-filter:blur(10px);max-width:100%;min-width:0;}`,
    `${root} :where(nav,header,[role='navigation'],.navbar,.nav-bar,.site-header){background:${navBackground}${aggressive ? " !important" : ""};color:${text}${aggressive ? " !important" : ""};border-bottom:1px solid ${navBorder}${aggressive ? " !important" : ""};backdrop-filter:blur(18px);}`,
    `${root} :where(nav a,header a,[role='navigation'] a,.navbar a,.nav-bar a,.site-header a){color:${text}${aggressive ? " !important" : ""};font-weight:700;letter-spacing:.04em;text-transform:uppercase;font-size:.8rem;}`,
    `${root} :where(nav button,header button,[role='navigation'] button,.navbar button,.nav-bar button,.site-header button){min-height:42px;}`,
    `${root} :where(section,article,.section,.wrapper,.container){max-width:100%;min-width:0;margin-left:auto;margin-right:auto;}`,
    `${root} :where(form,[class*='form'],[class*='simulator'],[class*='quiz'],[class*='exam']){width:min(100%,960px);max-width:100%;margin-left:auto;margin-right:auto;}`,
    `${root} :where([class*='row'],[class*='group'],[class*='grid'],[class*='field'],[class*='option'],[class*='actions']){min-width:0;}`,
    `${root} :where([class*='chips'],[class*='tags'],[class*='badges'],[class*='actions'],[class*='toolbar']){display:flex;flex-wrap:wrap;align-items:center;gap:.75rem;}`,
    `${root} :where(img,video,canvas,svg,iframe){max-width:100%;}`,
    `${root} :where([data-he-icon-root='1']){display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;line-height:0;color:inherit;}`,
    `${root} :where(.he-inline-icon){margin-inline:.1rem .45rem;}`,
    `${root} [data-he-node-type="icon"]{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;line-height:0;}`,
    `${root} [data-he-node-type="icon"] svg{display:block;width:100%;height:100%;stroke:currentColor;fill:none;pointer-events:none;}`,
    `${root} [data-he-node-type="text"]{min-width:0;}`,
    `${root} [data-he-node-type="button"]{cursor:pointer;}`,
    `${root} [data-he-node-type="field"]{min-width:0;}`,
    `${root} [data-he-node-type="container"]{min-width:0;}`,
  ].filter(Boolean).join("\n")
}

function injectThemeStyle(doc: Document, mode: CMSHtmlImportMode, theme?: CMSCustomCodeThemeConfig) {
  doc.querySelectorAll(IMPORT_STYLE_SELECTOR).forEach((node) => node.remove())
  const style = doc.createElement("style")
  style.setAttribute("data-he-import-style", "1")
  style.textContent = buildThemeCss(mode, theme)
  doc.head.appendChild(style)
}

function serializeDocument(doc: Document) {
  return `<!DOCTYPE html>\n${doc.documentElement.outerHTML}`
}

export function parseHtml(raw: string): ParsedHtml {
  const doc = createHtmlDocument(raw)
  const styles = Array.from(doc.querySelectorAll("style")).map((node) => node.textContent || "")
  const scripts = Array.from(doc.querySelectorAll("script")).map((node) => node.textContent || "")
  return {
    styles,
    scripts,
    body: doc.body.innerHTML,
    title: getTitleFromDocument(doc),
    raw,
  }
}

export function classifyHtml(raw: string, parsed = parseHtml(raw)): HtmlDetection {
  const doc = createHtmlDocument(parsed.raw)
  const lower = raw.toLowerCase()

  const buttons = doc.querySelectorAll("button, [type='button'], [type='submit'], .btn, .button").length
  const links = doc.querySelectorAll("a[href]").length
  const inputs = doc.querySelectorAll("input, select, textarea").length
  const forms = doc.querySelectorAll("form").length
  const cards = doc.querySelectorAll("[class*='card'], .panel, .widget, [data-card]").length
  const steps = doc.querySelectorAll("[class*='step'], [class*='screen'], [data-step]").length
  const styles = doc.querySelectorAll("style, link[rel='stylesheet']").length
  const scripts = doc.querySelectorAll("script").length
  const hasNavigation = doc.querySelectorAll("nav, header, [role='navigation'], .navbar, .nav-bar").length > 0
  const hasFooter = doc.querySelectorAll("footer, .footer, .site-footer").length > 0
  const hasTimer = lower.includes("timer") || lower.includes("countdown") || lower.includes("tiempo")
  const hasScore = lower.includes("score") || lower.includes("resultado") || lower.includes("puntaje")
  const hasForms = forms > 0 || inputs > 2
  const hasVideo = doc.querySelectorAll("video, iframe[src*='youtube'], iframe[src*='vimeo']").length > 0

  let type: HtmlType = "content"
  let label = "Contenido libre"

  if ((steps > 1 || hasTimer) && hasScore) {
    type = "simulator"
    label = "Simulador / Quiz"
  } else if (hasForms) {
    type = "form"
    label = "Formulario"
  } else if (cards > 2) {
    type = "landing"
    label = "Landing / Tarjetas"
  } else if (links + buttons > 4) {
    type = "widget"
    label = "Widget interactivo"
  }

  const recommendation: CMSHtmlImportMode =
    scripts > 0 || steps > 1 || hasTimer
      ? "hybrid"
      : "adapted"

  return {
    label,
    type,
    title: parsed.title,
    recommendation,
    elements: {
      buttons,
      links,
      inputs,
      cards,
      steps,
      scripts,
      styles,
      hasTimer,
      hasScore,
      hasForms,
      hasVideo,
      hasNavigation,
      hasFooter,
    },
  }
}

export function buildImportedHtml(raw: string, options: HtmlImportBuildOptions) {
  const doc = createHtmlDocument(raw)
  const parsed = parseHtml(raw)
  const detection = classifyHtml(raw, parsed)

  ensureEditorIds(doc)

  if (options.mode !== "sandbox") {
    stripImportedChrome(doc, options)
    ensureImportRoot(doc)
    replaceKnownEmojisInDocument(doc)
    ensureEditorIds(doc)
    markEditableNodeTypes(doc)
    injectThemeStyle(doc, options.mode, options.theme)
  } else {
    markEditableNodeTypes(doc)
  }

  return {
    html: serializeDocument(doc),
    title: parsed.title,
    detection,
  }
}

export function getHtmlImportSettings(data: Record<string, unknown>): Required<CMSCustomCodeImportSettings> {
  return {
    mode: (data.importMode as CMSHtmlImportMode) || "adapted",
    stripNavigation: data.stripNavigation !== false,
    stripFooter: data.stripFooter !== false,
  }
}
