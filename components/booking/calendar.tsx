"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { ChevronLeft, ChevronRight, AlertTriangle, Loader2, X } from "lucide-react"
import { shouldDisableDate, isSameDay, getDateRestrictionMessage } from "@/lib/booking-restrictions"
import { getRestrictionType, getUnavailableReason } from "@/lib/calendar-availability"
import type { RoomAvailability, RoomBlackout } from "@/types"

interface CalendarProps {
  className?: string
  selected?: Date | null
  onSelect?: (date: Date) => void
  bookedDates?: Date[]
  roomId?: string  // NEW: For fetching availability
}

interface CalendarRestrictions {
  operatingHours: any | null
  advanceBookingDays: number
  sameDayBookingEnabled: boolean
  closedDates: string[]
  blackoutDates: Array<{ date: string; reason: string }>
}

export function Calendar({ 
  className, 
  selected, 
  onSelect, 
  bookedDates = [],
  roomId
}: CalendarProps) {
  const [currentDate, setCurrentDate] = useState<Date>(selected || new Date())
  const [restrictions, setRestrictions] = useState<CalendarRestrictions | null>(null)
  const [loadingRestrictions, setLoadingRestrictions] = useState(false)
  const [restrictionsError, setRestrictionsError] = useState<string | null>(null)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  const currentMonth = currentDate.getMonth()
  const currentYear = currentDate.getFullYear()
  
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1)
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0)
  const firstDayWeekday = firstDayOfMonth.getDay()
  const daysInMonth = lastDayOfMonth.getDate()
  
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
  
  // Fetch restrictions when roomId or month changes
  useEffect(() => {
    if (roomId) {
      fetchRestrictions()
    }
  }, [roomId, currentMonth, currentYear])
  
  const fetchRestrictions = async () => {
    if (!roomId) return
    
    setLoadingRestrictions(true)
    setRestrictionsError(null)
    
    try {
      const response = await fetch(
        `/api/rooms/${roomId}/availability/calendar?month=${currentMonth}&year=${currentYear}`
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch restrictions: ${response.statusText}`)
      }
      
      const data = await response.json()
      setRestrictions(data)
    } catch (error) {
      console.error('Error fetching calendar restrictions:', error)
      setRestrictionsError(error instanceof Error ? error.message : 'Failed to fetch restrictions')
      setRestrictions(null)
    } finally {
      setLoadingRestrictions(false)
    }
  }
  
  const goToPrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
  }
  
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
  }
  
  const isPastDate = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return date < today
  }
  
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear
  }

  const isSameDayRestricted = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    // Only restrict same-day if the setting is explicitly disabled
    return isSameDay(date) && restrictions?.sameDayBookingEnabled === false
  }

  const isDateRestricted = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    return shouldDisableDate(date, restrictions?.sameDayBookingEnabled ?? false)
  }
  
  // NEW: Check if date is unavailable based on room restrictions
  const isDateUnavailable = (day: number) => {
    if (!restrictions) return false
    
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    
    // Check if it's a closed date
    if (restrictions.closedDates.includes(dateStr)) {
      return true
    }
    
    // Check if it's a blackout date
    if (restrictions.blackoutDates.some(bd => bd.date === dateStr)) {
      return true
    }
    
    // Check if it's beyond advance booking window
    const today = new Date()
    const maxAdvanceDate = new Date(today.getTime() + (restrictions.advanceBookingDays * 24 * 60 * 60 * 1000))
    if (date > maxAdvanceDate) {
      return true
    }
    
    return false
  }
  
  // NEW: Get restriction type for styling
  const getDateRestrictionType = (day: number) => {
    if (!restrictions) return 'none'
    
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    
    if (restrictions.closedDates.includes(dateStr)) {
      return 'closed'
    }
    
    if (restrictions.blackoutDates.some(bd => bd.date === dateStr)) {
      return 'blackout'
    }
    
    const today = new Date()
    const maxAdvanceDate = new Date(today.getTime() + (restrictions.advanceBookingDays * 24 * 60 * 60 * 1000))
    if (date > maxAdvanceDate) {
      return 'beyond-window'
    }
    
    return 'none'
  }
  
  // NEW: Get tooltip message for unavailable dates
  const getUnavailableTooltip = (day: number) => {
    if (!restrictions) return ""
    
    const date = new Date(currentYear, currentMonth, day)
    const dateStr = date.toISOString().split('T')[0]
    
    if (restrictions.closedDates.includes(dateStr)) {
      const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'long' })
      return `Room closed on ${dayOfWeek}s`
    }
    
    const blackout = restrictions.blackoutDates.find(bd => bd.date === dateStr)
    if (blackout) {
      return blackout.reason || "Room unavailable due to maintenance"
    }
    
    const today = new Date()
    const maxAdvanceDate = new Date(today.getTime() + (restrictions.advanceBookingDays * 24 * 60 * 60 * 1000))
    if (date > maxAdvanceDate) {
      return `Bookings only allowed up to ${restrictions.advanceBookingDays} days in advance`
    }
    
    return ""
  }
  
  const isSelected = (day: number) => {
    return selected && 
           selected.getDate() === day && 
           selected.getMonth() === currentMonth && 
           selected.getFullYear() === currentYear
  }
  
  const isBooked = (day: number) => {
    const date = new Date(currentYear, currentMonth, day)
    date.setHours(0, 0, 0, 0)
    return bookedDates.some(bookedDate => {
      const booked = new Date(bookedDate)
      booked.setHours(0, 0, 0, 0)
      return booked.getTime() === date.getTime()
    })
  }
  
  const handleDateClick = (day: number) => {
    if (isPastDate(day) || isBooked(day) || isSameDayRestricted(day) || isDateUnavailable(day)) return
    
    const date = new Date(currentYear, currentMonth, day)
    onSelect?.(date)
  }
  
  const renderCalendarDays = () => {
    const days = []
    
    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDayWeekday; i++) {
      days.push(<div key={`empty-${i}`} className="h-10" />)
    }
    
    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isPast = isPastDate(day)
      const isCurrentDay = isToday(day)
      const isSelectedDay = isSelected(day)
      const isBookedDay = isBooked(day)
      const isSameDay = isSameDayRestricted(day)
      const isUnavailable = isDateUnavailable(day)
      const restrictionType = getDateRestrictionType(day)
      const isDisabled = isPast || isBookedDay || isSameDay || isUnavailable
      
      // Get tooltip message
      const tooltipMessage = isPast ? "Cannot select past dates" :
        isBookedDay ? "This date is not available" :
        isSameDay ? "Same-day booking requires facility manager approval" :
        isUnavailable ? getUnavailableTooltip(day) :
        `Select ${monthNames[currentMonth]} ${day}, ${currentYear}`
      
      days.push(
        <button
          key={day}
          type="button"
          onClick={() => handleDateClick(day)}
          disabled={isDisabled}
          className={cn(
            "h-10 w-10 rounded-lg text-sm font-medium transition-colors relative",
            "hover:bg-muted hover:text-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            isSelectedDay && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
            isCurrentDay && !isSelectedDay && "bg-accent text-accent-foreground font-semibold",
            isDisabled && "text-muted-foreground cursor-not-allowed opacity-50",
            isBookedDay && "bg-destructive/10 text-destructive",
            isSameDay && restrictions?.sameDayBookingEnabled === false && "bg-orange-50 text-orange-700 border-2 border-orange-200",
            // Restriction-specific styling
            restrictionType === 'closed' && "bg-muted text-muted-foreground cursor-not-allowed line-through",
            restrictionType === 'blackout' && "bg-destructive/10 text-destructive cursor-not-allowed",
            restrictionType === 'beyond-window' && "opacity-30 cursor-not-allowed",
            !isDisabled && "hover:bg-muted hover:text-foreground"
          )}
          title={tooltipMessage}
        >
          {day}
          {isSameDay && restrictions?.sameDayBookingEnabled === false && (
            <AlertTriangle className="absolute -top-1 -right-1 h-3 w-3 text-orange-600" />
          )}
          {restrictionType === 'blackout' && (
            <X className="absolute -top-1 -right-1 h-3 w-3 text-destructive" />
          )}
        </button>
      )
    }
    
    return days
  }
  
  return (
    <div className={cn("p-4 bg-white border border-border rounded-lg shadow-sm", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPrevMonth}
          className="h-8 w-8 hover:bg-muted"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold text-foreground">
            {monthNames[currentMonth]} {currentYear}
          </h2>
          {loadingRestrictions && (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          )}
        </div>
        
        <Button
          variant="outline"
          size="icon"
          onClick={goToNextMonth}
          className="h-8 w-8 hover:bg-muted"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Error message */}
      {restrictionsError && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <div className="flex items-center gap-2 text-destructive text-sm">
            <AlertTriangle className="h-4 w-4" />
            <span>Unable to load availability restrictions</span>
          </div>
        </div>
      )}
      
      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div
            key={day}
            className="h-8 flex items-center justify-center text-sm font-medium text-muted-foreground"
          >
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {renderCalendarDays()}
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground flex-wrap">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent" />
          <span>Today</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-orange-100 border border-orange-200" />
          <AlertTriangle className="h-3 w-3 text-orange-600" />
          <span>Same-day</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-muted border border-border line-through" />
          <span>Closed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-destructive/20 border border-destructive/30" />
          <X className="h-3 w-3 text-destructive" />
          <span>Blackout</span>
        </div>
      </div>
    </div>
  )
}
