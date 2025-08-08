"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react"
import { format } from "date-fns"

interface TestBooking {
  id: string
  title: string
  start_time: string
  end_time: string
  status: string
  checked_in_at?: string
  auto_release_at?: string
  grace_period_minutes?: number
}

export default function TestCheckInPage() {
  const [bookings, setBookings] = useState<TestBooking[]>([])
  const [loading, setLoading] = useState(true)
  const [testResults, setTestResults] = useState<Record<string, any>>({})

  useEffect(() => {
    fetchTestBookings()
  }, [])

  const fetchTestBookings = async () => {
    try {
      // This would fetch test bookings from your API
      // For now, we'll create some mock data
      const mockBookings: TestBooking[] = [
        {
          id: "test-1",
          title: "Test Meeting 1",
          start_time: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
          end_time: new Date(Date.now() + 55 * 60 * 1000).toISOString(), // 55 minutes from now
          status: "confirmed",
          grace_period_minutes: 15
        },
        {
          id: "test-2", 
          title: "Test Meeting 2",
          start_time: new Date(Date.now() + 60 * 60 * 1000).toISOString(), // 1 hour from now
          end_time: new Date(Date.now() + 120 * 60 * 1000).toISOString(), // 2 hours from now
          status: "confirmed",
          grace_period_minutes: 15
        }
      ]
      
      setBookings(mockBookings)
    } catch (error) {
      console.error("Error fetching test bookings:", error)
    } finally {
      setLoading(false)
    }
  }

  const testCheckIn = async (bookingId: string) => {
    setTestResults(prev => ({ ...prev, [bookingId]: { loading: true } }))
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: 'test-user' })
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({ 
        ...prev, 
        [bookingId]: { 
          success: data.success, 
          message: data.success ? 'Check-in successful' : data.error,
          checked_in_at: data.checked_in_at
        } 
      }))
      
      if (data.success) {
        // Update the booking in the list
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, checked_in_at: data.checked_in_at }
            : booking
        ))
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [bookingId]: { 
          success: false, 
          message: 'Network error' 
        } 
      }))
    }
  }

  const testAutoRelease = async (bookingId: string) => {
    setTestResults(prev => ({ ...prev, [`${bookingId}-release`]: { loading: true } }))
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/auto-release`, {
        method: 'POST'
      })
      
      const data = await response.json()
      
      setTestResults(prev => ({ 
        ...prev, 
        [`${bookingId}-release`]: { 
          success: data.success, 
          message: data.success ? 'Auto-release successful' : data.error,
          auto_released_at: data.auto_released_at
        } 
      }))
      
      if (data.success) {
        // Update the booking status
        setBookings(prev => prev.map(booking => 
          booking.id === bookingId 
            ? { ...booking, status: 'cancelled' }
            : booking
        ))
      }
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [`${bookingId}-release`]: { 
          success: false, 
          message: 'Network error' 
        } 
      }))
    }
  }

  const getCheckInStatus = async (bookingId: string) => {
    setTestResults(prev => ({ ...prev, [`${bookingId}-status`]: { loading: true } }))
    
    try {
      const response = await fetch(`/api/bookings/${bookingId}/check-in`)
      const data = await response.json()
      
      setTestResults(prev => ({ 
        ...prev, 
        [`${bookingId}-status`]: { 
          success: data.success, 
          checkInStatus: data.checkInStatus,
          message: data.success ? 'Status fetched' : data.error
        } 
      }))
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [`${bookingId}-status`]: { 
          success: false, 
          message: 'Network error' 
        } 
      }))
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Check-in Flow Test Page</h1>
        <p className="text-muted-foreground">
          Test the check-in functionality with sample bookings
        </p>
      </div>

      <div className="grid gap-6">
        {bookings.map((booking) => (
          <Card key={booking.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{booking.title}</CardTitle>
                  <CardDescription>
                    {format(new Date(booking.start_time), "MMM d, h:mm a")} - {format(new Date(booking.end_time), "h:mm a")}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                    {booking.status}
                  </Badge>
                  {booking.checked_in_at && (
                    <Badge variant="outline" className="text-green-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Checked In
                    </Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Check-in Test */}
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Check-in Test</h4>
                    <p className="text-sm text-muted-foreground">Test the check-in functionality</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={() => testCheckIn(booking.id)}
                      disabled={testResults[booking.id]?.loading || booking.checked_in_at}
                    >
                      {testResults[booking.id]?.loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Check In
                    </Button>
                    {testResults[booking.id] && (
                      <div className={`text-sm flex items-center ${testResults[booking.id].success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResults[booking.id].success ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                        {testResults[booking.id].message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Auto-release Test */}
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Auto-release Test</h4>
                    <p className="text-sm text-muted-foreground">Test the auto-release functionality</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => testAutoRelease(booking.id)}
                      disabled={testResults[`${booking.id}-release`]?.loading || booking.status === 'cancelled'}
                    >
                      {testResults[`${booking.id}-release`]?.loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Auto Release
                    </Button>
                    {testResults[`${booking.id}-release`] && (
                      <div className={`text-sm flex items-center ${testResults[`${booking.id}-release`].success ? 'text-green-600' : 'text-red-600'}`}>
                        {testResults[`${booking.id}-release`].success ? <CheckCircle className="h-4 w-4 mr-1" /> : <AlertCircle className="h-4 w-4 mr-1" />}
                        {testResults[`${booking.id}-release`].message}
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Check Test */}
                <div className="flex items-center justify-between p-3 border rounded">
                  <div>
                    <h4 className="font-medium">Status Check Test</h4>
                    <p className="text-sm text-muted-foreground">Get current check-in status</p>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => getCheckInStatus(booking.id)}
                      disabled={testResults[`${booking.id}-status`]?.loading}
                    >
                      {testResults[`${booking.id}-status`]?.loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                      Get Status
                    </Button>
                    {testResults[`${booking.id}-status`]?.checkInStatus && (
                      <div className="text-sm">
                        <Badge variant={testResults[`${booking.id}-status`].checkInStatus.canCheckIn ? 'default' : 'secondary'}>
                          {testResults[`${booking.id}-status`].checkInStatus.canCheckIn ? 'Can Check In' : 'Cannot Check In'}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
