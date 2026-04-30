"use client"

export const dynamic = "force-dynamic"
export const fetchCache = "force-no-store"

import AdminCMSPage from "@/components/admin/cms-page"

export default function EditorStudioPage() {
  return (
    <div className="h-screen overflow-hidden">
      <AdminCMSPage studioMode />
    </div>
  )
}
