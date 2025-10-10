"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, MapPin, Search, Filter, Calendar, Clock, ChevronDown, ChevronUp, X, SlidersHorizontal } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Checkbox } from "@/components/ui/checkbox"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RoomCard } from "@/components/cards/room-card"
import { useToast } from "@/components/ui/use-toast"
import type { Room, Resource, Facility } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { eventBus, EVENTS } from "@/lib/events"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { restoreBookingState, clearBookingState } from "@/lib/booking-state-manager"

export default function ConferenceRoomBookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [facilityFilter, setFacilityFilter] = useState("any")
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showResourceFilters, setShowResourceFilters] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [availableFacilities, setAvailableFacilities] = useState<{id: string, name: string}[]>([])
  const [showFilters, setShowFilters] = useState(false)
  const [activeFiltersCount, setActiveFiltersCount] = useState(0)
  const [shouldRestoreBooking, setShouldRestoreBooking] = useState(false)
  const [restoredRoom, setRestoredRoom] = useState<Room | null>(null)

  useEffect(() => {
    fetchResources()
    fetchRooms()
    if (user?.id) {
      fetchUserBookings()
    }
  }, [user?.id])
  
  // Add effect to extract unique facilities from rooms
  useEffect(() => {
    if (rooms.length > 0) {
      // Extract unique facilities from rooms
      const facilitiesMap = new Map<string, {id: string, name: string}>();
      let directFacilityNameCount = 0;
      let facilityObjectCount = 0;
      
      rooms.forEach(room => {
        // If a room has facility_id and facility_name, use them directly
        if (room.facility_id && room.facility_name) {
          facilitiesMap.set(room.facility_id, {
            id: room.facility_id,
            name: room.facility_name
          });
          directFacilityNameCount++;
        }
        // Fallback to facility object if available
        else if (room.facility && room.facility.id && room.facility.name) {
          facilitiesMap.set(room.facility.id, {
            id: room.facility.id,
            name: room.facility.name
          });
          facilityObjectCount++;
        }
      });
      
      // Convert map to array
      const uniqueFacilities = Array.from(facilitiesMap.values());
      console.log(`Extracted ${uniqueFacilities.length} unique facilities from rooms`);
      console.log(`- ${directFacilityNameCount} rooms had direct facility_name`);
      console.log(`- ${facilityObjectCount} rooms used facility object`);
      
      if (uniqueFacilities.length > 0) {
        console.log("Sample facilities:", uniqueFacilities.slice(0, 3).map(f => `${f.id}: ${f.name}`));
      }
      
      setAvailableFacilities(uniqueFacilities);
    }
  }, [rooms]);
  
  // Update active filters count whenever filters change
  useEffect(() => {
    let count = 0;
    if (searchTerm) count++;
    if (capacityFilter) count++;
    if (statusFilter !== "any") count++;
    if (facilityFilter !== "any") count++;
    if (selectedResources.length > 0) count += 1;

    setActiveFiltersCount(count);
  }, [searchTerm, capacityFilter, statusFilter, facilityFilter, selectedResources]);

  // Handle booking state restoration after payment redirect
  useEffect(() => {
    const restoreBooking = searchParams.get('restore_booking')
    const stateId = searchParams.get('state_id')

    if (restoreBooking === 'true' && stateId && rooms.length > 0) {
      console.log("🔄 Attempting to restore booking state after payment redirect")

      try {
        const restoredState = restoreBookingState(stateId)
        if (restoredState) {
          // Find the room from the restored state
          const room = rooms.find(r => r.id === restoredState.room.id)
          if (room) {
            setRestoredRoom(room)
            setShouldRestoreBooking(true)

            // Clear URL parameters
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('restore_booking')
            newUrl.searchParams.delete('state_id')
            router.replace(newUrl.pathname + newUrl.search)

            console.log("✅ Booking state restoration prepared")

            // Show success message
            toast({
              title: "Payment Completed!",
              description: "Your booking modal has been restored. You can continue or make additional bookings.",
              duration: 5000,
            })
          } else {
            console.error("❌ Room not found for restoration:", restoredState.room.id)
            clearBookingState(stateId)
          }
        }
      } catch (error) {
        console.error("❌ Failed to restore booking state:", error)
        clearBookingState(stateId)
      }
    }
  }, [searchParams, rooms, router, toast]);
  
  // Add back the filterRooms effect
  useEffect(() => {
    filterRooms()
  }, [rooms, searchTerm, capacityFilter, statusFilter, facilityFilter, selectedResources])

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const roomsData = await response.json()
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      console.log(`Fetched ${roomsArray.length} rooms from API`)
      
      // Log a sample of rooms with their facility data
      if (roomsArray.length > 0) {
        console.log("Sample rooms with facility data:", 
          roomsArray.slice(0, 3).map((r: Room) => ({ 
            id: r.id, 
            name: r.name, 
            facility_id: r.facility_id,
            facility_name: r.facility_name,
            facility: r.facility
          }))
        )
      }
      
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

  const fetchUserBookings = async () => {
    try {
      if (!user?.id) return
      
      const { authenticatedFetch } = await import('@/lib/auth-utils')
      const response = await authenticatedFetch(`/api/bookings/user?user_id=${user.id}&timestamp=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      const bookings = await response.json()
      console.log(`Fetched ${bookings.length} user bookings in main page`)
      setUserBookings(bookings)
    } catch (error) {
      console.error("Failed to fetch user bookings:", error)
    }
  }

  const filterRooms = () => {
    let filtered = rooms
    console.log(`Starting filtering with ${rooms.length} rooms`)

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (room) =>
          room.name.toLowerCase().includes(searchLower) ||
          room.location.toLowerCase().includes(searchLower) ||
          (room.facility_name && room.facility_name.toLowerCase().includes(searchLower)) ||
          (room.facility && room.facility.name && room.facility.name.toLowerCase().includes(searchLower))
      )
      console.log(`After search filter: ${filtered.length} rooms`)
    }

    // Capacity filter
    if (capacityFilter) {
      const capacity = Number.parseInt(capacityFilter)
      filtered = filtered.filter((room) => room.capacity >= capacity)
      console.log(`After capacity filter: ${filtered.length} rooms`)
    }

    // Status filter
    if (statusFilter && statusFilter !== "any") {
      filtered = filtered.filter((room) => room.status === statusFilter)
      console.log(`After status filter: ${filtered.length} rooms`)
    }
    
    // Facility filter
    if (facilityFilter && facilityFilter !== "any") {
      const selectedFacility = availableFacilities.find(f => f.id === facilityFilter);
      console.log(`Filtering by facility: ${selectedFacility?.name || 'Unknown'} (ID: ${facilityFilter})`);
      
      const byDirectId = rooms.filter(room => room.facility_id === facilityFilter).length;
      const byFacilityObject = rooms.filter(room => room.facility && room.facility.id === facilityFilter).length;
      console.log(`- ${byDirectId} rooms match by direct facility_id`);
      console.log(`- ${byFacilityObject} rooms match by facility object`);
      
      filtered = filtered.filter((room) => 
        // Match on facility_id
        room.facility_id === facilityFilter || 
        // Or fall back to facility object if needed
        (room.facility && room.facility.id === facilityFilter)
      );
      console.log(`After facility filter: ${filtered.length} rooms`);
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
      console.log(`After resource filter: ${filtered.length} rooms`)
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

  const handleBookRoom = async (roomId: string, bookingData: any) => {
    try {
      // Find the selected room to get its capacity
      const selectedRoom = rooms.find(room => room.id === roomId)
      if (!selectedRoom) {
        throw new Error("Room not available")
      }
      
      // Create the booking
      const token = localStorage.getItem("auth-token")
      
      // Check if this is a multi-booking request
      if (bookingData.bookings && Array.isArray(bookingData.bookings)) {
        // Multiple bookings
        const response = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            title: bookingData.title,
            description: bookingData.description || "",
            room_id: roomId,
            user_id: user?.id,
            bookings: bookingData.bookings
          })
        })
        
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || "Failed to create bookings")
        }
        
        const result = await response.json()
        
        // Force a refresh of user bookings with a small delay to ensure server has processed
        setTimeout(() => {
          fetchUserBookings()
          console.log("Refreshing user bookings after multiple booking creation")
          
          // Trigger global event for booking creation
          eventBus.publish(EVENTS.BOOKING_CREATED)
          
          // Navigate to bookings page after successful creation
          if (result.created > 0) {
            router.push('/conference-room-booking/bookings')
          }
        }, 1000)
        
        if (result.failed > 0) {
          // Detailed feedback for failures
          const failureReasons = new Map<string, number>();
          
          // Count occurrences of each failure reason
          result.failures.forEach((failure: any) => {
            const count = failureReasons.get(failure.reason) || 0;
            failureReasons.set(failure.reason, count + 1);
          });
          
          // Create detailed failure message
          let failureMessage = "";
          failureReasons.forEach((count, reason) => {
            failureMessage += `• ${reason} (${count} booking${count > 1 ? 's' : ''})\n`;
          });
          
          if (result.created > 0) {
            // Some succeeded, some failed
            toast({
              title: `${result.created} booking(s) created successfully`,
              description: `${result.failed} booking(s) could not be created:\n${failureMessage}`,
              variant: "default"
            })
          } else {
            // All failed
            toast({
              title: "Booking failed",
              description: `None of your bookings could be created:\n${failureMessage}`,
              variant: "destructive"
            })
          }
        } else {
          // All succeeded
          toast({
            title: "Bookings created successfully",
            description: `${result.created} booking(s) have been submitted for approval.`,
          })
        }
      } else {
        // Single booking (legacy support)
        // Check if user has already booked a room today
        const bookingDate = new Date(bookingData.date).toISOString().split('T')[0]
        
        const hasBookingToday = userBookings.some(booking => {
          const bookingDay = new Date(booking.start_time).toISOString().split('T')[0]
          return bookingDay === bookingDate
        })
        
        if (hasBookingToday) {
          toast({
            title: "Booking limit reached",
            description: "You can only book one room per day. Please select a different date.",
            variant: "warning"
          })
          return
        }
        
        // Check for time conflicts
        const startTime = new Date(bookingData.start_time).toISOString()
        const endTime = new Date(bookingData.end_time).toISOString()
        
        const response = await fetch(`/api/bookings?roomId=${roomId}&start=${startTime}&end=${endTime}`)
        
        if (!response.ok) {
          throw new Error("Failed to check room availability")
        }
        
        const existingBookings = await response.json()
        
        if (existingBookings && existingBookings.length > 0) {
          toast({
            title: "Time slot unavailable",
            description: "This room is already booked for the selected time period. Please choose a different time.",
            variant: "destructive"
          })
          return
        }
        
        // Create the booking
        const bookingResponse = await fetch("/api/bookings", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(bookingData)
        })
        
        if (!bookingResponse.ok) {
          const errorData = await bookingResponse.json()
          throw new Error(errorData.error || "Failed to create booking")
        }
        
        const result = await bookingResponse.json()
        
        // Force a refresh of user bookings
        setTimeout(() => {
          fetchUserBookings()
          
          // Trigger global event for booking creation
          eventBus.publish(EVENTS.BOOKING_CREATED)
          
          // Navigate to bookings page after successful creation
          router.push('/conference-room-booking/bookings')
        }, 1000)
        
        toast({
          title: "Booking created successfully",
          description: "Your booking has been submitted for approval.",
        })
      }
    } catch (error: any) {
      console.error("Error booking room:", error)
      
      // Extract error message
      let errorMessage = 'Failed to create booking. Please try again.';
      
      if (error.message) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      // Show error toast with specific message
      toast({
        title: "Booking failed",
        description: errorMessage,
        variant: "destructive"
      })
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
      <div className="p-6 space-y-4">
        <header className="flex gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">Browse Rooms</h1>
              <p className="text-brand-navy-700 dark:text-brand-navy-300">Find and book the perfect space for your meeting</p>
          </div>
        </header>

        {/* Modern Search & Filter Bar */}
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
              <Input
                placeholder="Search by name, location, or facility..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700 focus-visible:ring-brand-teal-500 h-11 w-full"
              />
              {searchTerm && (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 rounded-full hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700 text-brand-navy-600 dark:text-brand-navy-400"
                  onClick={() => setSearchTerm("")}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            
            <Popover open={showFilters} onOpenChange={setShowFilters}>
              <PopoverTrigger asChild>
                <Button 
                  variant="outline" 
                  className={cn(
                    "h-11 flex items-center gap-1.5 px-3 border-brand-navy-200 dark:border-brand-navy-700 w-full sm:w-auto", 
                    activeFiltersCount > 0 && "border-brand-teal-500 dark:border-brand-teal-500"
                  )}
                >
                  <SlidersHorizontal className="h-4 w-4 text-brand-navy-600 dark:text-brand-navy-400" />
                  <span className="text-brand-navy-800 dark:text-brand-navy-200">Filters</span>
                  {activeFiltersCount > 0 && (
                    <Badge 
                      variant="secondary" 
                      className="ml-1 h-5 rounded-full bg-brand-teal-500 text-white"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent 
                className="w-[calc(100vw-2rem)] sm:w-80 md:w-96 p-4 border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 shadow-lg"
                align="end"
                sideOffset={8}
              >
                <div className="space-y-5">
                  <h3 className="text-lg font-medium tracking-tight flex items-center gap-2 text-brand-navy-900 dark:text-brand-navy-50">
                    <Filter className="h-5 w-5 text-brand-teal-600 dark:text-brand-teal-400" /> 
                    <span>Filter Options</span>
                  </h3>

                  {/* Capacity Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Minimum Capacity</label>
                    <Select value={capacityFilter} onValueChange={setCapacityFilter}>
                      <SelectTrigger className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                        <SelectValue placeholder="Any capacity" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                        <SelectItem value="0">Any capacity</SelectItem>
                        <SelectItem value="2">2+ people</SelectItem>
                        <SelectItem value="5">5+ people</SelectItem>
                        <SelectItem value="10">10+ people</SelectItem>
                        <SelectItem value="20">20+ people</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Status</label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                        <SelectValue placeholder="Any status" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                        <SelectItem value="any">Any status</SelectItem>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Facility Filter */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Facility</label>
                      {facilityFilter && facilityFilter !== "any" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-6 px-2 text-xs text-brand-teal-600 dark:text-brand-teal-400 hover:bg-brand-teal-50 dark:hover:bg-brand-teal-900/20"
                          onClick={() => setFacilityFilter("any")}
                        >
                          Clear
                        </Button>
                      )}
                    </div>
                    <Select value={facilityFilter} onValueChange={setFacilityFilter}>
                      <SelectTrigger className={cn(
                        "bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700", 
                        facilityFilter !== "any" && "border-brand-teal-500 dark:border-brand-teal-500"
                      )}>
                        <SelectValue placeholder="Any facility" />
                      </SelectTrigger>
                      <SelectContent className="bg-white dark:bg-brand-navy-800 border-brand-navy-200 dark:border-brand-navy-700">
                        <SelectItem value="any">Any facility</SelectItem>
                        {availableFacilities.length > 0 ? (
                          // Sort facilities alphabetically by name for better UX
                          [...availableFacilities]
                            .sort((a, b) => a.name.localeCompare(b.name))
                            .map(facility => (
                              <SelectItem key={facility.id} value={facility.id}>
                                {facility.name}
                              </SelectItem>
                            ))
                        ) : (
                          <div className="px-2 py-1.5 text-sm text-brand-navy-500 dark:text-brand-navy-400">
                            No facilities found
                          </div>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Resource Filters */}
                  <div className="space-y-3">
                    <Collapsible open={showResourceFilters} onOpenChange={setShowResourceFilters}>
                      <CollapsibleTrigger asChild>
                        <div className="flex items-center justify-between cursor-pointer hover:text-brand-teal-600 dark:hover:text-brand-teal-400">
                          <label className="text-sm font-medium text-brand-navy-700 dark:text-brand-navy-300">Resources</label>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-7 w-7 p-0 text-brand-navy-600 dark:text-brand-navy-400 hover:bg-brand-navy-100 dark:hover:bg-brand-navy-700"
                          >
                            {showResourceFilters ? 
                              <ChevronUp className="h-4 w-4" /> : 
                              <ChevronDown className="h-4 w-4" />
                            }
                          </Button>
                        </div>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pt-3">
                        <div className="grid grid-cols-1 gap-2.5 max-h-[200px] overflow-y-auto pr-1">
                          {resources.map((resource) => (
                            <div key={resource.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`resource-${resource.id}`}
                                checked={selectedResources.includes(resource.id)}
                                onCheckedChange={(checked) => 
                                  handleResourceCheckboxChange(resource.id, checked === true)
                                }
                                className="border-brand-navy-300 dark:border-brand-navy-600 data-[state=checked]:bg-brand-teal-500 data-[state=checked]:border-brand-teal-500"
                              />
                              <label 
                                htmlFor={`resource-${resource.id}`}
                                className="text-sm font-medium flex items-center gap-2 cursor-pointer text-brand-navy-700 dark:text-brand-navy-300 hover:text-brand-navy-900 dark:hover:text-brand-navy-100"
                              >
                                <ResourceIcon type={resource.type} name={resource.name} />
                                {resource.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>

                  {/* Active Filter Badges */}
                  {activeFiltersCount > 0 && (
                    <div className="pt-4 border-t border-brand-navy-200 dark:border-brand-navy-700">
                      <div className="flex flex-wrap gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive text-brand-navy-700 dark:text-brand-navy-300"
                          onClick={() => {
                            setSearchTerm("");
                            setCapacityFilter("");
                            setStatusFilter("any");
                            setFacilityFilter("any");
                            setSelectedResources([]);
                          }}
                        >
                          Clear all filters
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Active Filter Badges - horizontal scrolling row under search */}
          {activeFiltersCount > 0 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {searchTerm && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
                >
                  <span>Search: {searchTerm}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
                    onClick={() => setSearchTerm("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {capacityFilter && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
                >
                  <span>Min. capacity: {capacityFilter}+</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
                    onClick={() => setCapacityFilter("")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {statusFilter !== "any" && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
                >
                  <span>Status: {statusFilter}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
                    onClick={() => setStatusFilter("any")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {facilityFilter !== "any" && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
                >
                  <span>
                    Facility: {availableFacilities.find(f => f.id === facilityFilter)?.name || 'Unknown'}
                  </span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
                    onClick={() => setFacilityFilter("any")}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
              
              {selectedResources.length > 0 && (
                <Badge 
                  variant="outline" 
                  className="flex items-center gap-1 py-1 pl-2 pr-1 whitespace-nowrap border-brand-teal-200 dark:border-brand-teal-800 bg-brand-teal-50 dark:bg-brand-teal-900/20 text-brand-teal-800 dark:text-brand-teal-300"
                >
                  <span>Resources: {selectedResources.length}</span>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-5 w-5 p-0 rounded-full hover:bg-brand-teal-100 dark:hover:bg-brand-teal-800/50 text-brand-teal-700 dark:text-brand-teal-400"
                    onClick={() => setSelectedResources([])}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </Badge>
              )}
            </div>
          )}

          {/* Room Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.length > 0 ? (
              filteredRooms.map((room) => {
                // Find resource details for this room
                const roomResourceDetails = room.resources && Array.isArray(room.resources)
                  ? resources.filter(resource => room.resources!.includes(resource.id))
                  : room.resourceDetails || []

                return (
                  <RoomCard
                    key={room.id}
                    room={room}
                    resourceDetails={roomResourceDetails}
                    onBookRoom={handleBookRoom}
                    facilities={availableFacilities}
                    isAdminView={false}
                    autoOpenBookingModal={shouldRestoreBooking && restoredRoom?.id === room.id}
                    restoreBookingState={shouldRestoreBooking && restoredRoom?.id === room.id ? searchParams.get('state_id') || undefined : undefined}
                  />
                )
              })
            ) : (
              <div className="col-span-full p-8 text-center bg-brand-navy-50/30 dark:bg-brand-navy-800/30 rounded-lg border border-dashed border-brand-navy-200 dark:border-brand-navy-700">
                <h3 className="text-lg font-medium mb-2 text-brand-navy-900 dark:text-brand-navy-50">No rooms found</h3>
                <p className="text-brand-navy-700 dark:text-brand-navy-300">Try adjusting your filters to find available rooms.</p>
              </div>
            )}
          </div>
        </div>
      </div>
      )}
    </ProtectedRoute>
  )
}
