"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Plus, RefreshCw, Loader2, Calendar, List as ListIcon, Table as TableIcon, Eye, Edit, Trash2, CheckCircle, AlertCircle, XCircle } from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/contexts/auth-context"
import type { Booking, Room } from "@/types"
import { BookingDetailsModalModern } from "@/components/bookings/booking-details-modal-modern"
import { BookingEditModalModern } from "@/components/bookings/booking-edit-modal-modern"
import { MeetingInvitationModal } from "@/components/bookings/meeting-invitation-modal"
import { DeleteBookingDialog } from "./delete-booking-dialog"
import { useToast } from "@/components/ui/use-toast"
import { eventBus, EVENTS } from "@/lib/events"
import { StatsRow } from "@/components/bookings/stats-row"
import { BookingCardModern } from "@/components/bookings/booking-card-modern"
import { FiltersToolbar } from "@/components/bookings/filters-toolbar"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { useUserRealtime } from "@/hooks/use-user-realtime"
import { RealtimeStatusCompact } from "@/components/realtime-status"

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
  const [roomFilter, setRoomFilter] = useState("all")
  const [activeStatFilter, setActiveStatFilter] = useState<string>("")
  const [showFilters, setShowFilters] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0) // Add a refresh key to force re-render
  
  // Modal state
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [bookingToEdit, setBookingToEdit] = useState<Booking | null>(null)
  const [isInvitationModalOpen, setIsInvitationModalOpen] = useState(false)
  const [bookingToInvite, setBookingToInvite] = useState<Booking | null>(null)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [bookingToCancel, setBookingToCancel] = useState<string | null>(null)
  const [bookingStatusToCancel, setBookingStatusToCancel] = useState<"pending" | "confirmed">("pending")
  const [isCancelling, setIsCancelling] = useState(false)
  const [viewMode, setViewMode] = useState<"list" | "table">("list")
  const [statusUpdateCount, setStatusUpdateCount] = useState(0)

  // Handle real-time booking status changes
  const handleBookingStatusChange = useCallback((booking: Booking, oldStatus: string, newStatus: string) => {
    console.log(`👤 [User Bookings] Real-time status change: ${oldStatus} → ${newStatus} for booking ${booking.id}`)

    // Immediately update the booking in local state for instant UI response
    setBookings(prevBookings =>
      prevBookings.map(b =>
        b.id === booking.id ? { ...b, ...booking } : b
      )
    )

    // Also update filtered bookings if they're being displayed
    setFilteredBookings(prevFiltered =>
      prevFiltered.map(b =>
        b.id === booking.id ? { ...b, ...booking } : b
      )
    )

    // Add visual indicator for status changes
    setStatusUpdateCount(prev => prev + 1)
    setTimeout(() => {
      setStatusUpdateCount(prev => Math.max(0, prev - 1))
    }, 3000)

    // Also force refresh after a short delay to ensure data consistency
    setTimeout(() => {
      forceRefresh()
    }, 1000)
  }, [])

  // Handle real-time booking updates
  const handleBookingUpdate = useCallback(() => {
    console.log('👤 [User Bookings] Real-time booking update received')
    forceRefresh()
  }, [])

  // Set up real-time subscription for user booking updates
  useUserRealtime({
    onBookingStatusChange: handleBookingStatusChange,
    onBookingUpdate: handleBookingUpdate,
    enabled: !!user,
    showToasts: true,
  })

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
  }, [bookings, searchTerm, statusFilter, dateFilter, roomFilter, activeStatFilter])

  // Load and persist view mode for session
  useEffect(() => {
    const saved = sessionStorage.getItem("bookings-view-mode") as "list" | "table" | null
    if (saved === "list" || saved === "table") setViewMode(saved)
  }, [])
  useEffect(() => {
    sessionStorage.setItem("bookings-view-mode", viewMode)
  }, [viewMode])

  // Force a refresh by incrementing the refresh key
  const forceRefresh = () => {
    setRefreshKey(prevKey => prevKey + 1)
  }

  const fetchBookings = async () => {
    try {
      // Check if we have a user before proceeding
      if (!user?.id) {
        console.log("Skipping fetchBookings: No user ID available")
        return
      }
      
      setLoading(true)
      
      // Use the new authenticated fetch utility
      const { authenticatedFetch } = await import('@/lib/auth-utils')
      
      const response = await authenticatedFetch(`/api/bookings/user?user_id=${user.id}&timestamp=${Date.now()}`, {
        headers: {
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

    // 1. Apply stat card filter first (exclusive)
    if (activeStatFilter) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const todayEnd = new Date(today.getTime() + 24 * 60 * 60 * 1000)

      switch (activeStatFilter) {
        case 'all':
          // Show all bookings - no filtering needed
          break
        case 'today':
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= today && bookingDate < todayEnd && booking.status === "confirmed"
          })
          break
        case 'upcoming':
          filtered = filtered.filter((booking) => new Date(booking.start_time) > now && booking.status === "confirmed")
          break
        case 'pending':
          filtered = filtered.filter((booking) => booking.status === "pending")
          break
      }
    }

    // 2. Apply dropdown filters (AND logic)
    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((booking) => booking.status === statusFilter)
    }

    // Room filter
    if (roomFilter !== "all") {
      filtered = filtered.filter((booking) => booking.room_id === roomFilter)
    }

    // 3. Apply enhanced date filter
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
        case "this-week":
          const startOfWeek = new Date(today)
          startOfWeek.setDate(today.getDate() - today.getDay()) // Sunday
          const endOfWeek = new Date(startOfWeek)
          endOfWeek.setDate(startOfWeek.getDate() + 7)
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= startOfWeek && bookingDate < endOfWeek
          })
          break
        case "this-month":
          const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
          const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1)
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= startOfMonth && bookingDate < endOfMonth
          })
          break
        case "next-7-days":
          const next7Days = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= today && bookingDate < next7Days
          })
          break
        case "next-30-days":
          const next30Days = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
          filtered = filtered.filter((booking) => {
            const bookingDate = new Date(booking.start_time)
            return bookingDate >= today && bookingDate < next30Days
          })
          break
        case "past":
          filtered = filtered.filter((booking) => new Date(booking.start_time) < now)
          break
        case "upcoming":
          filtered = filtered.filter((booking) => new Date(booking.start_time) > now)
          break
      }
    }

    // 4. Apply search filter last
    if (searchTerm) {
      filtered = filtered.filter(
        (booking) =>
          booking.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          getRoom(booking.room_id)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime())

    setFilteredBookings(filtered)
  }

  const getRoom = (roomId: string) => {
    return rooms.find((r) => r.id === roomId) || null
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

  // Handle opening the booking edit modal
  const handleEditBooking = (booking: Booking) => {
    setBookingToEdit(booking)
    setIsEditModalOpen(true)
  }

  // Handle opening the meeting invitation modal
  const handleInviteMembers = (booking: Booking) => {
    setBookingToInvite(booking)
    setIsInvitationModalOpen(true)
  }

  // Handle submitting booking edits
  const handleEditSubmit = async (data: { title: string; description?: string; start_time: string; end_time: string }) => {
    if (!bookingToEdit) return

    try {
      const response = await fetch(`/api/bookings/${bookingToEdit.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: data.title,
          description: data.description || "",
          start_time: data.start_time,
          end_time: data.end_time,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to update booking")
      }

      const updatedBooking = await response.json()

      // Update the booking in the local state
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === bookingToEdit.id ? updatedBooking : booking
        )
      )

      // Update selected booking if it's the one being edited
      if (selectedBooking && selectedBooking.id === bookingToEdit.id) {
        setSelectedBooking(updatedBooking)
      }

      // Trigger global event for booking update
      eventBus.publish(EVENTS.BOOKING_UPDATED)

      // Close the edit modal
      setIsEditModalOpen(false)
      setBookingToEdit(null)

    } catch (error) {
      console.error("Error updating booking:", error)
      throw error // Re-throw to be handled by the modal
    }
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
      <div className="p-6 space-y-8">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
              My Bookings
            </h1>
            <p className="text-brand-navy-600 dark:text-brand-navy-400 mt-1">
              View and manage your room bookings
            </p>
          </div>
        </header>
        <StatsRow
          total={0}
          today={0}
          upcoming={0}
          pending={0}
          loading={true}
        />
      </div>
    )
  }

  const stats = getBookingStats()

  // Generate active filters for the toolbar
  const getActiveFilters = () => {
    const filters = []
    if (searchTerm) {
      filters.push({ key: 'search', label: `Search: "${searchTerm}"` })
    }
    if (statusFilter !== 'all') {
      filters.push({ key: 'status', label: `Status: ${statusFilter}` })
    }
    if (dateFilter !== 'all') {
      const dateLabels = {
        today: 'Today',
        'this-week': 'This Week',
        'this-month': 'This Month',
        'next-7-days': 'Next 7 Days',
        'next-30-days': 'Next 30 Days',
        upcoming: 'Upcoming',
        past: 'Past Bookings'
      }
      filters.push({ key: 'date', label: `Date: ${dateLabels[dateFilter as keyof typeof dateLabels] || dateFilter}` })
    }
    if (roomFilter !== 'all') {
      const room = getRoom(roomFilter)
      filters.push({ key: 'room', label: `Room: ${room?.name || 'Unknown'}` })
    }
    // Add single stat filter
    if (activeStatFilter) {
      const filterLabels = {
        all: 'All Bookings',
        today: 'Today',
        upcoming: 'Upcoming',
        pending: 'Pending'
      }
      filters.push({
        key: `stat-${activeStatFilter}`,
        label: `Filter: ${filterLabels[activeStatFilter as keyof typeof filterLabels] || activeStatFilter}`
      })
    }
    return filters
  }

  const handleClearFilter = (key: string) => {
    if (key.startsWith('stat-')) {
      // Handle stat filter removal
      setActiveStatFilter('')
    } else {
      switch (key) {
        case 'search':
          setSearchTerm('')
          break
        case 'status':
          setStatusFilter('all')
          break
        case 'date':
          setDateFilter('all')
          break
        case 'room':
          setRoomFilter('all')
          break
      }
    }
  }

  const handleClearAllFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setDateFilter('all')
    setRoomFilter('all')
    setActiveStatFilter('')
  }

  // Handle stat filter clicks (exclusive selection)
  const handleStatFilterClick = (filterKey: string) => {
    if (activeStatFilter === filterKey) {
      // Deactivate if clicking the same active filter
      setActiveStatFilter('')
    } else {
      // Activate the clicked filter (deactivates any other)
      setActiveStatFilter(filterKey)
    }
  }

  // Get available rooms with booking counts
  const getAvailableRooms = () => {
    const roomCounts: { [key: string]: number } = {}

    bookings.forEach(booking => {
      roomCounts[booking.room_id] = (roomCounts[booking.room_id] || 0) + 1
    })

    return Object.entries(roomCounts)
      .map(([roomId, count]) => ({
        id: roomId,
        name: getRoom(roomId)?.name || 'Unknown Room',
        count
      }))
      .sort((a, b) => a.name.localeCompare(b.name))
  }

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "confirmed":
        return { text: "Confirmed", className: "bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20", icon: CheckCircle }
      case "pending":
        return { text: "Pending", className: "bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20", icon: AlertCircle }
      case "cancelled":
        return { text: "Cancelled", className: "bg-red-500/10 text-red-600 ring-1 ring-red-500/20", icon: XCircle }
      default:
        return { text: status, className: "bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20", icon: AlertCircle }
    }
  }

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
            My Bookings
          </h1>
          <p className="text-brand-navy-600 dark:text-brand-navy-400 mt-1">
            View and manage your room bookings
          </p>
        </div>
        <div className="flex items-center gap-3">
          <RealtimeStatusCompact />
          <div className="inline-flex rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 overflow-hidden">
            <button
              className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors ${viewMode === "list" ? "bg-brand-navy-900 text-white" : "bg-transparent text-brand-navy-700 dark:text-brand-navy-300"}`}
              onClick={() => setViewMode("list")}
              aria-pressed={viewMode === "list"}
              aria-label="List view"
            >
              <ListIcon className="h-4 w-4" />
              <span className="hidden sm:inline">List</span>
            </button>
            <button
              className={`px-3 py-2 text-sm flex items-center gap-2 transition-colors border-l border-brand-navy-200 dark:border-brand-navy-700 ${viewMode === "table" ? "bg-brand-navy-900 text-white" : "bg-transparent text-brand-navy-700 dark:text-brand-navy-300"}`}
              onClick={() => setViewMode("table")}
              aria-pressed={viewMode === "table"}
              aria-label="Table view"
            >
              <TableIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
          </div>
          <Button
            variant="outline"
            onClick={() => fetchBookings()}
            disabled={loading}
            className="border-brand-navy-200 dark:border-brand-navy-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
                {statusUpdateCount > 0 && (
                  <Badge variant="destructive" className="ml-2 animate-pulse">
                    {statusUpdateCount} update{statusUpdateCount > 1 ? 's' : ''}
                  </Badge>
                )}
              </>
            )}
          </Button>
          <Link href="/conference-room-booking">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Browse Rooms
            </Button>
          </Link>
        </div>
      </header>

      {/* Stats Row */}
      <StatsRow
        total={stats.total}
        today={stats.today}
        upcoming={stats.upcoming}
        pending={stats.pending}
        loading={loading}
        onFilterClick={handleStatFilterClick}
        activeFilters={activeStatFilter ? [activeStatFilter] : []}
      />

      {/* Filters Toolbar */}
      <FiltersToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        dateFilter={dateFilter}
        onDateChange={setDateFilter}
        roomFilter={roomFilter}
        onRoomChange={setRoomFilter}
        availableRooms={getAvailableRooms()}
        activeFilters={getActiveFilters()}
        onClearFilter={handleClearFilter}
        onClearAll={handleClearAllFilters}
        showFilters={showFilters}
        onToggleFilters={() => setShowFilters(!showFilters)}
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-navy-600 dark:text-brand-navy-400">
          Showing {filteredBookings.length} of {bookings.length} bookings
        </p>
      </div>

      {/* Bookings - View Modes */}
      {viewMode === "list" && (
        <div className="grid gap-4 md:gap-6">
          {filteredBookings.map((booking) => (
            <BookingCardModern
              key={booking.id}
              booking={booking}
              room={getRoom(booking.room_id)}
              onView={handleViewBooking}
              onInvite={handleInviteMembers}
              onCancel={handleCancelClick}
            />
          ))}
        </div>
      )}

      {viewMode === "table" && (
        <div className="rounded-xl border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50 dark:bg-slate-900">
              <TableRow>
                <TableHead>Booking</TableHead>
                <TableHead>Room</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Time</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.map((booking) => {
                const room = getRoom(booking.room_id)
                const statusCfg = getStatusConfig(booking.status)
                return (
                  <TableRow key={booking.id} className="align-middle">
                    <TableCell className="font-medium text-brand-navy-900 dark:text-brand-navy-50">
                      <div className="max-w-[360px] truncate">{booking.title}</div>
                      {booking.description && (
                        <div className="text-xs text-brand-navy-600 dark:text-brand-navy-400 truncate max-w-[420px]">{booking.description}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="truncate">{room?.name || "Unknown Room"}</div>
                      {room?.location && (
                        <div className="text-xs text-muted-foreground truncate">{room.location}</div>
                      )}
                    </TableCell>
                    <TableCell>{new Date(booking.start_time).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {new Date(booking.start_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" - "}
                      {new Date(booking.end_time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </TableCell>
                    <TableCell>
                      {booking.payment_status === 'paid' && booking.total_cost ? (
                        <span className="text-emerald-600 font-medium">GHS {booking.total_cost.toFixed(2)}</span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`px-2 py-0.5 text-xs ${statusCfg.className}`}>{statusCfg.text}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button size="icon" aria-label="View" onClick={() => handleViewBooking(booking)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {booking.status === "pending" && (
                          <Button variant="outline" size="icon" aria-label="Edit" onClick={() => handleEditBooking(booking)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {(booking.status === "pending" || booking.status === "confirmed") && (
                          <Button variant="outline" size="icon" aria-label="Delete" onClick={() => handleCancelClick(booking.id, booking.status as "pending" | "confirmed")}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Empty State */}
      {filteredBookings.length === 0 && (
        <div className="text-center py-12 md:py-16">
          <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-gradient-to-br from-brand-navy-100 to-brand-navy-50 dark:from-brand-navy-700 dark:to-brand-navy-800 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-brand-navy-600 dark:text-brand-navy-400" aria-hidden="true" />
          </div>
          <h3 className="text-xl font-semibold text-brand-navy-900 dark:text-brand-navy-50 mb-2">
            No bookings found
          </h3>
          <p className="text-brand-navy-600 dark:text-brand-navy-400 mb-6 max-w-md mx-auto">
            {bookings.length === 0
              ? "You haven't made any bookings yet. Start by browsing available rooms and making your first reservation."
              : "Try adjusting your filters to find more bookings, or browse available rooms to make a new booking."}
          </p>
          <Button asChild size="lg">
            <Link href="/conference-room-booking">
              <Plus className="h-4 w-4 mr-2" />
              Browse Available Rooms
            </Link>
          </Button>
        </div>
      )}

      {/* Booking Details Modal */}
      <BookingDetailsModalModern
        booking={selectedBooking}
        room={selectedBooking ? getRoom(selectedBooking.room_id) : null}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onCancel={handleCancelClick}
      />

      {/* Booking Edit Modal */}
      <BookingEditModalModern
        booking={bookingToEdit}
        room={bookingToEdit ? getRoom(bookingToEdit.room_id) : null}
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setBookingToEdit(null)
        }}
        onSubmit={handleEditSubmit}
      />

      {/* Meeting Invitation Modal */}
      <MeetingInvitationModal
        booking={bookingToInvite}
        room={bookingToInvite ? getRoom(bookingToInvite.room_id) : null}
        isOpen={isInvitationModalOpen}
        onClose={() => {
          setIsInvitationModalOpen(false)
          setBookingToInvite(null)
        }}
        onInvitationsSent={(invitations) => {
          // Refresh bookings to show updated invitation count
          fetchBookings()
        }}
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
