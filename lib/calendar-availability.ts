/**
 * Calendar Availability Utilities
 * Handles date-level restrictions for room booking calendars
 */

import { format, addDays, isAfter, isBefore, startOfDay } from 'date-fns'
import type { RoomAvailability, RoomBlackout, OperatingHours } from '@/types'

/**
 * Check if a date is a closed day for the room based on operating hours
 */
export function isClosedDay(
  date: Date, 
  operatingHours: OperatingHours
): boolean {
  const dayOfWeek = format(date, 'EEEE').toLowerCase() as keyof OperatingHours
  const dayHours = operatingHours[dayOfWeek]
  
  return !dayHours.enabled
}

/**
 * Check if a date is beyond the advance booking window
 */
export function isBeyondAdvanceBooking(
  date: Date, 
  advanceBookingDays: number
): boolean {
  const today = startOfDay(new Date())
  const maxAdvanceDate = addDays(today, advanceBookingDays)
  const selectedDay = startOfDay(date)
  
  return isAfter(selectedDay, maxAdvanceDate)
}

/**
 * Check if a date falls within a blackout period
 */
export function isInBlackoutPeriod(
  date: Date, 
  blackouts: RoomBlackout[]
): boolean {
  const selectedDay = startOfDay(date)
  
  return blackouts.some(blackout => {
    const blackoutStart = startOfDay(new Date(blackout.start_time))
    const blackoutEnd = startOfDay(new Date(blackout.end_time))
    
    return (
      (isAfter(selectedDay, blackoutStart) || selectedDay.getTime() === blackoutStart.getTime()) &&
      (isBefore(selectedDay, blackoutEnd) || selectedDay.getTime() === blackoutEnd.getTime())
    )
  })
}

/**
 * Get user-friendly message for why a date is unavailable
 */
export function getUnavailableReason(
  date: Date,
  availability: RoomAvailability | null,
  blackouts: RoomBlackout[]
): string {
  if (!availability) {
    return "Room availability not configured"
  }

  // Check if it's a closed day
  if (isClosedDay(date, availability.operating_hours)) {
    const dayOfWeek = format(date, 'EEEE')
    return `Room closed on ${dayOfWeek}s`
  }

  // Check if it's beyond advance booking window
  if (isBeyondAdvanceBooking(date, availability.advance_booking_days)) {
    return `Bookings only allowed up to ${availability.advance_booking_days} days in advance`
  }

  // Check if it's in a blackout period
  const blackout = blackouts.find(blackout => {
    const blackoutStart = startOfDay(new Date(blackout.start_time))
    const blackoutEnd = startOfDay(new Date(blackout.end_time))
    const selectedDay = startOfDay(date)
    
    return (
      (isAfter(selectedDay, blackoutStart) || selectedDay.getTime() === blackoutStart.getTime()) &&
      (isBefore(selectedDay, blackoutEnd) || selectedDay.getTime() === blackoutEnd.getTime())
    )
  })

  if (blackout) {
    return blackout.reason || "Room unavailable due to maintenance"
  }

  return ""
}

/**
 * Check if a date should be disabled based on all availability restrictions
 */
export function isDateUnavailable(
  date: Date,
  availability: RoomAvailability | null,
  blackouts: RoomBlackout[]
): boolean {
  if (!availability) {
    return false // Allow booking if no availability settings
  }

  return (
    isClosedDay(date, availability.operating_hours) ||
    isBeyondAdvanceBooking(date, availability.advance_booking_days) ||
    isInBlackoutPeriod(date, blackouts)
  )
}

/**
 * Get the restriction type for styling purposes
 */
export function getRestrictionType(
  date: Date,
  availability: RoomAvailability | null,
  blackouts: RoomBlackout[]
): 'closed' | 'blackout' | 'beyond-window' | 'none' {
  if (!availability) {
    return 'none'
  }

  if (isClosedDay(date, availability.operating_hours)) {
    return 'closed'
  }

  if (isInBlackoutPeriod(date, blackouts)) {
    return 'blackout'
  }

  if (isBeyondAdvanceBooking(date, availability.advance_booking_days)) {
    return 'beyond-window'
  }

  return 'none'
}

/**
 * Fetch room availability and blackouts for calendar display
 */
export async function fetchRoomRestrictions(
  roomId: string
): Promise<{
  availability: RoomAvailability | null
  blackouts: RoomBlackout[]
}> {
  try {
    // Import room availability functions
    const { getRoomAvailability, getRoomBlackouts } = await import('./room-availability')
    
    // Fetch both availability and blackouts in parallel
    const [availability, blackouts] = await Promise.all([
      getRoomAvailability(roomId),
      getRoomBlackouts(roomId)
    ])

    return {
      availability,
      blackouts: blackouts || []
    }
  } catch (error) {
    console.error('Error fetching room restrictions:', error)
    return {
      availability: null,
      blackouts: []
    }
  }
}

/**
 * Get calendar data for a specific month/year
 * This is used by the calendar API endpoint
 */
export async function getCalendarRestrictions(
  roomId: string,
  month: number,
  year: number
): Promise<{
  operatingHours: OperatingHours | null
  advanceBookingDays: number
  sameDayBookingEnabled: boolean
  closedDates: string[]
  blackoutDates: Array<{ date: string; reason: string }>
}> {
  try {
    const { availability, blackouts } = await fetchRoomRestrictions(roomId)
    
    if (!availability) {
      return {
        operatingHours: null,
        advanceBookingDays: 30,
        sameDayBookingEnabled: true,
        closedDates: [],
        blackoutDates: []
      }
    }

    // Generate closed dates for the month
    const closedDates: string[] = []
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (isClosedDay(date, availability.operating_hours)) {
        closedDates.push(format(date, 'yyyy-MM-dd'))
      }
    }

    // Generate blackout dates for the month
    const blackoutDates: Array<{ date: string; reason: string }> = []
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      if (isInBlackoutPeriod(date, blackouts)) {
        const blackout = blackouts.find(b => {
          const blackoutStart = startOfDay(new Date(b.start_time))
          const blackoutEnd = startOfDay(new Date(b.end_time))
          const selectedDay = startOfDay(date)
          
          return (
            (isAfter(selectedDay, blackoutStart) || selectedDay.getTime() === blackoutStart.getTime()) &&
            (isBefore(selectedDay, blackoutEnd) || selectedDay.getTime() === blackoutEnd.getTime())
          )
        })
        
        if (blackout) {
          blackoutDates.push({
            date: format(date, 'yyyy-MM-dd'),
            reason: blackout.reason || 'Maintenance'
          })
        }
      }
    }

    return {
      operatingHours: availability.operating_hours,
      advanceBookingDays: availability.advance_booking_days,
      sameDayBookingEnabled: availability.same_day_booking_enabled,
      closedDates,
      blackoutDates
    }
  } catch (error) {
    console.error('Error getting calendar restrictions:', error)
    return {
      operatingHours: null,
      advanceBookingDays: 30,
      sameDayBookingEnabled: true,
      closedDates: [],
      blackoutDates: []
    }
  }
}

