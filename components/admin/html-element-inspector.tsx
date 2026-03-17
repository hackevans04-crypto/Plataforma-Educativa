"use client"

import React from "react"
import { cn } from "@/lib/utils"
import type { EditorElementInfo, EditorCommand } from "./html-editor-bridge"

// ---- helpers ----

function parseColor(css: string): string {
  // rgb(r,g,b) → #rrggbb
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return "#000000"
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("")
}

function parsePx(css: string): string {
  const m = css.match(/([\d.]+)px/)
  return m ? m[1] : "0"
}

function isTransparent(css: string) {
  return css === "transparent" || css === "rgba(0, 0, 0, 0)" || css === ""
}

// ---- sub-components ----

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] text-white/35 w-20 flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function TextInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <input
      className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/50"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = isTransparent(value) ? "#000000" : parseColor(value)
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
      />
      <input
        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/50"
        value={hex}
        onChange={(e) => onChange(e.target.value)}
      />
      {isTransparent(value) && (
        <span className="text-[9px] text-white/30">auto</span>
      )}
    </div>
  )
}

function PxInput({ value, onChange, min = 0, max = 200 }: { value: string; onChange: (v: string) => void; min?: number; max?: number }) {
  const num = parseFloat(parsePx(value)) || 0
  return (
    <div className="flex items-center gap-1.5">
      <input
        type="range"
        min={min} max={max} step={1}
        className="flex-1 accent-primary"
        value={num}
        onChange={(e) => onChange(e.target.value + "px")}
      />
      <span className="text-[10px] text-white/50 w-8 text-right">{num}px</span>
    </div>
  )
}

// ---- main component ----

interface HtmlElementInspectorProps {
  element: EditorElementInfo | null
  iframeRef: React.RefObject<HTMLIFrameElement>
  onClose: () => void
}

export function HtmlElementInspector({ element, iframeRef, onClose }: HtmlElementInspectorProps) {
  const [localText, setLocalText] = React.useState("")
  const [tab, setTab] = React.useState<"content" | "style">("style")

  React.useEffect(() => {
    setLocalText(element?.text ?? "")
  }, [element?.eid])

  if (!element) return (
    <div className="px-3 py-4 text-center">
      <div className="text-2xl mb-1.5">&#128065;</div>
      <div className="text-xs text-white/35">Haz clic en cualquier elemento del bloque para editarlo</div>
    </div>
  )

  const send = (cmd: EditorCommand) => {
    iframeRef.current?.contentWindow?.postMessage(cmd, "*")
  }

  const style = (prop: string, value: string) => {
    if (!element.eid) return
    send({ __editor_cmd: true, cmd: "style", eid: element.eid, prop, value })
  }

  const { styles: s } = element

  const badgeTag = element.tag + (element.id ? "#" + element.id : "")

  return (
    <div className="space-y-2">
      {/* Selected element badge */}
      <div className="flex items-center gap-2 px-3 py-2 bg-primary/10 border border-primary/20 rounded-xl">
        <code className="text-xs font-mono text-primary flex-1 truncate">{badgeTag}</code>
        <button onClick={onClose} className="text-white/30 hover:text-white text-xs transition-colors">✕</button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/8">
        {(["style", "content"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-1.5 text-xs font-semibold capitalize transition-all",
              tab === t ? "bg-white/8 text-white" : "text-white/35 hover:text-white/60")}>
            {t === "style" ? "Estilo" : "Contenido"}
          </button>
        ))}
      </div>

      {/* Style tab */}
      {tab === "style" && (
        <div className="divide-y divide-white/5">
          <div className="pb-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1 pb-1">Tipografia</div>
            <Row label="Color texto">
              <ColorInput value={s.color} onChange={(v) => style("color", v)} />
            </Row>
            <Row label="Tamaño">
              <PxInput value={s.fontSize} min={8} max={80} onChange={(v) => style("fontSize", v)} />
            </Row>
            <Row label="Peso">
              <select
                className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white"
                value={s.fontWeight}
                onChange={(e) => style("fontWeight", e.target.value)}>
                {["300","400","500","600","700","800","900"].map(w => (
                  <option key={w} value={w}>{w}</option>
                ))}
              </select>
            </Row>
            <Row label="Alineacion">
              <div className="flex gap-1">
                {(["left","center","right","justify"] as const).map((a) => (
                  <button key={a} onClick={() => style("textAlign", a)}
                    className={cn("flex-1 py-1 text-[10px] rounded-lg border transition-all",
                      s.textAlign === a ? "border-primary bg-primary/10 text-primary" : "border-white/8 text-white/40 hover:border-white/20")}>
                    {a === "left" ? "◀" : a === "center" ? "◆" : a === "right" ? "▶" : "☰"}
                  </button>
                ))}
              </div>
            </Row>
          </div>

          <div className="py-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1 pb-1">Fondo</div>
            <Row label="Color fondo">
              <div className="flex items-center gap-1.5">
                <ColorInput
                  value={isTransparent(s.backgroundColor) ? "#000000" : s.backgroundColor}
                  onChange={(v) => style("backgroundColor", v)}
                />
                <button onClick={() => style("backgroundColor", "transparent")}
                  className="text-[9px] text-white/30 hover:text-white/60 border border-white/8 rounded px-1.5 py-1 whitespace-nowrap">
                  ∅
                </button>
              </div>
            </Row>
            <Row label="Radio borde">
              <PxInput value={s.borderRadius} min={0} max={50} onChange={(v) => style("borderRadius", v)} />
            </Row>
          </div>

          <div className="pt-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1 pb-1">Espaciado</div>
            <Row label="Padding">
              <PxInput value={s.padding} min={0} max={80} onChange={(v) => style("padding", v)} />
            </Row>
            <Row label="Margin">
              <PxInput value={s.margin} min={0} max={80} onChange={(v) => style("margin", v)} />
            </Row>
          </div>
        </div>
      )}

      {/* Content tab */}
      {tab === "content" && (
        <div className="space-y-2">
          {element.eid ? (
            <>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/25 px-1">Texto visible</div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 min-h-[80px] resize-none"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={() => {
                  if (element.eid)
                    send({ __editor_cmd: true, cmd: "text", eid: element.eid, value: localText })
                }}
              />
              <div className="text-[10px] text-white/25 px-1">Los cambios se aplican al perder el foco</div>
            </>
          ) : (
            <div className="text-[10px] text-white/35 px-1">
              Este elemento no tiene data-eid asignado. Usa el modo Sandbox y reimporta para habilitar edicion de contenido.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
