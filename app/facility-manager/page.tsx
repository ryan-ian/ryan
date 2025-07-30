"use client"

import { useState, useEffect } from "react"
import { Building, BookCheck, Clock, User, Calendar, Check, X, AlertCircle, Bell, Loader2 } from "lucide-react"

import { useAuth } from "@/contexts/auth-context"
import { useNotifications } from "@/contexts/notifications-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null)
  const [selectedBookingTitle, setSelectedBookingTitle] = useState<string>("")
  const [processingStatus, setProcessingStatus] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function loadDashboardData() {
      if (!user) return
      try {
        setIsLoading(true)
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
  }, [user])

  const openApproveDialog = (bookingId: string, bookingTitle: string) => {
    setSelectedBookingId(bookingId)
    setSelectedBookingTitle(bookingTitle)
    setConfirmDialogOpen(true)
  }

  const openRejectDialog = (bookingId: string, bookingTitle: string) => {
    setSelectedBookingId(bookingId)
    setSelectedBookingTitle(bookingTitle)
    setRejectDialogOpen(true)
  }

  const handleUpdateStatus = async (status: "confirmed" | "cancelled") => {
    if (!selectedBookingId) return
    
    setProcessingStatus(true)
    
    try {
      console.log(`🎯 [Dashboard] Updating booking ${selectedBookingId} to status: ${status}`)
      
      const updateData: any = { status }
      if (status === "cancelled") {
        updateData.rejection_reason = "Rejected by facility manager"
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
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Welcome, {user?.name.split(" ")[0]}!</h1>
          <p className="text-muted-foreground">
            Here's a summary of your facility's activity.
          </p>
        </div>
      </div>
      
      {/* Quick Stats */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-blue-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rooms</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRooms}</div>
            <p className="text-xs text-muted-foreground">Managed rooms</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-amber-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingBookings.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your approval</p>
          </CardContent>
        </Card>
        <Card className="overflow-hidden">
          <div className="h-1.5 bg-green-500 w-full" />
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Bookings</CardTitle>
            <BookCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todaysBookings.length}</div>
            <p className="text-xs text-muted-foreground">Confirmed for today</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Pending Booking Requests</CardTitle>
            <CardDescription>Review and respond to new booking requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingBookings.length > 0 ? (
              <div className="space-y-4">
                {pendingBookings.map((booking) => (
                  <div key={booking.id} className="flex flex-wrap items-center justify-between gap-4 p-3 rounded-lg border bg-background hover:bg-muted/50 transition-colors">
                    <div>
                      <p className="font-semibold text-primary">{booking.title}</p>
                      <div className="text-sm text-muted-foreground flex items-center gap-4 mt-1">
                        <span className="flex items-center gap-1.5"><Building className="h-4 w-4" /> {booking.rooms.name}</span>
                        <span className="flex items-center gap-1.5"><User className="h-4 w-4" /> {booking.users.name}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={() => openRejectDialog(booking.id, booking.title)}>
                        <X className="mr-1 h-4 w-4" /> Reject
                      </Button>
                      <Button size="sm" onClick={() => openApproveDialog(booking.id, booking.title)} className="bg-green-600 hover:bg-green-700">
                        <Check className="mr-1 h-4 w-4" /> Approve
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No pending requests.</p>
            )}
          </CardContent>
          {pendingBookings.length > 0 && (
            <CardFooter>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/facility-manager/bookings">View All Bookings</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Schedule</CardTitle>
            <CardDescription>A summary of today's confirmed bookings.</CardDescription>
          </CardHeader>
          <CardContent>
            {todaysBookings.length > 0 ? (
              <div className="space-y-4">
                {todaysBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center gap-4 p-3 rounded-lg border bg-background">
                    <div className="flex-shrink-0 bg-primary/10 text-primary p-3 rounded-lg">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div className="flex-grow">
                      <p className="font-semibold">{booking.title}</p>
                      <p className="text-sm text-muted-foreground">{booking.rooms.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{format(new Date(booking.start_time), 'h:mm a')}</p>
                      <p className="text-xs text-muted-foreground">to {format(new Date(booking.end_time), 'h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No bookings scheduled for today.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Confirmation Modals */}
      <AlertDialog open={confirmDialogOpen} onOpenChange={setConfirmDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to approve the booking "{selectedBookingTitle}"? This will confirm the room reservation and notify the organizer.
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

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Booking</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject the booking "{selectedBookingTitle}"? The room will remain available for other bookings and the organizer will be notified.
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
    </div>
  )
} 