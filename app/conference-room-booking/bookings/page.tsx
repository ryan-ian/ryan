"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Search, Filter, Plus, Eye, Edit, Trash2, Building, CheckCircle, AlertCircle, XCircle, Loader2, RefreshCw } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { Booking, Room } from "@/types"
import { BookingDetailsModal } from "./booking-details-modal"
import { DeleteBookingDialog } from "./delete-booking-dialog"
import { useToast } from "@/components/ui/use-toast"
import { eventBus, EVENTS } from "@/lib/events"

export default function BookingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookings, setBookings] = useState<Booking[]>([])
  const [rooms, setRooms] = useState<Room[]>([])
  const [filteredBookings, setFilteredBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [dateFilter, setDateFilter] = useState("all")
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key to force re-render
  
  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [bookingStatusToCancel, setBookingStatusToCancel] = useState<"pending" | "confirmed">("pending")
  const [isCancelling, setIsCancelling] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)

  // Subscribe to global booking events
  useEffect(() => {
    // Subscribe to booking created/updated/deleted events
    const unsubscribeCreated = eventBus.subscribe(EVENTS.BOOKING_CREATED, () => {
      console.log("Booking created event received, refreshing...")
      forceRefresh()
    })
    
    const unsubscribeUpdated = eventBus.subscribe(EVENTS.BOOKING_UPDATED, () => {
      console.log("Booking updated event received, refreshing...")
      forceRefresh()
    })
    
    const unsubscribeDeleted = eventBus.subscribe(EVENTS.BOOKING_DELETED, () => {
      console.log("Booking deleted event received, refreshing...")
      forceRefresh()
    })
    
    // Clean up subscriptions
    return () => {
      unsubscribeCreated()
      unsubscribeUpdated()
      unsubscribeDeleted()
    }
  }, [])

  useEffect(() => {
    fetchBookings()
    fetchRooms()
  }, [user?.id, refreshKey]) // Add refreshKey to dependencies to force refresh

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, dateFilter])

  // Force a refresh by incrementing the refresh key
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1)
  }

  const fetchBookings = async () => {
    try {
      // Check if we have a user and token before proceeding
      const token = localStorage.getItem("auth-token")
      if (!token || !user?.id) {
        console.log("Skipping fetchBookings: No token or user ID available")
        return
      }
      
      setLoading(true)
      
      // Use the user-specific bookings endpoint with cache-busting
      const response = await fetch(`/api/bookings/user?user_id=${user.id}&timestamp=${Date.now()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch bookings: ${response.status} ${response.statusText}`);
      }
      
      const bookingsData = await response.json()
      
      // Ensure bookingsData is an array before setting state
      if (Array.isArray(bookingsData)) {
        setBookings(bookingsData)
        console.log("Fetched bookings:", bookingsData.length)
      } else {
        console.error("Received non-array bookings data:", bookingsData)
        // Set to empty array if response is not an array
        setBookings([])
        
        // Show error toast if there's an error message in the response
        if (bookingsData.error) {
          toast({
            title: "Error fetching bookings",
            description: bookingsData.error,
            variant: "destructive"
          })
        }
      }
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
      setBookings([]) // Ensure bookings is always an array
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch bookings",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  

  const fetchRooms = async () => {
    try {
      const response = await fetch("/api/rooms")
      const roomsData = await response.json()
      const roomsArray = Array.isArray(roomsData) ? roomsData : roomsData.rooms || []
      setRooms(roomsArray)
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    }
  }
  
  const filterBookings = () => {
    // Ensure bookings is an array before filtering
    if (!Array.isArray(bookings)) {
      console.error("bookings is not an array in filterBookings:", bookings);
      setFilteredBookings([]);
      return;
    }
    
    let filtered = [...bookings];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getRoomName(booking.room_id).toLowerCase().includes(searchTerm.toLowerCase()),
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= today && bookingDate < new Date(today.getTime() + 24 * 60 * 60 * 1000)
          })
          break
        case "upcoming":
          filtered = filtered.filter((booking) => new Date(booking.start_time) > now)
          break
        case "past":
          filtered = filtered.filter((booking) => new Date(booking.start_time) < now)
          break
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    setFilteredBookings(filtered)
  }

  const getRoomName = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    return room?.name || `Room ${roomId}`
  }

  const getRoomLocation = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId)
    return room?.location || "Unknown location"
  }

  const getRoom = (roomId: string) => {
    return rooms.find((r) => r.id === roomId) || null
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800 border-green-300"
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-300"
      case "cancelled":
        return "bg-red-100 text-red-800 border-red-300"
      default:
        return "bg-gray-100 text-gray-800 border-gray-300"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle className="h-3 w-3" />
      case "pending":
        return <AlertCircle className="h-3 w-3" />
      case "cancelled":
        return <XCircle className="h-3 w-3" />
      default:
        return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "confirmed":
        return "This booking has been approved by an administrator."
      case "pending":
        return "This booking is awaiting administrator approval."
      case "cancelled":
        return "This booking has been cancelled or rejected."
      default:
        return ""
    }
  }

  const getBookingStats = () => {
    // Ensure bookings is an array before using filter
    if (!Array.isArray(bookings)) {
      console.error("bookings is not an array:", bookings);
      return {
        total: 0,
        upcoming: 0,
        today: 0,
        pending: 0,
      };
    }
    
    const now = new Date()
    const upcoming = bookings.filter((b) => new Date(b.start_time) > now && b.status === "confirmed")
    const today = bookings.filter((b) => {
      const bookingDate = new Date(b.start_time)
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
      return bookingDate >= todayStart && bookingDate < todayEnd && b.status === "confirmed"
    })

    return {
      total: bookings.length,
      upcoming: upcoming.length,
      today: today.length,
      pending: bookings.filter((b) => b.status === "pending").length,
    }
  }

  // Handle opening the booking details modal
  const handleViewBooking = (booking: Booking) => {
    setSelectedBooking(booking)
    setIsDetailsModalOpen(true)
  }

  // Handle initiating booking deletion
  const handleCancelClick = (bookingId: string, status: "pending" | "confirmed") => {
    setBookingToCancel(bookingId)
    setBookingStatusToCancel(status)
    setIsCancelDialogOpen(true)
  }

  // Handle confirming booking deletion
  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return

    setIsCancelling(true)

    try {
      // Use DELETE to permanently remove the booking
      const response = await fetch(`/api/bookings/${bookingToCancel}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json"
        }
      })

      if (!response.ok) {
        let errorMessage = "Failed to delete booking"
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error("Failed to parse error response:", parseError)
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      console.log("Booking deleted successfully:", result)

      // Remove the booking from the local state
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== bookingToCancel)
      )

      // If the deleted booking is currently selected in the modal, close it
      if (selectedBooking && selectedBooking.id === bookingToCancel) {
        setIsDetailsModalOpen(false)
        setSelectedBooking(null)
      }
      
      // Trigger global event for booking deletion
      eventBus.publish(EVENTS.BOOKING_DELETED)

      toast({
        title: "Booking Deleted",
        description: "Your booking has been deleted successfully.",
      })
    } catch (error) {
      console.error("Error cancelling booking:", error)
      toast({
        title: "Error",
        description: "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCancelling(false)
      setIsCancelDialogOpen(false)
      setBookingToCancel(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const stats = getBookingStats()

  return (
    <div className="p-6 space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 mb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">View and manage your room bookings</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => fetchBookings()}
            disabled={loading}
            className="flex-1 sm:flex-auto"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
                <span className="sm:inline">Refreshing...</span>
                <span className="inline sm:hidden">...</span>
              </>
            ) : (
              <>
                <RefreshCw className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                <span className="sm:inline">Refresh</span>
                <span className="inline sm:hidden">Refresh</span>
              </>
            )}
          </Button>
          <Link href="/conference-room-booking" className="flex-1 sm:flex-auto">
            <Button size="sm" className="w-full">
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
              <span className="sm:inline">Browse Rooms</span>
              <span className="inline sm:hidden">Rooms</span>
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Total</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Today</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-3 sm:p-4">
            <CardTitle className="text-xs sm:text-sm font-medium">Pending</CardTitle>
            <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="p-3 sm:p-4 pt-0">
            <div className="text-xl sm:text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters Button and Collapsible Panel */}
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          <Badge className="ml-2">{
            (searchTerm ? 1 : 0) + 
            (statusFilter !== 'all' ? 1 : 0) + 
            (dateFilter !== 'all' ? 1 : 0)
          }</Badge>
        </Button>

        {isFilterOpen && (
          <Card className="mt-4 animate-in fade-in-50 slide-in-from-top-5 duration-300">
            <CardContent className="pt-6">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search bookings..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Date Range</label>
                  <Select value={dateFilter} onValueChange={setDateFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All dates" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All dates</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="past">Past</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
      </div>

      {/* Bookings List */}
      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                    <h3 className="font-semibold text-sm sm:text-base">{booking.title || "Meeting"}</h3>
                    <Badge className={getStatusColor(booking.status)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{getRoomName(booking.room_id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span className="truncate">{getRoomLocation(booking.room_id)}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                      <span>
                        {booking.start_time
                          ? new Date(booking.start_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : booking.start_time}{" "}
                        -{" "}
                        {booking.end_time
                          ? new Date(booking.end_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : booking.end_time}
                      </span>
                    </div>
                  </div>

                  {booking.description && <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">{booking.description}</p>}
                  
                  <p className="text-xs italic text-muted-foreground">{getStatusText(booking.status)}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 sm:ml-4 sm:flex-col sm:items-end">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewBooking(booking)}
                    className="flex-1 sm:flex-auto w-full sm:w-auto"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {booking.status === "pending" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                      className="flex-1 sm:flex-auto w-full sm:w-auto"
                    >
                      <Link href={`/conference-room-booking/bookings/${booking.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  )}
                  {(booking.status === "pending" || booking.status === "confirmed") && (() => {
                    const now = new Date()
                    const startTime = new Date(booking.start_time)
                    const hoursUntilMeeting = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60)
                    
                    let canCancel = false
                    let disabledReason = ""
                    
                    if (booking.status === "pending") {
                      // Pending bookings can always be cancelled
                      canCancel = true
                    } else if (booking.status === "confirmed") {
                      // Confirmed bookings can be cancelled up to 24 hours before
                      canCancel = hoursUntilMeeting >= 24
                      disabledReason = hoursUntilMeeting < 0 
                        ? "Cannot cancel booking after it has started"
                        : "Cannot cancel confirmed booking less than 24 hours before start time"
                    }
                    
                    return (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleCancelClick(booking.id, booking.status as "pending" | "confirmed")}
                        disabled={!canCancel}
                        title={!canCancel ? disabledReason : `Delete this ${booking.status} booking`}
                        className="flex-1 sm:flex-auto w-full sm:w-auto"
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        {canCancel ? "Delete" : "Cannot Delete"}
                      </Button>
                    )
                  })()}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-8 sm:py-12">
            <Calendar className="h-10 w-10 sm:h-12 sm:w-12 text-muted-foreground mx-auto mb-3 sm:mb-4" />
            <h3 className="text-base sm:text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {bookings.length === 0
                ? "You haven't made any bookings yet."
                : "Try adjusting your filters to find more bookings."}
            </p>
            <Button asChild>
              <Link href="/conference-room-booking">
                <Plus className="h-4 w-4 mr-2" />
                Browse Available Rooms
              </Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModal
        booking={selectedBooking}
        room={selectedBooking ? getRoom(selectedBooking.room_id) : null}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCancel={handleCancelClick}
      />

      {/* Delete Booking Confirmation Dialog */}
      <DeleteBookingDialog 
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
        isLoading={isCancelling}
        bookingStatus={bookingStatusToCancel}
      />
    </div>
  )
}
