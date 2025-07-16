"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Plus, TrendingUp, Building, CheckCircle, List, LayoutGrid } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import type { Room, Booking, BookingWithDetails } from "@/types"
import { useAuth } from "@/contexts/auth-context"

interface DashboardData {
  totalRooms: number
  availableRooms: number
  todayBookings: number
  upcomingBookings: number
  recentBookings: BookingWithDetails[]
  popularRooms: Room[]
}

async function fetchDashboardData(userId: string | undefined): Promise<DashboardData> {
  try {
    const [roomsRes] = await Promise.all([fetch("/api/rooms")])

    const roomsData = await roomsRes.json()

    // Normalize data - ensure we always have arrays
    const rooms = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []

    const availableRooms = rooms.filter((room: Room) => room.status === "available")

    // Get user's bookings if userId is available
    let userBookings: BookingWithDetails[] = []
    
    if (userId) {
      const token = localStorage.getItem("auth-token")
      const userBookingsRes = await fetch(`/api/bookings/user?user_id=${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      userBookings = await userBookingsRes.json()
    }

    // Calculate today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayBookings = userBookings.filter((booking) => {
      const bookingDate = new Date(booking.start_time)
      bookingDate.setHours(0, 0, 0, 0)
      return bookingDate.getTime() === today.getTime()
    })

    // Calculate upcoming bookings
    const upcomingBookings = userBookings.filter((booking) => {
      return new Date(booking.start_time) > today
    })

    // Get recent bookings from last 5 days (including today)
    const fiveDaysAgo = new Date()
    fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5)
    fiveDaysAgo.setHours(0, 0, 0, 0) // Set to beginning of the day 5 days ago

    const now = new Date()
    
    const recentBookings = userBookings
      .filter((booking) => {
        const createdDate = new Date(booking.created_at)
        // Include all bookings from beginning of 5 days ago until now (including today)
        return createdDate >= fiveDaysAgo && createdDate <= now
      })
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)

    // Get popular rooms (rooms with most bookings)
    const roomBookingCounts = rooms.map((room: Room) => ({
      ...room,
      bookingCount: userBookings.filter((booking) => booking.room_id === room.id).length,
    }))
    const popularRooms = roomBookingCounts.sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 4)

    return {
      totalRooms: rooms.length,
      availableRooms: availableRooms.length,
      todayBookings: todayBookings.length,
      upcomingBookings: upcomingBookings.length,
      recentBookings,
      popularRooms,
    }
  } catch (error) {
    console.error("Failed to fetch dashboard data:", error)
    return {
      totalRooms: 0,
      availableRooms: 0,
      todayBookings: 0,
      upcomingBookings: 0,
      recentBookings: [],
      popularRooms: [],
    }
  }
}

function StatCard({ title, value, icon, description, colorClass }: { title: string, value: number, icon: React.ReactNode, description: string, colorClass: string }) {
  return (
    <Card className="bg-card border-border/50 hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <div className={`text-${colorClass}`}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function ConferenceRoomBookingPage() {
  const { user } = useAuth()
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData(user?.id).then((data) => {
      setDashboardData(data)
      setLoading(false)
    })
  }, [user?.id])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6 space-y-8">
          <div className="flex items-center justify-between">
            <div className="animate-pulse">
              <div className="h-8 bg-muted-foreground/20 rounded w-64 mb-2"></div>
              <div className="h-4 bg-muted-foreground/20 rounded w-80"></div>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-28 bg-muted-foreground/10 rounded-lg"></div>
              </div>
            ))}
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="animate-pulse">
              <div className="h-80 bg-muted-foreground/10 rounded-lg"></div>
            </div>
            <div className="animate-pulse">
              <div className="h-80 bg-muted-foreground/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!dashboardData) {
    return (
      <ProtectedRoute>
        <div className="p-6 space-y-6">
          <div className="text-center py-16 bg-card rounded-lg border border-border/50">
            <h2 className="text-2xl font-semibold text-destructive">Error</h2>
            <p className="text-muted-foreground mt-2">Failed to load dashboard data. Please try again later.</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.name || 'User'}. Here's your booking summary.</p>
          </div>
          <div className="flex items-center gap-4">
            <Button asChild variant="outline">
              <Link href="/conference-room-booking/bookings" className="flex items-center gap-2">
                <List className="h-4 w-4" />
                <span>My Bookings</span>
              </Link>
            </Button>
          <Button asChild>
            <Link href="/conference-room-booking/rooms" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Book a Room</span>
            </Link>
          </Button>
        </div>
        </header>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Total Rooms" value={dashboardData.totalRooms} icon={<Building className="h-5 w-5" />} description="Available for booking" colorClass="primary" />
          <StatCard title="Available Now" value={dashboardData.availableRooms} icon={<CheckCircle className="h-5 w-5" />} description="Ready to book" colorClass="green-500" />
          <StatCard title="Today's Bookings" value={dashboardData.todayBookings} icon={<Calendar className="h-5 w-5" />} description="Scheduled for today" colorClass="primary" />
          <StatCard title="Upcoming" value={dashboardData.upcomingBookings} icon={<TrendingUp className="h-5 w-5" />} description="Future bookings" colorClass="primary" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
          {/* Recent Bookings */}
          <Card className="col-span-1 lg:col-span-3 bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Clock className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest bookings from the last 5 days.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking) => (
                  <Link 
                    href={`/conference-room-booking/bookings/${booking.id}`} 
                    key={booking.id} 
                    className="block p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span className="font-semibold text-foreground">{booking.rooms?.name || `Room ${booking.room_id}`}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                          <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                        </div>
                          <div className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                          <span>
                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                        </div>
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'} className="capitalize">
                        {booking.status}
                      </Badge>
                  </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No recent bookings found.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Popular Rooms */}
          <Card className="col-span-1 lg:col-span-2 bg-card border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <TrendingUp className="h-5 w-5" />
                <span>Popular Rooms</span>
              </CardTitle>
              <CardDescription>Most frequently booked rooms.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {dashboardData.popularRooms.length > 0 ? (
                dashboardData.popularRooms.map((room) => (
                  <Link 
                    href={`/conference-room-booking/rooms/${room.id}`}
                    key={room.id}
                    className="block p-4 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-foreground">{room.name}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Users className="h-4 w-4" />
                            <span>{room.capacity}</span>
                        </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-4 w-4" />
                            <span>{room.location}</span>
                      </div>
                        </div>
                      </div>
                      <Badge variant="secondary">{room.bookingCount} bookings</Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No popular rooms found.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}
