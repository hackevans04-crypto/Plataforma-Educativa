"use client"

import { useEffect, useRef, useState } from "react"
import type { CSSProperties, FocusEvent, MouseEvent, RefObject } from "react"
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2, Palette } from "lucide-react"
import { cn } from "@/lib/utils"
import type { CMSTextStyle } from "@/hooks/use-cms"

type InlineTag = "span" | "div" | "p" | "h1" | "h2" | "h3"

interface StudioInlineTextProps {
  value: string
  editable?: boolean
  multiline?: boolean
  singleClickToEdit?: boolean
  as?: InlineTag
  className?: string
  editorClassName?: string
  style?: CSSProperties
  editorStyle?: CSSProperties
  placeholder?: string
  formatting?: CMSTextStyle
  onFormattingChange?: (formatting: CMSTextStyle) => void
  allowLink?: boolean
  onChange?: (value: string) => void
  onActivate?: () => void
}

const SIZE_SCALE: Record<NonNullable<CMSTextStyle["size"]>, string> = {
  sm: "0.85em",
  md: "1em",
  lg: "1.15em",
  xl: "1.3em",
  "2xl": "1.5em",
}

function buildTextStyle(baseStyle: CSSProperties | undefined, formatting: CMSTextStyle | undefined): CSSProperties | undefined {
  if (!formatting) return baseStyle
  return {
    ...baseStyle,
    color: formatting.color || baseStyle?.color,
    fontWeight: formatting.bold ? 700 : baseStyle?.fontWeight,
    fontStyle: formatting.italic ? "italic" : baseStyle?.fontStyle,
    textAlign: formatting.align || (baseStyle?.textAlign as CSSProperties["textAlign"]),
    fontSize: formatting.size ? SIZE_SCALE[formatting.size] : baseStyle?.fontSize,
  }
}

