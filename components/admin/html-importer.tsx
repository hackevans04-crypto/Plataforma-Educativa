"use client"

import React from "react"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSCustomCodeThemeConfig, CMSSectionType, CMSHtmlImportMode } from "@/hooks/use-cms"
import { buildImportedHtml, classifyHtml, parseHtml } from "@/lib/html-import-utils"

type ImportMode = CMSHtmlImportMode

interface HtmlImporterProps {
  onCreateSection: (type: CMSSectionType, data: Record<string, unknown>) => void
}

const MODES: Array<{ val: ImportMode; lbl: string; badge?: string; desc: string }> = [
  {
    val: "adapted",
    lbl: "Adaptado al sitio",
    badge: "Recomendado",
    desc: "Reaplica tipografia, botones, formularios y superficies al estilo visual de tu pagina principal.",
  },
  {
    val: "hybrid",
    lbl: "Hibrido",
    desc: "Mantiene la estructura original del HTML y encima aplica el look general del sitio sin romper interacciones.",
  },
  {
    val: "sandbox",
    lbl: "Original",
    desc: "Mantiene el HTML tal cual llega. Util cuando quieres maxima fidelidad y luego editarlo manualmente.",
  },
]

const TYPE_ICON = {
  simulator: "SG",
  form: "FM",
  landing: "LD",
  widget: "WG",
  content: "HT",
} as const

const MODE_COLOR: Record<ImportMode, string> = {
  sandbox: "border-white/10 bg-white/[0.03] text-white/60",
  hybrid: "border-amber-500/20 bg-amber-500/5 text-amber-300",
  adapted: "border-primary/20 bg-primary/5 text-primary/90",
}

const MODE_INFO: Record<ImportMode, string> = {
  sandbox: "Conserva el archivo completo. Puedes editarlo luego desde el canvas y el panel visual.",
  hybrid: "Usa el HTML original pero lo lleva al tono de Hack Evans con botones, inputs y navegacion alineados al sitio.",
  adapted: "Prioriza el look de la pagina principal: nav del sitio, superficies, textos y CTAs coherentes desde el primer import.",
}

const DEFAULT_THEME: CMSCustomCodeThemeConfig = {
  accentColor: "#E8392A",
}

