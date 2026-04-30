"use client"

import { useState, useRef, useCallback, useEffect } from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

type BlockType =
  | "hero"
  | "features"
  | "testimonials"
  | "pricing"
  | "cta"
  | "stats"
  | "faq"
  | "video"
  | "logos"
  | "spacer"
  | "text"
  | "banner"
  | "navbar"

interface NavLink { label: string; href: string }

interface BlockData {
  id: string
  type: BlockType
  visible: boolean
  // Hero
  badge?: string
  title?: string
  subtitle?: string
  btnPrimary?: string
  btnSecondary?: string
  bgColor?: string
  textColor?: string
  accentColor?: string
  // Features
  features?: { icon: string; title: string; desc: string }[]
  // Testimonials
  testimonials?: { name: string; role: string; text: string; avatar: string }[]
  // Pricing
  plans?: { name: string; price: string; period: string; features: string[]; highlight: boolean }[]
  // Stats
  stats?: { value: string; label: string }[]
  // FAQ
  faqs?: { q: string; a: string }[]
  // Video
  videoUrl?: string
  videoTitle?: string
  // Logos
  logos?: string[]
  // Spacer
  spacerHeight?: number
  // Text / Banner
  content?: string
  // Navbar
  logo?: string
  navLinks?: NavLink[]
  navBg?: string
  navBtnLabel?: string
}

// ─── Default block templates ──────────────────────────────────────────────────

const BLOCK_TEMPLATES: Record<BlockType, Partial<BlockData>> = {
  navbar: {
    type: "navbar",
    logo: "HACK EVANS",
    navLinks: [
      { label: "Inicio", href: "/" },
      { label: "Docentes EC", href: "/docentes-ec" },
      { label: "Cursos", href: "/cursos" },
      { label: "IA", href: "/ia" },
      { label: "Simulador", href: "/simulador" },
    ],
    navBg: "#0a0a0a",
    navBtnLabel: "Iniciar Sesion",
    bgColor: "#0a0a0a",
    accentColor: "#e63c3c",
  },
  hero: {
    type: "hero",
    badge: "🎯 OSM 10 – 2026 Actualizado",
    title: "PREPARA TU ÉXITO DOCENTE",
    subtitle: "La plataforma #1 en Ecuador para docentes. Simuladores actualizados, evaluaciones personalizadas y seguimiento en tiempo real de tu progreso.",
    btnPrimary: "Comenzar Gratis",
    btnSecondary: "Ver Demo",
    bgColor: "#0d0d0d",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
  },
  features: {
    type: "features",
    title: "Todo lo que necesitas para aprobar",
    bgColor: "#111111",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    features: [
      { icon: "target", title: "Simuladores Actualizados", desc: "Practica con los simuladores más recientes del OSM 10-2026." },
      { icon: "bar-chart", title: "Seguimiento en Tiempo Real", desc: "Monitorea tu progreso con estadísticas detalladas." },
      { icon: "books", title: "Cursos Especializados", desc: "Contenido diseñado por expertos en educación ecuatoriana." },
      { icon: "brain", title: "IA Personalizada", desc: "Retroalimentación inteligente adaptada a tu nivel." },
      { icon: "file-text", title: "Evaluaciones Reales", desc: "Simulacros con la estructura oficial del Ministerio." },
      { icon: "monitor", title: "Acceso Móvil", desc: "Estudia desde cualquier dispositivo, en cualquier momento." },
    ],
  },
  stats: {
    type: "stats",
    title: "Números que hablan por sí solos",
    bgColor: "#0a0a0a",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    stats: [
      { value: "1,284+", label: "Docentes activos" },
      { value: "42", label: "Simuladores" },
      { value: "18", label: "Evaluaciones" },
      { value: "36", label: "Cursos" },
    ],
  },
  testimonials: {
    type: "testimonials",
    title: "Lo que dicen nuestros docentes",
    bgColor: "#111111",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    testimonials: [
      { name: "María González", role: "Docente de Matemáticas", text: "Gracias a Hack Evans aprobé el OSM con 95/100. Los simuladores son idénticos al examen real.", avatar: "MG" },
      { name: "Carlos Pérez", role: "Docente de Lengua", text: "La mejor inversión que he hecho. En 3 semanas mejoré mi puntaje en 30 puntos.", avatar: "CP" },
      { name: "Ana Rodríguez", role: "Docente de Ciencias", text: "La plataforma de IA me ayudó a identificar mis debilidades y trabajar en ellas.", avatar: "AR" },
    ],
  },
  pricing: {
    type: "pricing",
    title: "Elige tu plan",
    subtitle: "Sin contratos. Cancela cuando quieras.",
    bgColor: "#0d0d0d",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    plans: [
      { name: "Básico", price: "$9.99", period: "/mes", features: ["5 Simuladores", "3 Evaluaciones", "Soporte básico"], highlight: false },
      { name: "Pro", price: "$19.99", period: "/mes", features: ["Todos los simuladores", "Evaluaciones ilimitadas", "IA personalizada", "Soporte 24/7"], highlight: true },
      { name: "Equipo", price: "$49.99", period: "/mes", features: ["Todo el acceso premium", "Hasta 10 docentes", "Dashboard grupal", "Reportes avanzados"], highlight: false },
    ],
  },
  faq: {
    type: "faq",
    title: "Preguntas Frecuentes",
    bgColor: "#111111",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    faqs: [
      { q: "¿Los simuladores están actualizados al OSM 2026?", a: "Sí, todos nuestros simuladores están actualizados al currículo nacional vigente 2026." },
      { q: "¿Puedo cancelar mi suscripción en cualquier momento?", a: "Por supuesto. No hay contratos ni penalizaciones. Cancela cuando quieras." },
      { q: "¿Hay una prueba gratuita?", a: "Sí, puedes acceder a 3 simuladores y 1 evaluación de forma completamente gratuita." },
    ],
  },
  cta: {
    type: "cta",
    title: "¿Listo para aprobar el OSM?",
    subtitle: "Únete a más de 1,200 docentes que ya confían en Hack Evans",
    btnPrimary: "Empezar Ahora – Es Gratis",
    bgColor: "#e63c3c",
    textColor: "#ffffff",
    accentColor: "#ffffff",
  },
  video: {
    type: "video",
    videoTitle: "Conoce la plataforma en 2 minutos",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    bgColor: "#0d0d0d",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
  },
  logos: {
    type: "logos",
    title: "Avalado por instituciones educativas",
    bgColor: "#111111",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
    logos: ["Ministerio de Educación", "SENESCYT", "INEVAL", "UTE", "PUCE", "UCE"],
  },
  spacer: {
    type: "spacer",
    spacerHeight: 80,
    bgColor: "transparent",
  },
  text: {
    type: "text",
    title: "Sección de texto",
    content: "Escribe aquí el contenido de esta sección. Puedes añadir texto libre, párrafos o notas informativas.",
    bgColor: "#111111",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
  },
  banner: {
    type: "banner",
    badge: "🔥 Oferta especial",
    title: "¡50% de descuento este mes!",
    btnPrimary: "Aprovecha ahora",
    bgColor: "#1a0a0a",
    textColor: "#ffffff",
    accentColor: "#e63c3c",
  },
}

// ─── Block library catalog ────────────────────────────────────────────────────

