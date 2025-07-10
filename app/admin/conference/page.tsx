"use client"

import { useAuth } from "@/contexts/auth-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Users, Building, Calendar, BarChart3, AlertTriangle, CheckCircle } from "lucide-react"
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
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
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
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conference Management Dashboard</h2>
        <p className="text-muted-foreground">Overview of your Conference Hub system</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRooms}</div>
            <p className="text-xs text-muted-foreground">
              {stats.availableRooms} available, {stats.maintenanceRooms} maintenance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.activeBookings} currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBookings}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild className="w-full justify-start">
              <Link href="/admin/conference/rooms/new">
                <Building className="mr-2 h-4 w-4" />
                Add New Room
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/conference/users">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/conference/bookings">
                <Calendar className="mr-2 h-4 w-4" />
                View All Bookings
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start bg-transparent">
              <Link href="/admin/conference/reports">
                <BarChart3 className="mr-2 h-4 w-4" />
                View Reports
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
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
