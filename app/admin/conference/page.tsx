"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Users, 
  Building, 
  Calendar, 
  BarChart3, 
  AlertTriangle, 
  CheckCircle, 
  ArrowRight, 
  ArrowUpRight, 
  Clock,
  Layers,
  Activity,
  Package,
  Settings,
  PlusCircle
} from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import type { User, Room, Booking } from "@/types"

export default function ConferenceDashboard() {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalBookings: 0,
    activeBookings: 0,
    availableRooms: 0,
    maintenanceRooms: 0,
    pendingBookings: 0,
    todayBookings: 0,
  })
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [usersRes, roomsRes, bookingsRes] = await Promise.all([
          fetch("/api/users", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            },
          }),
          fetch("/api/rooms"),
          fetch("/api/bookings", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            },
          }),
        ])

        const users: User[] = await usersRes.json()
        const rooms: Room[] = await roomsRes.json()
        const bookings: Booking[] = await bookingsRes.json()

        const now = new Date()
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const tomorrow = new Date(today)
        tomorrow.setDate(tomorrow.getDate() + 1)

        const activeBookings = bookings.filter(
          (b) => new Date(b.startTime) <= now && new Date(b.endTime) > now && b.status === "confirmed",
        )

        const todayBookings = bookings.filter((b) => {
          const bookingDate = new Date(b.startTime)
          return bookingDate >= today && bookingDate < tomorrow
        })

        const pendingBookings = bookings.filter((b) => b.status === "pending")
        const availableRooms = rooms.filter((r) => r.status === "available")
        const maintenanceRooms = rooms.filter((r) => r.status === "maintenance")

        setStats({
          totalUsers: users.length,
          totalRooms: rooms.length,
          totalBookings: bookings.length,
          activeBookings: activeBookings.length,
          availableRooms: availableRooms.length,
          maintenanceRooms: maintenanceRooms.length,
          pendingBookings: pendingBookings.length,
          todayBookings: todayBookings.length,
        })

        // Create recent activity feed
        const activities = [
          ...bookings.slice(-5).map((b) => ({
            type: "booking",
            message: `New booking: ${b.title}`,
            time: b.createdAt,
            status: b.status,
          })),
          ...users.slice(-3).map((u) => ({
            type: "user",
            message: `New user registered: ${u.name}`,
            time: u.dateCreated,
            status: "active",
          })),
        ]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 8)

        setRecentActivity(activities)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col gap-3">
          <div className="h-8 bg-muted rounded-lg w-1/3 animate-pulse" />
          <div className="h-4 bg-muted rounded-lg w-1/4 animate-pulse" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <div className="h-2 bg-primary/10 w-full" />
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-12 animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight mb-2">Conference Management Dashboard</h2>
        <p className="text-muted-foreground">Welcome back, {user?.name}. Here's an overview of your Conference Hub system.</p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-blue-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered system users</p>
          </CardContent>
          <CardFooter className="pt-0 pb-3 px-6">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20">
              <Link href="/admin/conference/users">
                View all users
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-green-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conference Rooms</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <Building className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <div className="flex items-center gap-3 mt-1">
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600 dark:text-green-400 font-medium">{stats.availableRooms}</span> available
              </p>
              <p className="text-xs text-muted-foreground">
                <span className="text-red-600 dark:text-red-400 font-medium">{stats.maintenanceRooms}</span> maintenance
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 px-6">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1 text-green-600 dark:text-green-400 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-900/20">
              <Link href="/admin/conference/rooms">
                View all rooms
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-purple-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Calendar className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <div className="flex items-center gap-1 mt-1">
              <Clock className="h-3 w-3 text-purple-600 dark:text-purple-400" />
              <p className="text-xs text-muted-foreground">
                <span className="text-purple-600 dark:text-purple-400 font-medium">{stats.activeBookings}</span> currently active
              </p>
            </div>
          </CardContent>
          <CardFooter className="pt-0 pb-3 px-6">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/20">
              <Link href="/admin/conference/bookings">
                View all bookings
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
              Require your attention
            </p>
          </CardContent>
          <CardFooter className="pt-0 pb-3 px-6">
            <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs gap-1 text-amber-600 dark:text-amber-400 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Link href="/admin/conference/bookings">
                Review pending
                <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3 lg:grid-cols-4">
        <Card className="md:col-span-1 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-3">
              <Button asChild className="justify-start h-auto py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600">
                <Link href="/admin/conference/rooms/new" className="flex items-center">
                  <div className="p-2 bg-white/20 rounded-md mr-3">
                    <Building className="h-4 w-4 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium leading-none">Add New Room</div>
                    <div className="text-xs text-white/80 mt-1">Create conference room</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto py-3 bg-white dark:bg-slate-950">
                <Link href="/admin/conference/resources/new" className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-md mr-3">
                    <Package className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium leading-none">Add Resource</div>
                    <div className="text-xs text-muted-foreground mt-1">Create new resource</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto py-3 bg-white dark:bg-slate-950">
                <Link href="/admin/conference/users" className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-md mr-3">
                    <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium leading-none">Manage Users</div>
                    <div className="text-xs text-muted-foreground mt-1">View and edit users</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto py-3 bg-white dark:bg-slate-950">
                <Link href="/admin/conference/reports" className="flex items-center">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-md mr-3">
                    <BarChart3 className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium leading-none">View Reports</div>
                    <div className="text-xs text-muted-foreground mt-1">Analytics & statistics</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Recent Activity</CardTitle>
                <CardDescription>Latest system activities</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="gap-1 text-xs">
                View all
                <ArrowUpRight className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-3">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                    <div
                      className={`p-1 rounded-full ${
                        activity.type === "booking" ? "bg-blue-100 text-blue-600" : "bg-green-100 text-green-600"
                      }`}
                    >
                      {activity.type === "booking" ? <Calendar className="h-3 w-3" /> : <Users className="h-3 w-3" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.time).toLocaleDateString()} at{" "}
                        {new Date(activity.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        activity.status === "confirmed" || activity.status === "active"
                          ? "bg-green-100 text-green-800"
                          : activity.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {activity.status}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Database</span>
                <span className="text-sm text-green-600">Online</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">API Services</span>
                <span className="text-sm text-green-600">Running</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Email Service</span>
                <span className="text-sm text-green-600">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Room Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Available</span>
                <span className="text-sm font-medium">{stats.availableRooms}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">In Use</span>
                <span className="text-sm font-medium">{stats.activeBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Maintenance</span>
                <span className="text-sm font-medium">{stats.maintenanceRooms}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Booking Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Total Bookings</span>
                <span className="text-sm font-medium">{stats.totalBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Today</span>
                <span className="text-sm font-medium">{stats.todayBookings}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Pending</span>
                <span className="text-sm font-medium">{stats.pendingBookings}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
