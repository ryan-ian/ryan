"use client"

import type React from "react"

import { ProtectedRoute } from "@/components/protected-route"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { usePathname } from "next/navigation"

export default function ConferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    breadcrumbs.push({ label: "Admin", href: "/admin" })

    if (segments.includes("conference")) {
      breadcrumbs.push({ label: "Conference", href: "/admin/conference" })

      if (segments.includes("users")) {
        breadcrumbs.push({ label: "Users", href: "/admin/conference/users" })
      } else if (segments.includes("rooms")) {
        breadcrumbs.push({ label: "Rooms", href: "/admin/conference/rooms" })
      } else if (segments.includes("bookings")) {
        breadcrumbs.push({ label: "Bookings", href: "/admin/conference/bookings" })
      } else if (segments.includes("reports")) {
        breadcrumbs.push({ label: "Reports", href: "/admin/conference/reports" })
      } else if (segments.includes("settings")) {
        breadcrumbs.push({ label: "Settings", href: "/admin/conference/settings" })
      } else if (segments.includes("resources")) {
        breadcrumbs.push({ label: "Resources", href: "/admin/conference/resources" })
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={breadcrumb.href} className="flex items-center">
                {index > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {index === breadcrumbs.length - 1 ? (
                    <BreadcrumbPage>{breadcrumb.label}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink href={breadcrumb.href}>{breadcrumb.label}</BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </div>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
        {children}
      </div>
    </ProtectedRoute>
  )
}
