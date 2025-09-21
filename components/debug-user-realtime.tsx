"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react'
import { updateBooking } from '@/lib/supabase-data'

export function DebugUserRealtime() {
  const { user } = useAuth()
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedBooking, setSelectedBooking] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<'confirmed' | 'cancelled' | 'rejected'>('confirmed')
  const [userBookings, setUserBookings] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const fetchUserBookings = async () => {
    if (!user) return
    
    setIsLoading(true)
    try {
      const { authenticatedFetch } = await import('@/lib/auth-utils')
      const response = await authenticatedFetch(`/api/bookings/user?user_id=${user.id}`)
      const bookings = await response.json()
      
      // Filter only pending bookings for testing
      const pendingBookings = Array.isArray(bookings) ? bookings.filter(b => b.status === 'pending') : []
      setUserBookings(pendingBookings)
      
      if (pendingBookings.length > 0) {
        setSelectedBooking(pendingBookings[0].id)
      }
    } catch (error) {
      console.error('Error fetching user bookings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const simulateStatusChange = async () => {
    if (!selectedBooking) return
    
    setIsUpdating(true)
    try {
      // Update the booking status to trigger real-time update
      await updateBooking(selectedBooking, { 
        status: selectedStatus,
        rejection_reason: selectedStatus === 'rejected' ? 'Test rejection for real-time demo' : undefined
      })
      
      console.log(`✅ Updated booking ${selectedBooking} to status: ${selectedStatus}`)
      
      // Refresh bookings list
      setTimeout(fetchUserBookings, 1000)
    } catch (error) {
      console.error('❌ Error updating booking status:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  // Load bookings on component mount
  React.useEffect(() => {
    if (user) {
      fetchUserBookings()
    }
  }, [user])

  if (!user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to test user real-time functionality.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          👤 User Real-time Test
          <Badge variant="outline">{user.role}</Badge>
        </CardTitle>
        <CardDescription>
          Simulate booking status changes to test real-time user notifications and updates.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button
            onClick={fetchUserBookings}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            {isLoading ? 'Loading...' : 'Refresh Pending Bookings'}
          </Button>
          <Badge variant="secondary">
            {userBookings.length} pending booking{userBookings.length !== 1 ? 's' : ''}
          </Badge>
        </div>

        {userBookings.length === 0 ? (
          <div className="text-center p-6 bg-muted/50 rounded-lg">
            <AlertTriangle className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No pending bookings found. Create a booking first to test real-time status updates.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Booking to Update:</label>
              <Select value={selectedBooking} onValueChange={setSelectedBooking}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a pending booking" />
                </SelectTrigger>
                <SelectContent>
                  {userBookings.map((booking) => (
                    <SelectItem key={booking.id} value={booking.id}>
                      {booking.title} - {new Date(booking.start_time).toLocaleDateString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">New Status:</label>
              <Select value={selectedStatus} onValueChange={(value: any) => setSelectedStatus(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="confirmed">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      Confirmed
                    </div>
                  </SelectItem>
                  <SelectItem value="cancelled">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      Cancelled
                    </div>
                  </SelectItem>
                  <SelectItem value="rejected">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-orange-500" />
                      Rejected
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={simulateStatusChange}
              disabled={isUpdating || !selectedBooking}
              className="w-full"
            >
              {isUpdating ? 'Updating Status...' : `Update to ${selectedStatus}`}
            </Button>
          </>
        )}

        <div className="space-y-2">
          <h5 className="font-medium text-sm">Current Pending Bookings:</h5>
          <div className="max-h-32 overflow-y-auto space-y-1">
            {userBookings.map((booking) => (
              <div 
                key={booking.id} 
                className="p-2 text-xs border rounded bg-muted/50"
              >
                <div className="font-medium">{booking.title}</div>
                <div className="text-muted-foreground">
                  {new Date(booking.start_time).toLocaleString()} • Status: {booking.status}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium text-sm mb-2">🧪 How to Test User Real-time:</h5>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Open User Bookings page (/conference-room-booking/bookings) in another tab</li>
            <li>2. Open browser console (F12) in both tabs</li>
            <li>3. Select a pending booking above and choose a new status</li>
            <li>4. Click "Update to [status]"</li>
            <li>5. In the User Bookings tab, you should see:</li>
            <li className="ml-4">• Console logs about real-time subscription</li>
            <li className="ml-4">• Toast notification for status change</li>
            <li className="ml-4">• Booking list update immediately</li>
            <li className="ml-4">• "+X updates" badge on refresh button (briefly)</li>
            <li className="ml-4">• No need to manually refresh the page</li>
          </ol>
        </div>

        <div className="p-3 bg-green-50 dark:bg-green-950/50 rounded-lg">
          <p className="text-sm text-green-700 dark:text-green-300">
            <strong>💡 Expected Behavior:</strong> When you update a booking status, 
            the user should receive an instant toast notification and see their bookings 
            list update in real-time without refreshing the page.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
