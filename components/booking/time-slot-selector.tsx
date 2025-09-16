"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Loader2, Clock, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface TimeSlotSelectorProps {
  selectedDate: Date
  startTime: string
  endTime: string
  onStartTimeChange: (time: string) => void
  onEndTimeChange: (time: string) => void
  bookedSlots: string[]
  isLoading: boolean
}

export function TimeSlotSelector({
  selectedDate,
  startTime,
  endTime,
  onStartTimeChange,
  onEndTimeChange,
  bookedSlots,
  isLoading
}: TimeSlotSelectorProps) {
  
  // Generate time slots from 8 AM to 6 PM in 30-minute intervals
  const generateTimeSlots = () => {
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
  
  const isSlotBooked = (time: string) => {
    return bookedSlots.includes(time)
  }
  
  const isValidStartTime = (time: string) => {
    if (isSlotBooked(time)) return false
    if (endTime && timeToMinutes(time) >= timeToMinutes(endTime)) return false
    return true
  }
  
  const isValidEndTime = (time: string) => {
    if (!startTime) return false
    if (timeToMinutes(time) <= timeToMinutes(startTime)) return false
    
    // Check if any slot between start and end is booked
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(time)
    
    for (let minutes = startMinutes; minutes < endMinutes; minutes += 30) {
      const slotTime = `${Math.floor(minutes / 60).toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}`
      if (isSlotBooked(slotTime)) return false
    }
    
    return true
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
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading available times...</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">
          Select Time for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
        </h3>
        <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>30-minute intervals</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>Minimum 30 minutes</span>
          </div>
        </div>
      </div>
      
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
                  isSlotBooked(time) ? "This time slot is booked" :
                  endTime && timeToMinutes(time) >= timeToMinutes(endTime) ? "Must be before end time" :
                  `Select ${formatTimeDisplay(time)} as start time`
                }
              >
                {formatTimeDisplay(time)}
                {isSlotBooked(time) && <span className="ml-1 text-xs">📅</span>}
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
                  !isValidEndTime(time) ? "Time range conflicts with existing booking" :
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
