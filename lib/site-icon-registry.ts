"use client"

export type SiteIconName =
  | "clipboard-list"
  | "graduation-cap"
  | "book-open"
  | "books"
  | "file-text"
  | "check-circle"
  | "bar-chart"
  | "timer"
  | "target"
  | "lightbulb"
  | "pin"
  | "lock"
  | "globe"
  | "map-pin"
  | "calendar-days"
  | "presentation"
  | "building"
  | "image"
  | "sparkles"
  | "mail"
  | "phone"
  | "user"
  | "users"
  | "message-circle"
  | "shield"
  | "award"
  | "play-circle"
  | "rocket"
  | "monitor"
  | "beaker"
  | "palette"
  | "music"
  | "dumbbell"
  | "chef-hat"
  | "calculator"
  | "wrench"
  | "pencil"
  | "brain"

interface SiteIconDefinition {
  name: SiteIconName
  label: string
  keywords: string[]
  paths: string
}

interface SiteIconRenderOptions {
  size?: number
  color?: string
  strokeWidth?: number
  className?: string
  eid?: string
}

const ICONS: SiteIconDefinition[] = [
  {
    name: "clipboard-list",
    label: "Checklist",
    keywords: ["clipboard", "list", "tasks", "document", "form"],
    paths: '<rect x="6" y="4" width="12" height="16" rx="2"></rect><path d="M9 4.5v-1a1.5 1.5 0 0 1 3 0v1"></path><path d="M9 9.5h6"></path><path d="M9 13.5h6"></path><path d="M9 17.5h4"></path>',
  },
  {
    name: "graduation-cap",
    label: "Graduacion",
    keywords: ["education", "school", "student", "academy"],
    paths: '<path d="m3 9 9-4 9 4-9 4-9-4Z"></path><path d="M7 11.5v4.2c0 .6 2.2 2.3 5 2.3s5-1.7 5-2.3v-4.2"></path><path d="M19 10.5v5"></path>',
  },
  {
    name: "book-open",
    label: "Libro abierto",
    keywords: ["book", "reading", "manual", "guide"],
    paths: '<path d="M3.5 6.5A2.5 2.5 0 0 1 6 4h4.5A2.5 2.5 0 0 1 13 6.5V20a2 2 0 0 0-2-2H6a2.5 2.5 0 0 0-2.5 2V6.5Z"></path><path d="M20.5 6.5A2.5 2.5 0 0 0 18 4h-4.5A2.5 2.5 0 0 0 11 6.5V20a2 2 0 0 1 2-2h5a2.5 2.5 0 0 1 2.5 2V6.5Z"></path>',
  },
  {
    name: "books",
    label: "Biblioteca",
    keywords: ["books", "stack", "resources", "study"],
    paths: '<path d="M5 6h10a2 2 0 0 1 2 2v10H7a2 2 0 0 1-2-2V6Z"></path><path d="M9 4h9a2 2 0 0 1 2 2v11"></path><path d="M5 10h12"></path>',
  },
  {
    name: "file-text",
    label: "Documento",
    keywords: ["file", "text", "doc", "paper", "sheet"],
    paths: '<path d="M8 3.5h6l4 4V20a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z"></path><path d="M14 3.5v4h4"></path><path d="M9.5 12h5"></path><path d="M9.5 15h5"></path><path d="M9.5 18h3.5"></path>',
  },
  {
    name: "check-circle",
    label: "Aprobado",
    keywords: ["check", "success", "done", "verified", "ok"],
    paths: '<circle cx="12" cy="12" r="9"></circle><path d="m8.5 12.2 2.2 2.2 4.8-5"></path>',
  },
  {
    name: "bar-chart",
    label: "Metricas",
    keywords: ["chart", "stats", "analytics", "graph", "data"],
    paths: '<path d="M5 19.5V11"></path><path d="M12 19.5V7"></path><path d="M19 19.5V4.5"></path><path d="M3.5 19.5h17"></path>',
  },
  {
    name: "timer",
    label: "Temporizador",
    keywords: ["timer", "clock", "time", "countdown", "exam"],
    paths: '<circle cx="12" cy="13" r="7.5"></circle><path d="M12 13V9.5"></path><path d="m12 13 2.8 1.8"></path><path d="M9 3.5h6"></path><path d="M12 5.5V3"></path>',
  },
  {
    name: "target",
    label: "Objetivo",
    keywords: ["goal", "focus", "aim", "bullseye"],
    paths: '<circle cx="12" cy="12" r="8"></circle><circle cx="12" cy="12" r="4.5"></circle><circle cx="12" cy="12" r="1.2"></circle>',
  },
  {
    name: "lightbulb",
    label: "Idea",
    keywords: ["idea", "tip", "hint", "smart", "insight"],
    paths: '<path d="M9 17h6"></path><path d="M10 20h4"></path><path d="M8.5 13.5c-1.3-1-2-2.5-2-4.1A5.5 5.5 0 0 1 12 4a5.5 5.5 0 0 1 5.5 5.4c0 1.7-.8 3.2-2.1 4.2-.6.5-.9 1.2-.9 2V17h-5v-1.4c0-.8-.3-1.6-1-2.1Z"></path>',
  },
  {
    name: "pin",
    label: "Pin",
    keywords: ["pin", "notice", "mark", "tag"],
    paths: '<path d="M15.5 4.5 19 8l-3.2 1.2-2.7 5.7-1.5-1.5-5.7 2.7 2.7-5.7L7 9l-2.5-2.5 11-2Z"></path><path d="m11 13 2 2"></path>',
  },
  {
    name: "lock",
    label: "Seguridad",
    keywords: ["lock", "secure", "private", "protected"],
    paths: '<rect x="6.5" y="10" width="11" height="9" rx="2"></rect><path d="M9 10V7.8A3 3 0 0 1 12 5a3 3 0 0 1 3 2.8V10"></path>',
  },
  {
    name: "globe",
    label: "Global",
    keywords: ["globe", "world", "web", "internet", "global"],
    paths: '<circle cx="12" cy="12" r="9"></circle><path d="M3.5 12h17"></path><path d="M12 3c2.5 2.5 3.8 5.5 3.8 9S14.5 18.5 12 21"></path><path d="M12 3C9.5 5.5 8.2 8.5 8.2 12s1.3 6.5 3.8 9"></path>',
  },
  {
    name: "map-pin",
    label: "Ubicacion",
    keywords: ["map", "location", "place", "marker"],
    paths: '<path d="M12 21s6-5.5 6-10.2A6 6 0 0 0 12 4.8a6 6 0 0 0-6 6C6 15.5 12 21 12 21Z"></path><circle cx="12" cy="10.8" r="2.2"></circle>',
  },
  {
    name: "calendar-days",
    label: "Calendario",
    keywords: ["calendar", "date", "event", "schedule"],
    paths: '<rect x="4" y="5.5" width="16" height="14" rx="2"></rect><path d="M8 3.5v4"></path><path d="M16 3.5v4"></path><path d="M4 9.5h16"></path><path d="M8 13h3"></path><path d="M13 13h3"></path><path d="M8 16.5h3"></path>',
  },
  {
    name: "presentation",
    label: "Docencia",
    keywords: ["presentation", "teacher", "training", "class"],
    paths: '<rect x="5" y="4" width="14" height="10" rx="2"></rect><path d="M12 14v4.5"></path><path d="M9 20.5h6"></path><path d="m8.5 9 2.2-2 1.6 1.5L15.5 6"></path>',
  },
  {
    name: "building",
    label: "Institucion",
    keywords: ["building", "school", "office", "campus"],
    paths: '<path d="M5 20.5V7.5l7-3 7 3v13"></path><path d="M3.5 20.5h17"></path><path d="M9 10h1.5"></path><path d="M13.5 10H15"></path><path d="M9 13.5h1.5"></path><path d="M13.5 13.5H15"></path><path d="M11 20.5v-4h2v4"></path>',
  },
  {
    name: "image",
    label: "Imagen",
    keywords: ["image", "photo", "logo", "banner", "media"],
    paths: '<rect x="4" y="5" width="16" height="14" rx="2"></rect><circle cx="9" cy="10" r="1.5"></circle><path d="m6 17 4.2-4.2a1 1 0 0 1 1.4 0L14 15l1.7-1.7a1 1 0 0 1 1.4 0L19 15"></path>',
  },
  {
    name: "sparkles",
    label: "Destacado",
    keywords: ["sparkles", "magic", "featured", "highlight"],
    paths: '<path d="m12 3 1.1 3.4L16.5 7.5 13 8.6 12 12l-1-3.4-3.5-1.1 3.4-1.1L12 3Z"></path><path d="m18.5 13 0.7 2.1 2.1 0.7-2.1 0.7-0.7 2.1-0.7-2.1-2.1-0.7 2.1-0.7 0.7-2.1Z"></path><path d="m6 14 0.9 2.7L9.6 17.6l-2.7 0.9L6 21.2l-0.9-2.7-2.7-0.9 2.7-0.9L6 14Z"></path>',
  },
  {
    name: "mail",
    label: "Correo",
    keywords: ["mail", "email", "message", "contact", "inbox"],
    paths: '<rect x="4" y="6" width="16" height="12" rx="2"></rect><path d="m5 7 7 5 7-5"></path>',
  },
  {
    name: "phone",
    label: "Telefono",
    keywords: ["phone", "call", "mobile", "contact", "support"],
    paths: '<path d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5v12A1.5 1.5 0 0 1 16 19.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z"></path><path d="M10 7.5h4"></path><path d="M11 16.5h2"></path>',
  },
  {
    name: "user",
    label: "Usuario",
    keywords: ["user", "person", "profile", "account", "avatar"],
    paths: '<circle cx="12" cy="8.5" r="3.2"></circle><path d="M5.5 19a6.5 6.5 0 0 1 13 0"></path>',
  },
  {
    name: "users",
    label: "Usuarios",
    keywords: ["users", "team", "group", "people", "community"],
    paths: '<circle cx="9" cy="9" r="2.6"></circle><circle cx="15.5" cy="10" r="2.3"></circle><path d="M4.8 18a5 5 0 0 1 8.4-2.8"></path><path d="M13.3 18a4.2 4.2 0 0 1 6.2-2"></path>',
  },
  {
    name: "message-circle",
    label: "Mensaje",
    keywords: ["message", "chat", "bubble", "conversation", "support"],
    paths: '<path d="M7 18.5 4.5 20v-4A7.5 7.5 0 1 1 19.5 12a7.4 7.4 0 0 1-1.4 4.4"></path>',
  },
  {
    name: "shield",
    label: "Escudo",
    keywords: ["shield", "secure", "protection", "trust", "safety"],
    paths: '<path d="M12 3.8 18.5 6v5.5c0 4.2-2.7 7.1-6.5 8.7-3.8-1.6-6.5-4.5-6.5-8.7V6L12 3.8Z"></path><path d="m9.2 12.2 1.8 1.8 3.8-4"></path>',
  },
  {
    name: "award",
    label: "Premio",
    keywords: ["award", "medal", "badge", "achievement", "winner"],
    paths: '<circle cx="12" cy="9" r="4"></circle><path d="M9.5 13.2 8 20l4-2.2L16 20l-1.5-6.8"></path>',
  },
  {
    name: "play-circle",
    label: "Play",
    keywords: ["play", "video", "demo", "start", "media"],
    paths: '<circle cx="12" cy="12" r="9"></circle><path d="m10 8.8 5 3.2-5 3.2Z"></path>',
  },
  {
    name: "rocket",
    label: "Lanzamiento",
    keywords: ["rocket", "launch", "growth", "speed", "startup"],
    paths: '<path d="M14.5 4.5c2.3.2 4.1 2 4.3 4.3-.1 4-2.6 6.6-6.8 8.2l-2-2c1.6-4.2 4.2-6.7 8.5-6.8Z"></path><path d="m9.5 14.5-2.8.8.8-2.8 1.7-1.7 2 2-1.7 1.7Z"></path><path d="M9 18c-.6 1.2-1.7 2.2-3.5 2.5.3-1.8 1.3-2.9 2.5-3.5"></path>',
  },
  {
    name: "monitor",
    label: "Pantalla",
    keywords: ["monitor", "desktop", "screen", "device", "web"],
    paths: '<rect x="4" y="5" width="16" height="11" rx="2"></rect><path d="M9 19.5h6"></path><path d="M12 16v3.5"></path>',
  },
  {
    name: "beaker",
    label: "Ciencias",
    keywords: ["beaker", "flask", "science", "chemistry", "lab"],
    paths: '<path d="M4.5 7.5h15v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z"></path><path d="M8.5 7.5V5.5h7v2"></path><path d="M12 11v5"></path>',
  },
  {
    name: "palette",
    label: "Artes",
    keywords: ["palette", "art", "creative", "design", "painting"],
    paths: '<circle cx="12" cy="12" r="9"></circle><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"></circle><circle cx="12" cy="7" r="1.5" fill="currentColor"></circle><circle cx="16.5" cy="8.5" r="1.5" fill="currentColor"></circle><circle cx="17" cy="13" r="1.5" fill="currentColor"></circle><circle cx="14" cy="17" r="1.5" fill="currentColor"></circle><circle cx="8.5" cy="15.5" r="1.5" fill="currentColor"></circle>',
  },
  {
    name: "music",
    label: "Musica",
    keywords: ["music", "song", "audio", "note", "sound"],
    paths: '<path d="M7 17v-6a2 2 0 1 1 4 0v6"></path><path d="M11 11v-4a2 2 0 1 1 4 0v4"></path><path d="M15 3v8a2 2 0 1 1-4 0V3"></path><path d="M7 17a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"></path><path d="M15 11a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z"></path>',
  },
  {
    name: "dumbbell",
    label: "Deportes",
    keywords: ["dumbbell", "sport", "fitness", "exercise", "gym"],
    paths: '<path d="M6 18.5h1v-12h-1a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1Z"></path><path d="M8 18.5h8v-12H8Z"></path><path d="M18 6.5h-1v12h1a1 1 0 0 0 1-1v-10a1 1 0 0 0-1-1Z"></path>',
  },
  {
    name: "chef-hat",
    label: "Cocina",
    keywords: ["chef", "cooking", "cuisine", "kitchen", "food"],
    paths: '<path d="M11 4h2v3h-2V4Z"></path><path d="M7 14h10l1-6H6l1 6Z"></path><path d="M7 14a2 2 0 0 0-2 2v1.5h14V16a2 2 0 0 0-2-2"></path><circle cx="7" cy="16.5" r=".5" fill="currentColor"></circle><circle cx="17" cy="16.5" r=".5" fill="currentColor"></circle>',
  },
  {
    name: "calculator",
    label: "Matematicas",
    keywords: ["calculator", "math", "compute", "numbers", "calculation"],
    paths: '<rect x="5" y="3" width="14" height="18" rx="2"></rect><rect x="7" y="6" width="10" height="3"></rect><path d="M7 11h10"></path><path d="M7 13.5h3.5"></path><path d="M13.5 13.5h3.5"></path><path d="M7 16h3.5"></path><path d="M13.5 16h3.5"></path>',
  },
  {
    name: "wrench",
    label: "Herramientas",
    keywords: ["wrench", "tool", "repair", "settings", "configure"],
    paths: '<path d="M6.5 11.5a5 5 0 0 1 8.2-3.8l4.2 4.2a1 1 0 0 1 0 1.4l-5 5a1 1 0 0 1-1.4 0l-4.2-4.2a5 5 0 0 1-1.8-2.6Z"></path><path d="M4.5 18l-2 2a1 1 0 0 1-1.4-1.4l2-2"></path>',
  },
  {
    name: "pencil",
    label: "Escritura",
    keywords: ["pencil", "edit", "write", "draw", "compose"],
    paths: '<path d="M17.5 2.5 19 4l-12 12H5v-2l12-12Z"></path><path d="m5 14-2 4.5 4.5-2L17.5 4"></path>',
  },
  {
    name: "brain",
    label: "Inteligencia",
    keywords: ["brain", "mind", "smart", "intelligence", "cognitive"],
    paths: '<path d="M9 4a1.5 1.5 0 0 0-1.5 1.5V7a2 2 0 0 0-2 2v1a2 2 0 0 0 2 2v1.5a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 0 3 0V12a1.5 1.5 0 0 0 3 0v-1.5a1.5 1.5 0 0 0 1.5-1.5v-1a2 2 0 0 0-2-2V5.5A1.5 1.5 0 0 0 15 4a1.5 1.5 0 0 0-1.5 1.5V7h-3V5.5A1.5 1.5 0 0 0 9 4Z"></path><path d="M6.5 13.5a2 2 0 0 0-2 2v.5a2.5 2.5 0 0 0 2.5 2.5h11a2.5 2.5 0 0 0 2.5-2.5v-.5a2 2 0 0 0-2-2"></path>',
  },
]

