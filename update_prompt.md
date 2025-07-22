# Conference Hub Implementation Prompts: Facility Manager Features

This document provides a series of prompts to guide the implementation of Facility Manager features in the Conference Hub application.

## 1. Facility Manager Dashboard

**Prompt:** Create a facility manager dashboard that displays summary information about the facilities they manage, including:
- Total number of rooms
- Bookings for today
- Pending booking requests that need approval
- Recent activity feed
- Quick access to manage rooms, resources, and bookings

The dashboard should be visually appealing with cards, charts, and statistics that give facility managers an at-a-glance view of their facilities.

## 2. Facility Management Interface

**Prompt:** Implement a facility management interface that allows facility managers to:
- View details of facilities they manage
- Edit facility information (name, location, description)
- See all rooms associated with each facility
- View utilization statistics for the facility

The interface should include a form for editing facility details and a list/grid view of rooms within the facility.

## 3. Room Management for Facility Managers

**Prompt:** Enhance the room management interface to be facility-aware, allowing facility managers to:
- View only rooms in facilities they manage
- Add new rooms to their facilities
- Edit room details (name, capacity, resources, etc.)
- Change room status (available, maintenance, reserved)
- Upload and manage room images

Include filtering and sorting options to help manage larger numbers of rooms.

## 4. Booking Approval Workflow

**Prompt:** Create a booking approval workflow for facility managers that:
- Shows a list of pending booking requests for rooms in their facilities
- Allows them to approve or reject booking requests with comments
- Sends notifications to users when their booking is approved or rejected
- Provides a calendar view to check for conflicts before approving

The interface should make it easy to review booking details, check room availability, and make quick decisions.

## 5. Resource Allocation and Management

**Prompt:** Implement a resource management system for facility managers to:
- Assign resources to rooms in their facilities
- Track resource usage and availability
- Manage resource maintenance schedules
- Add, edit, or remove resources from their inventory

Include a way to view which resources are assigned to which rooms and their current status.

## 6. Reporting and Analytics

**Prompt:** Develop reporting and analytics features for facility managers that provide:
- Room utilization reports (most/least used rooms)
- Booking trends over time (daily, weekly, monthly)
- Resource usage statistics
- User booking patterns

Reports should be visual with charts and graphs, and include options to export data in common formats (CSV, PDF).

## 7. Facility Manager Notification System

**Prompt:** Extend the notification system to support facility manager workflows:
- Alerts for new booking requests that need approval
- Notifications about room maintenance issues
- Alerts when rooms are overbooked or double-booked
- Daily summaries of bookings and activity

Notifications should be available in-app and optionally via email.

## 8. Calendar View for Facility Management

**Prompt:** Create a comprehensive calendar view for facility managers that:
- Shows all bookings across their facilities
- Allows filtering by room, resource, or status
- Supports different views (day, week, month)
- Enables drag-and-drop booking management
- Highlights conflicts or issues that need attention

The calendar should be interactive and help facility managers visualize the usage of their spaces.

## 9. User Management for Facility Managers

**Prompt:** Implement limited user management capabilities for facility managers:
- View users who frequently book rooms in their facilities
- Manage booking permissions for specific rooms
- View booking history by user
- Flag problematic booking patterns

This should respect user privacy while giving facility managers the tools they need.

## 10. Facility Manager Settings and Preferences

**Prompt:** Create a settings interface for facility managers to configure:
- Default booking approval rules
- Notification preferences
- Display preferences for their dashboard
- Automated responses for common booking scenarios

Settings should be user-friendly and help streamline the facility manager's workflow.

## 11. Mobile-Responsive Facility Management

**Prompt:** Ensure all facility management interfaces are fully responsive and work well on mobile devices, allowing facility managers to:
- Approve bookings on the go
- Check facility status from anywhere
- Receive and respond to urgent notifications
- View simplified versions of reports and analytics

Mobile views should prioritize the most common and time-sensitive actions.

