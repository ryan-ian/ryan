"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, MapPin, Search, Filter, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"
import type { Room, Resource } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

export default function RoomsPage() {
  const [rooms, setRooms] = useState<Room[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showResourceFilters, setShowResourceFilters] = useState(false)

  useEffect(() => {
    fetchRooms()
    fetchResources()
  }, [])

  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, capacityFilter, statusFilter, selectedResources])

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

  const fetchResources = async () => {
    try {
      const response = await fetch("/api/resources")
      const resourcesData = await response.json()
      const resourcesArray = Array.isArray(resourcesData) ? resourcesData : resourcesData.resources || []
      setResources(resourcesArray)
    } catch (error) {
      console.error("Failed to fetch resources:", error)
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
    if (statusFilter && statusFilter !== "any") {
      filtered = filtered.filter((room) => room.status === statusFilter)
    }

    // Resource filter - check if room has ALL selected resources
    if (selectedResources.length > 0) {
      filtered = filtered.filter(room => {
        return selectedResources.every(resourceId => {
          // Check if room has resourceDetails
          if (room.resourceDetails && room.resourceDetails.length > 0) {
            return room.resourceDetails.some(r => r.id === resourceId);
          }
          // Fallback to resources array for backward compatibility
          if (room.resources) {
            return room.resources.includes(resourceId);
          }
          return false;
        });
      });
    }

    setFilteredRooms(filtered)
  }

  const handleResourceCheckboxChange = (resourceId: string, checked: boolean) => {
    setSelectedResources(prev => {
      if (checked) {
        return [...prev, resourceId];
      } else {
        return prev.filter(id => id !== resourceId);
      }
    });
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
          <div className="grid gap-4 md:grid-cols-3">
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
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Resources</label>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowResourceFilters(!showResourceFilters)}
                className="h-8 px-2 flex items-center gap-1"
              >
                {showResourceFilters ? "Hide" : "Show"} 
                {showResourceFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
            
            <Collapsible open={showResourceFilters} onOpenChange={setShowResourceFilters}>
              <CollapsibleContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2 border rounded-md p-3">
                  {resources.map((resource) => (
                    <div key={resource.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`resource-${resource.id}`}
                        checked={selectedResources.includes(resource.id)}
                        onCheckedChange={(checked) => 
                          handleResourceCheckboxChange(resource.id, checked === true)
                        }
                      />
                      <label 
                        htmlFor={`resource-${resource.id}`}
                        className="text-sm flex items-center gap-1 cursor-pointer"
                      >
                        <ResourceIcon type={resource.type} name={resource.name} size="sm" />
                        {resource.name}
                      </label>
                    </div>
                  ))}
                </div>
                {selectedResources.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => setSelectedResources([])}
                    className="mt-2 text-xs"
                  >
                    Clear resource filters
                  </Button>
                )}
              </CollapsibleContent>
            </Collapsible>
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
          <Card key={room.id} className="hover:shadow-md transition-shadow overflow-hidden">
            <Link href={`/conference-room-booking/rooms/${room.id}`} className="block">
              <div className="aspect-video w-full overflow-hidden">
                {room.image ? (
                  <img 
                    src={room.image} 
                    alt={`${room.name} room`}
                    className="w-full h-full object-cover transition-transform hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                    <Building className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}
              </div>
            </Link>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    <span>{room.name}</span>
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    <span>{room.location}</span>
                  </CardDescription>
                </div>
                <Badge className={getStatusColor(room.status)}>{room.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>Capacity: {room.capacity}</span>
              </div>

              {/* Display resources */}
              {room.resourceDetails && room.resourceDetails.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {room.resourceDetails.slice(0, 6).map((resource) => (
                    <ResourceIcon 
                      key={resource.id} 
                      type={resource.type} 
                      name={resource.name}
                      image={resource.image}
                      quantity={resource.quantity}
                      size="sm"
                    />
                  ))}
                  {room.resourceDetails.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.resourceDetails.length - 6} more
                    </Badge>
                  )}
                </div>
              ) : room.resources && room.resources.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {room.resources.slice(0, 6).map((resourceId) => {
                    const resource = resources.find(r => r.id === resourceId);
                    return resource ? (
                      <ResourceIcon 
                        key={resourceId} 
                        type={resource.type} 
                        name={resource.name}
                        image={resource.image}
                        size="sm"
                      />
                    ) : null;
                  })}
                  {room.resources.length > 6 && (
                    <Badge variant="outline" className="text-xs">
                      +{room.resources.length - 6} more
                    </Badge>
                  )}
                </div>
              ) : null}
              
              <Button asChild size="sm" className="w-full">
                <Link href={`/conference-room-booking/bookings/new?room=${room.id}`}>
                  Book Now
                </Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredRooms.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No rooms found</h3>
          <p className="text-muted-foreground">
            Try adjusting your filters or search criteria
          </p>
        </div>
      )}
    </div>
  )
}
