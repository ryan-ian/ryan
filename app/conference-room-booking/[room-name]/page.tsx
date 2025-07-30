"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter, useSearchParams } from "next/navigation"
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
import type { Room, Booking, Resource } from "@/types"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { ProtectedRoute } from "@/components/protected-route"
import { BookingCreationModal } from "@/app/conference-room-booking/bookings/booking-creation-modal"
import { toast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { slugify } from "@/lib/utils"

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
  const searchParams = useSearchParams()
  const roomId = searchParams.get('id')
  const roomSlug = params["room-name"] as string

  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<Booking[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)
  const [showBookingModal, setShowBookingModal] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails()
      fetchRoomBookings()
      fetchResources()
    } else {
      // If no ID provided, redirect to main rooms page
      router.push('/conference-room-booking')
    }
  }, [roomId])

  // Verify that the slug in the URL matches the room's name
  useEffect(() => {
    if (room && roomSlug) {
      const correctSlug = slugify(room.name)
      if (correctSlug !== roomSlug) {
        // Redirect to the correct URL but preserve the ID
        router.replace(`/conference-room-booking/${correctSlug}?id=${roomId}`)
      }
    }
  }, [room, roomSlug, roomId])

  const fetchRoomDetails = async () => {
    try {
      const response = await fetch(`/api/rooms?id=${roomId}`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const roomData = await response.json()
      setRoom(roomData)
    } catch (error) {
      console.error("Failed to fetch room details:", error)
      setRoom(null)
    } finally {
      setLoading(false)
    }
  }

  const fetchRoomBookings = async () => {
    try {
      // Include user data in the bookings query
      const response = await fetch(`/api/bookings?roomId=${roomId}&includeUsers=true`)
      const bookingsData = await response.json()
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []
      
      // Process bookings to ensure they have user information
      const processedBookings = bookingsArray.map(booking => {
        // If users field exists and is an array (from join query), extract the first user
        if (booking.users && Array.isArray(booking.users) && booking.users.length > 0) {
          const user = booking.users[0];
          return {
            ...booking,
            user_name: user.name || "Unknown user"
          };
        }
        
        // If user_name doesn't exist, add a placeholder
        if (!booking.user_name) {
          return {
            ...booking,
            user_name: "Unknown user"
          };
        }
        
        return booking;
      });
      
      setBookings(processedBookings)
    } catch (error) {
      console.error("Failed to fetch room bookings:", error)
    }
  }

  const fetchResources = async () => {
    try {
      const response = await fetch('/api/resources')
      const resourcesData = await response.json()
      const resourcesArray = Array.isArray(resourcesData) ? resourcesData : resourcesData.resources || []
      setResources(resourcesArray)
    } catch (error) {
      console.error('Failed to fetch resources:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "available":
        return <Badge variant="default" className="bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-300 border-green-500/20">Available</Badge>
      case "occupied":
        return <Badge variant="destructive" className="bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-300 border-red-500/20">Occupied</Badge>
      case "maintenance":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-300 border-yellow-500/20">Maintenance</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getUpcomingBookings = () => {
    const now = new Date()
    return bookings
      .filter((booking) => {
        // Filter for confirmed bookings that haven't started yet
        return booking.status === "confirmed" && new Date(booking.start_time) > now
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5) // Show only the next 5 bookings
  }

  // Handler for booking modal submit
  const handleBookingSubmit = async (data: any) => {
    try {
      const token = localStorage.getItem("auth-token")
      if (!token) throw new Error("You must be logged in to book a room.")

      // Prepare booking payload
      const payload = {
        ...data,
        user_id: user?.id,
        room_id: room?.id,
      }

      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create booking")
      }

      setShowBookingModal(false)
      toast({ title: "Booking request submitted!", description: "Your booking is pending approval." })
      fetchRoomBookings()
    } catch (error: any) {
      toast({
        title: "Booking failed",
        description: error.message || "Failed to create booking.",
        variant: "destructive"
      })
    }
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
              <div className="h-80 bg-muted-foreground/10 rounded-lg"></div>
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

  if (!room) {
    return (
      <ProtectedRoute>
        <div className="p-6 space-y-6">
          <Button variant="outline" size="sm" onClick={() => router.push('/conference-room-booking')} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Button>
          <Card>
            <CardContent className="text-center py-16">
              <Building className="h-16 w-16 text-muted-foreground mx-auto mb-6" />
              <h2 className="text-2xl font-semibold text-foreground">Room Not Found</h2>
              <p className="text-muted-foreground mt-2 mb-6">
                The room you're looking for doesn't exist or has been removed.
              </p>
              <Button asChild>
                <Link href="/conference-room-booking">Browse All Rooms</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </ProtectedRoute>
    )
  }

  const upcomingBookings = getUpcomingBookings()

  return (
    <ProtectedRoute>
      <div className="p-6 space-y-8">
      {/* Header */}
        <header>
          <Button variant="ghost" onClick={() => router.push('/conference-room-booking')} className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Back to Rooms
          </Button>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground">{room.name}</h1>
              <p className="text-lg text-muted-foreground flex items-center gap-2 mt-2">
                <MapPin className="h-5 w-5" />
                {room.location}
              </p>
              {(room.facility || room.facility_name) && (
                <p className="text-lg text-muted-foreground flex items-center gap-2 mt-2">
                  <Building className="h-5 w-5" />
                  {room.facility_name || (room.facility && room.facility.name) || "Unknown Facility"}
                </p>
              )}
            </div>
            <div className="flex items-center gap-4 pt-2">
              {getStatusBadge(room.status)}
              <Button type="button" onClick={() => setShowBookingModal(true)} className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>Book This Room</span>
              </Button>
            </div>
          </div>
        </header>

        <div className="w-full flex flex-col md:flex-row md:items-start md:gap-8">
          {/* Main Content */}
          <div className="w-full max-w-2xl space-y-8 mx-auto">
            {/* Room Image */}
            <Card className="overflow-hidden border-border/50">
              <CardContent className="p-0">
                {room.image ? (
                  <img src={room.image} alt={room.name} className="w-full h-auto object-cover max-h-[400px]" />
                ) : (
                  <div className="w-full h-80 bg-muted flex items-center justify-center">
                    <Building className="w-24 h-24 text-muted-foreground/50" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room Details */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="text-2xl font-semibold text-foreground">Room Details</CardTitle>
              </CardHeader>
              <CardContent>
                {room.description && (
                  <p className="text-muted-foreground mb-6">{room.description}</p>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-lg text-muted-foreground">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Capacity</p>
                      <p className="text-muted-foreground">{room.capacity} people</p>
                    </div>
                  </div>
                  {room.resourceDetails && room.resourceDetails.length > 0 && (
                    <div className="sm:col-span-2">
                      <h4 className="font-medium text-foreground mb-4">What this place offers</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {room.resourceDetails.map((resource) => (
                          <div key={resource.id} className="flex items-center gap-3">
                            <ResourceIcon type={resource.type} name={resource.name} />
                            <span className="text-muted-foreground">{resource.name}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Bookings Section (side card) */}
          <div className="w-full md:w-96 md:ml-0 mt-8 md:mt-0 flex-shrink-0">
            <Card className="bg-card border-border/50 sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-foreground text-lg">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="max-h-[500px] overflow-y-auto">
                {upcomingBookings.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <li key={booking.id} className="p-4 bg-muted/50 rounded-lg border border-border/50">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-xs">
                            {booking.status}
                          </Badge>
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.start_time).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        
                        <p className="font-semibold text-foreground truncate">
                          {booking.title || "Untitled Meeting"}
                        </p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                            {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <p className="text-xs text-muted-foreground">
                            {booking.user_name || "Unknown user"}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-2" />
                    <p className="text-muted-foreground">No upcoming bookings for this room.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      <BookingCreationModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        room={room}
        onSubmit={handleBookingSubmit}
      />
    </ProtectedRoute>
  )
} 