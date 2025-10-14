"use client"

import React, { useEffect, useState, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { 
  Search, 
  Calendar, 
  Clock, 
  Building,
  Users, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  ArrowUpDown, 
 
  Eye, 
  Loader2,
  Ban,
  Trash2
} from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { getAllBookingsByFacilityManager } from "@/lib/supabase-data"
import { expirePendingBookings } from "@/lib/room-availability"
import type { BookingWithDetails } from "@/types"
import { format } from "date-fns"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { getRoomsByFacilityManager } from "@/lib/supabase-data"
import { FacilityManagerSkeleton } from "@/app/components/skeletons/facility-manager-skeleton"
import { FacilityManagerBookingDetailsModal } from "@/components/bookings/facility-manager-booking-details-modal"
import { useManagerRealtime } from "@/hooks/use-manager-realtime"
import { RealtimeStatusFull } from "@/components/realtime-status"

type SortField = "title" | "room" | "organizer" | "date" | "status"
type SortDirection = "asc" | "desc"
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled"

export default function BookingsManagementPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  // Helper function to check if a booking can be re-approved
  const canReapproveBooking = (booking: BookingWithDetails): boolean => {
    if (booking.status === "pending") return true
    if (booking.status === "cancelled") {
      // Only allow re-approval for cancelled bookings that start tomorrow or later
      const today = new Date()
      const tomorrow = new Date(today)
      tomorrow.setDate(today.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0) // Start of tomorrow
      
      const bookingDate = new Date(booking.start_time)
      const canReapprove = bookingDate >= tomorrow
      
      // Debug logging for cancelled bookings
      if (!canReapprove) {
        console.log(`🚫 Cannot re-approve cancelled booking "${booking.title}":`, {
          bookingDate: bookingDate.toLocaleDateString(),
          tomorrow: tomorrow.toLocaleDateString(),
          reason: 'Booking is today or in the past'
        })
      }
      
      return canReapprove
    }
    return false
  }
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const { toast } = useToast()
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null)
  const [rooms, setRooms] = useState<{ id: string; name: string }[]>([])
  const [roomFilter, setRoomFilter] = useState<string>("__all__")
  const [navigating, setNavigating] = useState<string | null>(null)
  const [newBookingsCount, setNewBookingsCount] = useState(0)

  // Refresh bookings data
  const refreshBookingsData = useCallback(async () => {
    if (!user) return
    try {
      console.log('🔄 [Bookings Page] Refreshing bookings data...')
      const bookingsData = await getAllBookingsByFacilityManager(user.id)
      setBookings(bookingsData)
      setFilteredBookings(bookingsData)
    } catch (err) {
      console.error("Error refreshing bookings data:", err)
    }
  }, [user])

  // Handle new booking requests in real-time
  const handleNewBooking = useCallback((booking: BookingWithDetails) => {
    console.log('📋 [Bookings Page] New booking request received:', booking)
    if (booking.status === 'pending') {
      // Add the new booking to the list immediately
      setBookings(prev => [booking, ...prev])

      // Show "new" badge indicator
      setNewBookingsCount(prev => prev + 1)

      // Show toast notification
      toast({
        title: "New Booking Request",
        description: `${booking.users?.name} has requested ${booking.rooms?.name}`,
        duration: 6000,
      })

      // Auto-hide the "new" badge after 10 seconds
      setTimeout(() => {
        setNewBookingsCount(prev => Math.max(0, prev - 1))
      }, 10000)
    }
  }, [toast])

  // Handle booking status changes in real-time
  const handleBookingStatusChange = useCallback((
    booking: BookingWithDetails,
    oldStatus: string,
    newStatus: string
  ) => {
    console.log(`📋 [Bookings Page] Booking status changed: ${oldStatus} → ${newStatus}`)

    // Update the booking in the list immediately
    setBookings(prev => prev.map(b => b.id === booking.id ? booking : b))
  }, [])

  // Set up real-time subscription
  useManagerRealtime({
    onNewBooking: handleNewBooking,
    onBookingStatusChange: handleBookingStatusChange,
    onBookingUpdate: refreshBookingsData,
    enabled: !!user,
  })

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    async function loadBookings() {
      if (!user) return

      try {
        setIsLoading(true)

        // First, expire any overdue pending bookings
        const expiration = await expirePendingBookings()

        if (expiration.expiredCount > 0) {
          toast({
            title: "Expired Bookings",
            description: `${expiration.expiredCount} pending booking(s) have been automatically expired.`,
            variant: "default"
          })
        }

        const bookingsData = await getAllBookingsByFacilityManager(user.id)
        setBookings(bookingsData)
        setFilteredBookings(bookingsData)
      } catch (err) {
        console.error("Failed to load bookings", err)
        setError("Failed to load bookings.")
      } finally {
        setIsLoading(false)
      }
    }
    loadBookings()
  }, [user, toast])

  useEffect(() => {
    async function loadRooms() {
      if (!user) return
      try {
        const roomsData = await getRoomsByFacilityManager(user.id)
        setRooms(roomsData.map(r => ({ id: r.id, name: r.name })))
      } catch (err) {
        console.error("Failed to load rooms", err)
      }
    }
    loadRooms()
  }, [user])

  useEffect(() => {
    // First filter by status
    let filtered = bookings
    if (statusFilter !== "all") {
      filtered = bookings.filter(booking => booking.status === statusFilter)
    }
    // Room filter
    if (roomFilter && roomFilter !== "__all__") {
      filtered = filtered.filter(booking => booking.rooms?.id === roomFilter)
    }
    
    // Then filter by search term
    filtered = filtered.filter((booking) => {
      return (
        booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.rooms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.users?.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    })
    
    // Sort the filtered bookings
    const sorted = [...filtered].sort((a, b) => {
      switch (sortField) {
        case "title":
          return sortDirection === "asc" 
            ? a.title.localeCompare(b.title)
            : b.title.localeCompare(a.title)
        case "room":
          return sortDirection === "asc"
            ? (a.rooms?.name || "").localeCompare(b.rooms?.name || "")
            : (b.rooms?.name || "").localeCompare(a.rooms?.name || "")
        case "organizer":
          return sortDirection === "asc"
            ? (a.users?.name || "").localeCompare(b.users?.name || "")
            : (b.users?.name || "").localeCompare(a.users?.name || "")
        case "date":
          return sortDirection === "asc"
            ? new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
            : new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
        case "status":
          return sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status)
        default:
          return 0
      }
    })
    
    setFilteredBookings(sorted)
  }, [searchTerm, bookings, sortField, sortDirection, statusFilter, roomFilter])

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("asc")
    }
  }

  const getSortIcon = (field: SortField) => {
    if (sortField === field) {
      return (
        <ArrowUpDown className={`ml-1 h-4 w-4 ${sortDirection === "asc" ? "transform rotate-180" : ""}`} />
      )
    }
    return null
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return {
          icon: CheckCircle,
          className: "bg-success/10 text-success ring-1 ring-success/20",
          text: "Confirmed"
        }
      case "pending":
        return {
          icon: AlertCircle,
          className: "bg-warning/10 text-warning ring-1 ring-warning/20",
          text: "Pending"
        }
      case "cancelled":
        return {
          icon: XCircle,
          className: "bg-destructive/10 text-destructive ring-1 ring-destructive/20",
          text: "Cancelled"
        }
      default:
        return {
          icon: AlertCircle,
          className: "bg-muted/10 text-muted-foreground ring-1 ring-muted/20",
          text: status
        }
    }
  }

  const openConfirmDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setConfirmDialogOpen(true)
  }

  const openRejectDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setRejectDialogOpen(true)
  }

  const openCancelDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setCancelDialogOpen(true)
  }

  const openDeleteDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setDeleteDialogOpen(true)
  }

  const handleUpdateStatus = async (newStatus: "confirmed" | "cancelled") => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      console.log(`📋 [Bookings Page] Updating booking ${selectedBookingId} to status: ${newStatus}`);
      console.log(`👤 [Bookings Page] Current user ID: ${user?.id}`);
      
      // Use API route instead of direct function call
      const requestData: any = { status: newStatus }
      if (newStatus === "cancelled" && rejectionReason.trim()) {
        requestData.rejection_reason = rejectionReason.trim()
      }
      
      const response = await fetch(`/api/bookings/${selectedBookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update booking'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('❌ [Bookings Page] Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      let responseData
      try {
        responseData = await response.json()
      } catch (parseError) {
        console.error('❌ [Bookings Page] Failed to parse success response:', parseError)
        throw new Error('Server returned invalid response')
      }
      console.log(`📋 [Bookings Page] Update result:`, responseData);
      
      // Update the bookings state
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBookingId) {
          return { ...booking, status: newStatus }
        }
        return booking
      })
      
      setBookings(updatedBookings)
      setFilteredBookings(updatedBookings)
      
      toast({
        title: `Booking ${newStatus === "confirmed" ? "Approved" : "Rejected"}`,
        description: `The booking has been ${newStatus === "confirmed" ? "approved" : "rejected"} successfully.`,
        variant: newStatus === "confirmed" ? "default" : "destructive",
      })
      
      console.log(`✅ [Bookings Page] Successfully updated booking ${selectedBookingId} to ${newStatus}`);
    } catch (error: any) {
      console.error(`❌ [Bookings Page] Error ${newStatus === "confirmed" ? "approving" : "rejecting"} booking:`, error)
      toast({
        title: "Error",
        description: error.message || `Failed to ${newStatus === "confirmed" ? "approve" : "reject"} booking. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setConfirmDialogOpen(false)
      setRejectDialogOpen(false)
      setRejectionReason("") // Reset rejection reason
    }
  }

  const handleCancelBooking = async () => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      console.log(`📋 [Bookings Page] Canceling booking ${selectedBookingId}`);
      console.log(`👤 [Bookings Page] Current user ID: ${user?.id}`);
      
      // Use API route to update booking status to cancelled
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'cancelled' }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to cancel booking')
      }
      
      const updatedBooking = await response.json()
      console.log(`📋 [Bookings Page] Cancel result:`, updatedBooking);
      
      // Update the bookings state
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBookingId) {
          return { ...booking, status: 'cancelled' as const }
        }
        return booking
      })
      
      setBookings(updatedBookings)
      setFilteredBookings(updatedBookings)
      
      toast({
        title: "Booking Cancelled",
        description: "The booking has been cancelled successfully.",
        variant: "destructive",
      })
      
      console.log(`✅ [Bookings Page] Successfully cancelled booking ${selectedBookingId}`);
    } catch (error: any) {
      console.error(`❌ [Bookings Page] Error cancelling booking:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to cancel booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setCancelDialogOpen(false)
    }
  }

  const handleDeleteBooking = async () => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      console.log(`📋 [Bookings Page] Deleting booking ${selectedBookingId}`);
      console.log(`👤 [Bookings Page] Current user ID: ${user?.id}`);
      
      // Delete the booking from database
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
        },
      })
      
      if (!response.ok) {
        let errorMsg = "Failed to delete booking";
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch {}
        throw new Error(errorMsg)
      }
      
      // Remove the booking from state
      const updatedBookings = bookings.filter(booking => booking.id !== selectedBookingId)
      
      setBookings(updatedBookings)
      setFilteredBookings(updatedBookings)
      
      toast({
        title: "Booking Deleted",
        description: "The booking has been deleted successfully.",
        variant: "default",
      })
      
      console.log(`✅ [Bookings Page] Successfully deleted booking ${selectedBookingId}`);
    } catch (error: any) {
      console.error(`❌ [Bookings Page] Error deleting booking:`, error)
      toast({
        title: "Error",
        description: error.message || "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setDeleteDialogOpen(false)
    }
  }

  const openDetailsModal = (booking: BookingWithDetails) => {
    setSelectedBooking(booking)
    setDetailsModalOpen(true)
  }

  const navigateToBookingDetails = (bookingId: string) => {
    setNavigating(bookingId)
    router.push(`/facility-manager/bookings/${bookingId}`)
  }

  // Calculate stats
  const pendingBookings = bookings.filter(b => b.status === "pending").length;
  const confirmedBookings = bookings.filter(b => b.status === "confirmed").length;
  const cancelledBookings = bookings.filter(b => b.status === "cancelled").length;
  
  // Get today's bookings
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const todayBookings = bookings.filter(b => {
    const bookingDate = new Date(b.start_time);
    return bookingDate >= today && bookingDate < tomorrow && b.status === "confirmed";
  }).length;

  if (isLoading) {
    return <FacilityManagerSkeleton />
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="space-y-6 lg:space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl lg:text-3xl font-bold tracking-tight">Booking Management</h2>
          <p className="text-muted-foreground mt-1">Manage all bookings for your facility</p>
        </div>
        <div className="flex items-center gap-4">
          <RealtimeStatusFull className="text-sm" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-blue-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
              <Calendar className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-green-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Approved bookings</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{pendingBookings}</div>
              {newBookingsCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  +{newBookingsCount} new
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <div className="h-1.5 bg-purple-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
              <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">Today's bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div className="flex-1">
              <CardTitle className="text-xl">All Bookings</CardTitle>
              <CardDescription className="mt-1">
                View and manage all bookings for your facility. Click on a booking card to view detailed analytics, or use the eye icon for quick preview.
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
              <div className="flex items-center gap-2 flex-wrap">
                <Button 
                  variant={statusFilter === "all" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                  className="flex-1 sm:flex-none"
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === "pending" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                  className="flex-1 sm:flex-none"
                >
                  Pending
                </Button>
                <Button 
                  variant={statusFilter === "confirmed" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setStatusFilter("confirmed")}
                  className="flex-1 sm:flex-none"
                >
                  Confirmed
                </Button>
                <Button 
                  variant={statusFilter === "cancelled" ? "secondary" : "ghost"} 
                  size="sm"
                  onClick={() => setStatusFilter("cancelled")}
                  className="flex-1 sm:flex-none"
                >
                  Cancelled
                </Button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 w-full"
                  />
                </div>
                <div className="flex-1 sm:w-48">
                  <Select value={roomFilter} onValueChange={setRoomFilter}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__all__">All Rooms</SelectItem>
                      {rooms.map(room => (
                        <SelectItem key={room.id} value={room.id}>{room.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
                <Calendar className="h-6 w-6 text-slate-500" />
              </div>
              <h3 className="text-lg font-medium mb-1">No Bookings Found</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm
                  ? "No bookings match your search criteria. Try adjusting your search."
                  : statusFilter !== "all"
                  ? `No ${statusFilter} bookings found.`
                  : "No bookings have been created yet."}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid gap-4 md:hidden">
                {filteredBookings.map((booking) => (
                  <Card 
                    key={booking.id} 
                    className={cn(
                      "overflow-hidden cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                      navigating === booking.id && "opacity-50 pointer-events-none"
                    )}
                    onClick={() => navigateToBookingDetails(booking.id)}
                  >
                    <CardHeader className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <CardTitle className="text-base font-semibold leading-tight truncate">{booking.title}</CardTitle>
                          <CardDescription className="text-xs mt-1">
                            {booking.rooms?.name || "Unknown Room"}
                          </CardDescription>
                          <div className="text-xs text-muted-foreground mt-1">
                            Tap card for full details
                          </div>
                        </div>
                        <Badge className={cn("flex w-fit items-center gap-1 text-xs", getStatusConfig(booking.status).className)}>
                          {React.createElement(getStatusConfig(booking.status).icon, { className: "h-3 w-3" })}
                          <span>{getStatusConfig(booking.status).text}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                      <div className="text-sm text-muted-foreground space-y-2">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          <span>{booking.users?.name || "Unknown User"}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>{format(new Date(booking.start_time), "MMM d, yyyy")}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-0.5 pt-2 border-t border-border -mx-4 px-4">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDetailsModal(booking)
                                }} 
                                className="h-7 w-7 hover:bg-blue-50"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>
                          {canReapproveBooking(booking) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openConfirmDialog(booking.id)
                                  }} 
                                  className="h-7 w-7 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Approve Booking</TooltipContent>
                            </Tooltip>
                          )}
                          {booking.status === "pending" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openRejectDialog(booking.id)
                                  }} 
                                  className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Reject Booking</TooltipContent>
                            </Tooltip>
                          )}
                          {booking.status === "confirmed" && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openCancelDialog(booking.id)
                                  }} 
                                  className="h-7 w-7 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                >
                                  <Ban className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Cancel Booking</TooltipContent>
                            </Tooltip>
                          )}
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openDeleteDialog(booking.id)
                                }} 
                                className="h-7 w-7 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete Booking</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {/* Loading indicator for navigation */}
              {navigating && (
                <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
                  <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg flex items-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin" />
                    <span>Loading booking details...</span>
                  </div>
                </div>
              )}

              {/* Desktop View - Table */}
              <div className="hidden md:block rounded-md border overflow-hidden">
                <ScrollArea className="h-[500px] relative">
                  <Table>
                    <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[250px] cursor-pointer" onClick={() => toggleSort("title")}>
                          <div className="flex items-center">Booking{getSortIcon("title")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("room")}>
                          <div className="flex items-center">Room{getSortIcon("room")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("organizer")}>
                          <div className="flex items-center">Organizer{getSortIcon("organizer")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
                          <div className="flex items-center">Date & Time{getSortIcon("date")}</div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                          <div className="flex items-center">Status{getSortIcon("status")}</div>
                        </TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredBookings.map((booking) => (
                        <TableRow 
                          key={booking.id} 
                          className={cn(
                            "hover:bg-slate-50 dark:hover:bg-slate-900/50 cursor-pointer transition-colors",
                            navigating === booking.id && "opacity-50 pointer-events-none"
                          )}
                          onClick={() => navigateToBookingDetails(booking.id)}
                        >
                          <TableCell className="font-medium">
                            <div className="truncate max-w-[180px]">{booking.title}</div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Building className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.rooms?.name || "Unknown Room"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{booking.users?.name || "Unknown User"}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{format(new Date(booking.start_time), "MMM d, yyyy")}</span>
                              <span className="text-xs text-muted-foreground">{format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn("flex w-fit items-center gap-1", getStatusConfig(booking.status).className)}>
                              {React.createElement(getStatusConfig(booking.status).icon, { className: "h-3 w-3" })}
                              <span>{getStatusConfig(booking.status).text}</span>
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {(booking as any).total_cost ? (
                              <div className="text-sm">
                                <span className="font-medium text-green-700 dark:text-green-400">
                                  GH₵ {((booking as any).total_cost as number).toFixed(2)}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">—</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDetailsModal(booking)
                                      }} 
                                      className="h-7 w-7 hover:bg-blue-50"
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>View Details</TooltipContent>
                                </Tooltip>
                                {canReapproveBooking(booking) && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openConfirmDialog(booking.id)
                                        }} 
                                        className="h-7 w-7 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950"
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Approve Booking</TooltipContent>
                                  </Tooltip>
                                )}
                                {booking.status === "pending" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openRejectDialog(booking.id)
                                        }} 
                                        className="h-7 w-7 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-950"
                                      >
                                        <XCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reject Booking</TooltipContent>
                                  </Tooltip>
                                )}
                                {booking.status === "confirmed" && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          openCancelDialog(booking.id)
                                        }} 
                                        className="h-7 w-7 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                      >
                                        <Ban className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Cancel Booking</TooltipContent>
                                  </Tooltip>
                                )}
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        openDeleteDialog(booking.id)
                                      }} 
                                      className="h-7 w-7 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Delete Booking</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Confirm Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this booking? This will confirm the room reservation and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("confirmed")
              }}
              disabled={processingStatus}
              className="bg-green-500 hover:bg-green-600 focus:ring-green-500"
            >
              {processingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Approve Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={(open) => {
        setRejectDialogOpen(open)
        if (!open) setRejectionReason("") // Reset when closing
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this booking? Please provide a reason for rejection to help the organizer understand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="rejection-reason" className="text-sm font-medium text-foreground mb-2 block">
              Reason for rejection (optional)
            </label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejecting this booking..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px]"
              disabled={processingStatus}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("cancelled")
              }}
              disabled={processingStatus}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {processingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Reject Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <FacilityManagerBookingDetailsModal
        booking={selectedBooking}
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        onApprove={async (bookingId: string) => {
          if (!user) return
          try {
            const token = localStorage.getItem("auth-token")
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                status: 'confirmed',
                userId: user.id
              })
            })
            
            if (response.ok) {
              // Reload bookings after successful update
              const bookingsData = await getAllBookingsByFacilityManager(user.id)
              setBookings(bookingsData)
              setFilteredBookings(bookingsData)
            }
          } catch (error) {
            console.error('Error approving booking:', error)
          }
        }}
        onReject={async (bookingId: string, reason: string) => {
          if (!user) return
          try {
            const token = localStorage.getItem("auth-token")
            const response = await fetch(`/api/bookings/${bookingId}/status`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({
                status: 'cancelled',
                userId: user.id,
                rejectionReason: reason
              })
            })
            
            if (response.ok) {
              // Reload bookings after successful update
              const bookingsData = await getAllBookingsByFacilityManager(user.id)
              setBookings(bookingsData)
              setFilteredBookings(bookingsData)
            }
          } catch (error) {
            console.error('Error rejecting booking:', error)
          }
        }}
      />

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this confirmed booking? This will make the room available again and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel Action</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleCancelBooking()
              }}
              disabled={processingStatus}
              className="bg-orange-500 hover:bg-orange-600 focus:ring-orange-500"
            >
              {processingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Cancel Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this booking? This action cannot be undone and will remove all booking data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleDeleteBooking()
              }}
              disabled={processingStatus}
              className="bg-red-500 hover:bg-red-600 focus:ring-red-500"
            >
              {processingStatus ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Booking"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
