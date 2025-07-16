"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Building, 
  Menu, 
  X, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Calendar,
  LayoutDashboard,
  Clock,
  Users,
  BookOpen,
  Home,
  PanelLeft,
  MonitorPlay
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useState } from "react"
import { ThemeSwitcher } from "@/components/ui/ThemeSwitcher"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { ReactNode } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"

// Define the type for navigation items
interface NavItem {
  name: string;
  href: string;
  icon: ReactNode;
}

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(`${path}/`)
  }

  // Determine which section of the app we're in
  const isHome = pathname === "/"
  const isAdmin = pathname?.startsWith("/admin")
  const isBooking = pathname?.startsWith("/conference-room-booking")
  const isDisplays = pathname?.startsWith("/displays")
  
  // Determine if we should show the sidebar trigger
  const showSidebarTrigger = isAdmin || isBooking

  // Generate navigation items based on current section and user role
  const getNavItems = () => {
    // Base navigation that's always available
    const baseNav: NavItem[] = [
      {
        name: "Home",
        href: "/",
        icon: <Home className="h-4 w-4 mr-2" />,
      },
    ]

    // User-specific navigation
    const userNav: NavItem[] = user?.role === "user" ? [
      {
        name: "Room Booking",
        href: "/conference-room-booking",
        icon: <Calendar className="h-4 w-4 mr-2" />,
      },
    ] : []

    // Admin-specific navigation
    const adminNav: NavItem[] = user?.role === "admin" ? [
      {
        name: "Admin Dashboard",
        href: "/admin",
        icon: <LayoutDashboard className="h-4 w-4 mr-2" />,
      },
    ] : []

    // Context-specific navigation based on current section
    let contextNav: NavItem[] = []

    // If in booking section, show booking-specific navigation
    if (isBooking && user?.role === "user") {
      contextNav = []
    }

    // If in admin section, show admin-specific navigation
    if (isAdmin && user?.role === "admin") {
      contextNav = []
    }

    // If in displays section, show displays-specific navigation
    if (isDisplays) {
      contextNav = []  // Displays typically don't need navigation
    }

    // Combine all navigation items
    return [...baseNav, ...userNav, ...adminNav, ...contextNav]
  }

  const navItems = getNavItems()

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          {showSidebarTrigger && (
            <SidebarTrigger className={cn(
              "flex h-9 w-9 items-center justify-center rounded-md",
              isAdmin ? "-ml-2 hover:bg-slate-100 dark:hover:bg-slate-800" : "-ml-1"
            )} />
          )}
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">Conference Hub</span>
            {isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md ml-2">Admin</span>}
            {isDisplays && <span className="text-xs bg-secondary/20 text-secondary px-2 py-1 rounded-md ml-2">Display</span>}
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 ml-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center",
                  isActive(item.href) ? "text-primary" : "text-muted-foreground"
                )}
              >
                {item.icon}
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* Context-specific actions */}
          {isBooking && user?.role === "user" && (
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href="/conference-room-booking/bookings/new">
                <Calendar className="h-4 w-4 mr-2" />
                New Booking
              </Link>
            </Button>
          )}
          
          {/* {isAdmin && user?.role === "admin" && (
            <Button variant="outline" size="sm" asChild className="mr-2">
              <Link href="/admin/conference/settings">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Link>
            </Button>
          )} */}
          
          <ThemeSwitcher />
          
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <span className="hidden sm:inline-block font-medium">{user.name}</span>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.name}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground mt-1">{user.role === "admin" ? "Administrator" : "User"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/conference-room-booking/profile" className="cursor-pointer flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "admin" && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin/conference/settings" className="cursor-pointer flex w-full items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={logout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/user-login">Log in</Link>
              </Button>
              <Button size="sm" asChild>
                <Link href="/signup">Sign up</Link>
              </Button>
            </div>
          )}
          
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t">
          <div className="container py-4">
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded-md flex items-center",
                    isActive(item.href) ? "bg-primary/10 text-primary" : "text-muted-foreground"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.icon}
                  {item.name}
                </Link>
              ))}
              
              {/* Context-specific mobile actions */}
              {isBooking && user?.role === "user" && (
                <Link
                  href="/conference-room-booking/bookings/new"
                  className="flex items-center text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  New Booking
                </Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
} 