"use client"

import React, { useState, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import type { EditorElementInfo, EditorCommand, EditorMessage } from "./html-editor-bridge"

// ---- color helpers ----

function toHex(css: string): string {
  const m = css.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/)
  if (!m) return "#000000"
  return "#" + [m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, "0")).join("")
}

function isTransparent(css: string) {
  return !css || css === "transparent" || css === "rgba(0, 0, 0, 0)"
}

function parsePx(css: string) {
  return parseFloat(css) || 0
}

// ---- small UI pieces ----

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-[10px] text-white/35 w-[72px] flex-shrink-0">{label}</span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

function ColorPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const hex = isTransparent(value) ? "#000000" : toHex(value)
  return (
    <div className="flex items-center gap-1.5">
      <input type="color" className="w-6 h-6 rounded cursor-pointer border border-white/10 bg-transparent flex-shrink-0"
        value={hex} onChange={(e) => onChange(e.target.value)} />
      <input className="flex-1 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-primary/50"
        value={hex} onChange={(e) => onChange(e.target.value)} />
      {isTransparent(value) && <span className="text-[9px] text-white/25">auto</span>}
    </div>
  )
}

function Slider({ value, onChange, min = 0, max = 120, unit = "px" }:
  { value: string; onChange: (v: string) => void; min?: number; max?: number; unit?: string }) {
  const num = parsePx(value)
  return (
    <div className="flex items-center gap-1.5">
      <input type="range" min={min} max={max} step={1} className="flex-1 accent-primary h-1"
        value={num} onChange={(e) => onChange(e.target.value + unit)} />
      <span className="text-[10px] text-white/45 w-9 text-right tabular-nums">{num}{unit}</span>
    </div>
  )
}

// ---- main component ----

interface Props {
  element:    EditorElementInfo | null
  isEditing:  boolean
  iframeRef:  React.RefObject<HTMLIFrameElement>
  onClose:    () => void
}

