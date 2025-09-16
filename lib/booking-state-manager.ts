/**
 * Booking State Manager
 * Handles saving and restoring booking modal state across page redirects
 * Used for the redirect-based payment flow
 */

import { format } from "date-fns"

export interface BookingFormValues {
  title: string
  description: string
}

export interface BookingDateTime {
  id: string
  date: Date
  startTime: string
  endTime: string
}

export interface BookingModalState {
  // Form data
  formValues: BookingFormValues
  
  // Selected bookings
  selectedBookings: BookingDateTime[]
  
  // Room information
  room: {
    id: string
    name: string
    hourly_rate: number
    capacity: number
    location: string
    description?: string
  }
  
  // Modal state
  step: number
  currentSelectedDate: Date | null
  currentStartTime: string
  currentEndTime: string
  
  // User information
  userId: string
  userEmail: string
  
  // Metadata
  savedAt: string
  paymentReference?: string
}

const STORAGE_KEY = 'conference_hub_booking_state'
const STORAGE_EXPIRY_HOURS = 2 // State expires after 2 hours

/**
 * Save booking modal state to browser storage
 */
export function saveBookingState(state: Omit<BookingModalState, 'savedAt'>): string {
  try {
    const stateWithTimestamp: BookingModalState = {
      ...state,
      savedAt: new Date().toISOString()
    }
    
    // Convert dates to ISO strings for storage
    const serializedState = {
      ...stateWithTimestamp,
      selectedBookings: stateWithTimestamp.selectedBookings.map(booking => ({
        id: booking.id,
        date: booking.date.toISOString(),
        startTime: booking.startTime,
        endTime: booking.endTime
      })),
      currentSelectedDate: stateWithTimestamp.currentSelectedDate?.toISOString() || null
    }
    
    const stateId = `booking_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const storageData = {
      [stateId]: serializedState
    }
    
    // Save to both localStorage and sessionStorage for redundancy
    localStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(storageData))
    
    console.log("💾 Booking state saved:", stateId)
    return stateId
    
  } catch (error) {
    console.error("❌ Failed to save booking state:", error)
    throw new Error("Failed to save booking state")
  }
}

/**
 * Restore booking modal state from browser storage
 */
export function restoreBookingState(stateId?: string): BookingModalState | null {
  try {
    // Try localStorage first, then sessionStorage
    let storageData = localStorage.getItem(STORAGE_KEY)
    if (!storageData) {
      storageData = sessionStorage.getItem(STORAGE_KEY)
    }
    
    if (!storageData) {
      console.log("📭 No booking state found in storage")
      return null
    }
    
    const parsedData = JSON.parse(storageData)
    
    // If stateId is provided, get specific state
    let serializedState
    if (stateId && parsedData[stateId]) {
      serializedState = parsedData[stateId]
    } else {
      // Get the most recent state
      const stateIds = Object.keys(parsedData)
      if (stateIds.length === 0) {
        return null
      }
      
      // Sort by timestamp and get the most recent
      const mostRecentId = stateIds.sort((a, b) => {
        const timeA = parseInt(a.split('_')[1])
        const timeB = parseInt(b.split('_')[1])
        return timeB - timeA
      })[0]
      
      serializedState = parsedData[mostRecentId]
    }
    
    if (!serializedState) {
      console.log("📭 No valid booking state found")
      return null
    }
    
    // Check if state has expired
    const savedAt = new Date(serializedState.savedAt)
    const expiryTime = new Date(savedAt.getTime() + STORAGE_EXPIRY_HOURS * 60 * 60 * 1000)
    
    if (new Date() > expiryTime) {
      console.log("⏰ Booking state has expired")
      clearBookingState()
      return null
    }
    
    // Convert ISO strings back to dates
    const restoredState: BookingModalState = {
      ...serializedState,
      selectedBookings: serializedState.selectedBookings.map((booking: any) => ({
        id: booking.id,
        date: new Date(booking.date),
        startTime: booking.startTime,
        endTime: booking.endTime
      })),
      currentSelectedDate: serializedState.currentSelectedDate
        ? new Date(serializedState.currentSelectedDate)
        : null
    }
    
    console.log("📂 Booking state restored:", restoredState)
    return restoredState
    
  } catch (error) {
    console.error("❌ Failed to restore booking state:", error)
    return null
  }
}

/**
 * Clear booking state from storage
 */
export function clearBookingState(stateId?: string): void {
  try {
    if (stateId) {
      // Clear specific state
      const localData = localStorage.getItem(STORAGE_KEY)
      const sessionData = sessionStorage.getItem(STORAGE_KEY)
      
      if (localData) {
        const parsedLocal = JSON.parse(localData)
        delete parsedLocal[stateId]
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsedLocal))
      }
      
      if (sessionData) {
        const parsedSession = JSON.parse(sessionData)
        delete parsedSession[stateId]
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(parsedSession))
      }
    } else {
      // Clear all booking states
      localStorage.removeItem(STORAGE_KEY)
      sessionStorage.removeItem(STORAGE_KEY)
    }
    
    console.log("🗑️ Booking state cleared")
    
  } catch (error) {
    console.error("❌ Failed to clear booking state:", error)
  }
}

/**
 * Check if there's a pending booking state that should be restored
 */
export function hasPendingBookingState(): boolean {
  try {
    const state = restoreBookingState()
    return state !== null
  } catch {
    return false
  }
}

/**
 * Get a summary of the saved booking for display purposes
 */
export function getBookingStateSummary(state: BookingModalState): string {
  const booking = state.selectedBookings[0]
  if (!booking) return "No booking details"
  
  const dateStr = format(booking.date, 'MMM d, yyyy')
  const timeStr = `${booking.startTime} - ${booking.endTime}`
  
  return `${state.formValues.title} • ${state.room.name} • ${dateStr} ${timeStr}`
}
