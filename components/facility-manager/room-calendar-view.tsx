"use client"

import { useState, useEffect } from "react"
import { Calendar, ChevronLeft, ChevronRight, Filter, Download, Eye, EyeOff } from "lucide-react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from "date-fns"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useToast } from "@/components/ui/use-toast"
import { getBookingsByRoomAndDateRange, getRoomBlackouts } from "@/lib/room-availability"
import type { Booking, RoomBlackout } from "@/types"

interface RoomCalendarViewProps {
  roomId: string
  roomName: string
}

type CalendarView = 'month' | 'week' | 'day'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  type: 'booking' | 'blackout'
  status?: string
  data: Booking | RoomBlackout
}

const BOOKING_STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  confirmed: 'bg-green-100 text-green-800 border-green-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200'
}

const BLACKOUT_COLOR = 'bg-red-100 text-red-800 border-red-200'

export function RoomCalendarView({ roomId, roomName }: RoomCalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<CalendarView>('month')
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    showPending: true,
    showConfirmed: true,
    showCancelled: false,
    showBlackouts: true
  })
  const { toast } = useToast()

  useEffect(() => {
    loadCalendarData()
  }, [roomId, currentDate, view])

  const loadCalendarData = async () => {
    try {
      setIsLoading(true)
      
      // Calculate date range based on view
      let startDate: Date
      let endDate: Date
      
      switch (view) {
        case 'month':
          startDate = startOfWeek(startOfMonth(currentDate))
          endDate = endOfWeek(endOfMonth(currentDate))
          break
        case 'week':
          startDate = startOfWeek(currentDate)
          endDate = endOfWeek(currentDate)
          break
        case 'day':
          startDate = new Date(currentDate)
          startDate.setHours(0, 0, 0, 0)
          endDate = new Date(currentDate)
          endDate.setHours(23, 59, 59, 999)
          break
      }

      // Load bookings and blackouts in parallel
      const [bookingsData, blackoutsData] = await Promise.all([
        getBookingsByRoomAndDateRange(roomId, startDate.toISOString(), endDate.toISOString()),
        getRoomBlackouts(roomId)
      ])

      // Convert to calendar events
      const calendarEvents: CalendarEvent[] = []

      // Add bookings
      bookingsData.forEach((booking) => {
        calendarEvents.push({
          id: `booking-${booking.id}`,
          title: booking.title,
          start: new Date(booking.start_time),
          end: new Date(booking.end_time),
          type: 'booking',
          status: booking.status,
          data: booking
        })
      })

      // Add blackouts (filter by date range)
      blackoutsData
        .filter(blackout => {
          const blackoutStart = new Date(blackout.start_time)
          const blackoutEnd = new Date(blackout.end_time)
          return blackoutStart <= endDate && blackoutEnd >= startDate
        })
        .forEach((blackout) => {
          calendarEvents.push({
            id: `blackout-${blackout.id}`,
            title: blackout.title,
            start: new Date(blackout.start_time),
            end: new Date(blackout.end_time),
            type: 'blackout',
            data: blackout
          })
        })

      setEvents(calendarEvents)
    } catch (error) {
      console.error('Failed to load calendar data:', error)
      toast({
        title: "Error",
        description: "Failed to load calendar data.",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  const navigateDate = (direction: 'prev' | 'next') => {
    switch (view) {
      case 'month':
        setCurrentDate(direction === 'next' ? addMonths(currentDate, 1) : subMonths(currentDate, 1))
        break
      case 'week':
        const weekOffset = direction === 'next' ? 7 : -7
        setCurrentDate(new Date(currentDate.getTime() + weekOffset * 24 * 60 * 60 * 1000))
        break
      case 'day':
        const dayOffset = direction === 'next' ? 1 : -1
        setCurrentDate(new Date(currentDate.getTime() + dayOffset * 24 * 60 * 60 * 1000))
        break
    }
  }

  const getFilteredEvents = () => {
    return events.filter(event => {
      if (event.type === 'blackout') {
        return filters.showBlackouts
      }
      
      if (event.type === 'booking') {
        switch (event.status) {
          case 'pending':
            return filters.showPending
          case 'confirmed':
            return filters.showConfirmed
          case 'cancelled':
            return filters.showCancelled
          default:
            return true
        }
      }
      
      return true
    })
  }

  const getEventsForDay = (date: Date) => {
    return getFilteredEvents().filter(event => {
      const eventStart = new Date(event.start)
      const eventEnd = new Date(event.end)
      
      // Check if event overlaps with the day
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      
      return eventStart <= dayEnd && eventEnd >= dayStart
    })
  }

  const formatDateHeader = () => {
    switch (view) {
      case 'month':
        return format(currentDate, 'MMMM yyyy')
      case 'week':
        const weekStart = startOfWeek(currentDate)
        const weekEnd = endOfWeek(currentDate)
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`
      case 'day':
        return format(currentDate, 'EEEE, MMMM d, yyyy')
    }
  }

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart)
    const calendarEnd = endOfWeek(monthEnd)
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Day headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map(day => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, currentDate)
          const isToday = isSameDay(day, new Date())
          
          return (
            <div
              key={day.toISOString()}
              className={`min-h-[120px] p-2 border border-border ${
                isCurrentMonth ? 'bg-background' : 'bg-muted/30'
              } ${isToday ? 'ring-2 ring-primary' : ''}`}
            >
              <div className={`text-sm font-medium mb-1 ${
                isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'
              }`}>
                {format(day, 'd')}
              </div>
              
              <div className="space-y-1">
                {dayEvents.slice(0, 3).map(event => (
                  <div
                    key={event.id}
                    className={`text-xs p-1 rounded border ${
                      event.type === 'blackout' 
                        ? BLACKOUT_COLOR 
                        : BOOKING_STATUS_COLORS[event.status as keyof typeof BOOKING_STATUS_COLORS] || 'bg-gray-100'
                    }`}
                  >
                    <div className="truncate font-medium">{event.title}</div>
                    <div className="truncate">
                      {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                    </div>
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-muted-foreground">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const renderWeekView = () => {
    const weekStart = startOfWeek(currentDate)
    const weekDays = eachDayOfInterval({ start: weekStart, end: endOfWeek(currentDate) })
    
    return (
      <div className="grid grid-cols-8 gap-1">
        {/* Time column header */}
        <div className="p-2"></div>
        
        {/* Day headers */}
        {weekDays.map(day => (
          <div key={day.toISOString()} className="p-2 text-center">
            <div className="text-sm font-medium">{format(day, 'EEE')}</div>
            <div className={`text-lg ${isSameDay(day, new Date()) ? 'font-bold text-primary' : ''}`}>
              {format(day, 'd')}
            </div>
          </div>
        ))}
        
        {/* Time slots */}
        {Array.from({ length: 24 }, (_, hour) => (
          <div key={hour} className="contents">
            {/* Time label */}
            <div className="p-2 text-sm text-muted-foreground border-r">
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </div>
            
            {/* Day columns */}
            {weekDays.map(day => {
              const hourEvents = getEventsForDay(day).filter(event => {
                const eventHour = event.start.getHours()
                return eventHour === hour
              })
              
              return (
                <div key={`${day.toISOString()}-${hour}`} className="min-h-[60px] p-1 border border-border">
                  {hourEvents.map(event => (
                    <div
                      key={event.id}
                      className={`text-xs p-1 rounded mb-1 ${
                        event.type === 'blackout' 
                          ? BLACKOUT_COLOR 
                          : BOOKING_STATUS_COLORS[event.status as keyof typeof BOOKING_STATUS_COLORS] || 'bg-gray-100'
                      }`}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="truncate">
                        {format(event.start, 'h:mm')} - {format(event.end, 'h:mm')}
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    )
  }

  const renderDayView = () => {
    const dayEvents = getEventsForDay(currentDate).sort((a, b) => a.start.getTime() - b.start.getTime())
    
    return (
      <div className="space-y-4">
        {dayEvents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No events scheduled for this day
          </div>
        ) : (
          dayEvents.map(event => (
            <div
              key={event.id}
              className={`p-4 rounded-lg border ${
                event.type === 'blackout' 
                  ? BLACKOUT_COLOR 
                  : BOOKING_STATUS_COLORS[event.status as keyof typeof BOOKING_STATUS_COLORS] || 'bg-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-medium">{event.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                  </p>
                  {event.type === 'booking' && (
                    <Badge className="mt-2">
                      {(event.data as Booking).status}
                    </Badge>
                  )}
                  {event.type === 'blackout' && (
                    <Badge variant="destructive" className="mt-2">
                      Blackout
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Calendar View
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-muted rounded animate-pulse" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {roomName} Calendar
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* Filters */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-64">
                <div className="space-y-4">
                  <h4 className="font-medium">Show Events</h4>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="pending"
                        checked={filters.showPending}
                        onCheckedChange={(checked) => setFilters({ ...filters, showPending: !!checked })}
                      />
                      <label htmlFor="pending" className="text-sm">Pending Bookings</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="confirmed"
                        checked={filters.showConfirmed}
                        onCheckedChange={(checked) => setFilters({ ...filters, showConfirmed: !!checked })}
                      />
                      <label htmlFor="confirmed" className="text-sm">Confirmed Bookings</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="cancelled"
                        checked={filters.showCancelled}
                        onCheckedChange={(checked) => setFilters({ ...filters, showCancelled: !!checked })}
                      />
                      <label htmlFor="cancelled" className="text-sm">Cancelled Bookings</label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="blackouts"
                        checked={filters.showBlackouts}
                        onCheckedChange={(checked) => setFilters({ ...filters, showBlackouts: !!checked })}
                      />
                      <label htmlFor="blackouts" className="text-sm">Blackout Periods</label>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
            
            {/* View selector */}
            <Select value={view} onValueChange={(value: CalendarView) => setView(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="day">Day</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          
          <h2 className="text-lg font-semibold">{formatDateHeader()}</h2>
          
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
      </CardContent>
    </Card>
  )
}
