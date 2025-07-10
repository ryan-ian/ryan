"use client"

import { Calendar, Home, Settings, Users, Building, BarChart3, Shield, User, LogOut, Heart } from "lucide-react"
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
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { useAuth } from "@/contexts/auth-context"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"

const userMenuItems = [
  {
    title: "Dashboard",
    url: "/conference-room-booking",
    icon: Home,
  },
  {
    title: "Browse Rooms",
    url: "/conference-room-booking/rooms",
    icon: Building,
  },
  {
    title: "My Bookings",
    url: "/conference-room-booking/bookings",
    icon: Calendar,
  },
  {
    title: "Profile",
    url: "/conference-room-booking/profile",
    icon: User,
  },
]

const adminMenuItems = [
  {
    title: "Admin Portal",
    url: "/admin",
    icon: Shield,
  },
  {
    title: "Conference Dashboard",
    url: "/admin/conference",
    icon: Building,
  },
  {
    title: "User Management",
    url: "/admin/conference/users",
    icon: Users,
  },
  {
    title: "Room Management",
    url: "/admin/conference/rooms",
    icon: Building,
  },
  {
    title: "All Bookings",
    url: "/admin/conference/bookings",
    icon: Calendar,
  },
  {
    title: "Resources",
    url: "/admin/conference/resources",
    icon: Settings,
  },
  {
    title: "Reports",
    url: "/admin/conference/reports",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/admin/conference/settings",
    icon: Settings,
  },
  {
    title: "System Health",
    url: "/admin/health",
    icon: Heart,
  },
]

export function AppSidebar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  if (!user) return null

  const menuItems = user.role === "admin" ? adminMenuItems : userMenuItems

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <Building className="h-6 w-6 text-primary flex-shrink-0" />
          <span className="font-bold text-lg leading-none">Conference Hub</span>
        </div>
        <div className="text-sm text-muted-foreground mt-1">Welcome, {user.name}</div>
      </SidebarHeader>

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

        {user.role === "admin" && (
          <>
            <SidebarSeparator />
            <SidebarGroup>
              <SidebarGroupLabel>Quick Actions</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/conference/rooms/new" className="flex items-center gap-3">
                        <Building className="h-4 w-4 flex-shrink-0" />
                        <span className="leading-none">Add Room</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild>
                      <Link href="/admin/conference/users/new" className="flex items-center gap-3">
                        <Users className="h-4 w-4 flex-shrink-0" />
                        <span className="leading-none">Add User</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </>
        )}
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
