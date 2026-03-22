export type TypographyFontOption = {
  id: string
  label: string
  value: string
  preview: string
  note: string
}

export type TypographyFontGroup = {
  id: string
  label: string
  fonts: TypographyFontOption[]
}

export const TYPOGRAPHY_SITE_FONT: TypographyFontOption = {
  id: "hack-evans-sans",
  label: "Hack Evans Sans",
  value: "var(--he-font-sans, 'Barlow', system-ui, sans-serif)",
  preview: "Hack Evans",
  note: "Fuente base del sitio",
}

export const TYPOGRAPHY_FONT_GROUPS: TypographyFontGroup[] = [
  {
    id: "headlines",
    label: "Titulares / Impacto",
    fonts: [
      { id: "playfair-display", label: "Playfair Display", value: "'Playfair Display', Georgia, serif", preview: "El zorro marrón", note: "Titulares / Impacto" },
      { id: "merriweather", label: "Merriweather", value: "'Merriweather', Georgia, serif", preview: "Hack Evans", note: "Titulares / Impacto" },
      { id: "oswald", label: "Oswald", value: "'Oswald', 'Arial Narrow', sans-serif", preview: "El zorro marrón", note: "Titulares / Impacto" },
      { id: "bebas-neue", label: "Bebas Neue", value: "'Bebas Neue', 'Arial Narrow', sans-serif", preview: "Hack Evans", note: "Titulares / Impacto" },
      { id: "anton", label: "Anton", value: "'Anton', Impact, sans-serif", preview: "El zorro marrón", note: "Titulares / Impacto" },
      { id: "abril-fatface", label: "Abril Fatface", value: "'Abril Fatface', Georgia, serif", preview: "Hack Evans", note: "Titulares / Impacto" },
    ],
  },
  {
    id: "reading",
    label: "Cuerpo / Lectura",
    fonts: [
      { id: "inter", label: "Inter", value: "'Inter', system-ui, sans-serif", preview: "El zorro marrón", note: "Cuerpo / Lectura" },
      { id: "lato", label: "Lato", value: "'Lato', system-ui, sans-serif", preview: "Hack Evans", note: "Cuerpo / Lectura" },
      { id: "open-sans", label: "Open Sans", value: "'Open Sans', system-ui, sans-serif", preview: "El zorro marrón", note: "Cuerpo / Lectura" },
      { id: "roboto", label: "Roboto", value: "'Roboto', system-ui, sans-serif", preview: "Hack Evans", note: "Cuerpo / Lectura" },
      { id: "nunito", label: "Nunito", value: "'Nunito', system-ui, sans-serif", preview: "El zorro marrón", note: "Cuerpo / Lectura" },
      { id: "source-sans-pro", label: "Source Sans Pro", value: "'Source Sans Pro', system-ui, sans-serif", preview: "Hack Evans", note: "Cuerpo / Lectura" },
      { id: "raleway", label: "Raleway", value: "'Raleway', system-ui, sans-serif", preview: "El zorro marrón", note: "Cuerpo / Lectura" },
    ],
  },
  {
    id: "editorial",
    label: "Elegante / Editorial",
    fonts: [
      { id: "cormorant-garamond", label: "Cormorant Garamond", value: "'Cormorant Garamond', Georgia, serif", preview: "Hack Evans", note: "Elegante / Editorial" },
      { id: "eb-garamond", label: "EB Garamond", value: "'EB Garamond', Georgia, serif", preview: "El zorro marrón", note: "Elegante / Editorial" },
      { id: "libre-baskerville", label: "Libre Baskerville", value: "'Libre Baskerville', Georgia, serif", preview: "Hack Evans", note: "Elegante / Editorial" },
      { id: "crimson-text", label: "Crimson Text", value: "'Crimson Text', Georgia, serif", preview: "El zorro marrón", note: "Elegante / Editorial" },
    ],
  },
  {
    id: "technical",
    label: "Técnico / Código",
    fonts: [
      { id: "jetbrains-mono", label: "JetBrains Mono", value: "'JetBrains Mono', monospace", preview: "Hack Evans", note: "Técnico / Código" },
      { id: "fira-code", label: "Fira Code", value: "'Fira Code', monospace", preview: "El zorro marrón", note: "Técnico / Código" },
      { id: "source-code-pro", label: "Source Code Pro", value: "'Source Code Pro', monospace", preview: "Hack Evans", note: "Técnico / Código" },
      { id: "ibm-plex-mono", label: "IBM Plex Mono", value: "'IBM Plex Mono', monospace", preview: "El zorro marrón", note: "Técnico / Código" },
    ],
  },
  {
    id: "script",
    label: "Caligrafía / Calidez",
    fonts: [
      { id: "dancing-script", label: "Dancing Script", value: "'Dancing Script', cursive", preview: "Hack Evans", note: "Caligrafía / Calidez" },
      { id: "pacifico", label: "Pacifico", value: "'Pacifico', cursive", preview: "El zorro marrón", note: "Caligrafía / Calidez" },
      { id: "caveat", label: "Caveat", value: "'Caveat', cursive", preview: "Hack Evans", note: "Caligrafía / Calidez" },
      { id: "satisfy", label: "Satisfy", value: "'Satisfy', cursive", preview: "El zorro marrón", note: "Caligrafía / Calidez" },
      { id: "great-vibes", label: "Great Vibes", value: "'Great Vibes', cursive", preview: "Hack Evans", note: "Caligrafía / Calidez" },
    ],
  },
  {
    id: "modern-display",
    label: "Moderno / Display",
    fonts: [
      { id: "space-grotesk", label: "Space Grotesk", value: "'Space Grotesk', system-ui, sans-serif", preview: "El zorro marrón", note: "Moderno / Display" },
      { id: "dm-sans", label: "DM Sans", value: "'DM Sans', system-ui, sans-serif", preview: "Hack Evans", note: "Moderno / Display" },
      { id: "syne", label: "Syne", value: "'Syne', system-ui, sans-serif", preview: "El zorro marrón", note: "Moderno / Display" },
      { id: "plus-jakarta-sans", label: "Plus Jakarta Sans", value: "'Plus Jakarta Sans', system-ui, sans-serif", preview: "Hack Evans", note: "Moderno / Display" },
      { id: "outfit", label: "Outfit", value: "'Outfit', system-ui, sans-serif", preview: "El zorro marrón", note: "Moderno / Display" },
    ],
  },
]

