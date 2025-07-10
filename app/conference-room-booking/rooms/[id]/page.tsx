"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Building,
  Users,
  MapPin,
  Calendar,
  Clock,
  Wifi,
  Monitor,
  Coffee,
  Car,
  ArrowLeft,
  Phone,
  Mail,
} from "lucide-react"
import Link from "next/link"
import type { Room, Booking } from "@/types"

const amenityIcons = {
  wifi: Wifi,
  projector: Monitor,
  whiteboard: Monitor,
  coffee: Coffee,
  parking: Car,
}

export default function RoomDetailPage() {
  const params = useParams()
  const router = useRouter()
  const roomId = params.id as string

  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails()
      fetchRoomBookings()
    }
  }, [roomId])

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch("/api/rooms")
      const roomsData = await response.json()
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      const foundRoom = roomsArray.find((r: Room) => r.id === roomId)
      setRoom(foundRoom || null)
    } catch (error) {
      console.error("Failed to fetch room details:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomBookings = async () => {
    try {
      const response = await fetch("/api/bookings")
      const bookingsData = await response.json()
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []
      const roomBookings = bookingsArray.filter((b: Booking) => b.roomId === roomId)
      setBookings(roomBookings)
    } catch (error) {
      console.error("Failed to fetch room bookings:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "occupied":
        return "bg-red-100 text-red-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getUpcomingBookings = () => {
    const now = new Date()
    return bookings
      .filter((booking) => new Date(booking.startTime || booking.date) > now)
      .sort((a, b) => new Date(a.startTime || a.date).getTime() - new Date(b.startTime || b.date).getTime())
      .slice(0, 5)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <div className="h-64 bg-muted rounded"></div>
            </div>
            <div className="h-64 bg-muted rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => router.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Room not found</h3>
            <p className="text-muted-foreground mb-4">The room you're looking for doesn't exist or has been removed.</p>
            <Button asChild>
              <Link href="/conference-room-booking/rooms">Browse All Rooms</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const upcomingBookings = getUpcomingBookings()

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Building className="h-8 w-8" />
            {room.name}
          </h1>
          <p className="text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin className="h-4 w-4" />
            {room.location}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(room.status)} variant="secondary">
            {room.status}
          </Badge>
          {room.status === "available" && (
            <Button asChild>
              <Link
                href={`/conference-room-booking/bookings/new?roomId=${room.id}`}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Book This Room</span>
              </Link>
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Room Details */}
          <Card>
            <CardHeader>
              <CardTitle>Room Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">{room.capacity} people</p>
                  </div>
                </div>
                {room.hourlyRate && (
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Hourly Rate</p>
                      <p className="text-sm text-muted-foreground">${room.hourlyRate}/hour</p>
                    </div>
                  </div>
                )}
              </div>

              {room.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">{room.description}</p>
                  </div>
                </>
              )}

              {room.amenities && room.amenities.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-3">Amenities</h4>
                    <div className="grid gap-2 md:grid-cols-2">
                      {room.amenities.map((amenity) => {
                        const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons] || Monitor
                        return (
                          <div key={amenity} className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm capitalize">{amenity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Room Image/Gallery Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle>Room Gallery</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Building className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Room photos coming soon</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button asChild className="w-full" disabled={room.status !== "available"}>
                <Link
                  href={`/conference-room-booking/bookings/new?roomId=${room.id}`}
                  className="flex items-center gap-2"
                >
                  <Calendar className="h-4 w-4" />
                  <span>Book Now</span>
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/conference-room-booking/rooms" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  <span>Browse Other Rooms</span>
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Contact Information */}
          {(room.contactEmail || room.contactPhone) && (
            <Card>
              <CardHeader>
                <CardTitle>Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {room.contactEmail && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${room.contactEmail}`} className="text-sm hover:underline">
                      {room.contactEmail}
                    </a>
                  </div>
                )}
                {room.contactPhone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${room.contactPhone}`} className="text-sm hover:underline">
                      {room.contactPhone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upcoming Bookings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                <span>Upcoming Bookings</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {upcomingBookings.length > 0 ? (
                <div className="space-y-3">
                  {upcomingBookings.map((booking) => (
                    <div key={booking.id} className="p-3 border rounded-lg">
                      <div className="font-medium text-sm">{booking.title || "Meeting"}</div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {new Date(booking.startTime || booking.date).toLocaleDateString()} at{" "}
                        {booking.startTime
                          ? new Date(booking.startTime).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : booking.startTime}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming bookings</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