export function HtmlImporter({ onCreateSection }: HtmlImporterProps) {
  const [uiMode, setUiMode] = React.useState<"idle" | "detected" | "done">("idle")
  const [detection, setDetection] = React.useState<ReturnType<typeof classifyHtml> | null>(null)
  const [parsedTitle, setParsedTitle] = React.useState("Sin titulo")
  const [rawHtml, setRawHtml] = React.useState("")
  const [fileName, setFileName] = React.useState("")
  const [importMode, setImportMode] = React.useState<ImportMode>("adapted")
  const [stripNavigation, setStripNavigation] = React.useState(true)
  const [stripFooter, setStripFooter] = React.useState(true)
  const fileRef = React.useRef<HTMLInputElement>(null)

  const reset = React.useCallback(() => {
    setUiMode("idle")
    setDetection(null)
    setParsedTitle("Sin titulo")
    setRawHtml("")
    setFileName("")
    setImportMode("adapted")
    setStripNavigation(true)
    setStripFooter(true)
  }, [])

  const handleFile = React.useCallback((file: File) => {
    if (!file) return

    setFileName(file.name)

    const reader = new FileReader()
    reader.onload = (event) => {
      const html = String(event.target?.result || "")
      const parsed = parseHtml(html)
      const nextDetection = classifyHtml(html, parsed)
      setRawHtml(html)
      setParsedTitle(parsed.title)
      setDetection(nextDetection)
      setImportMode(nextDetection.recommendation)
      setStripNavigation(nextDetection.elements.hasNavigation)
      setStripFooter(nextDetection.elements.hasFooter)
      setUiMode("detected")
    }
    reader.readAsText(file)
  }, [])

  const handleConfirm = React.useCallback(() => {
    if (!rawHtml || !detection) return

    const { html } = buildImportedHtml(rawHtml, {
      mode: importMode,
      stripNavigation,
      stripFooter,
      theme: DEFAULT_THEME,
    })

    onCreateSection("customCode", {
      html,
      sourceHtml: rawHtml,
      importMode,
      stripNavigation,
      stripFooter,
      themeOverrides: DEFAULT_THEME,
      actionBindings: [],
      nota: `Importado: ${fileName} [${importMode}] - ${detection.label}`,
      importedTitle: parsedTitle,
    })

    setUiMode("done")
    window.setTimeout(() => reset(), 2200)
  }, [detection, fileName, importMode, onCreateSection, parsedTitle, rawHtml, reset, stripFooter, stripNavigation])

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    const file = event.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  if (uiMode === "done") {
    return (
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
        <div className="text-sm font-semibold text-emerald-400">Bloque HTML creado</div>
        <div className="mt-1 text-xs text-white/45">{fileName}</div>
      </div>
    )
  }

  if (uiMode === "detected" && detection) {
    const stats = [
      { value: detection.elements.buttons, label: "botones" },
      { value: detection.elements.links, label: "links" },
      { value: detection.elements.inputs, label: "campos" },
      { value: detection.elements.cards, label: "cards" },
      { value: detection.elements.scripts, label: "scripts" },
      { value: detection.elements.styles, label: "estilos" },
    ].filter((item) => item.value > 0)

    return (
      <div className="space-y-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/[0.05] p-3">
          <div className="mb-2 flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-primary/20 bg-[#0b1017] text-xs font-bold tracking-[0.18em] text-primary">
              {TYPE_ICON[detection.type]}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-white">{parsedTitle}</div>
              <div className="text-xs font-semibold text-primary">{detection.label}</div>
            </div>
          </div>

          {stats.length > 0 ? (
            <div className="mb-2 grid grid-cols-3 gap-1.5">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-xl border border-white/8 bg-white/[0.03] px-2 py-2 text-center">
                  <div className="text-xs font-bold text-white">{stat.value}</div>
                  <div className="text-[10px] text-white/40">{stat.label}</div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5">
            {detection.elements.hasNavigation ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/55">Nav detectado</span> : null}
            {detection.elements.hasFooter ? <span className="rounded-full border border-white/10 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/55">Footer detectado</span> : null}
            {detection.elements.hasForms ? <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-300">Formulario</span> : null}
            {detection.elements.hasTimer ? <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 text-[10px] text-amber-300">Temporizador</span> : null}
            {detection.elements.hasScore ? <span className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-0.5 text-[10px] text-blue-300">Resultados</span> : null}
            {detection.elements.hasVideo ? <span className="rounded-full border border-violet-500/20 bg-violet-500/10 px-2 py-0.5 text-[10px] text-violet-300">Video</span> : null}
          </div>
        </div>

        <div>
          <div className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Motor de importacion</div>
          <div className="space-y-1.5">
            {MODES.map(({ val, lbl, badge, desc }) => (
              <button
                key={val}
                type="button"
                onClick={() => setImportMode(val)}
                className={cn(
                  "w-full rounded-xl border p-3 text-left transition-all",
                  importMode === val ? "border-primary bg-primary/10" : "border-white/8 hover:border-white/15"
                )}
              >
                <div className="mb-1 flex flex-wrap items-center gap-1.5">
                  <span className={cn("text-sm font-semibold", importMode === val ? "text-primary" : "text-white")}>{lbl}</span>
                  {badge ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide",
                        val === detection.recommendation ? "bg-primary/20 text-primary" : "bg-white/8 text-white/35"
                      )}
                    >
                      {badge}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] leading-4 text-white/40">{desc}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
          <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/30">Limpieza automatica</div>
          <div className="mt-3 space-y-2">
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-[#0b1017] px-3 py-3 text-sm text-white/70">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--primary)]"
                checked={stripNavigation}
                onChange={(event) => setStripNavigation(event.target.checked)}
              />
              <span>
                <span className="block font-semibold text-white">Usar la navegacion del sitio</span>
                <span className="mt-1 block text-xs leading-5 text-white/45">
                  Oculta el `nav/header` importado y deja visible el navbar principal de Hack Evans.
                </span>
              </span>
            </label>

            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-white/8 bg-[#0b1017] px-3 py-3 text-sm text-white/70">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-white/20 bg-transparent accent-[var(--primary)]"
                checked={stripFooter}
                onChange={(event) => setStripFooter(event.target.checked)}
              />
              <span>
                <span className="block font-semibold text-white">Ocultar el footer del HTML</span>
                <span className="mt-1 block text-xs leading-5 text-white/45">
                  Evita duplicar el footer importado cuando la pagina ya usa el footer global del sitio.
                </span>
              </span>
            </label>
          </div>
        </div>

        <div className={cn("rounded-xl border p-2.5 text-[11px] leading-5", MODE_COLOR[importMode])}>
          {MODE_INFO[importMode]}
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={reset}
            className="h-10 flex-1 rounded-xl border border-white/10 text-sm text-white/55 transition-all hover:border-white/20 hover:text-white"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary text-sm font-semibold text-white transition-all hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" />
            Crear bloque
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      onClick={() => fileRef.current?.click()}
      className="cursor-pointer rounded-2xl border-2 border-dashed border-white/10 p-5 text-center transition-all hover:border-primary/40"
    >
      <input
        ref={fileRef}
        type="file"
        accept=".html,text/html"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      <div className="mb-2 text-3xl select-none">{"</>"}</div>
      <div className="mb-1 text-sm font-semibold text-white">HTML Smart Import</div>
      <div className="text-[11px] leading-5 text-white/35">
        Clic o arrastra un archivo `.html`
        <br />
        Lo adapto al look del sitio y luego puedes editarlo visualmente desde el admin.
      </div>
    </div>
  )
}
