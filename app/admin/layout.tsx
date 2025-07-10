"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Show sidebar for all admin routes except the main /admin page
  const showSidebar = pathname !== "/admin"

  if (!showSidebar) {
    return <ProtectedRoute requiredRole="admin">{children}</ProtectedRoute>
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
            <SidebarTrigger className="-ml-1" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold">Admin Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 p-6">{children}</main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
