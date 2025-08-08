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
      
      // Determine room status
      if (current) {
        setRoomStatus("occupied")
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
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-slate-900 dark:via-blue-900 dark:to-indigo-900 animate-gradient-slow">
        {/* Animated geometric shapes */}
        <div className="absolute top-10 left-10 w-32 h-32 bg-blue-200/30 dark:bg-blue-500/20 rounded-full blur-xl animate-float"></div>
        <div className="absolute top-1/3 right-20 w-48 h-48 bg-purple-200/30 dark:bg-purple-500/20 rounded-full blur-xl animate-float delay-200"></div>
        <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-indigo-200/30 dark:bg-indigo-500/20 rounded-full blur-xl animate-float delay-300"></div>
        <div className="absolute bottom-1/3 right-1/3 w-24 h-24 bg-teal-200/30 dark:bg-teal-500/20 rounded-full blur-xl animate-float delay-500"></div>
        <div className="absolute top-1/2 left-1/2 w-36 h-36 bg-emerald-200/20 dark:bg-emerald-500/15 rounded-full blur-xl animate-float delay-100"></div>

        {/* Animated conference pattern overlay */}
        <div className="absolute inset-0 bg-[url('/animated-bg.svg')] opacity-30 dark:opacity-20 text-slate-600 dark:text-slate-400"></div>

        {/* Conference pattern overlay */}
        <div className="absolute inset-0 bg-[url('/conference-bg-pattern.svg')] opacity-15 dark:opacity-8 text-slate-600 dark:text-slate-400"></div>

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-5"></div>

        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/85 via-white/70 to-white/85 dark:from-slate-900/85 dark:via-slate-900/70 dark:to-slate-900/85"></div>
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

      {/* Header with room info and current time */}
      <header className="relative z-10 flex justify-between items-center p-6 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-b border-white/20 dark:border-slate-700/50">
        <div className="flex items-center">
          <RoomStatusIndicator status={roomStatus} size="md" className="mr-3" />
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
              {room.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-300 font-medium">{room.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {/* Sync error indicator */}
          {syncError && (
            <div className="flex items-center text-red-600 dark:text-red-400 text-sm bg-red-50/80 dark:bg-red-900/30 backdrop-blur-sm px-3 py-1 rounded-lg border border-red-200/50 dark:border-red-800/50">
              <WifiOff className="h-4 w-4 mr-2" />
              <span>Sync error</span>
            </div>
          )}

          <div className="text-right bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-white/20 dark:border-slate-700/50">
            <p className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
              {format(currentTime, "h:mm")}
            </p>
            <p className="text-xl text-slate-600 dark:text-slate-300">{format(currentTime, "a")}</p>
            <p className="text-slate-500 dark:text-slate-400 text-sm">{format(currentTime, "EEEE, MMMM d")}</p>
          </div>
          <FullscreenToggle className="ml-2" />
        </div>
      </header>
      
      {/* Main content */}
      <main className="relative z-10 flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Current status and carousel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current status section */}
            <Card className={cn(
              "border-l-8 overflow-hidden transition-all duration-500 backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl hover:scale-[1.02] animate-scale-in",
              roomStatus === "available" ? "border-l-emerald-500 shadow-emerald-500/20 hover:shadow-emerald-500/30" :
              roomStatus === "occupied" ? "border-l-blue-500 shadow-blue-500/20 hover:shadow-blue-500/30" :
              roomStatus === "reserved" ? "border-l-amber-500 shadow-amber-500/20 hover:shadow-amber-500/30" :
              "border-l-red-500 shadow-red-500/20 hover:shadow-red-500/30"
            )}>
              <CardHeader className="pb-2 bg-gradient-to-r from-transparent to-white/50 dark:to-slate-700/50">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                    Current Status
                  </CardTitle>
                  <StatusBadge status={roomStatus} size="lg" />
                </div>
                <CardDescription className="flex items-center gap-2">
                  <OccupancySensor
                    status={occupancyStatus}
                    count={occupancyCount}
                    capacity={room.capacity}
                    size="sm"
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="bg-gradient-to-br from-white/50 to-transparent dark:from-slate-800/50">
                {currentBooking ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                          {currentBooking.title}
                        </h3>
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">
                            {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
                          </span>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-medium">
                          Booked by: <span className="text-blue-600 dark:text-blue-400">{currentBooking.users?.name || "Unknown"}</span>
                        </p>
                      </div>
                    </div>

                    {/* Check-in Manager */}
                    <div className="bg-white/60 dark:bg-slate-700/60 backdrop-blur-sm rounded-lg p-4 border border-white/30 dark:border-slate-600/30">
                      <CheckInManager
                        booking={currentBooking}
                        onCheckInSuccess={handleCheckInSuccess}
                        onAutoRelease={handleAutoRelease}
                      />
                    </div>
                  </div>
                ) : roomStatus === "reserved" ? (
                  <div className="animate-fadeIn space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
                      Reserved Soon
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">
                      This room is reserved for an upcoming meeting at{" "}
                      <span className="font-bold text-amber-600 dark:text-amber-400">
                        {nextBooking ? formatTime(nextBooking.start_time) : ""}
                      </span>
                    </p>
                  </div>
                ) : roomStatus === "maintenance" ? (
                  <div className="animate-fadeIn space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 dark:from-red-400 dark:to-pink-400 bg-clip-text text-transparent">
                      Under Maintenance
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">
                      This room is currently unavailable due to maintenance.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fadeIn space-y-3">
                    <h3 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent">
                      Available
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 text-lg">
                      This room is free to use{" "}
                      <span className="font-bold text-emerald-600 dark:text-emerald-400">
                        {nextBooking ? `until ${formatTime(nextBooking.start_time)}` : "for the rest of the day"}
                      </span>
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Room information carousel */}
            <Card className="overflow-hidden backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-[1.02] animate-scale-in delay-200">
              <CardHeader className="pb-2 bg-gradient-to-r from-transparent to-white/50 dark:to-slate-700/50">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Room Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px] bg-gradient-to-br from-white/30 to-transparent dark:from-slate-700/30">
                  <RoomInfoCarousel
                    room={room}
                    resources={resources}
                    className="h-full"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right column - Today's schedule */}
          <div>
            <Card className="h-full backdrop-blur-md bg-white/80 dark:bg-slate-800/80 border border-white/20 dark:border-slate-700/50 shadow-xl animate-scale-in delay-300">
              <CardHeader className="pb-2 bg-gradient-to-r from-transparent to-white/50 dark:to-slate-700/50">
                <CardTitle className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 dark:from-white dark:to-slate-200 bg-clip-text text-transparent">
                  Today's Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[calc(100vh-16rem)] bg-gradient-to-b from-white/30 to-transparent dark:from-slate-700/30">
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                      <Clock className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400 bg-clip-text text-transparent">
                      No Bookings Today
                    </h3>
                    <p className="text-slate-600 dark:text-slate-300 mt-2">This room is available all day.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map((booking, index) => {
                      const isCurrentBooking = currentBooking?.id === booking.id
                      const isPastBooking = isAfter(currentTime, parseISO(booking.end_time))

                      return (
                        <div
                          key={booking.id}
                          className={cn(
                            "border rounded-xl p-4 transition-all duration-500 backdrop-blur-sm hover:scale-[1.02]",
                            isCurrentBooking ?
                              "border-l-4 border-l-blue-500 bg-blue-50/80 dark:bg-blue-950/40 shadow-lg shadow-blue-500/20" :
                            isPastBooking ?
                              "border-l-4 border-l-gray-300 bg-gray-50/80 dark:bg-gray-900/40 opacity-60" :
                              "border-l-4 border-l-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/40 shadow-lg shadow-emerald-500/20",
                            index === 0 && !isPastBooking && !isCurrentBooking && "animate-pulse-once"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div className="space-y-1">
                              <h3 className={cn(
                                "font-bold text-lg",
                                isPastBooking ? "text-slate-400 dark:text-slate-500" :
                                isCurrentBooking ? "text-blue-700 dark:text-blue-300" :
                                "text-slate-800 dark:text-slate-200"
                              )}>
                                {booking.title}
                              </h3>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-slate-500" />
                                <p className={cn(
                                  "text-sm font-medium",
                                  isPastBooking ? "text-slate-400 dark:text-slate-500" : "text-slate-600 dark:text-slate-300"
                                )}>
                                  {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                                </p>
                              </div>
                            </div>
                            <div>
                              {isCurrentBooking ? (
                                <Badge className="bg-gradient-to-r from-blue-500 to-blue-600 text-white animate-pulse shadow-lg">
                                  Current
                                </Badge>
                              ) : isPastBooking ? (
                                <Badge variant="outline" className="text-slate-400 border-slate-300 dark:border-slate-600">
                                  Completed
                                </Badge>
                              ) : (
                                <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg">
                                  Upcoming
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Footer with room info and report issue button */}
      <footer className="relative z-10 backdrop-blur-sm bg-white/70 dark:bg-slate-900/70 border-t border-white/20 dark:border-slate-700/50 p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-4 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/30 dark:border-slate-600/30">
            <RoomStatusIndicator status={roomStatus} size="sm" />
            <p className="font-bold text-slate-800 dark:text-slate-200">{room.name}</p>
            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600"></div>
            <p className="text-sm text-slate-600 dark:text-slate-300 font-medium">
              Capacity: <span className="text-blue-600 dark:text-blue-400 font-bold">{room.capacity}</span> people
            </p>
          </div>

          <div className="bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm rounded-lg border border-white/30 dark:border-slate-600/30">
            <IssueReportForm
              room={room}
              booking={currentBooking || undefined}
              onIssueReported={() => console.log("Issue reported successfully")}
            />
          </div>
        </div>
      </footer>
    </div>
  )
} 