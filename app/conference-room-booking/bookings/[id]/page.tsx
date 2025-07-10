"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Building,
  Users,
  MapPin,
  Calendar,
  Clock,
  ArrowLeft,
  Edit,
  Trash2,
  Mail,
  Phone,
  User,
  FileText,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import { useToast } from "@/hooks/use-toast"
import type { Booking, Room, User as UserType } from "@/types"

export default function BookingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { toast } = useToast()
  const bookingId = params.id as string

  const [booking, setBooking] = useState<Booking | null>(null)
  const [room, setRoom] = useState<Room | null>(null)
  const [bookedBy, setBookedBy] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails()
    }
  }, [bookingId])

  const fetchBookingDetails = async () => {
    try {
      const [bookingsResponse, roomsResponse, usersResponse] = await Promise.all([
        fetch("/api/bookings"),
        fetch("/api/rooms"),
        fetch("/api/users"),
      ])

      const bookingsData = await bookingsResponse.json()
      const roomsData = await roomsResponse.json()
      const usersData = await usersResponse.json()

      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      const usersArray = Array.isArray(usersData) ? usersData : usersData.users || []

      const foundBooking = bookingsArray.find((b: Booking) => b.id === bookingId)

      if (foundBooking) {
        setBooking(foundBooking)

        // Find associated room
        const associatedRoom = roomsArray.find((r: Room) => r.id === foundBooking.roomId)
        setRoom(associatedRoom || null)

        // Find user who made the booking
        const bookingUser = usersArray.find((u: UserType) => u.id === foundBooking.userId)
        setBookedBy(bookingUser || null)
      }
    } catch (error) {
      console.error("Failed to fetch booking details:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleCancelBooking = async () => {
    if (!booking) return

    try {
      // Here you would typically make an API call to cancel the booking
      toast({
        title: "Booking Cancelled",
        description: "Your booking has been successfully cancelled.",
      })

      // Update local state
      setBooking({ ...booking, status: "cancelled" })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    }
  }

  const canEditBooking = () => {
    if (!booking || !user) return false
    return booking.userId === user.id && (booking.status === "pending" || booking.status === "confirmed")
  }

  const canCancelBooking = () => {
    if (!booking || !user) return false
    return booking.userId === user.id && (booking.status === "pending" || booking.status === "confirmed")
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

  if (!booking) {
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
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Booking not found</h3>
            <p className="text-muted-foreground mb-4">
              The booking you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/conference-room-booking/bookings">View All Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

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
            <Calendar className="h-8 w-8" />
            {booking.title || "Meeting"}
          </h1>
          <p className="text-muted-foreground mt-1">Booking ID: {booking.id}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge className={getStatusColor(booking.status)} variant="secondary">
            {booking.status}
          </Badge>
          {canEditBooking() && (
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {canCancelBooking() && (
            <Button variant="outline" size="sm" onClick={handleCancelBooking}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Booking Details */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(booking.date || booking.startTime).toLocaleDateString("en-US", {
                        weekday: "long",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {booking.startTime
                        ? new Date(booking.startTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : booking.startTime}{" "}
                      -{" "}
                      {booking.endTime
                        ? new Date(booking.endTime).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : booking.endTime}
                    </p>
                  </div>
                </div>
              </div>

              {booking.description && (
                <>
                  <Separator />
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </h4>
                    <p className="text-sm text-muted-foreground">{booking.description}</p>
                  </div>
                </>
              )}

              {booking.attendees && booking.attendees > 0 && (
                <>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">Expected Attendees</p>
                      <p className="text-sm text-muted-foreground">{booking.attendees} people</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Room Information */}
          {room && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Room Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-lg">{room.name}</h3>
                    <p className="text-muted-foreground flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {room.location}
                    </p>
                  </div>
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/conference-room-booking/rooms/${room.id}`}>View Room Details</Link>
                  </Button>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Capacity: {room.capacity} people</span>
                  </div>
                  {room.hourlyRate && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">Rate: ${room.hourlyRate}/hour</span>
                    </div>
                  )}
                </div>

                {room.amenities && room.amenities.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Available Amenities</h4>
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {canEditBooking() && (
                <Button className="w-full bg-transparent" variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Booking
                </Button>
              )}
              {canCancelBooking() && (
                <Button className="w-full bg-transparent" variant="outline" onClick={handleCancelBooking}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Booking
                </Button>
              )}
              <Button asChild variant="outline" className="w-full bg-transparent">
                <Link href="/conference-room-booking/bookings">
                  <Calendar className="h-4 w-4 mr-2" />
                  View All Bookings
                </Link>
              </Button>
              {room && (
                <Button asChild variant="outline" className="w-full bg-transparent">
                  <Link href={`/conference-room-booking/rooms/${room.id}`}>
                    <Building className="h-4 w-4 mr-2" />
                    View Room Details
                  </Link>
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Booking Information */}
          <Card>
            <CardHeader>
              <CardTitle>Booking Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className={getStatusColor(booking.status)} variant="secondary">
                    {booking.status}
                  </Badge>
                </div>
              </div>
              <div className="text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created:</span>
                  <span>{new Date(booking.createdAt || booking.date).toLocaleDateString()}</span>
                </div>
              </div>
              {booking.updatedAt && (
                <div className="text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Updated:</span>
                    <span>{new Date(booking.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Booked By */}
          {bookedBy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Booked By
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={bookedBy.avatar || "/placeholder.svg"} alt={bookedBy.name} />
                    <AvatarFallback>
                      {bookedBy.name
                        ?.split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{bookedBy.name}</p>
                    <p className="text-sm text-muted-foreground capitalize">{bookedBy.role}</p>
                  </div>
                </div>
                {bookedBy.email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <a href={`mailto:${bookedBy.email}`} className="text-sm hover:underline">
                      {bookedBy.email}
                    </a>
                  </div>
                )}
                {bookedBy.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <a href={`tel:${bookedBy.phone}`} className="text-sm hover:underline">
                      {bookedBy.phone}
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
