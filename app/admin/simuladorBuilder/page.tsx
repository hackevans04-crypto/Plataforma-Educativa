import { Suspense } from "react"
import AdminSimulatorsPanel from "@/components/admin/simulators-panel"

export const dynamic = "force-dynamic"

export default function SimuladorBuilderPage() {
  return (
    <Suspense fallback={null}>
      <AdminSimulatorsPanel />
    </Suspense>
  )
}
