"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { 
  Building, Users, MapPin, Search, Filter, Calendar, Clock, 
  ChevronDown, ChevronUp, X, SlidersHorizontal 
} from "lucide-react"
import Link from "next/link"
import type { Room, Resource, Facility } from "@/types"
import { Checkbox } from "@/components/ui/checkbox"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ProtectedRoute } from "@/components/protected-route"
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { RoomCard } from "@/components/cards/room-card"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useRooms, useResources, useFacilities } from "@/hooks/use-cached-data"

export default function RoomsPage() {
  // Use cached data hooks instead of direct fetch calls
  const { data: rooms = [], isLoading: roomsLoading } = useRooms()
  const { data: resources = [] } = useResources()
  const { data: facilities = [] } = useFacilities()
  
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [facilityFilter, setFacilityFilter] = useState("any")
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showResourceFilters, setShowResourceFilters] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [activeFilters, setActiveFilters] = useState(0)
  
  // Use effect to filter rooms whenever filters or data changes
  useEffect(() => {
    filterRooms()
    
    // Count active filters
    let count = 0
    if (searchTerm) count++
    if (capacityFilter) count++
    if (statusFilter && statusFilter !== "any") count++
    if (facilityFilter && facilityFilter !== "any") count++
    if (selectedResources.length > 0) count++
    setActiveFilters(count)
  }, [rooms, searchTerm, capacityFilter, statusFilter, facilityFilter, selectedResources])

  const filterRooms = () => {
    let filtered = rooms

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchLower) ||
          room.location.toLowerCase().includes(searchLower) ||
          room.facility?.name.toLowerCase().includes(searchLower)
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
    
    // Facility filter
    if (facilityFilter && facilityFilter !== "any") {
      filtered = filtered.filter((room) => room.facility_id === facilityFilter)
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
  
  const clearFilters = () => {
    setSearchTerm("")
    setCapacityFilter("")
    setStatusFilter("")
    setFacilityFilter("any")
    setSelectedResources([])
  }
  
  const toggleFilters = () => {
    setShowFilters(!showFilters)
  }

  return (
    <ProtectedRoute>
      {roomsLoading ? (
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
              <Skeleton key={i} className="h-64 w-full" />
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

          {/* Search and Filter Bar */}
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, location, or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-8 bg-background/50"
              />
              {searchTerm && (
                <button 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2 relative">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                  {activeFilters > 0 && (
                    <Badge variant="secondary" className="h-5 w-5 p-0 flex items-center justify-center rounded-full absolute -top-1 -right-1">
                      {activeFilters}
                    </Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-80 p-4 space-y-4">
                <DropdownMenuLabel>Filter Options</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Minimum Capacity</label>
                  <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Any capacity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Any capacity</SelectItem>
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
                      <SelectItem value="">Any status</SelectItem>
                      <SelectItem value="available">Available</SelectItem>
                      <SelectItem value="occupied">Occupied</SelectItem>
                      <SelectItem value="maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-muted-foreground">Facility</label>
                  <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                    <SelectTrigger className="bg-background/50">
                      <SelectValue placeholder="Any facility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="any">Any facility</SelectItem>
                      {facilities.map(facility => (
                        <SelectItem key={facility.id} value={facility.id}>
                          {facility.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <Collapsible open={showResourceFilters} onOpenChange={setShowResourceFilters} className="space-y-2">
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className="w-full flex items-center justify-between p-2 hover:bg-muted/50"
                    >
                      <span className="text-sm font-medium text-muted-foreground">Resources</span>
                      <div className="flex items-center gap-1 text-sm text-primary">
                        {showResourceFilters ? "Hide" : "Show"} 
                        {showResourceFilters ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="grid grid-cols-2 gap-3 pt-2 max-h-48 overflow-y-auto border-t border-border/50">
                      {resources.map((resource) => (
                        <div key={resource.id} className="flex items-center space-x-2">
                          <Checkbox 
                            id={`resource-filter-${resource.id}`}
                            checked={selectedResources.includes(resource.id)}
                            onCheckedChange={(checked) => 
                              handleResourceCheckboxChange(resource.id, checked === true)
                            }
                          />
                          <label 
                            htmlFor={`resource-filter-${resource.id}`}
                            className="text-sm font-medium flex items-center gap-2 cursor-pointer text-muted-foreground hover:text-foreground"
                          >
                            <ResourceIcon type={resource.type} name={resource.name} />
                            {resource.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                
                <DropdownMenuSeparator />
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={clearFilters}
                  disabled={activeFilters === 0}
                >
                  Clear All Filters
                </Button>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {/* Active Filters */}
          {activeFilters > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              {searchTerm && (
                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  <span>Search: {searchTerm}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {capacityFilter && (
                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  <span>Capacity: {capacityFilter}+ people</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => setCapacityFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {statusFilter && (
                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  <span>Status: {statusFilter}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => setStatusFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {facilityFilter && facilityFilter !== "any" && (
                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  <span>Facility: {facilities.find(f => f.id === facilityFilter)?.name}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => setFacilityFilter("any")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              {selectedResources.length > 0 && (
                <Badge variant="outline" className="flex items-center gap-1 py-1 pl-2 pr-1">
                  <span>Resources: {selectedResources.length}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-muted"
                    onClick={() => setSelectedResources([])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                className="ml-auto text-muted-foreground text-xs"
                onClick={clearFilters}
              >
                Clear all
              </Button>
            </div>
          )}

          {/* Room Listings */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  resourceDetails={room.resourceDetails}
                  href={`/conference-room-booking/rooms/${room.id}`}
                  showBookButton={true}
                />
              ))
            ) : (
              <div className="col-span-full text-center py-16">
                <h2 className="text-2xl font-semibold text-foreground">No Rooms Found</h2>
                <p className="text-muted-foreground mt-2">Try adjusting your search or filter criteria.</p>
                {activeFilters > 0 && (
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Clear All Filters
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
