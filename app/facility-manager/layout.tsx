"use client"

import { UnifiedLayout } from "@/components/unified-layout"
import { FacilityManagerProtectedRoute } from "@/components/admin-protected-route"

export default function FacilityManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <FacilityManagerProtectedRoute>
      <UnifiedLayout requireAuth={false}>
        {children}
      </UnifiedLayout>
    </FacilityManagerProtectedRoute>
  )
} 