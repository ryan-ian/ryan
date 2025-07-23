"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
  ChevronDown, 
  Eye, 
  Loader2 
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getAllBookingsByFacilityManager } from "@/lib/supabase-data"
import type { BookingWithDetails } from "@/types"
import { format } from "date-fns"
import Link from "next/link"

type SortField = "title" | "room" | "organizer" | "date" | "status"
type SortDirection = "asc" | "desc"
type StatusFilter = "all" | "pending" | "confirmed" | "cancelled"

export default function BookingsManagementPage() {
  const { user } = useAuth()
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
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [processingStatus, setProcessingStatus] = useState(false)
  const { toast } = useToast()

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
    // First filter by status
    let filtered = bookings
    if (statusFilter !== "all") {
      filtered = bookings.filter(booking => booking.status === statusFilter)
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
  }, [searchTerm, bookings, sortField, sortDirection, statusFilter])

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

  const handleUpdateStatus = async (newStatus: "confirmed" | "cancelled") => {
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
      console.error(`Error ${newStatus === "confirmed" ? "approving" : "rejecting"} booking:`, error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to ${newStatus === "confirmed" ? "approve" : "reject"} booking. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setConfirmDialogOpen(false)
      setRejectDialogOpen(false)
    }
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
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <ChevronDown className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem asChild>
                                <Link href={`/facility-manager/bookings/${booking.id}`} className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" />
                                  <span>View Details</span>
                                </Link>
                              </DropdownMenuItem>
                              {booking.status === "pending" && (
                                <DropdownMenuItem onClick={() => openConfirmDialog(booking.id)} className="text-green-600 dark:text-green-400">
                                  <CheckCircle className="h-4 w-4 mr-2" />
                                  <span>Approve</span>
                                </DropdownMenuItem>
                              )}
                              {booking.status === "pending" && (
                                <DropdownMenuItem onClick={() => openRejectDialog(booking.id)} className="text-amber-600 dark:text-amber-400">
                                  <XCircle className="h-4 w-4 mr-2" />
                                  <span>Reject</span>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
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
              Are you sure you want to approve this booking? This will confirm the room reservation.
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
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this booking? The room will remain available for other bookings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingStatus}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("cancelled")
              }}
              disabled={processingStatus}
              className="bg-amber-500 hover:bg-amber-600 focus:ring-amber-500"
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
    </div>
  )
} 