"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Calendar, Clock, MapPin, Users, CheckCircle, XCircle, AlertCircle, ArrowUpDown, Trash2 } from "lucide-react"
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
import type { BookingWithDetails } from "@/types"
import { toast } from "@/components/ui/use-toast"

type SortField = "title" | "room" | "organizer" | "date" | "duration" | "status"
type SortDirection = "asc" | "desc"

export default function BookingManagement() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>("date")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const bookingsRes = await fetch("/api/bookings", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
          },
        })

        const bookingsData = await bookingsRes.json()
        setBookings(bookingsData)
        setFilteredBookings(bookingsData)
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  useEffect(() => {
    const filtered = bookings.filter((booking) => {
      return (
        booking.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.rooms?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.users?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.status.toLowerCase().includes(searchTerm.toLowerCase())
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
        case "duration":
          const aDuration = new Date(a.end_time).getTime() - new Date(a.start_time).getTime()
          const bDuration = new Date(b.end_time).getTime() - new Date(b.start_time).getTime()
          return sortDirection === "asc" ? aDuration - bDuration : bDuration - aDuration
        case "status":
          return sortDirection === "asc"
            ? a.status.localeCompare(b.status)
            : b.status.localeCompare(a.status)
        default:
          return 0
      }
    })
    
    setFilteredBookings(sorted)
  }, [searchTerm, bookings, sortField, sortDirection])

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

  const openCancelDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setCancelDialogOpen(true)
  }

  const openDeleteDialog = (bookingId: string) => {
    setSelectedBookingId(bookingId)
    setDeleteDialogOpen(true)
  }

  const handleStatusChange = async (newStatus: "confirmed" | "cancelled") => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${newStatus === "confirmed" ? "approve" : "reject"} booking`)
      }
      
      const updatedBooking = await response.json()
      
      // Update the bookings state
      const updatedBookings = bookings.map(booking => {
        if (booking.id === selectedBookingId) {
          return { ...booking, status: newStatus }
        }
        return booking
      })
      
      setBookings(updatedBookings)
      
      toast({
        title: `Booking ${newStatus === "confirmed" ? "Approved" : "Rejected"}`,
        description: `The booking has been ${newStatus === "confirmed" ? "approved" : "rejected"} successfully.`,
        variant: newStatus === "confirmed" ? "default" : "destructive",
      })
    } catch (error) {
      console.error(`Failed to ${newStatus === "confirmed" ? "approve" : "reject"} booking:`, error)
      
      toast({
        title: "Error",
        description: `Failed to ${newStatus === "confirmed" ? "approve" : "reject"} booking. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setConfirmDialogOpen(false)
      setCancelDialogOpen(false)
      setSelectedBookingId(null)
    }
  }

  const handleDeleteBooking = async () => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      const response = await fetch(`/api/bookings/${selectedBookingId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
        },
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to delete booking")
      }
      
      // Remove the booking from the state
      const updatedBookings = bookings.filter(booking => booking.id !== selectedBookingId)
      setBookings(updatedBookings)
      
      toast({
        title: "Booking Deleted",
        description: "The booking has been deleted successfully.",
      })
    } catch (error) {
      console.error("Failed to delete booking:", error)
      
      toast({
        title: "Error",
        description: "Failed to delete booking. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setDeleteDialogOpen(false)
      setSelectedBookingId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
          <p className="text-muted-foreground">Manage all conference room bookings</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-muted rounded w-20 animate-pulse" />
                <div className="h-4 w-4 bg-muted rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-12 animate-pulse mb-2" />
                <div className="h-3 bg-muted rounded w-24 animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed")
  const pendingBookings = bookings.filter((b) => b.status === "pending")
  const cancelledBookings = bookings.filter((b) => b.status === "cancelled")
  const todayBookings = bookings.filter((b) => {
    const bookingDate = new Date(b.start_time)
    const today = new Date()
    return bookingDate.toDateString() === today.toDateString()
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Booking Management</h2>
        <p className="text-muted-foreground">Manage all conference room bookings</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{bookings.length}</div>
            <p className="text-xs text-muted-foreground">All time bookings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayBookings.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedBookings.length}</div>
            <p className="text-xs text-muted-foreground">Active bookings</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Bookings</CardTitle>
          <CardDescription>View and manage all conference room bookings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2 mb-4">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings by title, room, or user..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("title")}>
                    Title {getSortIcon("title")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("room")}>
                    Room {getSortIcon("room")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("organizer")}>
                    Organizer {getSortIcon("organizer")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("date")}>
                    Date & Time {getSortIcon("date")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("duration")}>
                    Duration {getSortIcon("duration")}
                  </TableHead>
                  <TableHead className="cursor-pointer" onClick={() => toggleSort("status")}>
                    Status {getSortIcon("status")}
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((booking) => {
                  
                  const startTime = new Date(booking.start_time)
                  const endTime = new Date(booking.end_time)
                  const createdAt = new Date(booking.created_at)
                  
                  
                  // Calculate duration in hours and minutes
                  const durationMs = endTime.getTime() - startTime.getTime()
                  const durationHours = Math.floor(durationMs / (1000 * 60 * 60))
                  const durationMinutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60))
                  const durationFormatted = durationHours > 0 
                    ? `${durationHours}h${durationMinutes > 0 ? ` ${durationMinutes}m` : ''}`
                    : `${durationMinutes}m`
                    

                  return (
                    <TableRow key={booking.id}>
                      <TableCell className="font-medium">{booking.title}</TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
                          {booking.rooms?.name || "Unknown Room"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Users className="h-3 w-3 mr-1 text-muted-foreground" />
                          {booking.users?.name || "Unknown User"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm font-medium">{startTime.toLocaleDateString('en-US', { 
                            weekday: 'short',
                            month: 'short', 
                            day: 'numeric'
                          })}</div>
                          <div className="text-xs text-muted-foreground">
                            {startTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} - 
                            {endTime.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{durationFormatted}</TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusBadgeVariant(booking.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(booking.status)}
                          {booking.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {booking.status === "pending" && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600"
                                onClick={() => openConfirmDialog(booking.id)}
                                disabled={processingStatus}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-destructive"
                                onClick={() => openCancelDialog(booking.id)}
                                disabled={processingStatus}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-destructive"
                            onClick={() => openDeleteDialog(booking.id)}
                            disabled={processingStatus}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {filteredBookings.length === 0 && (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No bookings found</p>
              <p className="text-muted-foreground">
                {searchTerm ? "Try adjusting your search terms." : "There are no bookings in the system yet."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Approval Confirmation Dialog */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve this booking request? This will confirm the room reservation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange("confirmed")}
              disabled={processingStatus}
              className="bg-green-600 hover:bg-green-700"
            >
              {processingStatus ? "Approving..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rejection Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking Request</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this booking request? This will cancel the room reservation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleStatusChange("cancelled")}
              disabled={processingStatus}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processingStatus ? "Rejecting..." : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this booking? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteBooking}
              disabled={processingStatus}
              className="bg-destructive hover:bg-destructive/90"
            >
              {processingStatus ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
