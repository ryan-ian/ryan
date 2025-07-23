"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"

export default function FacilityManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const showSidebar = true

  if (!showSidebar) {
    return <ProtectedRoute requiredRole="facility-manager">{children}</ProtectedRoute>
  }

  return (
    <ProtectedRoute requiredRole="facility_manager">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset className="bg-slate-50 dark:bg-slate-900">
          <Header />
          <main className="flex-1 overflow-auto">
            <div className="container py-6 md:py-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
} 