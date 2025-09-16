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
import { ProtectedRoute } from "@/components/protected-route"

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
      const response = await fetch(`/api/bookings/${bookingId}`)
      if (!response.ok) throw new Error("Booking not found")
      
      const foundBooking: Booking = await response.json()
        setBooking(foundBooking)

      if (foundBooking.room_id) {
        const roomResponse = await fetch(`/api/rooms/${foundBooking.room_id}`)
        if (roomResponse.ok) {
          const roomData = await roomResponse.json()
          setRoom(roomData)
        }
      }

      if (foundBooking.user_id) {
        const userResponse = await fetch(`/api/users/${foundBooking.user_id}`)
        if (userResponse.ok) {
          const userData = await userResponse.json()
          setBookedBy(userData)
        }
      }
    } catch (error) {
      console.error("Failed to fetch booking details:", error)
      toast({
        title: "Error",
        description: "Could not fetch booking details.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "confirmed":
        return <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20 capitalize">{status}</Badge>
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20 capitalize">{status}</Badge>
      case "cancelled":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20 capitalize">{status}</Badge>
      default:
        return <Badge variant="outline" className="capitalize">{status}</Badge>
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

  const canEditOrCancel = () => {
    if (!booking || !user) return false
    // Paid bookings cannot be edited to maintain payment consistency
    if (booking.payment_status === 'paid') return false
    return user.role === 'admin' || (booking.user_id === user.id && booking.status !== "cancelled");
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-6 space-y-8">
          <div className="animate-pulse">
            <div className="h-6 w-24 bg-muted-foreground/10 rounded-md mb-6"></div>
            <div className="h-10 bg-muted-foreground/20 rounded w-2/3 mb-2"></div>
            <div className="h-6 bg-muted-foreground/20 rounded w-1/3"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2 space-y-8">
              <div className="h-48 bg-muted-foreground/10 rounded-lg"></div>
        </div>
            <div className="space-y-8">
              <div className="h-64 bg-muted-foreground/10 rounded-lg"></div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  if (!booking) {
    return (
      <ProtectedRoute>
        <div className="p-6 space-y-6">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
          </Button>
        <Card>
            <CardContent className="text-center py-16">
              <Calendar className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground">Booking Not Found</h2>
              <p className="text-muted-foreground mt-2 mb-6">
              The booking you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/conference-room-booking/bookings">View All Bookings</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
      {/* Header */}
        <header>
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Bookings
        </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{booking.title || "Meeting"}</h1>
              <p className="text-lg text-muted-foreground mt-2">
                Booking ID: <span className="font-mono text-sm bg-muted p-1 rounded-md">{booking.id}</span>
              </p>
        </div>
            <div className="flex items-center gap-4 pt-2">
              {getStatusBadge(booking.status)}
              {canEditOrCancel() && (
                <>
                  <Button variant="outline" size="sm" disabled={booking.status === 'cancelled'}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
                  <Button variant="destructive" size="sm" onClick={handleCancelBooking} disabled={booking.status === 'cancelled'}>
              <Trash2 className="h-4 w-4 mr-2" />
              Cancel
            </Button>
                </>
          )}
        </div>
      </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
            <Card className="bg-card border-border/50">
            <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Booking Details</CardTitle>
            </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-start gap-4">
                    <Calendar className="h-6 w-6 text-muted-foreground mt-1" />
                  <div>
                      <p className="font-medium text-foreground">Date</p>
                      <p className="text-muted-foreground">
                        {new Date(booking.start_time).toLocaleDateString(undefined, {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                      })}
                    </p>
                  </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Clock className="h-6 w-6 text-muted-foreground mt-1" />
                    <div>
                      <p className="font-medium text-foreground">Time</p>
                      <p className="text-muted-foreground">
                        {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                        {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  {booking.description && (
                    <div className="sm:col-span-2 flex items-start gap-4">
                      <FileText className="h-6 w-6 text-muted-foreground mt-1" />
                  <div>
                        <p className="font-medium text-foreground">Description</p>
                        <p className="text-muted-foreground whitespace-pre-wrap">{booking.description}</p>
                  </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
        </div>

          {/* Side Content */}
          <div className="space-y-8">
            {room && (
              <Card className="bg-card border-border/50">
            <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                    <Building className="h-5 w-5" />
                    <span>Room Information</span>
                  </CardTitle>
            </CardHeader>
                <CardContent>
                  <Link href={`/conference-room-booking/rooms/${room.id}`}>
                    <div className="relative aspect-video w-full overflow-hidden rounded-lg mb-4 hover:opacity-90 transition-opacity">
                      {room.image ? (
                        <img src={room.image} alt={room.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Building className="w-12 h-12 text-muted-foreground/50" />
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground hover:text-primary">{room.name}</h3>
                  </Link>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                    <MapPin className="h-4 w-4" />
                    {room.location}
                  </p>
                  <div className="text-sm text-muted-foreground flex items-center gap-1.5 mt-2">
                    <Users className="h-4 w-4" />
                    Capacity: {room.capacity}
                  </div>
            </CardContent>
          </Card>
            )}

          {bookedBy && (
              <Card className="bg-card border-border/50">
              <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-foreground">
                  <User className="h-5 w-5" />
                    <span>Booked By</span>
                </CardTitle>
              </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4">
                  <Avatar>
                      <AvatarImage src={bookedBy.profile_image || "/placeholder-user.jpg"} alt={bookedBy.name} />
                      <AvatarFallback>{bookedBy.name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                      <p className="font-semibold text-foreground">{bookedBy.name}</p>
                      <p className="text-sm text-muted-foreground">{bookedBy.position || 'User'}</p>
                  </div>
                  </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </ProtectedRoute>
  )
}