const BLOCK_CATALOG: { type: BlockType; label: string; icon: string; category: string; desc: string; tags: string[] }[] = [
  { type: "navbar", label: "Barra de Navegación", icon: "🧭", category: "Base universal", desc: "Menú principal con logo y links", tags: ["Estructura", "Sistema"] },
  { type: "hero", label: "Hero Principal", icon: "🚀", category: "Base universal", desc: "Sección principal con título y CTA", tags: ["Bloque", "Sistema"] },
  { type: "features", label: "Características / Tarjetas", icon: "⭐", category: "Base universal", desc: "Grid de funcionalidades con íconos", tags: ["Grid", "Editable"] },
  { type: "logos", label: "Logos / marcas", icon: "🏷️", category: "Base universal", desc: "Franja de logos, partners o herramientas", tags: ["Marcas", "Confianza"] },
  { type: "spacer", label: "Espaciador", icon: "—", category: "Base universal", desc: "Bloque vacío para separar secciones", tags: ["Layout", "Ritmo"] },
  { type: "banner", label: "Banner de Texto", icon: "T", category: "Base universal", desc: "Título + texto + CTA", tags: ["Bloque", "Sistema"] },
  { type: "pricing", label: "Accesos y Precios", icon: "💰", category: "Conversion", desc: "Tabla comparativa de accesos", tags: ["Accesos", "CTA"] },
  { type: "cta", label: "Llamada a Acción", icon: "🎯", category: "Conversion", desc: "Sección de conversión final", tags: ["CTA", "Final"] },
  { type: "faq", label: "Preguntas Frecuentes", icon: "❓", category: "Conversion", desc: "Acordeón de preguntas y respuestas", tags: ["FAQ", "Contenido"] },
  { type: "stats", label: "Estadísticas", icon: "📊", category: "Conversion", desc: "Números y métricas destacadas", tags: ["Números", "Social proof"] },
  { type: "video", label: "Video", icon: "▶️", category: "Media", desc: "Embed de video YouTube/Vimeo", tags: ["Video", "Media"] },
  { type: "text", label: "Texto Libre", icon: "📝", category: "Media", desc: "Bloque de texto editable", tags: ["Texto", "Contenido"] },
  { type: "testimonials", label: "Testimonios", icon: "💬", category: "Confianza", desc: "Opiniones de usuarios reales", tags: ["Social proof", "Reviews"] },
  { type: "stats", label: "Estadísticas", icon: "📈", category: "Dinamicos", desc: "Números dinámicos del sistema", tags: ["Dinámico", "Live"] },
]

// ─── Utility ──────────────────────────────────────────────────────────────────

function uid() {
  return Math.random().toString(36).slice(2, 9)
}

function newBlock(type: BlockType): BlockData {
  return {
    id: uid(),
    visible: true,
    ...BLOCK_TEMPLATES[type],
    type,
  } as BlockData
}

// ─── Block Preview Renderer ───────────────────────────────────────────────────

