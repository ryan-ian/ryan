"use client"

import { useState, useEffect } from "react"
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
import type { BookingWithDetails } from "@/types"
import { format } from "date-fns"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"

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
  const { toast } = useToast()

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
      
      setPendingBookings(pendingBookings.filter(b => b.id !== selectedBookingId))
      
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
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-brand-navy-900 dark:text-brand-navy-50">Welcome, {user?.name.split(" ")[0]}!</h1>
          <p className="text-brand-navy-700 dark:text-brand-navy-300">
            Here's a summary of your facility's activity.
          </p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <div className="h-1 bg-blue-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Total Rooms</CardTitle>
            <div className="bg-blue-100 dark:bg-blue-900/30 rounded-full p-2">
              <Building className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{totalRooms}</div>
            <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Managed rooms</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <div className="h-1 bg-amber-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Pending Requests</CardTitle>
            <div className="bg-amber-100 dark:bg-amber-900/30 rounded-full p-2">
              <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{pendingBookings.length}</div>
            <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <div className="h-1 bg-green-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50">Today's Bookings</CardTitle>
            <div className="bg-green-100 dark:bg-green-900/30 rounded-full p-2">
              <BookCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">{todaysBookings.length}</div>
            <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">Confirmed for today</p>
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

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800">
          <CardHeader>
            <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50">Pending Booking Requests</CardTitle>
            <CardDescription className="text-brand-navy-700 dark:text-brand-navy-300">Review and respond to new booking requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 transition-colors">
                    <div className="flex-1">
                      <p className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.title}</p>
                      <div className="text-sm text-brand-navy-700 dark:text-brand-navy-300 flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5"><Building className="h-4 w-4 text-amber-600 dark:text-amber-400" /> {booking.rooms.name}</span>
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4 text-amber-600 dark:text-amber-400" /> {booking.users.name}</span>
                      </div>
                      {(booking as any).total_cost && (
                        <div className="mt-2">
                          <Badge variant="outline" className="text-green-700 border-green-300 bg-green-50 dark:text-green-400 dark:border-green-700 dark:bg-green-950">
                            Amount: GH₵ {((booking as any).total_cost as number).toFixed(2)}
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openRejectDialog(booking.id, booking.title)}
                        className="border-destructive/50 text-destructive hover:bg-destructive/10"
                      >
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => openApproveDialog(booking.id, booking.title)} 
                        className="bg-success hover:bg-success/90 text-success-foreground"
                      >
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
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
              <div className="space-y-4">
                {todaysBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50 transition-colors">
                    <div className="flex-shrink-0">
                      <Calendar className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold text-brand-navy-900 dark:text-brand-navy-50">{booking.title}</p>
                      <p className="text-sm text-brand-navy-700 dark:text-brand-navy-300">{booking.rooms.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{format(new Date(booking.start_time), 'h:mm a')}</p>
                      <p className="text-xs text-brand-navy-700 dark:text-brand-navy-300">to {format(new Date(booking.end_time), 'h:mm a')}</p>
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

      {/* Confirmation Modals */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 rounded-lg">
          <div className="h-1 bg-success w-full absolute top-0 left-0 right-0 rounded-t-lg"></div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-navy-900 dark:text-brand-navy-50">Approve Booking</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-navy-700 dark:text-brand-navy-300">
              Are you sure you want to approve the booking "{selectedBookingTitle}"? This will confirm the room reservation and notify the organizer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              disabled={processingStatus}
              className="border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("confirmed")
              }}
              disabled={processingStatus}
              className="bg-success hover:bg-success/90 text-success-foreground"
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
        <AlertDialogContent className="border border-brand-navy-200 dark:border-brand-navy-700 bg-white dark:bg-brand-navy-800 rounded-lg">
          <div className="h-1 bg-destructive w-full absolute top-0 left-0 right-0 rounded-t-lg"></div>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-brand-navy-900 dark:text-brand-navy-50">Reject Booking</AlertDialogTitle>
            <AlertDialogDescription className="text-brand-navy-700 dark:text-brand-navy-300">
              Are you sure you want to reject the booking "{selectedBookingTitle}"? Please provide a reason for rejection to help the organizer understand.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <label htmlFor="rejection-reason" className="text-sm font-medium text-brand-navy-900 dark:text-brand-navy-50 mb-2 block">
              Reason for rejection (optional)
            </label>
            <Textarea
              id="rejection-reason"
              placeholder="Enter the reason for rejecting this booking..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="min-h-[80px] border-brand-navy-200 dark:border-brand-navy-600 bg-white dark:bg-brand-navy-700 text-brand-navy-900 dark:text-brand-navy-100"
              disabled={processingStatus}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={processingStatus}
              className="border border-brand-navy-200 dark:border-brand-navy-700 text-brand-navy-700 dark:text-brand-navy-300 hover:bg-gray-50 dark:hover:bg-brand-navy-700/50"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault()
                handleUpdateStatus("cancelled")
              }}
              disabled={processingStatus}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
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