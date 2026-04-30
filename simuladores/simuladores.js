export function crearSimuladorBase() {
  const stamp = Date.now()
  return {
    id: `sim_${stamp}`,
    titulo: "Simulador Pedagogico",
    descripcion: "Preparacion docente",
    categoria: "",
    estado: "borrador",
    publicarEnPaginaPrincipal: true,
    contentMode: "html",
    htmlContent: "",
    htmlImportName: "",
    config: {
      tiempoPregunta: 60,
      preguntasMax: 120,
      retroalimentacion: true,
      revisionFinal: true,
      modoIA: false,
      detectarDuplicadas: true,
      intentosMax: 3,
      cooldownMinutos: 30,
    },
    formulario: [],
    preguntas: [],
    formMode: "personalizado",
  }
}

export function calcularErrores(simulador) {
  if (simulador.contentMode === "html") {
    const htmlVacio = !String(simulador.htmlContent || "").trim()
    return {
      camposInvalidos: 0,
      preguntasInvalidas: htmlVacio ? 1 : 0,
    }
  }

  const camposInvalidos = simulador.formulario.filter(
    (campo) => !campo.label || !campo.name
  )
  const preguntasInvalidas = simulador.preguntas.filter(
    (pregunta) =>
      !pregunta.pregunta ||
      pregunta.opciones.filter((opcion) => opcion && opcion.trim()).length < 2
  )

  return {
    camposInvalidos: camposInvalidos.length,
    preguntasInvalidas: preguntasInvalidas.length,
  }
}