export function HtmlElementInspector({ element, isEditing, iframeRef, onClose }: Props) {
  const [tab, setTab]           = useState<"style" | "text">("style")
  const [localText, setLocalText] = useState("")
  const [dragOn, setDragOn]     = useState(false)

  useEffect(() => { setLocalText(element?.text ?? "") }, [element?.eid])

  const send = useCallback((cmd: EditorCommand) => {
    iframeRef.current?.contentWindow?.postMessage(cmd, "*")
  }, [iframeRef])

  const style = (prop: string, value: string) => {
    if (!element?.eid) return
    send({ __editor_cmd: true, cmd: "style", eid: element.eid, prop, value })
  }

  const toggleDrag = () => {
    if (!dragOn) send({ __editor_cmd: true, cmd: "enable_drag" })
    setDragOn(!dragOn)
  }

  // ---- idle state ----
  if (!element) return (
    <div className="px-3 py-5 text-center space-y-1.5">
      <div className="text-2xl">👆</div>
      <div className="text-xs text-white/35">Haz clic en un elemento para editar</div>
      <div className="text-[10px] text-white/20">Doble clic en texto para editar inline</div>
      <button onClick={toggleDrag}
        className={cn("mt-2 w-full py-1.5 rounded-xl border text-xs font-semibold transition-all",
          dragOn ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-white/40 hover:border-white/20")}>
        {dragOn ? "✦ Drag & drop activo" : "Activar drag & drop"}
      </button>
    </div>
  )

  // ---- editing state badge ----
  const { styles: s } = element

  return (
    <div className="space-y-2">
      {/* Element badge */}
      <div className="flex items-center gap-2 px-2.5 py-2 bg-primary/10 border border-primary/20 rounded-xl">
        <code className="text-xs font-mono text-primary flex-1 truncate">
          {element.tag}{element.id ? "#" + element.id : ""}{element.eid ? ` [${element.eid}]` : ""}
        </code>
        {isEditing && (
          <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">
            Editando
          </span>
        )}
        <button onClick={onClose} className="text-white/25 hover:text-white text-sm transition-colors leading-none">×</button>
      </div>

      {/* Tabs */}
      <div className="flex rounded-xl overflow-hidden border border-white/8">
        {(["style", "text"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={cn("flex-1 py-1.5 text-xs font-semibold capitalize transition-all",
              tab === t ? "bg-white/8 text-white" : "text-white/35 hover:text-white/55")}>
            {t === "style" ? "Estilo" : "Contenido"}
          </button>
        ))}
      </div>

      {/* ---- STYLE TAB ---- */}
      {tab === "style" && (
        <div className="divide-y divide-white/5 text-xs">

          {/* Typography */}
          <div className="pb-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 pb-1">Tipografia</div>
            <Row label="Color">
              <ColorPicker value={s.color} onChange={(v) => style("color", v)} />
            </Row>
            <Row label="Tamaño">
              <Slider value={s.fontSize} min={8} max={96} onChange={(v) => style("fontSize", v)} />
            </Row>
            <Row label="Peso">
              <div className="flex gap-1">
                {["400","500","600","700","800"].map((w) => (
                  <button key={w} onClick={() => style("fontWeight", w)}
                    className={cn("flex-1 py-1 rounded-lg border text-[10px] transition-all",
                      Math.round(parsePx(s.fontWeight)) === parseInt(w)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/8 text-white/35 hover:border-white/20")}>
                    {w}
                  </button>
                ))}
              </div>
            </Row>
            <Row label="Alinear">
              <div className="flex gap-1">
                {(["left","center","right","justify"] as const).map((a) => (
                  <button key={a} onClick={() => style("textAlign", a)}
                    className={cn("flex-1 py-1 rounded-lg border text-[11px] transition-all",
                      s.textAlign === a
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/8 text-white/35 hover:border-white/20")}>
                    {a === "left" ? "⟵" : a === "center" ? "⟺" : a === "right" ? "⟶" : "☰"}
                  </button>
                ))}
              </div>
            </Row>
          </div>

          {/* Background */}
          <div className="py-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 pb-1">Fondo</div>
            <Row label="Color">
              <div className="flex items-center gap-1">
                <div className="flex-1">
                  <ColorPicker
                    value={isTransparent(s.backgroundColor) ? "#000000" : s.backgroundColor}
                    onChange={(v) => style("backgroundColor", v)}
                  />
                </div>
                <button onClick={() => style("backgroundColor", "transparent")}
                  className="text-[10px] text-white/25 hover:text-white/60 border border-white/8 rounded-lg px-1.5 py-1 flex-shrink-0">
                  ∅
                </button>
              </div>
            </Row>
            <Row label="Radio">
              <Slider value={s.borderRadius} min={0} max={48} onChange={(v) => style("borderRadius", v)} />
            </Row>
          </div>

          {/* Spacing */}
          <div className="py-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 pb-1">Espaciado</div>
            <Row label="Padding">
              <Slider value={s.padding} min={0} max={80} onChange={(v) => style("padding", v)} />
            </Row>
            <Row label="Margin">
              <Slider value={s.margin} min={0} max={80} onChange={(v) => style("margin", v)} />
            </Row>
          </div>

          {/* Size */}
          <div className="pt-2">
            <div className="text-[9px] font-bold uppercase tracking-widest text-white/20 pb-1">Dimension</div>
            <Row label="Ancho">
              <div className="flex gap-1">
                {["auto","100%","50%","fit-content"].map((w) => (
                  <button key={w} onClick={() => style("width", w)}
                    className={cn("flex-1 py-1 rounded-lg border text-[9px] transition-all",
                      s.width === w
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-white/8 text-white/30 hover:border-white/20")}>
                    {w}
                  </button>
                ))}
              </div>
            </Row>
          </div>
        </div>
      )}

      {/* ---- CONTENT TAB ---- */}
      {tab === "text" && (
        <div className="space-y-2">
          {isEditing ? (
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-2.5 text-[11px] text-emerald-400">
              Editando inline en el canvas — doble clic para activar, Esc para salir
            </div>
          ) : element.isText ? (
            <>
              <div className="text-[9px] font-bold uppercase tracking-widest text-white/20">Texto</div>
              <textarea
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary/50 min-h-[80px] resize-none"
                value={localText}
                onChange={(e) => setLocalText(e.target.value)}
                onBlur={() => {
                  if (element.eid)
                    send({ __editor_cmd: true, cmd: "text", eid: element.eid, value: localText })
                }}
              />
              <div className="text-[10px] text-white/20">O haz doble clic en el canvas para editar inline</div>
            </>
          ) : (
            <div className="text-[10px] text-white/30 px-1">
              Este elemento ({element.tag}) no es de texto. Selecciona un párrafo, título o botón.
            </div>
          )}

          {/* Drag & drop toggle */}
          <div className="pt-1 border-t border-white/5">
            <button onClick={toggleDrag}
              className={cn("w-full py-1.5 rounded-xl border text-xs font-semibold transition-all",
                dragOn ? "border-primary bg-primary/10 text-primary" : "border-white/10 text-white/40 hover:border-white/20")}>
              {dragOn ? "✦ Drag & drop activo — arrastra bloques" : "Activar drag & drop de bloques"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