function BlockPreview({ block }: { block: BlockData }) {
  const bg = block.bgColor || "#111"
  const fg = block.textColor || "#fff"
  const acc = block.accentColor || "#e63c3c"

  switch (block.type) {
    case "navbar":
      return (
        <div style={{ background: bg, padding: "12px 32px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: acc, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ color: "#fff", fontWeight: 900, fontSize: 10 }}>HE</span>
            </div>
            <div>
              <span style={{ color: acc, fontWeight: 800, fontSize: 14, letterSpacing: 1, display: "block" }}>{block.logo}</span>
              <span style={{ color: fg, fontSize: 8, opacity: 0.5, letterSpacing: 2, textTransform: "uppercase" }}>LA PLATAFORMA #1 PARA DOCENTES EN ECUADOR</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 20 }}>
            {block.navLinks?.map((l, i) => (
              <span key={i} style={{ color: fg, fontSize: 12, opacity: 0.8 }}>{l.label.toUpperCase()}</span>
            ))}
          </div>
          <span style={{ background: acc, color: "#fff", padding: "6px 16px", borderRadius: 6, fontSize: 12, fontWeight: 600 }}>
            {block.navBtnLabel}
          </span>
        </div>
      )
    case "hero":
      return (
        <div style={{ background: bg, padding: "60px 40px", textAlign: "center" }}>
          {block.badge && (
            <span style={{ background: `${acc}22`, border: `1px solid ${acc}44`, color: acc, padding: "4px 14px", borderRadius: 20, fontSize: 12, display: "inline-block", marginBottom: 16 }}>
              {block.badge}
            </span>
          )}
          <h1 style={{ color: fg, fontSize: 42, fontWeight: 900, margin: "12px 0", lineHeight: 1.1, textTransform: "uppercase" }}>{block.title}</h1>
          <p style={{ color: fg, opacity: 0.65, fontSize: 15, maxWidth: 520, margin: "0 auto 28px" }}>{block.subtitle}</p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            {block.btnPrimary && <button style={{ background: acc, color: "#fff", padding: "12px 28px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{block.btnPrimary}</button>}
            {block.btnSecondary && <button style={{ background: "transparent", color: fg, padding: "12px 28px", borderRadius: 8, border: `1px solid ${fg}44`, fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{block.btnSecondary}</button>}
          </div>
        </div>
      )
    case "features":
      return (
        <div style={{ background: bg, padding: "48px 32px" }}>
          {block.title && <h2 style={{ color: fg, fontSize: 28, fontWeight: 800, textAlign: "center", marginBottom: 32 }}>{block.title}</h2>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
            {block.features?.slice(0, 6).map((f, i) => (
              <div key={i} style={{ background: `${acc}08`, border: `1px solid ${acc}22`, borderRadius: 12, padding: "20px 16px" }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>{f.icon}</div>
                <div style={{ color: fg, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: fg, opacity: 0.6, fontSize: 12 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )
    case "stats":
      return (
        <div style={{ background: bg, padding: "40px 32px" }}>
          {block.title && <h2 style={{ color: fg, fontSize: 24, fontWeight: 800, textAlign: "center", marginBottom: 28 }}>{block.title}</h2>}
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${block.stats?.length || 4}, 1fr)`, gap: 16 }}>
            {block.stats?.map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ color: acc, fontSize: 36, fontWeight: 900 }}>{s.value}</div>
                <div style={{ color: fg, opacity: 0.6, fontSize: 13, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      )
    case "testimonials":
      return (
        <div style={{ background: bg, padding: "48px 32px" }}>
          {block.title && <h2 style={{ color: fg, fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 28 }}>{block.title}</h2>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {block.testimonials?.map((t, i) => (
              <div key={i} style={{ background: `${acc}08`, border: `1px solid ${acc}22`, borderRadius: 12, padding: 20 }}>
                <div style={{ color: fg, fontSize: 13, marginBottom: 14, opacity: 0.85, fontStyle: "italic" }}>"{t.text}"</div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: "50%", background: acc, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 12 }}>{t.avatar}</div>
                  <div>
                    <div style={{ color: fg, fontWeight: 700, fontSize: 13 }}>{t.name}</div>
                    <div style={{ color: acc, fontSize: 11 }}>{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case "pricing":
      return (
        <div style={{ background: bg, padding: "48px 32px", textAlign: "center" }}>
          {block.title && <h2 style={{ color: fg, fontSize: 28, fontWeight: 800, marginBottom: 8 }}>{block.title}</h2>}
          {block.subtitle && <p style={{ color: fg, opacity: 0.6, marginBottom: 28, fontSize: 14 }}>{block.subtitle}</p>}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
            {block.plans?.map((p, i) => (
              <div key={i} style={{ background: p.highlight ? acc : `${acc}08`, border: `2px solid ${p.highlight ? acc : acc + "33"}`, borderRadius: 16, padding: 24 }}>
                <div style={{ color: p.highlight ? "#fff" : fg, fontWeight: 800, fontSize: 18, marginBottom: 8 }}>{p.name}</div>
                <div style={{ color: p.highlight ? "#fff" : acc, fontSize: 32, fontWeight: 900 }}>{p.price}<span style={{ fontSize: 14, fontWeight: 400 }}>{p.period}</span></div>
                <div style={{ marginTop: 16 }}>
                  {p.features.map((f, j) => (
                    <div key={j} style={{ color: p.highlight ? "#ffffffcc" : fg + "aa", fontSize: 12, padding: "4px 0", borderBottom: `1px solid ${p.highlight ? "#ffffff22" : acc + "22"}` }}>✓ {f}</div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    case "faq":
      return (
        <div style={{ background: bg, padding: "48px 32px", maxWidth: 700, margin: "0 auto" }}>
          {block.title && <h2 style={{ color: fg, fontSize: 26, fontWeight: 800, textAlign: "center", marginBottom: 24 }}>{block.title}</h2>}
          {block.faqs?.map((f, i) => (
            <div key={i} style={{ borderBottom: `1px solid ${acc}22`, padding: "14px 0" }}>
              <div style={{ color: fg, fontWeight: 700, fontSize: 14, marginBottom: 6 }}>→ {f.q}</div>
              <div style={{ color: fg, opacity: 0.6, fontSize: 13 }}>{f.a}</div>
            </div>
          ))}
        </div>
      )
    case "video":
      return (
        <div style={{ background: bg, padding: "48px 32px", textAlign: "center" }}>
          {block.videoTitle && <h2 style={{ color: fg, fontSize: 26, fontWeight: 800, marginBottom: 24 }}>{block.videoTitle}</h2>}
          <div style={{ position: "relative", paddingBottom: "42%", background: "#000", borderRadius: 12, overflow: "hidden", maxWidth: 700, margin: "0 auto", border: `2px solid ${acc}33` }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: 64, height: 64, background: acc, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>▶</div>
            </div>
          </div>
          <div style={{ color: fg, opacity: 0.5, fontSize: 11, marginTop: 8 }}>{block.videoUrl}</div>
        </div>
      )
    case "logos":
      return (
        <div style={{ background: bg, padding: "32px" }}>
          {block.title && <div style={{ color: fg, opacity: 0.5, fontSize: 12, textAlign: "center", marginBottom: 20, textTransform: "uppercase", letterSpacing: 2 }}>{block.title}</div>}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 16, justifyContent: "center" }}>
            {block.logos?.map((l, i) => (
              <div key={i} style={{ background: `${acc}11`, border: `1px solid ${acc}22`, borderRadius: 8, padding: "8px 20px", color: fg, opacity: 0.7, fontSize: 13, fontWeight: 600 }}>{l}</div>
            ))}
          </div>
        </div>
      )
    case "cta":
      return (
        <div style={{ background: bg, padding: "60px 32px", textAlign: "center" }}>
          <h2 style={{ color: fg, fontSize: 32, fontWeight: 900, marginBottom: 12 }}>{block.title}</h2>
          {block.subtitle && <p style={{ color: fg, opacity: 0.8, fontSize: 16, marginBottom: 28 }}>{block.subtitle}</p>}
          {block.btnPrimary && <button style={{ background: fg === "#ffffff" ? "#000" : "#fff", color: bg, padding: "14px 36px", borderRadius: 10, border: "none", fontWeight: 800, fontSize: 16, cursor: "pointer" }}>{block.btnPrimary}</button>}
        </div>
      )
    case "banner":
      return (
        <div style={{ background: bg, padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderLeft: `4px solid ${acc}` }}>
          <div>
            {block.badge && <span style={{ color: acc, fontSize: 12, fontWeight: 700 }}>{block.badge}</span>}
            <div style={{ color: fg, fontWeight: 800, fontSize: 18 }}>{block.title}</div>
          </div>
          {block.btnPrimary && <button style={{ background: acc, color: "#fff", padding: "10px 24px", borderRadius: 8, border: "none", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>{block.btnPrimary}</button>}
        </div>
      )
    case "text":
      return (
        <div style={{ background: bg, padding: "32px 40px" }}>
          {block.title && <h3 style={{ color: acc, fontSize: 20, fontWeight: 700, marginBottom: 12 }}>{block.title}</h3>}
          <p style={{ color: fg, opacity: 0.75, fontSize: 14, lineHeight: 1.7 }}>{block.content}</p>
        </div>
      )
    case "spacer":
      return (
        <div style={{ background: bg === "transparent" ? "#1a1a1a" : bg, height: block.spacerHeight || 80, display: "flex", alignItems: "center", justifyContent: "center", border: "1px dashed #333", borderRadius: 4 }}>
          <span style={{ color: "#555", fontSize: 12 }}>Espaciador · {block.spacerHeight || 80}px</span>
        </div>
      )
    default:
      return <div style={{ background: "#222", padding: 20, color: "#666", textAlign: "center" }}>Bloque: {block.type}</div>
  }
}

// ─── Field Editor Components ──────────────────────────────────────────────────

function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <label style={{ display: "block", color: "#999", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, multiline }: { value: string; onChange: (v: string) => void; placeholder?: string; multiline?: boolean }) {
  const style: React.CSSProperties = {
    width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8,
    color: "#fff", padding: "8px 10px", fontSize: 13, outline: "none", resize: multiline ? "vertical" : "none",
    fontFamily: "inherit", boxSizing: "border-box",
  }
  return multiline
    ? <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} style={style} />
    : <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={style} />
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
      <input type="color" value={value} onChange={e => onChange(e.target.value)} style={{ width: 36, height: 36, border: "none", borderRadius: 8, background: "none", cursor: "pointer" }} />
      <input value={value} onChange={e => onChange(e.target.value)} style={{ flex: 1, background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 13, outline: "none" }} />
    </div>
  )
}

// ─── Block-specific editor panels ────────────────────────────────────────────

function BlockEditor({ block, onChange }: { block: BlockData; onChange: (updated: Partial<BlockData>) => void }) {
  const [activeTab, setActiveTab] = useState<"content" | "design" | "code">("content")

  const tabs = (
    <div style={{ display: "flex", gap: 2, marginBottom: 20, background: "#111", borderRadius: 8, padding: 3 }}>
      {(["content", "design", "code"] as const).map(tab => (
        <button key={tab} onClick={() => setActiveTab(tab)}
          style={{ flex: 1, padding: "7px 0", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
            background: activeTab === tab ? "#e63c3c" : "transparent", color: activeTab === tab ? "#fff" : "#666" }}>
          {tab === "content" ? "Contenido" : tab === "design" ? "Diseño" : "</> Codigo"}
        </button>
      ))}
    </div>
  )

  const designPanel = (
    <>
      <FieldGroup label="Color de fondo"><ColorInput value={block.bgColor || "#111111"} onChange={v => onChange({ bgColor: v })} /></FieldGroup>
      <FieldGroup label="Color de texto"><ColorInput value={block.textColor || "#ffffff"} onChange={v => onChange({ textColor: v })} /></FieldGroup>
      <FieldGroup label="Color de acento"><ColorInput value={block.accentColor || "#e63c3c"} onChange={v => onChange({ accentColor: v })} /></FieldGroup>
    </>
  )

  const codePanel = (
    <div>
      <div style={{ color: "#666", fontSize: 12, marginBottom: 8 }}>ID del bloque</div>
      <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#888", fontSize: 12, fontFamily: "monospace" }}>{block.id}</div>
      <div style={{ color: "#666", fontSize: 12, marginTop: 16, marginBottom: 8 }}>Tipo</div>
      <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, padding: "8px 12px", color: "#e63c3c", fontSize: 12, fontFamily: "monospace" }}>{block.type}</div>
    </div>
  )

  const contentPanel = (() => {
    switch (block.type) {
      case "navbar":
        return (
          <>
            <FieldGroup label="Nombre / Logo"><TextInput value={block.logo || ""} onChange={v => onChange({ logo: v })} /></FieldGroup>
            <FieldGroup label="Botón de acción"><TextInput value={block.navBtnLabel || ""} onChange={v => onChange({ navBtnLabel: v })} /></FieldGroup>
            <FieldGroup label="Links del menú">
              {block.navLinks?.map((link, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                  <input value={link.label} onChange={e => {
                    const links = [...(block.navLinks || [])]
                    links[i] = { ...links[i], label: e.target.value }
                    onChange({ navLinks: links })
                  }} placeholder="Texto" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                  <input value={link.href} onChange={e => {
                    const links = [...(block.navLinks || [])]
                    links[i] = { ...links[i], href: e.target.value }
                    onChange({ navLinks: links })
                  }} placeholder="/ruta" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                  <button onClick={() => {
                    const links = block.navLinks?.filter((_, j) => j !== i) || []
                    onChange({ navLinks: links })
                  }} style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px", fontSize: 16 }}>×</button>
                </div>
              ))}
              <button onClick={() => onChange({ navLinks: [...(block.navLinks || []), { label: "Nuevo", href: "/" }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12, marginTop: 4 }}>+ Agregar link</button>
            </FieldGroup>
          </>
        )
      case "hero":
        return (
          <>
            <FieldGroup label="Etiqueta / Badge"><TextInput value={block.badge || ""} onChange={v => onChange({ badge: v })} placeholder="🎯 Novedad..." /></FieldGroup>
            <FieldGroup label="Título principal"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} multiline /></FieldGroup>
            <FieldGroup label="Subtítulo"><TextInput value={block.subtitle || ""} onChange={v => onChange({ subtitle: v })} multiline /></FieldGroup>
            <FieldGroup label="Botón primario"><TextInput value={block.btnPrimary || ""} onChange={v => onChange({ btnPrimary: v })} /></FieldGroup>
            <FieldGroup label="Botón secundario"><TextInput value={block.btnSecondary || ""} onChange={v => onChange({ btnSecondary: v })} /></FieldGroup>
          </>
        )
      case "features":
        return (
          <>
            <FieldGroup label="Título de sección"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Características">
              {block.features?.map((f, i) => (
                <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={f.icon} onChange={e => {
                      const arr = [...(block.features || [])]
                      arr[i] = { ...arr[i], icon: e.target.value }
                      onChange({ features: arr })
                    }} style={{ width: 50, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px", fontSize: 16, textAlign: "center", outline: "none" }} />
                    <input value={f.title} onChange={e => {
                      const arr = [...(block.features || [])]
                      arr[i] = { ...arr[i], title: e.target.value }
                      onChange({ features: arr })
                    }} placeholder="Título" style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <button onClick={() => onChange({ features: block.features?.filter((_, j) => j !== i) })}
                      style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px" }}>×</button>
                  </div>
                  <input value={f.desc} onChange={e => {
                    const arr = [...(block.features || [])]
                    arr[i] = { ...arr[i], desc: e.target.value }
                    onChange({ features: arr })
                  }} placeholder="Descripción" style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => onChange({ features: [...(block.features || []), { icon: "⭐", title: "Nueva", desc: "Descripción" }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>+ Agregar característica</button>
            </FieldGroup>
          </>
        )
      case "stats":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Estadísticas">
              {block.stats?.map((s, i) => (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                  <input value={s.value} onChange={e => {
                    const arr = [...(block.stats || [])]
                    arr[i] = { ...arr[i], value: e.target.value }
                    onChange({ stats: arr })
                  }} placeholder="Valor (1,284+)" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                  <input value={s.label} onChange={e => {
                    const arr = [...(block.stats || [])]
                    arr[i] = { ...arr[i], label: e.target.value }
                    onChange({ stats: arr })
                  }} placeholder="Etiqueta" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                  <button onClick={() => onChange({ stats: block.stats?.filter((_, j) => j !== i) })}
                    style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px" }}>×</button>
                </div>
              ))}
              <button onClick={() => onChange({ stats: [...(block.stats || []), { value: "0", label: "Nuevo dato" }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>+ Agregar estadística</button>
            </FieldGroup>
          </>
        )
      case "testimonials":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Testimonios">
              {block.testimonials?.map((t, i) => (
                <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 6, marginBottom: 6 }}>
                    <input value={t.name} onChange={e => {
                      const arr = [...(block.testimonials || [])]
                      arr[i] = { ...arr[i], name: e.target.value }
                      onChange({ testimonials: arr })
                    }} placeholder="Nombre" style={{ background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <input value={t.role} onChange={e => {
                      const arr = [...(block.testimonials || [])]
                      arr[i] = { ...arr[i], role: e.target.value }
                      onChange({ testimonials: arr })
                    }} placeholder="Rol / Cargo" style={{ background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <button onClick={() => onChange({ testimonials: block.testimonials?.filter((_, j) => j !== i) })}
                      style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px" }}>×</button>
                  </div>
                  <textarea value={t.text} onChange={e => {
                    const arr = [...(block.testimonials || [])]
                    arr[i] = { ...arr[i], text: e.target.value }
                    onChange({ testimonials: arr })
                  }} rows={2} placeholder="Testimonio..." style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => onChange({ testimonials: [...(block.testimonials || []), { name: "Nuevo", role: "Docente", text: "Excelente plataforma.", avatar: "NN" }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>+ Agregar testimonio</button>
            </FieldGroup>
          </>
        )
      case "pricing":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Subtítulo"><TextInput value={block.subtitle || ""} onChange={v => onChange({ subtitle: v })} /></FieldGroup>
            <FieldGroup label="Accesos">
              {block.plans?.map((p, i) => (
                <div key={i} style={{ background: "#1a1a1a", border: `1px solid ${p.highlight ? "#e63c3c" : "#2a2a2a"}`, borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 60px auto", gap: 6, marginBottom: 6 }}>
                    <input value={p.name} onChange={e => {
                      const arr = [...(block.plans || [])]
                      arr[i] = { ...arr[i], name: e.target.value }
                      onChange({ plans: arr })
                    }} placeholder="Nombre" style={{ background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <input value={p.price} onChange={e => {
                      const arr = [...(block.plans || [])]
                      arr[i] = { ...arr[i], price: e.target.value }
                      onChange({ plans: arr })
                    }} placeholder="$9.99" style={{ background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <input value={p.period} onChange={e => {
                      const arr = [...(block.plans || [])]
                      arr[i] = { ...arr[i], period: e.target.value }
                      onChange({ plans: arr })
                    }} placeholder="/mes" style={{ background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <button onClick={() => onChange({ plans: block.plans?.filter((_, j) => j !== i) })}
                      style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px" }}>×</button>
                  </div>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, color: "#888", fontSize: 11, cursor: "pointer", marginBottom: 6 }}>
                    <input type="checkbox" checked={p.highlight} onChange={e => {
                      const arr = [...(block.plans || [])]
                      arr[i] = { ...arr[i], highlight: e.target.checked }
                      onChange({ plans: arr })
                    }} /> Plan destacado
                  </label>
                  <div style={{ color: "#666", fontSize: 11, marginBottom: 4 }}>Características (una por línea):</div>
                  <textarea value={p.features.join("\n")} onChange={e => {
                    const arr = [...(block.plans || [])]
                    arr[i] = { ...arr[i], features: e.target.value.split("\n").filter(Boolean) }
                    onChange({ plans: arr })
                  }} rows={3} style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => onChange({ plans: [...(block.plans || []), { name: "Nuevo", price: "$0", period: "/mes", features: ["Feature 1"], highlight: false }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>+ Agregar plan</button>
            </FieldGroup>
          </>
        )
      case "faq":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Preguntas y Respuestas">
              {block.faqs?.map((f, i) => (
                <div key={i} style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, padding: 10, marginBottom: 8 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                    <input value={f.q} onChange={e => {
                      const arr = [...(block.faqs || [])]
                      arr[i] = { ...arr[i], q: e.target.value }
                      onChange({ faqs: arr })
                    }} placeholder="¿Pregunta?" style={{ flex: 1, background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none" }} />
                    <button onClick={() => onChange({ faqs: block.faqs?.filter((_, j) => j !== i) })}
                      style={{ background: "#e63c3c22", border: "none", color: "#e63c3c", borderRadius: 6, cursor: "pointer", padding: "0 8px" }}>×</button>
                  </div>
                  <textarea value={f.a} onChange={e => {
                    const arr = [...(block.faqs || [])]
                    arr[i] = { ...arr[i], a: e.target.value }
                    onChange({ faqs: arr })
                  }} rows={2} placeholder="Respuesta..." style={{ width: "100%", background: "#111", border: "1px solid #333", borderRadius: 6, color: "#fff", padding: "6px 8px", fontSize: 12, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
                </div>
              ))}
              <button onClick={() => onChange({ faqs: [...(block.faqs || []), { q: "¿Nueva pregunta?", a: "Respuesta aquí." }] })}
                style={{ width: "100%", padding: "7px", background: "#1a1a1a", border: "1px dashed #333", borderRadius: 6, color: "#666", cursor: "pointer", fontSize: 12 }}>+ Agregar pregunta</button>
            </FieldGroup>
          </>
        )
      case "video":
        return (
          <>
            <FieldGroup label="Título del video"><TextInput value={block.videoTitle || ""} onChange={v => onChange({ videoTitle: v })} /></FieldGroup>
            <FieldGroup label="URL de embed (YouTube/Vimeo)"><TextInput value={block.videoUrl || ""} onChange={v => onChange({ videoUrl: v })} placeholder="https://youtube.com/embed/..." /></FieldGroup>
          </>
        )
      case "logos":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Logos / Nombres (uno por línea)">
              <textarea value={(block.logos || []).join("\n")} onChange={e => onChange({ logos: e.target.value.split("\n").filter(Boolean) })} rows={5}
                style={{ width: "100%", background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", padding: "8px 10px", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </FieldGroup>
          </>
        )
      case "cta":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Subtítulo"><TextInput value={block.subtitle || ""} onChange={v => onChange({ subtitle: v })} /></FieldGroup>
            <FieldGroup label="Botón"><TextInput value={block.btnPrimary || ""} onChange={v => onChange({ btnPrimary: v })} /></FieldGroup>
          </>
        )
      case "banner":
        return (
          <>
            <FieldGroup label="Badge / Etiqueta"><TextInput value={block.badge || ""} onChange={v => onChange({ badge: v })} /></FieldGroup>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Botón"><TextInput value={block.btnPrimary || ""} onChange={v => onChange({ btnPrimary: v })} /></FieldGroup>
          </>
        )
      case "text":
        return (
          <>
            <FieldGroup label="Título"><TextInput value={block.title || ""} onChange={v => onChange({ title: v })} /></FieldGroup>
            <FieldGroup label="Contenido"><TextInput value={block.content || ""} onChange={v => onChange({ content: v })} multiline /></FieldGroup>
          </>
        )
      case "spacer":
        return (
          <FieldGroup label={`Altura: ${block.spacerHeight || 80}px`}>
            <input type="range" min={20} max={300} value={block.spacerHeight || 80}
              onChange={e => onChange({ spacerHeight: Number(e.target.value) })}
              style={{ width: "100%", accentColor: "#e63c3c" }} />
          </FieldGroup>
        )
      default:
        return <p style={{ color: "#666", fontSize: 13 }}>Edición no disponible para este tipo de bloque.</p>
    }
  })()

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 20 }}>
      {tabs}
      {activeTab === "content" ? contentPanel : activeTab === "design" ? designPanel : codePanel}
    </div>
  )
}

// ─── Add Block Modal ──────────────────────────────────────────────────────────

const CATALOG_CATEGORIES = ["Todos", "Base universal", "Conversion", "Media", "Confianza", "Dinamicos"]

function AddBlockModal({ onAdd, onClose }: { onAdd: (type: BlockType) => void; onClose: () => void }) {
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("Todos")

  const uniqueTypes = new Set<BlockType>()
  const dedupedCatalog = BLOCK_CATALOG.filter(b => {
    if (uniqueTypes.has(b.type)) return false
    uniqueTypes.add(b.type)
    return true
  })

  const filtered = dedupedCatalog.filter(b =>
    (category === "Todos" || b.category === category) &&
    (b.label.toLowerCase().includes(search.toLowerCase()) || b.desc.toLowerCase().includes(search.toLowerCase()))
  )

  const blockCount = dedupedCatalog.length

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000000cc", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}
      onClick={onClose}>
      <div style={{ background: "#111", border: "1px solid #222", borderRadius: 16, width: 760, maxHeight: "82vh", overflow: "hidden", display: "flex", flexDirection: "column" }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding: "20px 20px 0", borderBottom: "1px solid #1e1e1e" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div style={{ color: "#fff", fontWeight: 800, fontSize: 18 }}>Agregar bloque</div>
              <div style={{ color: "#555", fontSize: 12 }}>{blockCount} bloques en {CATALOG_CATEGORIES.length - 1} categorías</div>
            </div>
            <button onClick={onClose} style={{ background: "#1e1e1e", border: "none", color: "#666", borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ position: "relative", marginBottom: 14 }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "#555", fontSize: 14 }}>🔍</span>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar bloque..."
              style={{ width: "100%", background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 8, color: "#fff", padding: "9px 12px 9px 36px", fontSize: 13, outline: "none", boxSizing: "border-box" }} />
            {search && <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "#555", cursor: "pointer", fontSize: 16 }}>×</button>}
          </div>
        </div>

        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
          {/* Sidebar categories */}
          <div style={{ width: 160, borderRight: "1px solid #1e1e1e", padding: "12px 8px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
            {CATALOG_CATEGORIES.map(cat => {
              const count = cat === "Todos" ? blockCount : dedupedCatalog.filter(b => b.category === cat).length
              return (
                <button key={cat} onClick={() => setCategory(cat)}
                  style={{ padding: "8px 12px", borderRadius: 8, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 600, textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center",
                    background: category === cat ? "#e63c3c" : "transparent", color: category === cat ? "#fff" : "#666" }}>
                  <span>{cat}</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{count}</span>
                </button>
              )
            })}
          </div>

          {/* Block grid */}
          <div style={{ flex: 1, overflow: "auto", padding: 16 }}>
            {category !== "Todos" && (
              <div style={{ color: "#555", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: "#e63c3c" }}>⚡</span> {category.toUpperCase()} {filtered.length}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, alignContent: "start" }}>
              {filtered.map(b => (
                <button key={b.type} onClick={() => { onAdd(b.type); onClose() }}
                  style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: 12, padding: "14px 12px", textAlign: "left", cursor: "pointer", transition: "all 0.15s", position: "relative" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = "#e63c3c"; (e.currentTarget as HTMLElement).style.background = "#1e1010" }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2a"; (e.currentTarget as HTMLElement).style.background = "#1a1a1a" }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
                    <div style={{ width: 36, height: 36, background: "#111", border: "1px solid #2a2a2a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{b.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, marginBottom: 2, lineHeight: 1.3 }}>{b.label}</div>
                      <div style={{ color: "#444", fontSize: 10, lineHeight: 1.4 }}>{b.desc}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {b.tags.map(tag => (
                      <span key={tag} style={{ background: "#111", border: "1px solid #2a2a2a", borderRadius: 4, padding: "2px 6px", fontSize: 9, color: "#555" }}>{tag}</span>
                    ))}
                  </div>
                </button>
              ))}
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#444" }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
                <div style={{ fontSize: 13 }}>No se encontraron bloques</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ padding: "10px 20px", borderTop: "1px solid #1e1e1e", color: "#444", fontSize: 11, textAlign: "center" }}>
          Haz clic para agregarlo al canvas · Esc para cerrar
        </div>
      </div>
    </div>
  )
}

// ─── Section name display ─────────────────────────────────────────────────────

function blockLabel(type: BlockType): string {
  return BLOCK_CATALOG.find(c => c.type === type)?.label || type
}

function blockIcon(type: BlockType): string {
  return BLOCK_CATALOG.find(c => c.type === type)?.icon || "📦"
}

// ─── Main CMS Component ───────────────────────────────────────────────────────

const INITIAL_BLOCKS: BlockData[] = [
  newBlock("navbar"),
  newBlock("hero"),
  newBlock("stats"),
  newBlock("features"),
  newBlock("testimonials"),
  newBlock("pricing"),
  newBlock("cta"),
]

export default function CMSLandingEditor() {
  const [blocks, setBlocks] = useState<BlockData[]>(INITIAL_BLOCKS)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [addAfterIndex, setAddAfterIndex] = useState<number | null>(null)
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(false)
  const [viewMode, setViewMode] = useState<"desktop" | "tablet" | "mobile">("desktop")
  const [saved, setSaved] = useState(false)
  const [showSaveToast, setShowSaveToast] = useState(false)
  const [focusMode, setFocusMode] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const selectedBlock = blocks.find(b => b.id === selectedId) || null

  const updateBlock = useCallback((id: string, changes: Partial<BlockData>) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, ...changes } : b))
  }, [])

  const deleteBlock = useCallback((id: string) => {
    setBlocks(prev => prev.filter(b => b.id !== id))
    setSelectedId(null)
  }, [])

  const duplicateBlock = useCallback((id: string) => {
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === id)
      const copy = { ...prev[idx], id: uid() }
      const next = [...prev]
      next.splice(idx + 1, 0, copy)
      return next
    })
  }, [])

  const toggleVisibility = useCallback((id: string) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, visible: !b.visible } : b))
  }, [])

  const addBlock = useCallback((type: BlockType) => {
    const block = newBlock(type)
    setBlocks(prev => {
      if (addAfterIndex !== null) {
        const next = [...prev]
        next.splice(addAfterIndex + 1, 0, block)
        return next
      }
      return [...prev, block]
    })
    setSelectedId(block.id)
    setAddAfterIndex(null)
  }, [addAfterIndex])

  const moveBlock = useCallback((from: number, to: number) => {
    setBlocks(prev => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }, [])

  const handleSave = () => {
    setShowSaveToast(true)
    setSaved(true)
    setTimeout(() => setShowSaveToast(false), 2500)
  }

  const previewWidth = viewMode === "desktop" ? "100%" : viewMode === "tablet" ? 768 : 375

  const showLeft = !previewMode && !focusMode && sidebarOpen
  const showRight = !previewMode && !focusMode

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#0a0a0a", fontFamily: "'Inter', system-ui, sans-serif", overflow: "hidden" }}>

      {/* ── Top Bar ────────────────────────────────────────────────────── */}
      <div style={{ height: 52, background: "#111", borderBottom: "1px solid #1e1e1e", display: "flex", alignItems: "center", padding: "0 12px", gap: 6, flexShrink: 0, zIndex: 100 }}>

        {/* Left: sidebar toggle + breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
          {!previewMode && (
            <button onClick={() => setSidebarOpen(v => !v)}
              style={{ background: "none", border: "none", color: sidebarOpen ? "#e63c3c" : "#555", cursor: "pointer", fontSize: 16, padding: "4px 6px", borderRadius: 6 }}
              title="Toggle sidebar">☰</button>
          )}
          <span style={{ color: "#555", fontSize: 11, fontWeight: 600 }}>STUDIO</span>
          <span style={{ color: "#333" }}>/</span>
          <span style={{ color: "#fff", fontWeight: 600, fontSize: 13 }}>Inicio</span>
          <span style={{ color: "#333" }}>/</span>
          {saved && <span style={{ color: "#22c55e", fontSize: 11, background: "#22c55e18", padding: "2px 8px", borderRadius: 10 }}>✓ Guardado</span>}
        </div>

        {/* Center: viewport switcher */}
        <div style={{ display: "flex", gap: 0, background: "#0a0a0a", border: "1px solid #1e1e1e", borderRadius: 8, overflow: "hidden" }}>
          {(["desktop", "tablet", "mobile"] as const).map((v, i) => {
            const icons = ["🖥", "⬜", "📱"]
            const labels = ["Desktop", "Tablet", "Mobile"]
            return (
              <button key={v} onClick={() => setViewMode(v)}
                style={{ padding: "6px 14px", border: "none", borderRight: i < 2 ? "1px solid #1e1e1e" : "none", cursor: "pointer", fontSize: 11, fontWeight: 600,
                  background: viewMode === v ? "#e63c3c" : "transparent", color: viewMode === v ? "#fff" : "#555" }}>
                {labels[i]}
              </button>
            )
          })}
        </div>

        {/* Right: mode toggles + actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, justifyContent: "flex-end" }}>
          <button onClick={() => setPreviewMode(!previewMode)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2a2a2a", background: previewMode ? "#e63c3c22" : "transparent", color: previewMode ? "#e63c3c" : "#777", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            {previewMode ? "✎ Editar" : "Vista previa"}
          </button>
          <button onClick={() => setFocusMode(v => !v)}
            style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid #2a2a2a", background: focusMode ? "#22c55e22" : "transparent", color: focusMode ? "#22c55e" : "#777", cursor: "pointer", fontSize: 11, fontWeight: 600 }}>
            Modo enfoque
          </button>
          <div style={{ width: 1, height: 20, background: "#222" }} />
          <div style={{ color: "#555", fontSize: 11 }}>1440px</div>
          <div style={{ background: "#e63c3c22", border: "1px solid #e63c3c44", borderRadius: 6, padding: "3px 8px", color: "#e63c3c", fontSize: 11, fontWeight: 700 }}>1280px</div>
          <div style={{ width: 1, height: 20, background: "#222" }} />
          <button onClick={handleSave}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#e63c3c", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
            💾 Guardar
          </button>
          <button style={{ padding: "7px 16px", borderRadius: 8, border: "none", background: "#1a1a1a", border1: "1px solid #2a2a2a", color: "#fff", cursor: "pointer", fontSize: 12, fontWeight: 700, display: "flex", alignItems: "center", gap: 6 } as React.CSSProperties}>
            ✓ Publicar
          </button>
          <button style={{ padding: "7px 12px", borderRadius: 8, border: "1px solid #2a2a2a", background: "transparent", color: "#777", cursor: "pointer", fontSize: 11 }}>
            ← Volver al admin
          </button>
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── Left Sidebar: Block List ─────────────────────────────── */}
        {showLeft && (
          <div style={{ width: 260, background: "#111", borderRight: "1px solid #1e1e1e", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "10px 12px 8px", borderBottom: "1px solid #1a1a1a" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ color: "#888", fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1 }}>SECCIONES</div>
                <div style={{ color: "#555", fontSize: 11, background: "#1a1a1a", borderRadius: 10, padding: "1px 8px" }}>{blocks.length}</div>
              </div>
              <div style={{ color: "#e63c3c", fontSize: 12, fontWeight: 600, marginTop: 2 }}>Inicio</div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
              {blocks.map((block, i) => (
                <div key={block.id}
                  draggable
                  onDragStart={() => setDragIndex(i)}
                  onDragOver={e => { e.preventDefault(); setOverIndex(i) }}
                  onDrop={() => { if (dragIndex !== null && dragIndex !== i) moveBlock(dragIndex, i); setDragIndex(null); setOverIndex(null) }}
                  onDragEnd={() => { setDragIndex(null); setOverIndex(null) }}
                  onClick={() => setSelectedId(block.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 8, padding: "8px 8px", borderRadius: 8, cursor: "pointer", marginBottom: 2,
                    background: selectedId === block.id ? "#e63c3c18" : overIndex === i ? "#ffffff08" : "transparent",
                    border: selectedId === block.id ? "1px solid #e63c3c44" : "1px solid transparent",
                    opacity: block.visible ? 1 : 0.4,
                  }}>
                  <span style={{ color: "#333", cursor: "grab", fontSize: 12, flexShrink: 0 }}>⠿</span>
                  <div style={{ width: 20, height: 20, background: "#0a0a0a", borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, color: "#666" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div style={{ width: 28, height: 28, background: selectedId === block.id ? "#e63c3c22" : "#1a1a1a", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                    {blockIcon(block.type)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ color: selectedId === block.id ? "#fff" : "#bbb", fontSize: 12, fontWeight: 600, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {blockLabel(block.type)}
                    </div>
                    <div style={{ color: "#444", fontSize: 10, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {block.title || block.badge || block.logo || block.videoTitle || `Bloque ${block.type}`}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 1 }}>
                    <button onClick={e => { e.stopPropagation(); toggleVisibility(block.id) }}
                      style={{ background: "none", border: "none", color: block.visible ? "#555" : "#333", cursor: "pointer", fontSize: 12, padding: "3px 4px", borderRadius: 4 }}
                      title={block.visible ? "Ocultar" : "Mostrar"}>
                      {block.visible ? "👁" : "🚫"}
                    </button>
                    <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                      style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 12, padding: "3px 4px", borderRadius: 4 }}
                      title="Duplicar">⧉</button>
                    <button onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este bloque?")) deleteBlock(block.id) }}
                      style={{ background: "none", border: "none", color: "#e63c3c66", cursor: "pointer", fontSize: 12, padding: "3px 4px", borderRadius: 4 }}
                      title="Eliminar">🗑</button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px 12px", borderTop: "1px solid #1a1a1a" }}>
              <button onClick={() => { setAddAfterIndex(null); setShowAddModal(true) }}
                style={{ width: "100%", padding: "10px", background: "#e63c3c", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                + Agregar bloque
              </button>
            </div>
          </div>
        )}

        {/* ── Canvas ──────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: "auto", background: "#161616", padding: previewMode || focusMode ? 0 : "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          {!previewMode && !focusMode && (
            <div style={{ display: "flex", gap: 12, marginBottom: 12, alignItems: "center", alignSelf: "stretch", justifyContent: "space-between" }}>
              <div style={{ color: "#333", fontSize: 11, textTransform: "uppercase", letterSpacing: 2 }}>
                Canvas Inicio · desktop · Fit 64%
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <span style={{ color: "#555", fontSize: 11 }}>Click para seleccionar</span>
                <span style={{ color: "#333" }}>·</span>
                <span style={{ color: "#555", fontSize: 11 }}>Doble click para editar texto</span>
              </div>
            </div>
          )}

          <div style={{ width: "100%", maxWidth: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
            {!previewMode && !focusMode && (
              <div style={{ background: "#111", border: "1px solid #1e1e1e", borderRadius: "8px 8px 0 0", padding: "8px 20px", alignSelf: "stretch", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ display: "flex", gap: 6, marginRight: 16 }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f56", display: "block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#ffbd2e", display: "block" }} />
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: "#27c93f", display: "block" }} />
                </div>
                <div style={{ background: "#0a0a0a", border: "1px solid #2a2a2a", borderRadius: 20, padding: "3px 16px", color: "#555", fontSize: 11 }}>hackevans.ec</div>
              </div>
            )}

            <div style={{
              width: previewMode || focusMode ? "100%" : typeof previewWidth === "number" ? `${previewWidth}px` : "100%",
              maxWidth: "100%", background: "#0d0d0d",
              borderRadius: previewMode || focusMode ? 0 : "0 0 8px 8px",
              overflow: "hidden",
              boxShadow: previewMode || focusMode ? "none" : "0 4px 40px #00000066",
              transition: "width 0.3s",
            }}>
              {/* Viewport label */}
              {!previewMode && !focusMode && (
                <div style={{ background: "#0a0a0a", borderBottom: "1px solid #1e1e1e", padding: "6px 16px" }}>
                  <div style={{ color: "#e63c3c", fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: 2 }}>VIEWPORT</div>
                  <div style={{ color: "#fff", fontSize: 14, fontWeight: 700 }}>Desktop · 1280px</div>
                </div>
              )}

              {blocks.filter(b => b.visible || !previewMode).map((block, i) => (
                <div key={block.id} style={{ position: "relative" }}>
                  <div
                    onClick={() => !previewMode && !focusMode && setSelectedId(block.id)}
                    style={{
                      position: "relative", cursor: previewMode || focusMode ? "default" : "pointer",
                      outline: !previewMode && !focusMode && selectedId === block.id ? "2px solid #e63c3c" : "none",
                      opacity: block.visible ? 1 : 0.35,
                    }}
                    onMouseEnter={e => { if (!previewMode && !focusMode && selectedId !== block.id) (e.currentTarget as HTMLElement).style.outline = "1px solid #e63c3c33" }}
                    onMouseLeave={e => { if (!previewMode && !focusMode && selectedId !== block.id) (e.currentTarget as HTMLElement).style.outline = "none" }}>

                    <BlockPreview block={block} />

                    {/* Block label overlay */}
                    {!previewMode && !focusMode && selectedId === block.id && (
                      <div style={{ position: "absolute", top: 0, left: 0, background: "#e63c3c", padding: "2px 8px", fontSize: 10, color: "#fff", fontWeight: 700, zIndex: 5 }}>
                        ● {blockLabel(block.type)}
                      </div>
                    )}

                    {/* Block controls overlay */}
                    {!previewMode && !focusMode && selectedId === block.id && (
                      <div style={{ position: "absolute", top: 4, right: 6, display: "flex", gap: 3, zIndex: 10 }}>
                        <button onClick={e => { e.stopPropagation(); moveBlock(i, Math.max(0, i - 1)) }}
                          style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 5, color: "#888", cursor: "pointer", padding: "3px 7px", fontSize: 11 }} title="Subir">↑</button>
                        <button onClick={e => { e.stopPropagation(); moveBlock(i, Math.min(blocks.length - 1, i + 1)) }}
                          style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 5, color: "#888", cursor: "pointer", padding: "3px 7px", fontSize: 11 }} title="Bajar">↓</button>
                        <button onClick={e => { e.stopPropagation(); duplicateBlock(block.id) }}
                          style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 5, color: "#888", cursor: "pointer", padding: "3px 7px", fontSize: 11 }} title="Duplicar">⧉</button>
                        <button onClick={e => { e.stopPropagation(); toggleVisibility(block.id) }}
                          style={{ background: "#1a1a1a", border: "1px solid #333", borderRadius: 5, color: "#888", cursor: "pointer", padding: "3px 7px", fontSize: 11 }}>
                          {block.visible ? "👁" : "🚫"}
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (confirm("¿Eliminar este bloque?")) deleteBlock(block.id) }}
                          style={{ background: "#e63c3c22", border: "1px solid #e63c3c44", borderRadius: 5, color: "#e63c3c", cursor: "pointer", padding: "3px 7px", fontSize: 11 }}>🗑</button>
                      </div>
                    )}
                  </div>

                  {/* Add-between button */}
                  {!previewMode && !focusMode && (
                    <div style={{ height: 18, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}
                      onMouseEnter={e => { const btn = e.currentTarget.querySelector("button"); if (btn) (btn as HTMLElement).style.opacity = "1" }}
                      onMouseLeave={e => { const btn = e.currentTarget.querySelector("button"); if (btn) (btn as HTMLElement).style.opacity = "0" }}>
                      <button onClick={() => { setAddAfterIndex(i); setShowAddModal(true) }}
                        style={{ opacity: 0, transition: "opacity 0.15s", background: "#e63c3c", border: "none", borderRadius: "50%", width: 20, height: 20, color: "#fff", cursor: "pointer", fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
                    </div>
                  )}
                </div>
              ))}

              {!previewMode && blocks.length === 0 && (
                <div style={{ padding: "80px 32px", textAlign: "center", background: "#0d0d0d" }}>
                  <div style={{ fontSize: 48, marginBottom: 16 }}>🧱</div>
                  <div style={{ color: "#555", fontSize: 16, marginBottom: 20 }}>No hay bloques aún</div>
                  <button onClick={() => setShowAddModal(true)}
                    style={{ background: "#e63c3c", border: "none", borderRadius: 10, color: "#fff", padding: "12px 28px", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
                    + Agregar primer bloque
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── Right Panel: Block Editor ─────────────────────────── */}
        {showRight && (
          <div style={{ width: 300, background: "#111", borderLeft: "1px solid #1e1e1e", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {selectedBlock ? (
              <>
                <div style={{ padding: "12px 16px", borderBottom: "1px solid #1a1a1a" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <div style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>
                        {blockLabel(selectedBlock.type)} <span style={{ background: "#e63c3c22", color: "#e63c3c", fontSize: 10, padding: "1px 6px", borderRadius: 10, marginLeft: 4 }}>1</span>
                      </div>
                      <div style={{ color: "#444", fontSize: 11 }}>/</div>
                    </div>
                    <button onClick={() => setSelectedId(null)} style={{ background: "none", border: "none", color: "#444", cursor: "pointer", fontSize: 16, padding: "2px 4px" }}>›</button>
                  </div>
                  {/* Sub-tabs */}
                  <div style={{ display: "flex", gap: 4, marginTop: 10 }}>
                    {["Contenido", "Diseño", "Acc.", "</> Codigo"].map((tab, ti) => (
                      <button key={tab} style={{ padding: "4px 8px", borderRadius: 6, border: "none", cursor: "pointer", fontSize: 10, fontWeight: 600,
                        background: ti === 0 ? "transparent" : "transparent", color: ti === 0 ? "#fff" : "#555",
                        borderBottom: ti === 0 ? "2px solid #e63c3c" : "2px solid transparent" }}>
                        {tab}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <BlockEditor block={selectedBlock} onChange={changes => updateBlock(selectedBlock.id, changes)} />
                </div>
                {/* Block info footer */}
                <div style={{ padding: "8px 16px", borderTop: "1px solid #1a1a1a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#555", fontSize: 10 }}>ID</span>
                  <span style={{ color: "#e63c3c", fontSize: 10, fontFamily: "monospace" }}>{selectedBlock.type}</span>
                  <span style={{ color: "#555", fontSize: 10 }}>Tipo</span>
                  <span style={{ color: "#888", fontSize: 10, fontFamily: "monospace" }}>{selectedBlock.type}</span>
                </div>
              </>
            ) : (
              <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, padding: 24 }}>
                {/* HTML Smart Import */}
                <div style={{ width: "100%", marginBottom: 16 }}>
                  <div style={{ color: "#fff", fontWeight: 700, fontSize: 13, marginBottom: 10 }}>Importar HTML inteligente</div>
                  <div style={{ background: "#0a0a0a", border: "2px dashed #2a2a2a", borderRadius: 12, padding: "24px 16px", textAlign: "center" }}>
                    <div style={{ color: "#e63c3c", fontSize: 28, marginBottom: 8, fontFamily: "monospace" }}>&lt;/&gt;</div>
                    <div style={{ color: "#fff", fontWeight: 700, fontSize: 12, marginBottom: 4 }}>HTML Smart Import</div>
                    <div style={{ color: "#555", fontSize: 10, lineHeight: 1.6 }}>Clic o arrastra un archivo `.html`<br/>Lo adapto al look del sitio y luego puedes<br/>editarlo visualmente desde el admin.</div>
                  </div>
                </div>
                <div style={{ width: "100%", borderTop: "1px solid #1a1a1a", paddingTop: 12 }}>
                  <div style={{ color: "#888", fontSize: 11, fontWeight: 600, marginBottom: 6 }}>Bloque</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "#555", fontSize: 12 }}>ID</span>
                    <span style={{ color: "#888", fontSize: 12 }}>—</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
                    <span style={{ color: "#555", fontSize: 12 }}>Tipo</span>
                    <span style={{ color: "#888", fontSize: 12 }}>—</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Add Block Modal ────────────────────────────────────────────── */}
      {showAddModal && (
        <AddBlockModal onAdd={addBlock} onClose={() => { setShowAddModal(false); setAddAfterIndex(null) }} />
      )}

      {/* ── Save Toast ─────────────────────────────────────────────────── */}
      {showSaveToast && (
        <div style={{ position: "fixed", bottom: 24, right: 24, background: "#22c55e", color: "#fff", padding: "12px 24px", borderRadius: 12, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 32px #22c55e44" }}>
          ✓ Cambios guardados correctamente
        </div>
      )}
    </div>
  )
}
