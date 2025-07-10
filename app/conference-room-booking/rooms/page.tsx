"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Building, Users, MapPin, Search, Filter, Wifi, Monitor, Coffee, Car, Calendar, Clock } from "lucide-react"
import Link from "next/link"
import type { Room } from "@/types"

const amenityIcons = {
  wifi: Wifi,
  projector: Monitor,
  whiteboard: Monitor,
  coffee: Coffee,
  parking: Car,
}

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])

  useEffect(() => {
    fetchRooms()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, capacityFilter, statusFilter, selectedAmenities])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const roomsData = await response.json()
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      setRooms(roomsArray)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterRooms = () => {
    let filtered = rooms

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          room.location.toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Capacity filter
    if (capacityFilter) {
      const capacity = Number.parseInt(capacityFilter)
      filtered = filtered.filter((room) => room.capacity >= capacity)
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter((room) => room.status === statusFilter)
    }

    // Amenities filter
    if (selectedAmenities.length > 0) {
      filtered = filtered.filter((room) => selectedAmenities.every((amenity) => room.amenities?.includes(amenity)))
    }

    setFilteredRooms(filtered)
  }

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    if (checked) {
      setSelectedAmenities((prev) => [...prev, amenity])
    } else {
      setSelectedAmenities((prev) => prev.filter((a) => a !== amenity))
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

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Browse Rooms</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-muted rounded"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Browse Rooms</h1>
          <p className="text-muted-foreground">Find and book the perfect space for your meeting</p>
        </div>
        <Button asChild>
          <Link href="/conference-room-booking/bookings/new" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Book a Room</span>
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search rooms..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Minimum Capacity</label>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any capacity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any capacity</SelectItem>
                  <SelectItem value="2">2+ people</SelectItem>
                  <SelectItem value="5">5+ people</SelectItem>
                  <SelectItem value="10">10+ people</SelectItem>
                  <SelectItem value="20">20+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Any status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="occupied">Occupied</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Amenities</label>
              <div className="space-y-2">
                {["wifi", "projector", "whiteboard", "coffee"].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={amenity}
                      checked={selectedAmenities.includes(amenity)}
                      onCheckedChange={(checked) => handleAmenityChange(amenity, checked as boolean)}
                    />
                    <label htmlFor={amenity} className="text-sm capitalize">
                      {amenity}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredRooms.length} of {rooms.length} rooms
        </p>
      </div>

      {/* Rooms Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRooms.map((room) => (
          <Card key={room.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    <span>{room.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1 mt-1">
                    <MapPin className="h-3 w-3" />
                    <span>{room.location}</span>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-4 w-4" />
                  <span>{room.capacity} people</span>
                </div>
                {room.hourlyRate && (
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>${room.hourlyRate}/hr</span>
                  </div>
                )}
              </div>

              {room.amenities && room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {room.amenities.slice(0, 4).map((amenity) => {
                    const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons] || Monitor
                    return (
                      <div key={amenity} className="flex items-center gap-1 text-xs bg-muted px-2 py-1 rounded">
                        <IconComponent className="h-3 w-3" />
                        <span className="capitalize">{amenity}</span>
                      </div>
                    )
                  })}
                  {room.amenities.length > 4 && (
                    <div className="text-xs bg-muted px-2 py-1 rounded">+{room.amenities.length - 4} more</div>
                  )}
                </div>
              )}

              <div className="flex gap-2 pt-2">
                <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                  <Link href={`/conference-room-booking/rooms/${room.id}`}>View Details</Link>
                </Button>
                {room.status === "available" && (
                  <Button asChild size="sm" className="flex-1">
                    <Link href={`/conference-room-booking/bookings/new?roomId=${room.id}`}>Book Now</Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No rooms found</h3>
            <p className="text-muted-foreground mb-4">Try adjusting your filters to find more rooms.</p>
            <Button
              onClick={() => {
                setSearchTerm("")
                setCapacityFilter("")
                setStatusFilter("")
                setSelectedAmenities([])
              }}
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
