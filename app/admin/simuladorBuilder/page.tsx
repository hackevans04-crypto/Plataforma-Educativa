"use client"

import { Suspense } from "react"
import AdminSimulatorsPanel from "@/components/admin/simulators-panel"

export default function SimuladorBuilderPage() {
  return (
    <Suspense fallback={null}>
      <AdminSimulatorsPanel />
    </Suspense>
  )
}
