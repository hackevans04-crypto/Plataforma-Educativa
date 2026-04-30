export function mapearSimuladorParaPreview(simulador) {
  if (simulador.contentMode === "html" && String(simulador.htmlContent || "").trim()) {
    return {
      id: simulador.id,
      titulo: simulador.titulo,
      descripcion: simulador.descripcion,
      estado: simulador.estado || "borrador",
      contentMode: "html",
      htmlContent: simulador.htmlContent,
      configuracion: {
        tiempoPorPregunta: simulador.config?.tiempoPregunta || 60,
        preguntasMaximas: simulador.config?.preguntasMax || 0,
        retroalimentacion: simulador.config?.retroalimentacion ?? true,
        revisionFinal: simulador.config?.revisionFinal ?? true,
      },
    }
  }

  const preguntas = simulador.preguntas.map((pregunta, index) => ({
    id: pregunta.id || `q_${index}`,
    prompt: pregunta.pregunta,
    options: pregunta.opciones.map((texto, optIndex) => ({
      id: `${optIndex}`,
      text: texto || `Opcion ${optIndex + 1}`,
    })),
    correctOptionId:
      typeof pregunta.respuesta === "number" ? `${pregunta.respuesta}` : undefined,
  }))

  return {
    id: simulador.id,
    titulo: simulador.titulo,
    descripcion: simulador.descripcion,
    estado: simulador.estado || "borrador",
    contentMode: simulador.contentMode || "quiz",
    formularioInicial: {
      mode: simulador.formMode || "personalizado",
      sections: [
        {
          id: "datos",
          title: simulador.formMode === "perfil" ? "Perfil del usuario" : "Datos del participante",
          fields: simulador.formulario.map((campo) => ({
            id: campo.id,
            label: campo.label,
            type: campo.type === "text" ? "text" : "select",
            options: campo.options,
            placeholder: campo.label,
            required: campo.required,
          })),
        },
      ],
    },
    preguntas,
    configuracion: {
      tiempoPorPregunta: simulador.config?.tiempoPregunta || 60,
      preguntasMaximas: simulador.config?.preguntasMax || preguntas.length,
      retroalimentacion: simulador.config?.retroalimentacion ?? true,
      revisionFinal: simulador.config?.revisionFinal ?? true,
    },
  }
}
