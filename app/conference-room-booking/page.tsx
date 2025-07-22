"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Users, MapPin, Search, Filter, Calendar, Clock, ChevronDown, ChevronUp } from "lucide-react"
import { ProtectedRoute } from "@/components/protected-route"
import { Checkbox } from "@/components/ui/checkbox"
import { ResourceIcon } from "@/components/ui/resource-icon"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { RoomCard } from "@/components/cards/room-card"
import { useToast } from "@/components/ui/use-toast"
import type { Room, Resource } from "@/types"
import { useAuth } from "@/contexts/auth-context"
import { eventBus, EVENTS } from "@/lib/events"
import { useRouter } from "next/navigation"

export default function ConferenceRoomBookingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [rooms, setRooms] = useState<Room[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [filteredRooms, setFilteredRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [capacityFilter, setCapacityFilter] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [selectedResources, setSelectedResources] = useState<string[]>([])
  const [showResourceFilters, setShowResourceFilters] = useState(false)
  const [userBookings, setUserBookings] = useState<any[]>([])

  useEffect(() => {
    fetchRooms()
    fetchResources()
    if (user?.id) {
      fetchUserBookings()
    }
  }, [user?.id])

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

  const fetchUserBookings = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/bookings/user?user_id=${user?.id}&timestamp=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
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
          if (room.resources && Array.isArray(room.resources)) {
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
            variant: "destructive"
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
      <div className="p-6 space-y-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Browse Rooms</h1>
              <p className="text-muted-foreground">Find and book the perfect space for your meeting</p>
        </div>
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
                          <ResourceIcon type={resource.type} name={resource.name} />
                          {resource.name}
                        </label>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>

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
                  />
                )
              })
            ) : (
              <div className="col-span-full p-8 text-center bg-muted/20 rounded-lg border border-dashed">
                <h3 className="text-lg font-medium mb-2">No rooms found</h3>
                <p className="text-muted-foreground">Try adjusting your filters to find available rooms.</p>
                </div>
              )}
          </div>
        </div>
      )}
    </ProtectedRoute>
  )
}