export const SITE_ICON_OPTIONS = ICONS.map(({ name, label, keywords }) => ({ name, label, keywords }))

export const siteIconRegistry = Object.fromEntries(
  ICONS.map((icon) => [icon.name, icon])
)

const ICON_ALIAS_MAP: Record<string, SiteIconName> = {
  users: "users",
  user: "user",
  trophy: "award",
  award: "award",
  star: "sparkles",
  sparkles: "sparkles",
  barchart3: "bar-chart",
  "bar-chart": "bar-chart",
  chart: "bar-chart",
  target: "target",
  bookopen: "book-open",
  "book-open": "book-open",
  books: "books",
  graduationcap: "graduation-cap",
  "graduation-cap": "graduation-cap",
  monitor: "monitor",
  globe: "globe",
  clipboardlist: "clipboard-list",
  "clipboard-list": "clipboard-list",
  checkcircle: "check-circle",
  "check-circle": "check-circle",
  presentation: "presentation",
  building: "building",
  image: "image",
  mail: "mail",
  phone: "phone",
  shield: "shield",
  rocket: "rocket",
  timer: "timer",
  lightbulb: "lightbulb",
  "light-bulb": "lightbulb",
}

export const EMOJI_ICON_MAP: Record<string, SiteIconName> = {
  "📋": "clipboard-list",
  "🎓": "graduation-cap",
  "📘": "book-open",
  "📚": "books",
  "📝": "file-text",
  "✅": "check-circle",
  "📊": "bar-chart",
  "⏱️": "timer",
  "🎯": "target",
  "💡": "lightbulb",
  "📌": "pin",
  "🔒": "lock",
  "🌐": "globe",
  "📍": "map-pin",
  "📅": "calendar-days",
  "👨‍🏫": "presentation",
  "🏫": "building",
  "🖼️": "image",
  "✨": "sparkles",
  "💻": "monitor",
  "🔬": "beaker",
  "🎨": "palette",
  "🎵": "music",
  "⚽": "dumbbell",
  "🍳": "chef-hat",
  "📖": "book-open",
  "🧮": "calculator",
  "🌍": "globe",
  "🔧": "wrench",
  "✏️": "pencil",
  "🚀": "rocket",
  "🧠": "brain",
}

