"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format, isAfter, isBefore, isWithinInterval, parseISO, addMinutes, differenceInMinutes } from "date-fns"
import { AlertCircle, CheckCircle, Clock, Loader2, WifiOff } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { RoomStatusIndicator, type RoomStatusType } from "@/components/ui/room-status-indicator"
import { RoomFeaturesDisplay } from "@/components/ui/room-features-display"
import { RoomInfoCarousel } from "@/components/ui/room-info-carousel"
import { FullscreenToggle } from "@/components/ui/fullscreen-toggle"
import { CountdownTimer } from "@/components/ui/countdown-timer"
import { OccupancySensor, type OccupancyStatus } from "@/components/ui/occupancy-sensor"
import { CheckInManager } from "@/components/ui/check-in-manager"
import { IssueReportForm } from "@/components/ui/issue-report-form"
import { RoomStatusSync } from "@/components/ui/room-status-sync"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { supabase } from "@/lib/supabase"
import type { Room, Booking, BookingWithDetails, Resource } from "@/types"
import { StatusRing } from "@/components/displays/status-ring"
import { HeroClock } from "@/components/displays/hero-clock"
import { ScheduleRail } from "@/components/displays/schedule-rail"
import { RoomBanner } from "@/components/displays/room-banner"
import { ActionBar } from "@/components/displays/action-bar"
import { MeetingInProgressCard } from "@/components/displays/meeting-in-progress-card"
import { RoomStatusCircle } from "@/components/displays/room-status-circle"
import { NextMeetingCard } from "@/components/displays/next-meeting-card"

// Constants
const CHECK_IN_GRACE_PERIOD_MINUTES = 15

