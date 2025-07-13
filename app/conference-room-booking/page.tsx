"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, MapPin, Users, Plus, TrendingUp, Building, CheckCircle } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import Link from "next/link"
import type { Room, Booking } from "@/types"

interface DashboardData {
  totalRooms: number
  availableRooms: number
  todayBookings: number
  upcomingBookings: number
  recentBookings: Booking[]
  popularRooms: Room[]
}

async function fetchDashboardData(): Promise<DashboardData> {
  try {
    const [bookingsRes, roomsRes] = await Promise.all([fetch("/api/bookings"), fetch("/api/rooms")])

    const bookingsData = await bookingsRes.json()
    const roomsData = await roomsRes.json()

    // Normalize data - ensure we always have arrays
    const bookings = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []
    const rooms = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []

    const today = new Date().toISOString().split("T")[0]
    const todayBookings = bookings.filter((booking: Booking) => booking.date === today)

    const upcomingBookings = bookings.filter((booking: Booking) => new Date(booking.date) > new Date())

    const availableRooms = rooms.filter((room: Room) => room.status === "available")

    // Get recent bookings (last 5)
    const recentBookings = bookings
      .sort(
        (a: Booking, b: Booking) =>
          new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime(),
      )
      .slice(0, 5)

    // Get popular rooms (rooms with most bookings)
    const roomBookingCounts = rooms.map((room: Room) => ({
      ...room,
      bookingCount: bookings.filter((booking: Booking) => booking.roomId === room.id).length,
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

export default function ConferenceRoomBookingPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData().then((data) => {
      setDashboardData(data)
      setLoading(false)
    })
  }, [])

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Conference Room Booking</h1>
              <p className="text-muted-foreground">Manage your meeting spaces efficiently</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">--</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!dashboardData) {
    return (
      <ProtectedRoute>
        <div className="space-y-6">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Failed to load dashboard data</p>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Conference Room Booking</h1>
            <p className="text-muted-foreground">Manage your meeting spaces efficiently</p>
          </div>
          <Button asChild>
            <Link href="/conference-room-booking/rooms" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              <span>Book a Room</span>
            </Link>
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
              <Building className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.totalRooms}</div>
              <p className="text-xs text-muted-foreground">Available for booking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Now</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.availableRooms}</div>
              <p className="text-xs text-muted-foreground">Ready to book</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.todayBookings}</div>
              <p className="text-xs text-muted-foreground">Scheduled for today</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dashboardData.upcomingBookings}</div>
              <p className="text-xs text-muted-foreground">Future bookings</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span>Recent Bookings</span>
              </CardTitle>
              <CardDescription>Your latest room reservations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.recentBookings.length > 0 ? (
                dashboardData.recentBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">Room {booking.roomId}</span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{booking.date}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          <span>
                            {booking.startTime} - {booking.endTime}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Badge variant={booking.status === "confirmed" ? "default" : "secondary"}>{booking.status}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No recent bookings</p>
              )}
            </CardContent>
          </Card>

          {/* Popular Rooms */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                <span>Popular Rooms</span>
              </CardTitle>
              <CardDescription>Most frequently booked spaces</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {dashboardData.popularRooms.length > 0 ? (
                dashboardData.popularRooms.map((room) => (
                  <div key={room.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {room.image ? (
                        <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                          <img 
                            src={room.image} 
                            alt={`${room.name} room`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-md bg-muted flex items-center justify-center flex-shrink-0">
                          <Building className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{room.name}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>Capacity: {room.capacity}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline">{(room as any).bookingCount || 0} bookings</Badge>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No room data available</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/conference-room-booking/rooms" className="flex flex-col items-center gap-2">
                  <Building className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Browse Rooms</div>
                    <div className="text-xs text-muted-foreground">Find available spaces</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/conference-room-booking/bookings" className="flex flex-col items-center gap-2">
                  <Calendar className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">My Bookings</div>
                    <div className="text-xs text-muted-foreground">Manage reservations</div>
                  </div>
                </Link>
              </Button>

              <Button asChild variant="outline" className="h-auto p-4 bg-transparent">
                <Link href="/conference-room-booking/profile" className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-medium">Profile</div>
                    <div className="text-xs text-muted-foreground">Account settings</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </ProtectedRoute>
  )
}
