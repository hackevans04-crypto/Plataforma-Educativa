export type CampoTipo =
  | "text" | "email" | "tel" | "number" | "date" | "textarea"
  | "select" | "radio" | "checkbox" | "range"
  | "divider" | "heading"

export interface CampoBuilder {
  id: string
  type: CampoTipo
  label: string
  name: string
  required: boolean
  placeholder?: string
  options?: string[]
  optionsSource?: "mineduc"
  optionsKey?: "provincias" | "cantones" | "parroquias" | "instituciones"
  helperText?: string
  min?: string
  max?: string
  step?: string
  icon?: string
  cols?: 1 | 2
}

export type PreguntaTipo = "opcion_multiple" | "verdadero_falso" | "completar"

export interface PreguntaBuilder {
  id: string
  tipo?: PreguntaTipo
  pregunta: string
  contexto?: string
  imagen?: string
  opciones: string[]
  respuesta: number
  explicacion?: string
  categoria?: string
  tema?: string
  dificultad?: "basico" | "intermedio" | "avanzado"
  anio?: number
  institucion?: string
}

export type EstadoSimulador = "borrador" | "en_revision" | "publicado" | "archivado"

export interface TemaSimulador {
  colorPrimario?: string
  colorSecundario?: string
  colorFondo?: string
  colorTexto?: string
  borderRadius?: "suave" | "cuadrado" | "pill"
  estiloCard?: "elevado" | "plano" | "borde"
  mostrarProgreso?: boolean
  animaciones?: boolean
  oscuro?: boolean
}

export interface CertificadoConfig {
  habilitado: boolean
  titulo?: string
  subtitulo?: string
  umbralAprobacion?: number
  textoPie?: string
}

export interface ConfigSimulador {
  tiempoPregunta: number
  preguntasMax: number
  retroalimentacion?: boolean
  revisionFinal?: boolean
  modoIA?: boolean
  detectarDuplicadas?: boolean
  intentosMax?: number
  cooldownMinutos?: number
  ordenAleatorioPeguntas?: boolean
  ordenAleatorioOpciones?: boolean
  mostrarNumeroPregunta?: boolean
  permitirNavegacion?: boolean
  pasarSinResponder?: boolean
  mostrarTemporizador?: boolean
  umbralAprobacion?: number
  mensajeAprobado?: string
  mensajeReprobado?: string
}

export interface SimuladorBuilder {
  id: string
  titulo: string
  descripcion: string
  subtitulo?: string
  categoria?: string
  cursoId?: string
  cursoTitulo?: string
  cursoIds?: string[]
  cursoTitulos?: string[]
  tags?: string[]
  icono?: string
  estado: EstadoSimulador
  publicarEnPaginaPrincipal?: boolean
  contentMode?: "html" | "quiz"
  htmlContent?: string
  htmlImportName?: string
  config: ConfigSimulador
  formulario: CampoBuilder[]
  preguntas: PreguntaBuilder[]
  formMode: "perfil" | "personalizado" | "ninguno"
  tema?: TemaSimulador
  certificado?: CertificadoConfig
  instrucciones?: string
  createdAt?: string
  updatedAt?: string
}