export default function RoomDisplayPage() {
  const params = useParams()
  const roomName = params.roomName as string

  const [room, setRoom] = useState<Room | null>(null)
  const [bookings, setBookings] = useState<BookingWithDetails[]>([])
  const [resources, setResources] = useState<Resource[]>([])
  const [currentBooking, setCurrentBooking] = useState<BookingWithDetails | null>(null)
  const [nextBooking, setNextBooking] = useState<BookingWithDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [roomStatus, setRoomStatus] = useState<RoomStatusType>("available")
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyStatus>("loading")
  const [occupancyCount, setOccupancyCount] = useState<number | undefined>(undefined)
  const [syncError, setSyncError] = useState<string | null>(null)

  // Fetch room and booking data
  useEffect(() => {
    const fetchRoomAndBookings = async () => {
      try {
        // Fetch room data
        const { data: roomsData, error: roomsError } = await supabase
          .from('rooms')
          .select('*')
          .ilike('name', `%${decodeURIComponent(roomName)}%`)
          .limit(1)

        if (roomsError) throw roomsError

        if (roomsData && roomsData.length > 0) {
          setRoom(roomsData[0])

          // Get today's date in ISO format (YYYY-MM-DD)
          const today = new Date()
          const dateString = today.toISOString().split('T')[0]

          // Fetch bookings for this room for today
          const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
              *,
              users:user_id (id, name, email)
            `)
            .eq('room_id', roomsData[0].id)
            .gte('start_time', `${dateString}T00:00:00.000Z`)
            .lte('end_time', `${dateString}T23:59:59.999Z`)
            .in('status', ['confirmed', 'pending'])
            .order('start_time', { ascending: true })

          if (bookingsError) throw bookingsError

          setBookings(bookingsData || [])

          // Fetch resources for this room
          if (roomsData[0].room_resources && roomsData[0].room_resources.length > 0) {
            const { data: resourcesData, error: resourcesError } = await supabase
              .from('resources')
              .select('*')
              .in('id', roomsData[0].room_resources)

            if (resourcesError) throw resourcesError

            setResources(resourcesData || [])
          }

          // Simulate occupancy sensor data
          // In a real app, this would come from an actual sensor
          simulateOccupancySensor(roomsData[0])
        }
      } catch (error) {
        console.error("Error fetching room data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchRoomAndBookings()
  }, [roomName])

  // Simulate occupancy sensor data
  const simulateOccupancySensor = (room: Room) => {
    // Simulate a delay for sensor data
    setTimeout(() => {
      if (room.status === "maintenance") {
        setOccupancyStatus("unknown")
        setOccupancyCount(undefined)
        return
      }

      // Generate random occupancy data based on room status
      if (room.status === "available") {
        // 80% chance room is vacant, 20% chance it has 1-2 people
        const isVacant = Math.random() < 0.8
        if (isVacant) {
          setOccupancyStatus("vacant")
          setOccupancyCount(0)
        } else {
          setOccupancyStatus("occupied")
          setOccupancyCount(Math.floor(Math.random() * 2) + 1)
        }
      } else if (room.status === "reserved") {
        // 60% chance room is occupied, 40% chance it's vacant
        const isOccupied = Math.random() < 0.6
        if (isOccupied) {
          const count = Math.floor(Math.random() * 3) + 1
          setOccupancyStatus("occupied")
          setOccupancyCount(count)
        } else {
          setOccupancyStatus("vacant")
          setOccupancyCount(0)
        }
      } else {
        // Room is booked, simulate occupancy based on capacity
        const capacity = room.capacity || 10
        const baseOccupancy = Math.floor(capacity * 0.3) // At least 30% of capacity
        const variableOccupancy = Math.floor(Math.random() * (capacity * 0.7)) // Up to 70% more
        const count = baseOccupancy + variableOccupancy

        if (count > capacity) {
          setOccupancyStatus("over-capacity")
        } else if (count > 0) {
          setOccupancyStatus("occupied")
        } else {
          setOccupancyStatus("vacant")
        }

        setOccupancyCount(count)
      }
    }, 1500) // Simulate sensor delay
  }

  // Update current time and determine current/next booking
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Find current booking
      const current = bookings.find(booking =>
        isWithinInterval(now, {
          start: parseISO(booking.start_time),
          end: parseISO(booking.end_time)
        })
      )

      // Find next booking
      const next = bookings.find(booking =>
        isAfter(parseISO(booking.start_time), now)
      )

      // Update current and next bookings

      setCurrentBooking(current || null)
      setNextBooking(next || null)

      // Determine room status based on booking and check-in status
      if (current) {
        // Check if the current booking has been checked in
        if (current.checked_in_at) {
          setRoomStatus("meeting-in-progress")
        } else {
          setRoomStatus("occupied")
        }
      } else if (room?.status === "maintenance") {
        setRoomStatus("maintenance")
      } else if (next && isWithinInterval(now, {
        start: addMinutes(parseISO(next.start_time), -15),
        end: parseISO(next.start_time)
      })) {
        setRoomStatus("reserved")
      } else {
        setRoomStatus("available")
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [bookings, room])

  // Handle check-in success
  const handleCheckInSuccess = (checkedInAt: string) => {
    console.log(`✅ Room checked in at ${checkedInAt}`)
    // Refresh bookings to get updated data
    // This could trigger a re-fetch of booking data if needed
  }

  // Handle auto-release
  const handleAutoRelease = () => {
    console.log("🔄 Room auto-released due to no check-in")
    // Remove the current booking from the UI
    if (currentBooking) {
      setBookings(prevBookings =>
        prevBookings.filter(booking => booking.id !== currentBooking.id)
      )
      setCurrentBooking(null)
    }
  }

  // Handle real-time bookings update
  const handleBookingsUpdate = (updatedBookings: BookingWithDetails[]) => {
    console.log(`📡 [Display] Received ${updatedBookings.length} updated bookings`)
    setBookings(updatedBookings)
    setSyncError(null) // Clear any previous sync errors
  }

  // Handle sync errors
  const handleSyncError = (error: string) => {
    console.error(`❌ [Display] Sync error:`, error)
    setSyncError(error)
    // Clear error after 10 seconds
    setTimeout(() => setSyncError(null), 10000)
  }

  // Format time for display (e.g., "9:00 AM")
  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), "h:mm a")
  }

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!room) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center p-4">
        <WifiOff className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Room Not Found</h1>
        <p className="text-muted-foreground mt-2">
          The room "{decodeURIComponent(roomName)}" could not be found.
        </p>
      </div>
    )
  }

  // Extract features from room data
  const features = room.description ?
    room.description.split(',').map(item => item.trim()) :
    []

  return (
    <div className="flex flex-col h-full relative overflow-hidden">
      {/* Dark Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        {/* Subtle geometric shapes with modern colors */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-purple-900/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-blue-900/10 rounded-full blur-2xl animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-emerald-900/10 rounded-full blur-2xl animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-gray-700/20 rounded-full blur-2xl animate-float delay-500"></div>
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-indigo-900/10 rounded-full blur-2xl animate-float delay-100"></div>

        {/* Subtle grid pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23374151' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='1.5'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}></div>

        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-gray-900/95 via-gray-900/90 to-gray-900/95"></div>
      </div>

      {/* Real-time status sync */}
      {room && (
        <RoomStatusSync
          roomId={room.id}
          onBookingsUpdate={handleBookingsUpdate}
          onError={handleSyncError}
          enabled={true}
          syncInterval={30000} // 30 seconds
        />
      )}

      {/* Modern Header */}
      <header className="relative z-10">
        <RoomBanner
          name={room.name}
          location={room.location}
          status={roomStatus}
          capacity={room.capacity}
          occupancyCount={occupancyCount}
          syncError={syncError}
          currentTime={currentTime}
        />
      </header>

      {/* Enhanced Main Content */}
      <main className="relative z-10 flex-1 p-6 overflow-auto">
        {roomStatus === "meeting-in-progress" && currentBooking ? (
          /* Meeting in Progress Layout with Modern Cards */
          <div className="space-y-8">
            {/* Prominent Meeting Information */}
            <MeetingInProgressCard booking={currentBooking} />

            {/* Secondary information in a modern grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left: Enhanced Schedule Rail */}
              <div>
                <Card className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-teal-500 rounded-full"></div>
                      Today's Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScheduleRail bookings={bookings} now={currentTime} currentId={currentBooking?.id} />
                  </CardContent>
                </Card>
              </div>

              {/* Center: Enhanced Status Ring + Clock */}
              <div className="flex flex-col items-center gap-8">
                <div className="relative">
                  <StatusRing
                    status={roomStatus}
                    now={currentTime}
                    startTime={currentBooking?.start_time}
                    endTime={currentBooking?.end_time}
                    nextStartTime={nextBooking?.start_time}
                  />
                  {/* Subtle glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-brand-teal-500/10 to-brand-navy-500/10 rounded-full blur-3xl -z-10"></div>
                </div>
                <HeroClock now={currentTime} />
              </div>

              {/* Right: Enhanced Actions + Room Info */}
              <div className="space-y-8">
                <ActionBar
                  room={room}
                  currentBooking={currentBooking}
                  onCheckInSuccess={handleCheckInSuccess}
                  onAutoRelease={handleAutoRelease}
                />
                <Card className="overflow-hidden backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-teal-500 rounded-full"></div>
                      Room Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="h-[200px]">
                      <RoomInfoCarousel room={room} resources={resources} className="h-full" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        ) : (
          /* New 2-Column Layout matching target design */
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-12 h-full min-h-[600px]">
            {/* Left: Status Circle and Next Meeting */}
            <div className="flex flex-col justify-between">
              {/* Status Circle centered */}
              <div className="flex-1 flex items-center justify-center">
                <RoomStatusCircle status={roomStatus} size={300} />
              </div>

              {/* Next Meeting Card at bottom */}
              <div className="w-full max-w-sm mx-auto">
                <NextMeetingCard nextBooking={nextBooking} />
              </div>
            </div>

            {/* Right: Schedule */}
            <div className="flex flex-col h-full">
              <div className="bg-gray-800/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 h-full shadow-lg shadow-gray-900/20">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  <h2 className="text-white text-xl font-semibold">Today's Schedule</h2>
                </div>

                <div className="overflow-auto flex-1">
                  <ScheduleRail bookings={bookings} now={currentTime} currentId={currentBooking?.id} />
                </div>
              </div>
            </div>
          </div>
        )}
      </main>


    </div>
  )
}