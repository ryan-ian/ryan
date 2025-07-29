"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Building, 
  User, 
  LogOut, 
  Settings, 
  ChevronDown,
  Calendar,
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
import { NotificationBell } from "@/components/ui/notification-bell"
import { getRoleFromPathname } from "@/lib/navigation-config"

export function Header() {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // Determine which section of the app we're in
  const currentRole = getRoleFromPathname(pathname || '')
  const isAdmin = currentRole === 'admin'
  const isFacilityManager = currentRole === 'facility_manager'
  const isUser = currentRole === 'user'
  
  // Function to get user role display text
  const getUserRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrator';
      case 'facility_manager':
        return 'Facility Manager';
      case 'user':
      default:
        return 'User';
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Building className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg hidden sm:inline-block">Conference Hub</span>
            {isAdmin && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md ml-2">Admin</span>}
            {isFacilityManager && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md ml-2">Facility Manager</span>}
            {isUser && <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded-md ml-2">User</span>}
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          
          {user && <NotificationBell />}
          
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
                    <p className="text-xs leading-none text-muted-foreground mt-1">{getUserRoleDisplay(user.role)}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/conference-room-booking/profile" className="cursor-pointer flex w-full items-center">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                {user.role === "user" && (
                  <DropdownMenuItem asChild>
                    <Link href="/conference-room-booking/bookings" className="cursor-pointer flex w-full items-center">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>My Bookings</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                {user.role === "facility_manager" && (
                  <DropdownMenuItem asChild>
                    <Link href="/facility-manager" className="cursor-pointer flex w-full items-center">
                      <Building className="mr-2 h-4 w-4" />
                      <span>Facility Dashboard</span>
                    </Link>
                  </DropdownMenuItem>
                )}
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
        </div>
      </div>
    </header>
  )
} 