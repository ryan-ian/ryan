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
import type { Room, Booking, Resource } from "@/types"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { ProtectedRoute } from "@/components/protected-route"

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
  const [resources, setResources] = useState<Resource[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (roomId) {
      fetchRoomDetails()
      fetchRoomBookings()
      fetchResources()
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
      const response = await fetch(`/api/bookings?roomId=${roomId}`)
      const bookingsData = await response.json()
      const bookingsArray = Array.isArray(bookingsData) ? bookingsData : bookingsData.bookings || []
      setBookings(bookingsArray)
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
      .filter((booking) => new Date(booking.start_time) > now)
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 5)
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
          <Button variant="outline" size="sm" onClick={() => router.back()} className="flex items-center gap-2">
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
              <Link href="/conference-room-booking/rooms">Browse All Rooms</Link>
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
          <Button variant="ghost" onClick={() => router.back()} className="flex items-center gap-2 mb-6 text-muted-foreground hover:text-foreground">
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
        </div>
            <div className="flex items-center gap-4 pt-2">
              {getStatusBadge(room.status)}
            <Button asChild>
              <Link
                href={`/conference-room-booking/bookings/new?roomId=${room.id}`}
                className="flex items-center gap-2"
              >
                <Calendar className="h-4 w-4" />
                <span>Book This Room</span>
              </Link>
            </Button>
        </div>
      </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main Content */}
          <div className="md:col-span-2 space-y-8">
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
                            <ResourceIcon type={resource.type} className="h-5 w-5 text-muted-foreground" />
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

          {/* Side Content */}
          <div className="space-y-8">
            {/* Upcoming Bookings */}
            <Card className="bg-card border-border/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <Calendar className="h-5 w-5" />
                  <span>Upcoming Bookings</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {upcomingBookings.length > 0 ? (
                  <ul className="space-y-4">
                    {upcomingBookings.map((booking) => (
                      <li key={booking.id} className="p-4 bg-muted/50 rounded-lg">
                        <p className="font-semibold text-foreground">
                          {new Date(booking.start_time).toLocaleDateString(undefined, {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(booking.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                          {new Date(booking.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No upcoming bookings for this room.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact Info */}
            {room.contact_person && (
              <Card className="bg-card border-border/50">
            <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground">Contact</CardTitle>
            </CardHeader>
                <CardContent className="space-y-3">
                  <p className="font-semibold text-foreground">{room.contact_person}</p>
                  {room.contact_email && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <a href={`mailto:${room.contact_email}`} className="hover:text-primary">{room.contact_email}</a>
                    </div>
                  )}
                  {room.contact_phone && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      <span>{room.contact_phone}</span>
                </div>
              )}
            </CardContent>
          </Card>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
