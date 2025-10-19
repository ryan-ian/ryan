"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Clock, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface SlotAvailabilityData {
  date: string
  operatingHours: {
    enabled: boolean
    start: string
    end: string
  } | null
  restrictions: {
    minDuration: number
    maxDuration: number
    bufferTime: number
    advanceBookingDays: number
    sameDayBookingEnabled: boolean
  }
  startOptions: string[]
  endOptionsByStart: Record<string, string[]>
  unavailableReasons: Record<string, string | null>
  error?: string
}

interface TimeSlotSelectorProps {
  selectedDate: Date
  startTime: string
  endTime: string
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  roomId: string // NEW: For fetching availability
  bookedSlots?: string[] // DEPRECATED: Will be replaced by availability data
  isLoading?: boolean
}

export function TimeSlotSelector({
  selectedDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  roomId,
  bookedSlots = [], // Keep for backward compatibility
  isLoading = false
}: TimeSlotSelectorProps) {
  
  const [availabilityData, setAvailabilityData] = useState<SlotAvailabilityData | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch availability data when date or room changes
  useEffect(() => {
    if (selectedDate && roomId) {
      fetchAvailabilityData()
    }
  }, [selectedDate, roomId])

  const fetchAvailabilityData = async () => {
    setLoadingSlots(true)
    setError(null)
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd')
      const response = await fetch(`/api/rooms/${roomId}/availability/slots?date=${dateStr}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch availability: ${response.statusText}`)
      }
      
      const data: SlotAvailabilityData = await response.json()
      setAvailabilityData(data)
      
      // Clear selections if they're no longer valid
      if (startTime && !data.startOptions.includes(startTime)) {
        onStartTimeChange('')
      }
      if (endTime && startTime && !data.endOptionsByStart[startTime]?.includes(endTime)) {
        onEndTimeChange('')
      }
    } catch (err) {
      console.error('Error fetching availability data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch availability')
      setAvailabilityData(null)
    } finally {
      setLoadingSlots(false)
    }
  }

  // Generate time slots based on operating hours or fallback to default
  const generateTimeSlots = () => {
    if (availabilityData?.operatingHours?.enabled) {
      const slots = []
      const [startHour, startMin] = availabilityData.operatingHours.start.split(':').map(Number)
      const [endHour, endMin] = availabilityData.operatingHours.end.split(':').map(Number)
      
      for (let hour = startHour; hour < endHour || (hour === endHour && endMin > 0); hour++) {
        for (let minute of [0, 30]) {
          if (hour === endHour && minute >= endMin) break
          if (hour === startHour && minute < startMin) continue
          
          const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
          slots.push(time)
        }
      }
      return slots
    }
    
    // Fallback to default 8 AM - 6 PM
    const slots = []
    for (let hour = 8; hour < 18; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        slots.push(time)
      }
    }
    return slots
  }
  
  const timeSlots = generateTimeSlots()
  
  const timeToMinutes = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  // Check if a time slot is available based on new availability data
  const isSlotAvailable = (time: string) => {
    if (!availabilityData) {
      // Fallback to old booked slots logic
      return !bookedSlots.includes(time)
    }
    return availabilityData.startOptions.includes(time)
  }
  
  const isValidStartTime = (time: string) => {
    if (!availabilityData) {
      // Fallback to old logic
      if (bookedSlots.includes(time)) return false
      if (endTime && timeToMinutes(time) >= timeToMinutes(endTime)) return false
      return true
    }
    
    // Use new availability data
    const isAvailable = availabilityData.startOptions.includes(time)
    if (!isAvailable) return false
    if (endTime && timeToMinutes(time) >= timeToMinutes(endTime)) return false
    return true
  }
  
  const isValidEndTime = (time: string) => {
    if (!startTime) return false
    if (timeToMinutes(time) <= timeToMinutes(startTime)) return false
    
    if (!availabilityData) {
      // Fallback to old logic
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(time)
      
      for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
        const slotTime = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
        if (bookedSlots.includes(slotTime)) return false
      }
      return true
    }
    
    // Use new availability data
    return availabilityData.endOptionsByStart[startTime]?.includes(time) || false
  }
  
  // Get reason why a slot is unavailable
  const getUnavailableReason = (time: string) => {
    if (!availabilityData) return "This time slot is not available"
    
    const reason = availabilityData.unavailableReasons[time]
    if (!reason) return null
    
    switch (reason) {
      case 'conflict:existing_booking':
        return 'Already booked'
      case 'conflict:blackout':
        return 'Room maintenance'
      case 'conflict:buffer':
        return 'Buffer time required'
      case 'rule:max_duration':
        return 'Duration limit exceeded'
      case 'rule:min_duration':
        return 'Duration too short'
      default:
        return 'Not available'
    }
  }
  
  const formatTimeDisplay = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }
  
  const getDuration = () => {
    if (!startTime || !endTime) return null
    
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    const durationMinutes = endMinutes - startMinutes
    
    const hours = Math.floor(durationMinutes / 60)
    const minutes = durationMinutes % 60
    
    if (hours === 0) return `${minutes} minutes`
    if (minutes === 0) return `${hours} hour${hours > 1 ? 's' : ''}`
    return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minutes`
  }
  
  if (isLoading || loadingSlots) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading available times...</p>
        </div>
      </div>
    )
  }

  // Show error state
  if (error || availabilityData?.error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <AlertCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
          <p className="text-sm text-destructive font-medium">Unable to load availability</p>
          <p className="text-xs text-muted-foreground mt-1">
            {error || availabilityData?.error}
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchAvailabilityData}
            className="mt-3"
          >
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  // Show message if no times are available
  if (availabilityData && availabilityData.startOptions.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium">No times available</p>
          <p className="text-xs text-muted-foreground mt-1">
            {availabilityData.error || "This room has no available time slots for the selected date."}
          </p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Start Time Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">Start Time</Label>
          {startTime && (
            <div className="text-sm text-primary font-medium">
              Selected: {formatTimeDisplay(startTime)}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {timeSlots.map(time => (
              <Button
                key={`start-${time}`}
                variant={startTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => onStartTimeChange(time)}
                disabled={!isValidStartTime(time)}
                className={cn(
                  "text-xs h-9",
                  startTime === time && "ring-2 ring-primary ring-offset-2",
                  !isValidStartTime(time) && "opacity-50"
                )}
                title={
                  !isValidStartTime(time) ? getUnavailableReason(time) || "Not available" :
                  endTime && timeToMinutes(time) >= timeToMinutes(endTime) ? "Must be before end time" :
                  `Select ${formatTimeDisplay(time)} as start time`
                }
              >
                {formatTimeDisplay(time)}
                {!isSlotAvailable(time) && <span className="ml-1 text-xs">🚫</span>}
              </Button>
            ))}
          </div>
        </div>
        
        {/* End Time Selection */}
        <div className="space-y-3">
          <Label className="text-base font-medium">End Time</Label>
          {endTime && (
            <div className="text-sm text-primary font-medium">
              Selected: {formatTimeDisplay(endTime)}
            </div>
          )}
          <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto">
            {timeSlots.map(time => (
              <Button
                key={`end-${time}`}
                variant={endTime === time ? "default" : "outline"}
                size="sm"
                onClick={() => onEndTimeChange(time)}
                disabled={!isValidEndTime(time)}
                className={cn(
                  "text-xs h-9",
                  endTime === time && "ring-2 ring-primary ring-offset-2",
                  !isValidEndTime(time) && "opacity-50"
                )}
                title={
                  !startTime ? "Please select start time first" :
                  timeToMinutes(time) <= timeToMinutes(startTime) ? "Must be after start time" :
                  !isValidEndTime(time) ? "Time range has conflicts or violates duration rules" :
                  `Select ${formatTimeDisplay(time)} as end time`
                }
              >
                {formatTimeDisplay(time)}
              </Button>
            ))}
          </div>
        </div>
      </div>
      
      {/* Duration Display */}
      {startTime && endTime && (
        <div className="text-center p-4 bg-primary/10 rounded-lg border border-primary/20">
          <div className="flex items-center justify-center gap-2 text-primary">
            <Clock className="h-4 w-4" />
            <span className="font-medium">Duration: {getDuration()}</span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            From {formatTimeDisplay(startTime)} to {formatTimeDisplay(endTime)}
          </p>
        </div>
      )}
      
      {/* Availability Info */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-primary bg-primary" />
          <span>Selected</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 border-border" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-muted border-2 border-muted" />
          <span>Booked</span>
        </div>
      </div>
    </div>
  )
}
