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
import { ProtectedRoute } from "@/components/protected-route"

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

    return (
    <ProtectedRoute>
      {loading ? (
        <div className="p-6 space-y-8">
          <div className="animate-pulse">
            <div className="h-8 bg-muted-foreground/20 rounded w-64 mb-2"></div>
            <div className="h-4 bg-muted-foreground/20 rounded w-80"></div>
          </div>
          <div className="animate-pulse">
            <div className="h-40 bg-muted-foreground/10 rounded-lg"></div>
        </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-64 bg-muted-foreground/10 rounded-lg"></div>
                </div>
          ))}
        </div>
      </div>
      ) : (
        <div className="p-6 space-y-8">
          <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Browse Rooms</h1>
          <p className="text-muted-foreground">Find and book the perfect space for your meeting</p>
        </div>
        <Button asChild>
          <Link href="/conference-room-booking/bookings/new" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>Book a Room</span>
          </Link>
        </Button>
          </header>

      {/* Filters */}
          <Card className="bg-card border-border/50">
        <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
            <Filter className="h-5 w-5" />
                <span>Filter Options</span>
          </CardTitle>
        </CardHeader>
            <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Search</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                      placeholder="Search by name or location..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-background/50"
                />
              </div>
            </div>

            <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Minimum Capacity</label>
              <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="bg-background/50">
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
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background/50">
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

              <Collapsible open={showResourceFilters} onOpenChange={setShowResourceFilters} className="space-y-2">
                <CollapsibleTrigger asChild>
              <Button 
                variant="ghost" 
                    className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
              >
                    <span className="text-sm font-medium text-muted-foreground">Filter by Resources</span>
                    <div className="flex items-center gap-1 text-sm text-primary">
                {showResourceFilters ? "Hide" : "Show"} 
                {showResourceFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
              </Button>
                </CollapsibleTrigger>
              <CollapsibleContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pt-4 border-t border-border/50">
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
                          className="text-sm font-medium flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                      >
                          <ResourceIcon type={resource.type} className="h-4 w-4" />
                        {resource.name}
                      </label>
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
        </CardContent>
      </Card>

          {/* Room Listings */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <Card key={room.id} className="overflow-hidden bg-card border-border/50 hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <Link href={`/conference-room-booking/rooms/${room.id}`} className="block">
                    <div className="relative h-48 w-full">
                {room.image ? (
                  <img 
                    src={room.image} 
                          alt={room.name} 
                          className="w-full h-full object-cover" 
                  />
                ) : (
                  <div className="w-full h-full bg-muted flex items-center justify-center">
                          <Building className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                      <div className="absolute top-3 right-3">
                        {getStatusBadge(room.status)}
                      </div>
              </div>
            </Link>
                  <div className="p-6 flex-grow flex flex-col">
                    <CardHeader className="p-0 mb-4">
                      <Link href={`/conference-room-booking/rooms/${room.id}`}>
                        <CardTitle className="text-xl font-bold text-foreground hover:text-primary transition-colors">
                          {room.name}
                  </CardTitle>
                      </Link>
                      <CardDescription className="flex items-center gap-2 pt-1">
                        <MapPin className="h-4 w-4" />
                        {room.location}
                  </CardDescription>
            </CardHeader>
                    <CardContent className="p-0 flex-grow space-y-4">
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          <span className="font-medium">{room.capacity}</span>
              </div>
                </div>
                <div className="flex flex-wrap gap-2">
                        {room.resourceDetails && room.resourceDetails.map((resource) => (
                          <Badge key={resource.id} variant="secondary" className="flex items-center gap-1">
                            <ResourceIcon type={resource.type} className="h-3 w-3" />
                            {resource.name}
                    </Badge>
                        ))}
                </div>
                    </CardContent>
                    <div className="mt-6">
                      <Button asChild className="w-full">
                        <Link href={`/conference-room-booking/bookings/new?roomId=${room.id}`}>
                  Book Now
                </Link>
              </Button>
                    </div>
                  </div>
          </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <h2 className="text-2xl font-semibold text-foreground">No Rooms Found</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
              </div>
            )}
      </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
