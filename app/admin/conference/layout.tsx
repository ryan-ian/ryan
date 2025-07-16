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
import { ChevronRight, Home } from "lucide-react"
import { PageTransition } from "@/components/ui/page-transition"

export default function ConferenceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  const getBreadcrumbs = () => {
    const segments = pathname.split("/").filter(Boolean)
    const breadcrumbs = []

    breadcrumbs.push({ label: "Admin", href: "/admin", icon: Home })

    if (segments.includes("conference")) {
      breadcrumbs.push({ label: "Conference", href: "/admin/conference" })

      if (segments.includes("users")) {
        breadcrumbs.push({ label: "Users", href: "/admin/conference/users" })
        
        // Check for user ID
        const userIdIndex = segments.indexOf("users") + 1
        if (segments[userIdIndex] && segments[userIdIndex] !== "new") {
          breadcrumbs.push({ 
            label: segments[userIdIndex], 
            href: `/admin/conference/users/${segments[userIdIndex]}` 
          })
          
          // Check for edit
          if (segments.includes("edit")) {
            breadcrumbs.push({ 
              label: "Edit", 
              href: `/admin/conference/users/${segments[userIdIndex]}/edit` 
            })
          }
        } else if (segments.includes("new")) {
          breadcrumbs.push({ label: "New User", href: "/admin/conference/users/new" })
        }
      } else if (segments.includes("rooms")) {
        breadcrumbs.push({ label: "Rooms", href: "/admin/conference/rooms" })
        
        // Check for room ID
        const roomIdIndex = segments.indexOf("rooms") + 1
        if (segments[roomIdIndex] && segments[roomIdIndex] !== "new") {
          breadcrumbs.push({ 
            label: segments[roomIdIndex], 
            href: `/admin/conference/rooms/${segments[roomIdIndex]}` 
          })
          
          // Check for edit
          if (segments.includes("edit")) {
            breadcrumbs.push({ 
              label: "Edit", 
              href: `/admin/conference/rooms/${segments[roomIdIndex]}/edit` 
            })
          }
        } else if (segments.includes("new")) {
          breadcrumbs.push({ label: "New Room", href: "/admin/conference/rooms/new" })
        }
      } else if (segments.includes("bookings")) {
        breadcrumbs.push({ label: "Bookings", href: "/admin/conference/bookings" })
      } else if (segments.includes("reports")) {
        breadcrumbs.push({ label: "Reports", href: "/admin/conference/reports" })
      } else if (segments.includes("settings")) {
        breadcrumbs.push({ label: "Settings", href: "/admin/conference/settings" })
      } else if (segments.includes("resources")) {
        breadcrumbs.push({ label: "Resources", href: "/admin/conference/resources" })
        
        // Check for resource ID
        const resourceIdIndex = segments.indexOf("resources") + 1
        if (segments[resourceIdIndex] && segments[resourceIdIndex] !== "new") {
          breadcrumbs.push({ 
            label: segments[resourceIdIndex], 
            href: `/admin/conference/resources/${segments[resourceIdIndex]}` 
          })
          
          // Check for edit
          if (segments.includes("edit")) {
            breadcrumbs.push({ 
              label: "Edit", 
              href: `/admin/conference/resources/${segments[resourceIdIndex]}/edit` 
            })
          }
        } else if (segments.includes("new")) {
          breadcrumbs.push({ label: "New Resource", href: "/admin/conference/resources/new" })
        }
      }
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs()

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="space-y-6">
        <div className="bg-white dark:bg-slate-950 p-4 rounded-lg shadow-sm border animate-fadeIn">
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbs.map((breadcrumb, index) => (
                <div key={breadcrumb.href} className="flex items-center">
                  {index > 0 && <BreadcrumbSeparator>
                    <ChevronRight className="h-4 w-4" />
                  </BreadcrumbSeparator>}
                  <BreadcrumbItem>
                    {index === breadcrumbs.length - 1 ? (
                      <BreadcrumbPage className="font-medium">{breadcrumb.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink href={breadcrumb.href} className="flex items-center gap-1">
                        {index === 0 && breadcrumb.icon && <breadcrumb.icon className="h-3.5 w-3.5" />}
                        {breadcrumb.label}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </div>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <PageTransition>
          {children}
        </PageTransition>
      </div>
    </ProtectedRoute>
  )
}
