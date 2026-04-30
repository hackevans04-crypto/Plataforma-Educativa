export type CoursesHubVariant = "home" | "page"

export interface PublicCoursesHubContent {
  variant?: CoursesHubVariant
  badge?: string
  title?: string
  description?: string
  ctaLabel?: string
  ctaHref?: string
  footerEyebrow?: string
  footerTitle?: string
  emptyTitle?: string
  emptyDescription?: string
  noResultsTitle?: string
  noResultsDescription?: string
  totalStatLabel?: string
  totalStatDescription?: string
  paidStatLabel?: string
  paidStatDescription?: string
  freeStatLabel?: string
  freeStatDescription?: string
  categoriesStatLabel?: string
  searchPlaceholder?: string
  visibleCountLabel?: string
  heroChipOne?: string
  heroChipTwo?: string
  heroChipThree?: string
  highlightEyebrow?: string
  highlightTitle?: string
  highlightDescription?: string
  benefitOneTitle?: string
  benefitOneDescription?: string
  benefitTwoTitle?: string
  benefitTwoDescription?: string
  benefitThreeTitle?: string
  benefitThreeDescription?: string
  featuredEyebrow?: string
  featuredTitle?: string
  featuredDescription?: string
  categoryCtaLabel?: string
  categoryCountSuffix?: string
}

export const DEFAULT_PUBLIC_COURSES_HUB_CONTENT: PublicCoursesHubContent = {
  variant: "home",
  badge: "Cursos para docentes",
  title: "Cursos por categorias, listos para publicar desde tu admin",
  description:
    "El admin crea el curso, define si es gratis o de pago y lo publica para que aparezca ordenado en esta portada. Cuando el usuario quiera acceder, lo llevamos a su dashboard.",
  ctaLabel: "Ver catalogo completo",
  ctaHref: "/cursos",
  footerEyebrow: "Catalogo publico conectado",
  footerTitle: "Los cursos se organizan por categoria y el acceso se termina dentro del dashboard.",
  emptyTitle: "Aun no hay cursos publicados",
  emptyDescription:
    "Publica un curso desde el admin y activalo para la pagina principal. En cuanto lo hagas, aparecera aqui organizado por categorias.",
  noResultsTitle: "No encontramos cursos para ese filtro",
  noResultsDescription:
    "Prueba con otra categoria, cambia el filtro de precio o busca por una palabra distinta.",
  totalStatLabel: "Total",
  totalStatDescription: "Cursos visibles para estudiantes",
  paidStatLabel: "Premium",
  paidStatDescription: "Cursos de pago publicados",
  freeStatLabel: "Gratis",
  freeStatDescription: "Listos para matricula inmediata",
  categoriesStatLabel: "Categorias",
  searchPlaceholder: "Buscar por categoria, instructor, nivel o tema...",
  visibleCountLabel: "visibles",
  heroChipOne: "Categorias activas",
  heroChipTwo: "Catalogo conectado al dashboard",
  heroChipThree: "Filtros y acceso mas intuitivos",
  highlightEyebrow: "Experiencia mejorada",
  highlightTitle: "Explora, filtra y elige sin perder contexto",
  highlightDescription:
    "Organizamos el catalogo para que el contenido destacado, los cursos gratis y los cursos premium se entiendan desde el primer vistazo.",
  benefitOneTitle: "Contenido mejor estructurado",
  benefitOneDescription:
    "El catalogo separa con claridad cursos destacados, cursos gratuitos y categorias activas.",
  benefitTwoTitle: "Cursos con alta visibilidad",
  benefitTwoDescription:
    "Los cursos con mejor potencial aparecen primero para ayudar a convertir mejor desde portada.",
  benefitThreeTitle: "Acceso mas directo",
  benefitThreeDescription:
    "El usuario descubre el curso aqui y completa su acceso dentro del dashboard, sin pasos confusos.",
  featuredEyebrow: "Destacados",
  featuredTitle: "Cursos que convierten mejor en portada",
  featuredDescription:
    "Usa este bloque para mostrar primero lo mas relevante antes de pasar a categorias o resultados filtrados.",
  categoryCtaLabel: "Ver categoria",
  categoryCountSuffix: "cursos sugeridos en esta categoria",
}

export const DEFAULT_PUBLIC_COURSES_PAGE_CONTENT: PublicCoursesHubContent = {
  variant: "page",
  badge: "Catalogo de cursos",
  title: "Cursos curados para fortalecer tu perfil docente",
  description:
    "Descubre una oferta mas clara y profesional de cursos en pedagogia, herramientas digitales y areas clave para avanzar con criterio. Explora opciones gratuitas o premium y continua todo desde tu dashboard.",
  ctaLabel: "Ver catalogo completo",
  ctaHref: "/cursos",
  footerEyebrow: "Catalogo publico conectado",
  footerTitle: "El usuario descubre aqui, compara mejor y termina su acceso dentro del dashboard.",
  emptyTitle: "Aun no hay cursos publicados",
  emptyDescription:
    "Publica un curso desde el admin y activalo para la pagina principal. En cuanto lo hagas, aparecera aqui organizado por categorias.",
  noResultsTitle: "No encontramos cursos para ese filtro",
  noResultsDescription:
    "Prueba con otra categoria, cambia el filtro de precio o busca por una palabra distinta.",
  totalStatLabel: "Total",
  totalStatDescription: "Cursos visibles para estudiantes",
  paidStatLabel: "Premium",
  paidStatDescription: "Cursos de pago publicados",
  freeStatLabel: "Gratis",
  freeStatDescription: "Listos para matricula inmediata",
  categoriesStatLabel: "Categorias",
  searchPlaceholder: "Buscar por categoria, instructor, nivel o tema...",
  visibleCountLabel: "visibles",
  heroChipOne: "Categorias activas",
  heroChipTwo: "Catalogo conectado al dashboard",
  heroChipThree: "Filtros y acceso mas intuitivos",
  highlightEyebrow: "Experiencia mejorada",
  highlightTitle: "Explora, filtra y elige sin perder contexto",
  highlightDescription:
    "Organizamos el catalogo para que el contenido destacado, los cursos gratis y los cursos premium se entiendan desde el primer vistazo.",
  benefitOneTitle: "Contenido mejor estructurado",
  benefitOneDescription:
    "El catalogo separa con claridad cursos destacados, cursos gratuitos y categorias activas.",
  benefitTwoTitle: "Cursos con alta visibilidad",
  benefitTwoDescription:
    "Los cursos con mejor potencial aparecen primero para ayudar a convertir mejor desde portada.",
  benefitThreeTitle: "Acceso mas directo",
  benefitThreeDescription:
    "El usuario descubre el curso aqui y completa su acceso dentro del dashboard, sin pasos confusos.",
  featuredEyebrow: "Destacados",
  featuredTitle: "Cursos que convierten mejor en portada",
  featuredDescription:
    "Usa este bloque para mostrar primero lo mas relevante antes de pasar a categorias o resultados filtrados.",
  categoryCtaLabel: "Ver categoria",
  categoryCountSuffix: "cursos sugeridos en esta categoria",
}

export function mergePublicCoursesHubContent(
  variant: CoursesHubVariant,
  content?: Partial<PublicCoursesHubContent> | null
): PublicCoursesHubContent {
  return {
    ...(variant === "page" ? DEFAULT_PUBLIC_COURSES_PAGE_CONTENT : DEFAULT_PUBLIC_COURSES_HUB_CONTENT),
    ...(content ?? {}),
  }
}
