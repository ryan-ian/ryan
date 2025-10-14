"use client"

import { useState, useEffect, useCallback } from "react"
import { Building, BookCheck, Clock, User, Calendar, Check, X, AlertCircle, Bell, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notifications-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
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
import { useToast } from "@/components/ui/use-toast"
import { getPendingBookingsByFacilityManager, getTodaysBookingsByFacilityManager, getRoomsByFacilityManager } from "@/lib/supabase-data"
import { expirePendingBookings } from "@/lib/room-availability"
import { useManagerRealtime } from "@/hooks/use-manager-realtime"
import type { BookingWithDetails } from "@/types"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { RealtimeStatusFull } from "@/components/realtime-status"
import { RealtimeDebugPanel } from "@/components/realtime-debug-panel"

function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      <div>
        <Skeleton className="h-8 w-1/2 mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-8 rounded-full" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-12 mb-2" />
            <Skeleton className="h-3 w-24" />
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
            <div className="h-20 bg-muted rounded-lg" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
            <div className="h-16 bg-muted rounded-lg" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function FacilityManagerDashboard() {
  const { user } = useAuth()
  // Removed useNotifications import and usage
  const [pendingBookings, setPendingBookings] = useState<BookingWithDetails[]>([])
  const [todaysBookings, setTodaysBookings] = useState<BookingWithDetails[]>([])
  const [totalRooms, setTotalRooms] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expiredBookingsCount, setExpiredBookingsCount] = useState(0)
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedBookingTitle, setSelectedBookingTitle] = useState<string>("")
  const [processingStatus, setProcessingStatus] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [newRequestsCount, setNewRequestsCount] = useState(0)
  const { toast } = useToast()

  // Refresh dashboard data
  const refreshDashboardData = useCallback(async () => {
    if (!user) return
    try {
      console.log('🔄 Refreshing dashboard data...')
      const [pending, today, rooms] = await Promise.all([
        getPendingBookingsByFacilityManager(user.id),
        getTodaysBookingsByFacilityManager(user.id),
        getRoomsByFacilityManager(user.id)
      ])
      setPendingBookings(pending)
      setTodaysBookings(today)
      setTotalRooms(rooms.length)
    } catch (err) {
      console.error("Error refreshing dashboard data:", err)
    }
  }, [user])

  // Handle new booking requests in real-time
  const handleNewBooking = useCallback((booking: BookingWithDetails) => {
    console.log('🏢 New booking request received:', booking)
    if (booking.status === 'pending') {
      // Add the new booking to the pending list immediately
      setPendingBookings(prev => [booking, ...prev])

      // Show "new" badge indicator
      setNewRequestsCount(prev => prev + 1)

      // Show browser notification if permission granted
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('New Booking Request', {
          body: `${booking.users?.name} has requested ${booking.rooms?.name}`,
          icon: '/favicon.ico'
        })
      }

      // Auto-hide the "new" badge after 10 seconds
      setTimeout(() => {
        setNewRequestsCount(prev => Math.max(0, prev - 1))
      }, 10000)
    }
  }, [])

  // Handle booking status changes in real-time
  const handleBookingStatusChange = useCallback((
    booking: BookingWithDetails,
    oldStatus: string,
    newStatus: string
  ) => {
    console.log(`🏢 Booking status changed: ${oldStatus} → ${newStatus}`)

    // Update pending bookings list immediately
    if (oldStatus === 'pending' && newStatus !== 'pending') {
      // Remove from pending list when status changes from pending
      setPendingBookings(prev => prev.filter(b => b.id !== booking.id))
    } else if (newStatus === 'pending' && oldStatus !== 'pending') {
      // Add to pending list if status changed to pending (rare case)
      setPendingBookings(prev => [booking, ...prev])
    } else if (oldStatus === 'pending' && newStatus === 'pending') {
      // Update existing pending booking
      setPendingBookings(prev => prev.map(b => b.id === booking.id ? booking : b))
    }

    // Update today's bookings if it's a confirmed booking for today
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const bookingDate = new Date(booking.start_time)

    if (bookingDate >= today && bookingDate < tomorrow) {
      if (newStatus === 'confirmed') {
        // Add to today's bookings if confirmed for today
        setTodaysBookings(prev => {
          const exists = prev.some(b => b.id === booking.id)
          return exists ? prev.map(b => b.id === booking.id ? booking : b) : [booking, ...prev]
        })
      } else if (oldStatus === 'confirmed' && newStatus !== 'confirmed') {
        // Remove from today's bookings if no longer confirmed
        setTodaysBookings(prev => prev.filter(b => b.id !== booking.id))
      }
    }
  }, [])

  // Set up real-time subscription
  useManagerRealtime({
    onNewBooking: handleNewBooking,
    onBookingStatusChange: handleBookingStatusChange,
    onBookingUpdate: refreshDashboardData,
    enabled: !!user,
  })

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return
      try {
        setIsLoading(true)

        // First, expire any overdue pending bookings
        const expiration = await expirePendingBookings()
        setExpiredBookingsCount(expiration.expiredCount)

        if (expiration.expiredCount > 0) {
          toast({
            title: "Expired Bookings",
            description: `${expiration.expiredCount} pending booking(s) have been automatically expired due to passing their scheduled time.`,
            variant: "default"
          })
        }

        const [pending, today, rooms] = await Promise.all([
          getPendingBookingsByFacilityManager(user.id),
          getTodaysBookingsByFacilityManager(user.id),
          getRoomsByFacilityManager(user.id)
        ])
        setPendingBookings(pending)
        setTodaysBookings(today)
        setTotalRooms(rooms.length)
      } catch (err) {
        console.error("Error loading dashboard data:", err)
        setError("Failed to load dashboard data.")
      } finally {
        setIsLoading(false)
      }
    }
    loadDashboardData()
  }, [user, toast])

  const openApproveDialog = (bookingId: string, bookingTitle: string) => {
    setSelectedBookingId(bookingId)
    setSelectedBookingTitle(bookingTitle)
    setConfirmDialogOpen(true)
  }

  const openRejectDialog = (bookingId: string, bookingTitle: string) => {
    setSelectedBookingId(bookingId)
    setSelectedBookingTitle(bookingTitle)
    setRejectionReason("") // Reset rejection reason
    setRejectDialogOpen(true)
  }

  const handleUpdateStatus = async (status: "confirmed" | "cancelled") => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      console.log(`🎯 [Dashboard] Updating booking ${selectedBookingId} to status: ${status}`)
      
      const updateData: any = { status }
      if (status === "cancelled" && rejectionReason.trim()) {
        updateData.rejection_reason = rejectionReason.trim()
      }
      
      // Use API route instead of direct function call
      const response = await fetch(`/api/bookings/${selectedBookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to update booking'
        try {
          const errorData = await response.json()
          errorMessage = errorData.error || errorMessage
        } catch (parseError) {
          console.error('❌ [Dashboard] Failed to parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      let responseData
      try {
        responseData = await response.json()
      } catch (parseError) {
        console.error('❌ [Dashboard] Failed to parse success response:', parseError)
        throw new Error('Server returned invalid response')
      }
      console.log(`✅ [Dashboard] Successfully updated booking:`, responseData)

      // Update pending bookings list immediately
      setPendingBookings(prev => prev.filter(b => b.id !== selectedBookingId))

      // If confirmed, add to today's bookings if it's for today
      if (status === "confirmed") {
        const booking = pendingBookings.find(b => b.id === selectedBookingId)
        if (booking) {
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const tomorrow = new Date(today)
          tomorrow.setDate(tomorrow.getDate() + 1)
          const bookingDate = new Date(booking.start_time)

          if (bookingDate >= today && bookingDate < tomorrow) {
            setTodaysBookings(prev => [{ ...booking, status: 'confirmed' }, ...prev])
          }
        }
      }
      
      toast({
        title: `Booking ${status === "confirmed" ? "Approved" : "Rejected"}`,
        description: `The booking "${selectedBookingTitle}" has been ${status === "confirmed" ? "approved" : "rejected"} successfully.`,
        variant: status === "confirmed" ? "default" : "destructive",
      })
      
      setError(null)
    } catch (err: any) {
      console.error(`❌ [Dashboard] Failed to ${status === "confirmed" ? "approve" : "reject"} booking:`, err)
      toast({
        title: "Error",
        description: err.message || `Failed to ${status === "confirmed" ? "approve" : "reject"} booking. Please try again.`,
        variant: "destructive",
      })
    } finally {
      setProcessingStatus(false)
      setConfirmDialogOpen(false)
      setRejectDialogOpen(false)
      setSelectedBookingId(null)
      setSelectedBookingTitle("")
    }
  }

  if (isLoading) {
    return <DashboardSkeleton />
  }
  
  if (error) {
    return (
      <div className="text-center py-10">
        <AlertCircle className="mx-auto h-12 w-12 text-destructive" />
        <h2 className="mt-4 text-xl font-semibold text-destructive">An error occurred</h2>
        <p className="mt-2 text-brand-navy-700 dark:text-brand-navy-300">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8 px-2 sm:px-0">
      {/* Mobile-optimized header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">
            Welcome, {user?.name.split(" ")[0]}!
          </h1>
          <p className="text-sm sm:text-base text-brand-navy-700 dark:text-brand-navy-300">
            Here's a summary of your facility's activity.
          </p>
        </div>
        {/* <div className="flex items-center gap-4">
          <RealtimeStatusFull className="text-sm" />
        </div> */}
      </div>
      
       {/* Quick Stats - Compact mobile design */}
       <div className="grid gap-2 sm:gap-4 lg:gap-6 grid-cols-3 sm:grid-cols-2 lg:grid-cols-3">
         <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md active:shadow-lg active:scale-[0.98] transition-all duration-200">
           <div className="h-1 bg-blue-500 w-full" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-brand-navy-900 dark:text-brand-navy-50">Total Rooms</CardTitle>
             <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-1.5">
               <Building className="h-3 w-3 text-blue-600 dark:text-blue-400" />
             </div>
           </CardHeader>
           <CardContent className="pb-2 px-3">
             <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{totalRooms}</div>
             <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Managed</p>
           </CardContent>
         </Card>
         <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md active:shadow-lg active:scale-[0.98] transition-all duration-200">
           <div className="h-1 bg-amber-500 w-full" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-brand-navy-900 dark:text-brand-navy-50">Pending</CardTitle>
             <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-1.5">
               <Clock className="h-3 w-3 text-amber-600 dark:text-amber-400" />
             </div>
           </CardHeader>
           <CardContent className="pb-2 px-3">
             <div className="flex items-center gap-1">
               <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{pendingBookings.length}</div>
               {newRequestsCount > 0 && (
                 <Badge variant="destructive" className="animate-pulse text-xs px-1 py-0.5 h-4">
                   +{newRequestsCount}
                 </Badge>
               )}
             </div>
             <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Requests</p>
           </CardContent>
         </Card>
         <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:shadow-md transition-shadow">
           <div className="h-1 bg-green-500 w-full" />
           <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 px-3 pt-3">
             <CardTitle className="text-xs font-medium text-brand-navy-900 dark:text-brand-navy-50">Today</CardTitle>
             <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-1.5">
               <BookCheck className="h-3 w-3 text-green-600 dark:text-green-400" />
             </div>
           </CardHeader>
           <CardContent className="pb-2 px-3">
             <div className="text-lg sm:text-xl lg:text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{todaysBookings.length}</div>
             <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">Meetings</p>
           </CardContent>
         </Card>
       </div>
      
      {/* Show expired bookings notification if any */}
      {expiredBookingsCount > 0 && (
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/20">
          <CardHeader>
            <CardTitle className="text-amber-800 dark:text-amber-200 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Expired Bookings Notification
            </CardTitle>
            <CardDescription className="text-amber-700 dark:text-amber-300">
              {expiredBookingsCount} pending booking(s) were automatically expired because they passed their scheduled time without approval.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 sm:gap-6 grid-cols-1 lg:grid-cols-2">
        <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <CardHeader>
            <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Pending Booking Requests</CardTitle>
            <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Review and respond to new booking requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 transition-all duration-200 active:scale-[0.98] active:bg-gray-100 dark:active:bg-brand-navy-600/50">
                    {/* Mobile-first stacked layout */}
                    <div className="space-y-3">
                      {/* Booking title and details */}
                      <div className="space-y-2">
                        <p className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg">{booking.title}</p>
                        <div className="space-y-1 sm:space-y-0 sm:flex sm:items-center sm:gap-4">
                          <span className="flex items-center gap-1.5 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                            <Building className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" /> 
                            <span className="truncate">{booking.rooms.name}</span>
                          </span>
                          <span className="flex items-center gap-1.5 text-sm text-brand-navy-700 dark:text-brand-navy-300">
                            <User className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0" /> 
                            <span className="truncate">{booking.users.name}</span>
                          </span>
                        </div>
                        {(booking as any).total_cost && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950 text-xs sm:text-sm">
                              Amount: GH₵ {((booking as any).total_cost as number).toFixed(2)}
                            </Badge>
                          </div>
                        )}
                      </div>
                      
                       {/* Action buttons - Mobile optimized */}
                       <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 border-t border-brand-navy-200 dark:border-brand-navy-700">
                         <Button 
                           size="sm" 
                           onClick={() => openApproveDialog(booking.id, booking.title)} 
                           className="bg-success hover:bg-success/90 active:bg-success/80 active:scale-[0.98] text-success-foreground flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px] transition-all duration-150"
                         >
                           <Check className="mr-2 h-4 w-4" /> 
                           <span className="text-sm sm:text-sm">Approve</span>
                         </Button>
                         <Button 
                           variant="outline" 
                           size="sm" 
                           onClick={() => openRejectDialog(booking.id, booking.title)}
                           className="border-destructive/50 text-destructive hover:bg-destructive/10 active:bg-destructive/20 active:scale-[0.98] flex-1 sm:flex-none min-h-[44px] sm:min-h-[36px] transition-all duration-150"
                         >
                           <X className="mr-2 h-4 w-4" /> 
                           <span className="text-sm sm:text-sm">Reject</span>
                         </Button>
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-navy-700 dark:text-brand-navy-300 text-center py-8">No pending requests.</p>
            )}
          </CardContent>
          {pendingBookings.length > 0 && (
            <CardFooter>
              <Button 
                variant="outline" 
                className="w-full border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50" 
                asChild
              >
                <Link href="/facility-manager/bookings">View All Bookings</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <CardHeader>
            <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Today's Schedule</CardTitle>
            <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">A summary of today's confirmed bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysBookings.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {todaysBookings.map((booking) => (
                  <div key={booking.id} className="p-4 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 transition-all duration-200 active:scale-[0.98] active:bg-gray-100 dark:active:bg-brand-navy-600/50">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="flex-grow min-w-0">
                        <p className="font-semibold text-brand-navy-900 dark:text-brand-navy-50 text-base sm:text-lg mb-1">{booking.title}</p>
                        <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300 mb-2">{booking.rooms.name}</p>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-2">
                          <div className="text-sm font-medium text-amber-700 dark:text-amber-300">
                            {format(new Date(booking.start_time), 'h:mm a')} - {format(new Date(booking.end_time), 'h:mm a')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-brand-navy-700 dark:text-brand-navy-300 text-center py-8">No bookings scheduled for today.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modals - Mobile optimized */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 rounded-lg mx-4 sm:mx-0 max-w-[95vw] sm:max-w-md">
          <div className="h-1 bg-success w-full absolute top-0 left-0 right-0 rounded-t-lg"></div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg sm:text-xl">Approve Booking</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-navy-700 dark:text-brand-navy-300 text-sm sm:text-base leading-relaxed">
              Are you sure you want to approve the booking "{selectedBookingTitle}"? This will confirm the room reservation and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <AlertDialogCancel 
              disabled={processingStatus}
              className="border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("confirmed")
              }}
              disabled={processingStatus}
              className="bg-success hover:bg-success/90 text-success-foreground w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
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

      <AlertDialog open={rejectDialogOpen} onOpenChange={(open) => {
        setRejectDialogOpen(open)
        if (!open) setRejectionReason("") // Reset when closing
      }}>
        <AlertDialogContent className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 rounded-lg mx-4 sm:mx-0 max-w-[95vw] sm:max-w-md">
          <div className="h-1 bg-destructive w-full absolute top-0 left-0 right-0 rounded-t-lg"></div>
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg sm:text-xl">Reject Booking</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-navy-700 dark:text-brand-navy-300 text-sm sm:text-base leading-relaxed">
              Are you sure you want to reject the booking "{selectedBookingTitle}"? Please provide a reason for rejection to help the organizer understand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-3">
            <label htmlFor="rejection-reason" className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50 block">
              Reason for rejection (optional)
            </label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejecting this booking..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[100px] sm:min-h-[80px] border-brand-navy-200 dark:border-brand-navy-600 bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100 resize-none"
              disabled={processingStatus}
            />
          </div>
          <AlertDialogFooter className="flex-col sm:flex-row gap-3 sm:gap-2">
            <AlertDialogCancel
              disabled={processingStatus}
              className="border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("cancelled")
              }}
              disabled={processingStatus}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground w-full sm:w-auto min-h-[44px] sm:min-h-[36px]"
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

      {/* Debug Panel - Remove in production */}
      <div className="mt-8">
        <RealtimeDebugPanel />
      </div>
    </div>
  )
}