## 12. Integration with Admin Features

**Prompt:** Create smooth integration between facility manager features and existing admin capabilities:
- Clear role separation between global admins and facility managers
- Ability for admins to assign users as facility managers
- Oversight tools for admins to monitor facility manager actions
- Escalation paths for issues that require admin intervention

The system should maintain appropriate access controls while enabling collaboration.

## API Routes and Backend Implementation

**Prompt:** Implement the following API routes to support facility manager features:

### Facility Management API

```typescript
// app/api/facilities/route.ts
import { NextResponse } from 'next/server'
import { getFacilities, createFacility } from '@/lib/supabase-data'
import { checkUserRole } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    // Get user from auth
    const user = await checkUserRole(['admin', 'facility_manager'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const facilities = await getFacilities(user)
    return NextResponse.json(facilities)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    // Only admins can create facilities
    const user = await checkUserRole(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()
    const facility = await createFacility(data)
    return NextResponse.json(facility)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Facility Manager Assignment API

```typescript
// app/api/facilities/[id]/managers/route.ts
import { NextResponse } from 'next/server'
import { assignFacilityManager, removeFacilityManager, getFacilityManagers } from '@/lib/supabase-data'
import { checkUserRole } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkUserRole(['admin', 'facility_manager'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const managers = await getFacilityManagers(params.id)
    return NextResponse.json(managers)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    // Only admins can assign facility managers
    const user = await checkUserRole(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()
    await assignFacilityManager(params.id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Only admins can remove facility managers
    const user = await checkUserRole(['admin'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { userId } = await request.json()
    await removeFacilityManager(params.id, userId)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

### Facility Dashboard API

```typescript
// app/api/facilities/[id]/dashboard/route.ts
import { NextResponse } from 'next/server'
import { getFacilityDashboardData } from '@/lib/supabase-data'
import { checkUserRole } from '@/lib/auth'

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const user = await checkUserRole(['admin', 'facility_manager'])
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const dashboardData = await getFacilityDashboardData(params.id)
    return NextResponse.json(dashboardData)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
```

## Authentication and Authorization Updates

**Prompt:** Update the authentication system to support facility manager role:

```typescript
// lib/auth.ts

/**
 * Check if the current user has one of the specified roles
 * @param roles Array of allowed roles
 * @returns User object if authorized, null if not
 */
export async function checkUserRole(roles: string[]): Promise<User | null> {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      console.error('Auth error:', error)
      return null
    }
    
    // Get user with role from database
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()
      
    if (userError || !user) {
      console.error('User fetch error:', userError)
      return null
    }
    
    // Check if user has one of the allowed roles
    if (!roles.includes(user.role)) {
      return null
    }
    
    return user
  } catch (error) {
    console.error('Exception in checkUserRole:', error)
    return null
  }
}

/**
 * Get facilities managed by the current user
 * @returns Array of facility IDs the user manages
 */
export async function getUserManagedFacilityIds(): Promise<string[]> {
  try {
    const supabase = createClient()
    
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error || !session) {
      return []
    }
    
    // Get user's managed facilities
    const { data, error: facilityError } = await supabase
      .from('facility_managers')
      .select('facility_id')
      .eq('user_id', session.user.id)
      
    if (facilityError) {
      console.error('Facility fetch error:', facilityError)
      return []
    }
    
    return data.map(item => item.facility_id)
  } catch (error) {
    console.error('Exception in getUserManagedFacilityIds:', error)
    return []
  }
}
```

## Implementation Approach

For each prompt, follow these steps:

1. **Design the UI/UX**: Create wireframes or mockups for the new interfaces
2. **Update data models**: Extend existing models or create new ones as needed
3. **Implement backend logic**: Create or update API endpoints and database functions
4. **Develop frontend components**: Build React components following the application's design system
5. **Add authentication and authorization**: Ensure proper access controls for facility managers
6. **Test thoroughly**: Verify all features work correctly with different user roles
7. **Document**: Update documentation for developers and end users

## Frontend Components and UI Implementation

**Prompt:** Implement the following frontend components to support facility manager features:

### Facility Manager Layout

```tsx
// app/facility-manager/layout.tsx
import { redirect } from 'next/navigation'
import { useAuth } from '@/contexts/auth-context'

export default function FacilityManagerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  
  // Check if user is a facility manager
  if (!isLoading && (!user || user.role !== 'facility_manager')) {
    redirect('/unauthorized')
  }
  
  return (
    <div className="facility-manager-layout">
      <FacilityManagerSidebar />
      <div className="content-area">
        {children}
      </div>
    </div>
  )
}
```

### Facility Manager Dashboard

```tsx
// app/facility-manager/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/contexts/auth-context'
import { getUserManagedFacilities } from '@/lib/supabase-data'

export default function FacilityManagerDashboard() {
  const { user } = useAuth()
  const [facilities, setFacilities] = useState([])
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [dashboardData, setDashboardData] = useState({
    totalRooms: 0,
    todayBookings: 0,
    pendingRequests: 0,
    recentActivity: []
  })
  const [isLoading, setIsLoading] = useState(true)
  
  useEffect(() => {
    async function loadFacilities() {
      try {
        const userFacilities = await getUserManagedFacilities()
        setFacilities(userFacilities)
        
        if (userFacilities.length > 0) {
          setSelectedFacility(userFacilities[0])
          await loadDashboardData(userFacilities[0].id)
        }
      } catch (error) {
        console.error('Error loading facilities:', error)
      } finally {
        setIsLoading(false)
      }
    }
    
    loadFacilities()
  }, [user])
  
  async function loadDashboardData(facilityId) {
    try {
      const response = await fetch(`/api/facilities/${facilityId}/dashboard`)
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
    }
  }
  
  if (isLoading) {
    return <div>Loading...</div>
  }
  
  if (facilities.length === 0) {
    return (
      <div className="empty-state">
        <h2>No Facilities Assigned</h2>
        <p>You are not currently managing any facilities.</p>
      </div>
    )
  }
  
  return (
    <div className="facility-manager-dashboard">
      <h1 className="text-2xl font-bold mb-6">Facility Manager Dashboard</h1>
      
      {facilities.length > 1 && (
        <Tabs defaultValue={selectedFacility?.id} onValueChange={(value) => {
          const facility = facilities.find(f => f.id === value)
          setSelectedFacility(facility)
          loadDashboardData(value)
        }}>
          <TabsList>
            {facilities.map(facility => (
              <TabsTrigger key={facility.id} value={facility.id}>
                {facility.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Rooms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.totalRooms}</div>
            <p className="text-muted-foreground">Total rooms in this facility</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Today's Bookings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.todayBookings}</div>
            <p className="text-muted-foreground">Bookings scheduled for today</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboardData.pendingRequests}</div>
            <p className="text-muted-foreground">Booking requests awaiting approval</p>
          </CardContent>
        </Card>
      </div>
      
      <h2 className="text-xl font-bold mt-8 mb-4">Recent Activity</h2>
      <div className="recent-activity">
        {dashboardData.recentActivity.length > 0 ? (
          <ul className="space-y-4">
            {dashboardData.recentActivity.map((activity) => (
              <li key={activity.id} className="border-b pb-2">
                <div className="flex justify-between">
                  <span className="font-medium">{activity.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {new Date(activity.timestamp).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm">{activity.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No recent activity</p>
        )}
      </div>
    </div>
  )
}
```

### Facility Manager Sidebar

```tsx
// components/facility-manager-sidebar.tsx
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  Calendar, 
  Building2, 
  BookOpen, 
  Settings,
  BarChart3,
  Users
} from 'lucide-react'

export function FacilityManagerSidebar() {
  const pathname = usePathname()
  
  const links = [
    { href: '/facility-manager', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/facility-manager/bookings', label: 'Bookings', icon: BookOpen },
    { href: '/facility-manager/rooms', label: 'Rooms', icon: Building2 },
    { href: '/facility-manager/calendar', label: 'Calendar', icon: Calendar },
    { href: '/facility-manager/reports', label: 'Reports', icon: BarChart3 },
    { href: '/facility-manager/users', label: 'Users', icon: Users },
    { href: '/facility-manager/settings', label: 'Settings', icon: Settings },
  ]
  
  return (
    <div className="facility-manager-sidebar w-64 h-screen bg-background border-r">
      <div className="p-4">
        <h2 className="text-xl font-bold">Facility Manager</h2>
      </div>
      <nav className="mt-4">
        <ul className="space-y-2">
          {links.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href
            
            return (
              <li key={link.href}>
                <Link 
                  href={link.href}
                  className={`flex items-center px-4 py-2 text-sm ${
                    isActive 
                      ? 'bg-accent text-accent-foreground' 
                      : 'text-muted-foreground hover:bg-accent/50'
                  }`}
                >
                  <Icon className="w-4 h-4 mr-3" />
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}
```

### Booking Approval Component

```tsx
// components/booking-approval.tsx
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/components/ui/use-toast'

interface BookingApprovalProps {
  booking: Booking
  onApprove: (booking: Booking, comment: string) => Promise<void>
  onReject: (booking: Booking, comment: string) => Promise<void>
}

export function BookingApproval({ booking, onApprove, onReject }: BookingApprovalProps) {
  const [comment, setComment] = useState('')
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false)
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  
  async function handleApprove() {
    try {
      setIsProcessing(true)
      await onApprove(booking, comment)
      setIsApproveDialogOpen(false)
      toast({
        title: 'Booking approved',
        description: 'The booking request has been approved successfully.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to approve booking. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  async function handleReject() {
    try {
      setIsProcessing(true)
      await onReject(booking, comment)
      setIsRejectDialogOpen(false)
      toast({
        title: 'Booking rejected',
        description: 'The booking request has been rejected.'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to reject booking. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }
  
  return (
    <div className="booking-approval-actions flex space-x-2">
      <Button 
        variant="default" 
        onClick={() => setIsApproveDialogOpen(true)}
      >
        Approve
      </Button>
      <Button 
        variant="outline" 
        onClick={() => setIsRejectDialogOpen(true)}
      >
        Reject
      </Button>
      
      <Dialog open={isApproveDialogOpen} onOpenChange={setIsApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Approve Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Add a comment (optional):</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Any additional notes for the user..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsApproveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleApprove} disabled={isProcessing}>
              {isProcessing ? 'Processing...' : 'Approve Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Booking</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium mb-2">Reason for rejection:</p>
              <Textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Please provide a reason for rejecting this booking..."
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={isProcessing || !comment}>
              {isProcessing ? 'Processing...' : 'Reject Booking'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
```

## Technical Considerations

- Leverage the existing Supabase Row Level Security (RLS) policies to enforce data access controls
- Reuse UI components from the existing application where possible
- Follow the established coding standards and architectural patterns
- Ensure all new features are properly typed with TypeScript
- Optimize database queries for performance, especially for reporting features

## Data Models and Supabase Functions

**Prompt:** Implement the following Supabase data functions to support facility manager features:

```typescript
// lib/supabase-data.ts

/**
 * Get facilities managed by the current user
 */
export async function getUserManagedFacilities(): Promise<Facility[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Get user details to check role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
      
    if (userError) {
      console.error('Error fetching user role:', userError)
      throw userError
    }
    
    // If user is admin, return all facilities
    if (userData.role === 'admin') {
      const { data, error } = await supabase
        .from('facilities')
        .select('*')
        .order('name')
        
      if (error) {
        console.error('Error fetching facilities:', error)
        throw error
      }
      
      return data || []
    }
    
    // For facility managers, get only their assigned facilities
    const { data, error } = await supabase
      .from('facility_managers')
      .select(`
        facility_id,
        facilities:facility_id (*)
      `)
      .eq('user_id', user.id)
      
    if (error) {
      console.error('Error fetching managed facilities:', error)
      throw error
    }
    
    return data.map(item => item.facilities) || []
  } catch (error) {
    console.error('Exception in getUserManagedFacilities:', error)
    throw error
  }
}

/**
 * Get dashboard data for a specific facility
 */
export async function getFacilityDashboardData(facilityId: string): Promise<any> {
  try {
    // Get total rooms count
    const { count: totalRooms, error: roomsError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true })
      .eq('facility_id', facilityId)
      
    if (roomsError) {
      console.error('Error counting rooms:', roomsError)
      throw roomsError
    }
    
    // Get today's bookings
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: todayBookingsData, error: bookingsError } = await supabase
      .from('bookings')
      .select('id')
      .gte('start_time', today.toISOString())
      .lt('start_time', tomorrow.toISOString())
      .in('room_id', supabase.from('rooms').select('id').eq('facility_id', facilityId))
      
    if (bookingsError) {
      console.error('Error counting today bookings:', bookingsError)
      throw bookingsError
    }
    
    // Get pending booking requests
    const { data: pendingData, error: pendingError } = await supabase
      .from('bookings')
      .select('id')
      .eq('status', 'pending')
      .in('room_id', supabase.from('rooms').select('id').eq('facility_id', facilityId))
      
    if (pendingError) {
      console.error('Error counting pending bookings:', pendingError)
      throw pendingError
    }
    
    // Get recent activity (bookings, status changes, etc.)
    const { data: recentActivity, error: activityError } = await supabase
      .from('bookings')
      .select(`
        id,
        title,
        start_time,
        end_time,
        status,
        created_at,
        rooms:room_id (name),
        users:user_id (name)
      `)
      .in('room_id', supabase.from('rooms').select('id').eq('facility_id', facilityId))
      .order('created_at', { ascending: false })
      .limit(10)
      
    if (activityError) {
      console.error('Error fetching recent activity:', activityError)
      throw activityError
    }
    
    // Format activity for display
    const formattedActivity = recentActivity.map(booking => ({
      id: booking.id,
      title: `${booking.status === 'pending' ? 'New booking request' : 'Booking created'}: ${booking.title}`,
      description: `${booking.users.name} booked ${booking.rooms.name} from ${new Date(booking.start_time).toLocaleString()} to ${new Date(booking.end_time).toLocaleString()}`,
      timestamp: booking.created_at
    }))
    
    return {
      totalRooms,
      todayBookings: todayBookingsData.length,
      pendingRequests: pendingData.length,
      recentActivity: formattedActivity
    }
  } catch (error) {
    console.error('Exception in getFacilityDashboardData:', error)
    throw error
  }
}

/**
 * Approve a booking request
 */
export async function approveBookingRequest(bookingId: string, comment?: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      
    if (updateError) {
      console.error('Error updating booking status:', updateError)
      throw updateError
    }
    
    // Get booking details for notification
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, title')
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('Error fetching booking details:', bookingError)
      throw bookingError
    }
    
    // Create notification for the user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        title: 'Booking Approved',
        message: `Your booking "${booking.title}" has been approved${comment ? `: ${comment}` : '.'}`,
        type: 'booking_confirmation',
        related_id: bookingId
      })
      
    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't throw here, as the booking was already updated
    }
    
    return true
  } catch (error) {
    console.error('Exception in approveBookingRequest:', error)
    throw error
  }
}

/**
 * Reject a booking request
 */
export async function rejectBookingRequest(bookingId: string, comment: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      throw new Error('User not authenticated')
    }
    
    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ 
        status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', bookingId)
      
    if (updateError) {
      console.error('Error updating booking status:', updateError)
      throw updateError
    }
    
    // Get booking details for notification
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('user_id, title')
      .eq('id', bookingId)
      .single()
      
    if (bookingError) {
      console.error('Error fetching booking details:', bookingError)
      throw bookingError
    }
    
    // Create notification for the user
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        title: 'Booking Rejected',
        message: `Your booking "${booking.title}" has been rejected: ${comment}`,
        type: 'booking_rejection',
        related_id: bookingId
      })
      
    if (notificationError) {
      console.error('Error creating notification:', notificationError)
      // Don't throw here, as the booking was already updated
    }
    
    return true
  } catch (error) {
    console.error('Exception in rejectBookingRequest:', error)
    throw error
  }
}

/**
 * Assign a user as facility manager
 */
export async function assignFacilityManager(facilityId: string, userId: string): Promise<boolean> {
  try {
    // First update user role if needed
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()
      
    if (userError) {
      console.error('Error fetching user role:', userError)
      throw userError
    }
    
    // If user is not already a facility manager, update their role
    if (userData.role !== 'facility_manager') {
      const { error: updateError } = await supabase
        .from('users')
        .update({ role: 'facility_manager' })
        .eq('id', userId)
        
      if (updateError) {
        console.error('Error updating user role:', updateError)
        throw updateError
      }
    }
    
    // Now create the facility manager assignment
    const { error } = await supabase
      .from('facility_managers')
      .insert({
        facility_id: facilityId,
        user_id: userId
      })
      
    if (error) {
      // If the error is a duplicate key error, the user is already a manager for this facility
      if (error.code === '23505') {
        return true
      }
      console.error('Error assigning facility manager:', error)
      throw error
    }
    
    // Create notification for the user
    const { data: facilityData, error: facilityError } = await supabase
      .from('facilities')
      .select('name')
      .eq('id', facilityId)
      .single()
      
    if (!facilityError) {
      await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: 'Facility Manager Assignment',
          message: `You have been assigned as a manager for ${facilityData.name}.`,
          type: 'system_notification'
        })
    }
    
    return true
  } catch (error) {
    console.error('Exception in assignFacilityManager:', error)
    throw error
  }
}
```

## Row Level Security (RLS) Policies

**Prompt:** Implement the following Row Level Security policies to secure facility manager access:

### Facilities Table

```sql
-- Enable RLS on facilities table
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins have full access to facilities" 
  ON public.facilities 
  FOR ALL 
  TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin');

-- Facility managers can view facilities they manage
CREATE POLICY "Facility managers can view their facilities" 
  ON public.facilities 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.facility_managers 
      WHERE facility_id = public.facilities.id 
      AND user_id = auth.uid()
    )
  );
```

### Rooms Table

```sql
-- Facility managers can view and manage rooms in their facilities
CREATE POLICY "Facility managers can manage their facility rooms" 
  ON public.rooms 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.facility_managers 
      WHERE facility_id = public.rooms.facility_id 
      AND user_id = auth.uid()
    )
  );
```

### Bookings Table

```sql
-- Facility managers can view and manage bookings for rooms in their facilities
CREATE POLICY "Facility managers can manage bookings for their facility rooms" 
  ON public.bookings 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms 
      JOIN public.facility_managers ON public.rooms.facility_id = public.facility_managers.facility_id 
      WHERE public.rooms.id = public.bookings.room_id 
      AND public.facility_managers.user_id = auth.uid()
    )
  );
```

### Resources Table (if facility-specific)

```sql
-- If you decide to make resources facility-specific, add this policy
CREATE POLICY "Facility managers can manage resources for their facilities" 
  ON public.resources 
  FOR ALL 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.facility_managers 
      WHERE facility_id = public.resources.facility_id 
      AND user_id = auth.uid()
    )
  );
```

Ensure these policies are properly tested to verify they correctly restrict and grant access based on user roles. 