export default function StudioInlineText({
  value,
  editable = false,
  multiline = false,
  singleClickToEdit = true,
  as = "div",
  className,
  editorClassName,
  style,
  editorStyle,
  placeholder,
  formatting,
  onFormattingChange,
  allowLink = true,
  onChange,
  onActivate,
}: StudioInlineTextProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(value)
  const [localFormatting, setLocalFormatting] = useState<CMSTextStyle>(formatting ?? {})
  const [showLinkField, setShowLinkField] = useState(false)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const Tag = as

  const currentFormatting = formatting ?? localFormatting

  useEffect(() => {
    setDraft(value)
  }, [value])

  useEffect(() => {
    setLocalFormatting(formatting ?? {})
  }, [formatting])

  useEffect(() => {
    if (!editing || !inputRef.current) return
    inputRef.current.focus()
    if ("select" in inputRef.current) {
      inputRef.current.select()
    }
  }, [editing])

  const commit = () => {
    setEditing(false)
    const nextValue = draft
    if (nextValue !== value) {
      onChange?.(nextValue)
    }
  }

  const cancel = () => {
    setDraft(value)
    setEditing(false)
  }

  const updateFormatting = (patch: Partial<CMSTextStyle>) => {
    const next = { ...currentFormatting, ...patch }
    if (onFormattingChange) {
      onFormattingChange(next)
      return
    }
    setLocalFormatting(next)
  }

  const displayStyle = buildTextStyle(style, currentFormatting)
  const inputDisplayStyle = buildTextStyle(editorStyle, currentFormatting)

  const startEditing = (event: MouseEvent<HTMLElement>) => {
    if (!editable) return
    event.preventDefault()
    event.stopPropagation()
    onActivate?.()
    setDraft(value)
    setEditing(true)
  }

  const handleEditorBlur = (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (nextTarget && wrapperRef.current?.contains(nextTarget)) return
    commit()
  }

  if (editing && editable) {
    const toolbar = (
      <div data-he-editor-ui="true" className="absolute -top-14 left-0 z-30 flex flex-wrap items-center gap-1 rounded-2xl border border-primary/20 bg-[#08111b]/96 px-2 py-1.5 shadow-[0_18px_40px_rgba(0,0,0,0.42)]">
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            updateFormatting({ bold: !currentFormatting.bold })
          }}
          className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all", currentFormatting.bold ? "bg-primary text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}
          title="Negrita"
        >
          <Bold className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onClick={(event) => {
            event.preventDefault()
            event.stopPropagation()
            updateFormatting({ italic: !currentFormatting.italic })
          }}
          className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all", currentFormatting.italic ? "bg-primary text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}
          title="Cursiva"
        >
          <Italic className="h-3.5 w-3.5" />
        </button>
        <div className="mx-1 h-5 w-px bg-white/8" />
        {([
          { key: "left", icon: AlignLeft, label: "Izquierda" },
          { key: "center", icon: AlignCenter, label: "Centro" },
          { key: "right", icon: AlignRight, label: "Derecha" },
        ] as const).map((item) => (
          <button
            key={item.key}
            type="button"
            onMouseDown={(event) => event.preventDefault()}
            onClick={(event) => {
              event.preventDefault()
              event.stopPropagation()
              updateFormatting({ align: item.key })
            }}
            className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all", currentFormatting.align === item.key ? "bg-primary text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}
            title={item.label}
          >
            <item.icon className="h-3.5 w-3.5" />
          </button>
        ))}
        <div className="mx-1 h-5 w-px bg-white/8" />
        <select
          data-he-editor-input="true"
          value={currentFormatting.size || "md"}
          onChange={(event) => updateFormatting({ size: event.target.value as CMSTextStyle["size"] })}
          onClick={(event) => event.stopPropagation()}
          className="h-8 rounded-xl border border-white/10 bg-white/[0.03] px-2 text-xs text-white/70 outline-none focus:border-primary"
          title="Tamaño"
        >
          <option value="sm">S</option>
          <option value="md">M</option>
          <option value="lg">L</option>
          <option value="xl">XL</option>
          <option value="2xl">2XL</option>
        </select>
        <label className="ml-1 inline-flex h-8 items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-2 text-xs text-white/70">
          <Palette className="h-3.5 w-3.5" />
          <input
            data-he-editor-input="true"
            type="color"
            value={currentFormatting.color || "#ffffff"}
            onChange={(event) => updateFormatting({ color: event.target.value })}
            onClick={(event) => event.stopPropagation()}
            className="h-5 w-6 cursor-pointer rounded bg-transparent p-0"
            title="Color"
          />
        </label>
        {allowLink ? (
          <>
            <button
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={(event) => {
                event.preventDefault()
                event.stopPropagation()
                setShowLinkField((value) => !value)
              }}
              className={cn("inline-flex h-8 w-8 items-center justify-center rounded-xl transition-all", currentFormatting.href ? "bg-primary text-white" : "text-white/55 hover:bg-white/5 hover:text-white")}
              title="Link"
            >
              <Link2 className="h-3.5 w-3.5" />
            </button>
            {showLinkField ? (
              <input
                data-he-editor-input="true"
                value={currentFormatting.href || ""}
                onChange={(event) => updateFormatting({ href: event.target.value })}
                onClick={(event) => event.stopPropagation()}
                placeholder="https:// o /ruta"
                className="h-8 w-40 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-xs text-white/75 outline-none focus:border-primary"
              />
            ) : null}
          </>
        ) : null}
      </div>
    )

    if (multiline) {
      return (
        <div ref={wrapperRef} className="relative w-full">
          {toolbar}
          <textarea
            data-he-editor-input="true"
            ref={inputRef as RefObject<HTMLTextAreaElement>}
            value={draft}
            rows={Math.max(3, draft.split("\n").length)}
            placeholder={placeholder}
            onClick={(event) => event.stopPropagation()}
            onChange={(event) => setDraft(event.target.value)}
            onBlur={handleEditorBlur}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault()
                commit()
              }
              if (event.key === "Escape") {
                event.preventDefault()
                cancel()
              }
            }}
            className={cn(
              "w-full rounded-2xl border border-primary/45 bg-[#08111b]/96 px-4 py-3 text-inherit outline-none ring-2 ring-primary/15 transition-all",
              editorClassName
            )}
            style={inputDisplayStyle}
          />
        </div>
      )
    }

    return (
      <div ref={wrapperRef} className="relative w-full">
        {toolbar}
        <input
          data-he-editor-input="true"
          ref={inputRef as RefObject<HTMLInputElement>}
          value={draft}
          placeholder={placeholder}
          onClick={(event) => event.stopPropagation()}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={handleEditorBlur}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              commit()
            }
            if (event.key === "Escape") {
              event.preventDefault()
              cancel()
            }
          }}
          className={cn(
            "w-full rounded-xl border border-primary/45 bg-[#08111b]/96 px-3 py-2 text-inherit outline-none ring-2 ring-primary/15 transition-all",
            editorClassName
          )}
          style={inputDisplayStyle}
        />
      </div>
    )
  }

  const innerContent =
    !editable && allowLink && currentFormatting.href
      ? (
        <a href={currentFormatting.href} className="inline-flex items-center gap-1 underline decoration-white/25 underline-offset-4">
          {value || placeholder || ""}
        </a>
      )
      : value || placeholder || ""

  return (
    <Tag
      onClick={(event) => {
        if (editable && singleClickToEdit) {
          startEditing(event)
          return
        }
        onActivate?.()
      }}
      onDoubleClick={startEditing}
      className={cn(className, editable && "cursor-text")}
      style={displayStyle}
      data-studio-inline={editable ? "true" : undefined}
    >
      {innerContent}
    </Tag>
  )
}