const ICON_LOOKUP = new Map(ICONS.map((icon) => [icon.name, icon]))
const EMOJI_PATTERN = new RegExp(
  Object.keys(EMOJI_ICON_MAP)
    .sort((left, right) => right.length - left.length)
    .map((emoji) => emoji.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|"),
  "g"
)

function createIconMarkup(name: SiteIconName, size: number, color: string, strokeWidth = 1.9) {
  const icon = ICON_LOOKUP.get(name) ?? ICON_LOOKUP.get("sparkles")
  const safeStrokeWidth = Math.max(0.75, Math.min(4, Number(strokeWidth) || 1.9))
  const normalizedPaths = String(icon?.paths || "").replace(
    /<(path|rect|circle|line|polyline|polygon|ellipse|g|use)\b([^>]*)>/gi,
    (_match, tagName, rawAttrs) => {
      let attrs = String(rawAttrs || "")
        .replace(/\sfill=(["']).*?\1/gi, "")
        .replace(/\sstroke=(["']).*?\1/gi, "")
        .replace(/\sstroke-width=(["']).*?\1/gi, "")
        .replace(/\svector-effect=(["']).*?\1/gi, "")

      attrs = attrs.replace(/\sstyle=(["'])(.*?)\1/gi, (_styleMatch, quote, rawStyle) => {
        const cleanedStyle = String(rawStyle || "")
          .replace(/(?:^|;)\s*(fill|stroke|stroke-width|vector-effect|stroke-linecap|stroke-linejoin)\s*:[^;]*/gi, "")
          .replace(/;;+/g, ";")
          .replace(/^;|;$/g, "")
          .trim()

        const nextStyle = [
          cleanedStyle,
          "fill:none",
          "stroke:currentColor",
          `stroke-width:${safeStrokeWidth}`,
          "vector-effect:non-scaling-stroke",
          "stroke-linecap:round",
          "stroke-linejoin:round",
        ]
          .filter(Boolean)
          .join(";")

        return ` style=${quote}${nextStyle}${quote}`
      })

      if (!/\sstyle=/i.test(attrs)) {
        attrs += ` style="fill:none;stroke:currentColor;stroke-width:${safeStrokeWidth};vector-effect:non-scaling-stroke;stroke-linecap:round;stroke-linejoin:round"`
      }

      return `<${tagName}${attrs} fill="none" stroke="currentColor" stroke-width="${safeStrokeWidth}" vector-effect="non-scaling-stroke" stroke-linecap="round" stroke-linejoin="round">`
    }
  )
  return [
    `<svg xmlns="http://www.w3.org/2000/svg" data-he-icon="${name}" data-he-icon-svg="1" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" style="display:block;width:${size}px;height:${size}px;color:${color};pointer-events:none;stroke-width:${safeStrokeWidth};fill:none;vector-effect:non-scaling-stroke" stroke-width="${safeStrokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">`,
    normalizedPaths,
    "</svg>",
  ].join("")
}

function createFragmentDoc(html: string) {
  const parser = new DOMParser()
  return parser.parseFromString(`<!DOCTYPE html><html><body>${html}</body></html>`, "text/html")
}

function getFilter(doc: Document) {
  return doc.defaultView?.NodeFilter ?? NodeFilter
}

function createIconElement(
  doc: Document,
  name: SiteIconName,
  options?: SiteIconRenderOptions
) {
  const span = doc.createElement("span")
  const size = Math.max(12, Number(options?.size ?? 18))
  const color = options?.color || "currentColor"
  const strokeWidth = Math.max(0.75, Math.min(4, Number(options?.strokeWidth ?? 1.9) || 1.9))
  if (options?.eid) {
    span.dataset.eid = options.eid
  }
  span.setAttribute("data-he-icon-root", "1")
  span.setAttribute("data-he-icon", name)
  span.setAttribute("data-he-node-type", "icon")
  span.setAttribute("contenteditable", "false")
  if (options?.className) {
    span.className = options.className
  }
  span.style.cssText = [
    "display:inline-flex",
    "align-items:center",
    "justify-content:center",
    "vertical-align:middle",
    "line-height:0",
    "flex-shrink:0",
    "position:relative",
    "pointer-events:auto",
    `width:${size}px`,
    `height:${size}px`,
    `color:${color}`,
    `stroke-width:${strokeWidth}`,
  ].join(";")
  span.innerHTML = createIconMarkup(name, size, color, strokeWidth)
  return span
}

function replaceTextNodeWithIcons(
  textNode: Text,
  doc: Document,
  options?: { forceIcon?: SiteIconName; size?: number; color?: string }
) {
  const text = textNode.textContent || ""
  if (!text || !EMOJI_PATTERN.test(text)) return false

  EMOJI_PATTERN.lastIndex = 0
  const fragment = doc.createDocumentFragment()
  let cursor = 0
  let match: RegExpExecArray | null

  while ((match = EMOJI_PATTERN.exec(text))) {
    const matchedEmoji = match[0]
    const index = match.index
    if (index > cursor) {
      fragment.appendChild(doc.createTextNode(text.slice(cursor, index)))
    }

    const iconName = options?.forceIcon || EMOJI_ICON_MAP[matchedEmoji]
    if (iconName) {
      fragment.appendChild(createIconElement(doc, iconName, { size: options?.size, color: options?.color, className: "he-inline-icon" }))
    } else {
      fragment.appendChild(doc.createTextNode(matchedEmoji))
    }
    cursor = index + matchedEmoji.length
  }

  if (cursor < text.length) {
    fragment.appendChild(doc.createTextNode(text.slice(cursor)))
  }

  textNode.replaceWith(fragment)
  return true
}

export function renderSiteIconSvg(
  name: SiteIconName,
  options?: { size?: number; color?: string; strokeWidth?: number }
) {
  const size = Math.max(12, Number(options?.size ?? 18))
  return createIconMarkup(name, size, options?.color || "currentColor", options?.strokeWidth)
}

export function resolveSiteIconName(
  value?: string | null,
  fallback: SiteIconName = "sparkles"
): SiteIconName {
  if (!value) return fallback

  const raw = String(value).trim()
  if (!raw) return fallback

  if (ICON_LOOKUP.has(raw as SiteIconName)) {
    return raw as SiteIconName
  }

  const emojiMatch = EMOJI_ICON_MAP[raw]
  if (emojiMatch) return emojiMatch

  const normalized = raw
    .toLowerCase()
    .replace(/[_\s]+/g, "-")

  if (ICON_LOOKUP.has(normalized as SiteIconName)) {
    return normalized as SiteIconName
  }

  const aliasKey = normalized.replace(/-/g, "")
  return ICON_ALIAS_MAP[normalized] ?? ICON_ALIAS_MAP[aliasKey] ?? fallback
}

export function renderSiteIconHtml(
  name: SiteIconName,
  options?: SiteIconRenderOptions
) {
  const doc = createFragmentDoc("")
  return createIconElement(doc, name, options).outerHTML
}

export function replaceIconHost(
  host: HTMLElement,
  name: SiteIconName,
  options?: { size?: number; color?: string; strokeWidth?: number }
) {
  const doc = host.ownerDocument
  const eid = host.dataset.eid || undefined
  const className = typeof host.className === "string" ? host.className : ""
  const computedColor =
    options?.color ||
    host.style.color ||
    host.ownerDocument.defaultView?.getComputedStyle(host).color ||
    "currentColor"
  const measuredWidth =
    host.style.width ||
    host.style.height ||
    host.ownerDocument.defaultView?.getComputedStyle(host).width ||
    "18"
  const size = options?.size ?? (parseInt(measuredWidth, 10) || 18)

  const next = createIconElement(doc, name, {
    eid,
    className,
    size,
    color: computedColor,
    strokeWidth: options?.strokeWidth,
  })

  if (host.parentNode) {
    host.parentNode.replaceChild(next, host)
  }

  return next
}

export function findKnownEmojis(text: string) {
  if (!text) return []
  return Array.from(new Set(text.match(EMOJI_PATTERN) ?? []))
}

export function hasKnownEmoji(text: string) {
  return findKnownEmojis(text).length > 0
}

export function findSiteIconsInHtml(html: string): SiteIconName[] {
  if (!html) return []
  const matches = Array.from(html.matchAll(/data-he-icon=["']([^"']+)["']/g))
  return Array.from(
    new Set(
      matches
        .map((match) => match[1] as SiteIconName)
        .filter((name) => ICON_LOOKUP.has(name))
    )
  )
}

export function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function replaceKnownEmojisInDocument(
  doc: Document,
  options?: { forceIcon?: SiteIconName; size?: number; color?: string }
) {
  const root = doc.body ?? doc.documentElement
  const filter = getFilter(doc)
  const walker = doc.createTreeWalker(root, filter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement
      const tag = parent?.tagName?.toLowerCase()
      if (!parent || (tag ? ["script", "style", "textarea"].includes(tag) : false)) {
        return filter.FILTER_REJECT
      }
      return hasKnownEmoji(node.textContent || "") ? filter.FILTER_ACCEPT : filter.FILTER_SKIP
    },
  })

  const nodes: Text[] = []
  while (walker.nextNode()) {
    nodes.push(walker.currentNode as Text)
  }

  let changed = false
  nodes.forEach((node) => {
    changed = replaceTextNodeWithIcons(node, doc, options) || changed
  })
  return changed
}

export function replaceKnownEmojisInHtmlFragment(
  html: string,
  options?: { forceIcon?: SiteIconName; size?: number; color?: string }
) {
  const doc = createFragmentDoc(html)
  replaceKnownEmojisInDocument(doc, options)
  return doc.body.innerHTML
}

export function replaceKnownEmojisInDocumentHtml(
  html: string,
  options?: { forceIcon?: SiteIconName; size?: number; color?: string }
) {
  const parser = new DOMParser()
  const isFullDocument = /<html[\s>]|<body[\s>]|<head[\s>]/i.test(html)
  const doc = parser.parseFromString(isFullDocument ? html : `<!DOCTYPE html><html><head></head><body>${html}</body></html>`, "text/html")
  replaceKnownEmojisInDocument(doc, options)
  return isFullDocument ? `<!DOCTYPE html>\n${doc.documentElement.outerHTML}` : doc.body.innerHTML
}

export function replaceFirstIconInHtmlFragment(
  html: string,
  iconName: SiteIconName,
  options?: SiteIconRenderOptions
) {
  const doc = createFragmentDoc(html)
  const existing = doc.body.querySelector<HTMLElement>("[data-he-icon], [data-he-icon-root]")

  if (existing) {
    existing.replaceWith(createIconElement(doc, iconName, options))
    return doc.body.innerHTML
  }

  if (replaceKnownEmojisInDocument(doc, { forceIcon: iconName, size: options?.size, color: options?.color })) {
    return doc.body.innerHTML
  }

  return [createIconElement(doc, iconName, options).outerHTML, html].join("")
}
