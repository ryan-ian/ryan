import { NextRequest, NextResponse } from 'next/server'
import { getRoomAvailability, getRoomBlackouts } from '@/lib/room-availability'
import { supabase } from '@/lib/supabase'
import { format, parse, addMinutes, startOfDay, isSameDay, isAfter, isBefore, addDays } from 'date-fns'

interface TimeSlot {
  time: string
  available: boolean
  reason?: string
}

interface SlotCalculationResult {
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

/**
 * GET /api/rooms/[id]/availability/slots?date=YYYY-MM-DD
 * Returns available time slots for a specific room and date
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { searchParams } = new URL(request.url)
    const dateParam = searchParams.get('date')
    const { id: roomId } = await params

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date parameter is required (format: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    if (!roomId) {
      return NextResponse.json(
        { error: 'Room ID is required' },
        { status: 400 }
      )
    }

    // Parse and validate date
    let selectedDate: Date
    try {
      selectedDate = parse(dateParam, 'yyyy-MM-dd', new Date())
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      )
    }

    const result = await calculateAvailableSlots(roomId, selectedDate)
    
    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in slots endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate available time slots for a room on a specific date
 */
async function calculateAvailableSlots(roomId: string, selectedDate: Date): Promise<SlotCalculationResult> {
  try {
    // Get room availability settings
    const availability = await getRoomAvailability(roomId)
    
    if (!availability) {
      return {
        date: format(selectedDate, 'yyyy-MM-dd'),
        operatingHours: null,
        restrictions: {
          minDuration: 30,
          maxDuration: 480,
          bufferTime: 0,
          advanceBookingDays: 30,
          sameDayBookingEnabled: true
        },
        startOptions: [],
        endOptionsByStart: {},
        unavailableReasons: {},
        error: 'No availability settings found for this room'
      }
    }

    // Get day of week for operating hours
    const dayOfWeek = format(selectedDate, 'EEEE').toLowerCase() as keyof typeof availability.operating_hours
    const dayHours = availability.operating_hours[dayOfWeek]

    // Check if room is closed on this day
    if (!dayHours.enabled) {
      return {
        date: format(selectedDate, 'yyyy-MM-dd'),
        operatingHours: { enabled: false, start: dayHours.start, end: dayHours.end },
        restrictions: {
          minDuration: availability.min_booking_duration,
          maxDuration: availability.max_booking_duration,
          bufferTime: availability.buffer_time,
          advanceBookingDays: availability.advance_booking_days,
          sameDayBookingEnabled: availability.same_day_booking_enabled
        },
        startOptions: [],
        endOptionsByStart: {},
        unavailableReasons: {},
        error: `Room is closed on ${dayOfWeek}s`
      }
    }

    // Check date-level restrictions
    const today = startOfDay(new Date())
    const selectedDay = startOfDay(selectedDate)
    
    // Check if same-day booking is disabled and this is today
    if (!availability.same_day_booking_enabled && isSameDay(selectedDate, today)) {
      return {
        date: format(selectedDate, 'yyyy-MM-dd'),
        operatingHours: { enabled: true, start: dayHours.start, end: dayHours.end },
        restrictions: {
          minDuration: availability.min_booking_duration,
          maxDuration: availability.max_booking_duration,
          bufferTime: availability.buffer_time,
          advanceBookingDays: availability.advance_booking_days,
          sameDayBookingEnabled: availability.same_day_booking_enabled
        },
        startOptions: [],
        endOptionsByStart: {},
        unavailableReasons: {},
        error: 'Same-day booking is not enabled for this room'
      }
    }

    // Check if date is beyond advance booking window
    const maxAdvanceDate = addDays(today, availability.advance_booking_days)
    if (isAfter(selectedDay, maxAdvanceDate)) {
      return {
        date: format(selectedDate, 'yyyy-MM-dd'),
        operatingHours: { enabled: true, start: dayHours.start, end: dayHours.end },
        restrictions: {
          minDuration: availability.min_booking_duration,
          maxDuration: availability.max_booking_duration,
          bufferTime: availability.buffer_time,
          advanceBookingDays: availability.advance_booking_days,
          sameDayBookingEnabled: availability.same_day_booking_enabled
        },
        startOptions: [],
        endOptionsByStart: {},
        unavailableReasons: {},
        error: `Bookings can only be made up to ${availability.advance_booking_days} days in advance`
      }
    }

    // Generate baseline time slots within operating hours
    const timeSlots = generateTimeSlots(dayHours.start, dayHours.end)

    // Get conflicts for this date
    const conflicts = await getConflictsForDate(roomId, selectedDate)

    // Calculate availability for each slot
    const slotAvailability = calculateSlotAvailability(timeSlots, conflicts, availability.buffer_time)

    // Generate start options and end options by start
    const { startOptions, endOptionsByStart, unavailableReasons } = generateBookingOptions(
      slotAvailability,
      availability.min_booking_duration,
      availability.max_booking_duration
    )

    return {
      date: format(selectedDate, 'yyyy-MM-dd'),
      operatingHours: { enabled: true, start: dayHours.start, end: dayHours.end },
      restrictions: {
        minDuration: availability.min_booking_duration,
        maxDuration: availability.max_booking_duration,
        bufferTime: availability.buffer_time,
        advanceBookingDays: availability.advance_booking_days,
        sameDayBookingEnabled: availability.same_day_booking_enabled
      },
      startOptions,
      endOptionsByStart,
      unavailableReasons
    }
  } catch (error) {
    console.error('Error calculating available slots:', error)
    throw error
  }
}

/**
 * Generate 30-minute time slots between start and end times
 */
function generateTimeSlots(startTime: string, endTime: string): string[] {
  const slots: string[] = []
  const start = parse(startTime, 'HH:mm', new Date())
  const end = parse(endTime, 'HH:mm', new Date())
  
  let current = start
  while (isBefore(current, end)) {
    slots.push(format(current, 'HH:mm'))
    current = addMinutes(current, 30)
  }
  
  return slots
}

/**
 * Get all conflicts (bookings and blackouts) for a specific date
 */
async function getConflictsForDate(roomId: string, date: Date) {
  const dateStr = format(date, 'yyyy-MM-dd')
  const startOfDateStr = `${dateStr}T00:00:00.000Z`
  const endOfDateStr = `${dateStr}T23:59:59.999Z`

  // Get existing bookings (confirmed and pending)
  const { data: bookings, error: bookingsError } = await supabase
    .from('bookings')
    .select('start_time, end_time, status')
    .eq('room_id', roomId)
    .gte('start_time', startOfDateStr)
    .lte('start_time', endOfDateStr)
    .in('status', ['confirmed', 'pending'])

  if (bookingsError) {
    console.error('Error fetching bookings:', bookingsError)
    throw bookingsError
  }

  // Get room blackouts for this date
  const blackouts = await getRoomBlackouts(roomId)
  const dateBlackouts = blackouts.filter(blackout => {
    const blackoutDate = new Date(blackout.start_time)
    return isSameDay(blackoutDate, date)
  })

  // Convert to conflict intervals
  const conflicts: Array<{ start: string; end: string; type: 'booking' | 'blackout' }> = []

  // Add booking conflicts
  if (bookings) {
    bookings.forEach(booking => {
      conflicts.push({
        start: format(new Date(booking.start_time), 'HH:mm'),
        end: format(new Date(booking.end_time), 'HH:mm'),
        type: 'booking'
      })
    })
  }

  // Add blackout conflicts
  dateBlackouts.forEach(blackout => {
    conflicts.push({
      start: format(new Date(blackout.start_time), 'HH:mm'),
      end: format(new Date(blackout.end_time), 'HH:mm'),
      type: 'blackout'
    })
  })

  return conflicts
}

/**
 * Calculate availability for each time slot considering conflicts and buffer time
 */
function calculateSlotAvailability(
  timeSlots: string[],
  conflicts: Array<{ start: string; end: string; type: 'booking' | 'blackout' }>,
  bufferTime: number
): Record<string, { available: boolean; reason?: string }> {
  const slotAvailability: Record<string, { available: boolean; reason?: string }> = {}

  timeSlots.forEach(slot => {
    let available = true
    let reason: string | undefined

    const slotTime = parse(slot, 'HH:mm', new Date())

    for (const conflict of conflicts) {
      const conflictStart = parse(conflict.start, 'HH:mm', new Date())
      const conflictEnd = parse(conflict.end, 'HH:mm', new Date())
      
      // Add buffer time before and after conflict
      const bufferedStart = addMinutes(conflictStart, -bufferTime)
      const bufferedEnd = addMinutes(conflictEnd, bufferTime)

      // Check if slot falls within the buffered conflict period
      if (!isBefore(slotTime, bufferedStart) && isBefore(slotTime, bufferedEnd)) {
        available = false
        if (!isBefore(slotTime, conflictStart) && isBefore(slotTime, conflictEnd)) {
          reason = conflict.type === 'booking' ? 'conflict:existing_booking' : 'conflict:blackout'
        } else {
          reason = 'conflict:buffer'
        }
        break
      }
    }

    slotAvailability[slot] = { available, reason }
  })

  return slotAvailability
}

/**
 * Generate valid start options and end options for each start time
 */
function generateBookingOptions(
  slotAvailability: Record<string, { available: boolean; reason?: string }>,
  minDuration: number,
  maxDuration: number
) {
  const startOptions: string[] = []
  const endOptionsByStart: Record<string, string[]> = {}
  const unavailableReasons: Record<string, string | null> = {}

  Object.entries(slotAvailability).forEach(([slot, { available, reason }]) => {
    if (available) {
      startOptions.push(slot)
      endOptionsByStart[slot] = []
      
      // Calculate valid end times for this start time
      const startTime = parse(slot, 'HH:mm', new Date())
      
      Object.entries(slotAvailability).forEach(([endSlot, endSlotInfo]) => {
        const endTime = parse(endSlot, 'HH:mm', new Date())
        const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60)
        
        // Check if this is a valid end time
        if (
          isAfter(endTime, startTime) && // End must be after start
          durationMinutes >= minDuration && // Must meet minimum duration
          durationMinutes <= maxDuration && // Must not exceed maximum duration
          endSlotInfo.available // End slot must be available
        ) {
          // Check if all slots between start and end are available
          let allSlotsAvailable = true
          const slotsInRange = Object.keys(slotAvailability).filter(s => {
            const sTime = parse(s, 'HH:mm', new Date())
            return !isBefore(sTime, startTime) && isBefore(sTime, endTime)
          })
          
          for (const rangeSlot of slotsInRange) {
            if (!slotAvailability[rangeSlot].available) {
              allSlotsAvailable = false
              break
            }
          }
          
          if (allSlotsAvailable) {
            endOptionsByStart[slot].push(endSlot)
          }
        }
      })
    } else {
      unavailableReasons[slot] = reason || null
    }
  })

  return { startOptions, endOptionsByStart, unavailableReasons }
}
