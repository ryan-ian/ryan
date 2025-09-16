/**
 * Session Storage Management for Conference Hub Booking Flow
 * Handles storing and retrieving room data for seamless booking experience
 */

import type { Room } from "@/types"

// Storage configuration
const STORAGE_KEY = 'conference_hub_selected_room'
const SESSION_DURATION = 30 * 60 * 1000 // 30 minutes in milliseconds

// Stored data structure
interface StoredRoomData {
  room: Room
  timestamp: number
  source: 'room_card' | 'direct_link' | 'restored'
}

/**
 * Store room data in session storage
 */
export function storeRoomData(room: Room, source: 'room_card' | 'direct_link' | 'restored' = 'room_card'): boolean {
  try {
    const data: StoredRoomData = {
      room,
      timestamp: Date.now(),
      source
    }
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch (error) {
    console.warn('Failed to store room data in session storage:', error)
    return false
  }
}

/**
 * Retrieve room data from session storage
 */
export function retrieveRoomData(): Room | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data: StoredRoomData = JSON.parse(stored)
    
    // Check if data is expired
    if (isDataExpired(data.timestamp)) {
      clearRoomData()
      return null
    }
    
    // Validate room data structure
    if (!isValidRoomData(data.room)) {
      clearRoomData()
      return null
    }
    
    return data.room
  } catch (error) {
    console.warn('Failed to retrieve room data from session storage:', error)
    clearRoomData()
    return null
  }
}

/**
 * Get stored room data with metadata
 */
export function getStoredRoomData(): StoredRoomData | null {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (!stored) return null
    
    const data: StoredRoomData = JSON.parse(stored)
    
    // Check if data is expired
    if (isDataExpired(data.timestamp)) {
      clearRoomData()
      return null
    }
    
    return data
  } catch (error) {
    console.warn('Failed to get stored room data:', error)
    clearRoomData()
    return null
  }
}

/**
 * Clear room data from session storage
 */
export function clearRoomData(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.warn('Failed to clear room data from session storage:', error)
  }
}

/**
 * Check if room data matches the given room ID
 */
export function doesStoredRoomMatch(roomId: string): boolean {
  const storedRoom = retrieveRoomData()
  return storedRoom?.id === roomId
}

/**
 * Check if stored data is expired
 */
function isDataExpired(timestamp: number): boolean {
  return Date.now() - timestamp > SESSION_DURATION
}

/**
 * Validate room data structure
 */
function isValidRoomData(room: any): room is Room {
  return (
    room &&
    typeof room === 'object' &&
    typeof room.id === 'string' &&
    typeof room.name === 'string' &&
    typeof room.location === 'string' &&
    typeof room.capacity === 'number' &&
    typeof room.status === 'string' &&
    ['available', 'maintenance', 'reserved'].includes(room.status)
  )
}

/**
 * Get time remaining until data expires
 */
export function getTimeUntilExpiry(): number {
  const data = getStoredRoomData()
  if (!data) return 0
  
  const expiryTime = data.timestamp + SESSION_DURATION
  const remaining = expiryTime - Date.now()
  
  return Math.max(0, remaining)
}

/**
 * Check if session storage is available
 */
export function isSessionStorageAvailable(): boolean {
  try {
    const test = '__session_storage_test__'
    sessionStorage.setItem(test, 'test')
    sessionStorage.removeItem(test)
    return true
  } catch {
    return false
  }
}

/**
 * Get storage info for debugging
 */
export function getStorageInfo(): {
  isAvailable: boolean
  hasData: boolean
  isExpired: boolean
  timeRemaining: number
  source?: string
} {
  const isAvailable = isSessionStorageAvailable()
  if (!isAvailable) {
    return { isAvailable: false, hasData: false, isExpired: true, timeRemaining: 0 }
  }
  
  const data = getStoredRoomData()
  const hasData = data !== null
  const isExpired = hasData ? isDataExpired(data.timestamp) : true
  const timeRemaining = getTimeUntilExpiry()
  
  return {
    isAvailable,
    hasData,
    isExpired,
    timeRemaining,
    source: data?.source
  }
}
