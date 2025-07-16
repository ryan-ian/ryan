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
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [issueDescription, setIssueDescription] = useState("")
  const [submittingIssue, setSubmittingIssue] = useState(false)
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInSuccess, setCheckInSuccess] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const [roomStatus, setRoomStatus] = useState<RoomStatusType>("available")
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [showCheckInTimer, setShowCheckInTimer] = useState(false)
  const [autoReleaseTime, setAutoReleaseTime] = useState<Date | null>(null)
  const [occupancyStatus, setOccupancyStatus] = useState<OccupancyStatus>("loading")
  const [occupancyCount, setOccupancyCount] = useState<number | undefined>(undefined)
  
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
      
      // If current booking changed, reset check-in state
      if (current?.id !== currentBooking?.id) {
        setIsCheckedIn(false)
        setCheckInSuccess(false)
        
        // If there's a new current booking, set auto-release timer
        if (current && !isCheckedIn) {
          const startTime = parseISO(current.start_time)
          const releaseTime = addMinutes(startTime, CHECK_IN_GRACE_PERIOD_MINUTES)
          
          // Only show timer if we're within the grace period
          if (isAfter(releaseTime, now)) {
            setShowCheckInTimer(true)
            setAutoReleaseTime(releaseTime)
          } else {
            setShowCheckInTimer(false)
          }
        } else {
          setShowCheckInTimer(false)
        }
      }
      
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
  }, [bookings, room, currentBooking, isCheckedIn])
  
  // Handle check-in
  const handleCheckIn = async () => {
    if (!currentBooking) return
    
    setCheckingIn(true)
    setCheckInError(null)
    
    try {
      // In a real app, this would update the booking status in the database
      // For now, we'll just simulate a successful check-in
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setCheckInSuccess(true)
      setIsCheckedIn(true)
      setShowCheckInTimer(false)
      setTimeout(() => setCheckInSuccess(false), 3000)
    } catch (error) {
      console.error("Check-in error:", error)
      setCheckInError("Failed to check in. Please try again.")
    } finally {
      setCheckingIn(false)
    }
  }
  
  // Handle auto-release
  const handleAutoRelease = () => {
    // In a real app, this would update the booking status in the database
    // and release the room for others to book
    console.log("Room auto-released due to no check-in")
    setShowCheckInTimer(false)
    
    // For demo purposes, we'll just update the UI
    if (currentBooking) {
      setBookings(prevBookings => 
        prevBookings.filter(booking => booking.id !== currentBooking.id)
      )
      setCurrentBooking(null)
    }
  }
  
  // Handle issue report
  const handleReportIssue = async () => {
    if (!issueDescription.trim()) return
    
    setSubmittingIssue(true)
    
    try {
      // In a real app, this would submit the issue to a database or API
      // For now, we'll just simulate a successful submission
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setIssueDescription("")
      setReportDialogOpen(false)
    } catch (error) {
      console.error("Error reporting issue:", error)
    } finally {
      setSubmittingIssue(false)
    }
  }
  
  // Format time for display (e.g., "9:00 AM")
  const formatTime = (isoString: string) => {
    return format(parseISO(isoString), "h:mm a")
  }
  
  // Calculate remaining check-in time in minutes
  const getRemainingCheckInTime = () => {
    if (!autoReleaseTime) return 0
    
    const remainingMinutes = differenceInMinutes(autoReleaseTime, currentTime)
    return Math.max(0, remainingMinutes)
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
    <div className="flex flex-col h-full bg-background">
      {/* Header with room info and current time */}
      <header className="flex justify-between items-center p-6 border-b">
        <div className="flex items-center">
          <RoomStatusIndicator status={roomStatus} size="md" className="mr-3" />
          <div>
            <h1 className="text-3xl font-bold">{room.name}</h1>
            <p className="text-muted-foreground">{room.location}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-4xl font-bold">{format(currentTime, "h:mm")}</p>
            <p className="text-xl">{format(currentTime, "a")}</p>
            <p className="text-muted-foreground">{format(currentTime, "EEEE, MMMM d")}</p>
          </div>
          <FullscreenToggle className="ml-2" />
        </div>
      </header>
      
      {/* Main content */}
      <main className="flex-1 p-6 overflow-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left column - Current status and carousel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current status section */}
            <Card className={cn(
              "border-l-8 overflow-hidden transition-all duration-300",
              roomStatus === "available" ? "border-l-green-500" : 
              roomStatus === "occupied" ? "border-l-blue-500" : 
              roomStatus === "reserved" ? "border-l-yellow-500" : 
              "border-l-red-500"
            )}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Current Status</CardTitle>
                  <StatusBadge status={roomStatus} size="lg" />
                </div>
                <CardDescription>
                  <OccupancySensor 
                    status={occupancyStatus} 
                    count={occupancyCount} 
                    capacity={room.capacity}
                    size="sm"
                  />
                </CardDescription>
              </CardHeader>
              <CardContent>
                {currentBooking ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold">{currentBooking.title}</h3>
                        <p className="text-muted-foreground">
                          {formatTime(currentBooking.start_time)} - {formatTime(currentBooking.end_time)}
                        </p>
                        <p className="mt-1">Booked by: {currentBooking.users?.name || "Unknown"}</p>
                      </div>
                      
                      <Button 
                        onClick={handleCheckIn}
                        disabled={checkingIn || checkInSuccess || isCheckedIn}
                        className={cn(
                          "min-w-[120px] transition-all duration-300",
                          checkInSuccess || isCheckedIn ? "bg-green-500 hover:bg-green-600" : ""
                        )}
                      >
                        {checkingIn ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : checkInSuccess || isCheckedIn ? (
                          <CheckCircle className="h-4 w-4 mr-2" />
                        ) : null}
                        {checkingIn ? "Checking In..." : checkInSuccess || isCheckedIn ? "Checked In" : "Check In"}
                      </Button>
                    </div>
                    
                    {/* Auto-release countdown timer */}
                    {showCheckInTimer && !isCheckedIn && (
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-3 animate-fadeIn">
                        <div className="flex items-start mb-2">
                          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mr-2 mt-0.5" />
                          <div>
                            <p className="font-medium text-yellow-800 dark:text-yellow-300">Check-in required</p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-400">
                              This room will be auto-released if not checked in.
                            </p>
                          </div>
                        </div>
                        <CountdownTimer 
                          durationInMinutes={getRemainingCheckInTime()} 
                          onComplete={handleAutoRelease}
                          variant="warning"
                        />
                      </div>
                    )}
                    
                    {checkInError && (
                      <div className="mt-2 text-red-500 text-sm flex items-center animate-fadeIn">
                        <AlertCircle className="h-4 w-4 mr-1" />
                        {checkInError}
                      </div>
                    )}
                  </div>
                ) : roomStatus === "reserved" ? (
                  <div className="animate-fadeIn">
                    <h3 className="text-xl font-semibold">Reserved Soon</h3>
                    <p className="text-muted-foreground">
                      This room is reserved for an upcoming meeting at {nextBooking ? formatTime(nextBooking.start_time) : ""}
                    </p>
                  </div>
                ) : roomStatus === "maintenance" ? (
                  <div className="animate-fadeIn">
                    <h3 className="text-xl font-semibold">Under Maintenance</h3>
                    <p className="text-muted-foreground">
                      This room is currently unavailable due to maintenance.
                    </p>
                  </div>
                ) : (
                  <div className="animate-fadeIn">
                    <h3 className="text-xl font-semibold">Available</h3>
                    <p className="text-muted-foreground">
                      This room is free to use {nextBooking ? `until ${formatTime(nextBooking.start_time)}` : "for the rest of the day"}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* Room information carousel */}
            <Card className="overflow-hidden">
              <CardHeader className="pb-2">
                <CardTitle>Room Information</CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="h-[300px]">
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
            <Card className="h-full">
              <CardHeader className="pb-2">
                <CardTitle>Today's Schedule</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[calc(100vh-16rem)]">
                {bookings.length === 0 ? (
                  <div className="text-center py-12">
                    <Clock className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                    <h3 className="text-xl font-medium">No Bookings Today</h3>
                    <p className="text-muted-foreground">This room is available all day.</p>
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
                            "border rounded-lg p-3 transition-all duration-300",
                            isCurrentBooking ? 
                              "border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20" : 
                            isPastBooking ? 
                              "border-l-4 border-l-gray-300 bg-gray-50/50 dark:bg-gray-900/20 opacity-60" : 
                              "border-l-4 border-l-green-500",
                            index === 0 && !isPastBooking && !isCurrentBooking && "animate-pulse-once"
                          )}
                        >
                          <div className="flex justify-between items-center">
                            <div>
                              <h3 className={`font-medium ${isPastBooking ? "text-muted-foreground" : ""}`}>
                                {booking.title}
                              </h3>
                              <p className={`text-sm ${isPastBooking ? "text-muted-foreground/70" : "text-muted-foreground"}`}>
                                {formatTime(booking.start_time)} - {formatTime(booking.end_time)}
                              </p>
                            </div>
                            <div>
                              {isCurrentBooking ? (
                                <Badge className="bg-blue-500 animate-pulse">Current</Badge>
                              ) : isPastBooking ? (
                                <Badge variant="outline" className="text-muted-foreground">Completed</Badge>
                              ) : (
                                <Badge variant="outline" className="text-green-600 border-green-300 bg-green-50 dark:bg-green-950/30 dark:border-green-800">
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
      <footer className="border-t p-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <RoomStatusIndicator status={roomStatus} size="sm" />
            <p className="font-medium">{room.name}</p>
            <p className="text-sm text-muted-foreground">Capacity: {room.capacity} people</p>
          </div>
          
          <Dialog open={reportDialogOpen} onOpenChange={setReportDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <AlertCircle className="h-4 w-4 mr-2" />
                Report an Issue
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Report an Issue</DialogTitle>
                <DialogDescription>
                  Describe the issue you're experiencing with this room.
                </DialogDescription>
              </DialogHeader>
              <Textarea
                value={issueDescription}
                onChange={(e) => setIssueDescription(e.target.value)}
                placeholder="Describe the issue (e.g., 'Projector not working', 'Room too cold')"
                className="min-h-[100px]"
              />
              <DialogFooter>
                <Button variant="outline" onClick={() => setReportDialogOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleReportIssue} 
                  disabled={!issueDescription.trim() || submittingIssue}
                >
                  {submittingIssue && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Submit Report
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </footer>
    </div>
  )
} 