export const TYPOGRAPHY_FONT_OPTIONS: TypographyFontOption[] = [
  TYPOGRAPHY_SITE_FONT,
  ...TYPOGRAPHY_FONT_GROUPS.flatMap((group) => group.fonts),
]

export const TYPOGRAPHY_GOOGLE_FONTS_HREF =
  "https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Barlow:wght@400;500;600;700&family=Bebas+Neue&family=Caveat:wght@400;500;600;700&family=Cormorant+Garamond:wght@400;500;600;700&family=Crimson+Text:wght@400;600;700&family=Dancing+Script:wght@400;500;600;700&family=DM+Sans:wght@400;500;700&family=EB+Garamond:wght@400;500;600;700&family=Fira+Code:wght@300;400;500;600;700&family=Great+Vibes&family=IBM+Plex+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;700&family=Lato:wght@300;400;700;900&family=Libre+Baskerville:wght@400;700&family=Merriweather:wght@300;400;700;900&family=Nunito:wght@400;500;700;800&family=Open+Sans:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Outfit:wght@400;500;600;700;800&family=Pacifico&family=Playfair+Display:wght@400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Raleway:wght@400;500;600;700;800&family=Roboto:wght@400;500;700;900&family=Satisfy&family=Source+Code+Pro:wght@400;500;600;700&family=Source+Sans+Pro:wght@400;600;700&family=Space+Grotesk:wght@400;500;700&family=Syne:wght@400;500;600;700;800&display=swap"

