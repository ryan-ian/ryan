"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { format, isAfter, isBefore, isWithinInterval, parseISO, addMinutes, differenceInMinutes } from "date-fns"
import { AlertCircle, CheckCircle, Clock, Loader2, WifiOff, User, Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/ui-patterns/status-badge"
import { RoomStatusIndicator, type RoomStatusType } from "@/components/ui/room-status-indicator"
import { FullscreenToggle } from "@/components/ui/fullscreen-toggle"
import { RoomFeaturesDisplay } from "@/components/ui/room-features-display"
import { RoomInfoCarousel } from "@/components/ui/room-info-carousel"
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
import { MeetingCarousel } from "@/components/displays/meeting-carousel"
import { QRAttendance } from "@/components/displays/qr-attendance"
import { TopBar } from "@/components/displays/top-bar"


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
  const [scheduleCollapsed, setScheduleCollapsed] = useState(false)

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
          const roomData = roomsData[0] as Room
          setRoom(roomData)

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
            .eq('room_id', roomData.id)
            .gte('start_time', `${dateString}T00:00:00.000Z`)
            .lte('end_time', `${dateString}T23:59:59.999Z`)
            .in('status', ['confirmed', 'pending'])
            .order('start_time', { ascending: true })

          if (bookingsError) throw bookingsError

          setBookings(bookingsData || [])

          // Fetch resources for this room
          if (roomData.room_resources && roomData.room_resources.length > 0) {
            const { data: resourcesData, error: resourcesError } = await supabase
              .from('resources')
              .select('*')
              .in('id', roomData.room_resources)

            if (resourcesError) throw resourcesError

            setResources(resourcesData || [])
          }

          // Simulate occupancy sensor data
          // In a real app, this would come from an actual sensor
          simulateOccupancySensor(roomData)
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
  const handleCheckInSuccess = async (checkedInAt: string) => {
    console.log(`✅ Room checked in at ${checkedInAt}`)
    
    // Immediately update the current booking with check-in data
    if (currentBooking) {
      const updatedBooking = {
        ...currentBooking,
        checked_in_at: checkedInAt
      }
      
      // Update the bookings array with the checked-in booking
      setBookings(prevBookings =>
        prevBookings.map(booking =>
          booking.id === currentBooking.id ? updatedBooking : booking
        )
      )
      
      // Update current booking state
      setCurrentBooking(updatedBooking)
      
      // Immediately set room status to "meeting-in-progress"
      setRoomStatus("meeting-in-progress")
      
      console.log(`🔄 [Display] Room status immediately updated to "meeting-in-progress"`)
    }
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
      {/* Modern Background with Business Meeting Image */}
      <div className="absolute inset-0">
        {/* Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: 'url("/room-business-meeting.jpg")'
          }}
        />
        
        {/* Dynamic overlay based on room status */}
        {roomStatus === "meeting-in-progress" ? (
          <>
            {/* Meeting in progress - darker overlay for better contrast */}
            <div className="absolute inset-0 bg-black/60 dark:bg-black/70"></div>
            {/* Teal gradient overlay for meeting in progress */}
            {/* <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/40 via-brand-teal-900/30 to-brand-navy-900/40"></div> */}
          </>
        ) : (
          <>
            {/* Default overlay for other statuses */}
            <div className="absolute inset-0 bg-black/40 dark:bg-black/60"></div>
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-brand-navy-900/20 via-brand-navy-800/30 to-brand-navy-900/20"></div>
          </>
        )}
        
        {/* Subtle geometric shapes with brand colors */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-brand-teal-200/20 dark:bg-brand-teal-500/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-brand-navy-300/20 dark:bg-brand-navy-600/10 rounded-full blur-2xl animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-brand-teal-300/15 dark:bg-brand-teal-400/8 rounded-full blur-2xl animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-brand-navy-400/20 dark:bg-brand-navy-500/10 rounded-full blur-2xl animate-float delay-500"></div>
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-brand-teal-100/25 dark:bg-brand-teal-600/8 rounded-full blur-2xl animate-float delay-100"></div>
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

      {/* Modern Header with Enhanced Glassmorphism and Time - Hidden for meeting-in-progress */}
      
        <header className="relative z-10 p-6">
          <div className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 rounded-2xl border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30">
            <div className="flex items-center justify-between gap-4 px-6 py-4">
              <div className="flex items-center gap-4">
                <RoomStatusIndicator status={roomStatus} size="sm" />
                <div>
                  <div className="text-2xl font-bold text-brand-navy-900 dark:text-brand-navy-50 tracking-tight">{room.name}</div>
                  {room.location && <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400 font-medium">{room.location}</div>}
                </div>
                <div className="ml-2"><StatusBadge status={roomStatus} size="md" /></div>
                {typeof room.capacity === 'number' && (
                  <div className="ml-2 text-sm px-3 py-1.5 rounded-full bg-brand-teal-100 dark:bg-brand-teal-900/30 text-brand-teal-700 dark:text-brand-teal-300 font-semibold border border-brand-teal-200 dark:border-brand-teal-700">
                    Capacity: {room.capacity}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                {syncError && (
                  <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800">
                    <WifiOff className="h-4 w-4 mr-2" /> Offline
                  </div>
                )}
                <div className="text-right">
                  <div className="text-3xl font-bold text-brand-navy-900 dark:text-brand-navy-50">
                    {format(currentTime, 'HH:mm')}
                  </div>
                  <div className="text-sm text-brand-navy-600 dark:text-brand-navy-400 font-medium">
                    {format(currentTime, 'EEEE, MMMM d')}
                  </div>
                </div>
                <FullscreenToggle />
              </div>
            </div>
          </div>
        </header>
      

                           {/* Enhanced Main Content with Modern Styling */}
        <main className="relative z-10 flex-1 p-6 overflow-hidden">
          <div className="w-full h-full">
        {roomStatus === "meeting-in-progress" && currentBooking ? (
          /* New Meeting in Progress Layout - Full Screen Design */
          <div className="relative w-full ">
           

            {/* Main Content - Centered Meeting Info */}
            <div className="flex-1 flex items-center justify-center pt-0 pb-0">
              <div className="text-center space-y-2">
                {/* Meeting Title */}
                <div className="space-y-4">
                  <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">
                    {currentBooking.title}
                  </h1>
                  <div className="flex items-center justify-center gap-2 text-white/90">
                    <User className="h-6 w-6" />
                    <span className="text-2xl font-medium">
                       {currentBooking.users?.name || "Unknown Organizer"}
                    </span>
                  </div>
                </div>

                {/* Large Circular Timer */}
                <div className="flex justify-center">
                  <StatusRing
                    status={roomStatus}
                    now={currentTime}
                    startTime={currentBooking?.start_time}
                    endTime={currentBooking?.end_time}
                    nextStartTime={nextBooking?.start_time}
                    size={400}
                    thickness={18}
                    showTimer={true}
                    className="drop-shadow-2xl"
                  />
                </div>

                {/* Meeting End Time */}
                <div className="text-center">
                  <p className="text-xl text-white/80 font-medium">
                    Ends at {format(new Date(currentBooking.end_time), 'h:mm a')}
                  </p>
                </div>

                {/* Meeting in Progress Badge */}
                {/* <div className="flex justify-center">
                  <Badge className="bg-brand-teal-500 text-white px-8 py-4 text-xl font-bold animate-pulse rounded-full shadow-xl border-2 border-white/30 backdrop-blur-sm bg-gradient-to-r from-brand-teal-500 to-brand-teal-600">
                    Meeting in Progress
                  </Badge>
                </div> */}
              </div>
            </div>

            {/* Bottom Left: QR Attendance */}
            <div className="fixed bottom-6 left-6 z-30">
              <QRAttendance
                bookingId={currentBooking.id}
                meetingTitle={currentBooking.title}
                className="w-72"
              />
            </div>

            {/* Right Side: Schedule Rail */}
            {!scheduleCollapsed && (
              <div className="fixed top-40 right-6 bottom-6 w-80 z-30">
                <Card className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                  <CardHeader className="pb-4 flex flex-row items-center justify-between">
                    <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg font-semibold flex items-center gap-2">
                      <div className="w-2 h-2 bg-brand-teal-500 rounded-full animate-pulse"></div>
                      Today's Schedule
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setScheduleCollapsed(true)}
                      className="text-brand-navy-600 hover:text-brand-navy-800 dark:text-brand-navy-400 dark:hover:text-brand-navy-200"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent className="flex-1 overflow-auto">
                    <ScheduleRail 
                      bookings={bookings} 
                      now={currentTime} 
                      currentId={currentBooking?.id}
                      showDescription={true}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Collapsed Schedule Button */}
            {scheduleCollapsed && (
              <div className="fixed bottom-6 right-6 z-30">
                <Button
                  onClick={() => setScheduleCollapsed(false)}
                  className="bg-brand-navy-800/90 hover:bg-brand-navy-700/90 text-white border border-white/20 backdrop-blur-md shadow-xl rounded-2xl px-6 py-4"
                >
                  <Calendar className="h-5 w-5 mr-2" />
                  Show Schedule ({bookings.length})
                  <ChevronLeft className="h-4 w-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        ) : roomStatus === "available" ? (
          /* Available State - Full Width Animated Carousel */
          <div className="h-full">
            <MeetingCarousel
              bookings={bookings}
              currentTime={currentTime}
              className="h-full"
            />
          </div>
        ) : (
          /* Enhanced Standard 2-zone Layout with Full Height Schedule and Centered Status */
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 h-full min-h-0">
            {/* Left: Main Status Area - Better vertical distribution */}
            <div className="order-1 flex flex-col items-center justify-start gap-4 py-6 overflow-y-auto">
              <StatusRing
                status={roomStatus}
                now={currentTime}
                startTime={currentBooking?.start_time}
                endTime={currentBooking?.end_time}
                nextStartTime={nextBooking?.start_time}
                size={320}
                className="mb-6"
              />
              
              {/* Meeting Information and QR Code - Side by side when QR is available */}
              {currentBooking && (
                <div className={`w-full max-w-2xl ${currentBooking.checked_in_at ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
                  {/* Meeting Information */}
                  <Card className="backdrop-blur-md bg-white/95 dark:bg-brand-navy-800/95 border border-white/30 dark:border-brand-navy-700/50 shadow-xl rounded-2xl">
                    <CardContent className="p-4">
                      <h2 className="text-xl font-bold mb-2">{currentBooking.title}</h2>
                      {currentBooking.description && (
                        <p className="text-sm mb-3 text-brand-navy-700 dark:text-brand-navy-300">{currentBooking.description}</p>
                      )}
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                          <span className="font-semibold text-brand-navy-900 dark:text-brand-navy-100">
                            {currentBooking.users?.name || "Unknown Organizer"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-brand-navy-500 dark:text-brand-navy-400" />
                          <span className="text-brand-navy-700 dark:text-brand-navy-300">
                            {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* QR Attendance - Only show if checked in */}
                  {currentBooking.checked_in_at && (
                    <QRAttendance
                      bookingId={currentBooking.id}
                      meetingTitle={currentBooking.title}
                      compact={true}
                      className="backdrop-blur-md bg-white/95 dark:bg-brand-navy-800/95 border border-white/30 dark:border-brand-navy-700/50 shadow-xl rounded-2xl"
                    />
                  )}
                </div>
              )}
              
              {/* Action Bar */}
              <div className="w-full max-w-2xl">
                <ActionBar
                  room={room}
                  currentBooking={currentBooking}
                  onCheckInSuccess={handleCheckInSuccess}
                  onAutoRelease={handleAutoRelease}
                  compact={true}
                />
              </div>
            </div>

            {/* Right: Schedule Rail (Full Height) */}
            <div className="order-2 h-full">
              <Card className="backdrop-blur-md bg-white/90 dark:bg-brand-navy-800/90 border border-white/30 dark:border-brand-navy-700/50 shadow-xl shadow-brand-navy-900/10 dark:shadow-brand-navy-950/30 rounded-2xl hover:shadow-2xl transition-all duration-300 h-full flex flex-col">
                <CardHeader className="pb-4">
                  <CardTitle className="text-brand-navy-900 dark:text-brand-navy-50 text-lg font-semibold flex items-center gap-2">
                    <div className="w-2 h-2 bg-brand-teal-500 rounded-full animate-pulse"></div>
                    Today's Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                  <ScheduleRail 
                    bookings={bookings} 
                    now={currentTime} 
                    currentId={currentBooking?.id}
                    showDescription={true}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        )}
        </div>
      </main>


    </div>
  )
}