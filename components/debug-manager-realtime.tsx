"use client"

import { useState } from 'react'
import { useAuth } from '@/contexts/auth-context'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CalendarDays, Clock, Building } from 'lucide-react'
import { createBooking } from '@/lib/supabase-data'
import { getRoomsByFacilityManager } from '@/lib/supabase-data'
import { useEffect } from 'react'

export function DebugManagerRealtime() {
  const { user } = useAuth()
  const [isCreating, setIsCreating] = useState(false)
  const [rooms, setRooms] = useState<any[]>([])
  const [testBooking, setTestBooking] = useState({
    roomId: '',
    title: 'Test Real-time Booking Request',
    description: 'This is a test booking to verify real-time manager notifications',
    startTime: '',
    endTime: '',
    attendees: 5
  })

  useEffect(() => {
    const loadRooms = async () => {
      if (user?.role === 'facility_manager') {
        try {
          const managerRooms = await getRoomsByFacilityManager(user.id)
          setRooms(managerRooms)
          if (managerRooms.length > 0) {
            setTestBooking(prev => ({ ...prev, roomId: managerRooms[0].id }))
          }
        } catch (error) {
          console.error('Error loading rooms:', error)
        }
      }
    }
    loadRooms()
  }, [user])

  const createTestBookingRequest = async () => {
    if (!user || !testBooking.roomId || !testBooking.startTime || !testBooking.endTime) return
    
    setIsCreating(true)
    try {
      const bookingData = {
        user_id: user.id,
        room_id: testBooking.roomId,
        title: testBooking.title,
        description: testBooking.description,
        start_time: new Date(testBooking.startTime).toISOString(),
        end_time: new Date(testBooking.endTime).toISOString(),
        attendees: testBooking.attendees,
        status: 'pending' as const,
        check_in_required: false
      }

      const result = await createBooking(bookingData)
      
      if (result) {
        console.log('✅ Test booking request created successfully:', result)
        // Reset form
        const now = new Date()
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        tomorrow.setHours(10, 0, 0, 0)
        const endTime = new Date(tomorrow)
        endTime.setHours(11, 0, 0, 0)
        
        setTestBooking(prev => ({
          ...prev,
          startTime: tomorrow.toISOString().slice(0, 16),
          endTime: endTime.toISOString().slice(0, 16)
        }))
      } else {
        console.error('❌ Failed to create test booking request')
      }
    } catch (error) {
      console.error('❌ Error creating test booking:', error)
    } finally {
      setIsCreating(false)
    }
  }

  // Set default times (tomorrow 10-11 AM)
  useEffect(() => {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(10, 0, 0, 0)
    const endTime = new Date(tomorrow)
    endTime.setHours(11, 0, 0, 0)
    
    setTestBooking(prev => ({
      ...prev,
      startTime: tomorrow.toISOString().slice(0, 16),
      endTime: endTime.toISOString().slice(0, 16)
    }))
  }, [])

  if (!user) {
    return (
      <Card className="w-full max-w-2xl">
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Please log in to test manager real-time functionality.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏢 Manager Real-time Test
          <Badge variant="outline">{user.role}</Badge>
        </CardTitle>
        <CardDescription>
          Create test booking requests to verify real-time manager notifications.
          {user.role === 'facility_manager' && ' As a facility manager, you should see your own test requests appear immediately.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="room">Room</Label>
            <select
              id="room"
              value={testBooking.roomId}
              onChange={(e) => setTestBooking(prev => ({ ...prev, roomId: e.target.value }))}
              className="w-full p-2 border rounded-md"
              disabled={rooms.length === 0}
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} - {room.location}
                </option>
              ))}
            </select>
            {rooms.length === 0 && (
              <p className="text-xs text-muted-foreground">
                {user.role === 'facility_manager' ? 'No rooms found for your facility' : 'Loading rooms...'}
              </p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="attendees">Attendees</Label>
            <Input
              id="attendees"
              type="number"
              value={testBooking.attendees}
              onChange={(e) => setTestBooking(prev => ({ ...prev, attendees: parseInt(e.target.value) || 1 }))}
              min="1"
              max="50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={testBooking.title}
            onChange={(e) => setTestBooking(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Meeting title"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={testBooking.description}
            onChange={(e) => setTestBooking(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Meeting description"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="startTime">Start Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={testBooking.startTime}
              onChange={(e) => setTestBooking(prev => ({ ...prev, startTime: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="endTime">End Time</Label>
            <Input
              id="endTime"
              type="datetime-local"
              value={testBooking.endTime}
              onChange={(e) => setTestBooking(prev => ({ ...prev, endTime: e.target.value }))}
            />
          </div>
        </div>

        <Button 
          onClick={createTestBookingRequest}
          disabled={isCreating || !testBooking.roomId || !testBooking.startTime || !testBooking.endTime}
          className="w-full"
        >
          {isCreating ? 'Creating Test Request...' : 'Create Test Booking Request'}
        </Button>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <h5 className="font-medium text-sm mb-2">🧪 How to Test Real-time Manager Functionality:</h5>
          <ol className="text-sm text-muted-foreground space-y-1">
            <li>1. Open the Manager Dashboard in another tab/window</li>
            <li>2. Open browser console (F12) in both tabs</li>
            <li>3. Fill out the form above and click "Create Test Booking Request"</li>
            <li>4. In the Manager Dashboard tab, you should see:</li>
            <li className="ml-4">• Console logs about real-time subscription</li>
            <li className="ml-4">• Toast notification for new request</li>
            <li className="ml-4">• Pending count increase immediately</li>
            <li className="ml-4">• "+1 new" badge appear (fades after 5 seconds)</li>
            <li className="ml-4">• New request appear in the pending list</li>
            <li>5. Approve/reject the request and see real-time updates</li>
          </ol>
        </div>

        <div className="p-3 bg-blue-50 dark:bg-blue-950/50 rounded-lg">
          <p className="text-sm text-blue-700 dark:text-blue-300">
            <strong>💡 Pro Tip:</strong> Check the browser console for detailed real-time logs. 
            Look for messages starting with "🏢 [Manager Realtime]" to track the subscription status.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
