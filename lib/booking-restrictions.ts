/**
 * Booking restriction utilities for Conference Hub
 * Handles same-day booking restrictions and validation
 */

/**
 * Check if a given date is the same as today
 */
export function isSameDay(date: Date): boolean {
  const today = new Date()
  const compareDate = new Date(date)
  
  return (
    today.getFullYear() === compareDate.getFullYear() &&
    today.getMonth() === compareDate.getMonth() &&
    today.getDate() === compareDate.getDate()
  )
}

/**
 * Check if a given date is in the past
 */
export function isPastDate(date: Date): boolean {
  const today = new Date()
  const compareDate = new Date(date)
  
  // Set time to start of day for accurate comparison
  today.setHours(0, 0, 0, 0)
  compareDate.setHours(0, 0, 0, 0)
  
  return compareDate < today
}

/**
 * Get the minimum date allowed for booking (tomorrow)
 */
export function getMinimumBookingDate(): Date {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(0, 0, 0, 0)
  return tomorrow
}

/**
 * Check if a date is valid for booking (not same day, not in past)
 */
export function isValidBookingDate(date: Date): boolean {
  return !isSameDay(date) && !isPastDate(date)
}

/**
 * Get formatted date string for display
 */
export function getFormattedDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

/**
 * Check if a date should be disabled in the calendar
 */
export function shouldDisableDate(date: Date): boolean {
  return isSameDay(date) || isPastDate(date)
}

/**
 * Get the next available booking date (tomorrow if today is not allowed)
 */
export function getNextAvailableDate(): Date {
  return getMinimumBookingDate()
}

/**
 * Get user-friendly message for date restrictions
 */
export function getDateRestrictionMessage(date: Date): string {
  if (isPastDate(date)) {
    return "Past dates are not available for booking"
  }
  
  if (isSameDay(date)) {
    return "Same-day booking requires facility manager approval"
  }
  
  return ""
}

/**
 * Validate booking date and return error message if invalid
 */
export function validateBookingDate(date: Date | null): string | null {
  if (!date) {
    return "Please select a booking date"
  }
  
  if (isPastDate(date)) {
    return "Cannot book dates in the past"
  }
  
  if (isSameDay(date)) {
    return "Same-day bookings require facility manager approval. Please select tomorrow or later."
  }
  
  return null
}

/**
 * Check if a date should be disabled based on all restrictions including room availability
 */
export function shouldDisableDateWithAvailability(
  date: Date,
  availability: any | null,
  blackouts: any[] = []
): { disabled: boolean; reason: string } {
  // First check basic restrictions
  if (isPastDate(date)) {
    return { disabled: true, reason: "Past dates are not available for booking" }
  }
  
  if (isSameDay(date)) {
    return { disabled: true, reason: "Same-day booking requires facility manager approval" }
  }
  
  // Then check room availability restrictions
  if (availability) {
    // Import calendar availability functions
    const { isDateUnavailable, getUnavailableReason } = require('./calendar-availability')
    
    if (isDateUnavailable(date, availability, blackouts)) {
      return { 
        disabled: true, 
        reason: getUnavailableReason(date, availability, blackouts) 
      }
    }
  }
  
  return { disabled: false, reason: "" }
}
