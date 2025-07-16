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
        <SidebarInset className="bg-slate-50 dark:bg-slate-900">
          <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-white dark:bg-slate-950 px-6 sticky top-0 z-10 shadow-sm">
            <SidebarTrigger className="-ml-2 flex h-9 w-9 items-center justify-center rounded-md hover:bg-slate-100 dark:hover:bg-slate-800" />
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold tracking-tight">Admin Dashboard</h1>
            </div>
          </header>
          <main className="flex-1 overflow-auto">
            <div className="container py-6 md:py-8 max-w-7xl mx-auto">{children}</div>
          </main>
        </SidebarInset>
      </SidebarProvider>
    </ProtectedRoute>
  )
}
