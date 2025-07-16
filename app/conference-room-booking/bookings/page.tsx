"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Clock, MapPin, Search, Filter, Plus, Eye, Edit, Trash2, Building, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { Booking, Room } from "@/types"
import { BookingDetailsModal } from "./booking-details-modal"
import { CancelBookingDialog } from "./cancel-booking-dialog"
import { useToast } from "@/components/ui/use-toast"

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
  
  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    fetchBookings()
    fetchRooms()
  }, [])

  useEffect(() => {
    filterBookings()
  }, [bookings, searchTerm, statusFilter, dateFilter])

  const fetchBookings = async () => {
    try {
      // Get the auth token from localStorage
      const token = localStorage.getItem("auth-token")
      
      // Use the user-specific bookings endpoint
      const response = await fetch(`/api/bookings/user?user_id=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      })
      
      const bookingsData = await response.json()
      
      // Set the bookings directly from the response
      // No need to filter by user since the API already returns user-specific bookings
      setBookings(bookingsData)
    } catch (error) {
      console.error("Failed to fetch bookings:", error)
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
    let filtered = bookings

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

  // Handle initiating booking cancellation
  const handleCancelClick = (bookingId: string) => {
    setBookingToCancel(bookingId)
    setIsCancelDialogOpen(true)
  }

  // Handle confirming booking cancellation
  const handleCancelConfirm = async () => {
    if (!bookingToCancel) return

    setIsCancelling(true)

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/bookings/${bookingToCancel}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to cancel booking")
      }

      // Update the booking in the local state
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking.id === bookingToCancel 
            ? { ...booking, status: "cancelled" } 
            : booking
        )
      )

      // If the cancelled booking is currently selected in the modal, update it
      if (selectedBooking && selectedBooking.id === bookingToCancel) {
        setSelectedBooking({ ...selectedBooking, status: "cancelled" })
      }

      toast({
        title: "Booking Cancelled",
        description: "Your booking has been cancelled successfully.",
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
          <p className="text-muted-foreground">Manage your conference room reservations</p>
        </div>
        <Button asChild>
          <Link href="/conference-room-booking/bookings/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span>New Booking</span>
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.today}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcoming}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{booking.title || "Meeting"}</h3>
                    <Badge className={getStatusColor(booking.status)} variant="secondary">
                      <span className="flex items-center gap-1">
                        {getStatusIcon(booking.status)}
                        {booking.status}
                      </span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      <span>{getRoomName(booking.room_id)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{getRoomLocation(booking.room_id)}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(booking.start_time).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
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

                  {booking.description && <p className="text-sm text-muted-foreground">{booking.description}</p>}
                  
                  <p className="text-xs italic text-muted-foreground mt-2">{getStatusText(booking.status)}</p>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleViewBooking(booking)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  {booking.status === "pending" && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      asChild
                    >
                      <Link href={`/conference-room-booking/bookings/${booking.id}/edit`}>
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Link>
                    </Button>
                  )}
                  {(booking.status === "pending" || booking.status === "confirmed") && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelClick(booking.id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredBookings.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No bookings found</h3>
            <p className="text-muted-foreground mb-4">
              {bookings.length === 0
                ? "You haven't made any bookings yet."
                : "Try adjusting your filters to find more bookings."}
            </p>
            <Button asChild>
              <Link href="/conference-room-booking/bookings/new">
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Booking
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

      {/* Cancel Booking Confirmation Dialog */}
      <CancelBookingDialog
        isOpen={isCancelDialogOpen}
        isLoading={isCancelling}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}
