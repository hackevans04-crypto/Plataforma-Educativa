import AdminSimulatorsPanel from "@/components/admin/simulators-panel"
import AdminCursosPage from "@/components/admin/admin-cursos-page"
import AdminCMSLauncherPage from "@/components/admin/cms-launcher-page"
import PagosPanel from "@/components/admin/pagos-panel"
import SoportePanel from "@/components/admin/soporte-panel"

export const dynamic = "force-dynamic"

const TITLES: Record<string, string> = {
  usuarios: "Usuarios",
  evaluaciones: "Evaluaciones",
  planes: "Accesos",
  reportes: "Reportes",
  configuracion: "Configuracion",
  notificaciones: "Notificaciones",
}

export default async function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>
}) {
  const { section } = await params

  if (section === "simuladores") {
    return <AdminSimulatorsPanel />
  }

  if (section === "cursos") {
    return <AdminCursosPage />
  }

  if (section === "landing" || section === "cms") {
    return <AdminCMSLauncherPage />
  }

  if (section === "pagos") {
    return <PagosPanel />
  }

  if (section === "soporte") {
    return <SoportePanel />
  }

  const title = section ? TITLES[section] || "Admin" : "Admin"

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl text-foreground">{title}</h1>
      <p className="text-muted-foreground">
        Esta seccion esta conectada al panel admin y comparte el mismo estilo del dashboard.
      </p>
      <div className="rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        Contenido en construccion.
      </div>
    </div>
  )
}
