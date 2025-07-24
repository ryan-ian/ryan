"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, Home, Settings, Users, Building, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import { Button } from "@/components/ui/button"

const facilityManagerMenuItems = [
    {
      title: "Dashboard",
      url: "/facility-manager",
      icon: Home,
    },
    {
      title: "Bookings",
      url: "/facility-manager/bookings",
      icon: Calendar,
    },
    {
      title: "Rooms",
      url: "/facility-manager/rooms",
      icon: Building,
    },
    {
      title: "Resources",
      url: "/facility-manager/resources",
      icon: Settings,
    },
    {
      title: "Facility",
      url: "/facility-manager/facilities",
      icon: Building,
    },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const menuItems = user.role === "facility_manager" 
    ? facilityManagerMenuItems 
    : []

  return (
    <Sidebar>
      <SidebarHeader className="p-4" />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url} className="flex items-center gap-3">
                      <item.icon className="h-4 w-4 flex-shrink-0" />
                      <span className="leading-none">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center justify-between">
          <div className="text-sm min-w-0 flex-1">
            <div className="font-medium truncate">{user.name}</div>
            <div className="text-muted-foreground capitalize">{user.role}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={logout} className="flex-shrink-0 ml-2">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
