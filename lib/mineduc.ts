export type MineducOptionKey = "provincias" | "cantones" | "parroquias" | "instituciones"

export type MineducSelection = {
  provincia?: string
  canton?: string
  parroquia?: string
}

type MineducInstitucion = {
  nombre?: string
}

type MineducParroquia = {
  nombre?: string
  instituciones?: MineducInstitucion[]
}

type MineducCanton = {
  nombre?: string
  parroquias?: MineducParroquia[]
}

type MineducProvincia = {
  nombre?: string
  cantones?: MineducCanton[]
}

export interface MineducIndex {
  options: Record<MineducOptionKey, string[]>
  cantonesByProvincia: Record<string, string[]>
  parroquiasByProvinciaCanton: Record<string, string[]>
  parroquiasByCanton: Record<string, string[]>
  institucionesByProvinciaCantonParroquia: Record<string, string[]>
  institucionesByParroquia: Record<string, string[]>
}

type UniqueBucket = {
  list: string[]
  set: Set<string>
}

const KEY_SEPARATOR = "||"

let cachedIndex: MineducIndex | null = null
let loadingPromise: Promise<MineducIndex> | null = null

function createBucket(): UniqueBucket {
  return { list: [], set: new Set() }
}

function addUnique(bucket: UniqueBucket, value?: string) {
  const cleaned = value?.trim()
  if (!cleaned) return
  if (bucket.set.has(cleaned)) return
  bucket.set.add(cleaned)
  bucket.list.push(cleaned)
}

function addUniqueToMap(
  map: Record<string, UniqueBucket>,
  key: string,
  value?: string
) {
  const cleaned = value?.trim()
  if (!cleaned) return
  if (!map[key]) {
    map[key] = createBucket()
  }
  addUnique(map[key], cleaned)
}

function mapToPlain(map: Record<string, UniqueBucket>) {
  const output: Record<string, string[]> = {}
  Object.entries(map).forEach(([key, bucket]) => {
    output[key] = bucket.list
  })
  return output
}

function buildIndex(data: MineducProvincia[]): MineducIndex {
  const provincias = createBucket()
  const cantones = createBucket()
  const parroquias = createBucket()
  const instituciones = createBucket()

  const cantonesByProvincia: Record<string, UniqueBucket> = {}
  const parroquiasByProvinciaCanton: Record<string, UniqueBucket> = {}
  const parroquiasByCanton: Record<string, UniqueBucket> = {}
  const institucionesByProvinciaCantonParroquia: Record<string, UniqueBucket> = {}
  const institucionesByParroquia: Record<string, UniqueBucket> = {}

  data.forEach((provincia) => {
    const provinciaNombre = provincia.nombre?.trim()
    if (!provinciaNombre) return
    addUnique(provincias, provinciaNombre)

    provincia.cantones?.forEach((canton) => {
      const cantonNombre = canton.nombre?.trim()
      if (!cantonNombre) return
      addUnique(cantones, cantonNombre)
      addUniqueToMap(cantonesByProvincia, provinciaNombre, cantonNombre)

      canton.parroquias?.forEach((parroquia) => {
        const parroquiaNombre = parroquia.nombre?.trim()
        if (!parroquiaNombre) return
        addUnique(parroquias, parroquiaNombre)
        addUniqueToMap(
          parroquiasByProvinciaCanton,
          `${provinciaNombre}${KEY_SEPARATOR}${cantonNombre}`,
          parroquiaNombre
        )
        addUniqueToMap(parroquiasByCanton, cantonNombre, parroquiaNombre)

        parroquia.instituciones?.forEach((institucion) => {
          const institucionNombre = institucion.nombre?.trim()
          if (!institucionNombre) return
          addUnique(instituciones, institucionNombre)
          addUniqueToMap(
            institucionesByProvinciaCantonParroquia,
            `${provinciaNombre}${KEY_SEPARATOR}${cantonNombre}${KEY_SEPARATOR}${parroquiaNombre}`,
            institucionNombre
          )
          addUniqueToMap(institucionesByParroquia, parroquiaNombre, institucionNombre)
        })
      })
    })
  })

  return {
    options: {
      provincias: provincias.list,
      cantones: cantones.list,
      parroquias: parroquias.list,
      instituciones: instituciones.list,
    },
    cantonesByProvincia: mapToPlain(cantonesByProvincia),
    parroquiasByProvinciaCanton: mapToPlain(parroquiasByProvinciaCanton),
    parroquiasByCanton: mapToPlain(parroquiasByCanton),
    institucionesByProvinciaCantonParroquia: mapToPlain(institucionesByProvinciaCantonParroquia),
    institucionesByParroquia: mapToPlain(institucionesByParroquia),
  }
}

export async function loadMineducIndex(): Promise<MineducIndex> {
  if (cachedIndex) return cachedIndex
  if (loadingPromise) return loadingPromise

  loadingPromise = (async () => {
    try {
      const module = await import("@/mineduc_selectores.json")
      const data = (module.default || []) as MineducProvincia[]
      const index = buildIndex(data)
      cachedIndex = index
      return index
    } catch (error) {
      console.error("Error cargando datos de Mineduc:", error)
      loadingPromise = null // Permitir reintento
      return {
        options: { provincias: [], cantones: [], parroquias: [], instituciones: [] },
        cantonesByProvincia: {},
        parroquiasByProvinciaCanton: {},
        parroquiasByCanton: {},
        institucionesByProvinciaCantonParroquia: {},
        institucionesByParroquia: {},
      }
    }
  })()

  return loadingPromise
}

export function getMineducOptions(
  index: MineducIndex,
  key?: MineducOptionKey,
  selection: MineducSelection = {}
) {
  if (!key) return []
  const provincia = selection.provincia?.trim()
  const canton = selection.canton?.trim()
  const parroquia = selection.parroquia?.trim()

  if (key === "provincias") {
    return index.options.provincias
  }

  if (key === "cantones") {
    if (provincia) {
      return index.cantonesByProvincia[provincia] || []
    }
    return index.options.cantones
  }

  if (key === "parroquias") {
    if (provincia && canton) {
      return index.parroquiasByProvinciaCanton[`${provincia}${KEY_SEPARATOR}${canton}`] || []
    }
    if (canton) {
      return index.parroquiasByCanton[canton] || []
    }
    return index.options.parroquias
  }

  if (key === "instituciones") {
    if (provincia && canton && parroquia) {
      return (
        index.institucionesByProvinciaCantonParroquia[
          `${provincia}${KEY_SEPARATOR}${canton}${KEY_SEPARATOR}${parroquia}`
        ] || []
      )
    }
    if (parroquia) {
      return index.institucionesByParroquia[parroquia] || []
    }
    return index.options.instituciones
  }

  return []
}
