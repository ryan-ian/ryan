"use client"

import { useEffect, useState } from "react"
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
import { getAllBookingsByFacilityManager } from "@/lib/supabase-data"
import type { BookingWithDetails } from "@/types"
import { format } from "date-fns"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { getRoomsByFacilityManager } from "@/lib/supabase-data"

type SortField = "title" | "room" | "organizer" | "date" | "status"
type SortDirection = "asc" | "desc"
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled"

export default function BookingsManagementPage() {
  const { user } = useAuth()
  
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

  useEffect(() => {
    async function loadBookings() {
      if (!user) return

      try {
        setIsLoading(true)
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
  }, [user])

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

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default"
      case "pending":
        return "secondary"
      case "cancelled":
        return "destructive"
      default:
        return "outline"
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
    return <div>Loading...</div>
  }

  if (error) {
    return <div>{error}</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight mb-1">Booking Management</h2>
          <p className="text-muted-foreground">Manage all bookings for your facility</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
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
            <div className="text-2xl font-bold">{pendingBookings}</div>
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
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>View and manage all bookings for your facility</CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <div className="flex gap-2">
                <Button 
                  variant={statusFilter === "all" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("all")}
                >
                  All
                </Button>
                <Button 
                  variant={statusFilter === "pending" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("pending")}
                >
                  Pending
                </Button>
                <Button 
                  variant={statusFilter === "confirmed" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("confirmed")}
                >
                  Confirmed
                </Button>
                <Button 
                  variant={statusFilter === "cancelled" ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setStatusFilter("cancelled")}
                >
                  Cancelled
                </Button>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search bookings..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="w-full sm:w-64">
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
            <div className="rounded-md border overflow-hidden">
              <ScrollArea className="h-[500px]">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-slate-900 sticky top-0">
                    <TableRow>
                      <TableHead className="w-[250px] cursor-pointer" onClick={() => toggleSort("title")}>
                        <div className="flex items-center">
                          Booking
                          {getSortIcon("title")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("room")}>
                        <div className="flex items-center">
                          Room
                          {getSortIcon("room")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("organizer")}>
                        <div className="flex items-center">
                          Organizer
                          {getSortIcon("organizer")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
                        <div className="flex items-center">
                          Date & Time
                          {getSortIcon("date")}
                        </div>
                      </TableHead>
                      <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                        <div className="flex items-center">
                          Status
                          {getSortIcon("status")}
                        </div>
                      </TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.map((booking) => (
                      <TableRow key={booking.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/50">
                        <TableCell className="font-medium">
                          <div className="truncate max-w-[250px]">{booking.title}</div>
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
                            <span className="font-medium">
                              {format(new Date(booking.start_time), "MMM d, yyyy")}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(booking.start_time), "h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(booking.status)} className="flex w-fit items-center gap-1">
                            {getStatusIcon(booking.status)}
                            <span className="capitalize">{booking.status}</span>
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 flex-wrap">
                            {/* View Details Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDetailsModal(booking)}
                              className="h-8 px-2"
                            >
                              <Eye className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">View</span>
                            </Button>

                            {/* Approve Button */}
                            {canReapproveBooking(booking) && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openConfirmDialog(booking.id)}
                                className="h-8 px-2 text-green-600 border-green-200 hover:bg-green-50 dark:text-green-400 dark:border-green-800 dark:hover:bg-green-950"
                              >
                                <CheckCircle className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Approve</span>
                              </Button>
                            )}

                            {/* Reject Button */}
                            {booking.status === "pending" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openRejectDialog(booking.id)}
                                className="h-8 px-2 text-amber-600 border-amber-200 hover:bg-amber-50 dark:text-amber-400 dark:border-amber-800 dark:hover:bg-amber-950"
                              >
                                <XCircle className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Reject</span>
                              </Button>
                            )}

                            {/* Cancel Button */}
                            {booking.status === "confirmed" && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => openCancelDialog(booking.id)}
                                className="h-8 px-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                              >
                                <Ban className="h-4 w-4 sm:mr-1" />
                                <span className="hidden sm:inline">Cancel</span>
                              </Button>
                            )}

                            {/* Delete Button */}
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => openDeleteDialog(booking.id)}
                              className="h-8 px-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950"
                            >
                              <Trash2 className="h-4 w-4 sm:mr-1" />
                              <span className="hidden sm:inline">Delete</span>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
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

      <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Details for this meeting booking.
            </DialogDescription>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <span className="font-semibold">Title:</span> {selectedBooking.title}
              </div>
              <div>
                <span className="font-semibold">Room:</span> {selectedBooking.rooms?.name} ({selectedBooking.rooms?.location})
              </div>
              <div>
                <span className="font-semibold">Organizer:</span> {selectedBooking.users?.name} ({selectedBooking.users?.email})
              </div>
              <div>
                <span className="font-semibold">Date:</span> {format(new Date(selectedBooking.start_time), "MMM d, yyyy")}
              </div>
              <div>
                <span className="font-semibold">Time:</span> {format(new Date(selectedBooking.start_time), "h:mm a")} - {format(new Date(selectedBooking.end_time), "h:mm a")}
              </div>
              <div>
                <span className="font-semibold">Status:</span> <Badge variant={getStatusBadgeVariant(selectedBooking.status)}>{selectedBooking.status}</Badge>
              </div>
              {selectedBooking.description && (
                <div>
                  <span className="font-semibold">Description:</span> {selectedBooking.description}
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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