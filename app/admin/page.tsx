"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Building, Heart, ArrowRight, Shield, User, LogOut } from "lucide-react"
import Link from "next/link"

export default function AdminLandingPage() {
  const { user, logout } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 sticky top-0 z-10">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Building className="h-6 w-6 text-primary flex-shrink-0" />
              </div>
              <div>
                <h1 className="text-xl font-bold leading-none">Conference Hub</h1>
                <p className="text-sm text-muted-foreground">Admin Portal</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-3 text-sm">
                <User className="h-4 w-4 flex-shrink-0" />
                <div>
                  <div className="font-medium leading-none">{user?.name}</div>
                  <div className="text-muted-foreground capitalize">{user?.role}</div>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={logout} className="flex items-center gap-2 bg-transparent">
                <LogOut className="h-4 w-4 flex-shrink-0" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Welcome to Admin Portal</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Choose an administrative area to manage. Select from the available management systems below.
            </p>
          </div>

          {/* Management Cards */}
          <div className="grid gap-6 lg:gap-8 md:grid-cols-2 max-w-5xl mx-auto">
            {/* Conference Room Booking Card */}
            <Card className="hover:shadow-xl transition-all duration-300 cursor-pointer group border-2 hover:border-primary/20 bg-white dark:bg-slate-900">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
                    <Building className="h-8 w-8 text-primary flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2 group-hover:text-primary transition-colors">
                      Conference Room Booking
                    </CardTitle>
                    <CardDescription className="text-base leading-relaxed">
                      Comprehensive management system for conference rooms, bookings, and user access control
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Management Features
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm font-medium leading-none">Room & Resource Management</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm font-medium leading-none">User Administration</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm font-medium leading-none">Booking Oversight</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                      <span className="text-sm font-medium leading-none">Analytics & Reports</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button asChild size="lg" className="w-full group-hover:bg-primary/90 transition-colors text-base">
                    <Link href="/admin/conference" className="flex items-center justify-center gap-2">
                      Access Conference Management
                      <ArrowRight className="h-5 w-5 flex-shrink-0 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Health Management Card */}
            <Card className="hover:shadow-lg transition-all duration-300 border-2 bg-white dark:bg-slate-900 opacity-90">
              <CardHeader className="pb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-red-50 dark:bg-red-950 rounded-xl">
                    <Heart className="h-8 w-8 text-red-600 flex-shrink-0" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <CardTitle className="text-2xl">Health Management</CardTitle>
                      <Badge variant="secondary" className="text-xs font-medium">
                        Coming Soon
                      </Badge>
                    </div>
                    <CardDescription className="text-base leading-relaxed">
                      Advanced workplace health initiatives monitoring and management system
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    Planned Capabilities
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      <span className="text-sm leading-none text-muted-foreground">Health Screening</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      <span className="text-sm leading-none text-muted-foreground">Wellness Programs</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      <span className="text-sm leading-none text-muted-foreground">Safety Compliance</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50/50 dark:bg-red-950/20">
                      <div className="w-2 h-2 bg-red-400 rounded-full flex-shrink-0" />
                      <span className="text-sm leading-none text-muted-foreground">Health Analytics</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <Button disabled size="lg" className="w-full text-base" variant="secondary">
                    <Shield className="h-5 w-5 mr-2 flex-shrink-0" />
                    Coming Soon
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* System Information */}
          <div className="mt-12 max-w-3xl mx-auto">
            <Card className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border-2">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary flex-shrink-0" />
                  <CardTitle className="text-xl">System Information</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-6 sm:grid-cols-3">
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide mb-2">
                      Current Role
                    </p>
                    <p className="text-lg font-medium capitalize">{user?.role}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide mb-2">
                      Department
                    </p>
                    <p className="text-lg font-medium">{user?.department || "Administration"}</p>
                  </div>
                  <div className="text-center sm:text-left">
                    <p className="font-semibold text-muted-foreground text-sm uppercase tracking-wide mb-2">Position</p>
                    <p className="text-lg font-medium">{user?.position || "System Administrator"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
