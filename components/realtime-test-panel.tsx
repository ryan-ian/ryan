'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/components/ui/use-toast'
import { useAuth } from '@/contexts/auth-context'
import { Loader2, TestTube, Zap } from 'lucide-react'

interface RealtimeTestPanelProps {
  className?: string
}

export function RealtimeTestPanel({ className }: RealtimeTestPanelProps) {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isCreating, setIsCreating] = useState(false)
  const [testBookingTitle, setTestBookingTitle] = useState('')
  const [testRoomId, setTestRoomId] = useState('')
  const [testStartTime, setTestStartTime] = useState('')
  const [testEndTime, setTestEndTime] = useState('')

  // Only show for admin users
  if (!user || user.role !== 'admin') {
    return null
  }

  const createTestBooking = async () => {
    if (!testBookingTitle || !testRoomId || !testStartTime || !testEndTime) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields to create a test booking",
        variant: "destructive"
      })
      return
    }

    setIsCreating(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: testBookingTitle,
          room_id: testRoomId,
          start_time: testStartTime,
          end_time: testEndTime,
          description: 'Test booking created for real-time demonstration',
          attendees: 5,
          status: 'pending'
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create test booking')
      }

      const result = await response.json()
      
      toast({
        title: "Test Booking Created!",
        description: `Created "${testBookingTitle}" - Check the facility manager dashboard for real-time updates`,
        duration: 8000,
      })

      // Clear form
      setTestBookingTitle('')
      setTestRoomId('')
      setTestStartTime('')
      setTestEndTime('')

    } catch (error) {
      console.error('Error creating test booking:', error)
      toast({
        title: "Error",
        description: "Failed to create test booking. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCreating(false)
    }
  }

  const updateTestBookingStatus = async (bookingId: string, newStatus: 'confirmed' | 'cancelled') => {
    try {
      const response = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          rejection_reason: newStatus === 'cancelled' ? 'Test status change' : undefined
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update booking status')
      }

      toast({
        title: "Status Updated!",
        description: `Booking status changed to ${newStatus} - Check for real-time updates`,
        duration: 6000,
      })

    } catch (error) {
      console.error('Error updating booking status:', error)
      toast({
        title: "Error",
        description: "Failed to update booking status",
        variant: "destructive"
      })
    }
  }

  // Get tomorrow's date for default values
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Real-time Testing Panel
        </CardTitle>
        <CardDescription>
          Create test bookings to demonstrate real-time updates across the facility manager dashboard and bookings page.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="test-title">Booking Title</Label>
            <Input
              id="test-title"
              placeholder="Test Meeting Room Booking"
              value={testBookingTitle}
              onChange={(e) => setTestBookingTitle(e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-room">Room</Label>
            <Select value={testRoomId} onValueChange={setTestRoomId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a room" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="room-1">Conference Room A</SelectItem>
                <SelectItem value="room-2">Conference Room B</SelectItem>
                <SelectItem value="room-3">Meeting Room 1</SelectItem>
                <SelectItem value="room-4">Meeting Room 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-start">Start Time</Label>
            <Input
              id="test-start"
              type="datetime-local"
              value={testStartTime}
              onChange={(e) => setTestStartTime(e.target.value)}
              min={`${tomorrowStr}T09:00`}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="test-end">End Time</Label>
            <Input
              id="test-end"
              type="datetime-local"
              value={testEndTime}
              onChange={(e) => setTestEndTime(e.target.value)}
              min={`${tomorrowStr}T09:00`}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <Button 
            onClick={createTestBooking} 
            disabled={isCreating}
            className="flex-1"
          >
            {isCreating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Create Test Booking
              </>
            )}
          </Button>
        </div>

        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium mb-2">Testing Instructions:</h4>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Open the facility manager dashboard in another tab</li>
            <li>Fill in the form above and click "Create Test Booking"</li>
            <li>Watch the dashboard update in real-time with the new pending request</li>
            <li>Notice the "new" badge and counter increment automatically</li>
            <li>Approve or reject the booking to see status updates</li>
            <li>Check that all browser tabs update simultaneously</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  )
}
