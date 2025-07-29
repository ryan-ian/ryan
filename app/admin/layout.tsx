"use client"

import { UnifiedLayout } from "@/components/unified-layout"
import { AdminProtectedRoute } from "@/components/admin-protected-route"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <AdminProtectedRoute>
      <UnifiedLayout requireAuth={false}>
        {children}
      </UnifiedLayout>
    </AdminProtectedRoute>
  )
}
