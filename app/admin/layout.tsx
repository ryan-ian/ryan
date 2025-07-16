"use client"

import type React from "react"
import { usePathname } from "next/navigation"

import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { ProtectedRoute } from "@/components/protected-route"
import { Header } from "@/components/header"

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
